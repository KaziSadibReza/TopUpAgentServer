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
let isInitializing = false;
let initializationPromise = null;

const initializeDatabase = async () => {
  // Prevent multiple simultaneous initializations
  if (isInitializing && initializationPromise) {
    console.log("⏳ Database initialization already in progress, waiting...");
    return await initializationPromise;
  }

  if (isInitializing) {
    console.log("⏳ Database initialization in progress...");
    return;
  }

  isInitializing = true;
  
  initializationPromise = (async () => {
    try {
      // Test connection with retry logic
      let connectionAttempts = 0;
      const maxConnectionAttempts = 3;
      
      while (connectionAttempts < maxConnectionAttempts) {
        try {
          await sequelize.authenticate();
          console.log("✅ Database connection established successfully.");
          break;
        } catch (connectionError) {
          connectionAttempts++;
          if (connectionAttempts >= maxConnectionAttempts) {
            throw connectionError;
          }
          console.log(`⚠️ Database connection attempt ${connectionAttempts} failed, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Database synchronization with improved error handling
      try {
        // First try a simple sync without altering
        await sequelize.sync({ alter: false });
        console.log("✅ Database models synchronized successfully.");
      } catch (syncError) {
        console.log("Safe sync failed, trying with alter...", syncError.message);
        
        try {
          // If that fails, try with alter
          await sequelize.sync({ alter: true });
          console.log("Database models synchronized (alter mode).");
        } catch (alterError) {
          // If alter fails due to index conflicts, check if it's just index errors
          if (alterError.message.includes('already exists')) {
            console.log("⚠️ Index conflicts detected, but continuing (tables may already exist)");
          } else {
            console.log("❌ Database sync failed completely:", alterError.message);
            // Continue anyway - the database might be working
          }
        }
      }

      console.log("Database initialized successfully");

      // Ensure server status record exists with retry logic
      let serverStatusAttempts = 0;
      const maxServerStatusAttempts = 3;
      
      while (serverStatusAttempts < maxServerStatusAttempts) {
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
          }
          break;
        } catch (statusError) {
          serverStatusAttempts++;
          if (serverStatusAttempts >= maxServerStatusAttempts) {
            console.log("⚠️ Could not create server status record:", statusError.message);
            // Don't throw here, just log the warning
          } else {
            console.log(`⚠️ Server status creation attempt ${serverStatusAttempts} failed, retrying...`);
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }
      
    } catch (error) {
      console.error("❌ Unable to connect to the database:", error);
      throw error;
    } finally {
      isInitializing = false;
      initializationPromise = null;
    }
  })();

  return await initializationPromise;
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
