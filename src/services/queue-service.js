const { EventEmitter } = require("events");
const {
  AutomationQueue,
  AutomationResults,
  ServerStatus,
  initializeDatabase,
} = require("../models");
const { Op } = require("sequelize");

class QueueService extends EventEmitter {
  constructor(automationServiceInstance = null) {
    super();
    this.isProcessing = false;
    this.currentAutomation = null;
    this.processingInterval = null;
    this.automationServiceInstance = automationServiceInstance; // Store the global automation service instance
    this.initializeDatabase();
    this.startQueueProcessor();
  }

  async initializeDatabase() {
    try {
      await initializeDatabase();
      console.log("✅ Queue Service: Database initialized with Sequelize");
    } catch (error) {
      console.error("❌ Queue Service: Database initialization failed:", error);
    }
  }

  // Add automation to queue
  async addToQueue(automationData) {
    try {
      const {
        queueType = "manual",
        sourceSite = "localhost",
        siteId = null,
        orderId = null,
        productId = null,
        productName = "",
        licenseKey,
        redimensionCode,
        playerId,
        automationType = "single",
        groupId = null,
        groupPosition = 1,
        groupTotal = 1,
        priority = 0,
        createdBy = "api",
        webhookUrl = null,
        apiKey = null,
      } = automationData;

      if (!licenseKey || !playerId) {
        throw new Error("License key and player ID are required");
      }

      const queueItem = await AutomationQueue.create({
        queue_type: queueType,
        source_site: sourceSite,
        site_id: siteId,
        order_id: orderId,
        product_id: productId,
        product_name: productName,
        license_key: licenseKey,
        redimension_code: redimensionCode,
        player_id: playerId,
        automation_type: automationType,
        group_id: groupId,
        group_position: groupPosition,
        group_total: groupTotal,
        priority: priority,
        created_by: createdBy,
        webhook_url: webhookUrl,
        api_key: apiKey,
      });

      const queueId = queueItem.id;
      console.log(
        `📝 Queue Service: Added ${queueType} automation - ID: ${queueId}, Player: ${playerId}`
      );

      // Start processing immediately (no delays!)
      setImmediate(() => this.processQueue());

      return {
        success: true,
        queueId,
        message: "Automation added and started immediately",
      };
    } catch (error) {
      console.error("❌ Queue Service: Failed to add to queue:", error);
      return { success: false, error: error.message };
    }
  }

  // Add group automation to queue
  async addGroupToQueue(groupData) {
    try {
      const {
        sourceSite = "localhost",
        orderId = null,
        productId = null,
        productName = "",
        licenseKeys = [],
        redimensionCodes = [],
        playerId,
        priority = 1,
        webhookUrl = null,
        apiKey = null,
      } = groupData;

      if (!Array.isArray(licenseKeys) || licenseKeys.length === 0) {
        throw new Error("License keys array is required for group automation");
      }

      if (!playerId) {
        throw new Error("Player ID is required");
      }

      const groupId = `group_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 8)}`;
      const groupTotal = licenseKeys.length;
      const queueIds = [];

      for (let i = 0; i < licenseKeys.length; i++) {
        const result = await this.addToQueue({
          queueType: "group",
          sourceSite,
          orderId,
          productId,
          productName,
          licenseKey: licenseKeys[i],
          redimensionCode: redimensionCodes[i] || licenseKeys[i], // Use corresponding redimension code or fallback to license key
          playerId,
          automationType: i === 0 ? "group_master" : "group_child",
          groupId,
          groupPosition: i + 1,
          groupTotal,
          priority,
          createdBy: "group_api",
          webhookUrl,
          apiKey,
        });

        if (result.success) {
          queueIds.push(result.queueId);
        }
      }

      console.log(
        `📦 Queue Service: Added group automation - Group ID: ${groupId}, Total: ${queueIds.length}`
      );

      return {
        success: true,
        groupId,
        queueIds,
        totalAdded: queueIds.length,
        message: `Group automation added with ${queueIds.length} items`,
      };
    } catch (error) {
      console.error("❌ Queue Service: Failed to add group to queue:", error);
      return { success: false, error: error.message };
    }
  }

  // Main queue processing function - SIMPLIFIED
  async processQueue() {
    if (this.isProcessing) {
      console.log("⏳ Queue Service: Already processing, skipping");
      return;
    }

    this.isProcessing = true;
    console.log("🔄 Queue Service: Starting queue processing");

    try {
      // Get next pending item (simple FIFO)
      const queueItem = await AutomationQueue.findOne({
        where: { status: "pending" },
        order: [["created_at", "ASC"]], // First come, first served
      });

      if (!queueItem) {
        console.log("📭 Queue Service: No pending items");
        await this.updateServerStatus(false);
        return;
      }

      console.log(
        `🚀 Queue Service: Processing ${queueItem.queue_type} automation - ID: ${queueItem.id}`
      );

      // Update to processing
      await queueItem.update({
        status: "processing",
        started_at: new Date(),
      });

      // Update server as busy
      await this.updateServerStatus(true, queueItem.id);

      // Run the automation (same logic for all types)
      const result = await this.executeAutomation(queueItem);

      // Handle result
      if (result.success) {
        await this.handleSuccess(queueItem, result);
        console.log(
          `✅ Queue Service: ${queueItem.queue_type} automation completed - ID: ${queueItem.id}`
        );
      } else {
        await this.handleFailure(queueItem, result.error);
        console.log(
          `❌ Queue Service: ${queueItem.queue_type} automation failed - ID: ${queueItem.id}`
        );
      }
    } catch (error) {
      console.error("💥 Queue Service: Processing error:", error);
    } finally {
      // Clear processing flag and server status
      this.isProcessing = false;
      await this.updateServerStatus(false);

      // Only check for next item if we actually processed something
      // This prevents infinite loops when queue is empty
      const pendingCount = await AutomationQueue.count({
        where: { status: "pending" },
      });

      if (pendingCount > 0) {
        console.log(
          `🔄 Queue Service: ${pendingCount} more items pending, continuing...`
        );
        setImmediate(() => this.processQueue());
      } else {
        console.log("✅ Queue Service: All items processed, queue is now idle");
      }
    }
  }

  // Execute automation - SIMPLIFIED
  async executeAutomation(queueItem) {
    const startTime = Date.now();

    try {
      // Update status to running
      await queueItem.update({ status: "running" });

      // Get automation service
      const AutomationService = require("./AutomationService");
      let automationService =
        this.automationServiceInstance || AutomationService.getGlobalInstance();

      if (!automationService) {
        automationService = new AutomationService();
      }

      console.log(
        `🎯 Queue Service: Running automation for ${queueItem.queue_type} - Player: ${queueItem.player_id}`
      );

      // Run automation directly (no complex waiting logic)
      const result = await automationService.runTopUpAutomation(
        queueItem.player_id,
        queueItem.redimension_code || queueItem.license_key,
        `queue_${queueItem.id}`,
        queueItem
      );

      const executionTime = (Date.now() - startTime) / 1000;

      if (result.success) {
        console.log(
          `✅ Queue Service: Automation completed in ${executionTime}s`
        );
        return {
          success: true,
          response: result,
          executionTime,
          screenshot: result.screenshot || null,
        };
      } else {
        throw new Error(result.error || "Automation failed");
      }
    } catch (error) {
      const executionTime = (Date.now() - startTime) / 1000;
      console.error(`❌ Queue Service: Automation failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
        executionTime,
      };
    }
  }

  // Handle successful automation
  async handleSuccess(queueItem, result) {
    try {
      // Update queue item
      await queueItem.update({
        status: "completed",
        completed_at: new Date(),
        server_response: JSON.stringify(result.response),
      });

      // Log result
      await AutomationResults.create({
        jobId: `queue_${queueItem.id}`, // Add the missing jobId field
        queue_id: queueItem.id,
        source_site: queueItem.source_site,
        order_id: queueItem.order_id,
        license_key: queueItem.license_key,
        redimension_code: queueItem.redimension_code,
        player_id: queueItem.player_id,
        status: "success",
        server_response: JSON.stringify(result.response),
        execution_time: result.executionTime,
        screenshot_path: result.screenshot,
      });

      // For group automations, only send webhook when entire group is complete
      // For single/manual automations, send webhook immediately
      if (queueItem.webhook_url && !queueItem.group_id) {
        // Single or manual automation - send webhook immediately
        await this.sendWebhook(
          queueItem.webhook_url,
          {
            queueId: queueItem.id,
            status: "completed",
            result: result.response,
            executionTime: result.executionTime,
            automationType: queueItem.automation_type,
          },
          queueItem.api_key
        );
      }

      // Handle group completion - this will send webhook for entire group
      if (queueItem.group_id) {
        await this.checkGroupCompletion(queueItem.group_id);
      }

      // Update server statistics
      await this.updateServerStats("success");
    } catch (error) {
      console.error("❌ Queue Service: Error handling success:", error);
    }
  }

  // Handle failed automation
  async handleFailure(queueItem, errorMessage) {
    try {
      // NO AUTOMATIC RETRIES - Mark as failed immediately
      await queueItem.update({
        status: "failed",
        completed_at: new Date(),
        error_message: errorMessage,
      });

      // Log failure
      await AutomationResults.create({
        jobId: `queue_${queueItem.id}`, // Generate a job ID for queue items
        playerId: queueItem.player_id,
        redimensionCode: queueItem.redimension_code,
        orderId: queueItem.order_id,
        status: "failed",
        errorMessage: errorMessage,
        endTime: new Date(),
        success: false,
      });

      // Send webhook notification with failure details (WordPress will handle email)
      if (queueItem.webhook_url) {
        await this.sendWebhook(
          queueItem.webhook_url,
          {
            queueId: queueItem.id,
            status: "failed",
            error: errorMessage,
            playerId: queueItem.player_id,
            licenseKey: queueItem.license_key,
            redimensionCode: queueItem.redimension_code,
            failureTime: new Date().toISOString(),
            sendFailureEmail: true, // Flag for WordPress to send email
          },
          queueItem.api_key
        );
      }

      console.log(
        `💀 Queue Service: Marked as failed immediately (NO RETRIES) - Queue ID: ${queueItem.id} - ${errorMessage}`
      );

      // Update server statistics
      await this.updateServerStats("failed");
    } catch (error) {
      console.error("❌ Queue Service: Error handling failure:", error);
    }
  }

  // Update server status
  async updateServerStatus(isBusy, currentAutomationId = null) {
    try {
      await ServerStatus.update(
        {
          is_busy: isBusy,
          current_automation_id: currentAutomationId,
          current_automation_start:
            isBusy && currentAutomationId ? new Date() : null,
          last_activity: new Date(),
        },
        {
          where: { id: 1 },
        }
      );
    } catch (error) {
      console.error("❌ Queue Service: Error updating server status:", error);
    }
  }

  // Update server statistics
  async updateServerStats(result) {
    try {
      const updateData = {
        last_activity: new Date(),
      };

      if (result === "success") {
        updateData.total_processed = require("sequelize").literal(
          "total_processed + 1"
        );
      } else {
        updateData.total_failed =
          require("sequelize").literal("total_failed + 1");
      }

      await ServerStatus.update(updateData, {
        where: { id: 1 },
      });
    } catch (error) {
      console.error("❌ Queue Service: Error updating server stats:", error);
    }
  }

  // Send webhook notification
  async sendWebhook(webhookUrl, data, apiKey) {
    try {
      const axios = require("axios");

      await axios.post(webhookUrl, data, {
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey || "",
          "User-Agent": "TopUpAgent-Server/2.0",
        },
        timeout: 10000,
      });

      console.log(`📡 Queue Service: Webhook sent to ${webhookUrl}`);
    } catch (error) {
      console.error(
        `❌ Queue Service: Webhook failed for ${webhookUrl}:`,
        error.message
      );
    }
  }

  // Check if group automation is complete
  async checkGroupCompletion(groupId) {
    try {
      const stats = await AutomationQueue.findAll({
        where: { group_id: groupId },
        attributes: [
          [require("sequelize").fn("COUNT", "*"), "total"],
          [
            require("sequelize").fn(
              "SUM",
              require("sequelize").literal(
                "CASE WHEN status IN ('completed', 'failed') THEN 1 ELSE 0 END"
              )
            ),
            "finished",
          ],
          [
            require("sequelize").fn(
              "SUM",
              require("sequelize").literal(
                "CASE WHEN status = 'completed' THEN 1 ELSE 0 END"
              )
            ),
            "successful",
          ],
        ],
        raw: true,
      });

      const { total, finished, successful } = stats[0];

      if (total === finished) {
        console.log(
          `📦 Queue Service: Group ${groupId} completed (${successful}/${total} successful)`
        );

        // Get the group items to send webhook
        const groupItems = await AutomationQueue.findAll({
          where: { group_id: groupId },
          order: [["group_position", "ASC"]],
        });

        if (groupItems.length > 0 && groupItems[0].webhook_url) {
          // Send webhook for entire group completion
          await this.sendWebhook(
            groupItems[0].webhook_url,
            {
              groupId: groupId,
              status: "group_completed",
              totalItems: total,
              successfulItems: successful,
              failedItems: total - successful,
              automationType: "group",
              completedAt: new Date().toISOString(),
            },
            groupItems[0].api_key
          );
        }

        this.emit("groupCompleted", { groupId, total, finished, successful });
      }
    } catch (error) {
      console.error(
        "❌ Queue Service: Error checking group completion:",
        error
      );
    }
  }

  // Simple queue processor - no complex timing
  startQueueProcessor() {
    // Just start processing immediately when service starts
    console.log(
      "🔄 Queue Service: Simple processor started - will process immediately when items added"
    );

    // Optional: Check every 10 seconds as safety net only
    this.processingInterval = setInterval(() => {
      if (!this.isProcessing) {
        this.processQueue().catch((error) => {
          console.error("❌ Queue Service: Error in safety check:", error);
        });
      }
    }, 10000); // 10 seconds safety check
  }

  // Get queue statistics
  async getQueueStats() {
    try {
      const stats = await AutomationQueue.findAll({
        attributes: [
          [require("sequelize").fn("COUNT", "*"), "total"],
          [
            require("sequelize").fn(
              "SUM",
              require("sequelize").literal(
                "CASE WHEN status = 'pending' THEN 1 ELSE 0 END"
              )
            ),
            "pending",
          ],
          [
            require("sequelize").fn(
              "SUM",
              require("sequelize").literal(
                "CASE WHEN status IN ('processing', 'running') THEN 1 ELSE 0 END"
              )
            ),
            "processing",
          ],
          [
            require("sequelize").fn(
              "SUM",
              require("sequelize").literal(
                "CASE WHEN status = 'completed' THEN 1 ELSE 0 END"
              )
            ),
            "completed",
          ],
          [
            require("sequelize").fn(
              "SUM",
              require("sequelize").literal(
                "CASE WHEN status = 'failed' THEN 1 ELSE 0 END"
              )
            ),
            "failed",
          ],
        ],
        raw: true,
      });

      const serverStatus = await ServerStatus.findOne({
        where: { id: 1 },
      });

      return {
        queue: stats[0],
        server: serverStatus ? serverStatus.toJSON() : {},
        currentAutomation: this.currentAutomation,
      };
    } catch (error) {
      console.error("❌ Queue Service: Error getting stats:", error);
      return { error: error.message };
    }
  }

  // Get recent queue items
  async getRecentItems(limit = 20) {
    try {
      const items = await AutomationQueue.findAll({
        include: [
          {
            model: AutomationResults,
            as: "results",
            attributes: ["screenshot_path", "execution_time"],
            required: false,
          },
        ],
        order: [["scheduled_at", "DESC"]],
        limit: limit,
      });

      return items.map((item) => {
        const itemData = item.toJSON();
        if (itemData.results && itemData.results.length > 0) {
          itemData.screenshot_path = itemData.results[0].screenshot_path;
          itemData.execution_time = itemData.results[0].execution_time;
        }
        delete itemData.results;
        return itemData;
      });
    } catch (error) {
      console.error("❌ Queue Service: Error getting recent items:", error);
      return [];
    }
  }

  // Update queue item status
  async updateQueueItemStatus(itemId, status, additionalData = {}) {
    try {
      const updateData = {
        status,
        updated_at: new Date(),
        ...additionalData,
      };

      await AutomationQueue.update(updateData, {
        where: { id: itemId },
      });

      console.log(
        `✅ Queue Service: Updated item ${itemId} status to ${status}`
      );
      return true;
    } catch (error) {
      console.error(
        `❌ Queue Service: Error updating item ${itemId} status:`,
        error
      );
      return false;
    }
  }

  // Cancel queue item
  async cancelQueueItem(itemId, reason = "Cancelled by user") {
    try {
      const item = await AutomationQueue.findByPk(itemId);

      if (!item) {
        return { success: false, error: "Queue item not found" };
      }

      if (item.status === "completed") {
        return { success: false, error: "Cannot cancel completed item" };
      }

      if (item.status === "processing") {
        return {
          success: false,
          error: "Cannot cancel item currently being processed",
        };
      }

      await AutomationQueue.update(
        {
          status: "cancelled",
          error_message: reason,
          updated_at: new Date(),
        },
        { where: { id: itemId } }
      );

      console.log(`🚫 Queue Service: Cancelled item ${itemId} - ${reason}`);

      return {
        success: true,
        item: { id: itemId, status: "cancelled", reason },
      };
    } catch (error) {
      console.error(
        `❌ Queue Service: Error cancelling item ${itemId}:`,
        error
      );
      return { success: false, error: "Failed to cancel queue item" };
    }
  }

  // Clean up completed queue items
  async cleanupQueue(olderThanHours = 24, status = "completed") {
    try {
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - olderThanHours);

      const deletedCount = await AutomationQueue.destroy({
        where: {
          status: status,
          updated_at: { [Op.lt]: cutoffTime },
        },
      });

      console.log(
        `🧹 Queue Service: Cleaned up ${deletedCount} ${status} items older than ${olderThanHours} hours`
      );

      return { deletedCount };
    } catch (error) {
      console.error("❌ Queue Service: Error cleaning up queue:", error);
      throw error;
    }
  }

  // Get pending items with details
  async getPendingItems(limit = 50) {
    try {
      const items = await AutomationQueue.findAll({
        where: { status: "pending" },
        order: [
          ["priority", "DESC"],
          ["created_at", "ASC"],
        ],
        limit: limit,
        raw: true,
      });

      return items;
    } catch (error) {
      console.error("❌ Queue Service: Error fetching pending items:", error);
      throw error;
    }
  }

  // Get running items with details
  async getRunningItems() {
    try {
      const items = await AutomationQueue.findAll({
        where: { status: "processing" },
        order: [["updated_at", "DESC"]],
        raw: true,
      });

      return items;
    } catch (error) {
      console.error("❌ Queue Service: Error fetching running items:", error);
      throw error;
    }
  }

  // Pause queue processing
  async pauseQueue() {
    try {
      this.isProcessing = false;

      if (this.processingInterval) {
        clearInterval(this.processingInterval);
        this.processingInterval = null;
      }

      console.log("⏸️ Queue Service: Processing paused");
      return true;
    } catch (error) {
      console.error("❌ Queue Service: Error pausing queue:", error);
      throw error;
    }
  }

  // Resume queue processing
  async resumeQueue() {
    try {
      this.isProcessing = false; // Reset to false to allow processing
      this.startQueueProcessor();

      // Trigger immediate processing if there are pending items
      setImmediate(() => {
        if (!this.isProcessing) {
          this.processQueue();
        }
      });

      console.log("▶️ Queue Service: Processing resumed");
      return true;
    } catch (error) {
      console.error("❌ Queue Service: Error resuming queue:", error);
      throw error;
    }
  }

  // Stop queue service
  async stop() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }

    console.log("🛑 Queue Service: Stopped");
  }
}

module.exports = QueueService;
