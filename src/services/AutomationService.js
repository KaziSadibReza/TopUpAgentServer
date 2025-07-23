const puppeteer = require("puppeteer-core");
const LogService = require("./LogService");
const DatabaseService = require("./DatabaseService");

class AutomationService {
  constructor() {
    this.browser = null;
    this.runningJobs = new Map();
    this.io = null;

    // Bright Data Browser API endpoint
    this.wsEndpoint =
      "wss://brd-customer-hl_59d4ef49-zone-freefire_top_automation:o8c8vcn6r76d@brd.superproxy.io:9222";

    // Package mapping
    this.codeMapping = {
      "BDMB-T-S": "25 Diamond",
      "BDMB-U-S": "50 Diamond",
      "BDMB-J-S": "115 Diamond",
      "BDMB-I-S": "240 Diamond",
      "BDMB-K-S": "610 Diamond",
      "BDMB-L-S": "1240 Diamond",
      "BDMB-M-S": "2530 Diamond",
      "BDMB-Q-S": "Weekly Membership",
      "BDMB-S-S": "Monthly Membership",
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

  getPackageFromCode(code) {
    return this.codeMapping[code.split("-").slice(0, 3).join("-")];
  }

  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.connect({
        browserWSEndpoint: this.wsEndpoint,
        ignoreHTTPSErrors: true,
      });
    }
    return this.browser;
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async runTopUpAutomation(playerId, redimensionCode, requestId) {
    if (this.runningJobs.has(requestId)) throw new Error("Job already running");

    const packageName = this.getPackageFromCode(redimensionCode);
    const startTime = new Date();
    const jobInfo = {
      requestId,
      playerId,
      redimensionCode,
      packageName,
      startTime,
      status: "running",
    };
    this.runningJobs.set(requestId, jobInfo);

    // Log job start
    LogService.log("info", "Starting Free Fire top-up automation", {
      requestId,
      playerId,
      packageName,
    });

    // Create database record
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
      LogService.log("warning", "Database not available", {
        error: dbError.message,
      });
    }

    try {
      const browser = await this.initBrowser();
      const page = await browser.newPage();
      jobInfo.page = page;

      LogService.log("info", "Navigating to Garena Shop", { requestId });
      // Navigate to Garena Shop
      await page.goto("https://shop.garena.my/?app=100067&channel=202953", {
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      LogService.log("info", "Entering Player ID", { requestId, playerId });
      // Enter Player ID
      await page.waitForSelector(
        'input[placeholder="Please enter player ID here"]',
        { timeout: 15000 }
      );
      await page.type(
        'input[placeholder="Please enter player ID here"]',
        playerId
      );
      await page.click('button[type="submit"]');

      LogService.log("info", "Waiting for profile", { requestId });
      // Wait for profile
      await page.waitForSelector(".line-clamp-2.text-sm\\/none.font-bold", {
        timeout: 15000,
      });
      const username = await page
        .$eval(".line-clamp-2.text-sm\\/none.font-bold", (el) => el.innerText)
        .catch(() => "Unknown");

      LogService.log("info", "Player found", {
        requestId,
        username,
        packageName,
      });

      LogService.log("info", "Proceeding to top-up selection", { requestId });
      // Navigate to top-up
      await page.waitForSelector(
        "button.inline-flex.items-center.justify-center.gap-1\\.5.rounded-md.border.py-1.text-center.leading-none.transition-colors.border-primary-red.bg-primary-red.text-white.hover\\:bg-primary-red-hover.hover\\:border-primary-red-hover.px-5.text-base.font-bold.h-11.w-full",
        { timeout: 10000 }
      );
      await page.click(
        "button.inline-flex.items-center.justify-center.gap-1\\.5.rounded-md.border.py-1.text-center.leading-none.transition-colors.border-primary-red.bg-primary-red.text-white.hover\\:bg-primary-red-hover.hover\\:border-primary-red-hover.px-5.text-base.font-bold.h-11.w-full"
      );
      await page.waitForNavigation({ waitUntil: "networkidle2" });

      // Select package
      await page.waitForSelector(".payment-denom-button", { timeout: 10000 });
      const packageButton = await page.evaluateHandle((packageName) => {
        const buttons = document.querySelectorAll(".payment-denom-button");
        for (let button of buttons) {
          const nameDiv = button.querySelector("div");
          if (nameDiv && nameDiv.textContent.trim() === packageName)
            return button;
        }
        return null;
      }, packageName);

      if (!packageButton) throw new Error(`Package ${packageName} not found`);

      LogService.log("info", "Selecting package", { requestId, packageName });
      await packageButton.click();
      await page.waitForNavigation({ waitUntil: "networkidle2" });

      LogService.log("info", "Setting up payment method", { requestId });
      // Payment method selection
      await page.waitForSelector("#VOUCHER_panel", { timeout: 10000 });
      await page.click('button[data-target="#VOUCHER_panel"]');
      await page.waitForSelector("#VOUCHER_panel.show", { timeout: 5000 });

      // Select payment provider
      const codeType = redimensionCode.split("-")[0];
      if (codeType === "BDMB") {
        await page.click("#pc_div_659");
      } else if (codeType === "UPBD") {
        await page.click("#pc_div_670");
      }

      // Enter voucher code
      await page.waitForSelector(
        "input.form-control.text-center.unipin-voucher-textbox.profile-reload-serial1.autotab-serial",
        { timeout: 15000 }
      );
      await page.focus(
        "input.form-control.text-center.unipin-voucher-textbox.profile-reload-serial1.autotab-serial"
      );
      await page.keyboard.down("Control");
      await page.keyboard.press("KeyA");
      await page.keyboard.up("Control");
      await page.evaluate(
        (code) => navigator.clipboard.writeText(code),
        redimensionCode
      );
      await page.keyboard.down("Control");
      await page.keyboard.press("KeyV");
      await page.keyboard.up("Control");

      LogService.log("info", "Taking screenshot before checkout", {
        requestId,
      });
      // Take screenshot before checkout
      const beforeCheckoutPath = `screenshots/before-checkout-${requestId}-${Date.now()}.png`;
      await page.screenshot({ path: beforeCheckoutPath, fullPage: true });

      LogService.log("info", "Submitting order", { requestId });
      // Submit order
      await page.click('input[type="submit"][value="Confirm"]');
      await page.waitForNavigation({ waitUntil: "networkidle2" });

      LogService.log("info", "Taking completion screenshot", { requestId });
      // Take completion screenshot
      const completionPath = `screenshots/completion-${requestId}-${Date.now()}.png`;
      await page.screenshot({ path: completionPath, fullPage: true });

      await page.close();

      const endTime = new Date();
      const duration = endTime - startTime;

      jobInfo.status = "completed";
      jobInfo.endTime = endTime;
      jobInfo.result = { success: true, username, packageName, playerId };
      jobInfo.beforeCheckoutScreenshot = beforeCheckoutPath;
      jobInfo.completionScreenshot = completionPath;

      LogService.log("info", "Top-up automation completed successfully", {
        requestId,
        username,
        packageName,
        duration,
      });

      // Update database
      try {
        await DatabaseService.updateAutomationResult(requestId, {
          status: "completed",
          endTime,
          duration,
          success: true,
          screenshotPath: completionPath,
        });
      } catch (dbError) {
        LogService.log("warning", "Failed to update database", {
          error: dbError.message,
        });
      }

      this.emitJobUpdate("completed", jobInfo);

      return {
        success: true,
        result: jobInfo.result,
        beforeCheckoutScreenshot: beforeCheckoutPath,
        completionScreenshot: completionPath,
        duration,
        requestId,
        username,
        packageName,
      };
    } catch (error) {
      LogService.log("error", "Top-up automation failed", {
        requestId,
        error: error.message,
        playerId,
        packageName,
      });

      const endTime = new Date();
      jobInfo.status = "failed";
      jobInfo.endTime = endTime;
      jobInfo.error = error.message;

      let errorScreenshotPath = null;
      if (jobInfo.page) {
        try {
          errorScreenshotPath = `screenshots/error-${requestId}-${Date.now()}.png`;
          await jobInfo.page.screenshot({
            path: errorScreenshotPath,
            fullPage: true,
          });
          await jobInfo.page.close();
          LogService.log("info", "Error screenshot captured", {
            requestId,
            errorScreenshotPath,
          });
        } catch (e) {
          LogService.log("warning", "Failed to capture error screenshot", {
            requestId,
          });
        }
      }

      // Update database
      try {
        await DatabaseService.updateAutomationResult(requestId, {
          status: "failed",
          endTime,
          duration: endTime - startTime,
          success: false,
          errorMessage: error.message,
          screenshotPath: errorScreenshotPath,
        });
      } catch (dbError) {
        LogService.log("warning", "Failed to update database", {
          error: dbError.message,
        });
      }

      this.emitJobUpdate("failed", jobInfo);
      throw error;
    } finally {
      await this.closeBrowser();
      setTimeout(() => this.runningJobs.delete(requestId), 300000);
    }
  }

  setSocketIO(io) {
    this.io = io;
  }

  emitJobUpdate(eventType, jobData) {
    if (this.io) {
      this.io.to("automation").emit("job-update", {
        type: eventType,
        job: jobData,
        timestamp: new Date().toISOString(),
      });
      const runningJobs = Array.from(this.runningJobs.values()).filter(
        (job) => job.status === "running"
      );
      this.io.to("automation").emit("running-jobs", runningJobs);
    }
  }

  async getJobStatus(requestId) {
    const job = this.runningJobs.get(requestId);
    if (job) {
      const duration = job.endTime
        ? job.endTime.getTime() - job.startTime.getTime()
        : Date.now() - job.startTime.getTime();
      return { ...job, duration };
    }
    return { status: "not_found" };
  }

  async cancelJob(requestId) {
    const job = this.runningJobs.get(requestId);
    if (!job) return { success: false, message: "Job not found" };

    job.status = "cancelled";
    job.endTime = new Date();
    if (job.page) {
      try {
        await job.page.close();
      } catch (e) {}
    }
    this.emitJobUpdate("cancelled", job);
    return { success: true, message: "Job cancelled" };
  }

  getRunningJobs() {
    return Array.from(this.runningJobs.values()).filter(
      (job) => job.status === "running"
    );
  }

  async getStatus() {
    return {
      isRunning: this.runningJobs.size > 0,
      browserActive: !!this.browser,
      runningJobs: this.getRunningJobs().map((job) => job.requestId),
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = new AutomationService();
