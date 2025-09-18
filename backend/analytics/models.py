from django.db import models
from django.contrib.auth.models import User

class Site(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE)
    site_id = models.CharField(max_length=100, unique=True)
    domain = models.CharField(max_length=255)
# Create your models here.
