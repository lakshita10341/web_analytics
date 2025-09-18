from django.db import models
from django.contrib.auth.models import User

class Site(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sites")
    site_id = models.CharField(max_length=100, unique=True)
    domain = models.CharField(max_length=255)

    def __str__(self):
        return f"{self.domain} ({self.site_id})"

class Event(models.Model):
    # matches tracker.js payload
    site = models.ForeignKey(Site, on_delete=models.CASCADE, related_name="events")
    event_type = models.CharField(max_length=50, default="pageview")
    url = models.TextField()
    referrer = models.TextField(null=True, blank=True)
    utm_source = models.CharField(max_length=100, null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    language = models.CharField(max_length=20, null=True, blank=True)
    screen_width = models.IntegerField(null=True, blank=True)
    screen_height = models.IntegerField(null=True, blank=True)
    session_id = models.CharField(max_length=100, db_index=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    country = models.CharField(max_length=100, null=True, blank=True)  # optional geo
    timestamp = models.DateTimeField()

    def __str__(self):
        return f"Event {self.event_type} @ {self.url} ({self.site_id if hasattr(self,'site') else ''})"
