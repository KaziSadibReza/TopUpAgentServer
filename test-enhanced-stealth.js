const AutomationService = require("./src/services/AutomationService");

async function testEnhancedStealth() {
  console.log("🚀 TESTING ENHANCED MOBILE STEALTH CONFIGURATION");
  console.log("================================================");

  const automationService = new AutomationService();

  try {
    // Test 1: Browser Initialization with Advanced Stealth
    console.log("📱 Test 1: Enhanced Mobile Browser Initialization...");
    await automationService.initBrowser();

    const browser = automationService.browser;
    const page = await browser.newPage();

    // Test 2: Anti-Detection Properties Check
    console.log("🔍 Test 2: Anti-Detection Properties Verification...");

    const detectionResults = await page.evaluate(() => {
      const results = {
        webdriver: navigator.webdriver,
        platform: navigator.platform,
        userAgent: navigator.userAgent,
        maxTouchPoints: navigator.maxTouchPoints,
        hardwareConcurrency: navigator.hardwareConcurrency,
        deviceMemory: navigator.deviceMemory,
        connection: navigator.connection?.effectiveType,
        viewport: { width: window.innerWidth, height: window.innerHeight },
        plugins: navigator.plugins.length,
        languages: navigator.languages,
        automationTraces: {
          phantom: !!window.phantom,
          callPhantom: !!window.callPhantom,
          spawned: !!window.spawned,
          domAutomation: !!window.domAutomation,
          webdriverEvaluate: !!window.__webdriver_evaluate,
          seleniumEvaluate: !!window.__selenium_evaluate,
        },
      };
      return results;
    });

    console.log("✅ Anti-Detection Results:");
    console.log(
      `   Webdriver: ${
        detectionResults.webdriver === undefined ? "HIDDEN ✅" : "DETECTED ❌"
      }`
    );
    console.log(
      `   Platform: ${detectionResults.platform} ${
        detectionResults.platform === "iPhone" ? "✅" : "❌"
      }`
    );
    console.log(
      `   Touch Points: ${detectionResults.maxTouchPoints} ${
        detectionResults.maxTouchPoints === 5 ? "✅" : "❌"
      }`
    );
    console.log(
      `   Hardware Cores: ${detectionResults.hardwareConcurrency} ${
        detectionResults.hardwareConcurrency === 6 ? "✅" : "❌"
      }`
    );
    console.log(
      `   Device Memory: ${detectionResults.deviceMemory}GB ${
        detectionResults.deviceMemory === 6 ? "✅" : "❌"
      }`
    );
    console.log(
      `   Connection: ${detectionResults.connection} ${
        detectionResults.connection === "4g" ? "✅" : "❌"
      }`
    );
    console.log(
      `   Viewport: ${detectionResults.viewport.width}x${
        detectionResults.viewport.height
      } ${
        detectionResults.viewport.width === 375 &&
        detectionResults.viewport.height === 812
          ? "✅"
          : "❌"
      }`
    );
    console.log(
      `   Plugins: ${detectionResults.plugins} ${
        detectionResults.plugins === 0 ? "✅" : "❌"
      }`
    );
    console.log(
      `   Languages: ${detectionResults.languages.join(", ")} ${
        detectionResults.languages.includes("ms") ? "✅" : "❌"
      }`
    );

    // Check automation traces
    const traceKeys = Object.keys(detectionResults.automationTraces);
    const cleanTraces = traceKeys.every(
      (key) => !detectionResults.automationTraces[key]
    );
    console.log(
      `   Automation Traces: ${cleanTraces ? "CLEAN ✅" : "DETECTED ❌"}`
    );

    // Test 3: Garena Access Test
    console.log("\n🌐 Test 3: Garena Malaysia Access Test...");

    try {
      // Test with human-like behavior
      console.log("   Simulating human behavior...");
      await automationService.simulateHumanBehavior(page);

      await page.goto("https://shop.garena.my/?app=100067&channel=202953", {
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      // Check for access blocked message
      const accessBlocked = await page.evaluate(() => {
        const body = document.body.innerText.toLowerCase();
        return (
          body.includes("access blocked") ||
          body.includes("unusual activity") ||
          body.includes("automated") ||
          body.includes("bot activity") ||
          body.includes("please verify")
        );
      });

      if (accessBlocked) {
        console.log("❌ ACCESS STILL BLOCKED - Enhanced stealth insufficient");

        // Take screenshot for debugging
        await page.screenshot({
          path: `screenshots/enhanced-stealth-blocked-${Date.now()}.png`,
          fullPage: true,
        });

        return false;
      }

      // Check for reCAPTCHA
      const reCaptchaFound = await page.evaluate(() => {
        return (
          document.querySelector(".g-recaptcha") !== null ||
          document.querySelector("#recaptcha") !== null ||
          document.querySelector("[data-sitekey]") !== null
        );
      });

      // Check for player ID input (indicates successful page load)
      const playerInputFound = await page
        .waitForSelector('input[placeholder="Please enter player ID here"]', {
          timeout: 10000,
        })
        .then(() => true)
        .catch(() => false);

      console.log("✅ ENHANCED STEALTH RESULTS:");
      console.log(
        `   🚫 Access Blocked: ${!accessBlocked ? "NO ✅" : "YES ❌"}`
      );
      console.log(
        `   🤖 reCAPTCHA: ${!reCaptchaFound ? "BYPASSED ✅" : "PRESENT ❌"}`
      );
      console.log(
        `   🎮 Player Input: ${
          playerInputFound ? "ACCESSIBLE ✅" : "BLOCKED ❌"
        }`
      );

      const success = !accessBlocked && !reCaptchaFound && playerInputFound;

      if (success) {
        console.log(
          "\n🎉 SUCCESS: Enhanced Mobile Stealth Configuration WORKING!"
        );
        console.log("🚀 Ready for server deployment!");
      } else {
        console.log("\n⚠️  WARNING: Additional stealth measures may be needed");
      }

      return success;
    } catch (error) {
      console.log(`❌ Garena access failed: ${error.message}`);
      return false;
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    return false;
  } finally {
    if (automationService.browser) {
      await automationService.browser.close();
    }
  }
}

// Run the test
testEnhancedStealth()
  .then((success) => {
    if (success) {
      console.log(
        "\n✅ ALL TESTS PASSED - Enhanced stealth ready for production!"
      );
      process.exit(0);
    } else {
      console.log("\n❌ TESTS FAILED - Additional optimization needed");
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error("Test execution failed:", error);
    process.exit(1);
  });
