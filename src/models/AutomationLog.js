const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const AutomationLog = sequelize.define(
  "AutomationLog",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    jobId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    level: {
      type: DataTypes.ENUM("info", "success", "warning", "error"),
      allowNull: false,
      defaultValue: "info",
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    playerId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    redimensionCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    packageName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "automation_logs",
    indexes: [
      {
        fields: ["jobId"],
      },
      {
        fields: ["level"],
      },
      {
        fields: ["timestamp"],
      },
      {
        fields: ["playerId"],
      },
    ],
  }
);

module.exports = AutomationLog;
