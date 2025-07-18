const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const LogService = require("./LogService");

// Configure stealth plugin
puppeteer.use(StealthPlugin());

class AutomationService {
  constructor() {
    this.browser = null;
    this.isRunning = false;
    this.currentPage = null;
    this.runningJobs = new Map();
    this.io = null;

    // BDMB and UPBD code mappings
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
    const codePrefix = code.split("-").slice(0, 3).join("-");
    return this.codeMapping[codePrefix];
  }

  async initBrowser() {
    if (!this.browser) {
      LogService.log("info", "Initializing The Automation...");
      try {
        this.browser = await puppeteer.launch({
          headless: process.env.HEADLESS !== "false",
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-accelerated-2d-canvas",
            "--no-first-run",
            "--no-zygote",
            "--disable-gpu",
            "--disable-web-security",
            "--disable-features=IsolateOrigins,site-per-process",
            "--disable-background-timer-throttling",
            "--disable-backgrounding-occluded-windows",
            "--disable-renderer-backgrounding",
            "--disable-default-apps",
            "--disable-hang-monitor",
            "--disable-sync",
            "--disable-translate",
            "--metrics-recording-only",
            "--disable-blink-features=AutomationControlled",
            "--lang=en-SG,en-MY,en",
            "--window-size=1366,768",
            "--timezone=Asia/Singapore",
          ],
          defaultViewport: {
            width: 1366,
            height: 768,
          },
          ignoreHTTPSErrors: true,
          timeout: 60000,
        });

        this.browser.on("disconnected", () => {
          LogService.log("warning", "Browser disconnected unexpectedly");
          this.browser = null;
        });

        LogService.log("info", "Automation initialized successfully");
        return this.browser;
      } catch (error) {
        LogService.log("error", "Failed to initialize browser", {
          error: error.message,
        });
        throw new Error(`Browser initialization failed: ${error.message}`);
      }
    }
    return this.browser;
  }

  async createPage() {
    try {
      const browser = await this.initBrowser();
      const page = await browser.newPage();

      await page.setDefaultNavigationTimeout(60000);
      await page.setRequestInterception(true);

      page.on("request", (request) => {
        if (
          request.resourceType() === "image" ||
          request.resourceType() === "media"
        ) {
          request.abort();
        } else {
          request.continue();
        }
      });

      await page.setExtraHTTPHeaders({
        "Accept-Language": "en-US,en;q=0.9",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      });

      return page;
    } catch (error) {
      LogService.log("error", "Failed to create page", {
        error: error.message,
      });
      throw new Error(`Page creation failed: ${error.message}`);
    }
  }

  async handleRecaptcha(page) {
    try {
      // Check for reCAPTCHA presence
      const hasRecaptcha = await page.evaluate(() => {
        return (
          document.querySelector(".g-recaptcha") !== null ||
          document.querySelector('iframe[src*="recaptcha"]') !== null
        );
      });

      if (!hasRecaptcha) {
        return false;
      }

      LogService.log("info", "Detected reCAPTCHA, attempting to bypass...");

      // Try to find and click the checkbox if it exists
      const frameHandle = await page.evaluateHandle(() => {
        const frames = document.querySelectorAll("iframe");
        for (const frame of frames) {
          if (frame.src.includes("anchor")) {
            return frame;
          }
        }
        return null;
      });

      if (frameHandle) {
        const frame = await frameHandle.contentFrame();
        if (frame) {
          // Wait for checkbox and try to click it naturally
          await frame.waitForSelector(".recaptcha-checkbox-border");

          // Get checkbox position
          const checkbox = await frame.$(".recaptcha-checkbox-border");
          const box = await checkbox.boundingBox();

          // Move mouse naturally
          await page.mouse.move(
            box.x + box.width / 2 + Math.random() * 10 - 5,
            box.y + box.height / 2 + Math.random() * 10 - 5,
            { steps: 10 }
          );

          // Small random delay before clicking
          await page.waitForTimeout(500 + Math.random() * 500);

          // Click the checkbox
          await checkbox.click({ delay: 50 });

          // Wait to see if we need to solve a challenge
          await page.waitForTimeout(2000);

          // Check if checkbox was successful
          const solved = await frame.evaluate(() => {
            const element = document.querySelector(
              ".recaptcha-checkbox-checked"
            );
            return element !== null;
          });

          if (solved) {
            LogService.log("info", "Successfully handled reCAPTCHA");
            return true;
          }
        }
      }

      // If we reach here, we either couldn't find the checkbox or clicking it triggered a challenge
      LogService.log("info", "Could not automatically handle reCAPTCHA");

      // Try to bypass reCAPTCHA by adding trusted browser characteristics
      await page.evaluate(() => {
        // Add browser characteristics that reCAPTCHA trusts
        Object.defineProperty(navigator, "webdriver", { get: () => false });
        Object.defineProperty(navigator, "plugins", {
          get: () => [1, 2, 3, 4, 5],
        });
        Object.defineProperty(navigator, "languages", {
          get: () => ["en-US", "en"],
        });

        // Add touch support
        Object.defineProperty(navigator, "maxTouchPoints", { get: () => 5 });

        // Add Chrome runtime
        window.chrome = {
          runtime: {},
          loadTimes: () => {},
          csi: () => {},
          app: {},
        };
      });

      // Wait a bit to see if our bypass worked
      await page.waitForTimeout(3000);

      return false;
    } catch (error) {
      LogService.log("error", "Error in handleRecaptcha", {
        error: error.message,
      });
      // Don't throw the error, just return false and let the process continue
      return false;
    }
  }

  async cleanupJob(jobId) {
    try {
      const job = this.runningJobs.get(jobId);
      if (job && job.page) {
        await job.page.close();
      }
      this.runningJobs.delete(jobId);
      LogService.log("info", `Cleaned up job ${jobId}`);
    } catch (error) {
      LogService.log("error", `Error cleaning up job ${jobId}`, {
        error: error.message,
      });
    }
  }

  async cleanup() {
    try {
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
      this.isRunning = false;
      this.currentPage = null;
      this.runningJobs.clear();
      LogService.log("info", "Automation cleanup completed");
    } catch (error) {
      LogService.log("error", "Error during cleanup", { error: error.message });
      throw error;
    }
  }

  async runTopUpAutomation(playerId, redimensionCode, requestId) {
    if (this.runningJobs.has(requestId)) {
      throw new Error("Job already running with this request ID");
    }

    const packageName = this.getPackageFromCode(redimensionCode);
    const startTime = new Date();
    let page = null;

    // Initialize job info
    const jobInfo = {
      requestId,
      playerId,
      redimensionCode,
      packageName,
      startTime,
      status: "running",
      page: null,
    };

    this.runningJobs.set(requestId, jobInfo);

    try {
      // Create and configure page
      page = await this.createPage();
      jobInfo.page = page;

      // Navigate to shop
      await page.goto("https://shop.garena.my/?app=100067&channel=202953", {
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      // Handle any reCAPTCHA
      if (await this.handleRecaptcha(page)) {
        await page.waitForTimeout(2000); // Wait for verification
      }

      // Enter player ID
      await page.waitForSelector(
        'input[placeholder="Please enter player ID here"]'
      );
      const inputField = await page.$(
        'input[placeholder="Please enter player ID here"]'
      );
      await inputField.click();
      await inputField.type(playerId, { delay: 100 });
      await page.click('button[type="submit"]');

      // Wait for profile load
      await page.waitForSelector(".line-clamp-2.text-sm\\/none.font-bold");
      const username = await page.$eval(
        ".line-clamp-2.text-sm\\/none.font-bold",
        (el) => el.textContent
      );

      // Navigate to package selection
      await page.click(
        "button.inline-flex.items-center.justify-center.gap-1\\.5.rounded-md.border.py-1.text-center.leading-none.transition-colors.border-primary-red.bg-primary-red.text-white.hover\\:bg-primary-red-hover.hover\\:border-primary-red-hover.px-5.text-base.font-bold.h-11.w-full"
      );
      await page.waitForNavigation();

      // Select package
      await page.waitForSelector(".payment-denom-button");
      const packageButton = await page.evaluateHandle((pkgName) => {
        const buttons = document.querySelectorAll(".payment-denom-button");
        for (const button of buttons) {
          if (button.textContent.includes(pkgName)) return button;
        }
      }, packageName);

      if (!packageButton) {
        throw new Error(`Package ${packageName} not found`);
      }

      await packageButton.click();
      await page.waitForNavigation();

      // Handle voucher input
      await page.waitForSelector("#VOUCHER_panel");
      await page.click('button[data-target="#VOUCHER_panel"]');

      // Select payment method based on code type
      const codeType = redimensionCode.split("-")[0];
      const paymentId = codeType === "BDMB" ? "#pc_div_659" : "#pc_div_670";
      await page.click(paymentId);

      // Enter voucher code
      const voucherInput = await page.$(
        "input.form-control.text-center.unipin-voucher-textbox.profile-reload-serial1.autotab-serial"
      );
      await voucherInput.type(redimensionCode, { delay: 50 });
      await page.click('input[type="submit"][value="Confirm"]');

      // Wait for result and check for errors
      await page.waitForNavigation();
      const errorElement = await page.$(".title-case-0");
      if (errorElement) {
        const error = await page.evaluate((el) => el.textContent, errorElement);
        throw new Error(`Transaction failed: ${error}`);
      }

      // Success case
      const endTime = new Date();
      jobInfo.status = "completed";
      jobInfo.endTime = endTime;
      jobInfo.result = {
        success: true,
        message: "Top-up completed successfully",
        username,
        packageName,
        playerId,
        duration: endTime - startTime,
      };

      return jobInfo.result;
    } catch (error) {
      jobInfo.status = "failed";
      jobInfo.endTime = new Date();
      jobInfo.error = error.message;
      throw error;
    } finally {
      if (page) await page.close();
      this.cleanupJob(requestId);
    }
  }

  setSocketIO(io) {
    this.io = io;
    LogService.log("info", "Socket.IO instance set for AutomationService");
  }

  emitJobUpdate(eventType, jobData) {
    if (this.io) {
      this.io.to("automation").emit("job-update", {
        type: eventType,
        job: jobData,
        timestamp: new Date().toISOString(),
      });

      const runningJobs = this.getRunningJobsForClient();
      this.io.to("automation").emit("running-jobs", runningJobs);
    }
  }

  getRunningJobsForClient() {
    return Array.from(this.runningJobs.values())
      .filter((job) => job.status === "running" || job.status === "pending")
      .map((job) => ({
        jobId: job.requestId,
        playerId: job.playerId,
        packageName: job.packageName,
        status: job.status,
        startTime: job.startTime,
        endTime: job.endTime,
        duration: job.endTime
          ? job.endTime - job.startTime
          : Date.now() - job.startTime,
      }));
  }

  async getJobStatus(requestId) {
    const job = this.runningJobs.get(requestId);
    return job
      ? {
          status: job.status,
          playerId: job.playerId,
          requestId: job.requestId,
          startTime: job.startTime,
          endTime: job.endTime,
        }
      : null;
  }

  isJobCancelled(requestId) {
    const job = this.runningJobs.get(requestId);
    return job && job.status === "cancelled";
  }

  checkCancellation(requestId) {
    if (this.isJobCancelled(requestId)) {
      throw new Error("Job cancelled");
    }
  }

  async cancelJob(requestId) {
    const job = this.runningJobs.get(requestId);
    if (!job) {
      throw new Error("Job not found");
    }

    job.status = "cancelled";
    job.endTime = new Date();

    if (job.page) {
      await job.page.close().catch((error) => {
        LogService.log("warning", "Failed to close page during cancellation", {
          error,
        });
      });
    }

    this.emitJobUpdate("cancelled", job);
    return { success: true, message: "Job cancelled successfully" };
  }

  async getStatus() {
    return {
      isRunning: this.isRunning,
      activeJobs: this.runningJobs.size,
      browserActive: this.browser !== null,
    };
  }

  cleanupCompletedJobs() {
    const now = Date.now();
    for (const [requestId, job] of this.runningJobs.entries()) {
      if (job.status !== "running" && job.status !== "pending") {
        if (now - job.endTime.getTime() > 300000) {
          // 5 minutes
          this.runningJobs.delete(requestId);
        }
      }
    }
  }

  async clearAllData() {
    await this.cleanup();
    return { success: true, message: "All automation data cleared" };
  }
}

module.exports = AutomationService;
