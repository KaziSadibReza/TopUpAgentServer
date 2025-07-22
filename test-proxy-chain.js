const puppeteer = require("puppeteer");
const ProxyChain = require("proxy-chain");

async function testProxyChain() {
  console.log("Testing proxy-chain with SOCKS5...");

  let browser;
  let page;
  let proxyUrl;

  try {
    // SOCKS5 proxy configuration
    const originalProxy = "socks5://BK:BK@59.153.18.230:1052";
    console.log(`Original SOCKS5 proxy: ${originalProxy}`);

    // Create HTTP proxy server that forwards to SOCKS5
    proxyUrl = await ProxyChain.anonymizeProxy(originalProxy);
    console.log(`Created HTTP proxy tunnel: ${proxyUrl}`);

    // Launch browser with the HTTP proxy
    browser = await puppeteer.launch({
      headless: false, // Show browser for debugging
      args: [
        `--proxy-server=${proxyUrl}`,
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-web-security",
        "--window-size=1366,768",
      ],
      defaultViewport: null,
    });

    console.log("Browser launched successfully with proxy");

    // Create new page
    page = await browser.newPage();
    console.log("Page created");

    // Test 1: Check IP address
    console.log("\n=== Test 1: IP Address Check ===");
    await page.goto("https://httpbin.org/ip", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    const ipResult = await page.evaluate(() => document.body.innerText);
    console.log("IP Check Result:", ipResult);

    // Test 2: Check headers and IP
    console.log("\n=== Test 2: Headers Check ===");
    await page.goto("https://httpbin.org/headers", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    const headersResult = await page.evaluate(() => document.body.innerText);
    console.log("Headers Result:", headersResult);

    // Test 3: Check different IP service
    console.log("\n=== Test 3: Alternative IP Check ===");
    try {
      await page.goto("https://api.ipify.org?format=json", {
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      const ipifyResult = await page.evaluate(() => document.body.innerText);
      console.log("Ipify Result:", ipifyResult);
    } catch (ipifyError) {
      console.log("Ipify failed:", ipifyError.message);
    }

    // Test 4: Try Garena Shop
    console.log("\n=== Test 4: Garena Shop Access ===");
    try {
      await page.goto("https://shop.garena.my/?app=100067&channel=202953", {
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      const title = await page.title();
      console.log("Garena Shop Title:", title);

      // Check if page loaded properly
      const bodyText = await page.evaluate(() => document.body.innerText);
      if (bodyText.includes("Free Fire") || bodyText.includes("Garena")) {
        console.log("✅ Garena Shop loaded successfully!");
      } else {
        console.log("⚠️ Garena Shop loaded but content may be different");
      }

      // Take screenshot
      await page.screenshot({
        path: `screenshots/garena-proxy-chain-${Date.now()}.png`,
        fullPage: true,
      });
      console.log("Screenshot saved");
    } catch (garenaError) {
      console.error("Garena Shop Error:", garenaError.message);
    }

    console.log("\n✅ All tests completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error("Error details:", error);
  } finally {
    if (page) {
      await page.close();
    }
    if (browser) {
      await browser.close();
    }

    // Clean up proxy-chain
    if (proxyUrl) {
      try {
        await ProxyChain.closeAnonymizedProxy(proxyUrl, true);
        console.log("Proxy chain closed");
      } catch (error) {
        console.error("Failed to close proxy chain:", error.message);
      }
    }
  }
}

// Run the test
testProxyChain().catch(console.error);
