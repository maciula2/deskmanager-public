from django.core.management.base import BaseCommand
from desks.models import BookSchedule

from django.utils import timezone

class Command(BaseCommand):
    
    HELP = "Updates database for current day of the week."
    
    WEEKDAYS = [
    (0, "Monday"),
    (1, "Tuesday"),
    (2, "Wednesday"),
    (3, "Thursday"),
    (4, "Friday"),
    ]

    help = 'Check if today is a scheduled day'
    
    def handle(self, *args, **options):
        today_weekday = timezone.now().weekday()
