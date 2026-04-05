import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  try {
    console.log("Launching browser...");
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    // Set 1440x900 retina for a high quality screenshot
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
    
    console.log("Navigating to http://localhost:3001/dashboard ...");
    // The user's page might be at dashboard, adjust as needed. Try 3001 first, or fallback to 3000
    const url = 'http://localhost:3001/dashboard';
    
    const response = await page.goto(url, { waitUntil: 'networkidle2' }).catch(async () => {
       console.log("Failed 3001. Trying 3000...");
       return page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle2' });
    });
    
    // Give it 3 extra seconds to let any React animations or images load completely
    await new Promise(r => setTimeout(r, 3000));
    
    // Optionally remove any persistent NextJS dev tools if they sneaked in
    await page.evaluate(() => {
      const el = document.querySelector('#nextjs-dev-indicator') || document.querySelector('[data-nextjs-dev-indicator]');
      if (el) el.remove();
    });

    const savePath = path.join(__dirname, 'public', 'dashboard-real.png');
    await page.screenshot({ path: savePath });
    
    console.log('Saved brilliant screenshot to', savePath);
    await browser.close();
  } catch (error) {
    console.error("Error generating screenshot:", error);
    process.exit(1);
  }
})();
