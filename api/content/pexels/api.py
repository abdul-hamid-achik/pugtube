import httpx
import functools
from django.conf import settings
import logging

from django.core.files.uploadedfile import SimpleUploadedFile

from content.models import OriginalVideo

logger = logging.getLogger(__name__)
client = httpx.Client(base_url="https://api.pexels.com/videos/")


def cache_result(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        if not hasattr(wrapper, "result"):
            wrapper.result = func(*args, **kwargs)
        return wrapper.result

    return wrapper


@cache_result
def get_popular_videos(per_page=40, min_duration=60, max_duration=120):
    try:
        response = client.get(
            "popular",
            params={
                "per_page": per_page,
                "min_duration": min_duration,
                "max_duration": max_duration,
            },
            headers={"Authorization": settings.PEXELS_API_KEY},
        )

        response.raise_for_status()
        return response.json()
    except httpx.HTTPError as exc:
        logger.warning(f"HTTP Exception for {exc.request.url} - {exc}")
    finally:
        client.close()


def save_as_original_video(video):
    with httpx.Client(follow_redirects=True) as client:
        try:
            video_file = video["video_files"][0]
            logger.info("Downloading video link %s", video_file["link"])
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
            logger.info(
                "processed successfully: video_id: %s - original_video_id: %s",
                video["id"],
                original_video.id,
            )
            return original_video
        except httpx.HTTPError as exc:
            logger.error("HTTP Exception for %s - %s", exc.request.url, exc)
