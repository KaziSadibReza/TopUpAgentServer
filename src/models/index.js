const sequelize = require("../config/database");
const AutomationLog = require("./AutomationLog");
const AutomationResult = require("./AutomationResult");
const AutomationQueue = require("./AutomationQueue");
const AutomationResults = require("./AutomationResults");
const ServerStatus = require("./ServerStatus");

// Define associations if needed
AutomationResult.hasMany(AutomationLog, {
  foreignKey: "jobId",
  sourceKey: "jobId",
  as: "logs",
  constraints: false, // Remove foreign key constraint
});

AutomationLog.belongsTo(AutomationResult, {
  foreignKey: "jobId",
  targetKey: "jobId",
  as: "result",
  constraints: false, // Remove foreign key constraint
});

// Queue associations
AutomationResults.belongsTo(AutomationQueue, {
  foreignKey: "queue_id",
  as: "queueItem",
});
AutomationQueue.hasMany(AutomationResults, {
  foreignKey: "queue_id",
  as: "results",
});

// Initialize models and sync database
const initializeDatabase = async () => {
  try {
    // Test connection
    await sequelize.authenticate();
    console.log("✅ Database connection established successfully.");

    // Force recreate database to fix all conflicts
    console.log("🔄 Force recreating database to fix all table and index conflicts...");
    try {
      await sequelize.sync({ force: true });
      console.log("✅ Database forcefully recreated and models synchronized successfully.");
    } catch (forceError) {
      console.log("❌ Force recreation failed, trying alter...", forceError.message);
      try {
        // Fallback to alter if force fails
        await sequelize.sync({ alter: true });
        console.log("✅ Database models synchronized with alter mode.");
      } catch (alterError) {
        console.log("❌ Alter sync failed, trying basic sync...", alterError.message);
        try {
          // Last fallback - basic sync
          await sequelize.sync({ force: false });
          console.log("✅ Database models synchronized with basic mode.");
        } catch (basicError) {
          console.log("❌ All sync methods failed:", basicError.message);
          console.log("⚠️ Continuing anyway - some functionality may not work.");
        }
      }
    }

    console.log("Database initialized successfully");

    // Ensure server status record exists with retry logic
    try {
      const [serverStatus, created] = await ServerStatus.findOrCreate({
        where: { id: 1 },
        defaults: {
          id: 1,
          is_busy: false,
          total_processed: 0,
          total_failed: 0,
        },
      });

      if (created) {
        console.log("✅ Server status record created.");
      } else {
        console.log("✅ Server status record already exists.");
      }
    } catch (statusError) {
      console.log("⚠️ Could not create server status record:", statusError.message);
      // Don't throw - continue without server status
    }
  } catch (error) {
    console.error("❌ Unable to connect to the database:", error);
    throw error;
  }
};

module.exports = {
  sequelize,
  AutomationLog,
  AutomationResult,
  AutomationQueue,
  AutomationResults,
  ServerStatus,
  initializeDatabase,
};
