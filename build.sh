#!/bin/bash
set -xe

curl -LsSf https://astral.sh/uv/install.sh | sh
export PATH="$HOME/.local/bin:$PATH"

uv sync
uv run python manage.py collectstatic --noinput
