from rest_framework import serializers

from .models import Upload


class UploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Upload
        fields = "__all__"
        read_only_fields = (
            "id",
            "created_at",
            "modified_at",
            "created_by",
            "modified_by",
        )
