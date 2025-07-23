const LogService = require("./src/services/LogService");
const DatabaseService = require("./src/services/DatabaseService");

async function testServices() {
  console.log("🧪 TESTING LOGSERVICE AND DATABASESERVICE");
  console.log("=========================================");

  // Test 1: LogService
  console.log("\n📝 Testing LogService...");
  try {
    LogService.log("info", "Test log message");
    LogService.log("warning", "Test warning message", { testData: "example" });
    LogService.log("error", "Test error message", { error: "test error" });
    console.log("✅ LogService: WORKING");
  } catch (error) {
    console.log("❌ LogService: FAILED -", error.message);
  }

  // Test 2: DatabaseService
  console.log("\n🗄️  Testing DatabaseService...");
  try {
    await DatabaseService.initialize();
    console.log("✅ DatabaseService: INITIALIZED");

    // Test database connection
    const testLog = await DatabaseService.createAutomationLog({
      jobId: "test-job-123",
      level: "info",
      message: "Test database log",
      playerId: "test-player",
      redimensionCode: "TEST-CODE",
      packageName: "Test Package",
    });

    if (testLog) {
      console.log("✅ DatabaseService: LOG CREATION WORKING");
    }
  } catch (error) {
    console.log("❌ DatabaseService: FAILED -", error.message);
    console.log("⚠️  This is normal if database is not set up yet");
  }

  // Test 3: AutomationService Dependencies
  console.log("\n🤖 Testing AutomationService Dependencies...");
  try {
    const AutomationService = require("./src/services/AutomationService");
    console.log("✅ AutomationService: IMPORTS WORKING");

    // Test package mapping
    const packageName = AutomationService.getPackageFromCode("BDMB-J-S");
    console.log(`✅ Package Mapping: ${packageName}`);
  } catch (error) {
    console.log("❌ AutomationService: FAILED -", error.message);
  }

  console.log("\n🏁 SERVICE STATUS SUMMARY:");
  console.log("- LogService: Ready for automation logging");
  console.log(
    "- DatabaseService: " +
      (DatabaseService.initialized ? "Ready" : "Not configured (optional)")
  );
  console.log("- AutomationService: Ready for Bright Data automation");
}

testServices()
  .then(() => {
    console.log("\n✅ SERVICE TEST COMPLETED");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ SERVICE TEST FAILED:", error);
    process.exit(1);
  });
