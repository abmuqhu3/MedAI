@echo off
python -m waitress --host 0.0.0.0 --port 10000 backend.scripts.main:app
