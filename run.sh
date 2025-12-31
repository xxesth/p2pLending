#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "🚀 Starting Deployment & Frontend..."

# Check if we are in the root
if [ ! -d "backend" ]; then
  echo "❌ Error: Please run this script from the project root."
  exit 1
fi

# 1. Deploy Contracts
echo "-----------------------------------"
echo "🔹 Deploying Smart Contracts..."
echo "   (Ensure 'npx hardhat node' is running in another terminal)"
echo "-----------------------------------"

cd backend
# Run deploy to localhost
npx hardhat run scripts/deploy.ts --network localhost

if [ $? -eq 0 ]; then
  echo "✅ Contracts Deployed & Config Updated."
else
  echo "❌ Deployment Failed. Is the Hardhat Node running?"
  exit 1
fi

# 2. Start Frontend
echo "-----------------------------------"
echo "🔹 Starting Next.js Frontend..."
echo "-----------------------------------"
cd ../frontend
npm run dev
