const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const ProxyChain = require("proxy-chain");
const LogService = require("./LogService");
const DatabaseService = require("./DatabaseService");

// Use stealth plugin
puppeteer.use(StealthPlugin());

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
        // SOCKS5 proxy configuration using proxy-chain
        const originalProxy = "socks5://BK:BK@59.153.18.230:1052";

        // Create HTTP proxy server that forwards to SOCKS5
        this.proxyUrl = await ProxyChain.anonymizeProxy(originalProxy);

        LogService.log(
          "info",
          `Created HTTP proxy tunnel: ${this.proxyUrl} -> ${originalProxy}`
        );

        this.browser = await puppeteer.launch({
          headless: process.env.HEADLESS !== "false", // Default to headless
          args: [
            `--proxy-server=${this.proxyUrl}`,
            // ULTIMATE Stealth args - Maximum Anti-Detection
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--no-first-run",
            "--no-zygote",
            "--disable-gpu",
            "--disable-web-security",
            "--disable-features=VizDisplayCompositor",
            "--disable-background-timer-throttling",
            "--disable-backgrounding-occluded-windows",
            "--disable-renderer-backgrounding",
            "--disable-hang-monitor",
            "--disable-popup-blocking",
            "--disable-prompt-on-repost",
            "--disable-sync",
            "--disable-translate",
            "--disable-ipc-flooding-protection",
            "--window-size=1920,1080",
            // CRITICAL stealth args for reCAPTCHA bypass
            "--disable-blink-features=AutomationControlled",
            "--exclude-switches=enable-automation",
            "--disable-component-extensions-with-background-pages",
            "--disable-features=TranslateUI",
            "--disable-features=BlinkGenPropertyTrees",
            "--disable-logging",
            "--disable-plugins-discovery",
            "--no-default-browser-check",
            "--no-pings",
            "--no-service-autorun",
            "--password-store=basic",
            "--use-mock-keychain",
            "--force-color-profile=srgb",
            "--memory-pressure-off",
            "--max_old_space_size=4096",
            // ADVANCED Anti-reCAPTCHA measures
            "--disable-extensions-except",
            "--disable-plugins",
            "--disable-default-apps",
            "--enable-font-antialiasing",
            "--enable-gpu-rasterization",
            "--enable-oop-rasterization",
            "--force-device-scale-factor=1",
            "--high-dpi-support=1",
            "--ignore-certificate-errors",
            "--ignore-ssl-errors",
            "--allow-running-insecure-content",
            "--disable-background-networking",
            "--disable-client-side-phishing-detection",
            "--disable-domain-reliability",
            "--disable-features=AudioServiceOutOfProcess",
            "--disable-background-mode",
            // ULTIMATE reCAPTCHA prevention
            "--disable-features=VizDisplayCompositor,VizHitTestSurfaceLayer",
            "--disable-features=UserActivationSameOriginVisibility",
            "--disable-features=AutofillShowTypePredictions",
            "--disable-features=CSSContainerQueries",
            "--disable-component-update",
            "--disable-domain-reliability",
            "--disable-sync",
            "--disable-client-side-phishing-detection",
            "--disable-default-apps",
            "--disable-component-extensions-with-background-pages",
            "--disable-background-networking",
            "--disable-breakpad",
            "--disable-crash-reporter",
            "--disable-dev-shm-usage",
            "--disable-extensions",
            "--disable-features=site-per-process",
            "--disable-hang-monitor",
            "--disable-ipc-flooding-protection",
            "--disable-popup-blocking",
            "--disable-prompt-on-repost",
            "--disable-renderer-backgrounding",
            "--disable-sync",
            "--disable-translate",
            "--metrics-recording-only",
            "--no-report-upload",
            "--safebrowsing-disable-auto-update",
            "--enable-automation=false",
            "--password-store=basic",
            "--use-mock-keychain",
            "--hide-scrollbars",
            "--mute-audio",
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-accelerated-2d-canvas",
            "--no-first-run",
            "--no-zygote",
            "--disable-gpu",
            "--log-level=3",
            "--disable-dev-tools",
            "--disable-device-discovery-notifications",
          ],
          defaultViewport: { width: 1920, height: 1080 },
          timeout: 60000,
          ignoreDefaultArgs: [
            "--enable-automation",
            "--enable-blink-features=AutomationControlled",
          ],
          ignoreHTTPSErrors: true,
        });

        LogService.log("info", "Browser initialized with proxy-chain");

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

    // Clean up proxy-chain if it exists
    if (this.proxyUrl) {
      try {
        await ProxyChain.closeAnonymizedProxy(this.proxyUrl, true);
        LogService.log("info", "Proxy chain closed");
        this.proxyUrl = null;
      } catch (error) {
        LogService.log("warning", "Failed to close proxy chain", {
          error: error.message,
        });
      }
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

      // Set MOST REALISTIC user agent to mimic actual residential user browser
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
      );

      // Set realistic viewport
      await page.setViewport({
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1,
        hasTouch: false,
        isLandscape: true,
        isMobile: false,
      });

      // Add MOST REALISTIC headers to mimic actual residential user
      await page.setExtraHTTPHeaders({
        "Accept-Language": "en-US,en;q=0.9,ms;q=0.8,zh;q=0.7",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Cache-Control": "max-age=0",
        Pragma: "no-cache",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-User": "?1",
        "Sec-Fetch-Dest": "document",
        "Sec-Ch-Ua":
          '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": '"Windows"',
        "Sec-Ch-Ua-Platform-Version": '"15.0.0"',
        "Upgrade-Insecure-Requests": "1",
        DNT: "1",
        "X-Forwarded-For": "192.168.1.100", // Local IP simulation
        "X-Real-IP": "203.115.77.164", // Malaysian IP simulation
      });

      // ULTIMATE Anti-Detection - Maximum Stealth Configuration
      await page.evaluateOnNewDocument(() => {
        // COMPLETELY REMOVE ALL AUTOMATION TRACES
        Object.defineProperty(navigator, "webdriver", {
          get: () => undefined,
        });

        // Remove all automation-related properties
        delete navigator.__proto__.webdriver;
        delete navigator.webdriver;

        // Override webdriver property at prototype level
        const originalDescriptor = Object.getOwnPropertyDescriptor(
          Navigator.prototype,
          "webdriver"
        );
        if (originalDescriptor) {
          Object.defineProperty(Navigator.prototype, "webdriver", {
            get: () => undefined,
            enumerable: false,
            configurable: true,
          });
        }

        // Advanced plugin spoofing with realistic data
        Object.defineProperty(navigator, "plugins", {
          get: () => ({
            length: 5,
            0: {
              name: "Chrome PDF Plugin",
              description: "Portable Document Format",
              filename: "internal-pdf-viewer",
              length: 1,
            },
            1: {
              name: "Chrome PDF Viewer",
              description: "",
              filename: "mhjfbmdgcfjbbpaeojofohoefgiehjai",
              length: 1,
            },
            2: {
              name: "Native Client",
              description: "",
              filename: "internal-nacl-plugin",
              length: 2,
            },
            3: {
              name: "WebKit built-in PDF",
              description: "Portable Document Format",
              filename: "WebKit built-in PDF",
              length: 1,
            },
            4: {
              name: "Microsoft Edge PDF Viewer",
              description: "Portable Document Format",
              filename: "edge-pdf-viewer",
              length: 1,
            },
            refresh: () => {},
            namedItem: (name) => null,
            item: (index) => null,
          }),
          enumerable: true,
          configurable: true,
        });

        // Advanced mimeTypes spoofing
        Object.defineProperty(navigator, "mimeTypes", {
          get: () => ({
            length: 4,
            0: {
              type: "application/pdf",
              suffixes: "pdf",
              description: "Portable Document Format",
              enabledPlugin: navigator.plugins[0],
            },
            1: {
              type: "application/x-google-chrome-pdf",
              suffixes: "pdf",
              description: "Portable Document Format",
              enabledPlugin: navigator.plugins[1],
            },
            2: {
              type: "application/x-nacl",
              suffixes: "",
              description: "Native Client Executable",
              enabledPlugin: navigator.plugins[2],
            },
            3: {
              type: "application/x-pnacl",
              suffixes: "",
              description: "Portable Native Client Executable",
              enabledPlugin: navigator.plugins[2],
            },
          }),
          enumerable: true,
          configurable: true,
        });

        // Enhanced language simulation
        Object.defineProperty(navigator, "languages", {
          get: () => ["en-US", "en", "ms-MY", "zh-CN"],
        });

        // Complete Chrome runtime simulation
        window.chrome = {
          runtime: {
            onConnect: undefined,
            onMessage: undefined,
            connect: () => ({
              postMessage: () => {},
              onMessage: { addListener: () => {} },
            }),
            sendMessage: () => {},
            id: "chrome-extension://invalid",
            getManifest: () => ({}),
            onInstalled: { addListener: () => {} },
          },
          loadTimes: function () {
            return {
              requestTime: performance.now() / 1000,
              startLoadTime: performance.now() / 1000,
              commitLoadTime: performance.now() / 1000,
              finishDocumentLoadTime: performance.now() / 1000,
              finishLoadTime: performance.now() / 1000,
              firstPaintTime: performance.now() / 1000,
              firstPaintAfterLoadTime: 0,
              navigationType: "Other",
              wasFetchedViaSpdy: false,
              wasNpnNegotiated: false,
              npnNegotiatedProtocol: "unknown",
              wasAlternateProtocolAvailable: false,
              connectionInfo: "http/1.1",
            };
          },
          csi: function () {
            return {
              startE: performance.now(),
              onloadT: performance.now(),
              pageT: performance.now(),
              tran: 15,
            };
          },
          app: {
            isInstalled: false,
            InstallState: {
              DISABLED: "disabled",
              INSTALLED: "installed",
              NOT_INSTALLED: "not_installed",
            },
            RunningState: {
              CANNOT_RUN: "cannot_run",
              READY_TO_RUN: "ready_to_run",
              RUNNING: "running",
            },
            getDetails: () => ({}),
            getIsInstalled: () => false,
          },
        };

        // Enhanced permissions with realistic responses
        const originalQuery = window.navigator.permissions?.query;
        if (originalQuery) {
          window.navigator.permissions.query = (parameters) => {
            const responses = {
              notifications: { state: "default" },
              camera: { state: "prompt" },
              microphone: { state: "prompt" },
              geolocation: { state: "prompt" },
              "persistent-storage": { state: "prompt" },
            };
            return Promise.resolve(
              responses[parameters.name] || { state: "prompt" }
            );
          };
        }

        // Advanced screen simulation with realistic variance
        const baseWidth = 1920;
        const baseHeight = 1080;
        const variance = Math.floor(Math.random() * 10) - 5;

        Object.defineProperty(screen, "width", {
          get: () => baseWidth + variance,
        });

        Object.defineProperty(screen, "height", {
          get: () => baseHeight + variance,
        });

        Object.defineProperty(screen, "availWidth", {
          get: () => baseWidth + variance,
        });

        Object.defineProperty(screen, "availHeight", {
          get: () => baseHeight - 40 + variance, // Account for taskbar
        });

        Object.defineProperty(screen, "colorDepth", {
          get: () => 24,
        });

        Object.defineProperty(screen, "pixelDepth", {
          get: () => 24,
        });

        // Advanced connection simulation
        Object.defineProperty(navigator, "connection", {
          get: () => ({
            effectiveType: "4g",
            downlink: 8.5 + Math.random() * 3,
            rtt: 45 + Math.random() * 15,
            saveData: false,
            type: "wifi",
          }),
        });

        // Hardware simulation
        Object.defineProperty(navigator, "hardwareConcurrency", {
          get: () => 8,
        });

        Object.defineProperty(navigator, "deviceMemory", {
          get: () => 8,
        });

        // Advanced battery simulation
        if (navigator.getBattery) {
          navigator.getBattery = () =>
            Promise.resolve({
              level: 0.75 + Math.random() * 0.24,
              charging: Math.random() > 0.3,
              chargingTime:
                Math.random() > 0.5 ? Infinity : 3600 + Math.random() * 7200,
              dischargingTime: 7200 + Math.random() * 14400,
              addEventListener: () => {},
              removeEventListener: () => {},
            });
        }

        // Advanced timezone simulation
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        Object.defineProperty(
          Intl.DateTimeFormat.prototype,
          "resolvedOptions",
          {
            value: function () {
              return {
                locale: "en-US",
                calendar: "gregory",
                numberingSystem: "latn",
                timeZone: timezone,
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              };
            },
          }
        );

        // Realistic canvas fingerprinting
        const getContext = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (type, attributes) {
          const context = getContext.call(this, type, attributes);
          if (type === "2d") {
            const imageData = context.getImageData;
            context.getImageData = function (...args) {
              const data = imageData.apply(this, args);
              // Add slight noise to avoid fingerprinting
              for (let i = 0; i < data.data.length; i += 4) {
                data.data[i] += Math.floor(Math.random() * 3) - 1;
                data.data[i + 1] += Math.floor(Math.random() * 3) - 1;
                data.data[i + 2] += Math.floor(Math.random() * 3) - 1;
              }
              return data;
            };
          }
          return context;
        };

        // Remove automation indicators completely
        delete Object.getPrototypeOf(navigator).webdriver;

        // Advanced toString override to hide all modifications
        const originalToString = Function.prototype.toString;
        Function.prototype.toString = function () {
          if (this === navigator.permissions.query) {
            return "function query() { [native code] }";
          }
          if (this === HTMLCanvasElement.prototype.getContext) {
            return "function getContext() { [native code] }";
          }
          if (this === window.chrome.loadTimes) {
            return "function loadTimes() { [native code] }";
          }
          if (this === window.chrome.csi) {
            return "function csi() { [native code] }";
          }
          return originalToString.apply(this, arguments);
        };

        // Advanced WebGL fingerprinting protection
        const getParameter = WebGLRenderingContext.prototype.getParameter;
        WebGLRenderingContext.prototype.getParameter = function (parameter) {
          // Spoof common WebGL parameters to avoid fingerprinting
          if (parameter === 37445) {
            // UNMASKED_VENDOR_WEBGL
            return "Intel Inc.";
          }
          if (parameter === 37446) {
            // UNMASKED_RENDERER_WEBGL
            return "Intel(R) UHD Graphics 630";
          }
          return getParameter.call(this, parameter);
        };

        // Advanced AudioContext fingerprinting protection
        if (window.AudioContext) {
          const audioContext = AudioContext.prototype.createOscillator;
          AudioContext.prototype.createOscillator = function () {
            const oscillator = audioContext.call(this);
            const originalStart = oscillator.start;
            oscillator.start = function (when) {
              return originalStart.call(this, when + Math.random() * 0.0001);
            };
            return oscillator;
          };
        }

        // Hide automation traces in error stack traces
        Error.prepareStackTrace = function (error, stack) {
          return stack
            .map((frame) => {
              return frame
                .toString()
                .replace(/puppeteer|chrome-devtools|webdriver/gi, "browser");
            })
            .join("\n");
        };

        // Advanced mouse and keyboard event simulation
        const originalAddEventListener = EventTarget.prototype.addEventListener;
        EventTarget.prototype.addEventListener = function (
          type,
          listener,
          options
        ) {
          // Add realistic event timestamps and properties
          if (type === "mousemove" || type === "click" || type === "keydown") {
            const wrappedListener = function (event) {
              Object.defineProperty(event, "isTrusted", { get: () => true });
              return listener.call(this, event);
            };
            return originalAddEventListener.call(
              this,
              type,
              wrappedListener,
              options
            );
          }
          return originalAddEventListener.call(this, type, listener, options);
        };

        // Completely hide automation detection
        Object.defineProperty(window, "outerHeight", {
          get: () => window.innerHeight + Math.floor(Math.random() * 100) + 100,
        });

        Object.defineProperty(window, "outerWidth", {
          get: () => window.innerWidth + Math.floor(Math.random() * 100) + 100,
        });

        // Advanced stealth - prevent detection through timing attacks
        const originalPerformanceNow = performance.now;
        performance.now = function () {
          return originalPerformanceNow.call(this) + Math.random() * 0.1;
        };

        // Advanced Date simulation to prevent timing-based detection
        const originalDate = Date;
        Date = function (...args) {
          if (args.length === 0) {
            return new originalDate(originalDate.now() + Math.random() * 1000);
          }
          return new originalDate(...args);
        };
        Object.setPrototypeOf(Date, originalDate);
        Object.defineProperty(Date, "prototype", {
          value: originalDate.prototype,
        });

        console.log(
          "🔒 ULTIMATE STEALTH MODE ACTIVATED - ALL AUTOMATION TRACES REMOVED"
        );
      });

      await this.logMessage(requestId, "info", "Navigating to Garena Shop...");

      // Check cancellation before navigation
      await this.checkCancellation(requestId);

      // Mimic real user browsing behavior - visit a common site first (optional)
      await this.simulateRealUserBrowsing(page, requestId);

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

      // Add random mouse movements to appear human
      await this.simulateHumanBehavior(page);

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

      // Human-like typing with random delays
      const playerIdField = 'input[placeholder="Please enter player ID here"]';
      await page.click(playerIdField);
      await new Promise((resolve) =>
        setTimeout(resolve, 500 + Math.random() * 500)
      );

      // Clear field and type with human-like speed
      await page.keyboard.down("Control");
      await page.keyboard.press("KeyA");
      await page.keyboard.up("Control");
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Type each character with random delays
      for (let i = 0; i < playerId.length; i++) {
        await page.keyboard.type(playerId[i]);
        await new Promise((resolve) =>
          setTimeout(resolve, 100 + Math.random() * 200)
        );
      }

      await this.logMessage(requestId, "info", "Clicking Login button...");

      // Add random mouse movement before clicking
      await page.mouse.move(Math.random() * 100, Math.random() * 100);
      await new Promise((resolve) =>
        setTimeout(resolve, 300 + Math.random() * 300)
      );

      // Click the Login button
      await page.click('button[type="submit"]');

      // Random delay after clicking
      await new Promise((resolve) =>
        setTimeout(resolve, 1000 + Math.random() * 1000)
      );

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

  // Method to handle CAPTCHA/robot verification
  async handleCaptchaIfPresent(page, requestId) {
    try {
      // Wait a moment for any overlays to appear
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Check for various CAPTCHA/verification elements
      const captchaSelectors = [
        'iframe[src*="captcha"]',
        'iframe[src*="recaptcha"]',
        ".captcha",
        ".verification",
        '[data-cy="captcha"]',
        ".slider-verify",
        ".puzzle-verify",
        // Garena specific selectors
        ".nc_wrapper", // Alibaba CAPTCHA
        ".nc_scale", // Slider CAPTCHA
        "#nc_1_n1z", // Specific Garena CAPTCHA ID pattern
        'div[id*="nc_"]', // Any element with nc_ prefix
        // Generic verification selectors
        'div[style*="position: fixed"]', // Modal overlays
        ".modal-overlay",
        ".verification-modal",
      ];

      let captchaFound = false;
      let captchaType = null;
      let captchaElement = null;

      // Check for each type of CAPTCHA
      for (const selector of captchaSelectors) {
        try {
          const element = await page.$(selector);
          if (element) {
            const isVisible = await page.evaluate((el) => {
              const style = window.getComputedStyle(el);
              const rect = el.getBoundingClientRect();
              return (
                style.display !== "none" &&
                style.visibility !== "hidden" &&
                style.opacity !== "0" &&
                rect.width > 0 &&
                rect.height > 0
              );
            }, element);

            if (isVisible) {
              captchaFound = true;
              captchaType = selector;
              captchaElement = element;
              break;
            }
          }
        } catch (e) {
          continue;
        }
      }

      if (captchaFound) {
        await this.logMessage(
          requestId,
          "warning",
          `CAPTCHA detected: ${captchaType}. Attempting to solve...`
        );

        // Take screenshot of CAPTCHA
        const captchaScreenshotPath = `screenshots/captcha-${requestId}-${Date.now()}.png`;
        await page.screenshot({ path: captchaScreenshotPath, fullPage: true });
        await this.logMessage(
          requestId,
          "info",
          `CAPTCHA screenshot saved: ${captchaScreenshotPath}`
        );

        // Attempt to solve based on CAPTCHA type
        if (captchaType.includes("nc_") || captchaType.includes("slider")) {
          await this.solveSlideCaptcha(page, requestId, captchaElement);
        } else {
          // For other types, wait for manual intervention or retry
          await this.waitForCaptchaSolution(page, requestId);
        }
      } else {
        await this.logMessage(
          requestId,
          "info",
          "No CAPTCHA detected, proceeding..."
        );
      }
    } catch (error) {
      await this.logMessage(
        requestId,
        "warning",
        `CAPTCHA detection error: ${error.message}`
      );
      // Continue execution even if CAPTCHA detection fails
    }
  }

  // Method to solve slide CAPTCHA
  async solveSlideCaptcha(page, requestId, captchaElement) {
    try {
      await this.logMessage(
        requestId,
        "info",
        "Attempting to solve slide CAPTCHA..."
      );

      // Look for the slider button
      const sliderSelectors = [
        ".nc_iconfont.btn_slide",
        ".slider-button",
        ".slide-btn",
        '[class*="slide"]',
        '[class*="btn"]',
      ];

      let sliderButton = null;
      for (const selector of sliderSelectors) {
        try {
          const element = await page.$(selector);
          if (element) {
            const isVisible = await page.evaluate((el) => {
              const rect = el.getBoundingClientRect();
              return rect.width > 0 && rect.height > 0;
            }, element);

            if (isVisible) {
              sliderButton = element;
              break;
            }
          }
        } catch (e) {
          continue;
        }
      }

      if (sliderButton) {
        // Get slider track width
        const sliderTrack = (await page.$(".nc_scale")) || captchaElement;
        const trackBox = await sliderTrack.boundingBox();
        const buttonBox = await sliderButton.boundingBox();

        if (trackBox && buttonBox) {
          // Calculate slide distance (usually 80-90% of track width)
          const slideDistance = trackBox.width * 0.85;

          await this.logMessage(
            requestId,
            "info",
            `Sliding CAPTCHA: distance=${slideDistance}px`
          );

          // Perform human-like slide
          await page.mouse.move(
            buttonBox.x + buttonBox.width / 2,
            buttonBox.y + buttonBox.height / 2
          );
          await page.mouse.down();

          // Slide with human-like movement (not perfectly straight)
          const steps = 20;
          for (let i = 0; i <= steps; i++) {
            const progress = i / steps;
            const x = buttonBox.x + slideDistance * progress;
            const y =
              buttonBox.y +
              buttonBox.height / 2 +
              Math.sin(progress * Math.PI) * 2; // Add slight curve
            await page.mouse.move(x, y, { steps: 1 });
            await new Promise((resolve) =>
              setTimeout(resolve, 50 + Math.random() * 50)
            ); // Random delay
          }

          await page.mouse.up();

          // Wait for verification
          await new Promise((resolve) => setTimeout(resolve, 2000));

          // Check if CAPTCHA was solved
          const captchaStillPresent = (await page.$(captchaElement)) !== null;
          if (!captchaStillPresent) {
            await this.logMessage(
              requestId,
              "info",
              "✅ CAPTCHA solved successfully!"
            );
          } else {
            await this.logMessage(
              requestId,
              "warning",
              "CAPTCHA may not be fully solved, continuing..."
            );
          }
        }
      } else {
        await this.logMessage(requestId, "warning", "Slider button not found");
      }
    } catch (error) {
      await this.logMessage(
        requestId,
        "error",
        `Failed to solve slide CAPTCHA: ${error.message}`
      );
    }
  }

  // Method to wait for CAPTCHA solution (manual or automatic)
  async waitForCaptchaSolution(page, requestId) {
    await this.logMessage(
      requestId,
      "info",
      "Waiting for CAPTCHA to be solved (60 seconds timeout)..."
    );

    const maxWaitTime = 60000; // 60 seconds
    const checkInterval = 2000; // Check every 2 seconds
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      // Check cancellation
      await this.checkCancellation(requestId);

      // Check if CAPTCHA is gone
      const captchaElements = await page.$$(
        'iframe[src*="captcha"], .captcha, .verification, .nc_wrapper'
      );
      const visibleCaptcha = await Promise.all(
        captchaElements.map((el) =>
          page.evaluate((element) => {
            const style = window.getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            return (
              style.display !== "none" &&
              style.visibility !== "hidden" &&
              rect.width > 0 &&
              rect.height > 0
            );
          }, el)
        )
      );

      if (!visibleCaptcha.some((visible) => visible)) {
        await this.logMessage(
          requestId,
          "info",
          "✅ CAPTCHA appears to be solved!"
        );
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, checkInterval));
    }

    await this.logMessage(
      requestId,
      "warning",
      "CAPTCHA wait timeout reached, continuing with automation..."
    );
  }

  // Method to simulate human behavior
  async simulateHumanBehavior(page) {
    try {
      // Random mouse movements
      const viewport = await page.viewport();
      const x = Math.random() * viewport.width;
      const y = Math.random() * viewport.height;

      await page.mouse.move(x, y, { steps: 10 });
      await new Promise((resolve) =>
        setTimeout(resolve, 100 + Math.random() * 200)
      );

      // Random scroll
      await page.evaluate(() => {
        window.scrollBy(0, Math.random() * 100 - 50);
      });

      // Random wait
      await new Promise((resolve) =>
        setTimeout(resolve, 500 + Math.random() * 1000)
      );
    } catch (error) {
      // Ignore errors in human behavior simulation
    }
  }

  // Method to simulate real user browsing patterns
  async simulateRealUserBrowsing(page, requestId) {
    try {
      await this.logMessage(
        requestId,
        "info",
        "Simulating real user browsing pattern..."
      );

      // Set some realistic cookies and localStorage
      await page.evaluateOnNewDocument(() => {
        // Simulate some realistic localStorage entries
        localStorage.setItem(
          "timezone",
          Intl.DateTimeFormat().resolvedOptions().timeZone
        );
        localStorage.setItem("language", navigator.language);
        localStorage.setItem("visited", Date.now().toString());

        // Add some realistic sessionStorage
        sessionStorage.setItem("session_start", Date.now().toString());
        sessionStorage.setItem("user_agent", navigator.userAgent);
      });

      // Add realistic browsing history simulation
      await page.evaluate(() => {
        // Simulate mouse movements and clicks that happened "before"
        const events = ["mousemove", "click", "scroll", "keydown"];
        const event = events[Math.floor(Math.random() * events.length)];

        // Simulate that user has been browsing
        Object.defineProperty(document, "referrer", {
          get: () => "https://www.google.com/",
        });

        // Add focus event to make it look like user switched tabs
        window.dispatchEvent(new Event("focus"));
      });

      // Small delay to simulate natural browsing
      await new Promise((resolve) =>
        setTimeout(resolve, 1000 + Math.random() * 2000)
      );

      await this.logMessage(
        requestId,
        "info",
        "Real user simulation completed"
      );
    } catch (error) {
      await this.logMessage(
        requestId,
        "warning",
        `Browsing simulation error: ${error.message}`
      );
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
}

module.exports = new AutomationService();
