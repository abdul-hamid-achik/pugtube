from django.db import models
from django_userforeignkey.models.fields import UserForeignKey


class BaseMixin(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(auto_now=True)

    created_by = UserForeignKey(auto_user_add=True)

    class Meta:
        abstract = True
