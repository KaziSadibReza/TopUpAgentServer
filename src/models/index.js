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

// Singleton pattern for database initialization
let isInitializing = false;
let initializationPromise = null;
let isInitialized = false;

// Initialize models and sync database
const initializeDatabase = async () => {
  // Return immediately if already initialized
  if (isInitialized) {
    console.log("✅ Database already initialized, skipping...");
    return Promise.resolve();
  }

  // If initialization is in progress, wait for it
  if (isInitializing && initializationPromise) {
    console.log("⏳ Database initialization in progress, waiting...");
    return initializationPromise;
  }

  // Start initialization
  isInitializing = true;
  
  initializationPromise = (async () => {
  try {
    // Test connection
    await sequelize.authenticate();
    console.log("✅ Database connection established successfully.");

    // Try normal sync first, only force recreate if there are conflicts
    console.log("🔄 Attempting normal database synchronization...");
    try {
      await sequelize.sync({ alter: true });
      console.log("✅ Database models synchronized successfully.");
    } catch (syncError) {
      if (syncError.message.includes('already exists') || syncError.message.includes('no such table')) {
        console.log("⚠️ Database conflicts detected, force recreating to fix...");
        try {
          await sequelize.sync({ force: true });
          console.log("✅ Database forcefully recreated and models synchronized successfully.");
        } catch (forceError) {
          console.log("❌ Force recreation failed:", forceError.message);
          console.log("⚠️ Continuing anyway - some functionality may not work.");
        }
      } else {
        console.log("❌ Database sync failed:", syncError.message);
        console.log("⚠️ Continuing anyway - some functionality may not work.");
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
    
    // Mark as successfully initialized
    isInitialized = true;
    console.log("✅ Database initialization completed successfully!");
    
  } catch (error) {
    console.error("❌ Unable to connect to the database:", error);
    throw error;
  } finally {
    isInitializing = false;
    initializationPromise = null;
  }
  })();

  return initializationPromise;
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
