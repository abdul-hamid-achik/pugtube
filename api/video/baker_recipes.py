import os
from django.conf import settings

from faker import Faker
from model_bakery.recipe import Recipe

fake = Faker()


upload = Recipe(
    "video.Upload",
    title=lambda: fake.sentence(3),
    description=lambda: fake.paragraph(),
    tags=lambda: [fake.word() for _ in range(3)],
    file=os.path.join(settings.BASE_DIR, "fixtures", "videos", "upload.mp4"),
)
