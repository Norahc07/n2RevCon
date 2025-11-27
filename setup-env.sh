#!/bin/bash

# Setup Environment Files Script
# This script creates .env files from templates

echo "Setting up environment files..."

# Backend .env
if [ ! -f "backend/.env" ]; then
    cat > backend/.env << 'EOF'
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
EOF
    echo "✓ Created backend/.env"
else
    echo "⚠ backend/.env already exists, skipping..."
fi

# Frontend .env
if [ ! -f "frontend/.env" ]; then
    cat > frontend/.env << 'EOF'
# Frontend API URL
VITE_API_URL=http://localhost:5000/api
EOF
    echo "✓ Created frontend/.env"
else
    echo "⚠ frontend/.env already exists, skipping..."
fi

echo ""
echo "Environment setup complete!"
echo ""
echo "Next steps:"
echo "1. Review and update the .env files if needed"
echo "2. Backend: cd backend && npm run server"
echo "3. Frontend: cd frontend && npm run dev"

