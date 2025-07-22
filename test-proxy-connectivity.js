const net = require("net");

async function testProxyConnectivity() {
  console.log("🔍 Testing basic connectivity to SOCKS5 proxy...");

  const proxyHost = "59.153.18.230";
  const proxyPort = 1052;

  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    const timeout = 10000; // 10 seconds

    // Set timeout
    socket.setTimeout(timeout);

    socket.on("connect", () => {
      console.log("✅ Successfully connected to proxy server!");
      console.log(`✅ ${proxyHost}:${proxyPort} is reachable`);
      socket.destroy();
      resolve(true);
    });

    socket.on("timeout", () => {
      console.log("❌ Connection timeout - proxy server not responding");
      socket.destroy();
      reject(new Error("Connection timeout"));
    });

    socket.on("error", (error) => {
      console.log("❌ Connection error:", error.message);
      if (error.code === "ECONNREFUSED") {
        console.log("❌ Connection refused - proxy server might be down");
      } else if (error.code === "ENOTFOUND") {
        console.log("❌ Host not found - check the proxy server address");
      } else if (error.code === "ETIMEDOUT") {
        console.log("❌ Connection timeout - proxy server not responding");
      }
      reject(error);
    });

    console.log(`🔗 Attempting to connect to ${proxyHost}:${proxyPort}...`);
    socket.connect(proxyPort, proxyHost);
  });
}

async function testAlternativeProxyFormats() {
  console.log("\n🧪 Testing alternative proxy configurations...");

  const puppeteer = require("puppeteer");

  // Test different proxy formats
  const proxyFormats = [
    "socks5://BK:BK@59.153.18.230:1052",
    "socks://BK:BK@59.153.18.230:1052",
    "--proxy-server=socks5://59.153.18.230:1052 --proxy-auth=BK:BK",
    "http://BK:BK@59.153.18.230:1052", // Try as HTTP proxy
  ];

  for (const proxyFormat of proxyFormats) {
    console.log(`\n🔬 Testing format: ${proxyFormat}`);

    let browser = null;
    try {
      const args = proxyFormat.includes("--proxy-auth")
        ? proxyFormat.split(" ")
        : [`--proxy-server=${proxyFormat}`];

      browser = await puppeteer.launch({
        headless: true,
        args: [...args, "--no-sandbox", "--disable-setuid-sandbox"],
        timeout: 30000,
      });

      const page = await browser.newPage();

      // Quick test - just try to load a simple page
      await page.goto("data:text/html,<h1>Test</h1>", {
        waitUntil: "networkidle2",
        timeout: 10000,
      });

      console.log("✅ Browser launched successfully with this format");
      await browser.close();
    } catch (error) {
      console.log(
        "❌ Failed with this format:",
        error.message.substring(0, 100)
      );
      if (browser) {
        try {
          await browser.close();
        } catch (e) {}
      }
    }
  }
}

// Run tests
async function runAllTests() {
  try {
    // Test 1: Basic connectivity
    await testProxyConnectivity();

    // Test 2: Alternative formats
    await testAlternativeProxyFormats();
  } catch (error) {
    console.log("\n❌ Basic connectivity failed:", error.message);
    console.log("\n🔧 Recommendations:");
    console.log("1. Check if proxy server 59.153.18.230:1052 is running");
    console.log("2. Verify credentials: username=BK, password=BK");
    console.log("3. Check if your network/firewall allows SOCKS5 connections");
    console.log("4. Contact your proxy provider to verify the server status");

    // Still test alternative formats even if basic connectivity fails
    await testAlternativeProxyFormats();
  }

  console.log("\n🏁 All tests completed");
}

runAllTests().catch(console.error);
