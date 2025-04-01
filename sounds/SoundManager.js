/**
 * SoundManager.js
 * Manages Windows XP sound effects for the media player application
 */

class SoundManager {
    constructor() {
        this.sounds = {};
        this.enabled = true;
        
        // Add tracking for active windows with sounds using WeakMap
        this.activeWindows = new Set();
        this.windowStates = new WeakMap(); // Store window states without affecting DOM
        this.closingWindows = new WeakMap(); // Track closing windows
        
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
     * Add a window to active sounds tracking
     * @param {string} windowId - The ID of the window to track
     */
    addActiveWindow(windowId) {
        if (!windowId) return;
        
        this.activeWindows.add(windowId);
        setTimeout(() => {
            this.activeWindows.delete(windowId);
        }, 1000);
    }
    
    /**
     * Check if a window is currently active with sounds
     * @param {string} windowId - The ID of the window to check
     * @returns {boolean} - Whether the window is active
     */
    isWindowActive(windowId) {
        return windowId && this.activeWindows.has(windowId);
    }
    
    /**
     * Mark a window as closing using WeakMap
     * @param {Element} windowElement - The window element to mark
     */
    markWindowClosing(windowElement) {
        if (!windowElement) return;
        this.closingWindows.set(windowElement, true);
        
        setTimeout(() => {
            this.closingWindows.delete(windowElement);
        }, 1500);
    }
    
    /**
     * Check if a window is closing
     * @param {Element} windowElement - The window element to check
     * @returns {boolean} - Whether the window is closing
     */
    isWindowClosing(windowElement) {
        return windowElement && this.closingWindows.has(windowElement);
    }
    
    /**
     * Set a state value for a window
     * @param {Element} windowElement - The window element
     * @param {string} key - The state property name
     * @param {*} value - The state value
     */
    setWindowState(windowElement, key, value) {
        if (!windowElement) return;
        
        const state = this.windowStates.get(windowElement) || {};
        state[key] = value;
        this.windowStates.set(windowElement, state);
    }
    
    /**
     * Get a state value for a window
     * @param {Element} windowElement - The window element
     * @param {string} key - The state property name
     * @returns {*} - The state value
     */
    getWindowState(windowElement, key) {
        if (!windowElement) return undefined;
        
        const state = this.windowStates.get(windowElement) || {};
        return state[key];
    }
    
    /**
     * Play a sound effect for a specific window
     * @param {Element} windowElement - The window DOM element
     * @param {string} soundName - The name of the sound to play
     * @param {number} volume - Volume level (0.0 to 1.0)
     * @param {number} duration - How long to mark the window as having played a sound
     * @returns {boolean} - Whether the sound was played successfully
     */
    playForWindow(windowElement, soundName, volume = 0.5, duration = 1000) {
        if (!windowElement) return this.play(soundName, volume);
        
        const windowId = windowElement.id;
        
        // Special case for window close sound - always play it even for initially loaded windows
        if (soundName === 'windowClose' || soundName === 'critical') {
            // Remove initial window marker
            this.setWindowState(windowElement, 'initialWindow', false);
            
            // If this is the first close on an initially loaded window, force play sound
            if (this.getWindowState(windowElement, 'soundPlayed')) {
                console.log(`Forcing ${soundName} sound for initial window: ${windowId}`);
                this.setWindowState(windowElement, 'soundPlayed', false);
            }
            
            // Check if we are already in close operation to prevent double sound
            if (this.isWindowClosing(windowElement)) {
                console.log(`Skipping duplicate close sound for: ${windowId}`);
                return false;
            }
            
            // Check if global soundManager is handling this
            if (window.soundManager && 
                soundName === 'windowClose' && 
                this.getWindowState(windowElement, 'criticalSoundPlayed')) {
                console.log(`Skipping windowClose, critical already played for: ${windowId}`);
                return false;
            }
            
            // Mark window as being closed to prevent duplicate sounds
            this.markWindowClosing(windowElement);
            
            // If this is the 'critical' sound from windowsXPSounds.js, mark it
            if (soundName === 'critical') {
                this.setWindowState(windowElement, 'criticalSoundPlayed', true);
                
                // Reset this flag after some time
                setTimeout(() => {
                    this.setWindowState(windowElement, 'criticalSoundPlayed', false);
                }, 1500);
            }
        }
        
        // Don't play sound if already active for this window (except for close sounds)
        if (windowId && this.isWindowActive(windowId) && 
            soundName !== 'windowClose' && soundName !== 'critical') {
            console.log(`Skipping sound ${soundName} for window ${windowId} - already active`);
            return false;
        }
        
        // Play the sound
        const result = this.play(soundName, volume);
        
        // Mark this window as having an active sound
        if (windowId) {
            this.addActiveWindow(windowId);
        }
        
        // Set the sound played marker to prevent duplicate sounds
        this.setWindowState(windowElement, 'soundPlayed', true);
        
        // Reset the marker after the specified duration
        setTimeout(() => {
            if (windowElement) {
                this.setWindowState(windowElement, 'soundPlayed', false);
            }
        }, duration);
        
        return result;
    }
    
    /**
     * Play a sound effect by name
     * @param {string} soundName - The name of the sound to play
     * @param {number} volume - Volume level (0.0 to 1.0)
     * @returns {boolean} - Whether the sound was played successfully
     */
    play(soundName, volume = 0.5) {
        if (!this.enabled) return false;
        
        // Check if we should delegate to the global soundManager
        if (window.soundManager && window.soundManager.sounds[soundName]) {
            return window.soundManager.play(soundName, volume);
        }
        
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
        // Check if we should skip setup because windowsXPSounds.js is handling it
        if (window.soundManager) {
            console.log('Skipping SoundManager.setupWindowEventHandlers as window.soundManager exists');
            return;
        }
        
        if (typeof document === 'undefined') return;
        
        // Find all windows and window controls
        const windows = document.querySelectorAll('.window');
        
        // Mark initial windows
        windows.forEach(windowElement => {
            if (windowElement.style.display !== 'none' && !windowElement.classList.contains('minimized')) {
                this.setWindowState(windowElement, 'initialWindow', true);
                this.setWindowState(windowElement, 'soundPlayed', true);
                console.log('Marked initial window in SoundManager:', windowElement.id);
            }
            
            // Window close button - use our specific "closing window" sound
            const closeButton = windowElement.querySelector('button[aria-label="Close"]');
            if (closeButton) {
                closeButton.addEventListener('click', () => {
                    this.playForWindow(windowElement, 'windowClose', 0.6, 1500);
                });
            }
            
            // Window maximize button
            const maximizeButton = windowElement.querySelector('button[aria-label="Maximize"]');
            if (maximizeButton) {
                maximizeButton.addEventListener('click', () => {
                    if (windowElement.classList.contains('maximized')) {
                        this.playForWindow(windowElement, 'restore', 0.6, 1000);
                    } else {
                        this.playForWindow(windowElement, 'maximize', 0.6, 1000);
                    }
                });
            }
            
            // Window minimize button - use our specific "minimize" sound
            const minimizeButton = windowElement.querySelector('button[aria-label="Minimize"]');
            if (minimizeButton) {
                minimizeButton.addEventListener('click', () => {
                    this.playForWindow(windowElement, 'minimize', 0.6, 1000);
                });
            }
        });
        
        // Reset initial window flags after a delay
        setTimeout(() => {
            windows.forEach(windowElement => {
                const isInitial = this.getWindowState(windowElement, 'initialWindow');
                if (isInitial) {
                    // After a delay, reset the initial window flag
                    this.setWindowState(windowElement, 'initialWindow', false);
                    console.log('Reset initial window flag in SoundManager for:', windowElement.id);
                    
                    // After another brief delay, reset the soundPlayed flag too
                    setTimeout(() => {
                        this.setWindowState(windowElement, 'soundPlayed', false);
                        console.log('Reset sound played flag in SoundManager for:', windowElement.id);
                    }, 500);
                }
            });
        }, 3000);
        
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
        // Only setup our event handlers if windowsXPSounds.js hasn't already set up window.soundManager
        if (!window.soundManager) {
            window.soundManagerInstance.setupWindowEventHandlers();
            
            // Play startup sound when the page loads
            window.soundManagerInstance.play('startup', 0.7);
        } else {
            console.log('Detected window.soundManager, deferring to it for sound handling');
        }
    });
    
    console.log('Global sound manager created');
}    