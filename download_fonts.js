/**
 * Script to download Windows XP fonts for use with XP.css
 * Run this with Node.js
 */

const fs = require('fs');
const https = require('https');
const path = require('path');

// Create fonts directory if it doesn't exist
const fontsDir = path.join(__dirname, 'fonts');
if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir);
  console.log('Created fonts directory');
}

// Font files to download with their URLs
const fontFiles = [
  { name: 'ms_sans_serif.woff2', url: 'https://unpkg.com/xp.css@0.2.6/dist/ms_sans_serif.woff2' },
  { name: 'ms_sans_serif_bold.woff2', url: 'https://unpkg.com/xp.css@0.2.6/dist/ms_sans_serif_bold.woff2' },
  { name: 'ms_sans_serif8.woff2', url: 'https://unpkg.com/98.css@0.1.20/dist/ms_sans_serif8.woff2' },
  { name: 'ms_sans_serif8_bold.woff2', url: 'https://unpkg.com/98.css@0.1.20/dist/ms_sans_serif8_bold.woff2' },
  { name: 'PerfectDOSVGA437Win.woff2', url: 'https://github.com/mattsouth/dosfonts/raw/master/PerfectDOSVGA437Win.woff2' }
];

// Function to download a file
function downloadFile(url, destination) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destination);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        fs.unlink(destination, () => {});
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }

      response.pipe(file);

      file.on('finish', () => {
        file.close(resolve);
        console.log(`Downloaded ${path.basename(destination)}`);
      });
    }).on('error', (err) => {
      fs.unlink(destination, () => {});
      reject(err);
    });
  });
}

// Download all fonts
async function downloadFonts() {
  console.log('Starting font downloads...');
  
  for (const font of fontFiles) {
    const fontPath = path.join(fontsDir, font.name);
    
    // Skip files that already exist
    if (fs.existsSync(fontPath)) {
      console.log(`${font.name} already exists, skipping`);
      continue;
    }
    
    try {
      await downloadFile(font.url, fontPath);
    } catch (err) {
      console.error(`Error downloading ${font.name}:`, err.message);
    }
  }
  
  console.log('Font downloads complete!');
}

downloadFonts(); 
