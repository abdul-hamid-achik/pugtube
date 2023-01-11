import os
import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from model_bakery import baker
from rest_framework_simplejwt.tokens import AccessToken

from pugtube import settings
from rest_framework.test import APIClient


@pytest.fixture()
def api_client():
    return APIClient()


@pytest.fixture()
def get_authenticated_client(api_client):
    def _get_authenticated_client(user):
        token = AccessToken.for_user(user=user)
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        return api_client

    return _get_authenticated_client


@pytest.fixture()
def video_file():
    with open(
        os.path.join(settings.BASE_DIR, "fixtures", "videos", "upload.mp4"), "rb"
    ) as f:
        return SimpleUploadedFile("upload.mp4", f.read(), content_type="video/mp4")


@pytest.fixture()
def user():
    return baker.make("auth.User")
