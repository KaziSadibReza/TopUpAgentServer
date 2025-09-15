const express = require("express");
const router = express.Router();
const fs = require("fs").promises;
const path = require("path");
const { Op } = require("sequelize");

/**
 * Get real-time logs via Socket.IO endpoint info
 * GET /api/logs/socket-info
 */
router.get("/socket-info", (req, res) => {
  res.json({
    success: true,
    socketConnection: {
      url: `${req.protocol}://${req.get("host")}`,
      events: {
        connect: "Connect to real-time logs",
        "join-automation": "Join automation events channel",
        "automation-log": "Receive automation log events",
        "queue-log": "Receive queue log events",
        "automation-started": "Automation job started",
        "automation-completed": "Automation job completed",
        "automation-failed": "Automation job failed",
        "queue-item-added": "New item added to queue",
        "queue-item-processed": "Queue item processed",
        "running-jobs": "Current running jobs status",
      },
      example: {
        javascript: `
const socket = io('${req.protocol}://${req.get("host")}');
socket.emit('join-automation');
socket.on('automation-log', (logData) => {
  console.log('Real-time log:', logData);
});
        `.trim(),
      },
    },
    timestamp: new Date().toISOString(),
  });
});

/**
 * Get application logs from file system
 * GET /api/logs
 */
router.get("/", async (req, res) => {
  try {
    const {
      level = "all",
      lines = 100,
      tail = true,
      search,
      dateFrom,
      dateTo,
    } = req.query;

    const logsDir = path.join(__dirname, "../../logs");
    const logFiles = await fs.readdir(logsDir).catch(() => []);

    if (logFiles.length === 0) {
      return res.json({
        success: true,
        logs: [],
        message: "No log files found",
        timestamp: new Date().toISOString(),
      });
    }

    // Get the most recent log file
    const sortedFiles = logFiles
      .filter((file) => file.endsWith(".log"))
      .sort((a, b) => b.localeCompare(a))
      .slice(0, 5); // Get last 5 log files

    let allLogs = [];

    for (const logFile of sortedFiles) {
      try {
        const logPath = path.join(logsDir, logFile);
        const content = await fs.readFile(logPath, "utf8");
        const logLines = content.split("\n").filter((line) => line.trim());

        // Parse each log line
        const parsedLogs = logLines.map((line) => {
          try {
            const logEntry = JSON.parse(line);
            return {
              ...logEntry,
              file: logFile,
              timestamp: logEntry.timestamp || new Date().toISOString(),
            };
          } catch {
            // Handle non-JSON log lines
            return {
              level: "info",
              message: line,
              file: logFile,
              timestamp: new Date().toISOString(),
            };
          }
        });

        allLogs = allLogs.concat(parsedLogs);
      } catch (error) {
        console.error(`Failed to read log file ${logFile}:`, error);
      }
    }

    // Apply filters
    let filteredLogs = allLogs;

    if (level !== "all") {
      filteredLogs = filteredLogs.filter((log) => log.level === level);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredLogs = filteredLogs.filter(
        (log) =>
          (log.message && log.message.toLowerCase().includes(searchLower)) ||
          (log.requestId &&
            log.requestId.toLowerCase().includes(searchLower)) ||
          (log.playerId && log.playerId.toLowerCase().includes(searchLower))
      );
    }

    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      filteredLogs = filteredLogs.filter(
        (log) => new Date(log.timestamp) >= fromDate
      );
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      filteredLogs = filteredLogs.filter(
        (log) => new Date(log.timestamp) <= toDate
      );
    }

    // Sort by timestamp
    filteredLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Apply limit
    if (tail) {
      filteredLogs = filteredLogs.slice(0, parseInt(lines));
    } else {
      filteredLogs = filteredLogs.slice(-parseInt(lines));
    }

    res.json({
      success: true,
      logs: filteredLogs,
      metadata: {
        totalFiles: sortedFiles.length,
        totalLogs: allLogs.length,
        filteredLogs: filteredLogs.length,
        filters: { level, lines, search, dateFrom, dateTo },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Logs API: Error fetching logs:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch logs",
    });
  }
});

/**
 * Get available log files
 * GET /api/logs/files
 */
router.get("/files", async (req, res) => {
  try {
    const logsDir = path.join(__dirname, "../../logs");
    const files = await fs.readdir(logsDir).catch(() => []);

    const logFiles = [];
    for (const file of files) {
      if (file.endsWith(".log")) {
        try {
          const filePath = path.join(logsDir, file);
          const stats = await fs.stat(filePath);
          logFiles.push({
            name: file,
            size: stats.size,
            modified: stats.mtime.toISOString(),
            created: stats.birthtime.toISOString(),
          });
        } catch (error) {
          console.error(`Failed to get stats for ${file}:`, error);
        }
      }
    }

    // Sort by modification time (newest first)
    logFiles.sort((a, b) => new Date(b.modified) - new Date(a.modified));

    res.json({
      success: true,
      files: logFiles,
      totalFiles: logFiles.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Logs API: Error fetching log files:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch log files",
    });
  }
});

/**
 * Download specific log file
 * GET /api/logs/download/:filename
 */
router.get("/download/:filename", async (req, res) => {
  try {
    const { filename } = req.params;

    // Security: only allow .log files and prevent directory traversal
    if (
      !filename.endsWith(".log") ||
      filename.includes("..") ||
      filename.includes("/")
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid filename",
      });
    }

    const logsDir = path.join(__dirname, "../../logs");
    const filePath = path.join(logsDir, filename);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({
        success: false,
        error: "Log file not found",
      });
    }

    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    const fileStream = require("fs").createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error("Logs API: Error downloading file:", error);
    res.status(500).json({
      success: false,
      error: "Failed to download log file",
    });
  }
});

/**
 * Clear/delete logs
 * DELETE /api/logs
 */
router.delete("/", async (req, res) => {
  try {
    const { confirmDelete, olderThanDays = 7, keepFiles = 2, level } = req.body;

    if (!confirmDelete) {
      return res.status(400).json({
        success: false,
        error: "Please confirm deletion by setting confirmDelete: true",
      });
    }

    const logsDir = path.join(__dirname, "../../logs");
    const files = await fs.readdir(logsDir).catch(() => []);
    const logFiles = files.filter((file) => file.endsWith(".log"));

    if (logFiles.length === 0) {
      return res.json({
        success: true,
        message: "No log files to delete",
        deletedFiles: 0,
      });
    }

    // Sort files by modification time (newest first)
    const fileStats = [];
    for (const file of logFiles) {
      try {
        const filePath = path.join(logsDir, file);
        const stats = await fs.stat(filePath);
        fileStats.push({
          name: file,
          path: filePath,
          modified: stats.mtime,
        });
      } catch (error) {
        console.error(`Failed to get stats for ${file}:`, error);
      }
    }

    fileStats.sort((a, b) => b.modified - a.modified);

    // Keep the newest files
    const filesToKeep = fileStats.slice(0, keepFiles);
    const filesToCheck = fileStats.slice(keepFiles);

    // Delete files older than specified days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const deletedFiles = [];
    for (const fileInfo of filesToCheck) {
      if (fileInfo.modified < cutoffDate) {
        try {
          await fs.unlink(fileInfo.path);
          deletedFiles.push(fileInfo.name);
        } catch (error) {
          console.error(`Failed to delete ${fileInfo.name}:`, error);
        }
      }
    }

    res.json({
      success: true,
      message: `Deleted ${deletedFiles.length} log files older than ${olderThanDays} days`,
      deletedFiles,
      keptFiles: filesToKeep.map((f) => f.name),
      settings: { olderThanDays, keepFiles },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Logs API: Error deleting logs:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete logs",
    });
  }
});

/**
 * Get log statistics
 * GET /api/logs/stats
 */
router.get("/stats", async (req, res) => {
  try {
    const { hours = 24 } = req.query;

    const logsDir = path.join(__dirname, "../../logs");
    const files = await fs.readdir(logsDir).catch(() => []);
    const logFiles = files.filter((file) => file.endsWith(".log"));

    let totalSize = 0;
    let logCounts = { error: 0, warn: 0, info: 0, debug: 0 };
    let recentLogs = [];

    for (const logFile of logFiles) {
      try {
        const logPath = path.join(logsDir, logFile);
        const stats = await fs.stat(logPath);
        totalSize += stats.size;

        // Only analyze recent files for performance
        if (stats.mtime > new Date(Date.now() - hours * 60 * 60 * 1000)) {
          const content = await fs.readFile(logPath, "utf8");
          const lines = content.split("\n").filter((line) => line.trim());

          for (const line of lines) {
            try {
              const logEntry = JSON.parse(line);
              if (logEntry.level) {
                logCounts[logEntry.level] =
                  (logCounts[logEntry.level] || 0) + 1;
              }

              // Keep track of recent logs for activity
              if (logEntry.timestamp) {
                const logTime = new Date(logEntry.timestamp);
                if (logTime > new Date(Date.now() - hours * 60 * 60 * 1000)) {
                  recentLogs.push({
                    level: logEntry.level,
                    timestamp: logEntry.timestamp,
                    message: logEntry.message,
                  });
                }
              }
            } catch {
              // Handle non-JSON lines
              logCounts.info = (logCounts.info || 0) + 1;
            }
          }
        }
      } catch (error) {
        console.error(`Failed to analyze log file ${logFile}:`, error);
      }
    }

    // Sort recent logs by timestamp
    recentLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      success: true,
      stats: {
        period: `${hours} hours`,
        files: {
          total: logFiles.length,
          totalSize: `${(totalSize / 1024 / 1024).toFixed(2)} MB`,
        },
        logCounts,
        totalLogs: Object.values(logCounts).reduce(
          (sum, count) => sum + count,
          0
        ),
        recentActivity: recentLogs.slice(0, 10), // Last 10 recent logs
        activityByHour: getActivityByHour(recentLogs, hours),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Logs API: Error fetching log stats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch log statistics",
    });
  }
});

// Helper function to group logs by hour
function getActivityByHour(logs, hours) {
  const hourlyActivity = {};
  const now = new Date();

  // Initialize hours
  for (let i = 0; i < hours; i++) {
    const hour = new Date(now - i * 60 * 60 * 1000);
    const hourKey = hour.toISOString().slice(0, 13); // YYYY-MM-DDTHH
    hourlyActivity[hourKey] = 0;
  }

  // Count logs per hour
  logs.forEach((log) => {
    const logHour = new Date(log.timestamp).toISOString().slice(0, 13);
    if (hourlyActivity.hasOwnProperty(logHour)) {
      hourlyActivity[logHour]++;
    }
  });

  return hourlyActivity;
}

module.exports = router;
