# Aggressively kill all backend processes
Write-Host "Killing all processes on port 8000..." -ForegroundColor Red

# Get all PIDs using port 8000
$connections = netstat -ano | findstr :8000
$pids = $connections | ForEach-Object { 
    if ($_ -match '\s+(\d+)\s*$') { 
        $matches[1] 
    } 
} | Select-Object -Unique

Write-Host "Found processes: $($pids -join ', ')" -ForegroundColor Yellow

# Kill each process
foreach ($pid in $pids) {
    try {
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        Write-Host "✓ Killed process $pid" -ForegroundColor Green
    } catch {
        Write-Host "✗ Could not kill process $pid" -ForegroundColor Red
    }
}

# Also kill any Python/uvicorn processes in the backend
Get-Process python,uvicorn -ErrorAction SilentlyContinue | Where-Object { 
    $_.Path -like "*MockAI_ProSculpt*backend*" 
} | ForEach-Object {
    try {
        Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
        Write-Host "✓ Killed $($_.ProcessName) process $($_.Id)" -ForegroundColor Green
    } catch {}
}

Start-Sleep -Seconds 2

# Verify
$remaining = netstat -ano | findstr :8000
if ($remaining) {
    Write-Host "`n⚠️ WARNING: Some processes are still on port 8000:" -ForegroundColor Yellow
    Write-Host $remaining
    Write-Host "`nYou may need to restart your computer or manually kill these processes." -ForegroundColor Red
} else {
    Write-Host "`n✅ SUCCESS: Port 8000 is now free!" -ForegroundColor Green
    Write-Host "You can now start a fresh server using START_BACKEND.ps1" -ForegroundColor Cyan
}

