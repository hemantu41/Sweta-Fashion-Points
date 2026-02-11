#!/bin/bash

# Script to properly restart the development server

echo "🔍 Checking for running Next.js processes..."
NEXT_PID=$(ps aux | grep -i "next dev" | grep -v grep | awk '{print $2}')

if [ ! -z "$NEXT_PID" ]; then
  echo "✋ Found running Next.js server (PID: $NEXT_PID), stopping it..."
  kill -9 $NEXT_PID
  sleep 2
  echo "✅ Server stopped"
else
  echo "ℹ️  No running server found"
fi

echo ""
echo "🧹 Clearing Next.js cache..."
rm -rf .next

echo ""
echo "🔄 Pulling latest code from GitHub..."
git pull origin main

echo ""
echo "📦 Installing any new dependencies..."
npm install

echo ""
echo "🚀 Starting development server..."
echo "   Server will be available at: http://localhost:3000"
echo "   Press Ctrl+C to stop the server"
echo ""

npm run dev
