#!/usr/bin/env bash

WATCH=${1:-0}

if [ "$WATCH" -eq 0 ]; then
    tsc
    node dist/mock/mock.js  # one-shot run server
else
    tsc -w &
    nodemon dist/mock/mock.js # Watch for changes
fi
