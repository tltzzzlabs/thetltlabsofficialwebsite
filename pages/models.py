from django.db import models


class Activity(models.Model):
    title = models.CharField("标题", max_length=200)
    start_date = models.DateField("开始日期", default="1970-01-01")
    end_date = models.DateField("结束日期", default="1970-01-01")
    link = models.URLField("活动链接", blank=True)
    category = models.CharField("分类标签", max_length=100, blank=True)
    organizer = models.CharField("组织者", max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["start_date"]
        verbose_name = "活动"
        verbose_name_plural = "活动"

    def __str__(self):
        return self.title


class Project(models.Model):
    title = models.CharField("项目名称", max_length=200)
    description = models.TextField("项目描述", blank=True)
    video = models.URLField("视频链接", blank=True)
    link = models.CharField("本地链接", max_length=500, blank=True)
    order = models.PositiveIntegerField("排序", default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["order", "-created_at"]
        verbose_name = "项目"
        verbose_name_plural = "项目"

    def __str__(self):
        return self.title
