$env:Path = "C:\Program Files\nodejs;" + $env:Path
Write-Host "Running Prisma migrations..."
npx prisma migrate deploy
