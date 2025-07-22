#!/bin/bash

# Ubuntu VPS Production Startup Script
# This script sets up and runs the TopUp Agent with optimal VPS settings

echo "🚀 Starting TopUp Agent for Ubuntu VPS..."

# Check if running as root (not recommended)
if [ "$EUID" -eq 0 ]; then
    echo "⚠️  Warning: Running as root is not recommended. Consider using a non-root user."
fi

# Set environment variables for VPS optimization
export NODE_ENV=production
export HEADLESS=true
export NODE_OPTIONS="--max-old-space-size=2048"

# Check system resources
echo "📊 System Resources:"
echo "   CPU Cores: $(nproc)"
echo "   Memory: $(free -h | grep Mem: | awk '{print $2}')"
echo "   Disk Space: $(df -h / | tail -1 | awk '{print $4}' | sed 's/G/ GB/')"

# Check if Chrome is installed
if ! command -v google-chrome-stable &> /dev/null; then
    echo "❌ Google Chrome not found. Please install it first:"
    echo "   wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -"
    echo "   sudo sh -c 'echo \"deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main\" >> /etc/apt/sources.list.d/google-chrome.list'"
    echo "   sudo apt update && sudo apt install -y google-chrome-stable"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js 16+ required. Current version: $(node --version)"
    exit 1
fi

# Create necessary directories
mkdir -p logs screenshots database

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check proxy connection
echo "🔗 Testing proxy connection..."
if curl -x socks5://BK:BK@59.153.18.230:1052 -s --connect-timeout 5 http://httpbin.org/ip &> /dev/null; then
    echo "✅ Proxy connection successful"
else
    echo "❌ Proxy connection failed. Please check your SOCKS5 proxy."
    exit 1
fi

# Clear any hanging Chrome processes
pkill -f chrome &> /dev/null || true
pkill -f node &> /dev/null || true

# Wait a moment for processes to clean up
sleep 2

# Start the application with production settings
echo "🎯 Starting TopUp Agent with Ubuntu VPS optimization..."

# Using PM2 for production (if available)
if command -v pm2 &> /dev/null; then
    echo "🔄 Using PM2 for process management..."
    pm2 stop topup-agent &> /dev/null || true
    pm2 delete topup-agent &> /dev/null || true
    pm2 start src/app.js --name "topup-agent" \
        --max-memory-restart 1G \
        --error-file logs/pm2-error.log \
        --out-file logs/pm2-out.log \
        --log-file logs/pm2-combined.log \
        --time
    pm2 save
    echo "✅ Application started with PM2"
    echo "📊 PM2 Status:"
    pm2 status
    echo ""
    echo "📝 Useful PM2 commands:"
    echo "   pm2 logs topup-agent    # View logs"
    echo "   pm2 restart topup-agent # Restart"
    echo "   pm2 stop topup-agent    # Stop"
    echo "   pm2 monit              # Monitor"
else
    echo "🔄 Starting with Node.js directly..."
    # Use screen or nohup for background execution
    if command -v screen &> /dev/null; then
        screen -dmS topup-agent node src/app.js
        echo "✅ Application started in screen session 'topup-agent'"
        echo "📝 Use 'screen -r topup-agent' to attach to the session"
    else
        nohup node src/app.js > logs/app.log 2>&1 &
        APP_PID=$!
        echo "✅ Application started with PID: $APP_PID"
        echo "📝 Use 'tail -f logs/app.log' to view logs"
        echo "📝 Use 'kill $APP_PID' to stop the application"
    fi
fi

echo ""
echo "🌟 Ubuntu VPS TopUp Agent is now running!"
echo "🔗 Proxy: SOCKS5://59.153.18.230:1052"
echo "🖥️  Platform: Linux x86_64 (Ubuntu VPS)"
echo "🛡️  Anti-Detection: ENABLED"
echo "🚫 reCAPTCHA: BYPASSED"
echo ""
echo "📊 Monitor your application:"
echo "   Logs: tail -f logs/automation.log"
echo "   Errors: tail -f logs/error.log"
echo "   Screenshots: ls -la screenshots/"
echo ""
echo "🔧 System monitoring:"
echo "   CPU/Memory: htop"
echo "   Network: netstat -tulnp"
echo "   Processes: ps aux | grep node"
