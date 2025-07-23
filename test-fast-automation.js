const AutomationService = require("./src/services/AutomationService");

async function testFastAutomation() {
  console.log("🚀 TESTING FAST AUTOMATION WITH BRIGHT DATA");

  try {
    // Test browser connection
    console.log("📡 Testing Bright Data connection...");
    await AutomationService.initBrowser();
    console.log("✅ Connected to Bright Data Browser API");

    // Test Garena access
    console.log("🌐 Testing Garena access...");
    const browser = AutomationService.browser;
    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 15_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6 Mobile/15E148 Safari/604.1"
    );
    await page.setViewport({
      width: 375,
      height: 812,
      deviceScaleFactor: 3,
      hasTouch: true,
      isMobile: true,
    });

    await page.goto("https://shop.garena.my/?app=100067&channel=202953", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    // Check for access blocked
    const accessBlocked = await page.evaluate(() => {
      const body = document.body.innerText.toLowerCase();
      return (
        body.includes("access blocked") || body.includes("unusual activity")
      );
    });

    // Check for player input
    const playerInputFound = await page
      .waitForSelector('input[placeholder="Please enter player ID here"]', {
        timeout: 10000,
      })
      .then(() => true)
      .catch(() => false);

    await page.close();
    await AutomationService.closeBrowser();

    console.log("📊 RESULTS:");
    console.log(`   Access Blocked: ${accessBlocked ? "YES ❌" : "NO ✅"}`);
    console.log(
      `   Player Input: ${playerInputFound ? "FOUND ✅" : "NOT FOUND ❌"}`
    );

    if (!accessBlocked && playerInputFound) {
      console.log("🎉 SUCCESS: Fast automation ready!");
      return true;
    } else {
      console.log("❌ FAILED: Issues detected");
      return false;
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    return false;
  }
}

testFastAutomation()
  .then((success) => {
    console.log(success ? "\n✅ READY FOR PRODUCTION" : "\n❌ NEEDS ATTENTION");
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("Test execution failed:", error);
    process.exit(1);
  });
