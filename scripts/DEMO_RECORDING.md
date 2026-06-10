# INTRA Dashboard Demo Recording

This script helps you generate HD demo videos of INTRA performing various actions, similar to Kinso AI's dashboard demos.

## Prerequisites

1. Install dependencies:
```bash
npm install
```

2. Make sure the backend and frontend are running:
```bash
# In one terminal
npm run start:dev

# In another terminal (in frontend directory)
cd frontend
npm run dev
```

3. Login to the dashboard at http://localhost:3001 with your admin credentials

## Usage

Run the demo recording script:
```bash
npm run demo:record
```

## What the Script Does

The script will:
1. Launch a headless browser in 1920x1080 resolution (HD)
2. Navigate to the dashboard
3. Perform a sequence of demo actions:
   - Hover over conversations
   - Click on first conversation
   - Type a message
   - Send message
   - Navigate to contacts
   - Hover over contact card
   - Navigate to settings
   - Scroll through settings
4. Keep the browser open for manual screen recording

## Recording the Video

The script opens a browser window and performs the demo sequence. To capture the video:

1. Start your screen recording software (OBS, Loom, etc.)
2. Select the browser window as the recording target
3. Set resolution to 1920x1080 for HD quality
4. Start recording
5. The script will automatically perform the demo actions
6. Stop recording when the demo is complete
7. Press Ctrl+C to close the browser

## Customizing the Demo

You can modify the `actions` array in `scripts/record-dashboard-demo.js` to add or change demo steps:

```javascript
const actions = [
  { name: 'Your action name', action: async () => {
    // Your puppeteer code here
    await page.click('.your-selector');
    await page.waitForTimeout(1000);
  }},
];
```

## Tips for Professional Demos

- Use a clean browser profile (no extensions)
- Clear browser cache before recording
- Ensure consistent network speed
- Use a stable environment (avoid interruptions)
- Record in a quiet environment
- Consider adding voice-over narration

## Output

The script doesn't automatically save the video - it performs the actions in the browser while you record with your screen recording software. This gives you full control over:
- Recording quality
- Frame rate
- Audio narration
- Editing and post-production
