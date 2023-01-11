from django.contrib.postgres.fields import ArrayField
from django.db import models
from pugtube.shared import BaseMixin
from polymorphic.models import PolymorphicModel


class Video(PolymorphicModel, BaseMixin):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    tags = ArrayField(models.CharField(max_length=255), blank=True, null=True)

    quality = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Quality of the video, e.g. hd, sd, etc.",
    )
    file_type = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="File type of the video, e.g. mp4, webm, etc.",
    )
    duration = models.IntegerField(
        blank=True, null=True, help_text="Duration of the video in seconds"
    )
    width = models.IntegerField(blank=True, null=True)
    height = models.IntegerField(blank=True, null=True)
    fps = models.FloatField(blank=True, null=True)


class OriginalVideo(Video):
    file = models.FileField(upload_to="originals")
    original = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Original link to the file if it was uploaded from another site",
    )


class ProcessedVideo(Video):
    original_video = models.ForeignKey(
        OriginalVideo, on_delete=models.CASCADE, related_name="processed_videos"
    )
    file = models.FileField(upload_to="processed")
    encoding = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Encoding of the video, e.g. h264, vp9, etc.",
    )
    bitrate = models.IntegerField(blank=True, null=True)
    audio_codec = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Audio codec of the video, e.g. aac, mp3, etc.",
    )
    audio_bitrate = models.IntegerField(blank=True, null=True)
    audio_sample_rate = models.IntegerField(blank=True, null=True)
    audio_channels = models.IntegerField(blank=True, null=True)


class Image(PolymorphicModel, BaseMixin):
    file = models.ImageField(upload_to="images")
    width = models.IntegerField(blank=True, null=True)
    height = models.IntegerField(blank=True, null=True)


class VideoPoster(Image):
    video = models.OneToOneField(Video, on_delete=models.CASCADE, related_name="poster")


class VideoTimelinePreview(BaseMixin):
    video = models.ForeignKey(Video, on_delete=models.CASCADE, related_name="previews")
    preview_image = models.ImageField(upload_to="video_previews")
    preview_time = models.FloatField(blank=True, null=True)
