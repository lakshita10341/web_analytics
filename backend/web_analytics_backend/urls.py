"""
URL configuration for web_analytics_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from analytics.views import register_user, create_site, track_event, page_views, sessions_metrics, new_vs_returning, sources, devices, browsers, geography, list_sites
from rest_framework.decorators import api_view, permission_classes

urlpatterns = [
    path('admin/', admin.site.urls),
    path("api/signup/", register_user, name="signup"),
    path("api/login/", TokenObtainPairView.as_view(), name="login"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/sites/", list_sites, name="list-sites"),
    path("api/create-site/", create_site, name="create-site"),
    path("track/", track_event, name="track-event"),
    path("analytics/pages/<str:site_id>/", page_views, name="page-views"),
    path("analytics/sessions/<str:site_id>/", sessions_metrics, name="sessions"),
    path("analytics/new-vs-returning/<str:site_id>/", new_vs_returning, name="new-returning"),
    path("analytics/sources/<str:site_id>/",  sources, name="sources"),
    path("analytics/devices/<str:site_id>/", devices, name="devices"),
    path("analytics/browsers/<str:site_id>/", browsers, name="browsers"),
    path("analytics/geography/<str:site_id>/", geography, name="geography"),
]
