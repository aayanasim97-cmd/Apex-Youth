from django.utils import timezone
from rest_framework import serializers
from apps.opportunities.models import Opportunity, Category, Country

class CountrySerializer(serializers.ModelSerializer):
    class Meta:
        model = Country
        fields = ["name", "iso_code"]


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["slug"]


class OpportunitySerializer(serializers.ModelSerializer):
    category = serializers.SlugRelatedField(
        slug_field="slug", 
        queryset=Category.objects.all()
    )
    eligible_home_countries = serializers.SlugRelatedField(
        slug_field="iso_code", 
        queryset=Country.objects.all(), 
        many=True, 
        required=False
    )
    destination_country = serializers.SlugRelatedField(
        slug_field="iso_code", 
        queryset=Country.objects.all(), 
        allow_null=True, 
        required=False
    )
    days_until_deadline = serializers.SerializerMethodField()

    class Meta:
        model = Opportunity
        fields = [
            "id",
            "title",
            "description",
            "source_url",
            "application_url",
            "category",
            "min_age",
            "max_age",
            "eligible_home_countries",
            "is_worldwide",
            "destination_country",
            "is_online",
            "is_onsite",
            "deadline",
            "start_date",
            "days_until_deadline",
            "is_active",
            "created_at",
            "updated_at",
        ]

    def get_days_until_deadline(self, obj):
        if obj.deadline:
            return (obj.deadline - timezone.now().date()).days
        return None
