const puppeteer = require("puppeteer");

async function testProxyWithWebRequests() {
  console.log("🔄 Testing SOCKS5 proxy with actual web requests...");

  const proxyServer = "socks5://BK:BK@59.153.18.230:1052";

  let browser = null;
  let page = null;

  try {
    console.log("📡 Launching browser with SOCKS5 proxy...");

    browser = await puppeteer.launch({
      headless: true,
      args: [
        `--proxy-server=${proxyServer}`,
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-web-security", // Try with disabled security
        "--ignore-certificate-errors", // Ignore SSL errors
        "--ignore-ssl-errors", // Ignore SSL errors
        "--allow-running-insecure-content", // Allow insecure content
      ],
      timeout: 60000,
    });

    console.log("✅ Browser launched successfully!");

    page = await browser.newPage();

    // Test 1: Try HTTP first (no SSL)
    console.log("🌐 Testing HTTP request (no SSL)...");
    try {
      await page.goto("http://httpbin.org/ip", {
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      const ipInfo = await page.evaluate(() => document.body.innerText);
      console.log("✅ HTTP request successful!");
      console.log("🌍 IP info:", ipInfo);
    } catch (httpError) {
      console.log("❌ HTTP request failed:", httpError.message);
    }

    // Test 2: Try HTTPS
    console.log("\n🔒 Testing HTTPS request...");
    try {
      await page.goto("https://httpbin.org/ip", {
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      const ipInfo = await page.evaluate(() => document.body.innerText);
      console.log("✅ HTTPS request successful!");
      console.log("🌍 IP info:", ipInfo);
    } catch (httpsError) {
      console.log("❌ HTTPS request failed:", httpsError.message);
    }

    // Test 3: Try a different HTTPS site
    console.log("\n🎮 Testing Garena Shop (HTTPS)...");
    try {
      await page.goto("https://shop.garena.my", {
        waitUntil: "domcontentloaded", // Less strict waiting
        timeout: 30000,
      });

      const title = await page.title();
      console.log("✅ Garena Shop accessible!");
      console.log("📜 Page title:", title);
    } catch (garenaError) {
      console.log("❌ Garena Shop failed:", garenaError.message);
    }

    // Test 4: Try with different user agent
    console.log("\n🕵️ Testing with different user agent...");
    try {
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      );

      await page.goto("https://api.ipify.org?format=json", {
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      const ipInfo = await page.evaluate(() => document.body.innerText);
      console.log("✅ Request with user agent successful!");
      console.log("🌍 IP info:", ipInfo);
    } catch (uaError) {
      console.log("❌ Request with user agent failed:", uaError.message);
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);

    // Provide specific troubleshooting
    if (error.message.includes("ERR_NO_SUPPORTED_PROXIES")) {
      console.log("\n🔧 ERR_NO_SUPPORTED_PROXIES - Try:");
      console.log("1. Check if the proxy supports HTTPS connections");
      console.log("2. Verify SOCKS5 proxy authentication");
      console.log("3. Try using the proxy as HTTP instead of SOCKS5");
    }

    if (error.message.includes("ERR_PROXY_CONNECTION_FAILED")) {
      console.log("\n🔧 ERR_PROXY_CONNECTION_FAILED - Try:");
      console.log("1. Check proxy server status");
      console.log("2. Verify credentials (BK:BK)");
      console.log("3. Check network connectivity");
    }
  } finally {
    if (page) await page.close();
    if (browser) await browser.close();
  }
}

// Test without proxy for comparison
async function testWithoutProxy() {
  console.log("\n📋 Testing without proxy for comparison...");

  let browser = null;
  let page = null;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    page = await browser.newPage();

    await page.goto("https://api.ipify.org?format=json", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    const ipInfo = await page.evaluate(() => document.body.innerText);
    console.log("✅ Without proxy - IP info:", ipInfo);
  } catch (error) {
    console.log("❌ Without proxy failed:", error.message);
  } finally {
    if (page) await page.close();
    if (browser) await browser.close();
  }
}

// Run tests
async function runTests() {
  await testProxyWithWebRequests();
  await testWithoutProxy();
  console.log("\n🏁 All tests completed");
}

runTests().catch(console.error);
