import { prisma } from "@/server/db";
import queue from "@/server/queue";
import { log } from "@/utils/logger";

async function main() {
  log.info("start backfill, adding jobs to queue");
  const videos = await prisma.video.findMany({
    include: {
      upload: {
        include: {
          metadata: true,
        },
      },
    },
  });

  const medatada = await prisma.videoMetadata.findMany({
    where: {
      uploadId: {
        in: videos.map((v) => v.uploadId),
      },
    },
  });

  log.debug(`found videos ${videos.length}`);
  log.debug(`found metadata ${medatada.length}`);

  for (let i = 0; i < medatada.length; i++) {
    const metadata = medatada[i]!;
    const uploadId = metadata.uploadId;
    const fileName = metadata.fileName;
    await queue.add("backfill", {
      uploadId,
      fileName,
    });
  }

  log.info("backfill queued");
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

export {};
