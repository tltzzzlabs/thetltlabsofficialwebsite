import json
import logging
from dotenv import load_dotenv
from django.http import JsonResponse
from django.conf import settings
from django.shortcuts import render
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_POST

load_dotenv()
logger = logging.getLogger(__name__)

@ensure_csrf_cookie
@require_GET
def index(request):
    return render(request, "pages/index.html")

