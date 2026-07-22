from django.contrib.auth import get_user_model
from rest_framework import authentication
from rest_framework import exceptions
from django.conf import settings

User = get_user_model()

class N8nAPIKeyAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        api_key = (
            request.headers.get("X-Api-Key") 
            or request.headers.get("X-API-Key") 
            or request.META.get("HTTP_X_API_KEY")
        )
        
        if not api_key:
            return None
        
        if api_key != settings.N8N_API_KEY:
            raise exceptions.AuthenticationFailed("Invalid API Key")
            
        user, _ = User.objects.get_or_create(
            email="n8n-service@system.local",
            defaults={
                "username": "n8n_ingestion_service",
                "is_active": True,
                "is_staff": False,
                "is_superuser": False
            }
        )
        return (user, None)

    def authenticate_header(self, request):
        return 'APIKey'
