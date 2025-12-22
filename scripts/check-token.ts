import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

async function main() {
  const token = 'cmjf0lmoe0001amepbl01m84b';
  console.log(`Checking token: ${token}`);

  const invite = await prisma.invitation.findUnique({
    where: { token },
    include: { invitedBy: true },
  });

  if (!invite) {
    console.log('Invitation not found');
    return;
  }

  console.log(`Status: ${invite.status}`);
  console.log(`Invited By: ${invite.invitedBy.name} (${invite.invitedBy.email})`);
  console.log(`Invitee Email: ${invite.email}`);
}

main().finally(() => prisma.$disconnect());
