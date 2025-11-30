@echo off
echo Starting Aptiva Backend Server...
echo.
echo Make sure GOOGLE_API_KEY is set in .env file or environment variable
echo Get your API key from: https://makersuite.google.com/app/apikey
echo.
uvicorn main:app --reload --host 0.0.0.0 --port 8000
pause
