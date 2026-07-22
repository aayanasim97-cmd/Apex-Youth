import time
import signal
from django.core.management.base import BaseCommand
from django.core.management import call_command

class Command(BaseCommand):
    help = 'Daemon scheduler that periodically triggers the opportunity ingestion command'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.shutdown_requested = False
        # Catch termination signals for clean exit
        signal.signal(signal.SIGINT, self.handle_shutdown)
        signal.signal(signal.SIGTERM, self.handle_shutdown)

    def handle_shutdown(self, signum, frame):
        self.stdout.write(self.style.WARNING("\nShutdown signal received. Exiting scheduler daemon..."))
        self.shutdown_requested = True

    def add_arguments(self, parser):
        parser.add_argument(
            '--interval',
            type=int,
            default=14400,  # 4 hours in seconds
            help='Execution sleep interval in seconds'
        )

    def handle(self, *args, **options):
        interval = options['interval']
        self.stdout.write(self.style.SUCCESS(f"Scheduler daemon started. Tick interval set to {interval} seconds."))

        while not self.shutdown_requested:
            self.stdout.write("Scheduler daemon triggering: fetch_live_opportunities...")
            try:
                call_command("fetch_live_opportunities")
            except Exception as e:
                self.stderr.write(self.style.ERROR(f"Error running ingestion command: {str(e)}"))

            # Sleep in short increments to allow fast shutdown on Ctrl+C / SigTerm
            slept = 0
            while slept < interval and not self.shutdown_requested:
                time.sleep(2)
                slept += 2

        self.stdout.write(self.style.SUCCESS("Scheduler daemon shut down cleanly."))
