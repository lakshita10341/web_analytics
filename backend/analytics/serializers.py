from rest_framework import serializers
from .models import Event, Site

class EventSerializer(serializers.ModelSerializer):
    site_id = serializers.CharField(write_only=True)

    class Meta:
        model = Event
        fields = [
            "site_id",
            "event_type",
            "url",
            "referrer",
            "utm_source",
            "user_agent",
            "language",
            "screen_width",
            "screen_height",
            "session_id",
            "ip_address",
            "country",
            "timestamp",
        ]

    def create(self, validated_data):
        site_id = validated_data.pop("site_id")
        from .models import Site
        site = Site.objects.filter(site_id=site_id).first()
        if not site:
            raise serializers.ValidationError({"site_id": "invalid site_id"})
        event = Event.objects.create(site=site, **validated_data)
        return event

class SiteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Site
        fields = ["id", "site_id", "domain"]
