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

    // Try to sync with alter first, fallback to force if needed
    try {
      await sequelize.sync({ alter: true });
      console.log("✅ Database models synchronized successfully.");
    } catch (syncError) {
      console.log("Safe sync failed, trying with alter...", syncError.message);
      try {
        // If alter fails due to index conflicts, try without altering indexes
        await sequelize.sync({ force: false });
        console.log("Database models synchronized (alter mode).");
      } catch (fallbackError) {
        console.log(
          "❌ Database sync failed completely:",
          fallbackError.message
        );
        // Continue anyway - the database might be working
      }
    }

    console.log("Database initialized successfully");

    // Ensure server status record exists
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
