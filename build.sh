#!/usr/bin/env bash
# Build script for Render deployment

set -e  # Exit on error

echo "🚀 Starting CodeCalm build process..."

# Upgrade pip
echo "📦 Upgrading pip..."
pip install --upgrade pip

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install -r backend/requirements.txt

# Initialize database
echo "🗄️  Initializing database..."
cd backend
python setup_database.py
cd ..

echo "✅ Build completed successfully!"
