from rest_framework import viewsets

from .models import (
    OriginalVideo,
    Video,
    VideoPoster,
    ProcessedVideo,
    VideoTimelinePreview,
)
from .serializers import (
    OriginalVideoSerializer,
    VideoSerializer,
    ProcessedVideoSerializer,
    VideoTimelinePreviewSerializer,
    VideoPosterSerializer,
)


class OriginalVideoViewSet(viewsets.ModelViewSet):
    queryset = OriginalVideo.objects.all()
    serializer_class = OriginalVideoSerializer

    class Meta:
        ordering = ["-created_at"]


class VideoViewSet(viewsets.ModelViewSet):
    queryset = Video.objects.all()
    serializer_class = VideoSerializer

    class Meta:
        ordering = ["-created_at"]


class ProcessedVideoViewSet(viewsets.ModelViewSet):
    queryset = ProcessedVideo.objects.all()
    serializer_class = ProcessedVideoSerializer

    class Meta:
        ordering = ["-modified_at"]


class VideoPosterViewSet(viewsets.ModelViewSet):
    queryset = VideoPoster.objects.all()
    serializer_class = VideoPosterSerializer

    class Meta:
        ordering = ["-created_at"]


class VideoTimelinePreviewViewSet(viewsets.ModelViewSet):
    queryset = VideoTimelinePreview.objects.all()
    serializer_class = VideoTimelinePreviewSerializer

    class Meta:
        ordering = ["-created_at"]
