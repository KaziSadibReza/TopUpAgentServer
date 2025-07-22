const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const ProxyChain = require("proxy-chain");

// Use basic stealth plugin only
puppeteer.use(StealthPlugin());

async function testSimplifiedStealth() {
  console.log("🎯 TESTING SIMPLIFIED STEALTH APPROACH");
  console.log("=".repeat(50));
  console.log("Strategy: Less is more - minimal detection footprint");
  console.log("Approach: Basic stealth + human behavior simulation");
  console.log("");

  let browser;
  let proxyUrl;

  try {
    // Create proxy tunnel
    const originalProxy = "socks5://BK:BK@59.153.18.230:1052";
    proxyUrl = await ProxyChain.anonymizeProxy(originalProxy);
    console.log(`✅ Proxy tunnel: ${proxyUrl}`);

    // Launch with MINIMAL but effective arguments
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        `--proxy-server=${proxyUrl}`,
        // MINIMAL ESSENTIAL ARGUMENTS ONLY
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-blink-features=AutomationControlled",
        "--exclude-switches=enable-automation",
        "--no-first-run",
        "--disable-default-apps",
        "--disable-extensions",
        // Human-like window size
        "--window-size=1366,768",
      ],
      defaultViewport: { width: 1366, height: 768 },
      timeout: 60000,
      ignoreDefaultArgs: ["--enable-automation"],
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();

    // Set realistic Windows user agent
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
    );

    // Minimal realistic headers
    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      DNT: "1",
      "Upgrade-Insecure-Requests": "1",
    });

    // SIMPLE but effective stealth injection
    await page.evaluateOnNewDocument(() => {
      // Remove webdriver property (basic but effective)
      Object.defineProperty(navigator, "webdriver", {
        get: () => undefined,
      });

      // Remove automation indicators
      delete window.navigator.webdriver;
      delete window.__puppeteer_evaluation_script__;

      // Basic Chrome simulation
      window.chrome = {
        runtime: {},
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
      };

      // Basic permission override
      if (navigator.permissions) {
        const originalQuery = navigator.permissions.query;
        navigator.permissions.query = function (parameters) {
          return Promise.resolve({ state: "default" });
        };
      }

      console.log("✅ Basic stealth mode activated");
    });

    console.log("🌐 Navigating to Garena Shop...");

    // Direct navigation with human-like timing
    await page.goto("https://shop.garena.my/?app=100067&channel=202953", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    // Wait for page to settle
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Check page status
    const pageStatus = await page.evaluate(() => {
      return {
        title: document.title,
        url: window.location.href,
        blocked:
          document.body.innerText.includes("Access blocked") ||
          document.body.innerText.includes("unusual activity") ||
          document.body.innerText.includes("bot activity"),
        hasPlayerInput: !!document.querySelector(
          'input[placeholder*="player"]'
        ),
        bodyText: document.body.innerText.substring(0, 300),
        forms: document.querySelectorAll("form").length,
        inputs: document.querySelectorAll("input").length,
      };
    });

    console.log("\n📊 Page Analysis:");
    console.log("   Title:", pageStatus.title);
    console.log("   Blocked:", pageStatus.blocked ? "❌ YES" : "✅ NO");
    console.log(
      "   Player Input:",
      pageStatus.hasPlayerInput ? "✅ Found" : "❌ Not found"
    );
    console.log("   Forms:", pageStatus.forms);
    console.log("   Inputs:", pageStatus.inputs);

    if (pageStatus.blocked) {
      console.log("\n🚨 BLOCKING DETECTED:");
      console.log("   Message:", pageStatus.bodyText);
    } else if (pageStatus.hasPlayerInput) {
      console.log("\n🎉 SUCCESS: Site accessible with simplified stealth!");

      // Test player ID input functionality
      console.log("🔧 Testing player ID input...");

      try {
        const playerIdInput = await page.$('input[placeholder*="player"]');
        if (playerIdInput) {
          // Human-like interaction
          await page.mouse.move(
            Math.random() * 200 + 100,
            Math.random() * 200 + 100
          );
          await new Promise((resolve) => setTimeout(resolve, 500));

          await page.click('input[placeholder*="player"]');
          await new Promise((resolve) => setTimeout(resolve, 300));

          // Type test player ID with human delays
          const testPlayerId = "1234567890";
          for (let char of testPlayerId) {
            await page.keyboard.type(char);
            await new Promise((resolve) =>
              setTimeout(resolve, 80 + Math.random() * 120)
            );
          }

          console.log("✅ Player ID input successful");

          // Check if login button appears
          const hasLoginButton = await page.$(
            'button[type="submit"], button:contains("Login")'
          );
          if (hasLoginButton) {
            console.log("✅ Login button found - full functionality confirmed");
          }
        }
      } catch (inputError) {
        console.log("⚠️ Player ID input test failed:", inputError.message);
      }
    } else {
      console.log("\n⚠️ Unexpected page state:");
      console.log("   Content:", pageStatus.bodyText);
    }

    // Take screenshot
    const screenshotPath = `screenshots/simplified-stealth-${Date.now()}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 Screenshot: ${screenshotPath}`);

    // Final stealth verification
    const stealthCheck = await page.evaluate(() => {
      return {
        webdriver: typeof navigator.webdriver,
        automation: !!window.navigator.webdriver,
        chrome: !!window.chrome,
        plugins: navigator.plugins.length,
        languages: navigator.languages.length,
        platform: navigator.platform,
        userAgent: navigator.userAgent.substring(0, 50) + "...",
      };
    });

    console.log("\n🔍 Stealth Verification:");
    console.log("   Webdriver:", stealthCheck.webdriver);
    console.log("   Automation:", stealthCheck.automation);
    console.log("   Chrome:", stealthCheck.chrome);
    console.log("   Platform:", stealthCheck.platform);
    console.log("   Plugins:", stealthCheck.plugins);

    if (stealthCheck.webdriver === "undefined" && !stealthCheck.automation) {
      console.log("✅ Stealth verification passed");
    } else {
      console.log("⚠️ Stealth verification failed");
    }
  } catch (error) {
    console.error("❌ Simplified stealth test failed:", error.message);

    if (browser) {
      try {
        const pages = await browser.pages();
        if (pages.length > 0) {
          const errorPath = `screenshots/error-simplified-${Date.now()}.png`;
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

testSimplifiedStealth().catch(console.error);
