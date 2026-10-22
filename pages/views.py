import json
import logging
from dotenv import load_dotenv
from django.http import JsonResponse
from django.conf import settings
from django.shortcuts import render
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_POST

from .models import Activity

load_dotenv()
logger = logging.getLogger(__name__)

@ensure_csrf_cookie
@require_GET
def index(request):
    activities = Activity.objects.all()
    return render(request, "pages/index.html", {"activities": activities})

