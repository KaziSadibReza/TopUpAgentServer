const express = require("express");
const router = express.Router();
const QueueService = require("../services/queue-service");

// Initialize queue service
const queueService = new QueueService();

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
      redimensionCodes,
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
      redimensionCodes,
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
        message: "Group automation added to queue successfully",
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
      stats: {
        total: stats.queue?.total || 0,
        pending: stats.queue?.pending || 0,
        processing: stats.queue?.processing || 0,
        completed: stats.queue?.completed || 0,
        failed: stats.queue?.failed || 0,
      },
      server: stats.server,
      currentAutomation: stats.currentAutomation,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Queue API: Error getting status:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
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
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Queue API: Error getting recent items:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * Process queue manually (for testing)
 * POST /api/queue/process
 */
router.post("/process", async (req, res) => {
  try {
    // Trigger manual queue processing
    setImmediate(() => queueService.processQueue());

    res.json({
      success: true,
      message: "Queue processing triggered",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Queue API: Error triggering process:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * Cancel queue item
 * POST /api/queue/cancel/:id
 */
router.post("/cancel/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = "Cancelled by user" } = req.body;

    const result = await queueService.cancelQueueItem(id, reason);

    if (result.success) {
      res.json({
        success: true,
        message: `Queue item ${id} cancelled successfully`,
        cancelledItem: result.item,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error("❌ Queue API: Error cancelling queue item:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * Clean completed queue items
 * DELETE /api/queue/cleanup
 */
router.delete("/cleanup", async (req, res) => {
  try {
    const {
      olderThanHours = 24,
      status = "completed",
      confirmCleanup = false,
      sourceSite,
    } = req.body;

    console.log(`🧹 Queue cleanup called with:`, {
      olderThanHours,
      status,
      confirmCleanup,
      sourceSite,
    });

    if (!confirmCleanup) {
      return res.status(400).json({
        success: false,
        error: "Please confirm cleanup by setting confirmCleanup: true",
      });
    }

    let result;

    // If sourceSite is provided, use direct database deletion for site-specific cleanup
    if (sourceSite) {
      console.log(`🔍 Site-specific cleanup for: ${sourceSite}`);

      // Import the AutomationQueue model
      const { AutomationQueue } = require("../models");

      // Build where clause for site-specific deletion
      let whereClause = {
        source_site: sourceSite,
      };

      // If status is specified and not "all", filter by it
      if (status && status !== "all") {
        whereClause.status = status;
      }

      console.log(`🔍 Queue cleanup where clause:`, whereClause);

      // Perform the deletion
      const deletedCount = await AutomationQueue.destroy({
        where: whereClause,
      });

      result = { deletedCount };
      console.log(
        `🧹 Site-specific cleanup: Deleted ${deletedCount} queue items`
      );
    } else {
      // Use the original queue service cleanup for time-based cleanup
      result = await queueService.cleanupQueue(olderThanHours, status);
    }

    res.json({
      success: true,
      message: `Cleaned up ${result.deletedCount} queue items`,
      deletedCount: result.deletedCount,
      criteria: sourceSite
        ? { sourceSite, status }
        : { olderThanHours, status },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Queue API: Error cleaning up queue:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * Get pending queue items with detailed info
 * GET /api/queue/pending
 */
router.get("/pending", async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const pendingItems = await queueService.getPendingItems(parseInt(limit));

    res.json({
      success: true,
      pendingItems,
      count: pendingItems.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Queue API: Error fetching pending items:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * Get running automation from queue
 * GET /api/queue/running
 */
router.get("/running", async (req, res) => {
  try {
    const runningItems = await queueService.getRunningItems();

    res.json({
      success: true,
      runningItems,
      count: runningItems.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Queue API: Error fetching running items:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * Pause/Resume queue processing
 * POST /api/queue/pause
 * POST /api/queue/resume
 */
router.post("/pause", async (req, res) => {
  try {
    await queueService.pauseQueue();
    res.json({
      success: true,
      message: "Queue processing paused",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Queue API: Error pausing queue:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

router.post("/resume", async (req, res) => {
  try {
    await queueService.resumeQueue();
    res.json({
      success: true,
      message: "Queue processing resumed",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Queue API: Error resuming queue:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

module.exports = router;
