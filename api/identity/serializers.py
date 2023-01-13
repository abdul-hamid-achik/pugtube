from rest_framework import serializers
from .models import User, Profile, Account


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "is_active",
            "is_staff",
        )
        read_only_fields = ("id",)


class ProfileSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), required=False
    )

    class Meta:
        model = Profile
        fields = ("id", "user", "bio", "profile_picture", "online_status")
        read_only_fields = ("id",)


class AccountSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), required=False
    )

    class Meta:
        model = Account
        fields = ("id", "user", "subscription_status", "subscription_type")
        read_only_fields = ("id",)
