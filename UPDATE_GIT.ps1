# Quick Git Update Script
# Run this script to quickly add, commit, and push your changes

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Git Update Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in a git repository
if (-not (Test-Path .git)) {
    Write-Host "❌ Error: Not a git repository!" -ForegroundColor Red
    Write-Host "Run this script from the project root directory." -ForegroundColor Yellow
    exit 1
}

# Show current status
Write-Host "Current status:" -ForegroundColor Yellow
git status --short
Write-Host ""

# Ask for commit message
$message = Read-Host "Enter commit message (or press Enter for default)"

if ([string]::IsNullOrWhiteSpace($message)) {
    $message = "Update: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    Write-Host "Using default message: $message" -ForegroundColor Gray
}

# Add all changes
Write-Host "`nAdding all changes..." -ForegroundColor Yellow
git add .

# Commit
Write-Host "Committing changes..." -ForegroundColor Yellow
git commit -m $message

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Committed successfully!" -ForegroundColor Green
    
    # Push to GitHub
    Write-Host "`nPushing to GitHub..." -ForegroundColor Yellow
    git push
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅✅✅ Successfully pushed to GitHub! ✅✅✅" -ForegroundColor Green
        Write-Host "Repository: https://github.com/narrren/MockAI_ProSculpt.git" -ForegroundColor Cyan
    } else {
        Write-Host "`n❌ Push failed. Check your internet connection and GitHub credentials." -ForegroundColor Red
    }
} else {
    Write-Host "`n⚠️ Nothing to commit or commit failed." -ForegroundColor Yellow
}

Write-Host ""

