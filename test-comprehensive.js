// Comprehensive CAPTCHA and automation test
const AutomationService = require("./src/services/AutomationService");

async function comprehensiveTest() {
  console.log(
    "Starting comprehensive automation test with CAPTCHA handling..."
  );

  let browser;
  let testResults = {
    browserInit: false,
    pageLoad: false,
    captchaHandling: false,
    playerIdInput: false,
    overallSuccess: false,
  };

  try {
    // Test 1: Browser initialization with anti-detection
    console.log("\n=== Test 1: Browser Initialization ===");
    browser = await AutomationService.initBrowser();
    testResults.browserInit = true;
    console.log(
      "✅ Browser initialized successfully with enhanced anti-detection"
    );

    // Test 2: Page creation and setup
    console.log("\n=== Test 2: Page Setup ===");
    const page = await browser.newPage();

    // Apply all anti-detection measures
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    await page.setViewport({ width: 1366, height: 768 });

    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9,ms;q=0.8",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
      "Accept-Encoding": "gzip, deflate, br",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-User": "?1",
      "Sec-Fetch-Dest": "document",
      "Upgrade-Insecure-Requests": "1",
    });

    // Enhanced stealth
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => undefined });
      Object.defineProperty(navigator, "plugins", {
        get: () => [1, 2, 3, 4, 5],
      });
      Object.defineProperty(navigator, "languages", {
        get: () => ["en-US", "en", "ms"],
      });

      window.chrome = {
        runtime: {},
        loadTimes: function () {},
        csi: function () {},
        app: {},
      };

      // Override automation detection
      delete Object.getPrototypeOf(navigator).webdriver;
    });

    console.log("✅ Page setup completed with full stealth mode");

    // Test 3: Navigation with retry logic
    console.log("\n=== Test 3: Navigation to Garena Shop ===");
    let navigationSuccess = false;
    let attempts = 0;
    const maxAttempts = 3;

    while (!navigationSuccess && attempts < maxAttempts) {
      attempts++;
      console.log(`Attempt ${attempts}/${maxAttempts}...`);

      try {
        await page.goto("https://shop.garena.my/?app=100067&channel=202953", {
          waitUntil: "networkidle2",
          timeout: 30000,
        });

        navigationSuccess = true;
        testResults.pageLoad = true;
        console.log("✅ Navigation successful");

        // Take screenshot
        const timestamp = Date.now();
        await page.screenshot({
          path: `screenshots/comprehensive-test-nav-${timestamp}.png`,
          fullPage: true,
        });
        console.log(
          `📸 Navigation screenshot saved: comprehensive-test-nav-${timestamp}.png`
        );
      } catch (navError) {
        console.log(
          `❌ Navigation attempt ${attempts} failed: ${navError.message}`
        );
        if (attempts < maxAttempts) {
          console.log("Waiting 5 seconds before retry...");
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      }
    }

    if (!navigationSuccess) {
      throw new Error("Failed to navigate after all attempts");
    }

    // Test 4: CAPTCHA Detection and Handling
    console.log("\n=== Test 4: CAPTCHA Detection and Handling ===");
    const requestId = `comprehensive_test_${Date.now()}`;

    await AutomationService.handleCaptchaIfPresent(page, requestId);
    testResults.captchaHandling = true;
    console.log("✅ CAPTCHA handling completed");

    // Test 5: Human behavior simulation
    console.log("\n=== Test 5: Human Behavior Simulation ===");
    await AutomationService.simulateHumanBehavior(page);
    console.log("✅ Human behavior simulation completed");

    // Test 6: Player ID Input Detection
    console.log("\n=== Test 6: Player ID Input Detection ===");
    let inputFound = false;
    const inputSelectors = [
      'input[placeholder="Please enter player ID here"]',
      'input[placeholder*="player"]',
      'input[placeholder*="ID"]',
      "#player-id",
      ".player-input",
      'input[type="text"]',
    ];

    for (const selector of inputSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        console.log(`✅ Found input field: ${selector}`);
        inputFound = true;
        testResults.playerIdInput = true;
        break;
      } catch (e) {
        console.log(`❌ Input field not found: ${selector}`);
      }
    }

    if (inputFound) {
      // Test human-like typing
      console.log("Testing human-like typing...");
      const testPlayerId = "123456789";

      try {
        await page.click(inputSelectors[0]);
        await new Promise((resolve) => setTimeout(resolve, 500));

        for (let i = 0; i < testPlayerId.length; i++) {
          await page.keyboard.type(testPlayerId[i]);
          await new Promise((resolve) =>
            setTimeout(resolve, 100 + Math.random() * 200)
          );
        }

        console.log("✅ Human-like typing test successful");
      } catch (typingError) {
        console.log(`❌ Typing test failed: ${typingError.message}`);
      }
    }

    // Final screenshot
    const finalTimestamp = Date.now();
    await page.screenshot({
      path: `screenshots/comprehensive-test-final-${finalTimestamp}.png`,
      fullPage: true,
    });
    console.log(
      `📸 Final screenshot saved: comprehensive-test-final-${finalTimestamp}.png`
    );

    await page.close();

    // Mark overall success
    testResults.overallSuccess =
      testResults.browserInit &&
      testResults.pageLoad &&
      testResults.captchaHandling;
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
    console.error("Stack trace:", error.stack);
  } finally {
    // Cleanup
    try {
      await AutomationService.closeBrowser();
      console.log("✅ Browser cleaned up");
    } catch (cleanupError) {
      console.error("Cleanup error:", cleanupError.message);
    }
  }

  // Print test results
  console.log("\n" + "=".repeat(50));
  console.log("COMPREHENSIVE TEST RESULTS");
  console.log("=".repeat(50));
  console.log(
    `Browser Initialization: ${testResults.browserInit ? "✅ PASS" : "❌ FAIL"}`
  );
  console.log(`Page Load: ${testResults.pageLoad ? "✅ PASS" : "❌ FAIL"}`);
  console.log(
    `CAPTCHA Handling: ${testResults.captchaHandling ? "✅ PASS" : "❌ FAIL"}`
  );
  console.log(
    `Player ID Input: ${testResults.playerIdInput ? "✅ PASS" : "❌ FAIL"}`
  );
  console.log(
    `Overall Success: ${
      testResults.overallSuccess ? "🎉 SUCCESS" : "❌ FAILED"
    }`
  );
  console.log("=".repeat(50));

  if (testResults.overallSuccess) {
    console.log("\n🎉 Your automation is ready with CAPTCHA handling!");
    console.log("💡 Tips to avoid CAPTCHAs:");
    console.log("   - Use random delays between actions");
    console.log("   - Don't run too many automations simultaneously");
    console.log("   - Vary your timing patterns");
    console.log(
      "   - The enhanced anti-detection should help reduce CAPTCHA triggers"
    );
  } else {
    console.log("\n⚠️ Some tests failed. Check the logs above for details.");
  }
}

comprehensiveTest().catch(console.error);
