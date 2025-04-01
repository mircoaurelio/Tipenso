/**
 * windowsXPSounds.js
 * Implements Windows XP sound effects for the media player application
 */

// Check if this script has already been loaded to prevent duplicate initialization
if (typeof window.windowsXPSoundsInitialized === 'undefined') {
    window.windowsXPSoundsInitialized = true;

    // Initialize sound clips with only the essential Windows XP sounds
    const sounds = {
        // Essential sounds only - reduce 404 errors
        error: new Audio('sounds/windows-xp-sounds/error.mp3'),        // For trash can
        critical: new Audio('sounds/windows-xp-sounds/critical_stop.mp3'), // For close button
        exclamation: new Audio('sounds/windows-xp-sounds/exclamation.mp3'), // For maximize button
        ding: new Audio('sounds/windows-xp-sounds/ding.mp3'),          // For calendar
        notify: new Audio('sounds/windows-xp-sounds/notify.mp3'),      // For opening modals
        minimize: new Audio('sounds/windows-xp-sounds/minimize.mp3'),  // For minimize button
        tada: new Audio('sounds/windows-xp-sounds/tada.mp3')           // For share button
    };

    // Create the sound manager
    window.soundManager = {
        sounds,
        enabled: true,
        
        // Track which windows have active sound operations
        activeWindows: new Set(),
        
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
        
        // Variable to store the ID of the window that most recently had a sound played
        let lastSoundWindow = null;
        
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
        
        // Clear initial window flags after a short delay to ensure close sounds work
        setTimeout(() => {
            document.querySelectorAll('.window[data-initial-window="true"]').forEach(win => {
                // Reset the initial window flag but keep soundPlayed temporarily
                win.dataset.initialWindow = '';
                console.log('Reset initial window flag for:', win.id);
                
                // After another brief delay, reset the soundPlayed flag too
                setTimeout(() => {
                    win.dataset.soundPlayed = '';
                    console.log('Reset sound played flag for:', win.id);
                }, 500);
            });
        }, 3000);
        
        // Function to handle sound for a specific window
        function playSoundForWindow(windowElement, soundName, volume = 0.6, duration = 1000) {
            // Special case for critical sound (close) - always play it even for initial windows
            if (soundName === 'critical') {
                // Remove initial window marker to ensure close sound always plays
                windowElement.dataset.initialWindow = '';
                
                // If this is the first close on an initially loaded window, force play sound
                if (windowElement.dataset.soundPlayed === 'true') {
                    console.log(`Forcing critical sound for initial window: ${windowElement.id}`);
                    windowElement.dataset.soundPlayed = '';
                }
                
                // Check if we are already in close operation to prevent double sound
                if (windowElement.dataset.closingInProgress === 'true') {
                    console.log(`Skipping duplicate close sound for: ${windowElement.id}`);
                    return false;
                }
                
                // Mark window as being closed to prevent duplicate sounds
                windowElement.dataset.closingInProgress = 'true';
                
                // Clear the closing flag after close operation is done
                setTimeout(() => {
                    if (windowElement) {
                        windowElement.dataset.closingInProgress = '';
                    }
                }, 1500);
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
            
            // Set the sound played marker
            windowElement.dataset.soundPlayed = 'true';
            
            // Reset the marker after the specified duration
            setTimeout(() => {
                if (windowElement) {
                    windowElement.dataset.soundPlayed = '';
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
                    
                    // Special case for initial windows - always allow close sound
                    if (windowElement.dataset.initialWindow === 'true') {
                        windowElement.dataset.initialWindow = '';
                        windowElement.dataset.soundPlayed = '';
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
                    
                    // Clear initial window flag on first interaction
                    windowElement.dataset.initialWindow = '';
                    
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
                    
                    // Clear initial window flag on first interaction
                    windowElement.dataset.initialWindow = '';
                    
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
        
        // Fix for mobile display issues
        function fixMobileLayout() {
            if (window.innerWidth <= 768) {
                // Fix taskbar icons on mobile
                const taskbar = document.getElementById('active-programs');
                if (taskbar) {
                    taskbar.style.display = 'flex';
                    taskbar.style.justifyContent = 'flex-start';
                    taskbar.style.width = 'auto';
                }
                
                // Fix window title bars for better appearance on mobile
                const titleBars = document.querySelectorAll('.title-bar');
                titleBars.forEach(titleBar => {
                    titleBar.style.display = 'flex';
                    titleBar.style.alignItems = 'center';
                    titleBar.style.justifyContent = 'space-between';
                    if (!titleBar.style.padding) {
                        titleBar.style.padding = '2px 4px';
                    }
                    titleBar.style.minHeight = '24px';
                });
                
                // Fix window titles for better mobile readability
                const windowTitles = document.querySelectorAll('.title-bar-text');
                windowTitles.forEach(title => {
                    title.style.fontSize = '14px';
                    title.style.overflow = 'hidden';
                    title.style.textOverflow = 'ellipsis';
                    title.style.whiteSpace = 'nowrap';
                });
            }
        }
        
        // Run mobile layout fix immediately and on resize
        fixMobileLayout();
        window.addEventListener('resize', fixMobileLayout);
        
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
                    
                    // Clear initial window flag for the target window
                    if (targetWindow && targetWindow.dataset.initialWindow === 'true') {
                        targetWindow.dataset.initialWindow = '';
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
                            // Clear initial window flag for the target window
                            if (targetWindow.dataset.initialWindow === 'true') {
                                targetWindow.dataset.initialWindow = '';
                            }
                            
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
                        
                        // Check if this is a window element becoming visible
                        if (element.classList.contains('window') && 
                            !element.classList.contains('minimized') && 
                            element.style.display !== 'none' && 
                            !element.dataset.soundPlayed) {
                            
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
}            