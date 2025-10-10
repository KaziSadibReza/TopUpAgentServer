const express = require("express");
const router = express.Router();

// We'll get the automation service instance from the app context instead of creating a new one
let automationService = null;

// Function to set the automation service (called from app.js)
router.setAutomationService = (service) => {
  automationService = service;
};

/**
 * Execute single automation directly (DEPRECATED - NOW USES QUEUE)
 * POST /api/automation/execute
 */
router.post("/execute", async (req, res) => {
  try {
    if (!automationService) {
      return res.status(503).json({
        success: false,
        error: "Automation service not available",
      });
    }

    const { playerId, redimensionCode, requestId } = req.body;

    // Validate required fields
    if (!playerId || !redimensionCode) {
      return res.status(400).json({
        success: false,
        error: "Player ID and redimension code are required",
      });
    }

    // CRITICAL: Route all automations through queue to prevent conflicts
    console.log(
      "⚠️ Direct automation request - routing through queue for safety"
    );

    // Import QueueService to add to queue instead of running directly
    const QueueService = require("../services/queue-service");
    const queueService = new QueueService(automationService);

    const result = await queueService.addToQueue({
      queueType: "direct_api",
      sourceSite: req.get("host") || "direct_api",
      licenseKey: redimensionCode,
      redimensionCode: redimensionCode,
      playerId: playerId,
      priority: 1, // Give direct API calls higher priority
      createdBy: "direct_api",
    });

    if (result.success) {
      res.json({
        success: true,
        requestId: `queue_${result.queueId}`,
        queueId: result.queueId,
        message:
          "Automation added to queue successfully (routed through queue for safety)",
        note: "Use /api/queue/status/{queueId} to check status",
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error || "Failed to add automation to queue",
      });
    }
  } catch (error) {
    console.error("❌ Automation API: Error executing automation:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * Get automation status
 * GET /api/automation/status/:requestId
 */
router.get("/status/:requestId", async (req, res) => {
  try {
    if (!automationService) {
      return res.status(503).json({
        success: false,
        error: "Automation service not available",
      });
    }

    const { requestId } = req.params;

    const status = await automationService.getJobStatus(requestId);

    res.json({
      success: true,
      requestId,
      status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Automation API: Error getting status:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * Cancel automation
 * POST /api/automation/cancel/:requestId
 */
router.post("/cancel/:requestId", async (req, res) => {
  try {
    if (!automationService) {
      return res.status(503).json({
        success: false,
        error: "Automation service not available",
      });
    }

    const { requestId } = req.params;

    const result = await automationService.cancelJob(requestId);

    res.json({
      success: true,
      requestId,
      cancelled: result,
      message: result
        ? "Automation cancelled"
        : "Automation not found or already completed",
    });
  } catch (error) {
    console.error("❌ Automation API: Error cancelling automation:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * Get automation service status
 * GET /api/automation/service-status
 */
router.get("/service-status", async (req, res) => {
  try {
    if (!automationService) {
      return res.status(503).json({
        success: false,
        error: "Automation service not available",
      });
    }

    const status = await automationService.getStatus();

    res.json({
      success: true,
      status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Automation API: Error getting service status:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

module.exports = router;
