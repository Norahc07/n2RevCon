# Clear Frontend Cache Script
# This script kills any process on port 5173 and clears Vite cache

Write-Host "🧹 Clearing frontend cache and processes..." -ForegroundColor Green
Write-Host ""

# Kill process on port 5173
$port = 5173
$connections = netstat -ano | findstr ":$port"

if ($connections) {
    Write-Host "Found process using port $port, attempting to kill..." -ForegroundColor Yellow
    $connections | ForEach-Object {
        if ($_ -match '\s+(\d+)\s*$') {
            $pid = $matches[1]
            if ($pid -and $pid -ne "0") {
                try {
                    taskkill /F /PID $pid 2>$null
                    Write-Host "✓ Killed process PID: $pid" -ForegroundColor Green
                } catch {
                    Write-Host "⚠ Could not kill process PID: $pid" -ForegroundColor Yellow
                }
            }
        }
    }
} else {
    Write-Host "✓ No process found on port $port" -ForegroundColor Green
}

Write-Host ""

# Clear cache directories
$cachePaths = @(
    "frontend\dist",
    "frontend\.vite",
    "frontend\node_modules\.vite"
)

foreach ($path in $cachePaths) {
    if (Test-Path $path) {
        try {
            Remove-Item -Recurse -Force $path
            Write-Host "✓ Cleared: $path" -ForegroundColor Green
        } catch {
            Write-Host "⚠ Error clearing $path" -ForegroundColor Yellow
        }
    } else {
        Write-Host "ℹ️  Not found: $path" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "✨ Cache cleared! You can now run 'npm run dev' fresh." -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. cd frontend" -ForegroundColor White
Write-Host "2. npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "💡 Tip: Clear your browser cache (Ctrl+Shift+Delete) for a completely fresh start!" -ForegroundColor Yellow

