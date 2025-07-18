const puppeteer = require("puppeteer");
const LogService = require("./LogService");
const DatabaseService = require("./DatabaseService");

class AutomationService {
  constructor() {
    this.browser = null;
    this.isRunning = false;
    this.currentPage = null;
    this.runningJobs = new Map();
    this.io = null; // Socket.IO instance

    // Code mapping for packages
    this.codeMapping = {
      // BDMB codes
      "BDMB-T-S": "25 Diamond",
      "BDMB-U-S": "50 Diamond",
      "BDMB-J-S": "115 Diamond",
      "BDMB-I-S": "240 Diamond",
      "BDMB-K-S": "610 Diamond",
      "BDMB-L-S": "1240 Diamond",
      "BDMB-M-S": "2530 Diamond",
      "BDMB-Q-S": "Weekly Membership",
      "BDMB-S-S": "Monthly Membership",
      // UPBD codes
      "UPBD-Q-S": "25 Diamond",
      "UPBD-R-S": "50 Diamond",
      "UPBD-G-S": "115 Diamond",
      "UPBD-F-S": "240 Diamond",
      "UPBD-H-S": "610 Diamond",
      "UPBD-I-S": "1240 Diamond",
      "UPBD-J-S": "2530 Diamond",
      "UPBD-N-S": "Weekly Membership",
      "UPBD-P-S": "Monthly Membership",
    };
  }

  // Function to get package name from redimension code
  getPackageFromCode(code) {
    const codePrefix = code.split("-").slice(0, 3).join("-"); // Get BDMB-J-S part
    return this.codeMapping[codePrefix];
  }

  async initBrowser() {
    if (!this.browser) {
      LogService.log("info", "Initializing The Automation...");
      try {
        // const proxyServer = process.env.PROXY_SERVER; // Format: 'http://username:password@proxy-host:port'
        const proxyServer = "http://103.189.218.76:6969"; // Using direct proxy address

        this.browser = await puppeteer.launch({
          headless: process.env.HEADLESS !== "false", // Default to headless
          args: [
            // Proxy configuration if provided
            ...(proxyServer ? [`--proxy-server=${proxyServer}`] : []),
            // Basic security and performance args
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-accelerated-2d-canvas",
            "--no-first-run",
            "--no-zygote",
            "--disable-gpu",
            "--disable-web-security",
            "--disable-features=VizDisplayCompositor",
            "--disable-background-timer-throttling",
            "--disable-backgrounding-occluded-windows",
            "--disable-renderer-backgrounding",
            "--disable-extensions",
            "--disable-plugins",
            "--disable-default-apps",
            "--disable-hang-monitor",
            "--disable-popup-blocking",
            "--disable-prompt-on-repost",
            "--disable-sync",
            "--disable-translate",
            "--disable-ipc-flooding-protection",
            "--window-size=1366,768",
          ],
          defaultViewport: null,
          timeout: 60000,
        });

        if (proxyServer) {
          LogService.log("info", "Browser initialized with proxy server");
        }

        // Add browser disconnect handler
        this.browser.on("disconnected", () => {
          LogService.log("warning", "Browser disconnected unexpectedly");
          this.browser = null;
        });

        LogService.log("info", "Automation initialized successfully");
      } catch (error) {
        LogService.log("error", "Failed to initialize browser", {
          error: error.message,
        });
        throw new Error(`Browser initialization failed: ${error.message}`);
      }
    }
    return this.browser;
  }

  async closeBrowser() {
    if (this.browser) {
      LogService.log("info", "Closing browser...");
      await this.browser.close();
      this.browser = null;
      LogService.log("info", "Browser closed");
    }
  }

  // Helper method to log to both file and database
  async logMessage(jobId, level, message, metadata = {}) {
    // Log to file (existing LogService)
    LogService.log(level, message, metadata);

    // Log to database with error handling
    try {
      const job = this.runningJobs.get(jobId);
      if (DatabaseService.initialized) {
        await DatabaseService.createAutomationLog({
          jobId,
          level,
          message,
          playerId: job?.playerId || metadata.playerId,
          redimensionCode: job?.redimensionCode || metadata.redimensionCode,
          packageName: job?.packageName || metadata.packageName,
        });
      }
    } catch (error) {
      LogService.log("warning", "Database logging failed", {
        error: error.message,
      });
      // Continue execution even if database logging fails
    }
  }

  async runTopUpAutomation(playerId, redimensionCode, requestId) {
    if (this.runningJobs.has(requestId)) {
      throw new Error("Job already running with this request ID");
    }

    const packageName = this.getPackageFromCode(redimensionCode);
    const startTime = new Date();

    // Create automation result record in database (with error handling)
    try {
      await DatabaseService.createAutomationResult({
        jobId: requestId,
        playerId,
        redimensionCode,
        packageName,
        status: "running",
        startTime,
      });
    } catch (dbError) {
      await this.logMessage(
        requestId,
        "warning",
        "Database not available, continuing without database logging",
        {
          error: dbError.message,
        }
      );
    }

    const jobInfo = {
      requestId,
      playerId,
      redimensionCode,
      packageName,
      startTime,
      status: "running",
      page: null, // Will store page reference for cancellation
    };

    this.runningJobs.set(requestId, jobInfo);

    // Emit job started event
    this.emitJobUpdate("started", jobInfo);

    // Log to both file and database
    await this.logMessage(
      requestId,
      "info",
      "Starting Free Fire top-up automation...",
      {
        playerId,
        redimensionCode: redimensionCode.substring(0, 10) + "...",
        requestId,
        packageName,
      }
    );

    let page = null; // Declare page variable for proper cleanup

    try {
      // Check cancellation before starting
      await this.checkCancellation(requestId);

      const browser = await this.initBrowser();
      page = await browser.newPage();

      // Store page reference in job info for cancellation
      const currentJob = this.runningJobs.get(requestId);
      if (currentJob) {
        currentJob.page = page;
      }

      // Check cancellation after page creation
      await this.checkCancellation(requestId);

      // Add page error handlers
      page.on("error", (error) => {
        LogService.log("error", "Page error occurred", {
          error: error.message,
          requestId,
        });
      });

      page.on("pageerror", (error) => {
        LogService.log("error", "Page script error", {
          error: error.message,
          requestId,
        });
      });

      // Set user agent to mimic a real browser
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      );

      // Set viewport
      await page.setViewport({ width: 1366, height: 768 });

      // Add extra headers
      await page.setExtraHTTPHeaders({
        "Accept-Language": "en-US,en;q=0.9",
      });

      // Hide webdriver property
      await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, "webdriver", {
          get: () => undefined,
        });
      });

      await this.logMessage(requestId, "info", "Navigating to Garena Shop...");

      // Check cancellation before navigation
      await this.checkCancellation(requestId);

      await page.goto("https://shop.garena.my/?app=100067&channel=202953", {
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      // Take screenshot after navigation
      const navigationScreenshotPath = `screenshots/navigation-${requestId}-${Date.now()}.png`;
      await page.screenshot({ path: navigationScreenshotPath, fullPage: true });
      await this.logMessage(
        requestId,
        "info",
        `Screenshot taken after navigation: ${navigationScreenshotPath}`
      );

      await this.logMessage(
        requestId,
        "info",
        "Waiting for player ID input field..."
      );

      // Check cancellation before waiting for elements
      await this.checkCancellation(requestId);

      // Wait for page to load completely
      await new Promise((resolve) => setTimeout(resolve, 2000));

      await page.waitForSelector(
        'input[placeholder="Please enter player ID here"]',
        { timeout: 15000 }
      );

      // Check cancellation before entering player ID
      await this.checkCancellation(requestId);

      await this.logMessage(requestId, "info", "Entering Player ID...");
      // Type the Player ID into the input field
      await page.type(
        'input[placeholder="Please enter player ID here"]',
        playerId
      );

      await this.logMessage(requestId, "info", "Clicking Login button...");
      // Click the Login button
      await page.click('button[type="submit"]');

      await this.logMessage(
        requestId,
        "info",
        "Waiting for user profile to load..."
      );

      // Check cancellation before waiting for profile
      await this.checkCancellation(requestId);

      // Wait for the username to appear with better error handling
      try {
        await page.waitForSelector(".line-clamp-2.text-sm\\/none.font-bold", {
          timeout: 15000,
        });
      } catch (selectorError) {
        // Check cancellation before trying alternatives
        await this.checkCancellation(requestId);

        await this.logMessage(
          requestId,
          "warning",
          "Primary username selector not found, trying alternative..."
        );

        // Try alternative selectors for username
        const alternativeSelectors = [
          ".username",
          ".user-name",
          ".player-name",
          "[data-testid='username']",
          ".text-sm.font-bold",
        ];

        let found = false;
        for (const selector of alternativeSelectors) {
          // Check cancellation in the loop
          await this.checkCancellation(requestId);

          try {
            await page.waitForSelector(selector, { timeout: 3000 });
            found = true;
            break;
          } catch (e) {
            continue;
          }
        }

        if (!found) {
          throw new Error(
            "Player username selector not found - page may not have loaded correctly"
          );
        }
      }

      // Check cancellation before getting username
      await this.checkCancellation(requestId);

      const username = await page
        .$eval(".line-clamp-2.text-sm\\/none.font-bold", (el) => {
          return el.innerText;
        })
        .catch(async () => {
          // Try alternative extraction if primary fails
          const alternatives = [
            ".username",
            ".user-name",
            ".player-name",
            "[data-testid='username']",
            ".text-sm.font-bold",
          ];

          for (const selector of alternatives) {
            try {
              return await page.$eval(selector, (el) => el.innerText);
            } catch (e) {
              continue;
            }
          }
          return "Unknown Player";
        });

      await this.logMessage(requestId, "info", `Player found: ${username}`, {
        username,
      });

      await this.logMessage(
        requestId,
        "info",
        "Proceeding to top-up selection..."
      );

      // Check cancellation before proceeding to top-up
      await this.checkCancellation(requestId);

      await page.waitForSelector(
        "button.inline-flex.items-center.justify-center.gap-1\\.5.rounded-md.border.py-1.text-center.leading-none.transition-colors.border-primary-red.bg-primary-red.text-white.hover\\:bg-primary-red-hover.hover\\:border-primary-red-hover.px-5.text-base.font-bold.h-11.w-full",
        { timeout: 10000 }
      );

      await page.click(
        "button.inline-flex.items-center.justify-center.gap-1\\.5.rounded-md.border.py-1.text-center.leading-none.transition-colors.border-primary-red.bg-primary-red.text-white.hover\\:bg-primary-red-hover.hover\\:border-primary-red-hover.px-5.text-base.font-bold.h-11.w-full"
      );

      await Promise.all([page.waitForNavigation()]);

      // Get the package name from the redimension code
      const packageName = this.getPackageFromCode(redimensionCode);

      if (!packageName) {
        throw new Error(`Unknown package code: ${redimensionCode}`);
      }

      // Wait for the package selection buttons to load
      await page.waitForSelector(".payment-denom-button", { timeout: 10000 });

      // Click the correct package button
      const packageButton = await page.evaluateHandle((packageName) => {
        const buttons = document.querySelectorAll(".payment-denom-button");
        for (let button of buttons) {
          const nameDiv = button.querySelector("div");
          if (nameDiv && nameDiv.textContent.trim() === packageName) {
            return button;
          }
        }
        return null;
      }, packageName);

      if (packageButton) {
        await packageButton.click();
        await page.waitForNavigation({ waitUntil: "networkidle2" });
      } else {
        throw new Error(`Package ${packageName} not found on the page`);
      }

      // Wait for payment channel selection page
      await page.waitForSelector("#VOUCHER_panel", { timeout: 10000 });

      // Expand the VOUCHER panel first
      await page.click('button[data-target="#VOUCHER_panel"]');
      await page.waitForSelector("#VOUCHER_panel.show", { timeout: 5000 });

      // Check cancellation after voucher panel
      await this.checkCancellation(requestId);

      // Determine which payment method to use based on code type
      const codeType = redimensionCode.split("-")[0]; // Get BDMB or UPBD

      if (codeType === "BDMB") {
        await page.click("#pc_div_659");
      } else if (codeType === "UPBD") {
        await page.click("#pc_div_670");
      } else {
        throw new Error(`Unknown code type: ${codeType}`);
      }

      // Check cancellation before voucher input
      await this.checkCancellation(requestId);

      // Wait for the voucher form to load
      await page.waitForSelector(
        "input.form-control.text-center.unipin-voucher-textbox.profile-reload-serial1.autotab-serial",
        { timeout: 15000 }
      );

      // Check cancellation before entering voucher
      await this.checkCancellation(requestId);

      // Fill the serial field with the complete RedimensionCode using keyboard paste
      await page.focus(
        "input.form-control.text-center.unipin-voucher-textbox.profile-reload-serial1.autotab-serial"
      );

      // Clear the field first
      await page.keyboard.down("Control");
      await page.keyboard.press("KeyA");
      await page.keyboard.up("Control");

      // Copy the code to clipboard and paste it
      await page.evaluate((code) => {
        navigator.clipboard.writeText(code);
      }, redimensionCode);

      // Paste using Ctrl+V
      await page.keyboard.down("Control");
      await page.keyboard.press("KeyV");
      await page.keyboard.up("Control");

      // Check cancellation before submitting
      await this.checkCancellation(requestId);

      // Click the Confirm button
      await page.click('input[type="submit"][value="Confirm"]');

      LogService.log("info", "Waiting for transaction result...");
      // Wait for the next page to load
      try {
        await page.waitForNavigation({ waitUntil: "networkidle2" });

        // Check if there's an error message
        const errorElement = await page.$(".title-case-0");
        if (errorElement) {
          const errorText = await page.evaluate(
            (el) => el.textContent,
            errorElement
          );

          // Check if it's a consumed voucher error
          if (errorText.includes("Consumed Voucher")) {
            throw new Error("The voucher code has already been used/consumed!");
          } else {
            throw new Error(`Transaction failed: ${errorText}`);
          }
        }
      } catch (navigationError) {
        // Check if we're still on an error page
        const currentUrl = page.url();
        await this.logMessage(requestId, "info", `Current URL: ${currentUrl}`);

        // Additional error checking
        const errorElement = await page.$(".title-case-0");
        if (errorElement) {
          const errorText = await page.evaluate(
            (el) => el.textContent,
            errorElement
          );
          throw new Error(`Transaction failed: ${errorText}`);
        }
      }

      // Take final screenshot
      const screenshotPath = `screenshots/success-${requestId}-${Date.now()}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });

      // Close page
      await page.close();

      // Calculate duration
      const endTime = new Date();
      const duration = endTime - startTime;

      // Update job status
      jobInfo.status = "completed";
      jobInfo.endTime = endTime;
      jobInfo.result = {
        success: true,
        message: "Top-up completed successfully",
        username,
        packageName,
        playerId,
        redimensionCode: redimensionCode.substring(0, 10) + "...",
      };
      jobInfo.screenshot = screenshotPath;

      // Emit job completed event
      this.emitJobUpdate("completed", jobInfo);

      // Update database with error handling
      try {
        await DatabaseService.updateAutomationResult(requestId, {
          status: "completed",
          endTime,
          duration,
          success: true,
          screenshotPath,
          metadata: {
            username,
            packageName,
            browser: "puppeteer",
          },
        });
      } catch (dbError) {
        await this.logMessage(
          requestId,
          "warning",
          "Failed to update database result",
          {
            error: dbError.message,
          }
        );
      }

      await this.logMessage(requestId, "info", "Job marked as completed", {
        requestId,
        status: jobInfo.status,
        endTime: jobInfo.endTime,
      });

      // Emit job update event
      this.emitJobUpdate("completed", jobInfo);

      return {
        success: true,
        message: "Top-up automation completed successfully",
        result: jobInfo.result,
        screenshot: screenshotPath,
        duration,
        requestId,
        username,
        packageName,
      };
    } catch (error) {
      // Check if this is a cancellation error
      if (error.message === "Job cancelled") {
        await this.logMessage(requestId, "info", "Job cancelled by user", {
          requestId,
          playerId,
        });

        // Don't mark as failed if cancelled - job was already marked as cancelled
        const cancelledJob = this.runningJobs.get(requestId);
        if (cancelledJob && cancelledJob.status === "cancelled") {
          // Job is already marked as cancelled, just clean up
        } else {
          // Mark as cancelled if not already done
          const jobInfo = this.runningJobs.get(requestId);
          if (jobInfo) {
            jobInfo.status = "cancelled";
            jobInfo.endTime = new Date();
            this.emitJobUpdate("cancelled", jobInfo);
          }
        }
      } else {
        // Handle actual errors (not cancellations)
        await this.logMessage(
          requestId,
          "error",
          "Free Fire automation failed",
          {
            error: error.message,
            requestId,
            playerId,
          }
        );

        // Take error screenshot
        let errorScreenshotPath = null;
        try {
          if (page) {
            errorScreenshotPath = `screenshots/error-${requestId}-${Date.now()}.png`;
            await page.screenshot({
              path: errorScreenshotPath,
              fullPage: true,
            });
            jobInfo.screenshot = errorScreenshotPath;
          }
        } catch (screenshotError) {
          await this.logMessage(
            requestId,
            "warning",
            "Failed to capture error screenshot",
            {
              error: screenshotError.message,
            }
          );
        }

        // Calculate duration
        const endTime = new Date();
        const duration = endTime - startTime;

        // Update job info
        jobInfo.status = "failed";
        jobInfo.endTime = endTime;
        jobInfo.duration = duration;
        jobInfo.error = error.message;

        // Update database with error handling
        try {
          await DatabaseService.updateAutomationResult(requestId, {
            status: "failed",
            endTime,
            duration,
            success: false,
            errorMessage: error.message,
            screenshotPath: errorScreenshotPath,
            metadata: {
              browser: "puppeteer",
              errorType: error.constructor.name,
            },
          });
        } catch (dbError) {
          await this.logMessage(
            requestId,
            "warning",
            "Failed to update database error result",
            {
              error: dbError.message,
            }
          );
        }

        await this.logMessage(requestId, "info", "Job marked as failed", {
          requestId,
          status: jobInfo.status,
          endTime: jobInfo.endTime,
          error: error.message,
        });

        // Clean up old completed jobs from memory
        this.cleanupCompletedJobs();

        // Emit job update event
        this.emitJobUpdate("failed", jobInfo);

        throw error;
      }

      // Update job status
      jobInfo.status = "failed";
      jobInfo.endTime = endTime;
      jobInfo.error = error.message;

      // Emit job failed event
      this.emitJobUpdate("failed", jobInfo);

      // Update database with error handling
      try {
        await DatabaseService.updateAutomationResult(requestId, {
          status: "failed",
          endTime,
          duration,
          success: false,
          errorMessage: error.message,
          screenshotPath: errorScreenshotPath,
          metadata: {
            browser: "puppeteer",
            errorType: error.constructor.name,
          },
        });
      } catch (dbError) {
        await this.logMessage(
          requestId,
          "warning",
          "Failed to update database error result",
          {
            error: dbError.message,
          }
        );
      }

      await this.logMessage(requestId, "info", "Job marked as failed", {
        requestId,
        status: jobInfo.status,
        endTime: jobInfo.endTime,
        error: error.message,
      });

      // Clean up old completed jobs from memory
      this.cleanupCompletedJobs();

      // Emit job update event
      this.emitJobUpdate("failed", jobInfo);

      throw error;
    } finally {
      // Close the page if it exists
      if (page) {
        try {
          await page.close();
        } catch (closeError) {
          LogService.log("warning", "Failed to close page", {
            error: closeError.message,
          });
        }
      }

      // Close the browser after each job
      await this.closeBrowser();

      // Clean up running job after delay (keep job info for 5 minutes for status checking)
      setTimeout(() => {
        this.runningJobs.delete(requestId);
      }, 300000); // Keep job info for 5 minutes
    }
  }

  // Set Socket.IO instance for real-time updates
  setSocketIO(io) {
    this.io = io;
    LogService.log("info", "Socket.IO instance set for AutomationService");
  }

  // Emit job status update to connected clients
  emitJobUpdate(eventType, jobData) {
    if (this.io) {
      this.io.to("automation").emit("job-update", {
        type: eventType,
        job: jobData,
        timestamp: new Date().toISOString(),
      });

      // Also emit updated running jobs list after any job update
      const runningJobs = this.getRunningJobsForClient();
      this.io.to("automation").emit("running-jobs", runningJobs);
    }
  }

  // Get running jobs in a format suitable for client updates
  getRunningJobsForClient() {
    // Only return jobs that are actually running or pending (not completed/failed/cancelled)
    const runningJobs = Array.from(this.runningJobs.values()).filter(
      (job) => job.status === "running" || job.status === "pending"
    );

    const jobs = runningJobs.map((job) => ({
      jobId: job.requestId,
      requestId: job.requestId, // Include both for compatibility
      playerId: job.playerId,
      packageName: job.packageName,
      status: job.status,
      startTime: job.startTime,
      endTime: job.endTime,
      duration: job.endTime
        ? job.endTime.getTime() - job.startTime.getTime()
        : Date.now() - job.startTime.getTime(),
    }));

    console.log(
      `AutomationService: Returning ${jobs.length} running jobs out of ${this.runningJobs.size} total jobs`
    );
    return jobs;
  }

  async getJobStatus(requestId) {
    // First check in-memory running jobs
    const job = this.runningJobs.get(requestId);
    if (job) {
      // Calculate duration properly
      let duration;
      if (job.endTime) {
        duration = job.endTime - job.startTime;
      } else if (job.status === "running") {
        duration = Date.now() - job.startTime;
      } else {
        // Job finished but endTime not set (shouldn't happen, but safety check)
        duration = Date.now() - job.startTime;
      }

      return {
        status: job.status,
        requestId: job.requestId,
        playerId: job.playerId,
        startTime: job.startTime,
        endTime: job.endTime,
        result: job.result,
        error: job.error,
        screenshot: job.screenshot,
        duration: duration,
      };
    }

    // If not in memory, check database for completed jobs
    try {
      const dbResult = await DatabaseService.getAutomationResult(requestId);
      if (dbResult) {
        // Convert database result to expected format
        let duration = null;
        if (dbResult.startTime && dbResult.endTime) {
          duration = new Date(dbResult.endTime) - new Date(dbResult.startTime);
        }

        return {
          status: dbResult.status,
          requestId: dbResult.jobId,
          playerId: dbResult.playerId,
          startTime: dbResult.startTime,
          endTime: dbResult.endTime,
          result: dbResult.success
            ? {
                success: true,
                message: "Automation completed",
                packageName: dbResult.packageName,
              }
            : null,
          error: dbResult.errorMessage,
          screenshot: dbResult.screenshotPath,
          duration: duration,
        };
      }
    } catch (error) {
      LogService.log("warning", "Failed to check database for job status", {
        error: error.message,
        requestId,
      });
    }

    return { status: "not_found" };
  }

  // Helper method to check if a job is cancelled
  isJobCancelled(requestId) {
    const job = this.runningJobs.get(requestId);
    return job && job.status === "cancelled";
  }

  // Helper method to check cancellation and throw error if cancelled
  async checkCancellation(requestId) {
    if (this.isJobCancelled(requestId)) {
      throw new Error("Job cancelled");
    }
  }

  async cancelJob(requestId) {
    const job = this.runningJobs.get(requestId);
    if (!job) {
      return { success: false, message: "Job not found" };
    }

    job.status = "cancelled";
    job.endTime = new Date();

    // If the job has a page reference, try to close it
    if (job.page) {
      try {
        await job.page.close();
        LogService.log("info", "Closed page for cancelled job", { requestId });
      } catch (error) {
        LogService.log("warning", "Failed to close page for cancelled job", {
          requestId,
          error: error.message,
        });
      }
    }

    // Emit job cancelled event
    this.emitJobUpdate("cancelled", job);

    LogService.log("info", "Job cancelled", { requestId });

    return { success: true, message: "Job cancelled successfully" };
  }

  async getStatus() {
    // Filter to only return actually running jobs (not completed/failed)
    const actuallyRunningJobs = Array.from(this.runningJobs.values())
      .filter((job) => job.status === "running" || job.status === "pending")
      .map((job) => job.requestId);

    return {
      isRunning: this.isRunning,
      browserActive: !!this.browser,
      runningJobs: actuallyRunningJobs,
      timestamp: new Date().toISOString(),
    };
  }

  getRunningJobs() {
    // Only return jobs that are actually running or pending (not completed/failed/cancelled)
    const allJobs = Array.from(this.runningJobs.values());
    const runningJobs = allJobs.filter(
      (job) => job.status === "running" || job.status === "pending"
    );

    console.log(
      `AutomationService: ${runningJobs.length} running jobs out of ${allJobs.length} total jobs`
    );
    allJobs.forEach((job) => {
      console.log(`Job ${job.requestId}: status = ${job.status}`);
    });

    return runningJobs;
  }

  // Clean up completed jobs from memory (keep only last 10 completed jobs)
  cleanupCompletedJobs() {
    const completedJobs = Array.from(this.runningJobs.entries())
      .filter(
        ([_, job]) => job.status !== "running" && job.status !== "pending"
      )
      .sort(
        (a, b) =>
          new Date(b[1].endTime || b[1].startTime) -
          new Date(a[1].endTime || a[1].startTime)
      );

    // Keep only the 10 most recent completed jobs
    if (completedJobs.length > 10) {
      const jobsToRemove = completedJobs.slice(10);
      jobsToRemove.forEach(([requestId, _]) => {
        this.runningJobs.delete(requestId);
      });

      LogService.log(
        "info",
        `Cleaned up ${jobsToRemove.length} old completed jobs`
      );
    }
  }

  // Clear all automation data from the database
  async clearAllData() {
    try {
      LogService.log("info", "Starting to clear all automation data...");

      // Clear all running jobs from memory
      this.runningJobs.clear();

      // Clear all data from database tables
      if (DatabaseService.initialized) {
        // Delete all automation logs
        await DatabaseService.clearAutomationLogs();

        // Delete all automation results
        await DatabaseService.clearAutomationResults();

        // Delete any screenshots
        const fs = require("fs").promises;
        const path = require("path");

        try {
          const files = await fs.readdir("screenshots");
          for (const file of files) {
            await fs.unlink(path.join("screenshots", file));
          }
          LogService.log("info", "All screenshot files deleted successfully");
        } catch (err) {
          LogService.log("warning", "Error deleting screenshots", {
            error: err.message,
          });
        }
      }

      LogService.log("info", "All automation data cleared successfully");
      return {
        success: true,
        message: "All automation data cleared successfully",
      };
    } catch (error) {
      LogService.log("error", "Failed to clear automation data", {
        error: error.message,
      });
      throw new Error(`Failed to clear automation data: ${error.message}`);
    }
  }
}

module.exports = new AutomationService();
