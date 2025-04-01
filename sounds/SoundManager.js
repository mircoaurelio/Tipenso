/**
 * SoundManager.js
 * Manages Windows XP sound effects for the media player application
 */

class SoundManager {
    constructor() {
        this.sounds = {};
        this.enabled = true;
        
        // Initialize sound effects
        this.init();
    }
    
    init() {
        // Define the sound files to preload with paths relative to the Windows XP sounds directory
        const soundFiles = {
            // System sounds
            'startup': 'sounds/windows-xp-sounds/startup.mp3',
            'shutdown': 'sounds/windows-xp-sounds/shutdown.mp3',
            'error': 'sounds/windows-xp-sounds/error.mp3',
            'exclamation': 'sounds/windows-xp-sounds/exclamation.mp3',
            'ding': 'sounds/windows-xp-sounds/ding.mp3',
            'notify': 'sounds/windows-xp-sounds/notify.mp3',
            'windowOpen': 'sounds/windows-xp-sounds/tada.mp3',
            'windowClose': 'sounds/windows-xp-sounds/close.mp3',
            'maximize': 'sounds/windows-xp-sounds/maximize.mp3',
            'minimize': 'sounds/windows-xp-sounds/minimize.mp3',
            'click': 'sounds/windows-xp-sounds/click.mp3',
            'navigate': 'sounds/windows-xp-sounds/navigate.mp3',
            'critical': 'sounds/windows-xp-sounds/critical_stop.mp3',
            
            // Media player specific sounds
            'mediaPlay': 'sounds/windows-xp-sounds/media_play.mp3',
            'mediaPause': 'sounds/windows-xp-sounds/media_pause.mp3',
            'mediaStop': 'sounds/windows-xp-sounds/media_stop.mp3',
            'mediaNext': 'sounds/windows-xp-sounds/media_next.mp3',
            'mediaPrev': 'sounds/windows-xp-sounds/media_prev.mp3',
            
            // Additional sounds
            'logon': 'sounds/windows-xp-sounds/logon.mp3',
            'logoff': 'sounds/windows-xp-sounds/logoff.mp3',
            'recycle': 'sounds/windows-xp-sounds/recycle.mp3',
            'restore': 'sounds/windows-xp-sounds/restore.mp3',
            'balloon': 'sounds/windows-xp-sounds/balloon.mp3',
            'question': 'sounds/windows-xp-sounds/question.mp3',
            'hardwareInsert': 'sounds/windows-xp-sounds/hardware_insert.mp3',
            'hardwareRemove': 'sounds/windows-xp-sounds/hardware_remove.mp3'
        };
        
        // Create and preload audio elements
        for (const [name, path] of Object.entries(soundFiles)) {
            this.sounds[name] = new Audio(path);
            this.sounds[name].preload = 'auto';
            
            // Add error handling
            this.sounds[name].addEventListener('error', (e) => {
                console.warn(`Failed to load sound "${name}" from ${path}`, e);
                // Fall back to base64 encoded sound if available
                this.useFallbackSound(name);
            });
        }
        
        console.log('Sound Manager initialized with Windows XP sounds');
    }
    
    /**
     * Sets up fallback sounds as base64 data in case file loading fails
     */
    useFallbackSound(soundName) {
        // Base64 fallback data for essential sounds
        const fallbackSounds = {
            'error': 'data:audio/wav;base64,UklGRlIEAABXQVZFZm10IBAAAAABAAEARKwAAESsAAABAAgAZGF0YTYE',
            'exclamation': 'data:audio/wav;base64,UklGRlIEAABXQVZFZm10IBAAAAABAAEARKwAAESsAAABAAgAZGF0YTYE',
            'ding': 'data:audio/wav;base64,UklGRpYDAABXQVZFZm10IBAAAAABAAEARKwAAESsAAABAAgAZGF0YXwD',
            'minimize': 'data:audio/wav;base64,UklGRnICAABXQVZFZm10IBAAAAABAAEARKwAAESsAAABAAgAZGF0YVQC',
            'windowClose': 'data:audio/wav;base64,UklGRpICAABXQVZFZm10IBAAAAABAAEARKwAAESsAAABAAgAZGF0YXgC'
        };
        
        if (fallbackSounds[soundName]) {
            console.log(`Using fallback sound for "${soundName}"`);
            this.sounds[soundName] = new Audio(fallbackSounds[soundName]);
        }
    }
    
    /**
     * Play a sound effect by name
     * @param {string} soundName - The name of the sound to play
     * @param {number} volume - Volume level (0.0 to 1.0)
     * @returns {boolean} - Whether the sound was played successfully
     */
    play(soundName, volume = 0.5) {
        if (!this.enabled) return false;
        
        const sound = this.sounds[soundName];
        if (!sound) {
            console.warn(`Sound "${soundName}" not found`);
            return false;
        }
        
        try {
            // Reset the sound in case it's already playing
            sound.pause();
            sound.currentTime = 0;
            
            // Set volume and play
            sound.volume = volume;
            sound.play().catch(error => {
                console.warn(`Error playing sound "${soundName}":`, error);
            });
            
            return true;
        } catch (error) {
            console.error(`Error playing sound "${soundName}":`, error);
            return false;
        }
    }
    
    /**
     * Enable or disable sound effects
     * @param {boolean} enabled - Whether sounds should be enabled
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        console.log(`Sound effects ${enabled ? 'enabled' : 'disabled'}`);
    }
    
    /**
     * Check if a sound file exists
     * @param {string} soundName - The name of the sound to check
     * @returns {boolean} - Whether the sound exists
     */
    hasSound(soundName) {
        return !!this.sounds[soundName];
    }
    
    /**
     * Add a custom event handler for window controls
     * This connects Windows XP sounds to UI elements
     */
    setupWindowEventHandlers() {
        if (typeof document === 'undefined') return;
        
        // Find all windows and window controls
        const windows = document.querySelectorAll('.window');
        
        windows.forEach(windowElement => {
            // Window close button - use our specific "closing window" sound
            const closeButton = windowElement.querySelector('button[aria-label="Close"]');
            if (closeButton) {
                closeButton.addEventListener('click', () => {
                    this.play('windowClose', 0.6);
                });
            }
            
            // Window maximize button
            const maximizeButton = windowElement.querySelector('button[aria-label="Maximize"]');
            if (maximizeButton) {
                maximizeButton.addEventListener('click', () => {
                    if (windowElement.classList.contains('maximized')) {
                        this.play('restore', 0.6);
                    } else {
                        this.play('maximize', 0.6);
                    }
                });
            }
            
            // Window minimize button - use our specific "minimize" sound
            const minimizeButton = windowElement.querySelector('button[aria-label="Minimize"]');
            if (minimizeButton) {
                minimizeButton.addEventListener('click', () => {
                    this.play('minimize', 0.6);
                });
            }
        });
        
        // Setup error handling to play the error sound
        window.addEventListener('error', () => {
            this.play('error', 0.6);
        });
        
        // Override alert to play the exclamation sound
        const oldAlert = window.alert;
        window.alert = (message) => {
            this.play('exclamation', 0.6);
            return oldAlert.call(window, message);
        };
        
        console.log('Windows XP sound event handlers initialized');
    }
}

// Create a global sound manager instance
if (typeof window !== 'undefined') {
    window.soundManagerInstance = new SoundManager();
    
    // Setup the event handlers after DOM content is loaded
    document.addEventListener('DOMContentLoaded', () => {
        window.soundManagerInstance.setupWindowEventHandlers();
        
        // Play startup sound when the page loads
        window.soundManagerInstance.play('startup', 0.7);
    });
    
    console.log('Global sound manager created');
}    