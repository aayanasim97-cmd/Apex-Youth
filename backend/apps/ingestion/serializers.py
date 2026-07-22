from rest_framework import serializers
from django.utils import timezone
from apps.opportunities.models import Category, Country

class IncomingOpportunitySerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255)
    description = serializers.CharField()
    source_url = serializers.URLField(max_length=500)
    application_url = serializers.URLField(max_length=500, required=False, allow_null=True, allow_blank=True)
    category = serializers.SlugRelatedField(
        slug_field="slug",
        queryset=Category.objects.all()
    )
    min_age = serializers.IntegerField(required=False, allow_null=True)
    max_age = serializers.IntegerField(required=False, allow_null=True)
    eligible_home_countries = serializers.SlugRelatedField(
        slug_field="iso_code",
        queryset=Country.objects.all(),
        many=True,
        required=False
    )
    is_worldwide = serializers.BooleanField(default=False)
    destination_country = serializers.SlugRelatedField(
        slug_field="iso_code",
        queryset=Country.objects.all(),
        allow_null=True,
        required=False
    )
    is_online = serializers.BooleanField(default=False)
    is_onsite = serializers.BooleanField(default=False)
    deadline = serializers.DateField()

    def validate_deadline(self, value):
        if value < timezone.now().date():
            raise serializers.ValidationError("Deadline cannot be in the past.")
        return value

    def validate(self, data):
        min_age = data.get("min_age")
        max_age = data.get("max_age")
        if min_age is not None and max_age is not None and min_age > max_age:
            raise serializers.ValidationError({"min_age": "min_age cannot be greater than max_age."})
        return data
