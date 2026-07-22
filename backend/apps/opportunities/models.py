from django.db import models

class Country(models.Model):
    name = models.CharField(max_length=100, unique=True)
    iso_code = models.CharField(max_length=3, unique=True)  # e.g., 'DE', 'PK', 'US'

    class Meta:
        verbose_name_plural = "Countries"
        indexes = [
            models.Index(fields=["name"]),
            models.Index(fields=["iso_code"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.iso_code})"


class Category(models.Model):
    LEARNING = "learning"
    VOLUNTEERING = "volunteering"
    WORKING = "working"
    MAKING_CHANGE = "making_change"
    COMPETING = "competing"
    
    CATEGORY_CHOICES = [
        (LEARNING, "Learning & Scholarships"),
        (VOLUNTEERING, "Volunteering"),
        (WORKING, "Working & Internships"),
        (MAKING_CHANGE, "Making a Change"),
        (COMPETING, "Competing"),
    ]
    
    slug = models.CharField(max_length=30, choices=CATEGORY_CHOICES, unique=True)

    class Meta:
        verbose_name_plural = "Categories"

    def __str__(self):
        return dict(self.CATEGORY_CHOICES).get(self.slug, self.slug)


class Opportunity(models.Model):
    title = models.CharField(max_length=255, db_index=True)
    description = models.TextField()  # AI-generated summary
    source_url = models.URLField(max_length=500, unique=True)  # de-duplication key
    application_url = models.URLField(max_length=500, null=True, blank=True)
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="opportunities")

    min_age = models.PositiveSmallIntegerField(null=True, blank=True)
    max_age = models.PositiveSmallIntegerField(null=True, blank=True)

    # M2M to support opportunities open to multiple specific home countries
    eligible_home_countries = models.ManyToManyField(
        Country, blank=True, related_name="eligible_opportunities"
    )
    
    # Explicit flag indicating whether this is open to everyone worldwide
    is_worldwide = models.BooleanField(default=False, db_index=True)

    destination_country = models.ForeignKey(
        Country, 
        null=True, 
        blank=True,
        related_name="destination_opportunities", 
        on_delete=models.SET_NULL
    )

    is_online = models.BooleanField(default=False)
    is_onsite = models.BooleanField(default=False)

    deadline = models.DateField(db_index=True)
    start_date = models.DateField(null=True, blank=True, db_index=True)
    is_active = models.BooleanField(default=True, db_index=True)  # soft-disable expired posts

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["deadline", "is_active"]),
            models.Index(fields=["min_age", "max_age"]),
            models.Index(fields=["is_worldwide", "is_online"]),
            models.Index(fields=["-created_at"]),
        ]
        ordering = ["-created_at"]

    def __str__(self):
        return self.title
