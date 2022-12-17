from django.contrib.postgres.fields import ArrayField
from django.db import models
from pugtube.shared import BaseMixin


class Upload(BaseMixin):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    tags = ArrayField(models.CharField(max_length=255), blank=True, null=True)
    file = models.FileField(upload_to="uploads")
