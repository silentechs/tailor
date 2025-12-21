import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

// const prisma = new PrismaClient(); // Removed local instantiation logic as we use imported instance

async function main() {
    console.log('--- Checking Adwoa Tailor Data ---');

    // 1. Find User
    const user = await prisma.user.findFirst({
        where: { email: 'tailor@stitchcraft.gh' },
        include: {
            memberships: { include: { organization: true } },
            ownedOrganizations: true
        }
    });

    if (!user) {
        console.error('User tailor@stitchcraft.gh not found');
        return;
    }

    console.log(`User Found: ${user.name} (${user.id})`);
    console.log(`Memberships: ${user.memberships.length}`);
    console.log(`Owned Orgs: ${user.ownedOrganizations.length}`);

    // Determine Org ID as the frontend does
    const organization = user.memberships[0]?.organization || user.ownedOrganizations[0];

    if (!organization) {
        console.error('No organization found for user');
        return;
    }

    const orgId = organization.id;
    console.log(`Target Organization: ${organization.name} (${orgId})`);

    // 2. Fetch Members
    const members = await prisma.organizationMember.findMany({
        where: { organizationId: orgId },
        include: { user: true }
    });
    console.log(`\nMembers Count: ${members.length}`);
    members.forEach(m => console.log(` - ${m.user.name} (${m.role})`));

    // 3. Fetch Invitations
    const invitations = await prisma.invitation.findMany({
        where: { organizationId: orgId }
    });
    console.log(`\nInvitations Count: ${invitations.length}`);
    invitations.forEach(i => console.log(` - To: ${i.email}, Status: ${i.status}, Token: ${i.token}`));

}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
