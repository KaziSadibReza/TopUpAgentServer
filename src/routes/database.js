const express = require("express");
const router = express.Router();
const DatabaseService = require("../services/DatabaseService");

// We'll get the automation service instance from the app context
let automationService = null;

// Function to set the automation service (called from app.js)
router.setAutomationService = (service) => {
  automationService = service;
};

// Get automation statistics
router.get("/stats", async (req, res) => {
  try {
    const { playerId, dateFrom, dateTo } = req.query;

    // Get database stats (completed jobs)
    const dbStats = await DatabaseService.getAutomationStats({
      playerId,
      dateFrom,
      dateTo,
    });

    // Get running jobs count from AutomationService
    let runningJobs = [];
    let runningCount = 0;

    if (automationService) {
      try {
        runningJobs = automationService.getRunningJobsForClient();
        runningCount = runningJobs.length;
      } catch (error) {
        console.warn("Failed to get running jobs:", error.message);
      }
    }

    // Combine stats
    const stats = {
      total: (dbStats.total || 0) + runningCount,
      completed: dbStats.completed || 0,
      failed: dbStats.failed || 0,
      running: runningCount,
      success_rate: dbStats.success_rate || 0,
      avg_duration: dbStats.avg_duration || 0,
    };

    console.log("Database stats response:", stats);

    res.json({
      success: true,
      data: stats,
      stats: stats, // Include both for compatibility
    });
  } catch (error) {
    console.error("Stats endpoint error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get automation results with filters
router.get("/results", async (req, res) => {
  try {
    const {
      playerId,
      status,
      success,
      dateFrom,
      dateTo,
      limit = 50,
      offset = 0,
    } = req.query;

    const results = await DatabaseService.getAutomationResults({
      playerId,
      status,
      success: success !== undefined ? success === "true" : undefined,
      dateFrom,
      dateTo,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get specific automation result with logs
router.get("/results/:jobId", async (req, res) => {
  try {
    const { jobId } = req.params;

    const result = await DatabaseService.getAutomationResult(jobId);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: "Automation result not found",
      });
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get logs for a specific job
router.get("/logs/:jobId", async (req, res) => {
  try {
    const { jobId } = req.params;
    const { level, dateFrom, dateTo, limit = 500, offset = 0 } = req.query;

    const logs = await DatabaseService.getAutomationLogs(jobId, {
      level,
      dateFrom,
      dateTo,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get all logs with filters
router.get("/logs", async (req, res) => {
  try {
    const {
      level,
      playerId,
      dateFrom,
      dateTo,
      limit = 500,
      offset = 0,
    } = req.query;

    const logs = await DatabaseService.getAllLogs({
      level,
      playerId,
      dateFrom,
      dateTo,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Clean up old logs and results
router.post("/cleanup", async (req, res) => {
  try {
    const { daysToKeep = 30 } = req.body;

    const result = await DatabaseService.cleanupOldLogs(parseInt(daysToKeep));

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Clean up screenshots
router.delete("/screenshots", async (req, res) => {
  try {
    console.log("🧹 Screenshot cleanup endpoint called");
    const fs = require("fs").promises;
    const path = require("path");

    const screenshotsDir = path.join(__dirname, "../../screenshots");
    console.log(`📂 Screenshots directory path: ${screenshotsDir}`);

    // Check if screenshots directory exists
    try {
      await fs.access(screenshotsDir);
      console.log("✅ Screenshots directory exists");
    } catch (error) {
      console.log("❌ Screenshots directory does not exist:", error.message);
      return res.json({
        success: true,
        deletedCount: 0,
        message: "Screenshots directory does not exist",
      });
    }

    // Read all files in screenshots directory
    const files = await fs.readdir(screenshotsDir);
    console.log(
      `📁 Found ${files.length} total files in directory:`,
      files.slice(0, 5)
    ); // Log first 5 files

    const imageFiles = files.filter(
      (file) =>
        file.endsWith(".png") || file.endsWith(".jpg") || file.endsWith(".jpeg")
    );
    console.log(`🖼️ Found ${imageFiles.length} image files to delete`);

    let deletedCount = 0;
    const deletedFiles = [];

    // Delete each image file
    for (const file of imageFiles) {
      try {
        const filePath = path.join(screenshotsDir, file);
        await fs.unlink(filePath);
        deletedCount++;
        deletedFiles.push(file);
        console.log(`🗑️ Deleted screenshot: ${file}`);
      } catch (error) {
        console.error(`❌ Failed to delete ${file}:`, error.message);
      }
    }

    console.log(`🧹 Screenshot cleanup: Deleted ${deletedCount} files`);

    res.json({
      success: true,
      deletedCount,
      deletedFiles,
      message: `Deleted ${deletedCount} screenshot files`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Screenshot cleanup error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

module.exports = router;
