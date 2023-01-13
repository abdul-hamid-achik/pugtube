from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html

from .models import Profile, Account, User


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "bio", "profile_picture_url")
    list_filter = ()
    search_fields = ("user__username", "user__email", "bio")

    def profile_picture_url(self, obj):
        if obj.profile_picture:
            return format_html(
                '<img src="{}" width="50" height="50" />', obj.profile_picture.url
            )
        return "no picture"

    profile_picture_url.short_description = "Profile Picture"


@admin.register(Account)
class AccountAdmin(admin.ModelAdmin):
    list_display = ("user", "subscription_status", "subscription_type")
    list_filter = ("subscription_status", "subscription_type")
    search_fields = ("user__username", "user__email")


admin.site.register(User, UserAdmin)
