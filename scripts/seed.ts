import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import { Pool } from 'pg';

// Determine database URL - prioritized from process.env
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined');
}

// Setup Prisma with PG Adapter
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // 1. Create a Tailor (User)
  const password = await hash('password123', 12);

  const tailor = await prisma.user.upsert({
    where: { email: 'tailor@stitchcraft.gh' },
    update: {},
    create: {
      email: 'tailor@stitchcraft.gh',
      name: 'Kwame Tailor',
      password,
      role: 'TAILOR',
      status: 'ACTIVE',
      businessName: 'StitchCraft Styles',
      phone: '0240000000',
      region: 'GREATER_ACCRA',
    },
  });

  console.log({ tailor });

  // 2. Create Clients
  const clients = [
    {
      name: 'Ama Osei',
      phone: '0244123456',
      email: 'ama.osei@example.com',
      region: 'GREATER_ACCRA',
      measurements: {
        bust: '36',
        waist: '28',
        hips: '40',
        shoulder: '14',
        sleeve: '22',
        length: '58',
      },
    },
    {
      name: 'Kofi Mensah',
      phone: '0541234567',
      email: 'kofi.m@example.com',
      region: 'ASHANTI',
      measurements: {
        chest: '42',
        waist: '34',
        shoulder: '18',
        sleeve: '25',
        length: '30', // Shirt length
      },
    },
  ];

  for (const c of clients) {
    // Check if client exists to avoid unique constraint errors on re-runs
    const existing = await prisma.client.findFirst({
      where: { phone: c.phone, tailorId: tailor.id },
    });

    if (!existing) {
      // Create client and then measurement
      const newClient = await prisma.client.create({
        data: {
          tailorId: tailor.id,
          name: c.name,
          phone: c.phone,
          email: c.email,
          region: c.region as any,
        },
      });

      await prisma.clientMeasurement.create({
        data: {
          clientId: newClient.id,
          values: c.measurements,
          notes: 'Initial measurements (from seed)',
        },
      });
    }
  }

  // 3. Create Orders
  const ama = await prisma.client.findFirst({
    where: { phone: '0244123456' },
    include: { clientMeasurements: true },
  });

  if (ama && (ama as any).clientMeasurements?.length > 0) {
    // Check if order exists
    const existingOrder = await prisma.order.findUnique({ where: { orderNumber: 'SC-2311-XJ9' } });

    if (!existingOrder) {
      await prisma.order.create({
        data: {
          orderNumber: 'SC-2311-XJ9',
          tailorId: tailor.id,
          clientId: ama.id,
          garmentType: 'KABA_AND_SLIT',
          garmentDescription: 'Traditional Kaba and Slit for wedding guest.',
          status: 'IN_PROGRESS',
          laborCost: 300,
          totalAmount: 450,
          paidAmount: 200,
          measurementId: (ama as any).clientMeasurements[0].id,
        },
      });
    }
  }

  console.log('Seeding completed.');
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
