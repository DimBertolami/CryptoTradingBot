# Startup script for Trading Bot System

# Get script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

# Define base directories
$botDir = $scriptDir
$frontendDir = Join-Path $botDir "frontend"
$backendDir = Join-Path $botDir "backend"

# Function to stop running processes
function Stop-RunningProcesses {
    Write-Host "Cleaning up any existing processes..." -ForegroundColor Yellow
    
    # Get all processes that might be related to our bot
    $processes = Get-Process | Where-Object {
        $_.ProcessName -like "*node*" -or
        $_.ProcessName -like "*python*" -or
        $_.ProcessName -like "*tradingbot*"
    }
    
    foreach ($process in $processes) {
        try {
            Write-Host "Stopping process: $($process.ProcessName)" -ForegroundColor Yellow
            Stop-Process -Id $process.Id -Force
        }
        catch {
            Write-Host "Failed to stop process: $($process.ProcessName)" -ForegroundColor Red
        }
    }
}

# Function to check if file exists
function Test-FileExists {
    param (
        [string]$FilePath
    )
    if (Test-Path $FilePath) {
        return $true
    }
    Write-Host "Warning: File not found: $FilePath" -ForegroundColor Yellow
    return $false
}

# Function to install frontend dependencies
function Install-FrontendDependencies {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Cyan
    # Install base dependencies
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm.cmd install" -NoNewWindow -WorkingDirectory $frontendDir -Wait
    # Install additional required packages
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm.cmd install date-fns lucide-react recharts" -NoNewWindow -WorkingDirectory $frontendDir -Wait
}

# First stop any running processes
Stop-RunningProcesses

# Now start the bot services
Write-Host "Starting Trading Bot Services..." -ForegroundColor Green

# Check for and start paper trading API
$apiScript = Join-Path $backendDir "paper_trading_api.py"
if (Test-FileExists $apiScript) {
    Write-Host "Starting paper trading API..." -ForegroundColor Cyan
    Start-Process -FilePath "python" -ArgumentList $apiScript -NoNewWindow -WorkingDirectory $backendDir
} else {
    Write-Host "Paper trading API script not found at: $apiScript" -ForegroundColor Red
}

# Check for frontend package.json and install dependencies
$packageJson = Join-Path $frontendDir "package.json"
if (Test-FileExists $packageJson) {
    Install-FrontendDependencies
    Write-Host "Starting frontend development server..." -ForegroundColor Cyan
    # Start Vite development server
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm.cmd run dev" -NoNewWindow -WorkingDirectory $frontendDir
} else {
    Write-Host "Frontend package.json not found at: $packageJson" -ForegroundColor Red
}

Write-Host "All services have been started." -ForegroundColor Green
