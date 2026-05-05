@echo off
echo ==========================================
echo Starting FastAPI Micro-SaaS Backend...
echo ==========================================

:: Activate the virtual environment
call venv\Scripts\activate

:: Start the server with hot-reloading enabled
uvicorn app.main:app --reload

pause