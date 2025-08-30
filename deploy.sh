#!/bin/bash

# JRP Courteries - Deployment Script
# This script helps deploy the application to production

echo "🚀 Starting JRP Courteries deployment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if installation was successful
if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Set production environment
export NODE_ENV=production

# Create images directory if it doesn't exist
if [ ! -d "images" ]; then
    echo "📁 Creating images directory..."
    mkdir images
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found. Creating example configuration..."
    cat > .env << EOF
PORT=3000
NODE_ENV=production
MONGODB_URI=mongodb://localhost:27017/jrp-courteries
SESSION_SECRET=your-super-secret-session-key-here
JWT_SECRET=your-jwt-secret-key-here
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./images
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
ALLOWED_ORIGINS=https://yourdomain.com
EOF
    echo "📝 Please update the .env file with your actual configuration"
fi

# Start the application
echo "🌟 Starting JRP Courteries..."
echo "📍 Application will be available at: http://localhost:3000"
echo "🛑 Press Ctrl+C to stop the server"

npm start
