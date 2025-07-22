// Test CAPTCHA handling
const AutomationService = require("./src/services/AutomationService");

async function testCaptchaHandling() {
  console.log("Testing CAPTCHA handling with enhanced anti-detection...");

  try {
    // Initialize browser with proxy and anti-detection
    const browser = await AutomationService.initBrowser();
    console.log("✅ Browser initialized with proxy and anti-detection");

    // Create a test page
    const page = await browser.newPage();
    console.log("✅ Page created");

    // Test with a fake player ID to trigger the flow
    const testPlayerId = "123456789";
    const requestId = `test_captcha_${Date.now()}`;

    // Set up page like the automation does
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    await page.setViewport({ width: 1366, height: 768 });

    // Enhanced anti-detection
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", {
        get: () => undefined,
      });

      Object.defineProperty(navigator, "plugins", {
        get: () => [1, 2, 3, 4, 5],
      });

      window.chrome = {
        runtime: {},
        loadTimes: function () {},
        csi: function () {},
        app: {},
      };
    });

    console.log("🔄 Navigating to Garena Shop...");
    await page.goto("https://shop.garena.my/?app=100067&channel=202953", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    // Take screenshot
    await page.screenshot({
      path: `screenshots/test-captcha-${Date.now()}.png`,
      fullPage: true,
    });
    console.log("📸 Screenshot taken");

    // Test CAPTCHA detection and handling
    console.log("🔍 Testing CAPTCHA detection...");
    await AutomationService.handleCaptchaIfPresent(page, requestId);

    // Try to find the player ID input
    try {
      await page.waitForSelector(
        'input[placeholder="Please enter player ID here"]',
        {
          timeout: 10000,
        }
      );
      console.log("✅ Player ID input found - page loaded successfully");

      // Test human-like typing
      console.log("⌨️ Testing human-like typing...");
      await page.click('input[placeholder="Please enter player ID here"]');

      // Type with human-like delays
      for (let i = 0; i < testPlayerId.length; i++) {
        await page.keyboard.type(testPlayerId[i]);
        await new Promise((resolve) =>
          setTimeout(resolve, 100 + Math.random() * 200)
        );
      }

      console.log("✅ Human-like typing test completed");
    } catch (error) {
      console.log(
        "⚠️ Player ID input not found - may still be on CAPTCHA or loading"
      );
    }

    // Final screenshot
    await page.screenshot({
      path: `screenshots/test-captcha-final-${Date.now()}.png`,
      fullPage: true,
    });

    await page.close();
    console.log("✅ Page closed");

    // Clean up
    await AutomationService.closeBrowser();
    console.log("✅ Browser and proxy cleaned up");

    console.log("\n🎉 CAPTCHA handling test completed!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);

    // Clean up on error
    try {
      await AutomationService.closeBrowser();
    } catch (cleanupError) {
      console.error("Cleanup error:", cleanupError.message);
    }
  }
}

testCaptchaHandling().catch(console.error);
