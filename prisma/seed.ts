import { prisma } from '@/server/db';
import { hashPassword } from '@/utils/auth';

async function main() {
  await prisma.user.upsert({
    where: {
      email: 'abdulachik@icloud.com'
    },
    update: {},
    create: {
      name: 'Abdul Hamid',
      email: 'abdulachik@icloud.com',
      password: await hashPassword('password'),
    }
  })
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
