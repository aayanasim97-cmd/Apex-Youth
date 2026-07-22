from django.db import models
from apps.opportunities.models import Opportunity

class IngestionLog(models.Model):
    STATUS_CHOICES = [
        ("created", "Created"),
        ("updated", "Updated"),
        ("rejected", "Rejected"),
    ]

    payload = models.JSONField(help_text="Raw payload received from n8n")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    errors = models.JSONField(null=True, blank=True, help_text="Serializer validation errors if rejected")
    opportunity = models.ForeignKey(
        Opportunity,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="ingestion_logs"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        return f"IngestionLog {self.id} - {self.status} at {self.created_at}"
