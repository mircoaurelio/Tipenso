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
    }
};

// Add event listeners to play sounds for various interactions
function setupWindowsSounds() {
    // Find all windows and window controls
    const windows = document.querySelectorAll('.window');
    
    // Track which buttons we've already attached event listeners to
    const processedButtons = new Set();
    
    // Flag to track window control actions to prevent double sounds
    let recentWindowControlAction = false;
    
    // Mark existing visible windows as already activated to prevent sounds
    // on the first interaction (especially for WMP window that's visible on load)
    document.querySelectorAll('.window:not(.minimized)').forEach(win => {
        // Only apply to windows that are visible from the start
        if (win.style.display !== 'none') {
            win.dataset.soundPlayed = 'true';
            win.dataset.initialWindow = 'true';
            console.log('Marked initial window:', win.id);
        }
    });
    
    windows.forEach(windowElement => {
        // Window close button - CUSTOM: Play critical_stop.mp3
        const closeButton = windowElement.querySelector('button[aria-label="Close"]');
        if (closeButton && !processedButtons.has(closeButton)) {
            processedButtons.add(closeButton);
            closeButton.addEventListener('click', (event) => {
                // Stop event propagation to prevent other listeners from firing
                event.stopPropagation();
                
                // Check if sound was recently played for this window to prevent double sounds
                if (windowElement.dataset.soundPlayed === 'true') {
                    console.log('Skipping close sound, sound already played for:', windowElement.id);
                    return;
                }
                
                // Set flag to prevent mutation observer from playing sounds
                recentWindowControlAction = true;
                
                // Special handling for closing windows - set a global flag to prevent ANY sounds
                // for a short period after close button is clicked
                window.preventAllSounds = true;
                
                // Force remove any sound markers from the window to prevent
                // sounds playing when window closes or gets minimized
                windowElement.dataset.soundPlayed = 'true';
                
                // Play the critical sound for close
                console.log('Window close clicked, playing critical sound for:', windowElement.id);
                soundManager.play('critical', 0.6);
                
                // Reset flags after a longer delay for window close operations
                setTimeout(() => { 
                    recentWindowControlAction = false;
                    window.preventAllSounds = false;
                    
                    // Keep the soundPlayed marker on the window for a bit longer
                    setTimeout(() => {
                        if (windowElement) {
                            windowElement.dataset.soundPlayed = '';
                        }
                    }, 800);
                }, 1500); // Longer timeout to prevent any sounds during closing animation
            });
        }
        
        // Window maximize/extend button - CUSTOM: Play exclamation.mp3
        const maximizeButton = windowElement.querySelector('button[aria-label="Maximize"]');
        if (maximizeButton && !processedButtons.has(maximizeButton)) {
            processedButtons.add(maximizeButton);
            maximizeButton.addEventListener('click', (event) => {
                // Stop event propagation to prevent other listeners from firing
                event.stopPropagation();
                // Set flag to prevent mutation observer from playing sounds
                recentWindowControlAction = true;
                // Play the exclamation sound for maximize
                soundManager.play('exclamation', 0.6);
                
                // Force set sound marker to prevent additional sounds
                windowElement.dataset.soundPlayed = 'true';
                
                // Reset flags after a delay
                setTimeout(() => {
                    recentWindowControlAction = false;
                    // Keep the soundPlayed marker a bit longer
                    setTimeout(() => {
                        windowElement.dataset.soundPlayed = '';
                    }, 500);
                }, 1000);
            });
        }
        
        // Window minimize button
        const minimizeButton = windowElement.querySelector('button[aria-label="Minimize"]');
        if (minimizeButton && !processedButtons.has(minimizeButton)) {
            processedButtons.add(minimizeButton);
            minimizeButton.addEventListener('click', (event) => {
                // Stop event propagation to prevent other listeners from firing
                event.stopPropagation();
                // Set flag to prevent mutation observer from playing sounds
                recentWindowControlAction = true;
                // Play the minimize sound
                soundManager.play('minimize', 0.6);
                
                // Force set sound marker to prevent additional sounds
                windowElement.dataset.soundPlayed = 'true';
                
                // Reset flags after a delay
                setTimeout(() => {
                    recentWindowControlAction = false;
                    // Keep the soundPlayed marker a bit longer
                    setTimeout(() => {
                        windowElement.dataset.soundPlayed = '';
                    }, 500);
                }, 1000);
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

    // CUSTOM: Open modal buttons - play notify.mp3
    // Only add this to buttons with the data-open-modal attribute,
    // not to regular window control buttons
    const modalOpenButtons = document.querySelectorAll('[data-open-modal]');
    console.log('Found modal open buttons:', modalOpenButtons.length);
    modalOpenButtons.forEach(button => {
        if (!processedButtons.has(button)) {
            processedButtons.add(button);
            button.addEventListener('click', (event) => {
                console.log('Modal open button clicked, playing notify sound');
                soundManager.play('notify', 0.6);
            });
        }
    });
    
    // CUSTOM: Trash can - play error.mp3
    const trashCan = document.getElementById('trash-icon');
    if (trashCan) {
        trashCan.addEventListener('click', () => {
            soundManager.play('error', 0.6);
        });
    }
    
    // Calendar has been removed, no need to check for it anymore
    
    // CUSTOM: Share button - play tada.mp3
    const shareButtons = document.querySelectorAll('#share-song-button, #taskbar-share-button');
    shareButtons.forEach(button => {
        button.addEventListener('click', () => {
            soundManager.play('tada', 0.6);
        });
    });
    
    // Check for wmp-icon and add the notify sound directly 
    // in case data-open-modal event listener is not working
    const wmpIcon = document.getElementById('wmp-icon');
    if (wmpIcon && !processedButtons.has(wmpIcon)) {
        processedButtons.add(wmpIcon);
        wmpIcon.addEventListener('click', (event) => {
            console.log('WMP icon clicked directly, playing notify sound');
            recentWindowControlAction = true;
            soundManager.play('notify', 0.6);
            
            // Get the WMP window and mark it as having played a sound
            const wmpWindow = document.getElementById('wmp-window');
            if (wmpWindow) {
                wmpWindow.dataset.soundPlayed = 'true';
            }
            
            setTimeout(() => { 
                recentWindowControlAction = false;
                // Keep soundPlayed marker a bit longer
                if (wmpWindow) {
                    setTimeout(() => {
                        wmpWindow.dataset.soundPlayed = '';
                    }, 500);
                }
            }, 1000);
        });
    }

    // Add notify sound to Internet Explorer icon
    const ieIcon = document.getElementById('ie-icon');
    if (ieIcon && !processedButtons.has(ieIcon)) {
        processedButtons.add(ieIcon);
        ieIcon.addEventListener('click', (event) => {
            console.log('IE icon clicked, playing notify sound');
            recentWindowControlAction = true;
            soundManager.play('notify', 0.6);
            
            // Mark IE window as having played a sound
            const ieWindow = document.getElementById('ie-window');
            if (ieWindow) {
                ieWindow.dataset.soundPlayed = 'true';
            }
            
            setTimeout(() => { 
                recentWindowControlAction = false;
                // Keep soundPlayed marker a bit longer
                if (ieWindow) {
                    setTimeout(() => {
                        ieWindow.dataset.soundPlayed = '';
                    }, 500);
                }
            }, 1000);
        });
    }
    
    // Add notify sound to Venerus Spotify button (show-desktop)
    const showDesktopBtn = document.getElementById('show-desktop');
    if (showDesktopBtn && !processedButtons.has(showDesktopBtn)) {
        processedButtons.add(showDesktopBtn);
        showDesktopBtn.addEventListener('click', (event) => {
            console.log('Venerus Spotify button clicked, playing notify sound');
            recentWindowControlAction = true;
            soundManager.play('notify', 0.6);
            
            // Mark Venerus window as having played a sound
            const venerusWindow = document.getElementById('venerus-window');
            if (venerusWindow) {
                venerusWindow.dataset.soundPlayed = 'true';
            }
            
            setTimeout(() => { 
                recentWindowControlAction = false;
                // Keep soundPlayed marker a bit longer
                if (venerusWindow) {
                    setTimeout(() => {
                        venerusWindow.dataset.soundPlayed = '';
                    }, 500);
                }
            }, 1000);
        });
    }

    // Add sound to Spotify desktop icon
    const spotifyIcon = document.getElementById('spotify-icon');
    if (spotifyIcon && !processedButtons.has(spotifyIcon)) {
        processedButtons.add(spotifyIcon);
        spotifyIcon.addEventListener('click', (event) => {
            console.log('Spotify desktop icon clicked, playing notify sound');
            recentWindowControlAction = true;
            soundManager.play('notify', 0.6);
            
            // Mark Venerus window as having played a sound since that's what this opens
            const venerusWindow = document.getElementById('venerus-window');
            if (venerusWindow) {
                venerusWindow.dataset.soundPlayed = 'true';
            }
            
            setTimeout(() => { 
                recentWindowControlAction = false;
                // Keep soundPlayed marker a bit longer
                if (venerusWindow) {
                    setTimeout(() => {
                        venerusWindow.dataset.soundPlayed = '';
                    }, 500);
                }
            }, 1000);
        });
    }

    // Also add notify sound to program buttons in taskbar
    const taskbarButtons = document.querySelectorAll('#active-programs button');
    taskbarButtons.forEach(button => {
        if (!processedButtons.has(button)) {
            processedButtons.add(button);
            button.addEventListener('click', (event) => {
                console.log('Taskbar program button clicked, playing notify sound');
                recentWindowControlAction = true;
                soundManager.play('notify', 0.6);
                
                // Get window ID from taskbar button class or data attribute
                // Button class may contain window ID like "wmp-window-button"
                const className = button.className;
                const buttonMatch = className.match(/(\w+)-window-button/);
                let windowId = buttonMatch ? buttonMatch[1] + '-window' : null;
                
                // Or check if there's a data-window attribute
                if (!windowId && button.dataset.window) {
                    windowId = button.dataset.window;
                }
                
                // If we found a window ID, mark it to prevent double sounds
                if (windowId) {
                    const targetWindow = document.getElementById(windowId);
                    if (targetWindow) {
                        targetWindow.dataset.soundPlayed = 'true';
                    }
                }
                
                // Also mark all windows to be safe
                document.querySelectorAll('.window').forEach(win => {
                    if (!win.classList.contains('minimized')) {
                        win.dataset.soundPlayed = 'true';
                    }
                });
                
                setTimeout(() => { 
                    recentWindowControlAction = false;
                    // Reset all windows' sound markers after a delay
                    setTimeout(() => {
                        document.querySelectorAll('.window').forEach(win => {
                            win.dataset.soundPlayed = '';
                        });
        }, 500);
                }, 1000);
            });
        }
    });

    // Check the HTML structure of the page
    console.log('=== Sound Debug ===');
    console.log('WMP icon exists:', !!document.getElementById('wmp-icon'));
    console.log('WMP icon has data-open-modal:', !!document.getElementById('wmp-icon')?.getAttribute('data-open-modal'));
    console.log('=== End Sound Debug ===');
    
    // Create a MutationObserver to detect when windows become visible
    // This ensures that any window that gets displayed will play the notify sound
    try {
        const windowObserver = new MutationObserver((mutations) => {
            // Skip if a window control button was recently used or all sounds are prevented
            if (recentWindowControlAction || window.preventAllSounds) return;
            
            for (const mutation of mutations) {
                if (mutation.type === 'attributes' && 
                    (mutation.attributeName === 'style' || mutation.attributeName === 'class')) {
                    
                    const element = mutation.target;
                    
                    // Completely skip any changes if we're in a sound prevention period
                    if (window.preventAllSounds) {
                        console.log('Skipping mutation due to preventAllSounds flag');
                        continue;
                    }
                    
                    // Check for window closing - shouldn't play sounds
                    if (element.classList.contains('window') && 
                        (element.style.display === 'none' || 
                         element.classList.contains('minimized'))) {
                        // Reset sound marker when window is hidden
                        element.dataset.soundPlayed = '';
                        continue;  // Skip to next mutation
                    }
                    
                    // Check if this is a window element becoming visible
                    if (element.classList.contains('window') && 
                        !element.classList.contains('minimized') && 
                        element.style.display !== 'none' && 
                        !element.dataset.soundPlayed) {
                        
                        // One more check to ensure we're not in the middle of a close operation
                        if (window.preventAllSounds) {
                            console.log('Skipping notify sound due to preventAllSounds flag');
                            continue;
                        }
                        
                        // Special handling for windows that were initially visible
                        if (element.dataset.initialWindow === 'true') {
                            // On first interaction, remove the initial window marker
                            // but don't play a sound, just set the sound played marker
                            element.dataset.initialWindow = '';
                            element.dataset.soundPlayed = 'true';
                            console.log('Skipping sound for initial window:', element.id);
                            
                            // Reset the marker after a delay
                            setTimeout(() => {
                                if (element) {
                                    element.dataset.soundPlayed = '';
                                }
                            }, 800);
                        } else {
                            // For normal window visibility changes
                            // Mark this window as having played the sound
                            element.dataset.soundPlayed = 'true';
                            
                            // Play the notify sound
                            console.log('Window became visible, playing notify sound for:', element.id);
                            soundManager.play('notify', 0.6);
                            
                            // Reset the marker after a short delay
                            setTimeout(() => {
                                if (element) {
                                    element.dataset.soundPlayed = '';
                                }
                            }, 800);
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
        
        console.log('Window visibility observer initialized');
    } catch (error) {
        console.error('Failed to initialize window observer:', error);
    }
    
    console.log('Windows XP sounds initialized with essential sounds only');
}

// Setup sounds after DOM is fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupWindowsSounds);
} else {
    setupWindowsSounds();
}            