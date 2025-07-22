const puppeteer = require("puppeteer");
const useProxy = require("puppeteer-page-proxy");

async function testPuppeteerPageProxy() {
  console.log("Testing puppeteer-page-proxy with SOCKS5...");

  let browser;
  let page;

  try {
    // Launch browser without proxy args
    browser = await puppeteer.launch({
      headless: false, // Show browser for debugging
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-web-security",
        "--window-size=1366,768",
      ],
      defaultViewport: null,
    });

    console.log("Browser launched successfully");

    // Create new page
    page = await browser.newPage();
    console.log("Page created");

    // Set up proxy using puppeteer-page-proxy
    const proxyConfig = "socks5://BK:BK@59.153.18.230:1052";
    console.log(`Setting up proxy: ${proxyConfig}`);

    await useProxy(page, proxyConfig);
    console.log("Proxy configured successfully");

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

    // Test 3: Try Garena Shop
    console.log("\n=== Test 3: Garena Shop Access ===");
    try {
      await page.goto("https://shop.garena.my/?app=100067&channel=202953", {
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      const title = await page.title();
      console.log("Garena Shop Title:", title);

      // Take screenshot
      await page.screenshot({
        path: `screenshots/garena-with-proxy-${Date.now()}.png`,
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
  }
}

// Run the test
testPuppeteerPageProxy().catch(console.error);
