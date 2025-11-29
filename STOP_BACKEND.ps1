# PowerShell script to stop all backend processes
# Run this script to stop all running backend servers

Write-Host "Stopping all backend processes..." -ForegroundColor Yellow

# Stop all uvicorn processes
Get-Process uvicorn -ErrorAction SilentlyContinue | Stop-Process -Force

# Stop Python processes in the backend directory
Get-Process python -ErrorAction SilentlyContinue | Where-Object { 
    $_.Path -like "*MockAI_ProSculpt*backend*" 
} | Stop-Process -Force

# Kill processes on port 8000
$connections = netstat -ano | findstr :8000
if ($connections) {
    $pids = $connections | ForEach-Object { 
        if ($_ -match '\s+(\d+)\s*$') { 
            $matches[1] 
        } 
    } | Select-Object -Unique
    
    foreach ($pid in $pids) {
        try {
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            Write-Host "Stopped process $pid" -ForegroundColor Green
        } catch {
            # Ignore errors
        }
    }
}

Write-Host "`nAll backend processes stopped!" -ForegroundColor Green
Write-Host "You can now start a fresh server using START_BACKEND.ps1" -ForegroundColor Cyan

