// Test automation service with proxy
const AutomationService = require("./src/services/AutomationService");

async function testAutomationWithProxy() {
  console.log("Testing AutomationService with proxy-chain...");

  try {
    // Initialize browser with proxy
    const browser = await AutomationService.initBrowser();
    console.log("✅ Browser initialized with proxy");

    // Create a test page
    const page = await browser.newPage();
    console.log("✅ Page created");

    // Test IP check
    await page.goto("https://httpbin.org/ip");
    const ipResult = await page.evaluate(() => document.body.innerText);
    console.log("Current IP:", ipResult);

    // Test Garena access
    await page.goto("https://shop.garena.my/?app=100067&channel=202953", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    const title = await page.title();
    console.log("Garena Shop Title:", title);

    await page.close();
    console.log("✅ Page closed");

    // Clean up
    await AutomationService.closeBrowser();
    console.log("✅ Browser and proxy cleaned up");

    console.log("\n🎉 AutomationService with proxy is ready!");
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

testAutomationWithProxy().catch(console.error);
