const puppeteer = require('puppeteer');
const path = require('path');

async function recordDashboardDemo() {
  console.log('🎬 Starting INTRA Dashboard Demo Recording...');
  
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      '--start-maximized',
      '--disable-infobars',
      '--disable-extensions',
    ],
  });

  const page = await browser.newPage();
  
  // Set viewport to 1920x1080 for HD recording
  await page.setViewport({ width: 1920, height: 1080 });
  
  console.log('📺 Navigating to dashboard...');
  await page.goto('http://localhost:3001/dashboard/conversations', {
    waitUntil: 'networkidle2',
  });

  // Wait for page to load
  await new Promise(resolve => setTimeout(resolve, 3000));

  console.log('🎥 Recording demo sequence...');

  // Demo sequence
  const actions = [
    { name: 'Hover over conversations', action: async () => {
      await page.hover('.conversation-item');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }},
    { name: 'Click on first conversation', action: async () => {
      await page.click('.conversation-item');
      await new Promise(resolve => setTimeout(resolve, 1500));
    }},
    { name: 'Type a message', action: async () => {
      await page.type('textarea[placeholder*="Type"]', 'Hello! This is a demo message from INTRA.');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }},
    { name: 'Send message', action: async () => {
      await page.click('button[type="submit"]');
      await new Promise(resolve => setTimeout(resolve, 1500));
    }},
    { name: 'Navigate to contacts', action: async () => {
      await page.click('a[href="/dashboard/customers"]');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }},
    { name: 'Hover over contact card', action: async () => {
      await page.hover('.contact-card');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }},
    { name: 'Navigate to settings', action: async () => {
      await page.click('a[href="/dashboard/settings"]');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }},
    { name: 'Scroll through settings', action: async () => {
      await page.evaluate(() => window.scrollBy(0, 500));
      await new Promise(resolve => setTimeout(resolve, 1000));
    }},
  ];

  for (const step of actions) {
    console.log(`  - ${step.name}`);
    try {
      await step.action();
    } catch (error) {
      console.log(`    ⚠️  Skipped: ${error.message}`);
    }
  }

  console.log('✅ Demo recording complete!');
  console.log('💡 Tip: Use a screen recording tool like OBS or Loom to capture the browser window');
  console.log('📁 Demo sequence ready for recording');
  
  // Keep browser open for manual recording
  console.log('🎬 Browser is open - start your screen recording now!');
  console.log('Press Ctrl+C to close the browser when done recording');
  
  // Wait for user to finish recording
  await new Promise(resolve => {
    process.on('SIGINT', resolve);
  });
  
  await browser.close();
  console.log('👋 Browser closed. Demo complete!');
}

// Run the demo
recordDashboardDemo().catch(console.error);
