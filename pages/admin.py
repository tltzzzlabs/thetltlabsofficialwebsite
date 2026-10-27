from django.contrib import admin
from .models import Activity, Project


@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = ["title", "start_date", "end_date", "organizer"]
    list_filter = ["category", "start_date"]
    search_fields = ["title", "location", "organizer"]
    ordering = ["start_date"]


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ["title", "order", "created_at"]
    list_editable = ["order"]
    search_fields = ["title", "description"]
