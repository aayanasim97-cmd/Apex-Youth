from django.contrib import admin
from apps.opportunities.models import Opportunity, Category, Country

@admin.register(Country)
class CountryAdmin(admin.ModelAdmin):
    list_display = ("name", "iso_code")
    search_fields = ("name", "iso_code")
    ordering = ("name",)

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("slug", "__str__")

@admin.register(Opportunity)
class OpportunityAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "deadline", "is_active", "is_worldwide", "is_online")
    list_filter = ("category", "is_active", "is_worldwide", "is_online", "is_onsite")
    search_fields = ("title", "description", "source_url")
    filter_horizontal = ("eligible_home_countries",)
    date_hierarchy = "deadline"
