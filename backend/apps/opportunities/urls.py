from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.opportunities.views import OpportunityViewSet, CategoryViewSet, CountryViewSet, AdminAnalyticsView

router = DefaultRouter()
router.register(r'opportunities', OpportunityViewSet, basename='opportunity')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'countries', CountryViewSet, basename='country')

urlpatterns = [
    path('admin/analytics/', AdminAnalyticsView.as_view(), name='admin-analytics'),
    path('', include(router.urls)),
]
