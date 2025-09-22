from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count, Avg, Min, Max, Q
from django.utils import timezone
from datetime import timedelta
from .models import Event, Site
from .serializers import EventSerializer, SiteSerializer
import dateutil.parser
from django.contrib.auth.models import User

from django.http import HttpResponse
from django.views.decorators.http import require_GET

@require_GET
def tracker_js(request):
    js_code = """
   (function() {
  // Read site id from a global or from the current script tag data attribute
  const scriptEl = document.currentScript;
  const siteId = window.SITE_ID || (scriptEl && scriptEl.dataset && scriptEl.dataset.siteId) || window.__SITE_ID__;

  // Simple cookie helpers
  function getCookie(name) {
    const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
  }
  function setCookie(name, value, days) {
    const d = new Date();
    d.setTime(d.getTime() + (days*24*60*60*1000));
    const expires = 'expires=' + d.toUTCString();
    document.cookie = name + '=' + encodeURIComponent(value) + '; ' + expires + '; path=/; SameSite=Lax';
  }

  // Ensure we have a persistent session id
  let sessionId = getCookie('wa_session_id');
  if (!sessionId) {
    sessionId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now();
    setCookie('wa_session_id', sessionId, 1); // 1 day
  }

  const eventData = {
    site_id: siteId,
    url: window.location.href,
    referrer: document.referrer,
    user_agent: navigator.userAgent,
    language: navigator.language,
    screen_width: window.innerWidth,
    screen_height: window.innerHeight,
    session_id: sessionId,
  };

  // Post to local backend ingest endpoint
  fetch("https://lakshitajain.pythonanywhere.com/track/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(eventData),
    credentials: 'include', // allow cookie roundtrip
  }).catch(err => console.error("Tracking error:", err));
})();
    """
    return HttpResponse(js_code, content_type="application/javascript")

@api_view(["POST"])
@permission_classes([AllowAny])
def register_user(request):
    print(0)
    username = request.data.get("username")
    password = request.data.get("password")
    if User.objects.filter(username=username).exists():
        print(13)
        return Response({"error": "Username already taken"}, status=400)
    print(1)
    user = User.objects.create_user(username=username, password=password)
    print(2)
    return Response({"message": "User created successfully"})


# ingest endpoint used by tracker.js (AllowAny)
@api_view(["POST"])
@permission_classes([AllowAny])
def track_event(request):
    data = request.data.copy()
    # DEBUG: log incoming payload and site existence
    try:
        incoming_site_id = data.get("site_id")
        site_exists = False
        cleaned = None
        if incoming_site_id is not None:
            cleaned = str(incoming_site_id)
            site_exists = Site.objects.filter(site_id=cleaned).exists()
        print(
            f"[track_event] site_id raw={repr(incoming_site_id)} len={len(incoming_site_id) if isinstance(incoming_site_id, str) else 'n/a'} exists={site_exists}"
        )
    except Exception as e:
        print(f"[track_event] debug error: {e}")
    if "timestamp" in data:
        try:
            data["timestamp"] = dateutil.parser.isoparse(data["timestamp"])
        except Exception:
            data["timestamp"] = timezone.now()
    else:
        data["timestamp"] = timezone.now()

    serializer = EventSerializer(data=data)
    if serializer.is_valid():
        serializer.save()
        return Response({"status": "ok"}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# create site for a logged in user (returns site_id)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_site(request):
    if not request.user.is_authenticated:
        return Response({"error": "must be logged in"}, status=403)
    domain = request.data.get("domain")
    if not domain:
        return Response({"error": "domain required"}, status=400)
    import uuid
    site_id = str(uuid.uuid4())
    site = Site.objects.create(owner=request.user, domain=domain, site_id=site_id)
    return Response({"site_id": site.site_id, "domain": site.domain})

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_sites(request):
    sites = Site.objects.filter(owner=request.user)
    return Response(SiteSerializer(sites, many=True).data)

def ensure_site_belongs_to_user(user, site_id):
    site = Site.objects.filter(site_id=site_id, owner=user).first()
    return site

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def page_views(request, site_id):
    site = ensure_site_belongs_to_user(request.user, site_id)
    if not site:
        return Response({"error": "not allowed"}, status=403)

    from django.db.models.functions import TruncDate
    last_n_days = request.query_params.get("days", 30)
    try:
        last_n_days = int(last_n_days)
    except:
        last_n_days = 30
    since = timezone.now() - timedelta(days=last_n_days)
    trend_qs = (
        Event.objects.filter(site=site, timestamp__gte=since)
        .annotate(day=TruncDate("timestamp"))
        .values("day")
        .annotate(views=Count("id"))
        .order_by("day")
    )
    trend = [{"date": r["day"], "views": r["views"]} for r in trend_qs]

    # top pages
    top_qs = (
        Event.objects.filter(site=site, timestamp__gte=since)
        .values("url")
        .annotate(views=Count("id"))
        .order_by("-views")[:10]
    )
    top = list(top_qs)
    return Response({"trend": trend, "top_pages": top})

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def sessions_metrics(request, site_id):
    site = ensure_site_belongs_to_user(request.user, site_id)
    if not site:
        return Response({"error": "not allowed"}, status=403)

    # reasonable sessionization: events grouped by session_id
    # For each session_id compute start and end times and duration.
    from django.db.models import Min, Max
    since = timezone.now() - timedelta(days=int(request.query_params.get("days", 30)))

    sessions = (
        Event.objects.filter(site=site, timestamp__gte=since)
        .values("session_id")
        .annotate(start=Min("timestamp"), end=Max("timestamp"), count=Count("id"))
    )

    session_list = []
    total_duration_seconds = 0
    for s in sessions:
        duration = (s["end"] - s["start"]).total_seconds()
        session_list.append(
            {"session_id": s["session_id"], "start": s["start"], "end": s["end"], "duration": duration, "events": s["count"]}
        )
        total_duration_seconds += duration

    session_count = len(session_list)
    avg_duration = total_duration_seconds / session_count if session_count else 0

    # trend by day: number of sessions per day (use start date)
    from django.db.models.functions import TruncDate
    session_starts = (
        Event.objects.filter(site=site, timestamp__gte=since)
        .values("session_id")
        .annotate(start=Min("timestamp"))
        .annotate(day=TruncDate("start"))
        .values("day")
        .annotate(sessions=Count("session_id"))
        .order_by("day")
    )
    trend = [{"date": r["day"], "sessions": r["sessions"]} for r in session_starts]

    return Response({"session_count": session_count, "avg_duration_seconds": avg_duration, "trend": trend})

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def new_vs_returning(request, site_id):
    site = ensure_site_belongs_to_user(request.user, site_id)
    if not site:
        return Response({"error": "not allowed"}, status=403)

    since = timezone.now() - timedelta(days=int(request.query_params.get("days", 30)))
    # define 'new' users as those session_ids whose first ever event (for this site) occurred within the window
    # and 'returning' as session_ids with previous event before window
    session_first = (
        Event.objects.filter(site=site)
        .values("session_id")
        .annotate(first_ts=Min("timestamp"))
    )
    new = 0
    returning = 0
    for s in session_first:
        if s["first_ts"] >= since:
            new += 1
        else:
            returning += 1

    # daily trend for both new and returning sessions
    from django.db.models.functions import TruncDate
    from django.db.models import OuterRef, Subquery, Q

    # Subquery to fetch first timestamp per session
    first_ts_sub = (
        Event.objects.filter(site=site, session_id=OuterRef("session_id"))
        .values("session_id")
        .annotate(first_ts=Min("timestamp"))
        .values("first_ts")[:1]
    )

    daily = (
        Event.objects.filter(site=site, timestamp__gte=since)
        .annotate(day=TruncDate("timestamp"))
        .annotate(first_ts=Subquery(first_ts_sub))
        .values("day")
        .annotate(
            new_sessions=Count("session_id", filter=Q(first_ts__gte=since), distinct=True),
            returning_sessions=Count("session_id", filter=Q(first_ts__lt=since), distinct=True),
        )
        .order_by("day")
    )
    daily_trend = [
        {
            "date": r["day"],
            "new_sessions": r["new_sessions"],
            "returning_sessions": r["returning_sessions"],
        }
        for r in daily
    ]

    return Response({"new": new, "returning": returning, "daily": daily_trend})

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def sources(request, site_id):
    site = ensure_site_belongs_to_user(request.user, site_id)
    if not site:
        return Response({"error": "not allowed"}, status=403)
    since = timezone.now() - timedelta(days=int(request.query_params.get("days", 30)))

    # use utm_source if present else derive from referrer host
    from urllib.parse import urlparse
    qs = Event.objects.filter(site=site, timestamp__gte=since)
    sources = {}
    for ev in qs.values("utm_source", "referrer"):
        if ev["utm_source"]:
            key = ev["utm_source"].lower()
        elif ev["referrer"]:
            try:
                parsed = urlparse(ev["referrer"])
                key = parsed.netloc or "direct"
            except:
                key = "referral"
        else:
            key = "direct"
        sources[key] = sources.get(key, 0) + 1
    output = [{"source": k, "count": v} for k, v in sorted(sources.items(), key=lambda x: -x[1])]
    return Response(output)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def devices(request, site_id):
    site = ensure_site_belongs_to_user(request.user, site_id)
    if not site:
        return Response({"error": "not allowed"}, status=403)
    since = timezone.now() - timedelta(days=int(request.query_params.get("days", 30)))

    # naive device classification by user_agent string
    qs = Event.objects.filter(site=site, timestamp__gte=since)
    counts = {"mobile": 0, "desktop": 0, "tablet": 0, "bot": 0, "unknown": 0}
    for row in qs.values_list("user_agent", flat=True):
        ua = (row or "").lower()
        if "mobile" in ua and "tablet" not in ua:
            counts["mobile"] += 1
        elif "tablet" in ua or "ipad" in ua:
            counts["tablet"] += 1
        elif "bot" in ua or "spider" in ua or "crawl" in ua:
            counts["bot"] += 1
        elif ua:
            counts["desktop"] += 1
        else:
            counts["unknown"] += 1
    out = [{"device": k, "count": v} for k, v in counts.items()]
    return Response(out)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def browsers(request, site_id):
    site = ensure_site_belongs_to_user(request.user, site_id)
    if not site:
        return Response({"error": "not allowed"}, status=403)
    since = timezone.now() - timedelta(days=int(request.query_params.get("days", 30)))

    # naive browser family extraction
    qs = Event.objects.filter(site=site, timestamp__gte=since)
    counts = {}
    for ua in qs.values_list("user_agent", flat=True):
        ua_low = (ua or "").lower()
        fam = "other"
        if "chrome" in ua_low and "edg" not in ua_low and "chromium" not in ua_low:
            fam = "Chrome"
        elif "firefox" in ua_low:
            fam = "Firefox"
        elif "safari" in ua_low and "chrome" not in ua_low:
            fam = "Safari"
        elif "edg" in ua_low or "edge" in ua_low:
            fam = "Edge"
        elif "opr" in ua_low or "opera" in ua_low:
            fam = "Opera"
        counts[fam] = counts.get(fam, 0) + 1
    out = [{"browser": k, "count": v} for k, v in sorted(counts.items(), key=lambda x: -x[1])]
    return Response(out)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def geography(request, site_id):
    site = ensure_site_belongs_to_user(request.user, site_id)
    if not site:
        return Response({"error": "not allowed"}, status=403)
    since = timezone.now() - timedelta(days=int(request.query_params.get("days", 30)))
    qs = Event.objects.filter(site=site, timestamp__gte=since)
    counts = {}
    for c in qs.values_list("country", flat=True):
        key = (c or "Unknown")
        counts[key] = counts.get(key, 0) + 1
    out = [{"country": k, "count": v} for k, v in sorted(counts.items(), key=lambda x: -x[1])]
    return Response(out)

from django.db.models import Q

def _parse_date_range(request):
    """Parse start/end or preset/days into a datetime window.
    Supports:
      - start=YYYY-MM-DD&end=YYYY-MM-DD
      - preset in {last_7d,last_14d,last_30d,this_month,last_month}
      - days=N (fallback, default 30)
    Returns (since, until) where until is now if not specified.
    """
    now = timezone.now()
    start = request.query_params.get("start")
    end = request.query_params.get("end")
    preset = request.query_params.get("preset")
    days = request.query_params.get("days")

    if start and end:
        try:
            since = dateutil.parser.isoparse(start)
            until = dateutil.parser.isoparse(end)
            return since, until
        except Exception:
            pass

    if preset:
        from calendar import monthrange
        if preset == "last_7d":
            return now - timedelta(days=7), now
        if preset == "last_14d":
            return now - timedelta(days=14), now
        if preset == "last_30d":
            return now - timedelta(days=30), now
        if preset == "this_month":
            first = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            return first, now
        if preset == "last_month":
            first_this = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            last_month_end = first_this - timedelta(seconds=1)
            first_last = last_month_end.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            return first_last, last_month_end

    try:
        d = int(days) if days is not None else 30
    except Exception:
        d = 30
    return now - timedelta(days=d), now

def _apply_segment_filters(qs, request):
    """Apply optional filters to an Event queryset.
    - services: comma-separated utm_source values (case-insensitive)
    - posts: url path prefix (single value or comma-separated), matches startswith
    """
    services = request.query_params.get("services")
    posts = request.query_params.get("posts")

    if services:
        parts = [p.strip().lower() for p in services.split(",") if p.strip()]
        if parts:
            cond = Q()
            for p in parts:
                cond |= Q(utm_source__iexact=p)
            qs = qs.filter(cond)

    if posts:
        prefixes = [p.strip() for p in posts.split(",") if p.strip()]
        cond = Q()
        for pref in prefixes:
            cond |= Q(url__startswith=pref)
        if prefixes:
            qs = qs.filter(cond)
    return qs

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def kpis(request, site_id):
    """Aggregate KPIs for the dashboard, with optional comparison window.
    Returns:
    {
      period: { start, end },
      compare: { start, end } | null,
      totals: {
        page_views, sessions, users, top_country
      },
      deltas: { page_views_pct, sessions_pct, users_pct } | null
    }
    """
    site = ensure_site_belongs_to_user(request.user, site_id)
    if not site:
        return Response({"error": "not allowed"}, status=403)

    since, until = _parse_date_range(request)
    compare_flag = str(request.query_params.get("compare", "false")).lower() in ("1", "true", "yes")

    base_qs = Event.objects.filter(site=site, timestamp__gte=since, timestamp__lte=until)
    base_qs = _apply_segment_filters(base_qs, request)

    # Compute sessions: distinct session_id
    sessions = base_qs.values("session_id").distinct().count()
    # Users: same as sessions for now (can switch to visitor_id later)
    users = sessions
    # Page views: count of events
    page_views_cnt = base_qs.count()
    # Top country
    top_country = (
        base_qs.values("country").annotate(c=Count("id")).order_by("-c").first()
    )
    top_country_name = top_country.get("country") if top_country else None

    res = {
        "period": {"start": since, "end": until},
        "compare": None,
        "totals": {
            "page_views": page_views_cnt,
            "sessions": sessions,
            "users": users,
            "top_country": top_country_name or "Unknown",
        },
        "deltas": None,
    }

    if compare_flag:
        # mirror window backward
        window = until - since
        prev_end = since
        prev_start = prev_end - window
        prev_qs = Event.objects.filter(site=site, timestamp__gte=prev_start, timestamp__lte=prev_end)
        prev_qs = _apply_segment_filters(prev_qs, request)

        prev_sessions = prev_qs.values("session_id").distinct().count()
        prev_users = prev_sessions
        prev_page_views = prev_qs.count()

        def pct(cur, prev):
            if prev == 0:
                return 100.0 if cur > 0 else 0.0
            return ((cur - prev) / prev) * 100.0

        res["compare"] = {"start": prev_start, "end": prev_end}
        res["deltas"] = {
            "page_views_pct": pct(page_views_cnt, prev_page_views),
            "sessions_pct": pct(sessions, prev_sessions),
            "users_pct": pct(users, prev_users),
        }

    return Response(res)
