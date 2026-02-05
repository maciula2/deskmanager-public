from django.db import models
from django.contrib.auth.models import AbstractUser

class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)
    is_email_verified = models.BooleanField(default=False)
    email_otp = models.CharField(max_length=6, null=True, blank=True)
    last_otp_sent = models.DateTimeField(null=True, blank=True)
    class Meta:
        db_table = 'auth_user'
        verbose_name_plural = 'Users'

