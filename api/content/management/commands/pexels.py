import httpx
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management.base import BaseCommand, CommandError
from content.models import OriginalVideo
from content.pexels.api import get_popular_videos, save_as_original_video


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
                    original_video = save_as_original_video(video)
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
