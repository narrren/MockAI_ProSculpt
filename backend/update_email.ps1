# PowerShell script to update EMAIL_FROM in .env file
param(
    [Parameter(Mandatory=$true)]
    [string]$EmailAddress
)

$envFile = Join-Path $PSScriptRoot ".env"

if (-not (Test-Path $envFile)) {
    Write-Host "❌ .env file not found at: $envFile" -ForegroundColor Red
    exit 1
}

Write-Host "📧 Updating EMAIL_FROM in .env file..." -ForegroundColor Cyan
Write-Host "Email address: $EmailAddress" -ForegroundColor Yellow

# Read current .env content
$content = Get-Content $envFile -Raw

# Replace EMAIL_FROM line
$content = $content -replace 'EMAIL_FROM=.*', "EMAIL_FROM=$EmailAddress"

# Write back to file
Set-Content -Path $envFile -Value $content -NoNewline

Write-Host "✅ EMAIL_FROM updated successfully!" -ForegroundColor Green
Write-Host "`nCurrent email configuration:" -ForegroundColor Cyan
Get-Content $envFile | Select-String -Pattern "EMAIL|SMTP"

Write-Host "`n⚠️  IMPORTANT: Restart the backend server for changes to take effect!" -ForegroundColor Yellow

