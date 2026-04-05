# PowerShell script to start the frontend

Write-Host "Starting INTRA Frontend..." -ForegroundColor Cyan

# Add Node.js to PATH just in case
$env:Path = "C:\Program Files\nodejs;" + $env:Path


# Navigate to frontend directory
Set-Location frontend

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Start the frontend
Write-Host "Starting frontend dev server..." -ForegroundColor Green
npm run dev

