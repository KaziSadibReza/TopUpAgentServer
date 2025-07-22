const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const ProxyChain = require("proxy-chain");

// Use stealth plugin
puppeteer.use(StealthPlugin());

async function testMaximumStealth() {
  console.log("🚀 TESTING MAXIMUM ANTI-CAPTCHA STEALTH CONFIGURATION");
  console.log("=".repeat(60));

  let browser;
  let proxyUrl;

  try {
    // Create proxy tunnel
    const originalProxy = "socks5://BK:BK@59.153.18.230:1052";
    proxyUrl = await ProxyChain.anonymizeProxy(originalProxy);
    console.log(`✅ Proxy tunnel created: ${proxyUrl}`);

    // Launch browser with maximum stealth
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        `--proxy-server=${proxyUrl}`,
        // MAXIMUM STEALTH CONFIGURATION
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-gpu-sandbox",
        "--disable-software-rasterizer",
        "--disable-background-timer-throttling",
        "--disable-backgrounding-occluded-windows",
        "--disable-renderer-backgrounding",
        "--disable-features=TranslateUI",
        "--disable-features=BlinkGenPropertyTrees",
        "--disable-ipc-flooding-protection",
        "--no-first-run",
        "--no-zygote",
        "--single-process",
        "--disable-extensions",
        "--disable-plugins",
        "--disable-images",
        "--disable-blink-features=AutomationControlled",
        "--exclude-switches=enable-automation",
        "--disable-component-extensions-with-background-pages",
        "--disable-logging",
        "--disable-plugins-discovery",
        "--no-default-browser-check",
        "--no-pings",
        "--no-service-autorun",
        "--disable-hang-monitor",
        "--disable-popup-blocking",
        "--disable-prompt-on-repost",
        "--disable-sync",
        "--disable-translate",
        "--memory-pressure-off",
        "--max_old_space_size=4096",
        "--window-size=1920,1080",
        "--disable-background-networking",
        "--disable-client-side-phishing-detection",
        "--disable-domain-reliability",
        "--disable-features=AudioServiceOutOfProcess",
        "--disable-background-mode",
        "--disable-features=VizDisplayCompositor,VizHitTestSurfaceLayer",
        "--disable-features=UserActivationSameOriginVisibility",
        "--disable-features=AutofillShowTypePredictions",
        "--disable-features=CSSContainerQueries",
        "--disable-component-update",
        "--disable-breakpad",
        "--disable-crash-reporter",
        "--disable-features=site-per-process",
        "--metrics-recording-only",
        "--no-report-upload",
        "--safebrowsing-disable-auto-update",
        "--enable-automation=false",
        "--hide-scrollbars",
        "--mute-audio",
        "--disable-accelerated-2d-canvas",
        "--log-level=3",
        "--disable-dev-tools",
        "--disable-device-discovery-notifications",
        "--use-gl=disabled",
        "--disable-gl-drawing-for-tests",
        "--disable-canvas-aa",
        "--disable-3d-apis",
        "--disable-accelerated-video-decode",
        "--disable-accelerated-mjpeg-decode",
        "--disable-app-list-dismiss-on-blur",
        "--disable-default-apps",
        "--disable-web-security",
        "--ignore-certificate-errors",
        "--ignore-ssl-errors",
        "--allow-running-insecure-content",
        "--ignore-certificate-errors-spki-list",
        "--ignore-ssl-errors-list",
        "--disable-background-timer-throttling",
        "--disable-backgrounding-occluded-windows",
        "--disable-renderer-backgrounding",
        "--disable-features=VizDisplayCompositor",
        "--run-all-compositor-stages-before-draw",
        "--disable-new-content-rendering-timeout",
        "--user-agent='Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'",
        "--disable-features=WebRtcHideLocalIpsWithMdns",
        "--force-webrtc-ip-handling-policy=disable_non_proxied_udp",
        "--disable-webrtc-multiple-routes",
        "--disable-webrtc-hw-decoding",
        "--disable-webrtc-hw-encoding",
      ],
      defaultViewport: { width: 1920, height: 1080 },
      timeout: 120000,
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

    // Set Linux user agent
    await page.setUserAgent(
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
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

    // Set Linux headers
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
      "Sec-Ch-Ua-Platform": '"Linux"',
      "Sec-Ch-Ua-Platform-Version": '"6.8.0"',
      "Upgrade-Insecure-Requests": "1",
      DNT: "1",
      "X-Forwarded-For": "192.168.1.100",
      "X-Real-IP": "203.115.77.164",
    });

    // Apply maximum stealth injection
    await page.evaluateOnNewDocument(() => {
      // NUCLEAR STEALTH MODE - REMOVE ALL TRACES

      // Multiple layers of webdriver concealment
      const webdriverDescriptor = Object.getOwnPropertyDescriptor(
        Navigator.prototype,
        "webdriver"
      );
      if (webdriverDescriptor) {
        delete Navigator.prototype.webdriver;
      }

      Object.defineProperty(navigator, "webdriver", {
        get: () => undefined,
        enumerable: false,
        configurable: false,
      });

      delete navigator.__proto__.webdriver;
      delete navigator.webdriver;
      delete window.navigator.webdriver;

      // Advanced automation concealment
      delete window.__puppeteer_evaluation_script__;
      delete window.navigator.platform.webdriver;
      delete window.document.$cdc_asdjflasutopfhvcZLmcfl_;

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
      };

      // Linux platform simulation
      Object.defineProperty(navigator, "platform", {
        get: () => "Linux x86_64",
      });

      Object.defineProperty(navigator, "userAgent", {
        get: () =>
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      });

      // Hardware simulation
      Object.defineProperty(navigator, "hardwareConcurrency", {
        get: () => 4,
      });

      Object.defineProperty(navigator, "deviceMemory", {
        get: () => 8,
      });

      // Advanced plugin spoofing
      Object.defineProperty(navigator, "plugins", {
        get: () => ({
          length: 3,
          0: {
            name: "Chrome PDF Plugin",
            description: "Portable Document Format",
          },
          1: { name: "Chrome PDF Viewer", description: "" },
          2: { name: "Native Client", description: "" },
          refresh: () => {},
        }),
      });

      // Languages
      Object.defineProperty(navigator, "languages", {
        get: () => ["en-US", "en"],
      });

      // Remove automation indicators
      Object.defineProperty(navigator, "maxTouchPoints", {
        get: () => 0,
      });

      // Advanced permission spoofing
      if (navigator.permissions) {
        const originalQuery = navigator.permissions.query;
        navigator.permissions.query = function (parameters) {
          const fakeResponses = {
            notifications: Promise.resolve({ state: "default" }),
            geolocation: Promise.resolve({ state: "denied" }),
            camera: Promise.resolve({ state: "denied" }),
            microphone: Promise.resolve({ state: "denied" }),
          };

          if (parameters && parameters.name && fakeResponses[parameters.name]) {
            return fakeResponses[parameters.name];
          }

          return originalQuery.apply(this, arguments);
        };
      }

      console.log("🔒 NUCLEAR STEALTH MODE ACTIVATED - MAXIMUM CONCEALMENT");
    });

    console.log("🌐 Testing stealth on bot detection site...");

    // Test stealth on bot detection site
    await page.goto("https://bot.sannysoft.com/", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    const detectionResults = await page.evaluate(() => {
      return {
        webdriver: window.navigator.webdriver,
        platform: window.navigator.platform,
        userAgent: window.navigator.userAgent.substring(0, 80) + "...",
        plugins: window.navigator.plugins.length,
        chrome: !!window.chrome,
        languages: window.navigator.languages.length,
        hardwareConcurrency: window.navigator.hardwareConcurrency,
        deviceMemory: window.navigator.deviceMemory,
        automation: window.document.$cdc_asdjflasutopfhvcZLmcfl_ || "undefined",
      };
    });

    console.log("🔍 Detection Results:", detectionResults);

    console.log("\n🎯 Testing on Garena Shop...");

    // Navigate to Garena Shop
    await page.goto("https://shop.garena.my/?app=100067&channel=202953", {
      waitUntil: "networkidle2",
      timeout: 45000,
    });

    // Wait for page to load
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Comprehensive CAPTCHA detection
    const captchaCheck = await page.evaluate(() => {
      const captchaSelectors = [
        'iframe[src*="recaptcha"]',
        ".g-recaptcha",
        ".recaptcha-checkbox",
        "#recaptcha",
        "[data-sitekey]",
        ".captcha",
        'iframe[src*="hcaptcha"]',
        ".h-captcha",
        ".cf-challenge-form",
        '[id*="captcha"]',
        '[class*="captcha"]',
        'canvas[width="300"][height="150"]',
        ".slide-verify",
        'img[alt*="captcha"]',
        'img[src*="captcha"]',
      ];

      for (const selector of captchaSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          return {
            detected: true,
            type: "element",
            selector,
            visible: element.offsetParent !== null,
          };
        }
      }

      const textPatterns = [
        /please complete.*security check/i,
        /verify.*human/i,
        /prove.*not.*robot/i,
        /security.*challenge/i,
        /slide.*complete/i,
        /puzzle/i,
        /captcha/i,
        /verification/i,
      ];

      const bodyText = document.body.innerText || "";
      for (const pattern of textPatterns) {
        if (pattern.test(bodyText)) {
          return { detected: true, type: "text", pattern: pattern.toString() };
        }
      }

      return { detected: false };
    });

    if (captchaCheck.detected) {
      console.log(
        `❌ CAPTCHA DETECTED: ${captchaCheck.type} - ${
          captchaCheck.selector || captchaCheck.pattern
        }`
      );

      // Take screenshot for analysis
      const screenshotPath = `screenshots/captcha-analysis-${Date.now()}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`📸 Screenshot saved: ${screenshotPath}`);

      // Analyze page content
      const pageAnalysis = await page.evaluate(() => {
        return {
          title: document.title,
          url: window.location.href,
          bodyHTML: document.body.innerHTML.substring(0, 500) + "...",
          scripts: Array.from(document.scripts)
            .map((s) => s.src)
            .filter((s) => s),
          iframes: Array.from(document.querySelectorAll("iframe")).map(
            (i) => i.src
          ),
        };
      });

      console.log("📊 Page Analysis:", pageAnalysis);
    } else {
      console.log(
        "🎉 NO CAPTCHA DETECTED! Maximum stealth configuration successful!"
      );

      // Check for player ID input
      try {
        await page.waitForSelector('input[placeholder*="player ID"]', {
          timeout: 10000,
        });
        console.log("✅ Player ID input found - site is fully accessible!");
      } catch (e) {
        console.log("⚠️  Player ID input not found, checking page state...");
      }

      // Take success screenshot
      const successPath = `screenshots/stealth-success-${Date.now()}.png`;
      await page.screenshot({ path: successPath, fullPage: true });
      console.log(`📸 Success screenshot: ${successPath}`);
    }

    console.log("\n🏁 Maximum stealth test completed");
  } catch (error) {
    console.error("❌ Test failed:", error.message);

    if (browser) {
      const errorPath = `screenshots/error-max-stealth-${Date.now()}.png`;
      try {
        const pages = await browser.pages();
        if (pages.length > 0) {
          await pages[pages.length - 1].screenshot({ path: errorPath });
          console.log(`📸 Error screenshot: ${errorPath}`);
        }
      } catch (screenshotError) {
        console.log("Failed to take error screenshot");
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

// Run the test
testMaximumStealth().catch(console.error);
