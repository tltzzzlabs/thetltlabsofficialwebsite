import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

def main():
    print("Running build command...")
    django.setup()
    from django.core.management import call_command
    call_command("collectstatic", "--noinput")
    print("Build complete.")

if __name__ == "__main__":
    main()