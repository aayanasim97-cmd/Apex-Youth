from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from apps.accounts.models import CustomUser

class GoogleLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        credential = request.data.get("credential")
        if not credential:
            return Response({"error": "Google ID token credential is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Verify the ID token with Google's servers
            idinfo = id_token.verify_oauth2_token(
                credential,
                google_requests.Request(),
                settings.GOOGLE_CLIENT_ID
            )
            
            if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                raise ValueError('Wrong token issuer.')
                
        except Exception as e:
            return Response({"error": f"Invalid Google token: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

        email = idinfo.get("email")
        if not email:
            return Response({"error": "Google token does not contain an email address"}, status=status.HTTP_400_BAD_REQUEST)

        first_name = idinfo.get("given_name", "")
        last_name = idinfo.get("family_name", "")
        avatar_url = idinfo.get("picture", "")

        user, created = CustomUser.objects.get_or_create(
            email=email,
            defaults={
                "first_name": first_name,
                "last_name": last_name,
                "avatar_url": avatar_url,
                "username": email,
            }
        )

        refresh = RefreshToken.for_user(user)
        response = Response({
            "user": {
                "email": user.email,
                "first_name": user.first_name,
                "avatar_url": user.avatar_url,
                "is_staff": user.is_staff,
                "is_superuser": user.is_superuser
            }
        }, status=status.HTTP_200_OK)

        # Set Access Token Cookie
        response.set_cookie(
            settings.AUTH_COOKIE_ACCESS_NAME,
            str(refresh.access_token),
            httponly=settings.AUTH_COOKIE_HTTP_ONLY,
            secure=settings.AUTH_COOKIE_SECURE,
            samesite=settings.AUTH_COOKIE_SAME_SITE,
            max_age=int(settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds()),
            path="/"
        )

        # Set Refresh Token Cookie (scoped to the refresh path for extra safety)
        response.set_cookie(
            settings.AUTH_COOKIE_REFRESH_NAME,
            str(refresh),
            httponly=settings.AUTH_COOKIE_HTTP_ONLY,
            secure=settings.AUTH_COOKIE_SECURE,
            samesite=settings.AUTH_COOKIE_SAME_SITE,
            max_age=int(settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds()),
            path="/api/auth/refresh/"
        )

        return response


class CookieTokenRefreshView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.COOKIES.get(settings.AUTH_COOKIE_REFRESH_NAME)
        if not refresh_token:
            return Response({"error": "Refresh token is missing from cookies"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Parse simplejwt token
            refresh = RefreshToken(refresh_token)
            new_access_token = str(refresh.access_token)

            response = Response({"refreshed": True}, status=status.HTTP_200_OK)
            
            response.set_cookie(
                settings.AUTH_COOKIE_ACCESS_NAME,
                new_access_token,
                httponly=settings.AUTH_COOKIE_HTTP_ONLY,
                secure=settings.AUTH_COOKIE_SECURE,
                samesite=settings.AUTH_COOKIE_SAME_SITE,
                max_age=int(settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds()),
                path="/"
            )

            # If token rotation is active, set the new rotated refresh token too
            if settings.SIMPLE_JWT.get("ROTATE_REFRESH_TOKENS", False):
                response.set_cookie(
                    settings.AUTH_COOKIE_REFRESH_NAME,
                    str(refresh),
                    httponly=settings.AUTH_COOKIE_HTTP_ONLY,
                    secure=settings.AUTH_COOKIE_SECURE,
                    samesite=settings.AUTH_COOKIE_SAME_SITE,
                    max_age=int(settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds()),
                    path="/api/auth/refresh/"
                )

            return response
        except TokenError as e:
            return Response({"error": f"Invalid or expired refresh token: {str(e)}"}, status=status.HTTP_401_UNAUTHORIZED)


class LogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        response = Response({"success": True}, status=status.HTTP_200_OK)
        # Clear cookies by setting max_age=0 / deleting
        response.delete_cookie(settings.AUTH_COOKIE_ACCESS_NAME, path="/")
        response.delete_cookie(settings.AUTH_COOKIE_REFRESH_NAME, path="/api/auth/refresh/")
        return response


class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "avatar_url": user.avatar_url,
            "is_staff": user.is_staff,
            "is_superuser": user.is_superuser
        })
