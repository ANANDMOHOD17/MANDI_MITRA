@echo off
title Mandi Mitra - Smart Mandi Price Advisor
echo Starting Mandi Mitra application...
if not exist ".venv\Scripts\python.exe" (
    echo Virtual environment not found. Setting up...
    python -m venv .venv
    .venv\Scripts\pip.exe install -r requirements.txt
)
echo Launching Flask server on http://localhost:5000 ...
.venv\Scripts\python.exe app.py
pause
