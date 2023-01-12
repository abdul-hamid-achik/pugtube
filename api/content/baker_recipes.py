import os
from django.conf import settings

from faker import Faker
from model_bakery.recipe import Recipe, foreign_key

from django.core.files import File

from .models import (
    OriginalVideo,
    VideoPoster,
    ProcessedVideo,
    VideoTimelinePreview,
)

fake = Faker()

original_video = Recipe(
    OriginalVideo,
    title=fake.sentence(),
    description=fake.paragraph(),
    file=File(
        open(
            os.path.join(settings.BASE_DIR, "fixtures", "videos", "original.mp4"),
            "rb",
        ),
        name="original.mp4",
    ),
)

processed_video = Recipe(
    ProcessedVideo,
    title=fake.sentence(),
    description=fake.paragraph(),
    original_video=foreign_key(original_video),
    file=File(
        open(
            os.path.join(settings.BASE_DIR, "fixtures", "videos", "processed.mp4"), "rb"
        ),
        name="processed.mp4",
    ),
    quality="hd",
    encoding="h264",
    bitrate=8000,
    audio_codec="aac",
    audio_bitrate=128,
    audio_sample_rate=44100,
    audio_channels=2,
)

video_poster = Recipe(
    VideoPoster,
    video=foreign_key(original_video),
    file=File(
        open(os.path.join(settings.BASE_DIR, "fixtures", "images", "poster.png"), "rb"),
        name="poster.png",
    ),
    width=1920,
    height=1080,
)

video_timeline_preview = Recipe(
    VideoTimelinePreview,
    video=foreign_key(original_video),
    preview_image=File(
        open(
            os.path.join(settings.BASE_DIR, "fixtures", "images", "preview.png"), "rb"
        ),
        name="preview.png",
    ),
    preview_time=10,
)
