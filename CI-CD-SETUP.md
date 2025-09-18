# TopUpAgent Server CI/CD Setup

This repository is configured with GitHub Actions for automated CI/CD deployment to Hostinger.

## 🚀 Automated Deployment

Every push to the `main` branch will automatically:

1. **Test & Build**: Run tests and build the Docker image
2. **Push to Registry**: Push the image to GitHub Container Registry
3. **Deploy to Server**: SSH into Hostinger and update the running container

## 🔧 Required GitHub Secrets

Your repository already has some secrets configured. Here's the complete list needed for deployment:

### ✅ Already Configured Secrets
- `SSH_KEY`: Your private SSH key for server access ✅
- `FTP_HOST`: Your Hostinger server hostname/IP ✅  
- `FTP_USER`: SSH username for server access ✅
- `FTP_PORT`: FTP port (not used in CI/CD) ✅

### 🎯 Secrets Usage in CI/CD
The automated deployment uses:
- `FTP_HOST` as the server hostname/IP
- `FTP_USER` as the SSH username  
- `SSH_KEY` as the private key for authentication

### Current Secret Configuration
```
✅ FTP_HOST: Your server hostname (used as SSH host)
✅ FTP_USER: SSH username (usually 'root')
✅ SSH_KEY: Private SSH key content
✅ FTP_PORT: FTP port (31 - not used in deployment)
```

## 📋 Setup Instructions

### 1. Generate SSH Key Pair (if you don't have one)
```bash
ssh-keygen -t rsa -b 4096 -C "github-actions@yourdomain.com"
```

### 2. Add Public Key to Hostinger Server
```bash
# Copy public key to Hostinger server
ssh-copy-id -i ~/.ssh/id_rsa.pub root@your-server-ip.com

# Or manually add to ~/.ssh/authorized_keys on server
```

### 3. Add Private Key to GitHub Secrets
- Go to GitHub repository → Settings → Secrets and variables → Actions
- Click "New repository secret"
- Name: `HOSTINGER_SSH_KEY`
- Value: Contents of your private key file (`~/.ssh/id_rsa`)

### 4. Verify Current Secrets
Your repository already has the required secrets configured:
- `FTP_HOST`: Server hostname/IP ✅
- `FTP_USER`: SSH username ✅  
- `SSH_KEY`: Private SSH key ✅

The CI/CD pipeline is ready to use these existing secrets!

## 🐳 Docker Registry

The CI/CD pipeline uses GitHub Container Registry (ghcr.io) to store Docker images:
- Registry: `ghcr.io/kazisadibreza/topupagent-server`
- Tags: `latest` and commit SHA

## 📦 Deployment Process

1. **Code Push**: Developer pushes to main branch
2. **GitHub Actions**: Workflow runs automatically
3. **Build**: Creates optimized Docker image
4. **Test**: Runs any configured tests
5. **Push**: Uploads image to registry
6. **Deploy**: SSH to server and update containers
7. **Verify**: Shows logs and container status

## 🔍 Monitoring

### Check Deployment Status
- Visit: [GitHub Actions](https://github.com/KaziSadibReza/TopUpAgentServer/actions)
- View workflow runs and logs

### Check Server Status
```bash
# SSH to server
ssh root@your-server-ip.com

# Check running containers
docker ps

# View logs
docker-compose logs -f automation-server

# Check service health
curl http://localhost:3000/health
```

## 🛠️ Development Workflow

### Making Changes
1. Make your code changes locally
2. Test locally: `npm test`
3. Commit and push to main branch
4. GitHub Actions automatically deploys

### Manual Deployment (if needed)
```bash
# On Hostinger server
cd ~/TopUpAgentServer
git pull origin main
docker-compose down
docker-compose up -d --build
```

## 📊 Health Monitoring

The application includes a health check endpoint:
- URL: `http://your-server:3000/health`
- Returns: Server status, uptime, version

Docker health checks run automatically every 30 seconds.

## 🔧 Environment Configuration

### Production Environment Variables
Set these in `docker-compose.yml`:
```yaml
environment:
  - NODE_ENV=production
  - HEADLESS=false
  - DISPLAY_WIDTH=1920
  - DISPLAY_HEIGHT=1080
```

### Local Development
Copy `.env.example` to `.env` and configure local settings.

## 📝 Troubleshooting

### Common Issues

1. **SSH Key Permission Denied**
   - Ensure private key is properly formatted in GitHub secrets
   - Check public key is in server's `~/.ssh/authorized_keys`

2. **Docker Build Fails**
   - Check Dockerfile syntax
   - Verify all dependencies in package.json

3. **Container Won't Start**
   - Check logs: `docker-compose logs automation-server`
   - Verify environment variables
   - Check port conflicts

### Support
- Check GitHub Actions logs for deployment issues
- Monitor server logs: `docker-compose logs -f`
- Test health endpoint: `curl http://localhost:3000/health`