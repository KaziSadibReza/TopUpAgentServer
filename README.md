# Top Up Agent - Node.js Server

This Node.js server handles the automation tasks for the Top Up Agent WordPress plugin using Puppeteer.

## Features

- **Real-time Logging**: WebSocket-based real-time log streaming
- **Automation API**: RESTful API for managing automation tasks
- **Job Management**: Track and manage running automation jobs
- **WordPress Integration**: Designed to work seamlessly with the WordPress plugin

## Installation

1. Navigate to the server directory:

   ```bash
   cd server
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy the environment file:

   ```bash
   copy .env.example .env
   ```

4. Edit the `.env` file with your settings:
   ```
   PORT=3000
   NODE_ENV=development
   WORDPRESS_URL=http://botplugin.local
   ```

## Running the Server

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

## API Endpoints

### Health Check

- **GET** `/health` - Server health status

### Automation

- **POST** `/automation` - Start automation task
- **GET** `/automation/status/:requestId` - Get job status
- **POST** `/automation/cancel/:requestId` - Cancel automation job
- **GET** `/automation/jobs` - List running jobs
- **GET** `/automation/result/:requestId` - Get automation result

### API

- **GET** `/api/status` - Server status
- **GET** `/api/logs` - Get logs
- **POST** `/api/logs/clear` - Clear logs

## WordPress Plugin Integration

The server is designed to work with the Top Up Agent WordPress plugin. Make sure to:

1. Set the correct server URL in the WordPress plugin settings
2. Start the Node.js server before using the automation features
3. Keep the server running while using automation features

## Real-time Features

The server uses Socket.IO for real-time communication:

- **Real-time logs**: Live log streaming to the WordPress admin
- **Job updates**: Real-time job status updates
- **Auto-reconnection**: Automatic reconnection handling

## Security

- Rate limiting on API endpoints
- CORS configuration for WordPress integration
- Input validation and sanitization

## Logging

Logs are stored in the `logs/` directory:

- `automation.log` - General application logs
- `error.log` - Error logs only

## Troubleshooting

### Common Issues

1. **Server won't start**

   - Check if port 3000 is available
   - Verify Node.js version (requires Node.js 14+)

2. **WordPress can't connect**

   - Check server URL in WordPress settings
   - Ensure CORS is properly configured
   - Verify firewall settings

3. **Automation fails**
   - Check browser dependencies
   - Verify Puppeteer installation
   - Check logs for detailed error messages

### Debug Mode

Set `NODE_ENV=development` in `.env` for verbose logging.

## Development

### Project Structure

```
src/
├── app.js              # Main application file
├── routes/             # API routes
│   ├── api.js         # General API routes
│   └── automation.js  # Automation routes
└── services/          # Business logic
    ├── LogService.js  # Logging service
    └── AutomationService.js # Automation logic
```

### Adding New Features

1. Create new routes in `src/routes/`
2. Add business logic in `src/services/`
3. Update the main `app.js` file
4. Update this README

## License

MIT License - See LICENSE file for details
