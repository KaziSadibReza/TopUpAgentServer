const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const AutomationResult = sequelize.define(
  "AutomationResult",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    jobId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      index: true,
    },
    playerId: {
      type: DataTypes.STRING,
      allowNull: false,
      index: true,
    },
    redimensionCode: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    packageName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(
        "pending",
        "running",
        "completed",
        "failed",
        "cancelled"
      ),
      allowNull: false,
      defaultValue: "pending",
      index: true,
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    duration: {
      type: DataTypes.INTEGER, // Duration in milliseconds
      allowNull: true,
    },
    success: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      index: true,
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    screenshotPath: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSON, // Store additional data like browser info, etc.
      allowNull: true,
    },
  },
  {
    tableName: "automation_results",
    indexes: [
      {
        fields: ["jobId"],
      },
      {
        fields: ["playerId"],
      },
      {
        fields: ["status"],
      },
      {
        fields: ["success"],
      },
      {
        fields: ["startTime"],
      },
      {
        fields: ["endTime"],
      },
    ],
  }
);

module.exports = AutomationResult;
