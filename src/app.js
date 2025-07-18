const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");

// Global error handlers to prevent crashes
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  // Log to file service if available
  try {
    if (LogService) {
      LogService.log("error", "Unhandled Promise Rejection", {
        reason: reason?.message || reason,
        stack: reason?.stack,
      });
    }
  } catch (logError) {
    console.error("Failed to log unhandled rejection:", logError);
  }
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  // Log to file service if available
  try {
    if (LogService) {
      LogService.log("error", "Uncaught Exception", {
        error: error.message,
        stack: error.stack,
      });
    }
  } catch (logError) {
    console.error("Failed to log uncaught exception:", logError);
  }
  // Don't exit process for better stability
});

// Import routes
const apiRoutes = require("./routes/api");
const automationRoutes = require("./routes/automation");
const databaseRoutes = require("./routes/database");

// Import middleware
const ApiAuth = require("./middleware/ApiAuth");

// Import services
const LogService = require("./services/LogService");
const DatabaseService = require("./services/DatabaseService");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use("/api/", limiter);

// CORS configuration
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      // Allow all origins in development
      if (process.env.NODE_ENV !== "production") {
        return callback(null, true);
      }

      // In production, check against allowed origins
      const allowedOrigins = [
        "http://botplugin.local",
        "https://botplugin.local",
        "http://localhost",
        "https://localhost",
        "http://localhost:3000",
        "http://127.0.0.1:8080",
      ];

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Body parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Initialize LogService with socket.io
LogService.init(io);

// Initialize AutomationService with socket.io for real-time job updates
const AutomationService = require("./services/AutomationService");
AutomationService.setSocketIO(io);

// Health check endpoint (no auth required)
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    service: "Top Up Agent Server",
  });
});

// Status endpoint (no auth required)
app.get("/api/status", (req, res) => {
  res.json({
    status: "running",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: "1.0.0",
  });
});

// API key endpoint (no auth required - returns the API key for WordPress setup)
app.get("/api/key", (req, res) => {
  res.json({
    success: true,
    apiKey: ApiAuth.getApiKey(),
    message: "Use this API key in WordPress settings",
  });
});

// Routes with API authentication
app.use("/api", ApiAuth.optionalAuthenticate.bind(ApiAuth), apiRoutes);
app.use(
  "/automation",
  ApiAuth.optionalAuthenticate.bind(ApiAuth),
  automationRoutes
);
app.use(
  "/database",
  ApiAuth.optionalAuthenticate.bind(ApiAuth),
  databaseRoutes
);

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  LogService.log("info", "Client connected", { socketId: socket.id });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    LogService.log("info", "Client disconnected", { socketId: socket.id });
  });

  // Join automation room for real-time updates
  socket.on("join-automation", () => {
    socket.join("automation");
    const jobs = AutomationService.getRunningJobsForClient();
    socket.emit("running-jobs", jobs);
    LogService.log("info", "Client joined automation room", {
      socketId: socket.id,
    });
  });

  // Handle log requests
  socket.on("get-logs", (data) => {
    const logs = LogService.getLogs(data.limit || 50);
    socket.emit("logs", logs);
  });

  // Handle clear logs
  socket.on("clear-logs", () => {
    LogService.clearLogs();
    socket.emit("logs-cleared");
  });

  // Handle running jobs requests
  socket.on("get-running-jobs", () => {
    // Get only truly running jobs (not completed/failed/cancelled)
    const runningJobs = AutomationService.getRunningJobs();
    const jobs = runningJobs.map((job) => ({
      jobId: job.requestId,
      requestId: job.requestId, // Include both for compatibility
      playerId: job.playerId,
      packageName: job.packageName,
      status: job.status,
      startTime: job.startTime,
      endTime: job.endTime,
      duration: job.endTime
        ? job.endTime.getTime() - job.startTime.getTime()
        : Date.now() - job.startTime.getTime(),
    }));
    socket.emit("running-jobs", jobs);
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  LogService.log("error", "Server error", {
    error: err.message,
    stack: err.stack,
  });
  res.status(500).json({ error: "Something went wrong!" });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

server.listen(PORT, async () => {
  console.log(`Top Up Agent Server running on port ${PORT}`);
  LogService.log("info", `Server started on port ${PORT}`);

  // Initialize database
  console.log("Initializing database...");
  const dbInitialized = await DatabaseService.initialize();
  if (dbInitialized) {
    console.log("Database initialized successfully");
    LogService.log("info", "Database initialized successfully");
  } else {
    console.error("Failed to initialize database");
    LogService.log("error", "Failed to initialize database");
  }
});

module.exports = app;
