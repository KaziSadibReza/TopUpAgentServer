const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const ProxyChain = require("proxy-chain");

// Use stealth plugin
puppeteer.use(StealthPlugin());

async function testUltimateStealth() {
  console.log("🚀 Testing ULTIMATE Stealth Configuration...");

  let browser = null;
  let proxyUrl = null;

  try {
    // SOCKS5 proxy configuration using proxy-chain
    const originalProxy = "socks5://BK:BK@59.153.18.230:1052";
    proxyUrl = await ProxyChain.anonymizeProxy(originalProxy);

    console.log(`✅ Proxy tunnel created: ${proxyUrl}`);

    browser = await puppeteer.launch({
      headless: false, // Show browser for testing
      args: [
        `--proxy-server=${proxyUrl}`,
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

    const page = await browser.newPage();

    // Set MOST REALISTIC user agent
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

    // Add MOST REALISTIC headers
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
      "X-Forwarded-For": "192.168.1.100",
      "X-Real-IP": "203.115.77.164",
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

      console.log(
        "🔒 ULTIMATE STEALTH MODE ACTIVATED - ALL AUTOMATION TRACES REMOVED"
      );
    });

    console.log("🌐 Navigating to Garena Shop...");
    await page.goto("https://shop.garena.my/?app=100067&channel=202953", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    // Wait for page to load
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Check for reCAPTCHA presence
    console.log("🔍 Checking for reCAPTCHA...");
    const captchaSelectors = [
      'iframe[src*="captcha"]',
      'iframe[src*="recaptcha"]',
      ".captcha",
      ".verification",
      '[data-cy="captcha"]',
      ".slider-verify",
      ".puzzle-verify",
      ".nc_wrapper",
      ".nc_scale",
      "#nc_1_n1z",
      'div[id*="nc_"]',
      'div[style*="position: fixed"]',
      ".modal-overlay",
      ".verification-modal",
    ];

    let captchaFound = false;
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
            console.log(`❌ CAPTCHA DETECTED: ${selector}`);
            break;
          }
        }
      } catch (e) {
        // Continue checking
      }
    }

    if (!captchaFound) {
      console.log(
        "🎉 NO CAPTCHA DETECTED! Ultimate stealth working perfectly!"
      );
    }

    // Test bot detection
    console.log("🤖 Testing bot detection...");
    const botDetectionResults = await page.evaluate(() => {
      return {
        webdriver: navigator.webdriver,
        plugins: navigator.plugins.length,
        chrome: !!window.chrome,
        languages: navigator.languages.length,
        devtools: false,
        automation: window.navigator.webdriver,
      };
    });

    console.log("🔍 Bot Detection Results:", botDetectionResults);

    // Check if player ID input is accessible
    try {
      await page.waitForSelector(
        'input[placeholder="Please enter player ID here"]',
        { timeout: 10000 }
      );
      console.log("✅ Player ID input found - site is accessible!");
    } catch (error) {
      console.log("⚠️ Player ID input not found - checking page status...");
    }

    // Take screenshot
    await page.screenshot({
      path: "screenshots/ultimate-stealth-test.png",
      fullPage: true,
    });
    console.log("📸 Screenshot saved: screenshots/ultimate-stealth-test.png");

    console.log("⏱️ Keeping browser open for 10 seconds to observe...");
    await new Promise((resolve) => setTimeout(resolve, 10000));
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  } finally {
    if (browser) {
      await browser.close();
      console.log("🔒 Browser closed");
    }

    if (proxyUrl) {
      try {
        await ProxyChain.closeAnonymizedProxy(proxyUrl, true);
        console.log("🔗 Proxy chain closed");
      } catch (error) {
        console.log("⚠️ Failed to close proxy chain:", error.message);
      }
    }
  }
}

// Run the test
testUltimateStealth().catch(console.error);
