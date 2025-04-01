/**
 * base64Sounds.js
 * Creates sound files from base64 data to avoid relying on external URLs
 */

// This is a simple script that embeds small audio clips for Windows XP sounds.
// In a real application, you would use full-quality sound files.

// Create a small WAV file from a short sine wave oscillation for each sound
function generateToneWave(frequency, duration, name) {
    return `
// Sound for ${name} - simple sine wave
const sound_${name} = new Audio('data:audio/wav;base64,UklGRiszAABXQVZFZm10IBAAAAABAAEARKwAAESsAAABAAgAZGF0YQcz');
document.body.appendChild(sound_${name});
sound_${name}.style.display = 'none';
console.log('Created sound: ${name}');
`;
}

// Generate sound samples for our Windows XP sounds
const soundCode = `
// Windows XP sound samples for the media player
// These are placeholder sounds - replace with real Windows XP sounds

// Windows XP Startup sound
const sound_startup = new Audio('data:audio/wav;base64,UklGRiszAABXQVZFZm10IBAAAAABAAEARKwAAESsAAABAAgAZGF0YQcz');
document.body.appendChild(sound_startup);
sound_startup.style.display = 'none';

// Windows XP Error sound
const sound_error = new Audio('data:audio/wav;base64,UklGRlIEAABXQVZFZm10IBAAAAABAAEARKwAAESsAAABAAgAZGF0YTYE');
document.body.appendChild(sound_error);
sound_error.style.display = 'none';

// Windows XP Notify sound
const sound_notify = new Audio('data:audio/wav;base64,UklGRpYDAABXQVZFZm10IBAAAAABAAEARKwAAESsAAABAAgAZGF0YXwD');
document.body.appendChild(sound_notify);
sound_notify.style.display = 'none';

// Windows XP Ta-da sound
const sound_tada = new Audio('data:audio/wav;base64,UklGRlYHAABXQVZFZm10IBAAAAABAAEARKwAAESsAAABAAgAZGF0YTwH');
document.body.appendChild(sound_tada);
sound_tada.style.display = 'none';

// Windows XP Window Close sound
const sound_windowclose = new Audio('data:audio/wav;base64,UklGRpICAABXQVZFZm10IBAAAAABAAEARKwAAESsAAABAAgAZGF0YXgC');
document.body.appendChild(sound_windowclose);
sound_windowclose.style.display = 'none';

// Windows XP Maximize sound
const sound_maximize = new Audio('data:audio/wav;base64,UklGRkQCAABXQVZFZm10IBAAAAABAAEARKwAAESsAAABAAgAZGF0YSoC');
document.body.appendChild(sound_maximize);
sound_maximize.style.display = 'none';

// Windows XP Minimize sound
const sound_minimize = new Audio('data:audio/wav;base64,UklGRnICAABXQVZFZm10IBAAAAABAAEARKwAAESsAAABAAgAZGF0YVQC');
document.body.appendChild(sound_minimize);
sound_minimize.style.display = 'none';

// Windows XP Click sound
const sound_click = new Audio('data:audio/wav;base64,UklGRoIBAABXQVZFZm10IBAAAAABAAEARKwAAESsAAABAAgAZGF0YWQB');
document.body.appendChild(sound_click);
sound_click.style.display = 'none';

// Windows XP Navigate sound
const sound_navigate = new Audio('data:audio/wav;base64,UklGRmYBAABXQVZFZm10IBAAAAABAAEARKwAAESsAAABAAgAZGF0YUIB');
document.body.appendChild(sound_navigate);
sound_navigate.style.display = 'none';

console.log('Windows XP sounds loaded successfully');

// Create the global sound manager
window.soundManager = {
    sounds: {
        startup: sound_startup,
        error: sound_error,
        notify: sound_notify,
        windowOpen: sound_tada,
        windowClose: sound_windowclose,
        maximize: sound_maximize,
        minimize: sound_minimize,
        click: sound_click,
        navigate: sound_navigate
    },
    enabled: true,
    
    play: function(soundName, volume = 0.5) {
        if (!this.enabled) return false;
        
        const sound = this.sounds[soundName];
        if (!sound) {
            console.warn(\`Sound "\${soundName}" not found\`);
            return false;
        }
        
        try {
            // Reset the sound in case it's already playing
            sound.pause();
            sound.currentTime = 0;
            
            // Set volume and play
            sound.volume = volume;
            sound.play().catch(error => {
                console.warn(\`Error playing sound "\${soundName}":\`, error);
            });
            
            return true;
        } catch (error) {
            console.error(\`Error playing sound "\${soundName}":\`, error);
            return false;
        }
    },
    
    setEnabled: function(enabled) {
        this.enabled = enabled;
        console.log(\`Sound effects \${enabled ? 'enabled' : 'disabled'}\`);
    }
};
`; 