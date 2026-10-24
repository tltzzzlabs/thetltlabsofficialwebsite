#!/bin/bash
set -xe

python manage.py collectstatic --noinput
