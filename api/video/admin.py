from django.contrib import admin
from django.contrib.admin.widgets import AdminFileWidget
from django.db import models

from .models import (
    OriginalVideo,
    ProcessedVideo,
    Video,
    VideoPoster,
    VideoTimelinePreview,
)
from django.contrib import admin
from polymorphic.admin import (
    PolymorphicParentModelAdmin,
    PolymorphicChildModelAdmin,
    PolymorphicChildModelFilter,
)


class VideoFileWidget(AdminFileWidget):
    def render(self, name, value, attrs=None, renderer=None):
        output = super().render(name, value, attrs, renderer)
        if value and hasattr(value, "url"):
            output = (
                f'<p><video controls src="{value.url}" height="360" width="640" preload="metadata" controls>'
                f"Your browser does not support the video tag."
                f"</video></p>"
            )
        return output


@admin.register(Video)
class VideoAdmin(PolymorphicParentModelAdmin):
    base_model = Video
    child_models = (OriginalVideo, ProcessedVideo)
    list_display = ["title", "file_type", "duration"]
    list_filter = [PolymorphicChildModelFilter]
    fields = [
        "title",
        "description",
        "tags",
        "quality",
        "file_type",
        "duration",
        "width",
        "height",
        "fps",
    ]
    search_fields = ["title"]


@admin.register(OriginalVideo)
class OriginalVideoAdmin(admin.ModelAdmin):
    list_display = ["title", "file_type", "quality", "duration"]
    fields = [
        "title",
        "description",
        "tags",
        "file",
        "original",
        "quality",
        "file_type",
        "duration",
        "width",
        "height",
        "fps",
    ]
    formfield_overrides = {
        models.FileField: {"widget": VideoFileWidget},
    }


@admin.register(ProcessedVideo)
class ProcessedVideoAdmin(admin.ModelAdmin):
    list_display = ["original_video", "file_type", "encoding", "bitrate", "audio_codec"]
    fields = [
        "original_video",
        "file",
        "encoding",
        "bitrate",
        "audio_codec",
        "audio_bitrate",
        "audio_sample_rate",
        "audio_channels",
    ]


@admin.register(VideoPoster)
class VideoPosterAdmin(admin.ModelAdmin):
    list_display = ["id", "video", "file"]
    fields = ["video", "file", "width", "height"]


@admin.register(VideoTimelinePreview)
class VideoTimelinePreviewAdmin(admin.ModelAdmin):
    list_display = ["id", "video", "preview_image", "preview_time"]
    fields = ["video", "preview_image", "preview_time"]
