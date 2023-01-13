from rest_framework import routers

from .views import UserViewSet, ProfileViewSet, AccountViewSet

router = routers.DefaultRouter()
router.register(r"users", UserViewSet)
router.register(r"profiles", ProfileViewSet)
router.register(r"accounts", AccountViewSet)

urlpatterns = router.urls
