
import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

async function main() {
    const email = 'arazak4r@gmail.com';
    const user = await prisma.user.findUnique({
        where: { email },
        include: { memberships: true }
    });

    console.log(`User: ${user?.email}`);
    console.log(`Memberships: ${user?.memberships.length}`);
    if (user?.memberships.length === 0) {
        console.log('User has NO memberships - needs to accept invitation!');
    } else {
        console.log('User IS a member.');
    }
}

main().finally(() => prisma.$disconnect());
