const express = require("express");
const router = express.Router();
const DatabaseService = require("../services/DatabaseService");
const AutomationService = require("../services/AutomationService");

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
    const runningJobs = AutomationService.getRunningJobs();
    const runningCount = runningJobs.length;

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

module.exports = router;
