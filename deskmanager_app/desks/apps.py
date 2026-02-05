from django.apps import AppConfig
import os
class DesksConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'desks'
    path = os.path.dirname(os.path.abspath(__file__))