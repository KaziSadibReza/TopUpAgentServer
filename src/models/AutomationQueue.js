const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const AutomationQueue = sequelize.define(
  "AutomationQueue",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    queue_type: {
      type: DataTypes.STRING,
      defaultValue: "manual",
    },
    source_site: {
      type: DataTypes.STRING,
      defaultValue: "localhost",
    },
    site_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    order_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    product_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    product_name: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
    license_key: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    redimension_code: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    player_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    automation_type: {
      type: DataTypes.STRING,
      defaultValue: "single",
    },
    group_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    group_position: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    group_total: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    priority: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: "pending",
    },
    retry_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    max_retries: {
      type: DataTypes.INTEGER,
      defaultValue: 3,
    },
    created_by: {
      type: DataTypes.STRING,
      defaultValue: "api",
    },
    webhook_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    api_key: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    server_response: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    scheduled_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    started_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "automation_queue",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = AutomationQueue;
