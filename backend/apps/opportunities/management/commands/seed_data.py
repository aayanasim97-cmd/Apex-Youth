from django.core.management.base import BaseCommand
from apps.opportunities.models import Category, Country

class Command(BaseCommand):
    help = 'Seeds initial Category and Country data'

    def handle(self, *args, **kwargs):
        # 1. Seed Categories
        categories = [
            (Category.LEARNING, "Learning & Scholarships"),
            (Category.VOLUNTEERING, "Volunteering"),
            (Category.WORKING, "Working & Internships"),
            (Category.MAKING_CHANGE, "Making a Change"),
            (Category.COMPETING, "Competing"),
        ]

        self.stdout.write("Seeding categories...")
        for slug, name in categories:
            cat, created = Category.objects.get_or_create(slug=slug)
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created category: {name}"))
            else:
                self.stdout.write(f"Category already exists: {name}")

        # 2. Seed Countries
        countries = [
            ("United States", "US"),
            ("United Kingdom", "GB"),
            ("Germany", "DE"),
            ("France", "FR"),
            ("Italy", "IT"),
            ("Spain", "ES"),
            ("Pakistan", "PK"),
            ("India", "IN"),
            ("Bangladesh", "BD"),
            ("Canada", "CA"),
            ("Australia", "AU"),
            ("Japan", "JP"),
            ("China", "CN"),
            ("Brazil", "BR"),
            ("Mexico", "MX"),
            ("South Africa", "ZA"),
            ("Netherlands", "NL"),
            ("Sweden", "SE"),
            ("Poland", "PL"),
            ("Belgium", "BE"),
            ("Austria", "AT"),
            ("Switzerland", "CH"),
            ("Finland", "FI"),
            ("Norway", "NO"),
            ("Denmark", "DK"),
            ("Ireland", "IE"),
            ("New Zealand", "NZ"),
            ("Singapore", "SG"),
            ("Malaysia", "MY"),
            ("Turkey", "TR"),
            ("Saudi Arabia", "SA"),
            ("United Arab Emirates", "AE"),
        ]

        self.stdout.write("Seeding countries...")
        for name, iso in countries:
            country, created = Country.objects.get_or_create(iso_code=iso, defaults={"name": name})
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created country: {name} ({iso})"))
            else:
                self.stdout.write(f"Country already exists: {name} ({iso})")

        self.stdout.write(self.style.SUCCESS("Seeding completed successfully!"))
