# Fun.Run — start all platform services
# Usage: .\start-all.ps1
# Stops any existing instances first, then starts fresh.

$ROOT = "D:\pump-mini\platform"
$ENV_FILE = "$ROOT\.env"

# Load env vars
foreach ($line in Get-Content $ENV_FILE) {
    if ($line -match '^([A-Z_][^#=]*)=(.*)$') {
        [System.Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), 'Process')
    }
}

function Stop-Port($port) {
    $pid = (netstat -ano | Select-String ":$port\s.*LISTENING" | ForEach-Object { ($_ -split '\s+')[-1] }) | Select-Object -First 1
    if ($pid -and $pid -match '^\d+$') {
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        Write-Host "Stopped port $port (PID $pid)"
    }
}

Write-Host "Stopping existing services..."
Stop-Port 3000
Stop-Port 3001
Stop-Port 3003
Stop-Port 9090
Stop-Port 9091
Start-Sleep -Milliseconds 600

function Start-Service($name, $dir, $outLog, $errLog) {
    Start-Process -FilePath "node" -ArgumentList "dist/index.js" `
        -WorkingDirectory $dir `
        -RedirectStandardOutput $outLog `
        -RedirectStandardError $errLog `
        -NoNewWindow
    Write-Host "Started $name"
}

Start-Service "API Gateway    (3000)" "$ROOT\apps\api-gateway"           "$ROOT\gateway.log"          "$ROOT\gateway-err.log"
Start-Service "WS Gateway     (3001)" "$ROOT\services\ws-gateway"        "$ROOT\ws-gateway.log"       "$ROOT\ws-gateway-err.log"
Start-Service "Trading Service(3003)" "$ROOT\services\trading"           "$ROOT\trading-service.log"  "$ROOT\trading-service-err.log"
Start-Service "Indexer              " "$ROOT\services\indexer"           "$ROOT\indexer.log"          "$ROOT\indexer-err.log"

Write-Host ""
Write-Host "Waiting 12s for services to initialize..."
Start-Sleep -Seconds 12

# Verify ports
Write-Host ""
Write-Host "=== Port Status ==="
$ports = @(3000, 3001, 3003)
foreach ($p in $ports) {
    $listening = netstat -ano | Select-String ":$p\s.*LISTENING"
    if ($listening) { Write-Host "  :$p  LISTENING" } else { Write-Host "  :$p  NOT LISTENING" }
}

# Quick health checks
Write-Host ""
Write-Host "=== Health ==="
try { $r = (Invoke-WebRequest "http://localhost:3000/healthz" -UseBasicParsing -TimeoutSec 5).StatusCode; Write-Host "  Gateway   3000: $r" } catch { Write-Host "  Gateway   3000: FAIL" }
try { $r = (Invoke-WebRequest "http://localhost:9091/readyz"  -UseBasicParsing -TimeoutSec 5).StatusCode; Write-Host "  Indexer   9091: $r" } catch { Write-Host "  Indexer   9091: FAIL" }
try { $r = (Invoke-WebRequest "http://localhost:3000/api/v1/market/coins" -UseBasicParsing -TimeoutSec 5).StatusCode; Write-Host "  Market    /api: $r" } catch { Write-Host "  Market    /api: FAIL" }
Write-Host ""
Write-Host "All services started. Logs: $ROOT\*.log"
