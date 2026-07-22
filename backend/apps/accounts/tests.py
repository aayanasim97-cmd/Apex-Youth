from unittest.mock import patch
from django.urls import reverse
from django.conf import settings
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from apps.accounts.models import CustomUser

class AuthenticationTests(APITestCase):
    def setUp(self):
        self.google_login_url = reverse("auth-google")
        self.token_refresh_url = reverse("auth-refresh")
        self.logout_url = reverse("auth-logout")
        self.profile_url = reverse("auth-profile")

        self.user_email = "testuser@gmail.com"
        self.user_first_name = "Alex"
        self.user_avatar = "https://example.com/avatar.jpg"
        
        # Pre-create a user to test existing user login path
        self.user = CustomUser.objects.create_user(
            email=self.user_email,
            first_name=self.user_first_name,
            avatar_url=self.user_avatar
        )

    @patch("google.oauth2.id_token.verify_oauth2_token")
    def test_google_login_success(self, mock_verify):
        # Mock Google token response
        mock_verify.return_value = {
            "iss": "https://accounts.google.com",
            "email": self.user_email,
            "given_name": self.user_first_name,
            "family_name": "Youth",
            "picture": self.user_avatar,
        }

        payload = {"credential": "mock-google-id-token"}
        response = self.client.post(self.google_login_url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["user"]["email"], self.user_email)
        self.assertEqual(response.data["user"]["first_name"], self.user_first_name)

        # Check cookies
        cookies = response.cookies
        self.assertIn(settings.AUTH_COOKIE_ACCESS_NAME, cookies)
        self.assertIn(settings.AUTH_COOKIE_REFRESH_NAME, cookies)

        access_cookie = cookies[settings.AUTH_COOKIE_ACCESS_NAME]
        refresh_cookie = cookies[settings.AUTH_COOKIE_REFRESH_NAME]

        # Verify HttpOnly and Path scoping
        self.assertTrue(access_cookie["httponly"])
        self.assertEqual(access_cookie["path"], "/")

        self.assertTrue(refresh_cookie["httponly"])
        self.assertEqual(refresh_cookie["path"], "/api/auth/refresh/")

    def test_user_profile_unauthenticated(self):
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_profile_authenticated_via_cookie(self):
        refresh = RefreshToken.for_user(self.user)
        access_token = str(refresh.access_token)

        # Attach access cookie to client request
        self.client.cookies[settings.AUTH_COOKIE_ACCESS_NAME] = access_token
        
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], self.user_email)
        self.assertEqual(response.data["first_name"], self.user_first_name)

    def test_token_refresh_flow(self):
        refresh = RefreshToken.for_user(self.user)
        refresh_token_str = str(refresh)

        # Attach refresh cookie
        self.client.cookies[settings.AUTH_COOKIE_REFRESH_NAME] = refresh_token_str

        response = self.client.post(self.token_refresh_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["refreshed"])

        # Checks that new access cookie is set
        self.assertIn(settings.AUTH_COOKIE_ACCESS_NAME, response.cookies)
        self.assertTrue(response.cookies[settings.AUTH_COOKIE_ACCESS_NAME]["httponly"])

    def test_token_refresh_missing_cookie(self):
        response = self.client.post(self.token_refresh_url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_logout_clears_cookies(self):
        response = self.client.post(self.logout_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check that cookies are deleted (max-age is 0 or empty)
        cookies = response.cookies
        self.assertIn(settings.AUTH_COOKIE_ACCESS_NAME, cookies)
        self.assertIn(settings.AUTH_COOKIE_REFRESH_NAME, cookies)
        
        # Deleting a cookie sets its value to empty and expires it
        self.assertEqual(cookies[settings.AUTH_COOKIE_ACCESS_NAME].value, "")
        self.assertEqual(cookies[settings.AUTH_COOKIE_REFRESH_NAME].value, "")
