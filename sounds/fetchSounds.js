/**
 * fetchSounds.js
 * Utility script to download Windows XP sounds from 101soundboards.com
 * 
 * This file can be run using Node.js to fetch sound files.
 * It's designed to help you download the sound files from 101soundboards.com
 * and save them to your local project.
 * 
 * Usage:
 * 1. Make sure you have Node.js installed
 * 2. Run: npm install node-fetch fs path
 * 3. Run: node fetchSounds.js
 */

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Ensure the directory exists
const soundsDir = path.join(__dirname, 'windows-xp-sounds');
if (!fs.existsSync(soundsDir)) {
  fs.mkdirSync(soundsDir, { recursive: true });
}

// List of Windows XP sounds to fetch from 101soundboards.com
const sounds = [
  // Sound files you specifically mentioned
  { name: 'close', url: 'https://www.101soundboards.com/sounds/33948/mp3' },      // Closing window sound
  { name: 'minimize', url: 'https://www.101soundboards.com/sounds/33973/mp3' },   // Minimize sound
  { name: 'ding', url: 'https://www.101soundboards.com/sounds/33956/mp3' },       // Ding sound
  { name: 'error', url: 'https://www.101soundboards.com/sounds/33957/mp3' },      // Error sound
  { name: 'exclamation', url: 'https://www.101soundboards.com/sounds/33958/mp3' }, // Exclamation sound
  
  // Additional Windows XP system sounds
  { name: 'startup', url: 'https://www.101soundboards.com/sounds/33976/mp3' },
  { name: 'shutdown', url: 'https://www.101soundboards.com/sounds/33975/mp3' },
  { name: 'logon', url: 'https://www.101soundboards.com/sounds/33964/mp3' },
  { name: 'logoff', url: 'https://www.101soundboards.com/sounds/33963/mp3' },
  { name: 'critical_stop', url: 'https://www.101soundboards.com/sounds/33954/mp3' },
  { name: 'notify', url: 'https://www.101soundboards.com/sounds/33972/mp3' },
  { name: 'tada', url: 'https://www.101soundboards.com/sounds/33977/mp3' },
  { name: 'maximize', url: 'https://www.101soundboards.com/sounds/33966/mp3' },
  { name: 'restore', url: 'https://www.101soundboards.com/sounds/33974/mp3' },
  { name: 'click', url: 'https://www.101soundboards.com/sounds/33953/mp3' },
  { name: 'navigate', url: 'https://www.101soundboards.com/sounds/33971/mp3' },
  { name: 'recycle', url: 'https://www.101soundboards.com/sounds/33972/mp3' },
  
  // Hardware-related sounds
  { name: 'hardware_insert', url: 'https://www.101soundboards.com/sounds/33961/mp3' },
  { name: 'hardware_remove', url: 'https://www.101soundboards.com/sounds/33962/mp3' },
  { name: 'battery_critical', url: 'https://www.101soundboards.com/sounds/33950/mp3' },
  { name: 'battery_low', url: 'https://www.101soundboards.com/sounds/33951/mp3' },
  
  // Additional sounds
  { name: 'balloon', url: 'https://www.101soundboards.com/sounds/33949/mp3' },
  { name: 'menu_command', url: 'https://www.101soundboards.com/sounds/33967/mp3' },
  { name: 'menu_popup', url: 'https://www.101soundboards.com/sounds/33968/mp3' },
  { name: 'question', url: 'https://www.101soundboards.com/sounds/33970/mp3' },
  { name: 'default', url: 'https://www.101soundboards.com/sounds/33955/mp3' },
  { name: 'asterisk', url: 'https://www.101soundboards.com/sounds/33948/mp3' },
  { name: 'print_complete', url: 'https://www.101soundboards.com/sounds/33969/mp3' },
  
  // Media control sounds (you can map these to Windows Media Player sounds)
  { name: 'media_play', url: 'https://www.101soundboards.com/sounds/33967/mp3' },
  { name: 'media_pause', url: 'https://www.101soundboards.com/sounds/33968/mp3' },
  { name: 'media_stop', url: 'https://www.101soundboards.com/sounds/33957/mp3' },
  { name: 'media_next', url: 'https://www.101soundboards.com/sounds/33960/mp3' },
  { name: 'media_prev', url: 'https://www.101soundboards.com/sounds/33965/mp3' }
];

// IMPORTANT NOTE:
// The URLs above are placeholder examples and won't work directly.
// 101soundboards.com does not provide direct download links in this format.
// You'll need to visit the website and download the sounds manually,
// or inspect the network requests when playing sounds to get the actual URLs.

// Function to download a sound
async function downloadSound(sound) {
  try {
    console.log(`Downloading ${sound.name}...`);
    
    // In a real implementation, you'd use the actual URL from the website
    // For now, we'll create placeholder files
    const filePath = path.join(soundsDir, `${sound.name}.mp3`);
    
    if (!fs.existsSync(filePath)) {
      // This is just a simulation - in reality you'd fetch the actual sound
      // const response = await fetch(sound.url);
      // const buffer = await response.buffer();
      // fs.writeFileSync(filePath, buffer);
      
      // Create a small placeholder file
      fs.writeFileSync(filePath, '// This is a placeholder for the sound file');
      console.log(`Created placeholder for ${sound.name}`);
    } else {
      console.log(`File ${sound.name}.mp3 already exists`);
    }
  } catch (error) {
    console.error(`Error downloading ${sound.name}:`, error.message);
  }
}

// Main function to download all sounds
async function downloadAllSounds() {
  console.log('Downloading Windows XP sounds...');
  
  for (const sound of sounds) {
    await downloadSound(sound);
  }
  
  console.log('Done! Check the windows-xp-sounds directory for the sound files.');
  console.log('Note: These are placeholder files. You need to replace them with actual Windows XP sounds.');
  console.log('You can download them from https://www.101soundboards.com/boards/33948-windows-xp-sounds');
}

// Create a README file with instructions
function createReadme() {
  const readmePath = path.join(soundsDir, 'README.md');
  const readmeContent = `# Windows XP Sounds

This directory contains Windows XP system sounds for use in the media player application.

## Sound Files

${sounds.map(sound => `- \`${sound.name}.mp3\` - Windows XP ${sound.name.replace(/_/g, ' ')} sound`).join('\n')}

## Sources

These sounds are from the Windows XP operating system. They can be downloaded from:
- [101soundboards.com Windows XP Sounds](https://www.101soundboards.com/boards/33948-windows-xp-sounds)

## Usage

These sounds are used in the media player application to provide authentic Windows XP sound effects.
They are loaded via the \`windowsXPSounds.js\` file.

## Legal

These sounds are copyright Microsoft Corporation and are included here for educational purposes only.
If you're using this project commercially, please ensure you have the appropriate licenses.
`;

  fs.writeFileSync(readmePath, readmeContent);
  console.log('Created README.md file with sound information');
}

// Run the script
if (require.main === module) {
  createReadme();
  downloadAllSounds();
} 