const express = require("express");
const router = express.Router();
const LogService = require("../services/LogService");

// Get server status
router.get("/status", (req, res) => {
  res.json({
    status: "running",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: "1.0.0",
  });
});

// Get API key (generate if not exists)
router.get("/key", (req, res) => {
  try {
    // Check if API key is set in environment
    let apiKey = process.env.API_KEY;

    if (!apiKey) {
      // Generate a new API key if none exists
      const crypto = require("crypto");
      apiKey = crypto.randomBytes(32).toString("hex");
      LogService.log("info", "Generated new API key for client request");
    }

    res.json({
      success: true,
      apiKey: apiKey,
      message: "API key retrieved successfully",
    });
  } catch (error) {
    LogService.log("error", "Failed to generate API key", {
      error: error.message,
    });
    res.status(500).json({
      success: false,
      error: "Failed to generate API key",
    });
  }
});

// Get logs
router.get("/logs", (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const level = req.query.level;

  let logs;
  if (level) {
    logs = LogService.getLogsByLevel(level, limit);
  } else {
    logs = LogService.getLogs(limit);
  }

  res.json({
    success: true,
    logs,
    total: logs.length,
  });
});

// Clear logs
router.post("/logs/clear", (req, res) => {
  LogService.clearLogs();
  res.json({
    success: true,
    message: "Logs cleared successfully",
  });
});

module.exports = router;
