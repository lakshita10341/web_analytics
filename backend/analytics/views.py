from django.shortcuts import render
import uuid
from django.contrib.auth.models import User
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from .models import Site

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

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_site(request):
    domain = request.data.get("domain")
    site_id = str(uuid.uuid4())
    site = Site.objects.create(owner=request.user, domain=domain, site_id=site_id)
    return Response({"site_id": site.site_id})

