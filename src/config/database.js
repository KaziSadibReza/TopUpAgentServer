const { Sequelize } = require("sequelize");
const path = require("path");

// Initialize SQLite database with improved settings
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: path.join(__dirname, "../../database/automation.db"),
  logging: false, // Set to console.log to see SQL queries
  
  // SQLite specific optimizations
  dialectOptions: {
    // Increase timeout for busy database
    timeout: 60000, // 60 seconds
  },
  
  // Connection pool settings
  pool: {
    max: 1, // SQLite only supports one write connection
    min: 0,
    acquire: 60000,
    idle: 10000,
  },
  
  // Transaction options
  transactionType: 'IMMEDIATE',
  
  // Retry configuration
  retry: {
    match: [
      /SQLITE_BUSY/,
      /SQLITE_LOCKED/,
      /database is locked/,
    ],
    max: 3,
  },
  
  // Define hooks for better SQLite performance
  define: {
    // Prevent automatic timestamp fields from causing conflicts
    timestamps: true,
    underscored: true,
  },
});

module.exports = sequelize;
