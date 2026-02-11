$env:Path = "C:\Program Files\nodejs;" + $env:Path
Write-Host "Seeding database..."
npx ts-node prisma/seed.ts
