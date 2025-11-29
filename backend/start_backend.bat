@echo off
echo Starting MockAI ProSculpt Backend Server...
echo.
echo Make sure Ollama is running with: ollama run llama3
echo.
uvicorn main:app --reload --host 0.0.0.0 --port 8000
pause

