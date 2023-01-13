from guardian.mixins import GuardianUserMixin
from rest_framework import viewsets

from .models import Profile, User, Account
from .permissions import IsProfileOwner, IsAccountOwner
from .serializers import ProfileSerializer, UserSerializer, AccountSerializer


class UserViewSet(GuardianUserMixin, viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer


class AccountViewSet(viewsets.ModelViewSet):
    queryset = Account.objects.all()
    serializer_class = AccountSerializer
    permission_classes = [IsAccountOwner]


class ProfileViewSet(viewsets.ModelViewSet):
    permission_classes = [IsProfileOwner]
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
