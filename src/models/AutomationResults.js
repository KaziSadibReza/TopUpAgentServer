const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const AutomationResults = sequelize.define(
  "AutomationResults",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    jobId: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "job_id",
    },
    playerId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "player_id",
    },
    redimensionCode: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "redimension_code",
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "pending",
    },
    success: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: null,
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "start_time",
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "end_time",
    },
    duration: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "error_message",
    },
    screenshotPath: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "screenshot_path",
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
    },
    // Legacy fields for compatibility
    queue_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    source_site: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    order_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    license_key: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    server_response: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    execution_time: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
  },
  {
    tableName: "automation_results",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = AutomationResults;
