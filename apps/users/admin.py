from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _

from apps.users.models import Address

User = get_user_model()


class AddressInline(admin.StackedInline):
    model = Address
    extra = 0
    fields = ("street_address", "city", "state", "postal_code", "country", "is_default")


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Custom Admin for User model configured for non-technical shop owners.
    """

    inlines = [AddressInline]
    list_display = ("email", "first_name", "last_name", "phone_number", "is_staff", "is_active", "date_joined")
    list_filter = ("is_staff", "is_superuser", "is_active", "date_joined")
    search_fields = ("email", "first_name", "last_name", "phone_number")
    ordering = ("-date_joined",)

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        (_("Personal info"), {"fields": ("first_name", "last_name", "phone_number")}),
        (
            _("Permissions"),
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                ),
            },
        ),
        (_("Important dates"), {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "password1", "password2"),
            },
        ),
    )


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ("user", "street_address", "city", "state", "postal_code", "country", "is_default")
    list_filter = ("is_default", "country", "state")
    search_fields = ("user__email", "street_address", "city", "postal_code")
