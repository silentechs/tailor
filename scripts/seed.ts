import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { GarmentType, PrismaClient, Region } from '@prisma/client';
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
  console.log('Starting premium seeding...');

  // 1. Create a Tailors
  const password = await hash('password123', 12);

  // 0. Create Admin User
  const adminEmail = 'silentechs@gmail.com';
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: 'ADMIN',
      status: 'ACTIVE',
    },
    create: {
      email: adminEmail,
      name: 'System Admin',
      password,
      role: 'ADMIN',
      status: 'ACTIVE',
      notifyEmail: true,
      notifySms: true,
      showcaseEnabled: false,
    },
  });
  console.log(`- Upserted admin: ${adminEmail}`);

  const tailorsData: Array<{
    email: string;
    name: string;
    businessName: string;
    showcaseUsername: string;
    phone: string;
    region: Region;
    city: string;
    bio: string;
  }> = [
    {
      email: 'tailor@stitchcraft.gh',
      name: 'Kwame Mensah',
      businessName: 'Mensah Master Styles',
      showcaseUsername: 'mensah-styles',
      phone: '0240000001',
      region: Region.GREATER_ACCRA,
      city: 'Accra',
      bio: 'Master of modern Ghanaian tailoring with over 15 years of experience in bespoke suits and traditionals.',
    },
    {
      email: 'abena@styles.gh',
      name: 'Abena Osei',
      businessName: 'Abena Artisans',
      showcaseUsername: 'abena-styles',
      phone: '0240000002',
      region: Region.ASHANTI,
      city: 'Kumasi',
      bio: 'Specializing in Kente bridal wear and high-fashion Kaba & Slit designs. Heritage meets haute couture.',
    },
    {
      email: 'kofi@couture.gh',
      name: 'Kofi Boateng',
      businessName: 'Boateng Bespoke',
      showcaseUsername: 'boateng-couture',
      phone: '0240000003',
      region: Region.WESTERN,
      city: 'Takoradi',
      bio: 'Elegant Kaftans and Agbada for the modern gentleman. Precision is our signature in every stitch.',
    },
    {
      email: 'ekow@northern.gh',
      name: 'Ekow Arthur',
      businessName: 'Northern Thread',
      showcaseUsername: 'northern-thread',
      phone: '0240000004',
      region: Region.NORTHERN,
      city: 'Tamale',
      bio: 'Authentic Batakari and Smocks. We preserve the northern heritage through fine weaving and tailoring.',
    },
  ];

  for (const t of tailorsData) {
    const user = await prisma.user.upsert({
      where: { email: t.email },
      update: {
        showcaseUsername: t.showcaseUsername,
        showcaseEnabled: true,
        status: 'ACTIVE',
        businessName: t.businessName,
        bio: t.bio,
        region: t.region,
        city: t.city,
      },
      create: {
        email: t.email,
        name: t.name,
        businessName: t.businessName,
        showcaseUsername: t.showcaseUsername,
        phone: t.phone,
        region: t.region,
        city: t.city,
        bio: t.bio,
        password,
        role: 'TAILOR',
        status: 'ACTIVE',
        showcaseEnabled: true,
      },
    });

    console.log(`- Upserted tailor: ${t.businessName}`);

    // Add Portfolio Items for each tailor
    const portfolioData: Array<{
      title: string;
      description: string;
      category: GarmentType;
      images: string[];
    }> = [
      {
        title: `${t.name} Signature ${t.region.replace(/_/g, ' ')} Set`,
        description:
          'A masterpiece created for the Ghana Fashion Awards. Handcrafted with premium textiles.',
        category: GarmentType.KENTE_CLOTH,
        images: [
          'https://pub-df92ddd9823a4d139e53bfaa16c56656.r2.dev/tailors/seed-master/portfolios/kente_couture_premium/1766236569006-kente_couture_premium.png',
        ],
      },
      {
        title: 'Modern Fusion Ensemble',
        description:
          'Blending traditional textiles with urban silhouettes for the contemporary Ghanaian.',
        category: GarmentType.KAFTAN,
        images: [
          'https://pub-df92ddd9823a4d139e53bfaa16c56656.r2.dev/tailors/seed-master/portfolios/modern_ghanaian_kaftan/1766236569356-modern_ghanaian_kaftan.png',
        ],
      },
      {
        title: 'Bespoke Ceremony Gown',
        description: 'Intricate pattern mapping and fine silk lining for a royal finish.',
        category: GarmentType.KABA_AND_SLIT,
        images: [
          'https://pub-df92ddd9823a4d139e53bfaa16c56656.r2.dev/tailors/seed-master/portfolios/kaba_slit_elegant/1766236569570-kaba_slit_elegant.png',
        ],
      },
      {
        title: 'Authentic Northern Batakari',
        description: 'Traditional smock hand-woven with heritage blue and white stripes.',
        category: GarmentType.SMOCK_BATAKARI,
        images: [
          'https://pub-df92ddd9823a4d139e53bfaa16c56656.r2.dev/tailors/seed-master/portfolios/batakari_northern_authentic_smock/1766236569910-batakari_northern_authentic_smock.png',
        ],
      },
    ];

    // Clear existing portfolio items to ensure fresh data/images
    await prisma.portfolioItem.deleteMany({
      where: { tailorId: user.id },
    });

    for (const p of portfolioData) {
      await prisma.portfolioItem.create({
        data: {
          ...p,
          tailorId: user.id,
          isPublic: true,
          viewCount: Math.floor(Math.random() * 500) + 100,
          likeCount: Math.floor(Math.random() * 100) + 10,
        },
      });
    }
  }

  // 2. Create a specific client tracking example
  const kwame = await prisma.user.findUnique({ where: { email: 'tailor@stitchcraft.gh' } });
  if (kwame) {
    const ama = await prisma.client.upsert({
      where: { tailorId_phone: { tailorId: kwame.id, phone: '0244123456' } },
      update: {},
      create: {
        tailorId: kwame.id,
        name: 'Ama Osei',
        phone: '0244123456',
        email: 'ama.osei@example.com',
        region: Region.GREATER_ACCRA,
      },
    });

    // Create a tracking token
    await prisma.clientTrackingToken.upsert({
      where: { token: 'TRACK-AMA-123' },
      update: {},
      create: {
        clientId: ama.id,
        token: 'TRACK-AMA-123',
        isActive: true,
      },
    });

    const order = await prisma.order.upsert({
      where: { orderNumber: 'SC-2512-AMA' },
      update: {},
      create: {
        orderNumber: 'SC-2512-AMA',
        tailorId: kwame.id,
        clientId: ama.id,
        garmentType: GarmentType.KABA_AND_SLIT,
        garmentDescription: 'Wedding guest outfit with silk embroidery.',
        status: 'IN_PROGRESS',
        laborCost: 450,
        totalAmount: 700,
        paidAmount: 350,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    console.log(`- Created tracking order for Ama: ${order.orderNumber}`);
  }

  console.log('Seeding completed successfully.');
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
