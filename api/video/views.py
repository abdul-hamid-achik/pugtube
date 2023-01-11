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


class VideoViewSet(viewsets.ModelViewSet):
    queryset = Video.objects.all()
    serializer_class = VideoSerializer


class ProcessedVideoViewSet(viewsets.ModelViewSet):
    queryset = ProcessedVideo.objects.all()
    serializer_class = ProcessedVideoSerializer


class VideoPosterViewSet(viewsets.ModelViewSet):
    queryset = VideoPoster.objects.all()
    serializer_class = VideoPosterSerializer


class VideoTimelinePreviewViewSet(viewsets.ModelViewSet):
    queryset = VideoTimelinePreview.objects.all()
    serializer_class = VideoTimelinePreviewSerializer
