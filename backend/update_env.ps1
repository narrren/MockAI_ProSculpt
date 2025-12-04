# PowerShell script to safely update .env file
# This script preserves all existing keys when updating

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Aptiva .env File Manager" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Python is available
try {
    $pythonVersion = python --version 2>&1
    Write-Host "Using Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python not found. Please install Python first." -ForegroundColor Red
    exit 1
}

# Run the Python script
Write-Host "Starting .env manager..." -ForegroundColor Yellow
Write-Host ""

python update_env.py

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

