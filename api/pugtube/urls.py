"""pugtube URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView
from rest_framework.schemas import get_schema_view

urlpatterns = [
    path("admin", admin.site.urls),
    path("health", include("health_check.urls")),
    path("auth", include("knox.urls")),
    path("tus/", include("rest_framework_tus.urls", namespace="rest_framework_tus")),
    path("files/", include("binary_database_files.urls")),
    path("schema", get_schema_view(title="PugTube API"), name="openapi-schema"),
    path(
        "",
        include(
            (
                "video.urls",
                "video",
            ),
            namespace="video",
        ),
    ),
    path(
        "docs/",
        TemplateView.as_view(
            template_name="docs.html", extra_context={"schema_url": "openapi-schema"}
        ),
        name="docs",
    ),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
