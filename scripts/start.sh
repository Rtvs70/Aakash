#!/bin/bash

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js 16.x or higher."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Warning: .env file not found. Creating from template..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "Created .env file from .env.example. Please edit it with your actual values."
    else
        echo "Error: .env.example not found. Please create a .env file manually."
        exit 1
    fi
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Start the app in development or production mode
if [ "$1" == "prod" ] || [ "$1" == "production" ]; then
    echo "Starting in production mode..."
    npm run build && npm run start
else
    echo "Starting in development mode..."
    npm run dev
fi