const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const ProxyChain = require("proxy-chain");

puppeteer.use(StealthPlugin());

async function testDirectAccess() {
  console.log("🔧 TESTING DIRECT ACCESS - NETWORK DIAGNOSTICS");
  console.log("=".repeat(50));

  let browser;
  let proxyUrl;

  try {
    // Test proxy connection first
    console.log("🔗 Testing proxy connection...");
    const originalProxy = "socks5://BK:BK@59.153.18.230:1052";
    proxyUrl = await ProxyChain.anonymizeProxy(originalProxy);
    console.log(`✅ Proxy tunnel created: ${proxyUrl}`);

    // Launch minimal browser
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        `--proxy-server=${proxyUrl}`,
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
      timeout: 60000,
    });

    const page = await browser.newPage();

    // Test basic connectivity
    console.log("🌐 Testing basic connectivity...");

    try {
      await page.goto("https://httpbin.org/ip", { timeout: 15000 });
      const ipInfo = await page.evaluate(() => document.body.innerText);
      console.log("✅ Proxy IP test result:", ipInfo);
    } catch (e) {
      console.log("❌ Basic connectivity failed:", e.message);
      return;
    }

    // Test Google access
    console.log("🔍 Testing Google access...");
    try {
      await page.goto("https://www.google.com", { timeout: 15000 });
      console.log("✅ Google access successful");
    } catch (e) {
      console.log("❌ Google access failed:", e.message);
    }

    // Test direct Garena access with different approaches
    console.log("🎯 Testing Garena Shop access patterns...");

    // Approach 1: Direct access
    console.log("   📍 Approach 1: Direct URL access");
    try {
      await page.goto("https://shop.garena.my/", {
        waitUntil: "domcontentloaded",
        timeout: 20000,
      });

      const status1 = await page.evaluate(() => ({
        title: document.title,
        blocked:
          document.body.innerText.includes("Access blocked") ||
          document.body.innerText.includes("unusual activity"),
        content: document.body.innerText.substring(0, 200),
      }));

      console.log(
        "   Result 1:",
        status1.blocked ? "❌ Blocked" : "✅ Success"
      );
      if (status1.blocked) console.log("   Block reason:", status1.content);
    } catch (e) {
      console.log("   Result 1: ❌ Failed -", e.message);
    }

    // Approach 2: With specific game parameters
    console.log("   📍 Approach 2: With Free Fire parameters");
    try {
      await page.goto("https://shop.garena.my/?app=100067&channel=202953", {
        waitUntil: "domcontentloaded",
        timeout: 20000,
      });

      const status2 = await page.evaluate(() => ({
        title: document.title,
        blocked:
          document.body.innerText.includes("Access blocked") ||
          document.body.innerText.includes("unusual activity"),
        content: document.body.innerText.substring(0, 200),
        hasPlayerInput: !!document.querySelector(
          'input[placeholder*="player"]'
        ),
      }));

      console.log(
        "   Result 2:",
        status2.blocked ? "❌ Blocked" : "✅ Success"
      );
      if (status2.blocked) console.log("   Block reason:", status2.content);
      if (status2.hasPlayerInput)
        console.log("   ✅ Player input field found!");
    } catch (e) {
      console.log("   Result 2: ❌ Failed -", e.message);
    }

    // Approach 3: Different headers
    console.log("   📍 Approach 3: Modified headers");
    try {
      await page.setExtraHTTPHeaders({
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        DNT: "1",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
      });

      await page.goto("https://shop.garena.my/?app=100067&channel=202953", {
        waitUntil: "domcontentloaded",
        timeout: 20000,
      });

      const status3 = await page.evaluate(() => ({
        title: document.title,
        blocked:
          document.body.innerText.includes("Access blocked") ||
          document.body.innerText.includes("unusual activity"),
        content: document.body.innerText.substring(0, 200),
        hasPlayerInput: !!document.querySelector(
          'input[placeholder*="player"]'
        ),
      }));

      console.log(
        "   Result 3:",
        status3.blocked ? "❌ Blocked" : "✅ Success"
      );
      if (status3.blocked) console.log("   Block reason:", status3.content);
      if (status3.hasPlayerInput)
        console.log("   ✅ Player input field found!");
    } catch (e) {
      console.log("   Result 3: ❌ Failed -", e.message);
    }

    // Take final screenshot
    const screenshotPath = `screenshots/diagnostic-${Date.now()}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 Diagnostic screenshot: ${screenshotPath}`);

    // Additional network diagnostics
    console.log("\n🔬 Network Diagnostics:");

    const networkInfo = await page.evaluate(() => ({
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      onLine: navigator.onLine,
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack,
      plugins: navigator.plugins.length,
      connection: navigator.connection
        ? {
            effectiveType: navigator.connection.effectiveType,
            downlink: navigator.connection.downlink,
            rtt: navigator.connection.rtt,
          }
        : "not available",
    }));

    console.log("   Browser Info:", networkInfo);
  } catch (error) {
    console.error("❌ Diagnostic test failed:", error.message);
  } finally {
    if (browser) {
      await browser.close();
      console.log("🔒 Browser closed");
    }

    if (proxyUrl) {
      try {
        await ProxyChain.closeAnonymizedProxy(proxyUrl, true);
        console.log("🔗 Proxy chain closed");
      } catch (e) {
        console.log("Warning: Failed to close proxy chain");
      }
    }
  }
}

testDirectAccess().catch(console.error);
