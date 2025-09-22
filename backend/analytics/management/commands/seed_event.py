import random
from datetime import timedelta
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

        # Create or get a demo site
        site, created = Site.objects.get_or_create(
            owner=user,
            domain="example.com",
            defaults={"site_id": str(uuid.uuid4())},
        )

        # Remove old events for a clean slate
        Event.objects.filter(site=site).delete()

        now = timezone.now()
        countries = ["India", "USA", "Germany", "France", "Brazil", "UK", "Canada"]
        utm_sources = ["google", "twitter", "facebook", "newsletter", "linkedin", None]
        referrers = [
            "https://google.com",
            "https://twitter.com",
            "https://facebook.com",
            "https://news.example.com",
            "",
        ]
        devices = [
            # desktop
            ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36", 1920, 1080),
            ("Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15", 1440, 900),
            # mobile
            ("Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Mobile Safari/537.36", 390, 844),
            ("Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1", 414, 896),
            # tablet
            ("Mozilla/5.0 (iPad; CPU OS 16_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1", 1024, 1366),
        ]
        url_pool = [
            "/",
            "/page1",
            "/page2",
            "/landing/service-a",
            "/landing/service-b",
            "/blog/page1",
            "/blog/page2",
            "/docs/install",
            "/docs/usage",
        ]

        # Generate data for the last 60 days
        for day in range(60):
            day_dt = now - timedelta(days=day)
            # sessions per day
            sessions_today = random.randint(15, 40)
            for _ in range(sessions_today):
                session_id = str(uuid.uuid4())
                ua, sw, sh = random.choice(devices)
                src = random.choice(utm_sources)
                ref = random.choice(referrers)
                country = random.choice(countries)

                # each session has 1-5 pageviews spread across the day
                pageviews = random.randint(1, 5)
                start_min = random.randint(0, 1200)
                for j in range(pageviews):
                    timestamp = day_dt - timedelta(minutes=start_min + j * random.randint(1, 30))
                    url = random.choice(url_pool)
                    Event.objects.create(
                        site=site,
                        event_type="pageview",
                        url=url,
                        referrer=ref if ref else None,
                        utm_source=src,
                        user_agent=ua,
                        language="en-US",
                        screen_width=sw,
                        screen_height=sh,
                        session_id=session_id,
                        ip_address="127.0.0.1",
                        country=country,
                        timestamp=timestamp,
                    )

        self.stdout.write(self.style.SUCCESS("✅ Dummy events created successfully!"))
        self.stdout.write(self.style.SUCCESS(f"Site domain: {site.domain}"))
        self.stdout.write(self.style.SUCCESS(f"Site ID: {site.site_id}"))
