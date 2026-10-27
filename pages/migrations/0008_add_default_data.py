from django.db import migrations, models

def create_default_data(apps, schema_editor):
    Activity = apps.get_model("pages", "Activity")
    activities = [
        {
            "title": "支付宝AI付 PAYATHON 2026",
            "start_date": "2026-09-21",
            "end_date": "2026-12-26",
            "location": "线上线下",
            "link":"https://aipay.alipay.com/community/events/payathon-2026?utm_source=hackertrip&utm_medium=referral&utm_campaign=hackathon_ht-payathon-2026_detail",
            "status": "进行中",
            "category": "支付/AI商业化",
            "organizer": "蚂蚁集团"
        },
        {
            "title": "蚂蚁灵波具身大模型挑战赛",
            "start_date": "2026-09-11",
            "end_date": "2026-11-15",
            "location": "线上线下",
            "link":"https://tianchi.aliyun.com/competition/entrance/532514",
            "status": "进行中",
            "category": "AI / 具身智能",
            "organizer": "蚂蚁灵波 × 魔搭 × 阿里云天池"
        },
        {
            "title": "腾讯音乐高校 AI Hackathon",
            "start_date": "2026-09-14",
            "end_date": "2026-11-02",
            "location": "线上线下",
            "link":"https://join.tencentmusic.com/ai-hackathon/",
            "status": "进行中",
            "category": "AI / 音乐娱乐",
            "organizer": "TME"
        },
        {
            "title": "怀柔科学城 48h 黑客松",
            "start_date": "2026-11-15",
            "end_date": "2026-11-16",
            "location": "线上线下",
            "link":"https://opc.book2048.com/?utm_source=hackertrip&utm_medium=referral&utm_campaign=hackathon_ht-a04d899420_detail",
            "status": "进行中",
            "category": "AI for Science / AIGC",
            "organizer": "怀柔科学城集团等"
        }
    ]

    for activity in activities:
        Activity.objects.get_or_create(**activity)

    Project = apps.get_model("pages", "Project")
    projects = [
        {
            "title": "Ordinary 智能笔记",
            "description": "面向STEM留学生群体的智能笔记应用，通过多模态特征融合以及大模型语义分析能力自动整理笔记，去除干扰信息，提升用户专注力。",
            "video": "https://res.cloudinary.com/demo/video/sample.mp4",
            "link": "media/projects/videos/demo.mov",
            "order": 0
        },
        {
            "title": "SeekMap 空间分析",
            "description": "15 分钟等时圈空间分析工具，检测社区内民生设施分布情况，标注盲点，提升社区生活质量，助力城市规划。",
            "video": "https://res.cloudinary.com/demo/video/sample.mp4",
            "link": "media/projects/videos/SeekMap智能地图.mp4",
            "order": 1
        },
        {
            "title": "BizTrip 语音商旅助手",
            "description": "可以通过语音交互的商旅助手，提供行程规划、工作处理、自动报销等功能，帮助用户提升商旅效率。",
            "video": "https://res.cloudinary.com/demo/video/sample.mp4",
            "link": "media/projects/videos/agentdemo.mp4",
            "order": 2
        },
    ]
    for project in projects:
        Project.objects.get_or_create(**project)

class Migration(migrations.Migration):
    dependencies = [
        ("pages", "0007_alter_project_link"),
    ]

    operations = [
        migrations.RunPython(create_default_data),
    ]
