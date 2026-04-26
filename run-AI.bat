@echo off
title MedCare AI Service
echo Starting MedCare AI Service...

cd BE\ai-service

:: Check if venv exists
if not exist "venv" (
    echo [ERROR] Virtual environment 'venv' not found.
    echo Please run 'python -m venv venv' first.
    pause
    exit /b
)

:: Activate venv and run uvicorn
echo [INFO] Activating virtual environment...
call venv\Scripts\activate

echo [INFO] Starting Uvicorn on port 8095...
python -m uvicorn app.main:app --host 0.0.0.0 --port 8095 --reload

pause
