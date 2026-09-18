#!/usr/bin/env bash

RUN_INSTALL=0

WATCH=${1:-0}

if [ ! -d ".venv" ]; then
    echo "Initializing venv..."
    RUN_INSTALL=1
    python3 -m venv .venv # Initialize python virtual environment
fi

. ./.venv/bin/activate # Activate python venv

if [ "$RUN_INSTALL" -eq 1 ]; then
    echo "Installing dependencies..."
    pip install -r requirements.txt
fi

if [ "$WATCH" -eq 0 ]; then
    python main.py  # one-shot run server
else
    nodemon main.py # Watch for changes
fi
