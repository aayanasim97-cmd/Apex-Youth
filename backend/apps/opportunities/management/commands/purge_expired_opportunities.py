from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.opportunities.models import Opportunity

class Command(BaseCommand):
    help = 'Purges expired opportunities from the active database'

    def handle(self, *args, **options):
        today = timezone.localdate()
        # Find opportunities where the deadline is in the past (deadline < today)
        expired = Opportunity.objects.filter(deadline__lt=today)
        count = expired.count()
        expired.delete()
        
        self.stdout.write(
            self.style.SUCCESS(f"Successfully purged {count} expired opportunities from the active database.")
        )
