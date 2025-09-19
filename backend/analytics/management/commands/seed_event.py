import random
from datetime import timedelta, datetime
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from analytics.models import Site, Event
from django.utils import timezone
import uuid

class Command(BaseCommand):
    help = "Seed dummy events for testing analytics"

    def handle(self, *args, **kwargs):
        # Create a test user
        user, _ = User.objects.get_or_create(username="demo")
        user.set_password("demo123")
        user.save()

        # Create site
        site, _ = Site.objects.get_or_create(
            owner=user,
            domain="example.com",
            defaults={"site_id": str(uuid.uuid4())}
        )

        # Remove old events
        Event.objects.filter(site=site).delete()

        now = timezone.now()
        countries = ["India", "USA", "Germany", "France", "Brazil"]
        referrers = ["google.com", "facebook.com", "twitter.com", "direct"]
        devices = ["Desktop", "Mobile", "Tablet"]

        for day in range(7):  # last 7 days
            for i in range(random.randint(20, 50)):
                timestamp = now - timedelta(days=day, minutes=random.randint(0, 1440))
                Event.objects.create(
                    site=site,
                    event_type="pageview",
                    url=f"/page/{random.randint(1, 5)}",
                    referrer=random.choice(referrers),
                    utm_source=None,
                    user_agent=random.choice(devices),
                    language="en-US",
                    screen_width=random.choice([1920, 1366, 390]),
                    screen_height=random.choice([1080, 768, 844]),
                    session_id=str(uuid.uuid4()),
                    ip_address="127.0.0.1",
                    country=random.choice(countries),
                    timestamp=timestamp,
                )

        self.stdout.write(self.style.SUCCESS("✅ Dummy events created successfully!"))
