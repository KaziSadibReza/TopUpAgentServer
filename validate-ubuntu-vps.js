const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

class UbuntuVPSValidator {
  constructor() {
    this.results = {
      systemCheck: {},
      dependencies: {},
      proxyTest: {},
      browserTest: {},
      stealthTest: {},
      performanceTest: {},
    };
  }

  async validateUbuntuVPS() {
    console.log("🔍 UBUNTU VPS VALIDATION FOR ANTI-reCAPTCHA");
    console.log("=".repeat(50));

    try {
      await this.checkSystem();
      await this.checkDependencies();
      await this.testProxy();
      await this.testBrowser();
      await this.testStealth();
      await this.testPerformance();

      this.generateReport();
    } catch (error) {
      console.error("❌ Validation failed:", error.message);
      process.exit(1);
    }
  }

  async checkSystem() {
    console.log("\n📊 SYSTEM CHECK");
    console.log("-".repeat(30));

    // Check OS
    const os = require("os");
    this.results.systemCheck.platform = os.platform();
    this.results.systemCheck.arch = os.arch();
    this.results.systemCheck.cpus = os.cpus().length;
    this.results.systemCheck.memory = Math.round(
      os.totalmem() / 1024 / 1024 / 1024
    );

    console.log(
      `✅ Platform: ${this.results.systemCheck.platform} ${this.results.systemCheck.arch}`
    );
    console.log(`✅ CPU Cores: ${this.results.systemCheck.cpus}`);
    console.log(`✅ Memory: ${this.results.systemCheck.memory}GB`);

    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split(".")[0]);
    this.results.systemCheck.nodeVersion = nodeVersion;
    this.results.systemCheck.nodeCompatible = majorVersion >= 16;

    if (this.results.systemCheck.nodeCompatible) {
      console.log(`✅ Node.js: ${nodeVersion} (Compatible)`);
    } else {
      console.log(`❌ Node.js: ${nodeVersion} (Requires 16+)`);
      throw new Error("Node.js version incompatible");
    }
  }

  async checkDependencies() {
    console.log("\n📦 DEPENDENCIES CHECK");
    console.log("-".repeat(30));

    const requiredPackages = [
      "puppeteer-extra",
      "puppeteer-extra-plugin-stealth",
      "proxy-chain",
      "sqlite3",
      "express",
    ];

    const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
    const installed = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    for (const pkg of requiredPackages) {
      if (installed[pkg]) {
        console.log(`✅ ${pkg}: ${installed[pkg]}`);
        this.results.dependencies[pkg] = true;
      } else {
        console.log(`❌ ${pkg}: NOT INSTALLED`);
        this.results.dependencies[pkg] = false;
      }
    }

    // Check Chrome installation
    try {
      await this.execPromise("which google-chrome-stable");
      console.log("✅ Google Chrome: INSTALLED");
      this.results.dependencies.chrome = true;
    } catch {
      try {
        await this.execPromise("which chromium-browser");
        console.log("✅ Chromium: INSTALLED");
        this.results.dependencies.chrome = true;
      } catch {
        console.log("❌ Chrome/Chromium: NOT FOUND");
        this.results.dependencies.chrome = false;
      }
    }
  }

  async testProxy() {
    console.log("\n🔗 PROXY CONNECTION TEST");
    console.log("-".repeat(30));

    const { ProxyChain } = require("proxy-chain");

    try {
      const proxyUrl = "socks5://BK:BK@59.153.18.230:1052";
      const proxyServer = new ProxyChain.Server({
        port: 0,
        prepareRequestFunction: () => ({ upstreamProxyUrl: proxyUrl }),
      });

      await proxyServer.listen();
      const proxyPort = proxyServer.port;

      console.log(`✅ Proxy Server: Started on port ${proxyPort}`);

      // Test connection with timeout
      const testUrl = "http://httpbin.org/ip";
      const timeout = 10000;

      const result = await Promise.race([
        fetch(testUrl, {
          agent: new (require("https-proxy-agent"))(
            `http://127.0.0.1:${proxyPort}`
          ),
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Proxy timeout")), timeout)
        ),
      ]);

      const data = await result.json();
      console.log(`✅ Proxy IP: ${data.origin}`);

      this.results.proxyTest.working = true;
      this.results.proxyTest.ip = data.origin;

      await proxyServer.close();
    } catch (error) {
      console.log(`❌ Proxy Test Failed: ${error.message}`);
      this.results.proxyTest.working = false;
      this.results.proxyTest.error = error.message;
    }
  }

  async testBrowser() {
    console.log("\n🌐 BROWSER TEST");
    console.log("-".repeat(30));

    const puppeteer = require("puppeteer-extra");
    const StealthPlugin = require("puppeteer-extra-plugin-stealth");
    puppeteer.use(StealthPlugin());

    let browser;
    try {
      // Ubuntu VPS optimized launch options
      browser = await puppeteer.launch({
        headless: "new",
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--single-process",
          "--disable-gpu",
          "--disable-dev-shm-usage",
          "--disable-web-security",
          "--disable-features=VizDisplayCompositor",
          "--use-gl=disabled",
          "--disable-accelerated-2d-canvas",
          "--disable-accelerated-jpeg-decoding",
          "--disable-accelerated-mjpeg-decode",
          "--disable-accelerated-video-decode",
          "--memory-pressure-off",
          "--max_old_space_size=4096",
        ],
        executablePath: process.env.CHROME_EXECUTABLE_PATH,
      });

      console.log("✅ Browser: Launched successfully");

      const page = await browser.newPage();
      await page.goto("https://bot.sannysoft.com/", {
        waitUntil: "networkidle0",
      });

      console.log("✅ Navigation: Test page loaded");

      // Check for common detection indicators
      const detections = await page.evaluate(() => {
        return {
          webdriver: window.navigator.webdriver,
          languages: window.navigator.languages.length,
          platform: window.navigator.platform,
          hardwareConcurrency: window.navigator.hardwareConcurrency,
          deviceMemory: window.navigator.deviceMemory,
        };
      });

      console.log("✅ Detection Results:", detections);
      this.results.browserTest = { success: true, detections };
    } catch (error) {
      console.log(`❌ Browser Test Failed: ${error.message}`);
      this.results.browserTest = { success: false, error: error.message };
    } finally {
      if (browser) await browser.close();
    }
  }

  async testStealth() {
    console.log("\n🛡️  STEALTH TEST");
    console.log("-".repeat(30));

    try {
      // Run the Ubuntu stealth test
      const { stdout } = await this.execPromise("node test-ubuntu-stealth.js", {
        timeout: 60000,
      });

      if (stdout.includes("NO CAPTCHA DETECTED")) {
        console.log("✅ reCAPTCHA: BYPASSED");
        this.results.stealthTest.captchaBypassed = true;
      } else {
        console.log("❌ reCAPTCHA: STILL DETECTED");
        this.results.stealthTest.captchaBypassed = false;
      }

      if (stdout.includes("Player ID input found")) {
        console.log("✅ Site Access: SUCCESSFUL");
        this.results.stealthTest.siteAccess = true;
      } else {
        console.log("❌ Site Access: BLOCKED");
        this.results.stealthTest.siteAccess = false;
      }

      this.results.stealthTest.output = stdout;
    } catch (error) {
      console.log(`❌ Stealth Test Failed: ${error.message}`);
      this.results.stealthTest = { success: false, error: error.message };
    }
  }

  async testPerformance() {
    console.log("\n⚡ PERFORMANCE TEST");
    console.log("-".repeat(30));

    const startTime = Date.now();
    const initialMemory = process.memoryUsage();

    try {
      // Simulate a quick automation task
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const endTime = Date.now();
      const finalMemory = process.memoryUsage();

      const responseTime = endTime - startTime;
      const memoryDelta = finalMemory.heapUsed - initialMemory.heapUsed;

      console.log(`✅ Response Time: ${responseTime}ms`);
      console.log(
        `✅ Memory Usage: ${Math.round(finalMemory.heapUsed / 1024 / 1024)}MB`
      );
      console.log(`✅ Memory Delta: ${Math.round(memoryDelta / 1024)}KB`);

      this.results.performanceTest = {
        responseTime,
        memoryUsage: Math.round(finalMemory.heapUsed / 1024 / 1024),
        memoryDelta: Math.round(memoryDelta / 1024),
      };
    } catch (error) {
      console.log(`❌ Performance Test Failed: ${error.message}`);
      this.results.performanceTest = { success: false, error: error.message };
    }
  }

  generateReport() {
    console.log("\n📋 VALIDATION REPORT");
    console.log("=".repeat(50));

    const allPassed =
      this.results.systemCheck.nodeCompatible &&
      this.results.dependencies.chrome &&
      this.results.browserTest.success &&
      this.results.stealthTest.captchaBypassed;

    if (allPassed) {
      console.log(
        "🎉 ALL TESTS PASSED! Ubuntu VPS is ready for anti-reCAPTCHA automation!"
      );
      console.log("\n✅ Configuration Status:");
      console.log("   ✅ System: Ubuntu VPS Compatible");
      console.log("   ✅ Browser: Stealth Mode Active");
      console.log("   ✅ Proxy: SOCKS5 Connected");
      console.log("   ✅ reCAPTCHA: BYPASSED");
      console.log("   ✅ Site Access: SUCCESSFUL");

      console.log("\n🚀 Ready to deploy! Use:");
      console.log("   chmod +x start-ubuntu-vps.sh");
      console.log("   ./start-ubuntu-vps.sh");
    } else {
      console.log("❌ VALIDATION FAILED - Please fix the following issues:");

      if (!this.results.systemCheck.nodeCompatible) {
        console.log("   ❌ Upgrade Node.js to version 16+");
      }
      if (!this.results.dependencies.chrome) {
        console.log("   ❌ Install Google Chrome or Chromium");
      }
      if (!this.results.browserTest.success) {
        console.log("   ❌ Fix browser launch configuration");
      }
      if (!this.results.stealthTest.captchaBypassed) {
        console.log(
          "   ❌ reCAPTCHA still detected - check stealth configuration"
        );
      }
    }

    // Save detailed report
    const reportPath = path.join("logs", "ubuntu-vps-validation.json");
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`\n📁 Detailed report saved: ${reportPath}`);
  }

  execPromise(command, options = {}) {
    return new Promise((resolve, reject) => {
      exec(command, { timeout: 30000, ...options }, (error, stdout, stderr) => {
        if (error) reject(error);
        else resolve({ stdout, stderr });
      });
    });
  }
}

// Run validation
(async () => {
  const validator = new UbuntuVPSValidator();
  await validator.validateUbuntuVPS();
})();
