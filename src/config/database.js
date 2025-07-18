const { Sequelize } = require("sequelize");
const path = require("path");

// Initialize SQLite database
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: path.join(__dirname, "../../database/automation.db"),
  logging: false, // Set to console.log to see SQL queries
});

module.exports = sequelize;
