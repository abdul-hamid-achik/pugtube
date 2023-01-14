import os, django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "pugtube.settings")
django.setup()

import httpx
from ffprobe import FFProbe
from prefect import task, get_run_logger

from content.pexels.api import get_popular_videos, save_as_original_video


@task
def load_pexels_popular_videos():
    logger = get_run_logger()
    logger.info("Loading Pexels Popular Videos")
    popular_videos = get_popular_videos()
    original_videos = []
    for video in popular_videos["videos"]:
        logger.info(f"Processing video {video['id']}")

        with httpx.Client(follow_redirects=True) as client:
            try:
                video_file = video["video_files"][0]
                logger.info(f"Downloading video link {video_file['link']}")
                original_video = save_as_original_video(video)
                original_videos.append(original_video)
                logger.info(
                    f"processed successfully: video_id: {video['id']} - original_video_id: {original_video.id}"
                )
            except httpx.HTTPError as exc:
                logger.error(f"HTTP Exception for {exc.request.url} - {exc}")

    return original_videos


@task()
def run_ffprobe(original_video):
    logger = get_run_logger()
    logger.info(f"Running ffprobe on {original_video.id}")
    metadata = FFProbe(original_video.file.path)

    for stream in metadata.streams:
        if stream.is_video():
            print("Stream contains {} frames.".format(stream.frames()))

    return original_video
