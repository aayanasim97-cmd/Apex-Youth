from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from apps.ingestion.authentication import N8nAPIKeyAuthentication
from apps.ingestion.serializers import IncomingOpportunitySerializer
from apps.ingestion.models import IngestionLog
from apps.opportunities.models import Opportunity

class IsN8nServiceUser(IsAuthenticated):
    def has_permission(self, request, view):
        is_auth = super().has_permission(request, view)
        return is_auth and request.user.username == "n8n_ingestion_service"


class N8nIngestionView(APIView):
    authentication_classes = [N8nAPIKeyAuthentication]
    permission_classes = [IsN8nServiceUser]

    def post(self, request):
        serializer = IncomingOpportunitySerializer(data=request.data)
        if not serializer.is_valid():
            IngestionLog.objects.create(
                payload=request.data,
                status="rejected",
                errors=serializer.errors
            )
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        validated = serializer.validated_data
        
        # M2M relationship must be popped out to prevent update_or_create type errors
        eligible_countries = validated.pop("eligible_home_countries", [])

        # Clean title and description of incoming payload to resolve spelling errors
        from apps.ingestion.services import IngestionService
        validated["title"] = IngestionService._fix_spelling_errors(validated["title"])
        validated["description"] = IngestionService._fix_spelling_errors(validated["description"])

        # Create or update based on unique source_url
        opportunity, created = Opportunity.objects.update_or_create(
            source_url=validated["source_url"],
            defaults=validated
        )
        opportunity.eligible_home_countries.set(eligible_countries)

        # Log the operation outcome
        IngestionLog.objects.create(
            payload=request.data,
            status="created" if created else "updated",
            opportunity=opportunity
        )
        
        return Response(
            {"id": opportunity.id, "created": created}, 
            status=status.HTTP_201_CREATED
        )
