#!/bin/bash

echo "🚀 Starting Project Setup..."

# 1. Install Backend
echo "📦 Installing Backend Dependencies..."
cd backend
npm install
cd ..

# 2. Install Frontend
echo "📦 Installing Frontend Dependencies..."
cd frontend
npm install
cd ..

echo "✅ Dependencies Installed."
echo ""
echo "--------------------------------------------------------"
echo "⚠️  IMPORTANT: YOU MUST RUN TWO TERMINALS NOW"
echo "--------------------------------------------------------"
echo ""
echo "TERMINAL 1 (Blockchain):"
echo "  cd backend"
echo "  npx hardhat node"
echo ""
echo "TERMINAL 2 (Deployment & App):"
echo "  cd backend"
echo "  npx hardhat run scripts/deploy.ts --network localhost"
echo "  cd ../frontend"
echo "  npm run dev"
echo ""
echo "--------------------------------------------------------"
