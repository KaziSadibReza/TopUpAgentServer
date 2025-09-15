# 🚀 TopUp Agent - Complete API Documentation

## 🔑 Authentication

All API endpoints require the header: `x-api-key: 63bb16f0d85a2b1a90b329a2a8d39e3cf885a238a1ea632be6c375a97957e3e9`

---

## 📋 **1. QUEUE MANAGEMENT APIs**

### ➕ Add to Queue

**Endpoint:** `POST /api/queue/add`

**Three Queue Types:**

#### 🔸 **Single Automation**

```json
{
  "queueType": "single",
  "playerId": "PLAYER123",
  "redimensionCode": "5060XXXX",
  "sourceSite": "http://yoursite.com",
  "productName": "Test Product",
  "licenseKey": "license-key-123"
}
```

#### 🔸 **Group Automation** (Multiple codes for one player)

```json
{
  "queueType": "group",
  "playerId": "PLAYER123",
  "redimensionCodes": ["5060XXXX", "5060YYYY", "5060ZZZZ"],
  "sourceSite": "http://yoursite.com",
  "productName": "Group Product",
  "licenseKey": "license-key-group"
}
```

#### 🔸 **Manual Automation**

```json
{
  "queueType": "manual",
  "playerId": "PLAYER123",
  "redimensionCode": "5060XXXX",
  "priority": 1
}
```

### 📊 Queue Status & Management

| Endpoint             | Method | Description                             |
| -------------------- | ------ | --------------------------------------- |
| `/api/queue/status`  | GET    | Queue statistics and current automation |
| `/api/queue/recent`  | GET    | Recent queue items                      |
| `/api/queue/pending` | GET    | Get pending queue items                 |
| `/api/queue/running` | GET    | Get currently running automations       |
| `/api/queue/process` | POST   | Manually trigger queue processing       |

### ⏸️ Queue Control

| Endpoint                | Method | Description                |
| ----------------------- | ------ | -------------------------- |
| `/api/queue/pause`      | POST   | Pause queue processing     |
| `/api/queue/resume`     | POST   | Resume queue processing    |
| `/api/queue/cancel/:id` | POST   | Cancel specific queue item |

**Cancel Example:**

```json
{
  "reason": "User requested cancellation"
}
```

### 🧹 Queue Cleanup

**Endpoint:** `DELETE /api/queue/cleanup`

```json
{
  "confirmCleanup": true,
  "olderThanHours": 24,
  "status": "completed"
}
```

---

## 🤖 **2. AUTOMATION CONTROL APIs**

### 🎮 Direct Automation Execution

**Endpoint:** `POST /api/automation/execute`

```json
{
  "playerId": "PLAYER123",
  "redimensionCode": "5060XXXX",
  "requestId": "custom-request-id"
}
```

### 📊 Automation Status & Control

| Endpoint                            | Method | Description                            |
| ----------------------------------- | ------ | -------------------------------------- |
| `/api/automation/service-status`    | GET    | Check if automation service is running |
| `/api/automation/status/:requestId` | GET    | Get status of specific automation      |
| `/api/automation/cancel/:requestId` | POST   | Cancel running automation              |

---

## 📈 **3. RESULTS & AUTOMATION HISTORY**

### 📋 View Results

| Endpoint              | Method | Description                         |
| --------------------- | ------ | ----------------------------------- |
| `/api/results`        | GET    | List automation results (paginated) |
| `/api/results/:id`    | GET    | Get specific automation result      |
| `/api/results/search` | POST   | Search results with filters         |

**Search Example:**

```json
{
  "status": "completed",
  "playerId": "PLAYER123",
  "dateFrom": "2025-09-01",
  "dateTo": "2025-09-06"
}
```

### 📊 History Management

| Endpoint              | Method | Description                         |
| --------------------- | ------ | ----------------------------------- |
| `/api/history`        | GET    | Get automation history with filters |
| `/api/history/stats`  | GET    | Get automation statistics           |
| `/api/history/export` | GET    | Export history (JSON/CSV)           |

**History Filters (Query Parameters):**

- `page=1` - Page number
- `limit=20` - Results per page
- `status=completed` - Filter by status
- `playerId=PLAYER123` - Filter by player
- `dateFrom=2025-09-01` - Start date
- `dateTo=2025-09-06` - End date

### 🗑️ Delete History

**Endpoint:** `DELETE /api/history`

```json
{
  "confirmDelete": true,
  "olderThan": "2025-08-01"
}
```

**Delete ALL History:** `DELETE /api/history/all`

```json
{
  "confirmDelete": true,
  "keepDays": 7
}
```

---

## 📝 **4. LOGS & REAL-TIME MONITORING**

### 📜 Log Management

| Endpoint                       | Method | Description                 |
| ------------------------------ | ------ | --------------------------- |
| `/api/logs`                    | GET    | Get application logs        |
| `/api/logs/files`              | GET    | List available log files    |
| `/api/logs/download/:filename` | GET    | Download specific log file  |
| `/api/logs/stats`              | GET    | Log statistics and activity |

**Log Filters (Query Parameters):**

- `level=info` - Filter by log level (error, warn, info, debug)
- `lines=100` - Number of lines to return
- `search=automation` - Search in log messages
- `dateFrom=2025-09-01` - Filter by date range

### 🧹 Clear Logs

**Endpoint:** `DELETE /api/logs`

```json
{
  "confirmDelete": true,
  "olderThanDays": 7,
  "keepFiles": 2
}
```

### 🔌 Real-Time Socket.IO Events

**Endpoint:** `GET /api/logs/socket-info` - Get connection details

**Socket Events:**

```javascript
const socket = io("http://localhost:3000");

// Join automation events channel
socket.emit("join-automation");

// Listen for real-time events
socket.on("automation-log", (logData) => {
  console.log("Real-time log:", logData);
});

socket.on("automation-started", (data) => {
  console.log("Automation started:", data);
});

socket.on("automation-completed", (data) => {
  console.log("Automation completed:", data);
});

socket.on("queue-item-added", (data) => {
  console.log("New queue item:", data);
});
```

---

## 🔧 **5. DATABASE MANAGEMENT**

### 📊 Database Information

| Endpoint                | Method | Description            |
| ----------------------- | ------ | ---------------------- |
| `/api/database/stats`   | GET    | Database statistics    |
| `/api/database/results` | GET    | All automation results |
| `/api/database/cleanup` | POST   | Clean up old data      |

### 🛠️ Database Migration

| Endpoint                      | Method | Description                   |
| ----------------------------- | ------ | ----------------------------- |
| `/api/migration/check-schema` | GET    | Check current database schema |
| `/api/migration/add-columns`  | POST   | Add missing database columns  |
| `/api/migration/reset`        | POST   | Reset database (DANGEROUS)    |

**Migration Example:**

```json
{
  "confirmMigration": true
}
```

---

## 🔧 **6. SYSTEM HEALTH & STATUS**

### 💊 Health Checks

| Endpoint      | Method | Description            | Auth Required |
| ------------- | ------ | ---------------------- | ------------- |
| `/health`     | GET    | Basic health check     | ❌ No         |
| `/api/status` | GET    | Detailed system status | ❌ No         |
| `/api/key`    | GET    | Get API key for setup  | ❌ No         |

---

## 📝 **API RESPONSE FORMATS**

### ✅ Success Response

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully",
  "timestamp": "2025-09-06T01:30:00.000Z"
}
```

### ❌ Error Response

```json
{
  "success": false,
  "error": "Error description",
  "details": "Additional error details",
  "timestamp": "2025-09-06T01:30:00.000Z"
}
```

---

## 🎯 **QUICK START EXAMPLES**

### 1. **Add Single Automation**

```bash
curl -X POST http://localhost:3000/api/queue/add \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "queueType": "single",
    "playerId": "PLAYER123",
    "redimensionCode": "5060XXXX",
    "licenseKey": "license-123"
  }'
```

### 2. **Check Queue Status**

```bash
curl -X GET http://localhost:3000/api/queue/status \\
  -H "x-api-key: YOUR_API_KEY"
```

### 3. **Get Real-time Logs**

```javascript
const socket = io("http://localhost:3000");
socket.emit("join-automation");
socket.on("automation-log", console.log);
```

### 4. **Export History as CSV**

```bash
curl -X GET "http://localhost:3000/api/history/export?format=csv" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -o automation-history.csv
```

---

## 🔗 **WORKFLOW EXAMPLES**

### **Complete Automation Workflow:**

1. **Add to Queue:** `POST /api/queue/add`
2. **Monitor Progress:** `WebSocket events` or `GET /api/queue/status`
3. **Check Results:** `GET /api/results`
4. **View History:** `GET /api/history`
5. **Cleanup:** `DELETE /api/queue/cleanup`

### **Debugging Workflow:**

1. **Check Service:** `GET /api/automation/service-status`
2. **View Logs:** `GET /api/logs?level=error`
3. **Real-time Monitor:** `WebSocket connection`
4. **Download Logs:** `GET /api/logs/download/app.log`

---

## 🚦 **STATUS CODES**

- **200** - Success
- **400** - Bad Request (validation errors)
- **401** - Unauthorized (invalid API key)
- **404** - Not Found
- **500** - Internal Server Error

---

## 🔧 **FEATURES IMPLEMENTED**

✅ **Queue Management** - Single, Group, Manual automation types  
✅ **Real-time Monitoring** - Socket.IO events for live updates  
✅ **History Management** - View, filter, export, delete automation history  
✅ **Log Management** - View, download, clean application logs  
✅ **Queue Control** - Pause, resume, cancel queue operations  
✅ **Auto-cleanup** - Automatic removal of completed queue items  
✅ **Database Migration** - Schema updates and maintenance  
✅ **Health Monitoring** - System status and diagnostics

---

🎉 **Your automation server is now complete with all requested features!**
