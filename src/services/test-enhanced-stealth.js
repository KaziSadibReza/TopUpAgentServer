// Test enhanced stealth capabilities
const AutomationService = require("./src/services/AutomationService");

async function testEnhancedStealth() {
  console.log("Testing enhanced stealth capabilities to prevent CAPTCHAs...");

  try {
    // Initialize browser with enhanced stealth
    const browser = await AutomationService.initBrowser();
    console.log("✅ Browser initialized with puppeteer-extra stealth");

    // Create a test page
    const page = await browser.newPage();
    console.log("✅ Page created");

    // Test fingerprint detection
    console.log("\n=== Testing Browser Fingerprint ===");

    // Navigate to a fingerprint testing site first
    await page.goto("https://bot.sannysoft.com/", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    // Take screenshot of bot detection test
    await page.screenshot({
      path: `screenshots/bot-detection-test-${Date.now()}.png`,
      fullPage: true,
    });

    console.log("📸 Bot detection test screenshot taken");

    // Check for automation detection
    const detectionResults = await page.evaluate(() => {
      const results = {};

      // Check webdriver
      results.webdriver = navigator.webdriver;

      // Check plugins
      results.plugins = navigator.plugins.length;

      // Check languages
      results.languages = navigator.languages;

      // Check chrome object
      results.chrome = !!window.chrome;

      // Check screen properties
      results.screen = {
        width: screen.width,
        height: screen.height,
        availWidth: screen.availWidth,
        availHeight: screen.availHeight,
      };

      return results;
    });

    console.log(
      "Browser fingerprint check:",
      JSON.stringify(detectionResults, null, 2)
    );

    // Wait a bit
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Now test with Garena
    console.log("\n=== Testing Garena Shop Access ===");

    const requestId = `stealth_test_${Date.now()}`;

    // Apply all stealth measures like the real automation
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
    });

    // Simulate real user browsing
    await AutomationService.simulateRealUserBrowsing(page, requestId);

    // Navigate to Garena Shop
    await page.goto("https://shop.garena.my/?app=100067&channel=202953", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    console.log("✅ Garena Shop navigation completed");

    // Check for CAPTCHA elements
    const captchaCheck = await page.evaluate(() => {
      const captchaSelectors = [
        'iframe[src*="captcha"]',
        'iframe[src*="recaptcha"]',
        ".captcha",
        ".verification",
        ".nc_wrapper",
        ".nc_scale",
        'div[id*="nc_"]',
        ".puzzle-verify",
        ".slider-verify",
      ];

      const found = [];
      captchaSelectors.forEach((selector) => {
        const element = document.querySelector(selector);
        if (element) {
          const isVisible =
            window.getComputedStyle(element).display !== "none" &&
            window.getComputedStyle(element).visibility !== "hidden" &&
            element.getBoundingClientRect().width > 0;
          if (isVisible) {
            found.push(selector);
          }
        }
      });

      return found;
    });

    console.log("\n=== CAPTCHA Detection Results ===");
    if (captchaCheck.length === 0) {
      console.log("🎉 NO CAPTCHA DETECTED! Stealth working perfectly!");
    } else {
      console.log("⚠️ CAPTCHA elements found:", captchaCheck);
    }

    // Check for player ID input (means page loaded successfully)
    const playerIdFound = await page.$(
      'input[placeholder="Please enter player ID here"]'
    );
    if (playerIdFound) {
      console.log(
        "✅ Player ID input found - page loaded successfully without CAPTCHA"
      );
    } else {
      console.log(
        "❌ Player ID input not found - may still be showing CAPTCHA or loading"
      );
    }

    // Take final screenshot
    await page.screenshot({
      path: `screenshots/garena-stealth-test-${Date.now()}.png`,
      fullPage: true,
    });
    console.log("📸 Final Garena screenshot taken");

    await page.close();
    await AutomationService.closeBrowser();

    console.log("\n" + "=".repeat(50));
    console.log("ENHANCED STEALTH TEST RESULTS");
    console.log("=".repeat(50));
    console.log(
      `Webdriver detected: ${detectionResults.webdriver ? "❌ YES" : "✅ NO"}`
    );
    console.log(
      `Plugins count: ${detectionResults.plugins} ${
        detectionResults.plugins > 0 ? "✅" : "❌"
      }`
    );
    console.log(
      `Chrome object: ${detectionResults.chrome ? "✅ YES" : "❌ NO"}`
    );
    console.log(
      `Languages: ${detectionResults.languages?.length || 0} ${
        detectionResults.languages?.length > 1 ? "✅" : "❌"
      }`
    );
    console.log(
      `CAPTCHA detected: ${captchaCheck.length > 0 ? "❌ YES" : "✅ NO"}`
    );
    console.log(`Page loaded: ${playerIdFound ? "✅ YES" : "❌ NO"}`);
    console.log("=".repeat(50));

    if (captchaCheck.length === 0 && playerIdFound) {
      console.log(
        "\n🎉 SUCCESS! Your stealth configuration is working perfectly!"
      );
      console.log("💡 No CAPTCHAs should appear with this setup.");
    } else {
      console.log(
        "\n⚠️ Stealth needs improvement. Check the screenshots for details."
      );
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);

    try {
      await AutomationService.closeBrowser();
    } catch (cleanupError) {
      console.error("Cleanup error:", cleanupError.message);
    }
  }
}

testEnhancedStealth().catch(console.error);
