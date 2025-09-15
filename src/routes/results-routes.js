const express = require("express");
const router = express.Router();
const {
  AutomationQueue,
  AutomationResults,
  ServerStatus,
} = require("../models");
const { Op } = require("sequelize");

/**
 * Get automation results with pagination
 * GET /api/results
 */
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;
    const offset = (page - 1) * limit;

    const where = {};
    if (status) {
      where.status = status;
    }

    const results = await AutomationResults.findAndCountAll({
      where,
      include: [
        {
          model: AutomationQueue,
          as: "queueItem",
          attributes: [
            "id",
            "queue_type",
            "source_site",
            "order_id",
            "product_name",
          ],
        },
      ],
      order: [["created_at", "DESC"]],
      limit,
      offset,
    });

    res.json({
      success: true,
      results: results.rows,
      pagination: {
        page,
        limit,
        total: results.count,
        totalPages: Math.ceil(results.count / limit),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Results API: Error getting results:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * Get specific automation result
 * GET /api/results/:id
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await AutomationResults.findByPk(id, {
      include: [
        {
          model: AutomationQueue,
          as: "queueItem",
        },
      ],
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        error: "Result not found",
      });
    }

    res.json({
      success: true,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Results API: Error getting result:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * Get automation statistics
 * GET /api/results/stats
 */
router.get("/stats", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalStats, todayStats, serverStatus] = await Promise.all([
      // Total statistics
      AutomationResults.findAll({
        attributes: [
          "status",
          [require("sequelize").fn("COUNT", "*"), "count"],
        ],
        group: ["status"],
        raw: true,
      }),

      // Today's statistics
      AutomationResults.findAll({
        where: {
          created_at: {
            [Op.gte]: today,
          },
        },
        attributes: [
          "status",
          [require("sequelize").fn("COUNT", "*"), "count"],
        ],
        group: ["status"],
        raw: true,
      }),

      // Server status
      ServerStatus.findOne({ where: { id: 1 } }),
    ]);

    // Format statistics
    const formatStats = (stats) => {
      const formatted = { success: 0, failed: 0, total: 0 };
      stats.forEach((stat) => {
        if (stat.status === "success") formatted.success = stat.count;
        if (stat.status === "failed") formatted.failed = stat.count;
        formatted.total += stat.count;
      });
      return formatted;
    };

    res.json({
      success: true,
      stats: {
        total: formatStats(totalStats),
        today: formatStats(todayStats),
        server: serverStatus || {},
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Results API: Error getting stats:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * Search automation results
 * POST /api/results/search
 */
router.post("/search", async (req, res) => {
  try {
    const {
      playerId,
      licenseKey,
      redimensionCode,
      status,
      dateFrom,
      dateTo,
      page = 1,
      limit = 20,
    } = req.body;

    const where = {};
    const offset = (page - 1) * limit;

    // Build search conditions
    if (playerId) where.player_id = { [Op.like]: `%${playerId}%` };
    if (licenseKey) where.license_key = { [Op.like]: `%${licenseKey}%` };
    if (redimensionCode)
      where.redimension_code = { [Op.like]: `%${redimensionCode}%` };
    if (status) where.status = status;

    if (dateFrom || dateTo) {
      where.created_at = {};
      if (dateFrom) where.created_at[Op.gte] = new Date(dateFrom);
      if (dateTo) where.created_at[Op.lte] = new Date(dateTo);
    }

    const results = await AutomationResults.findAndCountAll({
      where,
      include: [
        {
          model: AutomationQueue,
          as: "queueItem",
          attributes: [
            "id",
            "queue_type",
            "source_site",
            "order_id",
            "product_name",
          ],
        },
      ],
      order: [["created_at", "DESC"]],
      limit,
      offset,
    });

    res.json({
      success: true,
      results: results.rows,
      pagination: {
        page,
        limit,
        total: results.count,
        totalPages: Math.ceil(results.count / limit),
      },
      searchCriteria: req.body,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Results API: Error searching results:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

module.exports = router;
