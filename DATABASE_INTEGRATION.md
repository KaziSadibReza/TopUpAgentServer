# Database Integration for Top Up Agent

## Overview

The Top Up Agent now includes a comprehensive database system using SQLite and Sequelize ORM to store automation logs and results for better tracking, analytics, and historical data management.

## Database Structure

### Tables

#### `automation_results`

Stores main automation job information:

- `id` - Primary key
- `jobId` - Unique job identifier
- `playerId` - Player ID for the automation
- `redimensionCode` - Redimension code used
- `packageName` - Package name derived from code
- `status` - Job status (pending, running, completed, failed, cancelled)
- `startTime` - When the job started
- `endTime` - When the job ended
- `duration` - Duration in milliseconds
- `success` - Boolean indicating success/failure
- `errorMessage` - Error message if failed
- `screenshotPath` - Path to screenshot file
- `metadata` - JSON field for additional data

#### `automation_logs`

Stores detailed logs for each job:

- `id` - Primary key
- `jobId` - Links to automation_results
- `level` - Log level (info, success, warning, error)
- `message` - Log message
- `timestamp` - When the log was created
- `playerId` - Player ID (for easy filtering)
- `redimensionCode` - Redimension code
- `packageName` - Package name

### Relationships

- One automation result can have many logs
- Logs are linked to results via `jobId`

## Features

### 1. Real-time Logging

- All logs are stored in both file and database
- Database logs include metadata for better filtering
- Real-time updates via Socket.io continue to work

### 2. Historical Data

- Complete history of all automation attempts
- Success/failure rates and statistics
- Duration tracking and performance metrics

### 3. Advanced Filtering

- Filter by player ID, date range, status, success rate
- Search logs by level, job ID, or content
- Pagination support for large datasets

### 4. Analytics & Statistics

- Success rate calculations
- Average duration metrics
- Error pattern analysis
- Player-specific statistics

## API Endpoints

### Database Routes (`/database/`)

#### Get Statistics

```
GET /database/stats?playerId=123&dateFrom=2025-01-01&dateTo=2025-01-31
```

#### Get Automation Results

```
GET /database/results?status=completed&success=true&limit=50&offset=0
```

#### Get Specific Result with Logs

```
GET /database/results/{jobId}
```

#### Get Logs

```
GET /database/logs?level=error&playerId=123&limit=100
GET /database/logs/{jobId}?limit=500
```

#### Cleanup Old Data

```
POST /database/cleanup
Body: { "daysToKeep": 30 }
```

## Usage Examples

### Getting Success Rate for a Player

```javascript
const response = await fetch("/database/stats?playerId=123456");
const stats = await response.json();
console.log(`Success rate: ${stats.data.successRate}%`);
```

### Finding Failed Jobs

```javascript
const response = await fetch("/database/results?success=false&limit=10");
const failedJobs = await response.json();
failedJobs.data.forEach((job) => {
  console.log(`Job ${job.jobId} failed: ${job.errorMessage}`);
});
```

### Getting Error Logs

```javascript
const response = await fetch("/database/logs?level=error");
const errorLogs = await response.json();
```

## Database Maintenance

### Automatic Cleanup

The system includes automatic cleanup functionality to prevent database bloat:

- Old logs older than specified days are automatically deleted
- Completed/failed jobs older than retention period are removed
- Running jobs are never auto-deleted

### Manual Cleanup

```javascript
// Clean up data older than 30 days
await DatabaseService.cleanupOldLogs(30);
```

### Backup

Since SQLite is file-based, backup is simple:

1. Copy the `database/automation.db` file
2. Store it in a safe location
3. Restore by replacing the file

## Integration Points

### AutomationService Updates

- All log messages now go to both file and database
- Job start/end tracking with duration calculation
- Success/failure tracking with metadata
- Screenshot path storage

### WordPress Plugin

The WordPress plugin can now:

- Query historical data via AJAX
- Display success statistics
- Show player-specific automation history
- Generate reports and analytics

## Benefits

1. **Data Persistence** - No more lost log data on server restart
2. **Analytics** - Rich statistical data for monitoring
3. **Debugging** - Better error tracking and pattern analysis
4. **Reporting** - Historical data for business intelligence
5. **Scalability** - Efficient querying with proper indexing
6. **Maintenance** - Automatic cleanup prevents storage bloat

## Configuration

### Environment Variables

- Database file location is configurable via file path
- SQLite settings can be adjusted in `config/database.js`

### Performance Settings

- Connection pooling (handled by Sequelize)
- Query optimization with proper indexes
- Configurable log retention periods

## Migration

Existing installations will automatically:

1. Create the database on first startup
2. Begin logging new automation attempts
3. Maintain backward compatibility with file-based logs
4. Gradually build historical data

The database integration is fully backward-compatible and doesn't affect existing functionality.
