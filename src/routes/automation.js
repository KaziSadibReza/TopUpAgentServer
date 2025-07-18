const express = require("express");
const router = express.Router();
const AutomationService = require("../services/AutomationService");
const LogService = require("../services/LogService");

// Start automation
router.post("/", async (req, res) => {
  try {
    const { playerId, redimensionCode, requestId } = req.body;

    if (!playerId || !redimensionCode) {
      return res.status(400).json({
        success: false,
        error: "Player ID and Redimension Code are required",
      });
    }

    const finalRequestId =
      requestId ||
      `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    LogService.log("info", "Automation request received", {
      playerId,
      redimensionCode: redimensionCode.substring(0, 10) + "...",
      requestId: finalRequestId,
    });

    // Start automation in background with proper error handling
    AutomationService.runTopUpAutomation(
      playerId,
      redimensionCode,
      finalRequestId
    )
      .then((result) => {
        LogService.log("info", "Automation completed successfully", {
          requestId: finalRequestId,
          result: result.success,
        });
      })
      .catch((error) => {
        LogService.log("error", "Automation failed", {
          error: error.message,
          requestId: finalRequestId,
          stack: error.stack,
        });
        // Don't throw here to prevent unhandled rejection
      });

    res.json({
      success: true,
      message: "Automation started successfully",
      requestId: finalRequestId,
    });
  } catch (error) {
    LogService.log("error", "Failed to start automation", {
      error: error.message,
    });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get automation status
router.get("/status/:requestId", async (req, res) => {
  try {
    const { requestId } = req.params;
    const status = await AutomationService.getJobStatus(requestId);

    res.json({
      success: true,
      status: status.status,
      ...status,
    });
  } catch (error) {
    LogService.log("error", "Failed to get automation status", {
      error: error.message,
    });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Cancel automation
router.post("/cancel/:requestId", async (req, res) => {
  try {
    const { requestId } = req.params;
    const result = await AutomationService.cancelJob(requestId);

    res.json(result);
  } catch (error) {
    LogService.log("error", "Failed to cancel automation", {
      error: error.message,
    });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get all running jobs
router.get("/jobs", async (req, res) => {
  try {
    const jobs = AutomationService.getRunningJobs();
    const status = await AutomationService.getStatus();

    res.json({
      success: true,
      jobs,
      status,
    });
  } catch (error) {
    LogService.log("error", "Failed to get running jobs", {
      error: error.message,
    });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get automation result
router.get("/result/:requestId", async (req, res) => {
  try {
    const { requestId } = req.params;
    const jobStatus = await AutomationService.getJobStatus(requestId);

    if (jobStatus.status === "not_found") {
      return res.status(404).json({
        success: false,
        error: "Job not found",
      });
    }

    res.json({
      success: true,
      result: jobStatus,
    });
  } catch (error) {
    LogService.log("error", "Failed to get automation result", {
      error: error.message,
    });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
