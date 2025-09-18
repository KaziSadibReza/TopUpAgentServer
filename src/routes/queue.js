const express = require("express");
const router = express.Router();
const QueueService = require("../services/queue-service");

// Initialize queue service (will be updated with automation service instance)
let queueService = new QueueService();

// Set automation service instance (called from app.js)
function setAutomationService(automationServiceInstance) {
  queueService = new QueueService(automationServiceInstance);
  console.log("🔗 Queue Routes: Updated with global AutomationService instance");
}

// Export the setter function
router.setAutomationService = setAutomationService;

/**
 * Add single automation to queue
 * POST /api/queue/add
 */
router.post("/add", async (req, res) => {
  try {
    const {
      queueType = "manual",
      sourceSite,
      siteId,
      orderId,
      productId,
      productName,
      licenseKey,
      redimensionCode,
      playerId,
      priority = 0,
      webhookUrl,
      apiKey,
    } = req.body;

    // Validate required fields
    if (!licenseKey || !playerId) {
      return res.status(400).json({
        success: false,
        error: "License key and player ID are required",
      });
    }

    const result = await queueService.addToQueue({
      queueType,
      sourceSite: sourceSite || req.get("host"),
      siteId,
      orderId,
      productId,
      productName,
      licenseKey,
      redimensionCode: redimensionCode || licenseKey, // Use licenseKey as fallback
      playerId,
      priority,
      webhookUrl,
      apiKey: apiKey || req.get("X-API-Key"),
    });

    if (result.success) {
      console.log(
        `📝 Queue API: Added automation - Queue ID: ${result.queueId}`
      );
      res.json({
        success: true,
        queueId: result.queueId,
        message: "Automation added to queue successfully",
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error("❌ Queue API: Error adding to queue:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * Add group automation to queue
 * POST /api/queue/add-group
 */
router.post("/add-group", async (req, res) => {
  try {
    const {
      sourceSite,
      orderId,
      productId,
      productName,
      licenseKeys,
      playerId,
      priority = 1,
      webhookUrl,
      apiKey,
    } = req.body;

    // Validate required fields
    if (!Array.isArray(licenseKeys) || licenseKeys.length === 0) {
      return res.status(400).json({
        success: false,
        error: "License keys array is required",
      });
    }

    if (!playerId) {
      return res.status(400).json({
        success: false,
        error: "Player ID is required",
      });
    }

    const result = await queueService.addGroupToQueue({
      sourceSite: sourceSite || req.get("host"),
      orderId,
      productId,
      productName,
      licenseKeys,
      playerId,
      priority,
      webhookUrl,
      apiKey: apiKey || req.get("X-API-Key"),
    });

    if (result.success) {
      console.log(
        `📦 Queue API: Added group automation - Group ID: ${result.groupId}, Items: ${result.totalAdded}`
      );
      res.json({
        success: true,
        groupId: result.groupId,
        queueIds: result.queueIds,
        totalAdded: result.totalAdded,
        message: `Group automation added with ${result.totalAdded} items`,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error("❌ Queue API: Error adding group to queue:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * Get queue status and statistics
 * GET /api/queue/status
 */
router.get("/status", async (req, res) => {
  try {
    const stats = await queueService.getQueueStats();

    res.json({
      success: true,
      stats: stats.queue || {},
      server: stats.server || {},
      currentAutomation: stats.currentAutomation || null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Queue API: Error getting status:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get queue status",
    });
  }
});

/**
 * Get recent queue items
 * GET /api/queue/recent
 */
router.get("/recent", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const items = await queueService.getRecentItems(limit);

    res.json({
      success: true,
      items,
      count: items.length,
    });
  } catch (error) {
    console.error("❌ Queue API: Error getting recent items:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get recent items",
    });
  }
});

/**
 * Manually trigger queue processing
 * POST /api/queue/process
 */
router.post("/process", async (req, res) => {
  try {
    // Trigger queue processing
    setImmediate(() => queueService.processQueue());

    res.json({
      success: true,
      message: "Queue processing triggered",
    });
  } catch (error) {
    console.error("❌ Queue API: Error triggering processing:", error);
    res.status(500).json({
      success: false,
      error: "Failed to trigger queue processing",
    });
  }
});

/**
 * Cancel queue item
 * POST /api/queue/cancel/:id
 */
router.post("/cancel/:id", async (req, res) => {
  try {
    const queueId = parseInt(req.params.id);

    if (!queueId) {
      return res.status(400).json({
        success: false,
        error: "Invalid queue ID",
      });
    }

    // Update queue item status to cancelled
    await queueService.updateQueueItemStatus(queueId, "cancelled", {
      completed_at: new Date(),
      error_message: "Cancelled by user",
    });

    res.json({
      success: true,
      message: `Queue item ${queueId} cancelled`,
    });
  } catch (error) {
    console.error("❌ Queue API: Error cancelling item:", error);
    res.status(500).json({
      success: false,
      error: "Failed to cancel queue item",
    });
  }
});

/**
 * Retry failed queue item
 * POST /api/queue/retry/:id
 */
router.post("/retry/:id", async (req, res) => {
  try {
    const queueId = parseInt(req.params.id);

    if (!queueId) {
      return res.status(400).json({
        success: false,
        error: "Invalid queue ID",
      });
    }

    // Reset queue item for retry
    await queueService.updateQueueItemStatus(queueId, "pending", {
      retry_count: 0,
      error_message: null,
      scheduled_at: new Date(),
    });

    res.json({
      success: true,
      message: `Queue item ${queueId} scheduled for retry`,
    });
  } catch (error) {
    console.error("❌ Queue API: Error retrying item:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retry queue item",
    });
  }
});

/**
 * Check if server is busy
 * GET /api/queue/busy
 */
router.get("/busy", async (req, res) => {
  try {
    const stats = await queueService.getQueueStats();
    const isBusy = stats.server?.is_busy || false;

    res.json({
      success: true,
      busy: isBusy,
      currentAutomation: stats.currentAutomation || null,
    });
  } catch (error) {
    console.error("❌ Queue API: Error checking busy status:", error);
    res.status(500).json({
      success: false,
      error: "Failed to check server status",
    });
  }
});

module.exports = router;
