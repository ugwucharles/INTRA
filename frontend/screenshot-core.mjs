import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  try {
    console.log("Launching Edge...");
    const browser = await puppeteer.launch({ 
      headless: true,
      executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
    });
    const page = await browser.newPage();
    
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
    
    console.log("Navigating to http://localhost:3001/login ...");
    let baseUrl = 'http://localhost:3001';
    
    // Attempt to load 3001, otherwise fallback to 3000
    try {
      await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle0', timeout: 30000 });
    } catch {
       console.log("Failed 3001. Trying 3000...");
       baseUrl = 'http://localhost:3000';
       await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle0', timeout: 30000 });
    }
    
    console.log("Logging in as admin...");
    await page.type('input[type="email"]', 'admin@example.com');
    await page.type('input[type="password"]', 'password123');
    
    await page.click('button[type="submit"]');
    console.log("Waiting for /dashboard navigation...");
    
    await page.waitForFunction('window.location.pathname.includes("dashboard")', { timeout: 15000 }).catch(async (e) => {
        console.error("Failed to reach dashboard. Taking debug screenshot...");
        await page.screenshot({ path: path.join(__dirname, 'public', 'dashboard-err.png') });
        throw e;
    });
    
    console.log("Logged in. Waiting for dashboard data to fully load...");
    await new Promise(r => setTimeout(r, 8000));
    
    // Check final URL
    const finalUrl = page.url();
    console.log("FINAL URL before screenshot:", finalUrl);
    
    // Force remove NextJS dev indicator if somehow it is still there
    await page.addStyleTag({ content: 'nextjs-portal, [data-nextjs-toast] { display: none !important; opacity: 0 !important; visibility: hidden !important; }' });
    await page.evaluate(() => {
      // Setup a continuous sweeper so any asynchronously injected portal is deleted instantly
      setInterval(() => {
        const selectors = [
          '#nextjs-dev-indicator', 
          '[data-nextjs-dev-indicator]',
          '.__next-dev-status-indicator',
          '#__next-build-watcher',
          'nextjs-portal'
        ];
        selectors.forEach(sel => {
          document.querySelectorAll(sel).forEach(el => el.remove());
        });
      }, 500);
    });

    const savePath = path.join(__dirname, 'public', 'dashboard-final.png');
    await page.screenshot({ path: savePath });
    
    console.log('Saved retina screenshot to', savePath);
    await browser.close();
  } catch (error) {
    console.error("Error generating screenshot:", error);
    process.exit(1);
  }
})();
