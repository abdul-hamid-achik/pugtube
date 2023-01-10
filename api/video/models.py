from django.contrib.postgres.fields import ArrayField
from django.db import models
from pugtube.shared import BaseMixin


class Upload(BaseMixin):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    tags = ArrayField(models.CharField(max_length=255), blank=True, null=True)
    file = models.FileField(upload_to="uploads")

    original = models.CharField(
        max_length=255, blank=True, null=True, help_text="Original link to the file"
    )

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
