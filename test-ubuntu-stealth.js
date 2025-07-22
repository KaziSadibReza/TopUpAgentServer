const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const ProxyChain = require("proxy-chain");

// Use stealth plugin
puppeteer.use(StealthPlugin());

async function testUbuntuVPSStealth() {
  console.log("🚀 Testing UBUNTU VPS STEALTH Configuration...");

  let browser = null;
  let proxyUrl = null;

  try {
    // SOCKS5 proxy configuration using proxy-chain
    const originalProxy = "socks5://BK:BK@59.153.18.230:1052";
    proxyUrl = await ProxyChain.anonymizeProxy(originalProxy);

    console.log(`✅ Proxy tunnel created: ${proxyUrl}`);

    browser = await puppeteer.launch({
      headless: true, // Force headless for VPS
      args: [
        `--proxy-server=${proxyUrl}`,
        // LINUX/UBUNTU VPS OPTIMIZED - Maximum Anti-Detection
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
        "--single-process", // Important for VPS
        "--disable-extensions",
        "--disable-plugins",
        "--disable-images", // Faster loading on VPS
        // ULTIMATE reCAPTCHA BYPASS - Linux Optimized
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
        // LINUX SPECIFIC OPTIMIZATIONS
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
        // ADVANCED LINUX ANTI-DETECTION
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
        // AGGRESSIVE FINGERPRINT MASKING
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

    // Set Linux User Agent
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

    // Linux-optimized headers
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
    });

    // Ubuntu VPS Anti-Detection
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

      // LINUX SPECIFIC - Platform simulation
      Object.defineProperty(navigator, "platform", {
        get: () => "Linux x86_64",
      });

      Object.defineProperty(navigator, "userAgent", {
        get: () =>
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      });

      Object.defineProperty(navigator, "appVersion", {
        get: () =>
          "5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      });

      // Advanced plugin spoofing for Linux
      Object.defineProperty(navigator, "plugins", {
        get: () => ({
          length: 3,
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
          refresh: () => {},
          namedItem: (name) => null,
          item: (index) => null,
        }),
        enumerable: true,
        configurable: true,
      });

      console.log(
        "🔒 UBUNTU VPS STEALTH MODE ACTIVATED - ALL AUTOMATION TRACES REMOVED"
      );
    });

    console.log("🌐 Navigating to Garena Shop...");
    await page.goto("https://shop.garena.my/?app=100067&channel=202953", {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    // Wait for page to load
    await new Promise((resolve) => setTimeout(resolve, 5000));

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
        "🎉 NO CAPTCHA DETECTED! Ubuntu VPS stealth working perfectly!"
      );
    }

    // Test bot detection
    console.log("🤖 Testing bot detection...");
    const botDetectionResults = await page.evaluate(() => {
      return {
        webdriver: navigator.webdriver,
        platform: navigator.platform,
        userAgent: navigator.userAgent.substring(0, 50) + "...",
        plugins: navigator.plugins.length,
        chrome: !!window.chrome,
        languages: navigator.languages.length,
        hardwareConcurrency: navigator.hardwareConcurrency,
        deviceMemory: navigator.deviceMemory,
      };
    });

    console.log("🔍 Ubuntu VPS Detection Results:", botDetectionResults);

    // Check if player ID input is accessible
    try {
      await page.waitForSelector(
        'input[placeholder="Please enter player ID here"]',
        { timeout: 10000 }
      );
      console.log("✅ Player ID input found - site is accessible!");
    } catch (error) {
      console.log("⚠️ Player ID input not found - checking page status...");
      console.log("Current URL:", page.url());
    }

    // Take screenshot for verification
    await page.screenshot({
      path: "screenshots/ubuntu-vps-stealth-test.png",
      fullPage: true,
    });
    console.log("📸 Screenshot saved: screenshots/ubuntu-vps-stealth-test.png");
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
testUbuntuVPSStealth().catch(console.error);
