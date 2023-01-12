from rest_framework import routers

from .views import (
    OriginalVideoViewSet,
    VideoViewSet,
    ProcessedVideoViewSet,
    VideoPosterViewSet,
    VideoTimelinePreviewViewSet,
)

router = routers.DefaultRouter()
router.register(r"original-video", OriginalVideoViewSet, "original-video")
router.register(r"video", VideoViewSet, "video")
router.register(r"processed-video", ProcessedVideoViewSet, "processed-video")
router.register(r"poster", VideoPosterViewSet, "video-poster")
router.register(r"preview", VideoTimelinePreviewViewSet, "video-timeline-preview")

urlpatterns = router.urls
