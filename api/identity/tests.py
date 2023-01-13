import pytest
from model_bakery import baker
from rest_framework import status
from rest_framework.reverse import reverse

from .models import User, Profile, Account

pytestmark = pytest.mark.django_db


# /identity/users
def test_create_user(get_authenticated_client, user):
    client = get_authenticated_client(user)
    url = reverse("identity:user-list")
    current_users_count = User.objects.count()
    response = client.post(
        url,
        {
            "username": "testuser",
            "email": "testuser@example.com",
            "password": "testpassword",
            "first_name": "Test",
            "last_name": "User",
        },
    )
    assert response.status_code == status.HTTP_201_CREATED, response.data
    assert User.objects.count() == current_users_count + 1


def test_update_user(get_authenticated_client, user):
    client = get_authenticated_client(user)
    user = baker.make_recipe("identity.user")
    current_users_count = User.objects.count()
    url = reverse("identity:user-detail", args=[user.pk])
    response = client.put(
        url,
        {
            "username": "testuser2",
            "email": "testuser2@example.com",
            "first_name": "Test2",
            "last_name": "User2",
        },
    )
    assert response.status_code == status.HTTP_200_OK, response.data
    assert User.objects.count() == current_users_count
    updated_user = User.objects.last()
    assert updated_user.username == "testuser2"
    assert updated_user.email == "testuser2@example.com"
    assert updated_user.first_name == "Test2"
    assert updated_user.last_name == "User2"


# /identity/accounts


def test_create_account(get_authenticated_client, user):
    user.account.delete()
    current_users_count = Account.objects.count()
    client = get_authenticated_client(user)
    url = reverse("identity:account-list")
    response = client.post(
        url,
        {
            "user": user.pk,
            "subscription_status": True,
            "subscription_type": "premium",
        },
        format="json",
    )
    assert response.status_code == status.HTTP_201_CREATED, response.data
    assert Account.objects.count() == current_users_count + 1


def test_update_account(get_authenticated_client, user):
    client = get_authenticated_client(user)
    account = user.account
    url = reverse("identity:account-detail", args=[account.pk])

    response = client.put(
        url, {"subscription_status": False, "subscription_type": "free"}
    )
    assert response.status_code == status.HTTP_200_OK, response.data
    account.refresh_from_db()
    assert account.subscription_status is False
    assert account.subscription_type == "free"


def test_delete_account(get_authenticated_client, user):
    current_users_count = Account.objects.count()
    client = get_authenticated_client(user)
    account = user.account
    url = reverse("identity:account-detail", args=[account.pk])
    response = client.delete(url)
    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert Account.objects.count() == current_users_count - 1


def test_cannot_update_other_users_account(get_authenticated_client, user):
    client = get_authenticated_client(user)
    other_user = baker.make_recipe("identity.user")
    other_users_account = other_user.account
    url = reverse("identity:account-detail", args=[other_users_account.pk])
    response = client.put(url, {"subscription_type": "free"})
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.data
    other_users_account.refresh_from_db()
    assert other_users_account.subscription_status is not "free"


# /identity/profiles


def test_create_profile(get_authenticated_client, user, profile_picture):
    user.profile.delete()
    client = get_authenticated_client(user)
    url = reverse("identity:profile-list")
    current_profiles_count = Profile.objects.count()
    response = client.post(
        url,
        {
            "user": user.pk,
            "bio": "Test profile",
            "online_status": "online",
            "profile_picture": profile_picture,
        },
        format="multipart",
    )
    assert response.status_code == status.HTTP_201_CREATED, response.data
    assert Profile.objects.count() == current_profiles_count + 1


def test_update_profile(get_authenticated_client, user):
    client = get_authenticated_client(user)
    profile = user.profile
    url = reverse("identity:profile-detail", args=[profile.pk])

    response = client.put(
        url,
        {
            "bio": "Test bio updated",
            "online_status": "offline",
        },
        format="json",
    )
    assert response.status_code == status.HTTP_200_OK, response.data
    profile.refresh_from_db()
    assert profile.bio == "Test bio updated"
    assert profile.online_status == "offline"


def test_delete_profile(get_authenticated_client, user):
    client = get_authenticated_client(user)
    profile = user.profile
    current_profiles_count = Profile.objects.count()
    url = reverse("identity:profile-detail", args=[profile.pk])
    response = client.delete(url)
    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert Profile.objects.count() == current_profiles_count - 1


def test_cannot_update_other_users_profile(get_authenticated_client, user):
    client = get_authenticated_client(user)
    other_user = baker.make_recipe("identity.user")
    other_users_profile = other_user.profile
    url = reverse("identity:profile-detail", args=[other_users_profile.pk])
    response = client.put(url, {"bio": "I am not the real user"})
    assert response.status_code == status.HTTP_403_FORBIDDEN
    other_users_profile.refresh_from_db()
    assert other_users_profile.bio != "I am not the real user"


def test_cannot_delete_other_users_profile(get_authenticated_client, user):
    client = get_authenticated_client(user)
    other_user = baker.make_recipe("identity.user")
    other_users_profile = other_user.profile
    url = reverse("identity:profile-detail", args=[other_users_profile.pk])
    response = client.delete(url)
    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert Profile.objects.filter(pk=other_users_profile.pk).exists()
