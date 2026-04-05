# PowerShell script to start the backend

Write-Host "Starting INTRA Backend..." -ForegroundColor Cyan

# Add Node.js to PATH just in case
$env:Path = "C:\Program Files\nodejs;" + $env:Path


# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Generate Prisma client
Write-Host "Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate

# Start the backend
Write-Host "Starting backend server on http://localhost:3000..." -ForegroundColor Green
npm run start:dev

