import { prisma } from "@/server/db";
import * as jobs from "@/server/jobs";

async function main() {
  const videos = await prisma.video.findMany({
    include: {
      upload: {
        include: {
          metadata: true,
        },
      },
    },
  });
  for (let i = 0; i < videos.length; i++) {
    const video = videos[i]!;
    const uploadId = video.uploadId;
    const fileName = video.upload?.metadata?.fileName!;

    await jobs.extractThumbnails({ uploadId, fileName });
    await jobs.analyzeVideo({ uploadId, fileName });
    await jobs.transcodeVideo({ uploadId, fileName });
    await jobs.generateThumbnail({ uploadId, fileName });
    await jobs.generatePreview({ uploadId, fileName });
  }
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

export {};
