from datetime import timedelta
from django.utils import timezone
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from apps.opportunities.models import Opportunity, Category, Country

class OpportunityAPITests(APITestCase):
    def setUp(self):
        # Create Categories
        self.learning_cat = Category.objects.create(slug=Category.LEARNING)
        self.volunteering_cat = Category.objects.create(slug=Category.VOLUNTEERING)

        # Create Countries
        self.usa = Country.objects.create(name="United States", iso_code="US")
        self.germany = Country.objects.create(name="Germany", iso_code="DE")
        self.pakistan = Country.objects.create(name="Pakistan", iso_code="PK")

        today = timezone.now().date()

        # Opportunity 1: Worldwide, online, open age, expires in 4 days (last minute)
        self.opp1 = Opportunity.objects.create(
            title="Global Remote coding challenge",
            description="Remote coding for all",
            source_url="https://example.com/remote",
            category=self.learning_cat,
            is_worldwide=True,
            is_online=True,
            deadline=today + timedelta(days=4)
        )

        # Opportunity 2: Germany only, onsite, age 18-25, expires in 30 days
        self.opp2 = Opportunity.objects.create(
            title="Berlin Youth Summit",
            description="Onsite summit in Berlin",
            source_url="https://example.com/berlin",
            category=self.volunteering_cat,
            min_age=18,
            max_age=25,
            destination_country=self.germany,
            is_onsite=True,
            deadline=today + timedelta(days=30)
        )
        self.opp2.eligible_home_countries.add(self.germany)

        # Opportunity 3: US and Pakistan eligible, onsite, age 15+, expires in 10 days
        self.opp3 = Opportunity.objects.create(
            title="US-PK Exchange program",
            description="Cultural exchange",
            source_url="https://example.com/us-pk",
            category=self.learning_cat,
            min_age=15,
            destination_country=self.usa,
            is_onsite=True,
            deadline=today + timedelta(days=10)
        )
        self.opp3.eligible_home_countries.add(self.usa, self.pakistan)

    def test_list_opportunities(self):
        url = reverse("opportunity-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Verify custom cursor pagination is returning 'results'
        self.assertIn("results", response.data)
        # There should be 3 opportunities in database
        self.assertEqual(len(response.data["results"]), 3)

    def test_filter_by_category(self):
        url = reverse("opportunity-list")
        response = self.client.get(url, {"category": Category.VOLUNTEERING})
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["id"], self.opp2.id)

    def test_filter_by_age(self):
        url = reverse("opportunity-list")
        # Age 17: Should match Opp1 (open age) and Opp3 (min_age 15), but not Opp2 (min_age 18)
        response = self.client.get(url, {"age": 17})
        self.assertEqual(len(response.data["results"]), 2)
        opp_ids = [item["id"] for item in response.data["results"]]
        self.assertIn(self.opp1.id, opp_ids)
        self.assertIn(self.opp3.id, opp_ids)

        # Age 20: Should match all 3 (Opp1 open, Opp2 18-25, Opp3 15+)
        response = self.client.get(url, {"age": 20})
        self.assertEqual(len(response.data["results"]), 3)

    def test_filter_by_home_country_logic(self):
        url = reverse("opportunity-list")
        # Pakistan ('PK') should match:
        # - Opp1 because it is is_online=True or is_worldwide=True
        # - Opp3 because Pakistan is in eligible_home_countries
        response = self.client.get(url, {"home_country": "PK"})
        self.assertEqual(len(response.data["results"]), 2)
        opp_ids = [item["id"] for item in response.data["results"]]
        self.assertIn(self.opp1.id, opp_ids)
        self.assertIn(self.opp3.id, opp_ids)

        # Germany ('DE') should match:
        # - Opp1 (online / worldwide)
        # - Opp2 (eligible_home_countries contains Germany)
        response = self.client.get(url, {"home_country": "DE"})
        self.assertEqual(len(response.data["results"]), 2)
        opp_ids = [item["id"] for item in response.data["results"]]
        self.assertIn(self.opp1.id, opp_ids)
        self.assertIn(self.opp2.id, opp_ids)

    def test_filter_by_mode(self):
        url = reverse("opportunity-list")
        response = self.client.get(url, {"mode": "online"})
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["id"], self.opp1.id)

        response = self.client.get(url, {"mode": "onsite"})
        self.assertEqual(len(response.data["results"]), 2)

    def test_filter_last_minute(self):
        url = reverse("opportunity-list")
        # Opp1 deadline is +4 days, which is inside [today+3, today+5] range
        response = self.client.get(url, {"last_minute": True})
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["id"], self.opp1.id)

    def test_admin_analytics_endpoint_restricted(self):
        from django.contrib.auth import get_user_model
        url = reverse("admin-analytics")
        
        # Test anonymous access
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Test non-admin user access
        User = get_user_model()
        user = User.objects.create_user(email="regular@example.com", username="regular@example.com", password="password")
        self.client.force_authenticate(user=user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Test admin user access
        admin_user = User.objects.create_superuser(email="admin@example.com", username="admin@example.com", password="password")
        self.client.force_authenticate(user=admin_user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["total_opportunities"], 3)
