from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from apps.opportunities.models import Opportunity, Category, Country
from apps.opportunities.serializers import OpportunitySerializer, CategorySerializer, CountrySerializer
from apps.opportunities.filters import OpportunityFilter
from apps.core.pagination import OpportunityCursorPagination
from apps.ingestion.models import IngestionLog

class OpportunityViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint that allows opportunities to be viewed.
    """
    queryset = (
        Opportunity.objects.filter(is_active=True)
        .select_related("category", "destination_country")
        .prefetch_related("eligible_home_countries")
    )
    serializer_class = OpportunitySerializer
    pagination_class = OpportunityCursorPagination
    filterset_class = OpportunityFilter

    def filter_queryset(self, queryset):
        filtered_qs = super().filter_queryset(queryset)
        # Print SQL query for debugging
        print("\n--- GENERATED SQL QUERY ---")
        print(filtered_qs.query)
        print("----------------------------\n")
        return filtered_qs


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint that allows categories to be viewed.
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    pagination_class = None  # Return all categories without pagination


class CountryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint that allows countries to be viewed.
    """
    queryset = Country.objects.all().order_by("name")
    serializer_class = CountrySerializer
    pagination_class = None  # Return all countries without pagination


class AdminAnalyticsView(APIView):
    """
    API endpoint that returns system analytics & pipeline metrics for admin users.
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        total_opportunities = Opportunity.objects.count()
        active_opportunities = Opportunity.objects.filter(is_active=True).count()
        
        # Query pipeline run ingestion logs stats
        total_logs = IngestionLog.objects.count()
        created_logs = IngestionLog.objects.filter(status="created").count()
        updated_logs = IngestionLog.objects.filter(status="updated").count()
        rejected_logs = IngestionLog.objects.filter(status="rejected").count()

        # Last 15 ingestion logs for auditing pipeline behavior
        latest_logs = []
        for log in IngestionLog.objects.all().select_related("opportunity")[:15]:
            latest_logs.append({
                "id": log.id,
                "status": log.status,
                "errors": log.errors,
                "created_at": log.created_at.isoformat(),
                "opportunity_title": log.opportunity.title if log.opportunity else None
            })

        return Response({
            "total_opportunities": total_opportunities,
            "active_opportunities": active_opportunities,
            "expired_purged_count": total_logs - active_opportunities if total_logs > active_opportunities else 0,
            "total_logs": total_logs,
            "created_logs": created_logs,
            "updated_logs": updated_logs,
            "rejected_logs": rejected_logs,
            "latest_logs": latest_logs
        })
