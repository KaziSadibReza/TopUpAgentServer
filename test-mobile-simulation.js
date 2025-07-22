const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const ProxyChain = require("proxy-chain");

puppeteer.use(StealthPlugin());

async function testMobileSimulation() {
  console.log("📱 TESTING MOBILE DEVICE SIMULATION");
  console.log("=".repeat(50));
  console.log(
    "Strategy: Mobile browser simulation to bypass desktop detection"
  );
  console.log("Device: iPhone 13 Pro (iOS 15.6.1)");
  console.log("Network: 4G mobile connection simulation");
  console.log("");

  let browser;
  let proxyUrl;

  try {
    // Create proxy tunnel
    const originalProxy = "socks5://BK:BK@59.153.18.230:1052";
    proxyUrl = await ProxyChain.anonymizeProxy(originalProxy);
    console.log(`✅ Proxy tunnel: ${proxyUrl}`);

    // Launch browser with mobile simulation
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        `--proxy-server=${proxyUrl}`,
        // MOBILE-OPTIMIZED ARGUMENTS
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-blink-features=AutomationControlled",
        "--exclude-switches=enable-automation",
        "--no-first-run",
        "--disable-default-apps",
        // Mobile-specific arguments
        "--use-mobile-user-agent",
        "--force-device-scale-factor=3",
        "--window-size=375,812", // iPhone 13 Pro size
        "--disable-desktop-notifications",
        "--disable-web-security", // For mobile compatibility
        "--allow-running-insecure-content",
      ],
      defaultViewport: {
        width: 375,
        height: 812,
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
        isLandscape: false,
      },
      timeout: 60000,
      ignoreDefaultArgs: ["--enable-automation"],
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();

    // Set iPhone 13 Pro user agent
    await page.setUserAgent(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 15_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6 Mobile/15E148 Safari/604.1"
    );

    // Set mobile-specific headers
    await page.setExtraHTTPHeaders({
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      DNT: "1",
      Connection: "keep-alive",
      "Upgrade-Insecure-Requests": "1",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-User": "?1",
      "Sec-Fetch-Dest": "document",
      // Mobile-specific headers
      "Sec-Ch-Ua": '"Safari";v="15", "Mobile Safari";v="15"',
      "Sec-Ch-Ua-Mobile": "?1",
      "Sec-Ch-Ua-Platform": '"iOS"',
    });

    // Mobile device simulation
    await page.evaluateOnNewDocument(() => {
      // Remove webdriver traces
      Object.defineProperty(navigator, "webdriver", {
        get: () => undefined,
      });
      delete window.navigator.webdriver;
      delete window.__puppeteer_evaluation_script__;

      // iOS Safari simulation
      Object.defineProperty(navigator, "platform", {
        get: () => "iPhone",
      });

      Object.defineProperty(navigator, "vendor", {
        get: () => "Apple Computer, Inc.",
      });

      Object.defineProperty(navigator, "vendorSub", {
        get: () => "",
      });

      Object.defineProperty(navigator, "productSub", {
        get: () => "20030107",
      });

      // Mobile-specific properties
      Object.defineProperty(navigator, "maxTouchPoints", {
        get: () => 5, // iPhone supports 5-finger touch
      });

      Object.defineProperty(navigator, "hardwareConcurrency", {
        get: () => 6, // iPhone 13 Pro has 6 cores
      });

      Object.defineProperty(navigator, "deviceMemory", {
        get: () => 6, // iPhone 13 Pro has 6GB RAM
      });

      // iOS-specific properties
      Object.defineProperty(screen, "width", {
        get: () => 375,
      });

      Object.defineProperty(screen, "height", {
        get: () => 812,
      });

      Object.defineProperty(screen, "availWidth", {
        get: () => 375,
      });

      Object.defineProperty(screen, "availHeight", {
        get: () => 812,
      });

      Object.defineProperty(screen, "pixelDepth", {
        get: () => 24,
      });

      Object.defineProperty(screen, "colorDepth", {
        get: () => 24,
      });

      // Mobile connection simulation
      Object.defineProperty(navigator, "connection", {
        get: () => ({
          effectiveType: "4g",
          downlink: 8.2,
          rtt: 65,
          saveData: false,
          type: "cellular",
        }),
      });

      // iOS Safari plugins
      Object.defineProperty(navigator, "plugins", {
        get: () => ({
          length: 0, // iOS Safari has no plugins
          refresh: () => {},
          namedItem: () => null,
          item: () => null,
        }),
      });

      Object.defineProperty(navigator, "mimeTypes", {
        get: () => ({
          length: 0, // iOS Safari has no mime types
        }),
      });

      // Language settings for SEA region
      Object.defineProperty(navigator, "language", {
        get: () => "en-US",
      });

      Object.defineProperty(navigator, "languages", {
        get: () => ["en-US", "en", "ms"], // Include Malay for Malaysia
      });

      // Remove desktop-specific properties
      delete navigator.getBattery; // Mobile devices don't expose battery API the same way

      // Touch support
      window.TouchEvent = window.TouchEvent || function () {};
      window.Touch = window.Touch || function () {};

      // Mobile-specific APIs
      Object.defineProperty(navigator, "standalone", {
        get: () => false, // Not in PWA mode
      });

      // Webkit-specific (Safari) properties
      window.webkit = {
        messageHandlers: {},
      };

      console.log("📱 iOS Safari mobile simulation activated");
    });

    console.log("🌐 Navigating to Garena Mobile Shop...");

    // First, simulate realistic mobile browsing pattern
    console.log("📚 Establishing mobile session...");

    // Visit Google mobile first
    await page.goto("https://www.google.com", {
      waitUntil: "networkidle0",
      timeout: 20000,
    });

    // Simulate mobile search
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const searchInput = await page.$('input[name="q"]');
    if (searchInput) {
      await page.tap('input[name="q"]'); // Use tap instead of click for mobile
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Type search query with mobile-like timing
      const query = "garena free fire diamond";
      for (let char of query) {
        await page.keyboard.type(char);
        await new Promise((resolve) =>
          setTimeout(resolve, 120 + Math.random() * 180)
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
      await page.keyboard.press("Enter");
      await page.waitForNavigation({ waitUntil: "networkidle0" });
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    // Now navigate to Garena shop
    console.log("🎯 Accessing Garena Shop from mobile...");

    await page.goto("https://shop.garena.my/?app=100067&channel=202953", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    // Wait for mobile page to load
    await new Promise((resolve) => setTimeout(resolve, 4000));

    // Mobile page analysis
    const mobilePageStatus = await page.evaluate(() => {
      return {
        title: document.title,
        url: window.location.href,
        blocked:
          document.body.innerText.includes("Access blocked") ||
          document.body.innerText.includes("unusual activity") ||
          document.body.innerText.includes("bot activity"),
        hasPlayerInput: !!document.querySelector(
          'input[placeholder*="player"], input[placeholder*="ID"]'
        ),
        bodyText: document.body.innerText.substring(0, 400),
        isMobile: window.innerWidth <= 768,
        touchSupport: "ontouchstart" in window,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
        forms: document.querySelectorAll("form").length,
        inputs: document.querySelectorAll("input").length,
        buttons: document.querySelectorAll("button").length,
      };
    });

    console.log("\n📊 Mobile Page Analysis:");
    console.log("   Title:", mobilePageStatus.title || "No title");
    console.log("   Blocked:", mobilePageStatus.blocked ? "❌ YES" : "✅ NO");
    console.log(
      "   Player Input:",
      mobilePageStatus.hasPlayerInput ? "✅ Found" : "❌ Not found"
    );
    console.log(
      "   Mobile View:",
      mobilePageStatus.isMobile ? "✅ YES" : "❌ NO"
    );
    console.log(
      "   Touch Support:",
      mobilePageStatus.touchSupport ? "✅ YES" : "❌ NO"
    );
    console.log(
      "   Viewport:",
      `${mobilePageStatus.viewport.width}x${mobilePageStatus.viewport.height}`
    );
    console.log("   Forms:", mobilePageStatus.forms);
    console.log("   Inputs:", mobilePageStatus.inputs);
    console.log("   Buttons:", mobilePageStatus.buttons);

    if (mobilePageStatus.blocked) {
      console.log("\n🚨 MOBILE BLOCKING DETECTED:");
      console.log("   Message:", mobilePageStatus.bodyText);
      console.log("   Analysis: IP-level blocking persists on mobile");
    } else if (mobilePageStatus.hasPlayerInput) {
      console.log("\n🎉 SUCCESS: Mobile access granted!");

      // Test mobile interaction
      console.log("📱 Testing mobile touch interaction...");

      try {
        const playerInput = await page.$(
          'input[placeholder*="player"], input[placeholder*="ID"]'
        );
        if (playerInput) {
          // Mobile tap interaction
          await page.tap(
            'input[placeholder*="player"], input[placeholder*="ID"]'
          );
          await new Promise((resolve) => setTimeout(resolve, 800));

          // Type with mobile keyboard timing
          const testId = "1234567890";
          for (let char of testId) {
            await page.keyboard.type(char);
            await new Promise((resolve) =>
              setTimeout(resolve, 150 + Math.random() * 200)
            );
          }

          console.log("✅ Mobile input successful");

          // Check for mobile-specific UI elements
          const mobileUI = await page.evaluate(() => ({
            hasSubmitButton: !!document.querySelector('button[type="submit"]'),
            hasLoginButton: !!document.querySelector(
              'button:contains("Login"), .login-btn'
            ),
            hasTouchFriendlyButtons: !!document.querySelector(
              'button[style*="font-size"], .btn-large'
            ),
          }));

          console.log("📱 Mobile UI Elements:", mobileUI);
        }
      } catch (interactionError) {
        console.log(
          "⚠️ Mobile interaction test failed:",
          interactionError.message
        );
      }
    } else {
      console.log("\n⚠️ Unexpected mobile page state:");
      console.log("   Content preview:", mobilePageStatus.bodyText);
    }

    // Take mobile screenshot
    const screenshotPath = `screenshots/mobile-simulation-${Date.now()}.png`;
    await page.screenshot({
      path: screenshotPath,
      fullPage: true,
      captureBeyondViewport: true,
    });
    console.log(`📸 Mobile screenshot: ${screenshotPath}`);

    // Mobile stealth verification
    const mobileStealthCheck = await page.evaluate(() => {
      return {
        webdriver: typeof navigator.webdriver,
        platform: navigator.platform,
        vendor: navigator.vendor,
        isMobile: /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent),
        touchPoints: navigator.maxTouchPoints,
        deviceMemory: navigator.deviceMemory,
        hardwareConcurrency: navigator.hardwareConcurrency,
        connection: navigator.connection
          ? navigator.connection.type
          : "unknown",
        plugins: navigator.plugins.length,
        standalone: navigator.standalone,
      };
    });

    console.log("\n🔍 Mobile Stealth Verification:");
    console.log("   Webdriver:", mobileStealthCheck.webdriver);
    console.log("   Platform:", mobileStealthCheck.platform);
    console.log("   Vendor:", mobileStealthCheck.vendor);
    console.log("   Mobile UA:", mobileStealthCheck.isMobile);
    console.log("   Touch Points:", mobileStealthCheck.touchPoints);
    console.log("   Connection:", mobileStealthCheck.connection);
    console.log("   Plugins:", mobileStealthCheck.plugins);

    const stealthPassed =
      mobileStealthCheck.webdriver === "undefined" &&
      mobileStealthCheck.isMobile &&
      mobileStealthCheck.platform === "iPhone" &&
      mobileStealthCheck.touchPoints > 0;

    console.log(
      "📱 Mobile Stealth Status:",
      stealthPassed ? "✅ PASSED" : "❌ FAILED"
    );
  } catch (error) {
    console.error("❌ Mobile simulation test failed:", error.message);

    if (browser) {
      try {
        const pages = await browser.pages();
        if (pages.length > 0) {
          const errorPath = `screenshots/error-mobile-${Date.now()}.png`;
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

testMobileSimulation().catch(console.error);
