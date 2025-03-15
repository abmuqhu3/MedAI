#!/bin/bash
gunicorn --bind 0.0.0.0:10000 backend.scripts.main:app
