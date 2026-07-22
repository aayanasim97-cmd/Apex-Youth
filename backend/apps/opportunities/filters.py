from datetime import timedelta
from django.db.models import Q
from django.utils import timezone
import django_filters
from apps.opportunities.models import Opportunity

class OpportunityFilter(django_filters.FilterSet):
    category = django_filters.CharFilter(field_name="category__slug")
    age = django_filters.NumberFilter(method="filter_by_age")
    home_country = django_filters.CharFilter(method="filter_by_home_country")
    destination_country = django_filters.CharFilter(field_name="destination_country__iso_code", lookup_expr="iexact")
    mode = django_filters.CharFilter(method="filter_by_mode")
    last_minute = django_filters.BooleanFilter(method="filter_last_minute")
    status = django_filters.CharFilter(method="filter_by_status")
    search = django_filters.CharFilter(method="filter_by_search")

    class Meta:
        model = Opportunity
        fields = ["category", "is_online", "is_onsite"]

    def filter_by_age(self, qs, name, value):
        return qs.filter(
            Q(min_age__lte=value) | Q(min_age__isnull=True)
        ).filter(
            Q(max_age__gte=value) | Q(max_age__isnull=True)
        )

    def filter_by_home_country(self, qs, name, value):
        """
        'value' is the user's home country ISO code, e.g. 'PK'.
        Match ANY of:
          1. eligible_home_countries contains this country (explicit region match)
          2. is_worldwide is True (open to everyone regardless of location)
          3. is_online is True (remote opportunities aren't location-gated)
        .distinct() is required because the M2M join can return duplicates.
        """
        return qs.filter(
            Q(eligible_home_countries__iso_code__iexact=value)
            | Q(is_worldwide=True)
            | Q(is_online=True)
        ).distinct()

    def filter_by_mode(self, qs, name, value):
        if value == "online":
            return qs.filter(is_online=True)
        if value == "onsite":
            return qs.filter(is_onsite=True)
        return qs

    def filter_last_minute(self, qs, name, value):
        if not value:
            return qs
        today = timezone.now().date()
        # Returns opportunities with deadline between 3 and 5 days from now
        return qs.filter(deadline__range=[today + timedelta(days=3), today + timedelta(days=5)])

    def filter_by_status(self, qs, name, value):
        today = timezone.now().date()
        if value == "open":
            return qs.filter(
                deadline__gte=today
            ).filter(
                Q(start_date__lte=today) | Q(start_date__isnull=True)
            )
        elif value == "upcoming":
            return qs.filter(
                Q(start_date__gte=today) |
                Q(start_date__isnull=True, deadline__gte=today)
            )
        return qs

    def filter_by_search(self, qs, name, value):
        if not value:
            return qs
        return qs.filter(
            Q(title__icontains=value) | Q(description__icontains=value)
        )
