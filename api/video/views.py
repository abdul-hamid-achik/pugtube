from rest_framework import viewsets

from .models import Upload
from .serializers import UploadSerializer


class UploadViewSet(viewsets.ModelViewSet):
    queryset = Upload.objects.all()
    serializer_class = UploadSerializer
