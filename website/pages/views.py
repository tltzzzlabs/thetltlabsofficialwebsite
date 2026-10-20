import json
import logging
from dotenv import load_dotenv
from django.http import JsonResponse

load_dotenv()
logger = logging.getLogger(__name__)

@ensure_csrf_cookie
@require_GET
def index(request):
    return render(request, "isochrone/index.html", {
        "browser_ak": settings.BROWSER_AK,
    })

