from django.contrib import admin
from .models import Activity


@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = ["title", "start_date", "end_date", "location", "status", "organizer"]
    list_filter = ["status", "category", "start_date"]
    search_fields = ["title", "location", "organizer"]
    ordering = ["start_date"]
