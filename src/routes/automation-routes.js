const express = require("express");
const router = express.Router();

// We'll get the automation service instance from the app context instead of creating a new one
let automationService = null;

// Function to set the automation service (called from app.js)
router.setAutomationService = (service) => {
  automationService = service;
};

/**
 * Execute single automation directly (legacy endpoint)
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

    const automationRequestId = requestId || `direct_${Date.now()}`;

    // Execute automation directly
    const result = await automationService.runTopUpAutomation(
      playerId,
      redimensionCode,
      automationRequestId
    );

    if (result.success) {
      res.json({
        success: true,
        requestId: automationRequestId,
        result: result,
        message: "Automation completed successfully",
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error || "Automation failed",
        requestId: automationRequestId,
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
