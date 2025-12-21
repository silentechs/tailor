
import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

async function main() {
    const email = 'arazak4r@gmail.com';
    console.log(`Checking user: ${email}`);

    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (user) {
        console.log(`User found: ${user.id} (${user.role})`);
    } else {
        console.log('User NOT found - Needs registration');
    }
}

main().finally(() => prisma.$disconnect());
