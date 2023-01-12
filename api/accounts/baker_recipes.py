from faker import Faker
from model_bakery.recipe import Recipe, foreign_key

from .models import User, Profile, Account

fake = Faker()

user = Recipe(
    User,
    username=fake.user_name(),
    email=fake.email(),
    first_name=fake.first_name(),
    last_name=fake.last_name(),
    is_active=True,
    is_staff=False,
)

profile = Recipe(
    Profile,
    user=foreign_key(user),
    bio=fake.paragraph(),
    profile_picture="://loremflickr.com/8/8/dog,pug",
    online_status="online",
)

account = Recipe(
    Account,
    user=foreign_key(user),
    subscription_status=True,
    subscription_type="premium",
)
