from rest_framework import routers

from video.views import (
    OriginalVideoViewSet,
    VideoViewSet,
    ProcessedVideoViewSet,
    VideoPosterViewSet,
    VideoTimelinePreviewViewSet,
)

router = routers.DefaultRouter()
router.register(r"original", OriginalVideoViewSet)
router.register(r"video", VideoViewSet)
router.register(r"processed", ProcessedVideoViewSet)
router.register(r"poster", VideoPosterViewSet)
router.register(r"preview", VideoTimelinePreviewViewSet)

urlpatterns = router.urls
