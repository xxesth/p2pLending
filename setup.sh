#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "📦 Starting Project Installation..."

# 1. Backend
echo "-----------------------------------"
echo "🔹 Installing Backend Dependencies..."
cd backend
npm install
cd ..

# 2. Frontend
echo "-----------------------------------"
echo "🔹 Installing Frontend Dependencies..."
cd frontend
npm install
cd ..

echo "-----------------------------------"
echo "✅ Installation Complete!"
echo "You can now proceed to run the project."
