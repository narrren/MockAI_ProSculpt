# PowerShell script to start the backend server
# Run this script to start a fresh backend server

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting Aptiva Backend Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to backend directory
Set-Location $PSScriptRoot\backend

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1

# Check Ollama status
Write-Host "`nChecking Ollama status..." -ForegroundColor Yellow
python check_ollama.py

Write-Host "`nStarting backend server on http://localhost:8000" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the server`n" -ForegroundColor Yellow

# Start the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000

