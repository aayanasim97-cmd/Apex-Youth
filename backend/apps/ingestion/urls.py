from django.urls import path
from apps.ingestion.views import N8nIngestionView

urlpatterns = [
    path('ingest/', N8nIngestionView.as_view(), name='n8n-ingest'),
]
