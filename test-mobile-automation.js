const AutomationService = require("./src/services/AutomationService");

async function testMobileAutomation() {
  console.log("📱 TESTING MOBILE AUTOMATION SERVICE");
  console.log("==================================================");
  console.log("Strategy: Mobile iOS Safari simulation");
  console.log("Device: iPhone 13 Pro (iOS 15.6.1)");
  console.log("Goal: Bypass reCAPTCHA detection on server");
  console.log("");

  try {
    // Test browser initialization
    console.log("🔧 Testing mobile browser initialization...");
    const browser = await AutomationService.initBrowser();
    console.log("✅ Mobile browser initialized successfully");

    // Create a test page
    console.log("📱 Creating mobile page...");
    const page = await browser.newPage();

    // Test mobile navigation
    console.log("🌐 Testing mobile navigation to Garena...");
    await page.goto("https://shop.garena.my/?app=100067&channel=202953", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    // Check page title
    const title = await page.title();
    console.log(`📄 Page Title: ${title}`);

    // Check if blocked or reCAPTCHA appears
    const isBlocked =
      (await page.$(".blocked")) ||
      (await page.$("#captcha")) ||
      (await page.$(".g-recaptcha"));
    console.log(
      `🛡️ Blocked/reCAPTCHA: ${
        isBlocked ? "❌ YES - DETECTED" : "✅ NO - BYPASSED"
      }`
    );

    // Check for player input field
    const playerInput = await page.$('input[placeholder*="player"]');
    console.log(
      `🎮 Player Input: ${playerInput ? "✅ Found" : "❌ Not Found"}`
    );

    // Mobile verification
    const mobileCheck = await page.evaluate(() => {
      return {
        isMobile: navigator.userAgent.includes("iPhone"),
        platform: navigator.platform,
        touchPoints: navigator.maxTouchPoints,
        vendor: navigator.vendor,
        plugins: navigator.plugins.length,
        webdriver: navigator.webdriver,
      };
    });

    console.log("📱 Mobile Verification:");
    console.log(
      `   User Agent: ${mobileCheck.isMobile ? "✅ iPhone" : "❌ Desktop"}`
    );
    console.log(`   Platform: ${mobileCheck.platform}`);
    console.log(`   Touch Points: ${mobileCheck.touchPoints}`);
    console.log(`   Vendor: ${mobileCheck.vendor}`);
    console.log(`   Plugins: ${mobileCheck.plugins}`);
    console.log(`   WebDriver: ${mobileCheck.webdriver}`);

    // Take screenshot
    const screenshotPath = `screenshots/mobile-automation-test-${Date.now()}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 Screenshot: ${screenshotPath}`);

    // Clean up
    await page.close();
    await AutomationService.closeBrowser();

    console.log("");
    if (!isBlocked && playerInput && mobileCheck.isMobile) {
      console.log("🎉 SUCCESS: Mobile automation ready for server deployment!");
      console.log("✅ reCAPTCHA bypass: WORKING");
      console.log("✅ Mobile simulation: ACTIVE");
      console.log("✅ Player input access: AVAILABLE");
    } else {
      console.log("⚠️ WARNING: Some issues detected");
      if (isBlocked) console.log("❌ reCAPTCHA/blocking detected");
      if (!playerInput) console.log("❌ Player input field not accessible");
      if (!mobileCheck.isMobile)
        console.log("❌ Mobile simulation not working");
    }
  } catch (error) {
    console.error("❌ Mobile automation test failed:", error.message);

    try {
      await AutomationService.closeBrowser();
    } catch (cleanupError) {
      console.error("Cleanup error:", cleanupError.message);
    }
  }
}

testMobileAutomation();
