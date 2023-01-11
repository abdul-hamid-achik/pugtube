from rest_framework import serializers

from .models import (
    OriginalVideo,
    ProcessedVideo,
    VideoTimelinePreview,
    VideoPoster,
    Video,
)


class BaseMixinSerializer(serializers.ModelSerializer):
    class Meta:
        read_only_fields = (
            "id",
            "created_at",
            "modified_at",
            "created_by",
        )


class OriginalVideoSerializer(BaseMixinSerializer):
    class Meta:
        model = OriginalVideo
        fields = "__all__"


class ProcessedVideoSerializer(BaseMixinSerializer):
    class Meta:
        model = ProcessedVideo
        fields = "__all__"


class VideoPosterSerializer(BaseMixinSerializer):
    class Meta:
        model = VideoPoster
        fields = "__all__"


class VideoTimelinePreviewSerializer(BaseMixinSerializer):
    class Meta:
        model = VideoTimelinePreview
        fields = "__all__"


class VideoSerializer(BaseMixinSerializer):
    original_video = OriginalVideoSerializer(required=False)
    processed_videos = ProcessedVideoSerializer(many=True, required=False)
    poster = VideoPosterSerializer(required=False)
    previews = VideoTimelinePreviewSerializer(many=True, required=False)

    class Meta:
        model = Video
        fields = (
            "id",
            "title",
            "description",
            "tags",
            "quality",
            "file_type",
            "duration",
            "width",
            "height",
            "fps",
            "original_video",
            "processed_videos",
            "poster",
            "previews",
        )
