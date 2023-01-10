from django.contrib import admin
from django.contrib.admin.widgets import AdminFileWidget
from django.db import models

from .models import Upload


class VideoFileWidget(AdminFileWidget):
    def render(self, name, value, attrs=None, renderer=None):
        output = super().render(name, value, attrs, renderer)
        if value and hasattr(value, "url"):
            output = (
                f'<p><video controls src="{value.url}" height="360" width="640" preload="metadata" controls>'
                f"Your browser does not support the video tag."
                f"</video></p>"
            )
        return output


@admin.register(Upload)
class UploadAdmin(admin.ModelAdmin):
    list_display = ["title", "file_type", "quality", "duration"]
    fields = [
        "title",
        "description",
        "tags",
        "file",
        "original",
        "quality",
        "file_type",
        "duration",
        "width",
        "height",
        "fps",
    ]
    formfield_overrides = {
        models.FileField: {"widget": VideoFileWidget},
    }
