const { AutomationLog, AutomationResult, sequelize } = require("../models");
const { Op } = require("sequelize");

class DatabaseService {
  constructor() {
    this.initialized = false;
  }

  async initialize() {
    try {
      // Test the connection with retry logic
      let retries = 3;
      while (retries > 0) {
        try {
          await sequelize.authenticate();
          console.log("Database connection established successfully.");
          break;
        } catch (error) {
          retries--;
          if (retries === 0) throw error;
          console.log(
            `Database connection failed, retrying... (${retries} attempts left)`
          );
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }

      // Try to sync models with different strategies
      try {
        // First try without altering (safest)
        await sequelize.sync({ force: false });
        console.log("Database models synchronized (safe mode).");
      } catch (syncError) {
        console.log(
          "Safe sync failed, trying with alter...",
          syncError.message
        );
        try {
          // If that fails, try with alter
          await sequelize.sync({ alter: true });
          console.log("Database models synchronized (alter mode).");
        } catch (alterError) {
          console.log(
            "Alter sync failed, trying force recreation...",
            alterError.message
          );
          // Last resort: force recreation (only for development)
          await sequelize.sync({ force: true });
          console.log("Database models synchronized (force mode).");
        }
      }

      this.initialized = true;
      return true;
    } catch (error) {
      console.error("Unable to connect to the database:", error.message);
      console.error("Full error:", error);
      // Don't throw error - allow service to continue without database
      this.initialized = false;
      return false;
    }
  }

  // Automation Result methods
  async createAutomationResult(data) {
    if (!this.initialized) {
      console.log(
        "Database not initialized, skipping automation result creation"
      );
      return null;
    }
    try {
      return await AutomationResult.create(data);
    } catch (error) {
      console.error("Error creating automation result:", error);
      throw error;
    }
  }

  async updateAutomationResult(jobId, data) {
    if (!this.initialized) {
      console.log(
        "Database not initialized, skipping automation result update"
      );
      return false;
    }
    try {
      const [updatedRowsCount] = await AutomationResult.update(data, {
        where: { jobId },
      });
      return updatedRowsCount > 0;
    } catch (error) {
      console.error("Error updating automation result:", error);
      throw error;
    }
  }

  async getAutomationResult(jobId) {
    try {
      return await AutomationResult.findOne({
        where: { jobId },
        include: [
          {
            model: AutomationLog,
            as: "logs",
            order: [["timestamp", "ASC"]],
          },
        ],
      });
    } catch (error) {
      console.error("Error getting automation result:", error);
      throw error;
    }
  }

  async getAutomationResults(filters = {}) {
    try {
      const where = {};

      if (filters.playerId) {
        where.playerId = filters.playerId;
      }

      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.success !== undefined) {
        where.success = filters.success;
      }

      if (filters.dateFrom) {
        where.startTime = { [Op.gte]: new Date(filters.dateFrom) };
      }

      if (filters.dateTo) {
        where.startTime = {
          ...where.startTime,
          [Op.lte]: new Date(filters.dateTo),
        };
      }

      return await AutomationResult.findAll({
        where,
        order: [["startTime", "DESC"]],
        limit: filters.limit || 100,
        offset: filters.offset || 0,
        include: [
          {
            model: AutomationLog,
            as: "logs",
            limit: 5, // Only get latest 5 logs for each result
            order: [["timestamp", "DESC"]],
          },
        ],
      });
    } catch (error) {
      console.error("Error getting automation results:", error);
      throw error;
    }
  }

  // Automation Log methods
  async createAutomationLog(data) {
    try {
      return await AutomationLog.create(data);
    } catch (error) {
      console.error("Error creating automation log:", error);
      throw error;
    }
  }

  async getAutomationLogs(jobId, filters = {}) {
    try {
      const where = { jobId };

      if (filters.level) {
        where.level = filters.level;
      }

      if (filters.dateFrom) {
        where.timestamp = { [Op.gte]: new Date(filters.dateFrom) };
      }

      if (filters.dateTo) {
        where.timestamp = {
          ...where.timestamp,
          [Op.lte]: new Date(filters.dateTo),
        };
      }

      return await AutomationLog.findAll({
        where,
        order: [["timestamp", "ASC"]],
        limit: filters.limit || 1000,
        offset: filters.offset || 0,
      });
    } catch (error) {
      console.error("Error getting automation logs:", error);
      throw error;
    }
  }

  async getAllLogs(filters = {}) {
    try {
      const where = {};

      if (filters.level) {
        where.level = filters.level;
      }

      if (filters.playerId) {
        where.playerId = filters.playerId;
      }

      if (filters.dateFrom) {
        where.timestamp = { [Op.gte]: new Date(filters.dateFrom) };
      }

      if (filters.dateTo) {
        where.timestamp = {
          ...where.timestamp,
          [Op.lte]: new Date(filters.dateTo),
        };
      }

      return await AutomationLog.findAll({
        where,
        order: [["timestamp", "DESC"]],
        limit: filters.limit || 500,
        offset: filters.offset || 0,
      });
    } catch (error) {
      console.error("Error getting all logs:", error);
      throw error;
    }
  }

  // Statistics methods
  async getAutomationStats(filters = {}) {
    try {
      const where = {};

      if (filters.playerId) {
        where.playerId = filters.playerId;
      }

      if (filters.dateFrom) {
        where.startTime = { [Op.gte]: new Date(filters.dateFrom) };
      }

      if (filters.dateTo) {
        where.startTime = {
          ...where.startTime,
          [Op.lte]: new Date(filters.dateTo),
        };
      }

      const [total, successful, failed, running] = await Promise.all([
        AutomationResult.count({ where }),
        AutomationResult.count({ where: { ...where, success: true } }),
        AutomationResult.count({ where: { ...where, success: false } }),
        AutomationResult.count({ where: { ...where, status: "running" } }),
      ]);

      const avgDuration = await AutomationResult.findOne({
        where: { ...where, duration: { [Op.not]: null } },
        attributes: [
          [sequelize.fn("AVG", sequelize.col("duration")), "avgDuration"],
        ],
      });

      return {
        total,
        successful,
        failed,
        running,
        successRate: total > 0 ? ((successful / total) * 100).toFixed(2) : 0,
        averageDuration: avgDuration?.dataValues?.avgDuration || 0,
      };
    } catch (error) {
      console.error("Error getting automation stats:", error);
      throw error;
    }
  }

  // Cleanup methods
  async cleanupOldLogs(daysToKeep = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const deletedLogs = await AutomationLog.destroy({
        where: {
          timestamp: { [Op.lt]: cutoffDate },
        },
      });

      const deletedResults = await AutomationResult.destroy({
        where: {
          startTime: { [Op.lt]: cutoffDate },
          status: { [Op.in]: ["completed", "failed", "cancelled"] },
        },
      });

      return { deletedLogs, deletedResults };
    } catch (error) {
      console.error("Error cleaning up old logs:", error);
      throw error;
    }
  }
}

module.exports = new DatabaseService();
