import { prisma } from "@/server/db";
import log from "@/utils/logger";

async function main() {}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit();
  })
  .catch(async (e) => {
    log.error("Error seeding: ", e);
    await prisma.$disconnect();
    process.exit(1);
  });

export {};
