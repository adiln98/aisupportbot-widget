const fs = require('fs');

// Get build mode from command line
const buildMode = process.argv[2] || 'development';

// Read environment file
const envFile = buildMode === 'production' 
  ? 'src/environments/environment.prod.ts'
  : 'src/environments/environment.ts';

const envContent = fs.readFileSync(envFile, 'utf8');

// Extract URLs using regex
const widgetUrlMatch = envContent.match(/widgetUrl:\s*['"`]([^'"`]+)['"`]/);
const widgetOriginMatch = envContent.match(/widgetOrigin:\s*['"`]([^'"`]+)['"`]/);

if (!widgetUrlMatch || !widgetOriginMatch) {
  console.error('Could not find widgetUrl or widgetOrigin in environment file');
  process.exit(1);
}

const widgetUrl = widgetUrlMatch[1];
const widgetOrigin = widgetOriginMatch[1];

console.log(`Replacing URLs for ${buildMode}:`, { widgetUrl, widgetOrigin });

// Read loader.js
const loaderPath = 'public/loader.js';
let loaderContent = fs.readFileSync(loaderPath, 'utf8');

// Replace placeholders
loaderContent = loaderContent
  .replace(/WIDGET_URL_PLACEHOLDER/g, widgetUrl)
  .replace(/WIDGET_ORIGIN_PLACEHOLDER/g, widgetOrigin);

// Write back
fs.writeFileSync(loaderPath, loaderContent);

console.log('URLs replaced successfully!'); 