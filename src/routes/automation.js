const express = require("express");
const router = express.Router();
const LogService = require("../services/LogService");

// Start automation (ROUTED THROUGH QUEUE FOR SAFETY)
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

    LogService.log(
      "info",
      "Automation request received - routing through queue",
      {
        playerId,
        redimensionCode: redimensionCode.substring(0, 10) + "...",
        requestId: finalRequestId,
      }
    );

    // CRITICAL: Route through queue to prevent conflicts
    const QueueService = require("../services/queue-service");
    const queueService = new QueueService();

    const result = await queueService.addToQueue({
      queueType: "legacy_api",
      sourceSite: req.get("host") || "legacy_api",
      licenseKey: redimensionCode,
      redimensionCode: redimensionCode,
      playerId: playerId,
      priority: 1, // Higher priority for legacy API
      createdBy: "legacy_api",
    });

    if (result.success) {
      res.json({
        success: true,
        requestId: `queue_${result.queueId}`,
        queueId: result.queueId,
        message: "Automation added to queue successfully (routed for safety)",
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error || "Failed to add automation to queue",
      });
    }
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
