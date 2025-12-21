import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is not defined');

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('Seeding client test account...');

    const password = await hash('password123', 12);
    const email = 'ama.osei@example.com';

    // 1. Find the existing client record for Ama Osei
    const client = await prisma.client.findFirst({
        where: { email }
    });

    if (!client) {
        console.error('Client "Ama Osei" not found in database. Please run seed.ts first.');
        return;
    }

    // 2. Create the User account with role CLIENT
    const user = await prisma.user.upsert({
        where: { email },
        update: {
            role: 'CLIENT',
            status: 'ACTIVE',
            linkedClientId: client.id
        },
        create: {
            email,
            name: client.name,
            password,
            role: 'CLIENT',
            status: 'ACTIVE',
            linkedClientId: client.id,
            notifyEmail: true,
            notifySms: true,
        }
    });

    console.log('✅ Client Test Account Ready:');
    console.log(`- Email: ${email}`);
    console.log(`- Password: password123`);
    console.log(`- Linked to Client ID: ${client.id}`);
    console.log(`- Tracking Token: TRACK-AMA-123 (if needed for testing autonomous linkage)`);
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
