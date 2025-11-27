# Setup Environment Files Script
# This script creates .env files from .env.example templates

Write-Host "Setting up environment files..." -ForegroundColor Green

# Backend .env
$backendEnv = @"
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://n2RevCon_db_user:n2RevCon@n2revcon.zfuuthy.mongodb.net/?appName=n2RevCon

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRE=7d

# CORS Origin
CORS_ORIGIN=http://localhost:5173
"@

if (-not (Test-Path "backend\.env")) {
    $backendEnv | Out-File -FilePath "backend\.env" -Encoding utf8 -NoNewline
    Write-Host "✓ Created backend/.env" -ForegroundColor Green
} else {
    Write-Host "⚠ backend/.env already exists, skipping..." -ForegroundColor Yellow
}

# Frontend .env
$frontendEnv = @"
# Frontend API URL
VITE_API_URL=http://localhost:5000/api
"@

if (-not (Test-Path "frontend\.env")) {
    $frontendEnv | Out-File -FilePath "frontend\.env" -Encoding utf8 -NoNewline
    Write-Host "✓ Created frontend/.env" -ForegroundColor Green
} else {
    Write-Host "⚠ frontend/.env already exists, skipping..." -ForegroundColor Yellow
}

Write-Host "`nEnvironment setup complete!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Review and update the .env files if needed" -ForegroundColor White
Write-Host "2. Backend: cd backend && npm run server" -ForegroundColor White
Write-Host "3. Frontend: cd frontend && npm run dev" -ForegroundColor White

