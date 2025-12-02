# Backend Restart Script
Write-Host "Stopping any existing backend processes..." -ForegroundColor Yellow
Get-Process | Where-Object { $_.ProcessName -like "*python*" -and $_.CommandLine -like "*uvicorn*" } | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "Starting backend server..." -ForegroundColor Green
if (Test-Path "venv\Scripts\Activate.ps1") { .\venv\Scripts\Activate.ps1 }
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
