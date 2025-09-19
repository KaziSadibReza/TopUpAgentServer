const path = require('path');
const fs = require('fs');

// Check if screenshot file exists
const screenshotPath = path.join(__dirname, '../screenshots/error-queue_3-1758240050547.png');
console.log('Checking screenshot path:', screenshotPath);

fs.access(screenshotPath, fs.constants.F_OK, (err) => {
  if (err) {
    console.log('❌ Screenshot file does not exist');
  } else {
    console.log('✅ Screenshot file exists');
  }
});

// Check directory
const screenshotsDir = path.join(__dirname, '../screenshots');
console.log('Screenshots directory:', screenshotsDir);

fs.readdir(screenshotsDir, (err, files) => {
  if (err) {
    console.log('❌ Cannot read screenshots directory:', err.message);
  } else {
    console.log('📁 Files in screenshots directory:', files);
  }
});

console.log('✅ Screenshot test completed');