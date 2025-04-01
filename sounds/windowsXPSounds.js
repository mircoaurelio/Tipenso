/**
 * windowsXPSounds.js
 * Implements Windows XP sound effects for the media player application
 */

// Initialize sound clips with only the essential Windows XP sounds
const sounds = {
    // Essential sounds
    error: new Audio('sounds/windows-xp-sounds/error.mp3'),        // For trash can
    critical: new Audio('sounds/windows-xp-sounds/critical_stop.mp3'), // For close button
    exclamation: new Audio('sounds/windows-xp-sounds/exclamation.mp3'), // For maximize button
    ding: new Audio('sounds/windows-xp-sounds/ding.mp3'),          // For calendar
    notify: new Audio('sounds/windows-xp-sounds/notify.mp3'),      // For opening modals
    minimize: new Audio('sounds/windows-xp-sounds/minimize.mp3'),  // For minimize button
    tada: new Audio('sounds/windows-xp-sounds/tada.mp3')           // For share button
    
    // All other sounds have been removed as they're not needed
};

// Create the sound manager
window.soundManager = {
    sounds,
    enabled: true,
    
    // Track which windows have active sound operations - use WeakMap instead of data attributes
    activeWindows: new Set(),
    closingWindows: new WeakMap(), // Use WeakMap to track closing windows without affecting DOM
    
    // Play a sound effect
    play(soundName, volume = 0.5) {
        // Check if sounds are disabled or globally prevented
        if (!this.enabled || window.preventAllSounds) {
            // If the sound is critical_stop (close button), override the prevention
            // because we always want to hear the close sound
            if (window.preventAllSounds && soundName !== 'critical') {
                console.log(`Sound "${soundName}" prevented by global flag`);
                return false;
            }
            if (!this.enabled) {
                return false;
            }
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
    },
    
    // Enable or disable sound effects
    setEnabled(enabled) {
        this.enabled = enabled;
        console.log(`Sound effects ${enabled ? 'enabled' : 'disabled'}`);
    },
    
    // Add window to active sounds tracking
    addActiveWindow(windowId) {
        this.activeWindows.add(windowId);
        setTimeout(() => {
            this.activeWindows.delete(windowId);
        }, 1000);
    },
    
    // Check if a window is currently active with sounds
    isWindowActive(windowId) {
        return this.activeWindows.has(windowId);
    },
    
    // Mark a window as closing - use WeakMap
    markWindowClosing(windowElement) {
        if (!windowElement) return;
        this.closingWindows.set(windowElement, true);
        
        setTimeout(() => {
            this.closingWindows.delete(windowElement);
        }, 1500);
    },
    
    // Check if a window is closing - use WeakMap
    isWindowClosing(windowElement) {
        return windowElement && this.closingWindows.has(windowElement);
    }
};

// Use WeakMap to track window states without DOM attributes
const windowStates = new WeakMap();

// Add event listeners to play sounds for various interactions
function setupWindowsSounds() {
    // Find all windows and window controls
    const windows = document.querySelectorAll('.window');
    
    // Track which buttons we've already attached event listeners to
    const processedButtons = new Set();
    
    // Flag to track window control actions to prevent double sounds
    let recentWindowControlAction = false;
    
    // Variable to store the ID of the window that most recently had a sound played
    let lastSoundWindow = null;
    
    // Mark existing visible windows in our WeakMap
    document.querySelectorAll('.window:not(.minimized)').forEach(win => {
        // Only apply to windows that are visible from the start
        if (win.style.display !== 'none') {
            windowStates.set(win, { 
                initialWindow: true,
                soundPlayed: true
            });
            console.log('Marked initial window:', win.id);
        }
    });
    
    // Clear initial window flags after a short delay
    setTimeout(() => {
        document.querySelectorAll('.window').forEach(win => {
            const state = windowStates.get(win) || {};
            if (state.initialWindow) {
                // Update state in WeakMap instead of using dataset
                windowStates.set(win, { 
                    ...state, 
                    initialWindow: false 
                });
                console.log('Reset initial window flag for:', win.id);
                
                // After another brief delay, reset the soundPlayed flag too
                setTimeout(() => {
                    const newState = windowStates.get(win) || {};
                    windowStates.set(win, { 
                        ...newState, 
                        soundPlayed: false 
                    });
                    console.log('Reset sound played flag for:', win.id);
                }, 500);
            }
        });
    }, 3000);
    
    // Function to handle sound for a specific window
    function playSoundForWindow(windowElement, soundName, volume = 0.6, duration = 1000) {
        // Get current window state from WeakMap
        const state = windowStates.get(windowElement) || {};
        
        // Special case for critical sound (close) - always play it even for initial windows
        if (soundName === 'critical') {
            // Update state in WeakMap instead of using dataset
            windowStates.set(windowElement, { 
                ...state, 
                initialWindow: false 
            });
            
            // If this is the first close on an initially loaded window, force play sound
            if (state.soundPlayed) {
                console.log(`Forcing critical sound for initial window: ${windowElement.id}`);
                windowStates.set(windowElement, { 
                    ...state, 
                    soundPlayed: false 
                });
            }
            
            // Check if we are already in close operation to prevent double sound
            if (soundManager.isWindowClosing(windowElement)) {
                console.log(`Skipping duplicate close sound for: ${windowElement.id}`);
                return false;
            }
            
            // Mark window as being closed to prevent duplicate sounds
            soundManager.markWindowClosing(windowElement);
        }
        
        // Don't play sound if already active for this window and it's not a critical sound
        if (windowElement.id && soundManager.isWindowActive(windowElement.id) && soundName !== 'critical') {
            console.log(`Skipping sound ${soundName} for window ${windowElement.id} - already active`);
            return false;
        }
        
        // Play the sound
        const result = soundManager.play(soundName, volume);
        
        // Mark this window as having an active sound
        if (windowElement.id) {
            soundManager.addActiveWindow(windowElement.id);
            lastSoundWindow = windowElement.id;
        }
        
        // Update state in WeakMap
        windowStates.set(windowElement, { 
            ...state, 
            soundPlayed: true 
        });
        
        // Reset the marker after the specified duration
        setTimeout(() => {
            if (windowElement) {
                const currentState = windowStates.get(windowElement) || {};
                windowStates.set(windowElement, { 
                    ...currentState, 
                    soundPlayed: false 
                });
            }
        }, duration);
        
        return result;
    }
    
    windows.forEach(windowElement => {
        // Window close button - CUSTOM: Play critical_stop.mp3
        const closeButton = windowElement.querySelector('button[aria-label="Close"]');
        if (closeButton && !processedButtons.has(closeButton)) {
            processedButtons.add(closeButton);
            closeButton.addEventListener('click', (event) => {
                // Stop event propagation to prevent other listeners from firing
                event.stopPropagation();
                
                // Get current window state
                const state = windowStates.get(windowElement) || {};
                
                // Special case for initial windows - always allow close sound
                if (state.initialWindow) {
                    windowStates.set(windowElement, { 
                        ...state, 
                        initialWindow: false,
                        soundPlayed: false
                    });
                }
                
                // Set flag to prevent mutation observer from playing sounds
                recentWindowControlAction = true;
                
                // Special handling for closing windows - set a global flag to prevent ANY sounds
                // for a short period after close button is clicked
                window.preventAllSounds = true;
                
                // Play the critical sound for close - always allow it to play
                console.log('Window close clicked, playing critical sound for:', windowElement.id);
                playSoundForWindow(windowElement, 'critical', 0.6, 2000);
                
                // Reset flags after a longer delay for window close operations
                setTimeout(() => { 
                    recentWindowControlAction = false;
                    window.preventAllSounds = false;
                }, 1000);
            });
        }
        
        // Window maximize/extend button - CUSTOM: Play exclamation.mp3
        const maximizeButton = windowElement.querySelector('button[aria-label="Maximize"]');
        if (maximizeButton && !processedButtons.has(maximizeButton)) {
            processedButtons.add(maximizeButton);
            maximizeButton.addEventListener('click', (event) => {
                // Stop event propagation to prevent other listeners from firing
                event.stopPropagation();
                
                // Clear initial window flag on first interaction using WeakMap
                const state = windowStates.get(windowElement) || {};
                windowStates.set(windowElement, { 
                    ...state, 
                    initialWindow: false 
                });
                
                // Set flag to prevent mutation observer from playing sounds
                recentWindowControlAction = true;
                
                // Play the exclamation sound for maximize
                playSoundForWindow(windowElement, 'exclamation', 0.6, 1000);
                
                // Reset flags after a delay
                setTimeout(() => {
                    recentWindowControlAction = false;
                }, 500);
            });
        }
        
        // Window minimize button
        const minimizeButton = windowElement.querySelector('button[aria-label="Minimize"]');
        if (minimizeButton && !processedButtons.has(minimizeButton)) {
            processedButtons.add(minimizeButton);
            minimizeButton.addEventListener('click', (event) => {
                // Stop event propagation to prevent other listeners from firing
                event.stopPropagation();
                
                // Clear initial window flag on first interaction using WeakMap
                const state = windowStates.get(windowElement) || {};
                windowStates.set(windowElement, { 
                    ...state, 
                    initialWindow: false 
                });
                
                // Set flag to prevent mutation observer from playing sounds
                recentWindowControlAction = true;
                
                // Play the minimize sound
                playSoundForWindow(windowElement, 'minimize', 0.6, 1000);
                
                // Reset flags after a delay
                setTimeout(() => {
                    recentWindowControlAction = false;
                }, 500);
            });
        }
    });
    
    // Function to handle click with data-sound attribute
    function handleElementClick(element) {
        if (element.dataset.sound) {
            soundManager.play(element.dataset.sound, 0.6);
        }
    }
    
    // Add sounds to elements with a data-sound attribute
    const soundElements = document.querySelectorAll('[data-sound]');
    soundElements.forEach(element => {
        element.addEventListener('click', () => {
            soundManager.play(element.dataset.sound, 0.6);
        });
    });
    
    // Add notification sound for alerts
    const oldAlert = window.alert;
    window.alert = function(message) {
        soundManager.play('exclamation', 0.6);
        return oldAlert.call(window, message);
    };

    // Function to handle icon clicks with a consistent approach
    function handleIconClick(iconId, windowId, soundName = 'notify') {
        const icon = document.getElementById(iconId);
        const targetWindow = document.getElementById(windowId);
        
        if (icon && !processedButtons.has(icon)) {
            processedButtons.add(icon);
            icon.addEventListener('click', (event) => {
                console.log(`${iconId} clicked, playing ${soundName} sound`);
                recentWindowControlAction = true;
                
                // Clear initial window flag for the target window using WeakMap
                if (targetWindow) {
                    const state = windowStates.get(targetWindow) || {};
                    windowStates.set(targetWindow, { 
                        ...state, 
                        initialWindow: false 
                    });
                }
                
                if (targetWindow) {
                    playSoundForWindow(targetWindow, soundName, 0.6, 1000);
                } else {
                    soundManager.play(soundName, 0.6);
                }
                
                setTimeout(() => {
                    recentWindowControlAction = false;
                }, 500);
            });
        }
    }

    // Handle various icon clicks
    handleIconClick('wmp-icon', 'wmp-window');
    handleIconClick('ie-icon', 'ie-window');
    handleIconClick('show-desktop', 'venerus-window');
    handleIconClick('spotify-icon', 'venerus-window');
    handleIconClick('trash-icon', null, 'error');

    // CUSTOM: Share button - play tada.mp3
    const shareButtons = document.querySelectorAll('#share-song-button, #taskbar-share-button');
    shareButtons.forEach(button => {
        if (!processedButtons.has(button)) {
            processedButtons.add(button);
            button.addEventListener('click', () => {
                soundManager.play('tada', 0.6);
            });
        }
    });

    // Also add notify sound to program buttons in taskbar with improved handling
    const taskbarButtons = document.querySelectorAll('#active-programs button');
    taskbarButtons.forEach(button => {
        if (!processedButtons.has(button)) {
            processedButtons.add(button);
            button.addEventListener('click', (event) => {
                console.log('Taskbar program button clicked, playing notify sound');
                recentWindowControlAction = true;
                
                // Get window ID from taskbar button class or data attribute
                const className = button.className;
                const buttonMatch = className.match(/(\w+)-window-button/);
                let windowId = buttonMatch ? buttonMatch[1] + '-window' : null;
                
                // Or check if there's a data-window attribute
                if (!windowId && button.dataset.window) {
                    windowId = button.dataset.window;
                }
                
                // If we found a window ID, play sound for that specific window
                if (windowId) {
                    const targetWindow = document.getElementById(windowId);
                    if (targetWindow) {
                        // Clear initial window flag for the target window using WeakMap
                        const state = windowStates.get(targetWindow) || {};
                        windowStates.set(targetWindow, { 
                            ...state, 
                            initialWindow: false 
                        });
                        
                        playSoundForWindow(targetWindow, 'notify', 0.6, 1000);
                    } else {
                        soundManager.play('notify', 0.6);
                    }
                } else {
                    soundManager.play('notify', 0.6);
                }
                
                setTimeout(() => { 
                    recentWindowControlAction = false;
                }, 500);
            });
        }
    });

    // Create a MutationObserver to detect when windows become visible with improved window tracking
    try {
        const windowObserver = new MutationObserver((mutations) => {
            // Skip if a window control button was recently used or all sounds are prevented
            if (recentWindowControlAction || window.preventAllSounds) return;
            
            for (const mutation of mutations) {
                if (mutation.type === 'attributes' && 
                    (mutation.attributeName === 'style' || mutation.attributeName === 'class')) {
                    
                    const element = mutation.target;
                    const windowId = element.id;
                    
                    // Completely skip any changes if we're in a sound prevention period
                    if (window.preventAllSounds) {
                        console.log('Skipping mutation due to preventAllSounds flag');
                        continue;
                    }
                    
                    // Skip if this is the window that last played a sound
                    if (windowId === lastSoundWindow) {
                        console.log('Skipping mutation for window that just played a sound:', windowId);
                        continue;
                    }
                    
                    // Skip if this window already has an active sound
                    if (windowId && soundManager.isWindowActive(windowId)) {
                        console.log('Skipping mutation for window with active sound:', windowId);
                        continue;
                    }
                    
                    // Get current window state
                    const state = windowStates.get(element) || {};
                    
                    // Check if this is a window element becoming visible
                    if (element.classList.contains('window') && 
                        !element.classList.contains('minimized') && 
                        element.style.display !== 'none' && 
                        !state.soundPlayed) {
                        
                        // Special handling for windows that were initially visible
                        if (state.initialWindow) {
                            // On first interaction, remove the initial window marker
                            // but don't play a sound, just set the sound played marker
                            windowStates.set(element, {
                                ...state,
                                initialWindow: false,
                                soundPlayed: true
                            });
                            console.log('Skipping sound for initial window:', element.id);
                            
                            // Reset the marker after a delay
                            setTimeout(() => {
                                if (element) {
                                    const currentState = windowStates.get(element) || {};
                                    windowStates.set(element, {
                                        ...currentState,
                                        soundPlayed: false
                                    });
                                }
                            }, 800);
                        } else {
                            // For normal window visibility changes, play the notify sound
                            console.log('Window became visible, playing notify sound for:', element.id);
                            playSoundForWindow(element, 'notify', 0.6, 800);
                        }
                    }
                }
            }
        });
        
        // Observe all windows for style and class changes
        document.querySelectorAll('.window').forEach(window => {
            windowObserver.observe(window, { 
                attributes: true, 
                attributeFilter: ['style', 'class'] 
            });
        });
        
        console.log('Window visibility observer initialized with improved tracking');
    } catch (error) {
        console.error('Failed to initialize window observer:', error);
    }
    
    console.log('Windows XP sounds initialized with consistent window tracking');
}

// Setup sounds after DOM is fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupWindowsSounds);
} else {
    setupWindowsSounds();
}            