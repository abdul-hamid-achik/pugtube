import os

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile

from pugtube import settings


@pytest.fixture()
def video_file():
    with open(
        os.path.join(settings.BASE_DIR, "fixtures", "videos", "original.mp4"), "rb"
    ) as f:
        return SimpleUploadedFile("original.mp4", f.read(), content_type="video/mp4")


@pytest.fixture()
def processed_video_file():
    with open(
        os.path.join(settings.BASE_DIR, "fixtures", "videos", "processed.mp4"), "rb"
    ) as f:
        return SimpleUploadedFile("processed.mp4", f.read(), content_type="video/mp4")


@pytest.fixture()
def poster_file():
    with open(
        os.path.join(settings.BASE_DIR, "fixtures", "images", "poster.png"), "rb"
    ) as f:
        return SimpleUploadedFile("poster.png", f.read(), content_type="image/png")


@pytest.fixture()
def preview_file():
    with open(
        os.path.join(settings.BASE_DIR, "fixtures", "images", "preview.png"), "rb"
    ) as f:
        return SimpleUploadedFile("preview.png", f.read(), content_type="image/png")
