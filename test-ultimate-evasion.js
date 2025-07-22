const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const ProxyChain = require("proxy-chain");

// Configure stealth plugin with maximum evasion
const stealthPlugin = StealthPlugin();
stealthPlugin.enabledEvasions.delete("chrome.runtime");
stealthPlugin.enabledEvasions.delete("iframe.contentWindow");
stealthPlugin.enabledEvasions.delete("media.codecs");
puppeteer.use(stealthPlugin);

async function testUltimateEvasion() {
  console.log("🚀 TESTING ULTIMATE BEHAVIORAL EVASION SYSTEM");
  console.log("=".repeat(60));
  console.log("Target: Advanced behavioral analysis bypass");
  console.log("IP Detection: Network reputation spoofing");
  console.log("Behavior: Human-like session establishment");
  console.log("");

  let browser;
  let proxyUrl;

  try {
    // Create proxy tunnel with additional headers
    const originalProxy = "socks5://BK:BK@59.153.18.230:1052";
    proxyUrl = await ProxyChain.anonymizeProxy(originalProxy);
    console.log(`✅ Proxy tunnel created: ${proxyUrl}`);

    // Launch browser with EXTREME stealth
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        `--proxy-server=${proxyUrl}`,
        // BEHAVIORAL EVASION ARGUMENTS
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--single-process",
        "--disable-extensions",
        "--disable-plugins",
        "--disable-images",
        "--disable-javascript-harmony-shipping",
        "--disable-background-timer-throttling",
        "--disable-backgrounding-occluded-windows",
        "--disable-renderer-backgrounding",
        "--disable-field-trial-config",
        "--disable-back-forward-cache",
        "--disable-backgrounding-occluded-windows",
        "--disable-features=TranslateUI,BlinkGenPropertyTrees",
        "--disable-ipc-flooding-protection",
        "--no-first-run",
        "--no-zygote",
        "--disable-blink-features=AutomationControlled",
        "--exclude-switches=enable-automation",
        "--disable-component-extensions-with-background-pages",
        "--disable-default-apps",
        "--disable-logging",
        "--disable-dev-shm-usage",
        "--memory-pressure-off",
        "--max_old_space_size=4096",
        // ADVANCED DETECTION EVASION
        "--disable-client-side-phishing-detection",
        "--disable-sync",
        "--disable-background-networking",
        "--disable-features=VizDisplayCompositor",
        "--disable-features=AudioServiceOutOfProcess",
        "--disable-domain-reliability",
        "--no-report-upload",
        "--disable-breakpad",
        "--disable-component-update",
        "--disable-crash-reporter",
        "--metrics-recording-only",
        "--safebrowsing-disable-auto-update",
        "--enable-automation=false",
        "--password-store=basic",
        "--use-mock-keychain",
        "--disable-session-crashed-bubble",
        "--disable-hang-monitor",
        "--disable-prompt-on-repost",
        "--disable-web-security",
        "--disable-features=WebRtcHideLocalIpsWithMdns",
        "--force-webrtc-ip-handling-policy=disable_non_proxied_udp",
        // FINGERPRINT CONFUSION
        "--window-size=1366,768", // Common resolution change
        "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "--lang=en-US",
        "--disable-accelerated-2d-canvas",
        "--disable-accelerated-jpeg-decoding",
        "--disable-accelerated-mjpeg-decode",
        "--disable-app-list-dismiss-on-blur",
        "--disable-accelerated-video-decode",
      ],
      defaultViewport: { width: 1366, height: 768 }, // Different resolution
      timeout: 180000,
      ignoreDefaultArgs: [
        "--enable-automation",
        "--enable-blink-features=AutomationControlled",
        "--disable-extensions",
        "--disable-default-apps",
        "--disable-component-extensions-with-background-pages",
      ],
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();

    // Set Windows user agent (change from Linux)
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
    );

    // Set Windows viewport
    await page.setViewport({
      width: 1366,
      height: 768,
      deviceScaleFactor: 1,
      hasTouch: false,
      isLandscape: true,
      isMobile: false,
    });

    // Set realistic Windows headers
    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "Accept-Encoding": "gzip, deflate, br",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-User": "?1",
      "Sec-Fetch-Dest": "document",
      "Sec-Ch-Ua":
        '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
      "Sec-Ch-Ua-Mobile": "?0",
      "Sec-Ch-Ua-Platform": '"Windows"', // Changed back to Windows
      "Upgrade-Insecure-Requests": "1",
      "X-Forwarded-For": "192.168.1.100",
    });

    // EXTREME BEHAVIORAL EVASION
    await page.evaluateOnNewDocument(() => {
      // ULTIMATE STEALTH - BEHAVIOR-BASED EVASION

      // Complete webdriver removal (multiple layers)
      delete Object.getPrototypeOf(navigator).webdriver;
      delete navigator.__proto__.webdriver;
      delete navigator.webdriver;

      Object.defineProperty(navigator, "webdriver", {
        get: () => undefined,
        enumerable: false,
        configurable: false,
      });

      // Remove ALL automation traces
      delete window.__puppeteer_evaluation_script__;
      delete window.document.$cdc_asdjflasutopfhvcZLmcfl_;
      delete window.__playwright;
      delete window.__selenium__;
      delete window.callPhantom;
      delete window._phantom;
      delete window.__nightmare;
      delete window.Buffer;
      delete window.emit;
      delete window.spawn;

      // Windows environment simulation
      Object.defineProperty(navigator, "platform", {
        get: () => "Win32",
      });

      Object.defineProperty(navigator, "userAgent", {
        get: () =>
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      });

      Object.defineProperty(navigator, "appVersion", {
        get: () =>
          "5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      });

      // Windows-specific properties
      Object.defineProperty(navigator, "oscpu", {
        get: () => "Windows NT 10.0; Win64; x64",
      });

      // Realistic Windows plugins
      Object.defineProperty(navigator, "plugins", {
        get: () => ({
          length: 5,
          0: {
            name: "PDF Viewer",
            description: "Portable Document Format",
            filename: "internal-pdf-viewer",
          },
          1: {
            name: "Chrome PDF Viewer",
            description: "",
            filename: "mhjfbmdgcfjbbpaeojofohoefgiehjai",
          },
          2: {
            name: "Chromium PDF Viewer",
            description: "",
            filename: "mhjfbmdgcfjbbpaeojofohoefgiehjai",
          },
          3: {
            name: "Microsoft Edge PDF Viewer",
            description: "",
            filename: "pdf",
          },
          4: {
            name: "WebKit built-in PDF",
            description: "",
            filename: "internal-pdf-viewer",
          },
          refresh: () => {},
          namedItem: (name) => null,
          item: (index) => this[index] || null,
        }),
      });

      // Windows-specific mimeTypes
      Object.defineProperty(navigator, "mimeTypes", {
        get: () => ({
          length: 4,
          0: {
            type: "application/pdf",
            suffixes: "pdf",
            description: "Portable Document Format",
          },
          1: {
            type: "text/pdf",
            suffixes: "pdf",
            description: "Portable Document Format",
          },
          2: {
            type: "application/x-google-chrome-pdf",
            suffixes: "pdf",
            description: "Portable Document Format",
          },
          3: {
            type: "application/x-chromium-pdf",
            suffixes: "pdf",
            description: "Portable Document Format",
          },
        }),
      });

      // Language settings
      Object.defineProperty(navigator, "languages", {
        get: () => ["en-US", "en"],
      });

      Object.defineProperty(navigator, "language", {
        get: () => "en-US",
      });

      // Hardware fingerprinting (realistic desktop)
      Object.defineProperty(navigator, "hardwareConcurrency", {
        get: () => 8, // Higher core count for Windows
      });

      Object.defineProperty(navigator, "deviceMemory", {
        get: () => 8,
      });

      // Windows screen properties
      Object.defineProperty(screen, "width", {
        get: () => 1920,
      });

      Object.defineProperty(screen, "height", {
        get: () => 1080,
      });

      Object.defineProperty(screen, "availWidth", {
        get: () => 1920,
      });

      Object.defineProperty(screen, "availHeight", {
        get: () => 1040, // Windows taskbar
      });

      Object.defineProperty(screen, "colorDepth", {
        get: () => 24,
      });

      Object.defineProperty(screen, "pixelDepth", {
        get: () => 24,
      });

      // Chrome runtime simulation
      window.chrome = {
        runtime: {
          onConnect: undefined,
          onMessage: undefined,
        },
        loadTimes: function () {
          return {
            requestTime: performance.now() / 1000,
            startLoadTime: performance.now() / 1000,
            commitLoadTime: performance.now() / 1000,
            finishDocumentLoadTime: performance.now() / 1000,
            finishLoadTime: performance.now() / 1000,
            firstPaintTime: performance.now() / 1000,
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
      };

      // Advanced permission spoofing
      if (navigator.permissions) {
        const originalQuery = navigator.permissions.query;
        navigator.permissions.query = function (parameters) {
          return Promise.resolve({ state: "default" });
        };
      }

      // Connection simulation
      Object.defineProperty(navigator, "connection", {
        get: () => ({
          effectiveType: "4g",
          downlink: 10,
          rtt: 50,
          saveData: false,
        }),
      });

      // Remove touch capability
      Object.defineProperty(navigator, "maxTouchPoints", {
        get: () => 0,
      });

      // WebGL fingerprinting (Windows Intel)
      const getParameter = WebGLRenderingContext.prototype.getParameter;
      WebGLRenderingContext.prototype.getParameter = function (parameter) {
        if (parameter === 37445) return "Intel Inc.";
        if (parameter === 37446) return "Intel(R) HD Graphics 630";
        return getParameter.call(this, parameter);
      };

      // Advanced canvas fingerprinting
      const getContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, attributes) {
        const context = getContext.call(this, type, attributes);

        if (type === "2d") {
          const originalGetImageData = context.getImageData;
          context.getImageData = function (...args) {
            const data = originalGetImageData.apply(this, args);
            // Windows-specific canvas noise
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

      // Advanced timing obfuscation
      const originalPerformanceNow = performance.now;
      performance.now = function () {
        return originalPerformanceNow.call(this) + Math.random() * 2;
      };

      // Mouse event enhancement
      const originalCreateEvent = document.createEvent;
      document.createEvent = function (type) {
        const event = originalCreateEvent.call(this, type);
        if (type === "MouseEvent" || type === "MouseEvents") {
          Object.defineProperty(event, "isTrusted", { get: () => true });
        }
        return event;
      };

      // Hide function toString signatures
      const originalToString = Function.prototype.toString;
      Function.prototype.toString = function () {
        if (this === navigator.permissions.query) {
          return "function query() { [native code] }";
        }
        if (this === HTMLCanvasElement.prototype.getContext) {
          return "function getContext() { [native code] }";
        }
        return originalToString.apply(this, arguments);
      };

      // Advanced timezone spoofing
      Object.defineProperty(Intl.DateTimeFormat.prototype, "resolvedOptions", {
        value: function () {
          return {
            locale: "en-US",
            calendar: "gregory",
            numberingSystem: "latn",
            timeZone: "Asia/Kuala_Lumpur",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          };
        },
      });

      console.log("🔒 EXTREME BEHAVIORAL EVASION ACTIVATED");
    });

    console.log("🎭 Establishing realistic browsing session...");

    // PHASE 1: Establish browsing history
    console.log("📚 Phase 1: Building browsing history...");

    // Visit Google first
    await page.goto("https://www.google.com", {
      waitUntil: "networkidle0",
      timeout: 30000,
    });
    await new Promise((resolve) =>
      setTimeout(resolve, 2000 + Math.random() * 3000)
    );

    // Simulate search behavior
    const searchBox = await page.$('input[name="q"]');
    if (searchBox) {
      await page.click('input[name="q"]');
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Type search query with human delays
      const query = "free fire diamonds top up";
      for (let char of query) {
        await page.keyboard.type(char);
        await new Promise((resolve) =>
          setTimeout(resolve, 100 + Math.random() * 200)
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
      await page.keyboard.press("Enter");
      await page.waitForNavigation({ waitUntil: "networkidle0" });
      await new Promise((resolve) =>
        setTimeout(resolve, 3000 + Math.random() * 2000)
      );
    }

    // PHASE 2: Visit related gaming sites
    console.log("🎮 Phase 2: Gaming site browsing pattern...");

    const gamingSites = [
      "https://www.gamebrott.com",
      "https://www.duniagames.co.id",
    ];

    for (const site of gamingSites) {
      try {
        await page.goto(site, {
          waitUntil: "domcontentloaded",
          timeout: 15000,
        });
        await new Promise((resolve) =>
          setTimeout(resolve, 2000 + Math.random() * 3000)
        );

        // Simulate scrolling
        await page.evaluate(() => {
          window.scrollBy(0, Math.random() * 500 + 200);
        });
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 + Math.random() * 2000)
        );
      } catch (error) {
        console.log(`   ⚠️ ${site} visit failed, continuing...`);
      }
    }

    // PHASE 3: Navigate to target with realistic referrer
    console.log(
      "🎯 Phase 3: Accessing Garena Shop with established session..."
    );

    await page.goto("https://shop.garena.my/?app=100067&channel=202953", {
      waitUntil: "networkidle0",
      timeout: 45000,
    });

    // Wait and analyze
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Check for blocking
    const pageContent = await page.evaluate(() => {
      return {
        title: document.title,
        bodyText: document.body.innerText.substring(0, 500),
        url: window.location.href,
        blocked:
          document.body.innerText.includes("Access blocked") ||
          document.body.innerText.includes("unusual activity") ||
          document.body.innerText.includes("bot activity"),
        hasPlayerInput: !!document.querySelector(
          'input[placeholder*="player"]'
        ),
      };
    });

    console.log("\n📊 Analysis Results:");
    console.log("   Title:", pageContent.title);
    console.log("   URL:", pageContent.url);
    console.log("   Blocked:", pageContent.blocked ? "❌ YES" : "✅ NO");
    console.log(
      "   Player Input:",
      pageContent.hasPlayerInput ? "✅ Found" : "❌ Not found"
    );

    if (pageContent.blocked) {
      console.log("\n🔍 Block Detection Details:");
      console.log("   Message:", pageContent.bodyText);

      // Advanced bypass attempt
      console.log("\n🛡️ Attempting advanced bypass...");

      // Clear all storage
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();

        // Clear cookies
        document.cookie.split(";").forEach((cookie) => {
          const eqPos = cookie.indexOf("=");
          const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
          document.cookie =
            name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
        });
      });

      // Try different approach
      await page.setExtraHTTPHeaders({
        "X-Forwarded-For": "192.168.1.200",
        "X-Real-IP": "192.168.1.200",
        "CF-Connecting-IP": "192.168.1.200",
      });

      // Reload with clean state
      await page.reload({ waitUntil: "networkidle0" });
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const retryCheck = await page.evaluate(() => {
        return {
          blocked:
            document.body.innerText.includes("Access blocked") ||
            document.body.innerText.includes("unusual activity"),
          hasPlayerInput: !!document.querySelector(
            'input[placeholder*="player"]'
          ),
        };
      });

      console.log(
        "   Retry Result:",
        retryCheck.blocked ? "❌ Still blocked" : "✅ Bypass successful"
      );
    } else {
      console.log("\n🎉 SUCCESS: Access granted with behavioral evasion!");
    }

    // Take final screenshot
    const screenshotPath = `screenshots/ultimate-evasion-${Date.now()}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 Screenshot saved: ${screenshotPath}`);
  } catch (error) {
    console.error("❌ Ultimate evasion test failed:", error.message);

    if (browser) {
      try {
        const pages = await browser.pages();
        if (pages.length > 0) {
          const errorPath = `screenshots/error-ultimate-${Date.now()}.png`;
          await pages[pages.length - 1].screenshot({ path: errorPath });
          console.log(`📸 Error screenshot: ${errorPath}`);
        }
      } catch (e) {
        console.log("Failed to capture error screenshot");
      }
    }
  } finally {
    if (browser) {
      await browser.close();
      console.log("🔒 Browser closed");
    }

    if (proxyUrl) {
      try {
        await ProxyChain.closeAnonymizedProxy(proxyUrl, true);
        console.log("🔗 Proxy chain closed");
      } catch (e) {
        console.log("Warning: Failed to close proxy chain");
      }
    }
  }
}

// Run the ultimate evasion test
testUltimateEvasion().catch(console.error);
