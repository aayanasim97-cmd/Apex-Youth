from datetime import timedelta
from django.utils import timezone
from django.urls import reverse
from unittest.mock import patch
from rest_framework.test import APITestCase
from rest_framework import status
from django.conf import settings
from apps.opportunities.models import Opportunity, Category, Country
from apps.ingestion.models import IngestionLog

class IngestionAPITests(APITestCase):
    def setUp(self):
        # Create Category and Country
        self.learning = Category.objects.create(slug=Category.LEARNING)
        self.germany = Country.objects.create(name="Germany", iso_code="DE")
        self.pakistan = Country.objects.create(name="Pakistan", iso_code="PK")
        
        self.url = reverse("n8n-ingest")
        self.api_key = settings.N8N_API_KEY
        
        self.valid_payload = {
            "title": "Summer Scholarship 2026",
            "description": "Full funding for summer studies",
            "source_url": "https://example.com/scholarship2026",
            "category": "learning",
            "min_age": 18,
            "max_age": 30,
            "eligible_home_countries": ["PK", "DE"],
            "is_worldwide": False,
            "destination_country": "DE",
            "is_online": False,
            "is_onsite": True,
            "deadline": str(timezone.now().date() + timedelta(days=15))
        }

    def test_missing_api_key(self):
        response = self.client.post(self.url, self.valid_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(IngestionLog.objects.count(), 0)

    def test_invalid_api_key(self):
        self.client.credentials(HTTP_X_API_KEY="wrong-api-key")
        response = self.client.post(self.url, self.valid_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(IngestionLog.objects.count(), 0)

    def test_valid_payload_creation(self):
        self.client.credentials(HTTP_X_API_KEY=self.api_key)
        response = self.client.post(self.url, self.valid_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["created"])
        
        # Verify Opportunity was created
        opp = Opportunity.objects.get(source_url=self.valid_payload["source_url"])
        self.assertEqual(opp.title, self.valid_payload["title"])
        self.assertEqual(opp.destination_country, self.germany)
        self.assertEqual(opp.eligible_home_countries.count(), 2)
        
        # Verify IngestionLog was created
        log = IngestionLog.objects.latest("created_at")
        self.assertEqual(log.status, "created")
        self.assertEqual(log.opportunity, opp)

    def test_duplicate_payload_update(self):
        # Insert once
        self.client.credentials(HTTP_X_API_KEY=self.api_key)
        self.client.post(self.url, self.valid_payload, format="json")
        self.assertEqual(Opportunity.objects.count(), 1)
        
        # Modify and send again
        updated_payload = self.valid_payload.copy()
        updated_payload["title"] = "Updated Summer Scholarship Title"
        
        response = self.client.post(self.url, updated_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertFalse(response.data["created"])  # created should be False since it's an update
        
        # Verify Opportunity was updated
        opp = Opportunity.objects.get(source_url=self.valid_payload["source_url"])
        self.assertEqual(opp.title, "Updated Summer Scholarship Title")
        self.assertEqual(Opportunity.objects.count(), 1)  # Count remains 1
        
        # Verify IngestionLog status is updated
        log = IngestionLog.objects.latest("created_at")
        self.assertEqual(log.status, "updated")

    def test_invalid_payload_rejection(self):
        self.client.credentials(HTTP_X_API_KEY=self.api_key)
        invalid_payload = self.valid_payload.copy()
        invalid_payload["deadline"] = str(timezone.now().date() - timedelta(days=5))  # Past date
        
        response = self.client.post(self.url, invalid_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Verify IngestionLog registered the rejection
        log = IngestionLog.objects.latest("created_at")
        self.assertEqual(log.status, "rejected")
        self.assertIn("deadline", log.errors)


class RSSIngestionTests(APITestCase):
    def setUp(self):
        # Create categories and countries
        self.learning = Category.objects.get_or_create(slug=Category.LEARNING)[0]
        self.working = Category.objects.get_or_create(slug=Category.WORKING)[0]
        self.volunteering = Category.objects.get_or_create(slug=Category.VOLUNTEERING)[0]
        self.competing = Category.objects.get_or_create(slug=Category.COMPETING)[0]
        self.making_change = Category.objects.get_or_create(slug=Category.MAKING_CHANGE)[0]

        self.germany = Country.objects.get_or_create(name="Germany", iso_code="DE")[0]
        self.pakistan = Country.objects.get_or_create(name="Pakistan", iso_code="PK")[0]

    def test_category_detection(self):
        from apps.ingestion.services import IngestionService
        
        # Test Scholarship tag
        self.assertEqual(
            IngestionService._detect_category("Master Study Fellowship", ["education", "award"]),
            Category.LEARNING
        )
        # Test Job/internship keywords
        self.assertEqual(
            IngestionService._detect_category("Internship in Berlin", ["careers"]),
            Category.WORKING
        )
        # Test Volunteer tag
        self.assertEqual(
            IngestionService._detect_category("Global Volunteer program", ["community"]),
            Category.VOLUNTEERING
        )

    def test_deadline_extraction(self):
        from apps.ingestion.services import IngestionService
        from datetime import date
        
        # Format: "Deadline: October 15, 2026"
        self.assertEqual(
            IngestionService._extract_deadline("The application deadline is October 15, 2026.", ""),
            date(2026, 10, 15)
        )
        # Format: "apply before 15 November 2026"
        self.assertEqual(
            IngestionService._extract_deadline("Make sure to apply before 15 November 2026.", ""),
            date(2026, 11, 15)
        )

    def test_age_extraction(self):
        from apps.ingestion.services import IngestionService

        # Match range
        min_a, max_a = IngestionService._extract_age_range("Applicants must be between 18 and 30 years old.")
        self.assertEqual(min_a, 18)
        self.assertEqual(max_a, 30)

        # Match min
        min_a, max_a = IngestionService._extract_age_range("Aged 18 years or older.")
        self.assertEqual(min_a, 18)
        self.assertIsNone(max_a)

    def test_country_detection(self):
        from apps.ingestion.services import IngestionService

        # Title mentions Germany, text mentions Pakistan
        is_worldwide, eligible, dest = IngestionService._detect_countries(
            "Summit in Germany", "Open to citizens of Pakistan.", ["travel"]
        )
        self.assertFalse(is_worldwide)
        self.assertEqual(dest.iso_code, "DE")
        self.assertIn(self.pakistan, eligible)

        # Worldwide keyword
        is_worldwide, eligible, dest = IngestionService._detect_countries(
            "Global Fellowship", "Open to all nationalities worldwide.", ["global"]
        )
        self.assertTrue(is_worldwide)

    @patch("urllib.request.urlopen")
    def test_fetch_and_parse_feeds_success(self, mock_urlopen):
        from apps.ingestion.services import IngestionService
        
        # Mock HTML contents
        mock_list_html = b"""
        <html>
            <body>
                <h2><a href="https://www.opportunitydesk.org/2026/07/germany-internship-2026/">Fully Funded Internship in Germany</a></h2>
            </body>
        </html>
        """
        mock_detail_html = b"""
        <html>
            <body>
                <div class="entry-content">
                    Deadline: October 15, 2026. Applicants must be between 18 and 30 years. Open to citizens of Pakistan.
                </div>
            </body>
        </html>
        """
        
        # Mock file-like enter contexts
        class MockResponse:
            def __init__(self, data):
                self.data = data
            def read(self):
                return self.data
            def __enter__(self):
                return self
            def __exit__(self, exc_type, exc_val, exc_tb):
                pass
        
        # side_effect will supply the responses in sequence
        mock_urlopen.side_effect = [
            MockResponse(mock_list_html),
            MockResponse(mock_detail_html)
        ]
        
        # Execute ingestion for 1 page
        results = IngestionService.fetch_and_parse_feeds(max_pages=1)
        
        self.assertEqual(results["created"], 1)
        self.assertEqual(Opportunity.objects.count(), 1)
        
        opp = Opportunity.objects.first()
        self.assertEqual(opp.title, "Fully Funded Internship in Germany")
        self.assertEqual(opp.category.slug, Category.WORKING)
        self.assertEqual(opp.min_age, 18)
        self.assertEqual(opp.max_age, 30)
        self.assertEqual(opp.destination_country, self.germany)
        self.assertFalse(opp.is_worldwide)

