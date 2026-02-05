from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from .models import CustomUser
from .forms import CustomUserCreationForm

@admin.register(CustomUser)
class CustomUserAdmin(DjangoUserAdmin):
    list_display = ('username', 
                    'first_name',
                    'last_name',
                    'email',
                    'is_email_verified',
                    'is_staff',
                    'is_active',
                    'last_otp_sent')
    list_filter = ('is_staff',
                   'is_active',
                   'is_email_verified')
    ordering = ('username', 'first_name', 'last_name', 'email')

    add_form = CustomUserCreationForm
    add_fieldsets = (
        (None, {
            "classes": ("wide"),
            "fields": ( "username", 
                        "first_name", 
                        "last_name", 
                        "email", 
                        "password1", 
                        "password2", 
                        "is_staff", 
                        "is_active"),
        }),
    )