const { Sequelize } = require("sequelize");
const path = require("path");

// Initialize SQLite database with better configuration
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: path.join(__dirname, "../../database/automation.db"),
  logging: false, // Set to console.log to see SQL queries
  
  // SQLite optimizations to prevent locking issues
  dialectOptions: {
    timeout: 30000, // 30 seconds timeout
  },
  
  // Connection pool settings for SQLite
  pool: {
    max: 1, // SQLite only supports one write connection
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  
  // Retry configuration for SQLite errors
  retry: {
    match: [
      /SQLITE_BUSY/,
      /SQLITE_LOCKED/,
      /database is locked/,
    ],
    max: 3,
  },
});

module.exports = sequelize;
