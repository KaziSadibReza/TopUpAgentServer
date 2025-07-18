const winston = require("winston");
const path = require("path");

class LogService {
  constructor() {
    this.io = null;
    this.logs = [];
    this.maxLogs = 1000;

    // Configure Winston logger
    this.logger = winston.createLogger({
      level: "info",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return `${timestamp} [${level.toUpperCase()}]: ${message} ${
            Object.keys(meta).length ? JSON.stringify(meta) : ""
          }`;
        })
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
        }),
        new winston.transports.File({
          filename: path.join(__dirname, "../../logs/automation.log"),
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        }),
        new winston.transports.File({
          filename: path.join(__dirname, "../../logs/error.log"),
          level: "error",
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        }),
      ],
    });
  }

  init(io) {
    this.io = io;
    this.log("info", "LogService initialized");
  }

  log(level, message, meta = {}) {
    const logEntry = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      level,
      message,
      meta,
    };

    // Add to memory store
    this.logs.unshift(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    // Log to Winston
    this.logger.log(level, message, meta);

    // Emit to connected clients
    if (this.io) {
      this.io.to("automation").emit("log", logEntry);
    }

    return logEntry;
  }

  getLogs(limit = 50) {
    return this.logs.slice(0, limit);
  }

  clearLogs() {
    this.logs = [];
    this.log("info", "Logs cleared");
    if (this.io) {
      this.io.to("automation").emit("logs-cleared");
    }
  }

  getLogsByLevel(level, limit = 50) {
    return this.logs.filter((log) => log.level === level).slice(0, limit);
  }
}

module.exports = new LogService();
