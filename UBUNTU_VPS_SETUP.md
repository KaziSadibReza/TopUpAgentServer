# Ubuntu VPS Setup Guide for Anti-reCAPTCHA Automation

## System Requirements for Ubuntu VPS

### 1. Install Required Packages

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl wget gnupg2 software-properties-common

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Google Chrome (required for Puppeteer)
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
sudo sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list'
sudo apt update
sudo apt install -y google-chrome-stable

# Install additional dependencies
sudo apt install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils
```

### 2. Environment Configuration

Create `.env` file:

```bash
# Ubuntu VPS Configuration
HEADLESS=true
NODE_ENV=production

# Chrome executable path (if needed)
# CHROME_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Memory optimization
NODE_OPTIONS=--max-old-space-size=2048
```

### 3. System Optimizations for Anti-Detection

#### Memory Management

```bash
# Create swap file for better memory management
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make swap permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

#### Kernel Parameters

```bash
# Optimize for automation workload
echo 'kernel.pid_max = 4194304' | sudo tee -a /etc/sysctl.conf
echo 'fs.file-max = 2097152' | sudo tee -a /etc/sysctl.conf
echo 'net.core.somaxconn = 65535' | sudo tee -a /etc/sysctl.conf

# Apply changes
sudo sysctl -p
```

### 4. Firewall Configuration

```bash
# Allow required ports
sudo ufw allow 22    # SSH
sudo ufw allow 3000  # Your application port
sudo ufw enable
```

### 5. Process Management (Optional)

```bash
# Install PM2 for process management
sudo npm install -g pm2

# Create ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'topup-agent',
    script: 'src/app.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      HEADLESS: 'true'
    },
    max_memory_restart: '1G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF
```

## Key Optimizations Made for Ubuntu VPS

### 1. Browser Arguments

- `--single-process`: Reduces memory usage on VPS
- `--disable-images`: Faster loading, less bandwidth
- `--disable-gpu`: GPU not available on headless VPS
- `--use-gl=disabled`: Disable OpenGL
- `--disable-dev-shm-usage`: Prevent shared memory issues

### 2. Linux-Specific Fingerprinting

- Platform: `Linux x86_64`
- User Agent: Linux Chrome signature
- WebGL Renderer: `llvmpipe` (typical Linux)
- Hardware: VPS-typical specs (4 CPU, 4GB RAM)
- No battery API (desktop Linux)

### 3. Memory Optimizations

- Increased timeout to 120 seconds for VPS
- Custom Chrome executable path support
- Memory pressure settings optimized

### 4. Network Optimizations

- WebRTC disabled for better proxy compatibility
- DNS over HTTPS disabled
- Background networking disabled

## Testing the Configuration

Run the Ubuntu-specific test:

```bash
node test-ubuntu-stealth.js
```

Expected output:

```
🚀 Testing UBUNTU VPS STEALTH Configuration...
✅ Proxy tunnel created: http://127.0.0.1:5885
🌐 Navigating to Garena Shop...
🔍 Checking for reCAPTCHA...
🎉 NO CAPTCHA DETECTED! Ubuntu VPS stealth working perfectly!
🤖 Testing bot detection...
🔍 Ubuntu VPS Detection Results: {
  webdriver: undefined,
  platform: 'Linux x86_64',
  userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537...',
  plugins: 3,
  chrome: true,
  languages: 2,
  hardwareConcurrency: 4,
  deviceMemory: 4
}
✅ Player ID input found - site is accessible!
📸 Screenshot saved: screenshots/ubuntu-vps-stealth-test.png
🔒 Browser closed
🔗 Proxy chain closed
```

## Troubleshooting Common VPS Issues

### Chrome Installation Issues

```bash
# If Chrome fails to install
sudo apt install -y libnss3-dev libgconf-2-4 libxss1 libappindicator3-1 libindicator7 gconf-service libgconf2-dev libxss1 libappindicator1 fonts-liberation
```

### Memory Issues

```bash
# Monitor memory usage
free -h
htop

# Kill hanging processes
pkill -f chrome
pkill -f node
```

### Permission Issues

```bash
# Fix Chrome permissions
sudo chmod +x /usr/bin/google-chrome-stable
sudo chown -R $USER:$USER /home/$USER/.cache
```

### DNS Issues

```bash
# Set reliable DNS
echo 'nameserver 8.8.8.8' | sudo tee -a /etc/resolv.conf
echo 'nameserver 8.8.4.4' | sudo tee -a /etc/resolv.conf
```

## Performance Monitoring

### Resource Usage

```bash
# Check CPU and memory
top -p $(pgrep -f "node\|chrome")

# Network connections
netstat -tulnp | grep :3000

# Disk space
df -h
```

### Log Monitoring

```bash
# Application logs
tail -f logs/automation.log

# System logs
sudo journalctl -f -u your-service-name
```

## Security Best Practices

1. **Regular Updates**

   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Fail2Ban for SSH Protection**

   ```bash
   sudo apt install fail2ban
   sudo systemctl enable fail2ban
   ```

3. **Firewall Rules**

   ```bash
   sudo ufw default deny incoming
   sudo ufw default allow outgoing
   ```

4. **Regular Backups**
   ```bash
   # Backup database and screenshots
   tar -czf backup-$(date +%Y%m%d).tar.gz database/ screenshots/ logs/
   ```

This configuration should eliminate reCAPTCHA challenges on your Ubuntu VPS while maintaining optimal performance with your residential proxy.
