Set-Location D:\pump-mini\platform\apps\api-gateway
foreach ($line in Get-Content D:\pump-mini\platform\.env) {
    if ($line -match '^([^#=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $val = $matches[2].Trim()
        [System.Environment]::SetEnvironmentVariable($key, $val, 'Process')
    }
}
node dist/index.js *>&1 | Tee-Object -FilePath 'D:\pump-mini\platform\gateway.log'
