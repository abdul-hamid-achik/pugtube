import httpx
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management.base import BaseCommand, CommandError
from video.models import OriginalVideo
from video.pexels.api import get_popular_videos


class Command(BaseCommand):
    help = "Downloads popular videos from Pexels"

    def add_arguments(self, parser):
        parser.add_argument("--quantity", type=int, default=40)
        parser.add_argument("--min_duration", type=int, default=60)
        parser.add_argument("--max_duration", type=int, default=120)

    def handle(self, *args, **options):
        popular_videos = get_popular_videos(
            options["quantity"] if "quantity" in options else 40,
            options["min_duration"] if "min_duration" in options else 60,
            options["max_duration"] if "max_duration" in options else 120,
        )

        if not popular_videos:
            self.stderr.write(self.style.ERROR("There was an error loading the videos"))
            return

        for video in popular_videos["videos"]:
            self.stdout.write(f"Processing video {video['id']}")

            with httpx.Client(follow_redirects=True) as client:
                try:
                    video_file = video["video_files"][0]
                    self.stdout.write(f"Downloading video link {video_file['link']}")
                    response = client.get(video_file["link"])
                    response.raise_for_status()
                    original_video = OriginalVideo.objects.create(
                        title=video["url"],
                        file=SimpleUploadedFile(
                            f"video-{video['id']}.mp4",
                            response.content,
                            content_type=video_file["file_type"],
                        ),
                        original=video["url"],
                        quality=video_file["quality"],
                        file_type=video_file["file_type"],
                        duration=video["duration"],
                        width=video["width"],
                        height=video["height"],
                        fps=video_file["fps"],
                    )
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"processed successfully: video_id: {video['id']} - original_video_id: {original_video.id}"
                        )
                    )
                except httpx.HTTPError as exc:
                    self.stderr.write(
                        self.style.ERROR(
                            f"HTTP Exception for {exc.request.url} - {exc}"
                        )
                    )
