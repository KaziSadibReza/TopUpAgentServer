const puppeteer = require("puppeteer");

async function testSOCKS5Proxy() {
  console.log("🔄 Testing SOCKS5 proxy connection...");

  const proxyServer = "socks5://BK:BK@59.153.18.230:1052";

  let browser = null;
  let page = null;

  try {
    console.log("📡 Connecting with SOCKS5 proxy:", proxyServer);

    // Launch browser with SOCKS5 proxy
    browser = await puppeteer.launch({
      headless: false, // Set to false to see what's happening
      args: [
        `--proxy-server=${proxyServer}`,
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--window-size=1366,768",
      ],
      defaultViewport: null,
      timeout: 60000,
    });

    console.log("✅ Browser launched with SOCKS5 proxy!");

    // Create a new page
    console.log("📄 Creating new page...");
    page = await browser.newPage();

    // Set user agent
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    );

    console.log("🌐 Testing IP detection...");

    // Test 1: Check current IP
    await page.goto("https://httpbin.org/ip", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    console.log("✅ Successfully navigated to IP check service!");

    // Get the IP information
    const ipInfo = await page.evaluate(() => {
      return document.body.innerText;
    });

    console.log("🌍 Current IP information:", ipInfo);

    // Test 2: Check with another IP service
    console.log("🔍 Double-checking with another service...");

    await page.goto("https://api.ipify.org?format=json", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    const ipInfo2 = await page.evaluate(() => {
      return document.body.innerText;
    });

    console.log("🌍 IP from second service:", ipInfo2);

    // Test 3: Test Garena Shop access
    console.log("🎮 Testing Garena Shop access...");

    await page.goto("https://shop.garena.my/?app=100067&channel=202953", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    console.log("✅ Successfully accessed Garena Shop!");

    // Check if the page loaded correctly
    const title = await page.title();
    console.log("📜 Garena Shop page title:", title);

    // Check for the player ID input field
    try {
      await page.waitForSelector(
        'input[placeholder="Please enter player ID here"]',
        { timeout: 10000 }
      );
      console.log("✅ Player ID input field found on Garena Shop!");
    } catch (error) {
      console.log("⚠️ Player ID input field not found:", error.message);
    }

    // Take a screenshot
    await page.screenshot({
      path: `screenshots/proxy-test-${Date.now()}.png`,
      fullPage: true,
    });
    console.log("📸 Screenshot saved!");

    console.log("🎉 SOCKS5 proxy test completed successfully!");

    // Determine if proxy is working
    const parsedIp = JSON.parse(ipInfo);
    const currentIp = parsedIp.origin;

    if (currentIp !== "YOUR_VPS_IP_HERE") {
      // Replace with your actual VPS IP if you know it
      console.log(
        "✅ PROXY IS WORKING! Your traffic is being routed through:",
        currentIp
      );
    } else {
      console.log("⚠️ Proxy might not be working - check the IP above");
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error("📝 Error details:", error);

    // Common proxy issues
    if (error.message.includes("ERR_PROXY_CONNECTION_FAILED")) {
      console.error("🔧 PROXY CONNECTION FAILED - Check:");
      console.error("   - Proxy server is running: 59.153.18.230:1052");
      console.error("   - Credentials are correct: BK:BK");
      console.error("   - Network allows SOCKS5 connections");
    }

    if (error.message.includes("ERR_TUNNEL_CONNECTION_FAILED")) {
      console.error("🔧 TUNNEL CONNECTION FAILED - Check:");
      console.error("   - Proxy authentication (username/password)");
      console.error("   - Proxy server is accepting connections");
    }
  } finally {
    // Clean up
    if (page) {
      try {
        await page.close();
        console.log("📄 Page closed");
      } catch (e) {
        console.error("⚠️ Error closing page:", e.message);
      }
    }

    if (browser) {
      try {
        await browser.close();
        console.log("🌐 Browser closed");
      } catch (e) {
        console.error("⚠️ Error closing browser:", e.message);
      }
    }
  }
}

// Run the test
testSOCKS5Proxy()
  .then(() => {
    console.log("🏁 Proxy test execution completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Unhandled error:", error);
    process.exit(1);
  });
