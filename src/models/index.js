const sequelize = require("../config/database");
const AutomationLog = require("./AutomationLog");
const AutomationResult = require("./AutomationResult");

// Define associations if needed
AutomationResult.hasMany(AutomationLog, {
  foreignKey: "jobId",
  sourceKey: "jobId",
  as: "logs",
});

AutomationLog.belongsTo(AutomationResult, {
  foreignKey: "jobId",
  targetKey: "jobId",
  as: "result",
});

module.exports = {
  sequelize,
  AutomationLog,
  AutomationResult,
};
