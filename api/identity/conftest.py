import os

import pytest
from django.conf import settings
from django.core.files.uploadedfile import SimpleUploadedFile


@pytest.fixture()
def profile_picture():
    with open(
        os.path.join(settings.BASE_DIR, "fixtures", "images", "profile_picture.png"),
        "rb",
    ) as f:
        return SimpleUploadedFile(
            "profile_picture.png", f.read(), content_type="image/png"
        )
