const express = require("express");
const router = express.Router();
const { AutomationResults, AutomationQueue } = require("../models");
const { Op } = require("sequelize");

/**
 * Get automation history with filtering
 * GET /api/history
 */
router.get("/", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      playerId,
      dateFrom,
      dateTo,
      sortBy = "createdAt",
      sortOrder = "DESC",
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    // Apply filters
    if (status) {
      where.status = status;
    }
    if (playerId) {
      where.player_id = { [Op.like]: `%${playerId}%` };
    }
    if (dateFrom || dateTo) {
      where.created_at = {};
      if (dateFrom) {
        where.created_at[Op.gte] = new Date(dateFrom);
      }
      if (dateTo) {
        where.created_at[Op.lte] = new Date(dateTo);
      }
    }

    const { count, rows } = await AutomationResults.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [
        [
          sortBy === "createdAt" ? "created_at" : sortBy,
          sortOrder.toUpperCase(),
        ],
      ],
      attributes: [
        "id",
        ["job_id", "jobId"],
        ["player_id", "playerId"],
        ["redimension_code", "redimensionCode"],
        "status",
        "success",
        ["error_message", "errorMessage"],
        ["screenshot_path", "screenshotPath"],
        "metadata",
        ["created_at", "createdAt"],
        ["updated_at", "updatedAt"],
      ],
    });

    res.json({
      success: true,
      history: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit),
      },
      filters: { status, playerId, dateFrom, dateTo },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("History API: Error fetching history:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch automation history",
    });
  }
});

/**
 * Get history statistics
 * GET /api/history/stats
 */
router.get("/stats", async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));

    const [statusStats, dailyStats, playerStats] = await Promise.all([
      // Status breakdown
      AutomationResults.findAll({
        attributes: [
          "status",
          [require("sequelize").fn("COUNT", "*"), "count"],
        ],
        where: {
          created_at: { [Op.gte]: since },
        },
        group: ["status"],
        raw: true,
      }),

      // Daily automation counts
      AutomationResults.findAll({
        attributes: [
          [
            require("sequelize").fn(
              "DATE",
              require("sequelize").col("created_at")
            ),
            "date",
          ],
          [require("sequelize").fn("COUNT", "*"), "count"],
        ],
        where: {
          created_at: { [Op.gte]: since },
        },
        group: [
          require("sequelize").fn(
            "DATE",
            require("sequelize").col("created_at")
          ),
        ],
        order: [
          [
            require("sequelize").fn(
              "DATE",
              require("sequelize").col("created_at")
            ),
            "ASC",
          ],
        ],
        raw: true,
      }),

      // Top players by automation count
      AutomationResults.findAll({
        attributes: [
          "player_id",
          [require("sequelize").fn("COUNT", "*"), "automationCount"],
          [
            require("sequelize").fn(
              "SUM",
              require("sequelize").literal(
                "CASE WHEN success = 1 THEN 1 ELSE 0 END"
              )
            ),
            "successCount",
          ],
        ],
        where: {
          created_at: { [Op.gte]: since },
        },
        group: ["player_id"],
        order: [[require("sequelize").fn("COUNT", "*"), "DESC"]],
        limit: 10,
        raw: true,
      }),
    ]);

    res.json({
      success: true,
      stats: {
        period: `${days} days`,
        since: since.toISOString(),
        statusBreakdown: statusStats,
        dailyActivity: dailyStats,
        topPlayers: playerStats,
        total: statusStats.reduce((sum, stat) => sum + parseInt(stat.count), 0),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("History API: Error fetching stats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch history statistics",
    });
  }
});

/**
 * Delete automation history
 * DELETE /api/history
 */
router.delete("/", async (req, res) => {
  try {
    const { ids, olderThan, status, confirmDelete } = req.body;

    if (!confirmDelete) {
      return res.status(400).json({
        success: false,
        error: "Please confirm deletion by setting confirmDelete: true",
      });
    }

    let where = {};

    if (ids && Array.isArray(ids)) {
      // Delete specific IDs
      where.id = { [Op.in]: ids };
    } else if (olderThan) {
      // Delete older than specified date
      where.created_at = { [Op.lt]: new Date(olderThan) };
    } else if (status) {
      // Delete by status
      where.status = status;
    } else {
      return res.status(400).json({
        success: false,
        error: "Please specify ids, olderThan date, or status for deletion",
      });
    }

    const deletedCount = await AutomationResults.destroy({ where });

    res.json({
      success: true,
      message: `Deleted ${deletedCount} automation history records`,
      deletedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("History API: Error deleting history:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete automation history",
    });
  }
});

/**
 * Delete ALL automation history (dangerous operation)
 * DELETE /api/history/all
 */
router.delete("/all", async (req, res) => {
  try {
    const { confirmDelete, keepDays = 0 } = req.body;

    if (!confirmDelete) {
      return res.status(400).json({
        success: false,
        error: "Please confirm deletion by setting confirmDelete: true",
      });
    }

    let where = {};
    if (keepDays > 0) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - keepDays);
      where.created_at = { [Op.lt]: cutoffDate };
    }

    const deletedCount = await AutomationResults.destroy({
      where: Object.keys(where).length > 0 ? where : undefined,
      truncate: Object.keys(where).length === 0,
    });

    res.json({
      success: true,
      message:
        keepDays > 0
          ? `Deleted automation history older than ${keepDays} days (${deletedCount} records)`
          : `Deleted ALL automation history (${deletedCount} records)`,
      deletedCount,
      keepDays,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("History API: Error deleting all history:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete automation history",
    });
  }
});

/**
 * Export automation history
 * GET /api/history/export
 */
router.get("/export", async (req, res) => {
  try {
    const { format = "json", status, playerId, dateFrom, dateTo } = req.query;

    const where = {};
    if (status) where.status = status;
    if (playerId) where.player_id = { [Op.like]: `%${playerId}%` };
    if (dateFrom || dateTo) {
      where.created_at = {};
      if (dateFrom) where.created_at[Op.gte] = new Date(dateFrom);
      if (dateTo) where.created_at[Op.lte] = new Date(dateTo);
    }

    const history = await AutomationResults.findAll({
      where,
      order: [["created_at", "DESC"]],
      raw: true,
    });

    if (format === "csv") {
      const csvHeaders =
        "ID,Job ID,Player ID,Redimension Code,Status,Success,Error Message,Created At,Updated At\n";
      const csvData = history
        .map(
          (row) =>
            `${row.id},"${row.job_id}","${row.player_id}","${
              row.redimension_code
            }","${row.status}",${row.success},"${row.error_message || ""}","${
              row.created_at
            }","${row.updated_at}"`
        )
        .join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="automation-history-${
          new Date().toISOString().split("T")[0]
        }.csv"`
      );
      res.send(csvHeaders + csvData);
    } else {
      res.json({
        success: true,
        export: {
          format,
          count: history.length,
          exportedAt: new Date().toISOString(),
          data: history,
        },
      });
    }
  } catch (error) {
    console.error("History API: Error exporting history:", error);
    res.status(500).json({
      success: false,
      error: "Failed to export automation history",
    });
  }
});

module.exports = router;
