from django.db import models


class Activity(models.Model):
    STATUS_CHOICES = [
        ("upcoming", "即将举行"),
        ("ongoing", "进行中"),
        ("ended", "已结束"),
    ]

    title = models.CharField("标题", max_length=200)
    description = models.TextField("描述")
    start_date = models.DateTimeField("活动开始", default=None)
    end_date = models.DateTimeField("活动结束", default=None)
    location = models.CharField("活动地点", max_length=200)
    link = models.URLField("活动链接", blank=True)
    status = models.CharField("状态", max_length=10, choices=STATUS_CHOICES, default="upcoming")
    category = models.CharField("分类标签", max_length=100, blank=True)
    organizer = models.CharField("组织者", max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-start_date"]
        verbose_name = "活动"
        verbose_name_plural = "活动"

    def __str__(self):
        return self.title
