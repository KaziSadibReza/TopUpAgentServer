const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ServerStatus = sequelize.define(
  "ServerStatus",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      defaultValue: 1,
    },
    is_busy: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    current_automation_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    current_automation_start: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    total_processed: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    total_failed: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    last_activity: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "server_status",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = ServerStatus;
