import os

from django.conf import settings
from django.core.files import File
from faker import Faker
from model_bakery.recipe import Recipe, foreign_key

from .models import User, Profile, Account

fake = Faker()

user = Recipe(
    User,
    username=fake.user_name,
    email=fake.email,
    first_name=fake.first_name,
    last_name=fake.last_name,
    is_active=True,
    is_staff=False,
)

profile = Recipe(
    Profile,
    user=foreign_key(user, one_to_one=True),
    bio=fake.paragraph,
    profile_picture=File(
        open(
            os.path.join(
                settings.BASE_DIR, "fixtures", "images", "profile_picture.png"
            ),
            "rb",
        ),
        name="profile_picture.png",
    ),
    online_status="online",
)

account = Recipe(
    Account,
    user=foreign_key(user, one_to_one=True),
    subscription_status=True,
    subscription_type="premium",
)
