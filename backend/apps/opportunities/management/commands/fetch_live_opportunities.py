from django.core.management.base import BaseCommand
from apps.ingestion.services import IngestionService

class Command(BaseCommand):
    help = 'Fetches live opportunities from RSS feeds and inserts them into the database'

    def add_arguments(self, parser):
        parser.add_argument(
            '--pages',
            type=int,
            default=30,
            help='Number of pagination pages to crawl'
        )

    def handle(self, *args, **options):
        pages = options['pages']
        self.stdout.write(f"Fetching live opportunities from RSS feeds (scanning {pages} pages)...")
        results = IngestionService.fetch_and_parse_feeds(max_pages=pages)
        
        self.stdout.write(
            self.style.SUCCESS(
                f"Ingestion completed: Created: {results['created']}, "
                f"Updated: {results['updated']}, Rejected: {results['rejected']}"
            )
        )
        
        # Clean up expired opportunities
        from django.core.management import call_command
        self.stdout.write("Running expired opportunities purge...")
        call_command("purge_expired_opportunities")
