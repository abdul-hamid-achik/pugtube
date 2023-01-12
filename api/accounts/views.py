from guardian.mixins import GuardianUserMixin, PermissionRequiredMixin
from rest_framework import viewsets, permissions
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from .models import Profile, User, Account
from .permissions import IsProfileOwner
from .serializers import ProfileSerializer, UserSerializer, AccountSerializer


class UserViewSet(GuardianUserMixin, viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer


class AccountViewSet(viewsets.ModelViewSet):
    queryset = Account.objects.all()
    serializer_class = AccountSerializer


class ProfileViewSet(viewsets.ModelViewSet):
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsProfileOwner]
