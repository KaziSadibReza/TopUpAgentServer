const express = require("express");
const router = express.Router();
const sequelize = require("../config/database");

/**
 * Migrate database schema to add missing columns
 * POST /api/migration/add-columns
 */
router.post("/add-columns", async (req, res) => {
  try {
    const { confirmMigration = false } = req.body;

    if (!confirmMigration) {
      return res.status(400).json({
        success: false,
        error: "Please confirm migration by setting confirmMigration: true",
      });
    }

    const migrations = [];

    // Add missing columns to automation_results table
    const addColumnQueries = [
      "ALTER TABLE automation_results ADD COLUMN job_id TEXT",
      "ALTER TABLE automation_results ADD COLUMN success BOOLEAN DEFAULT NULL",
      "ALTER TABLE automation_results ADD COLUMN start_time DATETIME DEFAULT NULL",
      "ALTER TABLE automation_results ADD COLUMN end_time DATETIME DEFAULT NULL",
      "ALTER TABLE automation_results ADD COLUMN duration REAL DEFAULT NULL",
      "ALTER TABLE automation_results ADD COLUMN metadata TEXT DEFAULT '{}'",
      "ALTER TABLE automation_results ADD COLUMN package_name TEXT DEFAULT NULL",
    ];

    for (const query of addColumnQueries) {
      try {
        await sequelize.query(query);
        migrations.push({ query, status: "success" });
      } catch (error) {
        // Column might already exist, that's okay
        if (error.message.includes("duplicate column name")) {
          migrations.push({ query, status: "already_exists" });
        } else {
          migrations.push({ query, status: "failed", error: error.message });
        }
      }
    }

    // Update existing records to have job_id if they don't
    try {
      await sequelize.query(`
        UPDATE automation_results 
        SET job_id = 'legacy_' || id 
        WHERE job_id IS NULL OR job_id = ''
      `);
      migrations.push({
        query: "Update legacy job_id values",
        status: "success",
      });
    } catch (error) {
      migrations.push({
        query: "Update legacy job_id values",
        status: "failed",
        error: error.message,
      });
    }

    res.json({
      success: true,
      message: "Database migration completed",
      migrations,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Migration API: Error during migration:", error);
    res.status(500).json({
      success: false,
      error: "Migration failed",
      details: error.message,
    });
  }
});

/**
 * Check database schema
 * GET /api/migration/check-schema
 */
router.get("/check-schema", async (req, res) => {
  try {
    // Get table schema information
    const [tables] = await sequelize.query(`
      SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;
    `);

    const schemas = {};

    for (const table of tables) {
      const [columns] = await sequelize.query(`
        PRAGMA table_info(${table.name});
      `);
      schemas[table.name] = columns;
    }

    res.json({
      success: true,
      tables: tables.map((t) => t.name),
      schemas,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Migration API: Error checking schema:", error);
    res.status(500).json({
      success: false,
      error: "Failed to check database schema",
    });
  }
});

/**
 * Reset database (DANGEROUS)
 * POST /api/migration/reset
 */
router.post("/reset", async (req, res) => {
  try {
    const { confirmReset = false, keepData = true } = req.body;

    if (!confirmReset) {
      return res.status(400).json({
        success: false,
        error: "Please confirm reset by setting confirmReset: true",
      });
    }

    if (keepData) {
      // Just recreate tables structure
      await sequelize.sync({ alter: true });
      res.json({
        success: true,
        message: "Database schema synchronized (data preserved)",
        timestamp: new Date().toISOString(),
      });
    } else {
      // Drop and recreate all tables
      await sequelize.sync({ force: true });
      res.json({
        success: true,
        message: "Database reset completely (all data lost)",
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("Migration API: Error resetting database:", error);
    res.status(500).json({
      success: false,
      error: "Failed to reset database",
    });
  }
});

module.exports = router;
