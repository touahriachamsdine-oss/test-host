# PowerShell daily backup of the startup_ideas_dz database.
# Usage:  powershell -File scripts/backup-db.ps1        (PGPASSWORD env var required)
# Add to Task Scheduler for unattended backups.

$ErrorActionPreference = 'Stop'

if (-not $env:PGPASSWORD) {
  Write-Host 'Set PGPASSWORD (postgres superuser password) before running.' -ForegroundColor Red
  exit 1
}

$date = Get-Date -Format 'yyyyMMdd-HHmmss'
$backupDir = Join-Path (Split-Path $PSScriptRoot -Parent) 'backups'
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

$pgDump = 'C:\Program Files\PostgreSQL\15\bin\pg_dump.exe'
$outFile = Join-Path $backupDir "startup_ideas_dz_$date.dump"

& $pgDump -U postgres -h localhost -Fc -f $outFile startup_ideas_dz
if ($LASTEXITCODE -ne 0) { throw "pg_dump failed" }

Write-Host "Backup written to $outFile"