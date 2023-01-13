from django.contrib.auth.models import AbstractUser
from django.db import models
from django_lifecycle import LifecycleModel, hook, AFTER_CREATE


class User(AbstractUser, LifecycleModel):
    @hook(AFTER_CREATE)
    def create_profile(self):
        Profile.objects.create(user=self)
        Account.objects.create(user=self)


class Profile(LifecycleModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    bio = models.TextField(blank=True)
    profile_picture = models.ImageField(
        upload_to="profile_pictures/",
        blank=True,
    )
    ONLINE_STATUS = (
        ("online", "Online"),
        ("offline", "Offline"),
    )
    online_status = models.CharField(
        max_length=20, choices=ONLINE_STATUS, default="offline"
    )


class Account(LifecycleModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    subscription_status = models.BooleanField(default=False)
    SUBSCRIPTION_TYPE = (
        ("free", "Free"),
        ("premium", "Premium"),
    )
    subscription_type = models.CharField(
        max_length=20, choices=SUBSCRIPTION_TYPE, default="free"
    )
