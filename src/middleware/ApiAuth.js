const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

/**
 * API Authentication Middleware
 */
class ApiAuth {
  constructor() {
    // Path to store API key
    this.apiKeyFile = path.join(__dirname, "../config/api-key.txt");

    // Try to load existing API key or generate new one
    this.apiKey = this.loadOrGenerateApiKey();

    if (!process.env.API_KEY) {
      console.log("💡 Using persistent API key:", this.apiKey);
    }
  }

  /**
   * Load existing API key from file or generate new one
   */
  loadOrGenerateApiKey() {
    // First check environment variable
    if (process.env.API_KEY) {
      return process.env.API_KEY;
    }

    // Try to load from file
    try {
      if (fs.existsSync(this.apiKeyFile)) {
        const savedKey = fs.readFileSync(this.apiKeyFile, "utf8").trim();
        if (savedKey && savedKey.length === 64) {
          // Valid hex key
          console.log("📂 Loaded existing API key from file");
          return savedKey;
        }
      }
    } catch (error) {
      console.log("⚠️  Could not load API key from file:", error.message);
    }

    // Generate new key and save it
    const newKey = this.generateApiKey();
    this.saveApiKey(newKey);
    console.log("� Generated new persistent API key");
    return newKey;
  }

  /**
   * Save API key to file
   */
  saveApiKey(key) {
    try {
      const configDir = path.dirname(this.apiKeyFile);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      fs.writeFileSync(this.apiKeyFile, key);
      console.log("💾 API key saved to file");
    } catch (error) {
      console.log("⚠️  Could not save API key to file:", error.message);
    }
  }

  /**
   * Generate a secure API key
   */
  generateApiKey() {
    return crypto.randomBytes(32).toString("hex");
  }

  /**
   * Get the current API key
   */
  getApiKey() {
    return this.apiKey;
  }

  /**
   * Middleware function to verify API key
   */
  authenticate(req, res, next) {
    // Skip authentication for health check and status endpoints
    if (req.path === "/health" || req.path === "/api/status") {
      return next();
    }

    // Check for API key in Authorization header
    const authHeader = req.headers.authorization;
    let apiKey = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      apiKey = authHeader.substring(7);
    } else if (req.headers["x-api-key"]) {
      apiKey = req.headers["x-api-key"];
    } else if (req.query.api_key) {
      apiKey = req.query.api_key;
    }

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: "API key required",
        message:
          "Please provide API key in Authorization header (Bearer token), X-API-Key header, or api_key query parameter",
      });
    }

    if (apiKey !== this.apiKey) {
      return res.status(401).json({
        success: false,
        error: "Invalid API key",
        message: "The provided API key is not valid",
      });
    }

    // API key is valid, proceed
    next();
  }

  /**
   * Middleware function to optionally verify API key (allows access without key)
   */
  optionalAuthenticate(req, res, next) {
    // Always allow access, but validate API key if provided
    const authHeader = req.headers.authorization;
    let apiKey = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      apiKey = authHeader.substring(7);
    } else if (req.headers["x-api-key"]) {
      apiKey = req.headers["x-api-key"];
    } else if (req.query.api_key) {
      apiKey = req.query.api_key;
    }

    // If API key is provided but invalid, reject
    if (apiKey && apiKey !== this.apiKey) {
      return res.status(401).json({
        success: false,
        error: "Invalid API key",
        message: "The provided API key is not valid",
      });
    }

    // Either no API key provided (allowed) or valid API key provided
    req.authenticated = !!apiKey;
    next();
  }
}

module.exports = new ApiAuth();
