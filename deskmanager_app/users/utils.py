import pyotp
from datetime import datetime, timedelta

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from django_otp.plugins.otp_email.models import EmailDevice


@receiver(post_save, sender=User)
def create_email_otp_device(sender, instance, created, **kwargs):
    if created:
        EmailDevice.objects.create(
            user=instance,
            email=instance.email,
            confirmed=True,
            name='default'
        )


def generate_otp():
    totp = pyotp.TOTP(pyotp.random_base32(), interval=300)
    return totp.now()