import pytest
from model_bakery import baker
from rest_framework import status
from rest_framework.reverse import reverse

from .models import (
    OriginalVideo,
    ProcessedVideo,
    VideoTimelinePreview,
    VideoPoster,
)

pytest_mark = pytest.mark.django_db


# /content/original-video tests
def test_create_original_video(get_authenticated_client, user, video_file):
    client = get_authenticated_client(user)
    url = reverse("content:original-video-list")
    response = client.post(
        url, {"file": video_file, "title": "original.mp4"}, format="multipart"
    )
    assert response.status_code == status.HTTP_201_CREATED, response.data
    assert OriginalVideo.objects.count() == 1


def test_update_original_video(get_authenticated_client, user, video_file):
    client = get_authenticated_client(user)
    original_video = baker.make_recipe("content.original_video")
    url = reverse("content:original-video-detail", args=[original_video.pk])
    response = client.put(
        url,
        {
            "file": video_file,
            "title": "original_updated.mp4",
            "description": "updated description",
        },
        format="multipart",
    )
    assert response.status_code == status.HTTP_200_OK, response.data
    assert OriginalVideo.objects.count() == 1
    updated_video = OriginalVideo.objects.first()
    assert updated_video.title == "original_updated.mp4"
    assert updated_video.description == "updated description"


def test_delete_original_video(get_authenticated_client, user):
    client = get_authenticated_client(user)
    original_video = baker.make_recipe("content.original_video")
    url = reverse("content:original-video-detail", args=[original_video.pk])
    response = client.delete(url)
    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert OriginalVideo.objects.count() == 0


def test_original_video_pagination(get_authenticated_client, user, settings):
    client = get_authenticated_client(user)
    baker.make_recipe("content.original_video", _quantity=20)
    url = reverse("content:original-video-list")
    response = client.get(url, {})
    assert response.status_code == status.HTTP_200_OK, response.data
    assert (
        len(response.data["results"]) == settings.REST_FRAMEWORK["PAGE_SIZE"]
    )  # default page size is 12
    assert "next" in response.data
    assert "previous" in response.data


def test_create_video_poster(get_authenticated_client, user, poster_file):
    client = get_authenticated_client(user)
    original_video = baker.make_recipe("content.original_video")
    url = reverse("content:video-poster-list")
    response = client.post(
        url, {"video": original_video.pk, "file": poster_file}, format="multipart"
    )
    assert response.status_code == status.HTTP_201_CREATED
    assert VideoPoster.objects.count() == 1


def test_create_processed_video(get_authenticated_client, user, processed_video_file):
    client = get_authenticated_client(user)
    original_video = baker.make_recipe("content.original_video")
    url = reverse("content:processed-video-list")
    response = client.post(
        url,
        {
            "title": "processed_video",
            "original_video": original_video.pk,
            "file": processed_video_file,
            "quality": "hd",
            "encoding": "h264",
            "bitrate": 8000,
            "audio_codec": "aac",
            "audio_bitrate": 128,
            "audio_sample_rate": 44100,
            "audio_channels": 2,
        },
        format="multipart",
    )
    assert response.status_code == status.HTTP_201_CREATED, response.data
    assert ProcessedVideo.objects.count() == 1


def test_create_video_timeline_preview(get_authenticated_client, user, preview_file):
    client = get_authenticated_client(user)
    original_video = baker.make_recipe("content.original_video")
    url = reverse("content:video-timeline-preview-list")
    response = client.post(
        url,
        {
            "video": original_video.pk,
            "preview_image": preview_file,
            "preview_time": 10,
        },
        format="multipart",
    )
    assert response.status_code == status.HTTP_201_CREATED
    assert VideoTimelinePreview.objects.count() == 1
