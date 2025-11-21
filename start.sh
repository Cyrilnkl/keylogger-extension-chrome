#!/bin/bash

# Keylogger Extension - Quick Start Script
# This script installs dependencies and starts all services

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════╗"
echo "║   🔐 Keylogger Extension Setup            ║"
echo "║   Starting installation...                 ║"
echo "╚════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js >= 18.x${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node -v) detected${NC}\n"

# Install Backend dependencies
echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
cd keylogger-server
if [ ! -d "node_modules" ]; then
    npm install
else
    echo -e "${GREEN}✓ Backend dependencies already installed${NC}"
fi

# Check .env file
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  No .env file found. Creating from template...${NC}"
    cp .env.example .env
    echo -e "${RED}⚠️  Please edit keylogger-server/.env with your Azure OpenAI credentials${NC}"
    echo -e "${BLUE}   Then run this script again.${NC}"
    exit 1
fi

cd ..

# Install Dashboard dependencies
echo -e "${YELLOW}📦 Installing dashboard dependencies...${NC}"
cd keylogger-server/dashboard
if [ ! -d "node_modules" ]; then
    npm install
else
    echo -e "${GREEN}✓ Dashboard dependencies already installed${NC}"
fi
cd ../..

# Install Landing Page dependencies
echo -e "${YELLOW}📦 Installing landing page dependencies...${NC}"
cd landing-page
if [ ! -d "node_modules" ]; then
    npm install
else
    echo -e "${GREEN}✓ Landing page dependencies already installed${NC}"
fi
cd ..

echo -e "\n${GREEN}✅ All dependencies installed!${NC}\n"

# Start services
echo -e "${BLUE}╔════════════════════════════════════════════╗"
echo "║   🚀 Starting Services                     ║"
echo "╚════════════════════════════════════════════╝${NC}\n"

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Stopping all services...${NC}"
    kill $(jobs -p) 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start Backend
echo -e "${GREEN}🔧 Starting Backend Server (Port 4000)...${NC}"
cd keylogger-server
node server.js &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 2

# Start Dashboard
echo -e "${GREEN}🎨 Starting Dashboard (Port 5173)...${NC}"
cd keylogger-server/dashboard
npm run dev &
DASHBOARD_PID=$!
cd ../..

# Start Landing Page
echo -e "${GREEN}🌐 Starting Landing Page (Port 3000)...${NC}"
cd landing-page
npm start &
LANDING_PID=$!
cd ..

# Wait a bit for all services to start
sleep 3

echo -e "\n${BLUE}╔════════════════════════════════════════════╗"
echo "║   ✅ All Services Running                  ║"
echo "╚════════════════════════════════════════════╝${NC}\n"

echo -e "${GREEN}📊 Dashboard:      ${NC}http://localhost:5173"
echo -e "${GREEN}🌐 Landing Page:   ${NC}http://localhost:3000"
echo -e "${GREEN}🔌 Backend API:    ${NC}http://localhost:4000"

echo -e "\n${YELLOW}📝 Next Steps:${NC}"
echo "  1. Open Chrome and go to chrome://extensions/"
echo "  2. Enable 'Developer mode'"
echo "  3. Click 'Load unpacked' and select the 'extension' folder"
echo "  4. Visit http://localhost:5173 to see the dashboard"
echo "  5. Visit http://localhost:3000 to download the extension"

echo -e "\n${RED}Press Ctrl+C to stop all services${NC}\n"

# Keep script running
wait
