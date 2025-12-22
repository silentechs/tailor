import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is not defined');

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Type for models that have updateMany with tailorId and organizationId
type UpdatableModelName =
  | 'client'
  | 'order'
  | 'orderTask'
  | 'appointment'
  | 'measurementTemplate'
  | 'inventoryItem'
  | 'invoice'
  | 'payment'
  | 'orderCollection'
  | 'portfolioItem';

// Helper to update models - using Prisma's $executeRaw for flexibility
async function updateModelRecords(
  modelName: UpdatableModelName,
  tailorId: string,
  organizationId: string
): Promise<number> {
  // Map model names to table names (Prisma uses PascalCase for models, snake_case for tables)
  const tableNameMap: Record<UpdatableModelName, string> = {
    client: 'Client',
    order: 'Order',
    orderTask: 'OrderTask',
    appointment: 'Appointment',
    measurementTemplate: 'MeasurementTemplate',
    inventoryItem: 'InventoryItem',
    invoice: 'Invoice',
    payment: 'Payment',
    orderCollection: 'OrderCollection',
    portfolioItem: 'PortfolioItem',
  };

  const tableName = tableNameMap[modelName];

  const result = await prisma.$executeRaw`
    UPDATE "${Prisma.raw(tableName)}" 
    SET "organizationId" = ${organizationId}
    WHERE "tailorId" = ${tailorId} AND "organizationId" IS NULL
  `;

  return Number(result);
}

async function main() {
  console.log('Starting data migration to Organizations...');

  // 1. Get all Tailors/Seamstresses
  const users = await prisma.user.findMany({
    where: {
      role: { in: ['TAILOR', 'SEAMSTRESS'] },
    },
  });

  console.log(`Found ${users.length} users to migrate.`);

  for (const user of users) {
    console.log(`Migrating user: ${user.name} (${user.email})...`);

    // 2. Create Organization
    // Ensure slug is unique by appending ID if necessary, but start with showcaseUsername or normalized name
    let slug =
      user.showcaseUsername ||
      user.name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
    if (!slug) slug = `org-${user.id.slice(-5)}`;

    const org = await prisma.organization.upsert({
      where: { slug },
      update: {
        ownerId: user.id, // Ensure owner is set correctly
      },
      create: {
        name: user.businessName || `${user.name}'s Atelier`,
        slug: slug,
        address: user.businessAddress,
        region: user.region,
        city: user.city,
        ownerId: user.id,
      },
    });

    // 3. Create OrganizationMember (MANAGER)
    await prisma.organizationMember.upsert({
      where: {
        organizationId_userId: {
          organizationId: org.id,
          userId: user.id,
        },
      },
      update: {
        role: 'MANAGER',
      },
      create: {
        organizationId: org.id,
        userId: user.id,
        role: 'MANAGER',
      },
    });

    // 4. Update operational models
    const organizationId = org.id;

    const modelsToUpdate: UpdatableModelName[] = [
      'client',
      'order',
      'orderTask',
      'appointment',
      'measurementTemplate',
      'inventoryItem',
      'invoice',
      'payment',
      'orderCollection',
      'portfolioItem',
    ];

    for (const model of modelsToUpdate) {
      const count = await updateModelRecords(model, user.id, organizationId);
      if (count > 0) {
        console.log(`  - Updated ${count} ${model} records`);
      }
    }

    console.log(`- Completed migration for ${user.name}`);
  }

  console.log('Migration completed successfully.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
