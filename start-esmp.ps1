$root = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host " Stopping any running node processes..." -ForegroundColor Yellow
Write-Host " ----------------------------------------------------------"

Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Kill anything still on port 3000 or 4000
foreach ($port in @(3000, 4000)) {
    $pids = netstat -ano | Select-String ":$port\s" | Select-String "LISTENING" | ForEach-Object {
        ($_ -split '\s+')[-1]
    }
    foreach ($p in $pids) {
        if ($p -match '^\d+$') {
            Write-Host " Killing PID $p on port $port"
            Stop-Process -Id ([int]$p) -Force -ErrorAction SilentlyContinue
        }
    }
}

Start-Sleep -Seconds 2

# Delete Next.js lock file
$lockFile = Join-Path $root "apps\web\.next\dev\lock"
if (Test-Path $lockFile) {
    Remove-Item $lockFile -Force
    Write-Host " Cleared Next.js lock file"
}

# Generate Prisma client
Write-Host " Generating Prisma client..."
Push-Location (Join-Path $root "apps\api")
npx prisma generate
Pop-Location

Write-Host ""
Write-Host " Starting API (NestJS) on http://localhost:4000 ..." -ForegroundColor Cyan
Start-Process "cmd" -ArgumentList "/k cd /d `"$root\apps\api`" && npm run start:dev" -WindowStyle Normal

Start-Sleep -Seconds 2

Write-Host " Starting Web (Next.js) on http://localhost:3000 ..." -ForegroundColor Cyan
Start-Process "cmd" -ArgumentList "/k cd /d `"$root\apps\web`" && npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host " ----------------------------------------------------------" -ForegroundColor Green
Write-Host "  ESMP is starting up - wait ~30 seconds" -ForegroundColor Green
Write-Host "  Web  ->  http://localhost:3000" -ForegroundColor Green
Write-Host "  API  ->  http://localhost:4000" -ForegroundColor Green
Write-Host "  Docs ->  http://localhost:4000/api/docs" -ForegroundColor Green
Write-Host " ----------------------------------------------------------" -ForegroundColor Green
Write-Host ""
