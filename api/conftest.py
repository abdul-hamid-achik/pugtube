import pytest
from model_bakery import baker
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import AccessToken


@pytest.fixture()
def api_client():
    return APIClient()


@pytest.fixture()
def get_authenticated_client(api_client):
    def _get_authenticated_client(user):
        token = AccessToken.for_user(user=user)
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        return api_client

    return _get_authenticated_client


@pytest.fixture()
def user():
    return baker.make_recipe("identity.user")
