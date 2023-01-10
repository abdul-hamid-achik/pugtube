from rest_framework import routers

from video.views import UploadViewSet

router = routers.DefaultRouter()
router.register(r"upload", UploadViewSet)

urlpatterns = router.urls
