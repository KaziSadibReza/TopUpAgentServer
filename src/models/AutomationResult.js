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
      field: "job_id", // Map to snake_case in database
    },
    playerId: {
      type: DataTypes.STRING,
      allowNull: false,
      index: true,
      field: "player_id", // Map to snake_case in database
    },
    redimensionCode: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "redimension_code", // Map to snake_case in database
    },
    orderId: {
      type: DataTypes.STRING,
      allowNull: true,
      index: true,
      field: "order_id", // Map to snake_case in database
    },
    packageName: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "package_name", // Map to snake_case in database
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
      field: "start_time", // Map to snake_case in database
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "end_time", // Map to snake_case in database
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
      field: "error_message", // Map to snake_case in database
    },
    screenshotPath: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "screenshot_path", // Map to snake_case in database
    },
    metadata: {
      type: DataTypes.JSON, // Store additional data like browser info, etc.
      allowNull: true,
    },
  },
  {
    tableName: "automation_results",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
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
      {
        fields: ["orderId"],
      },
    ],
  }
);

module.exports = AutomationResult;
