import json

import pytest
from model_bakery import baker
from rest_framework import status
from rest_framework.reverse import reverse

pytest_mark = pytest.mark.django_db


def test_upload_create(get_authenticated_client, user, video_file):
    api_client = get_authenticated_client(user)
    response = api_client.post(
        reverse("video:upload-list"),
        {
            "title": "test",
            "description": "test",
            "tags": ["test"],
            "file": video_file,
        },
    )
    assert response.status_code == status.HTTP_201_CREATED, response.data


def test_upload_list(get_authenticated_client, user):
    baker.make_recipe("video.upload")
    api_client = get_authenticated_client(user)
    response = api_client.get(reverse("video:upload-list"))
    assert response.status_code == status.HTTP_200_OK, response.data
    assert len(response.data) == 1
