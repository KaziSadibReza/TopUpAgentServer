const puppeteer = require("puppeteer");

async function testHTTPProxyFormat() {
  console.log("🔄 Testing HTTP proxy format...");

  const proxyServer = "http://BK:BK@59.153.18.230:1052";

  let browser = null;
  let page = null;

  try {
    console.log("📡 Launching browser with HTTP proxy format...");

    browser = await puppeteer.launch({
      headless: false, // Show browser to see what happens
      args: [
        `--proxy-server=${proxyServer}`,
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-web-security",
        "--ignore-certificate-errors",
        "--ignore-ssl-errors",
        "--allow-running-insecure-content",
        "--window-size=1366,768",
      ],
      timeout: 60000,
    });

    console.log("✅ Browser launched successfully with HTTP proxy!");

    page = await browser.newPage();

    // Set user agent
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    );

    console.log("🌐 Testing IP detection with HTTP proxy...");

    // Test IP detection
    await page.goto("https://api.ipify.org?format=json", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    const ipInfo = await page.evaluate(() => document.body.innerText);
    console.log("✅ IP detection successful!");
    console.log("🌍 Your IP through proxy:", ipInfo);

    // Test Garena Shop
    console.log("🎮 Testing Garena Shop access...");

    await page.goto("https://shop.garena.my/?app=100067&channel=202953", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    const title = await page.title();
    console.log("✅ Garena Shop accessible!");
    console.log("📜 Page title:", title);

    // Check for player ID input
    try {
      await page.waitForSelector(
        'input[placeholder="Please enter player ID here"]',
        { timeout: 10000 }
      );
      console.log("✅ Player ID input field found!");
    } catch (e) {
      console.log("⚠️ Player ID input field not found immediately");
    }

    // Take screenshot
    await page.screenshot({
      path: `screenshots/http-proxy-test-${Date.now()}.png`,
      fullPage: true,
    });
    console.log("📸 Screenshot saved!");

    console.log("🎉 HTTP proxy test completed successfully!");
  } catch (error) {
    console.error("❌ HTTP proxy test failed:", error.message);

    if (error.message.includes("ERR_NO_SUPPORTED_PROXIES")) {
      console.log("🔧 The proxy server might not support HTTP protocol");
      console.log("🔧 Try contacting your proxy provider for HTTP support");
    }
  } finally {
    if (page) await page.close();
    if (browser) await browser.close();
  }
}

testHTTPProxyFormat().catch(console.error);
