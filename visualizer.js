class Visualizer {
    constructor() {
        // Store this instance globally so it can be accessed by other scripts
        window.visualizerInstance = this;
        
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('visualizer'),
            antialias: true
        });

        this.clock = new THREE.Clock();
        this.intensity = 0.5;
        this.visualizationIntensity = 1.0;
        this.isMobile = this.checkIfMobile();
        
        // Add playback status properties
        this.isPlaying = false;
        this.playbackStatusElement = null;
        this.lastInteractionTime = 0;
        this.playbackToggleTimeout = null;
        this.spotifyController = null; // Store the Spotify controller
        
        // Initialize kaleidoscope pattern
        this.kaleidoscopePattern = 1;
        
        // Create direct embed immediately to ensure we have a visible player
        this.createDirectSpotifyEmbed();
        
        // Setup the modal visualizer
        this.modalVisualizer = null;
        
        // Add event listeners system
        this.eventListeners = {};
        
        // Setup in the right order
        this.setupScene().then(() => {
            this.setupSpotifyAPI();
            this.setupWindowsControls();
            this.handleResize();
            this.setupClock();
            this.createStatusDisplay();
            this.initModalVisualizer();
            this.animate();
            this.positionWindowForDevice();
            console.log("Visualizer initialized successfully!");
        }).catch(err => {
            console.error("Error initializing visualizer:", err);
        });

        window.addEventListener('resize', () => {
            this.handleResize();
            this.positionWindowForDevice();
            
            // Also resize the modal visualizer if it exists
            if (this.modalVisualizer) {
                this.modalVisualizer.handleResize();
            }
        });
    }
    
    checkIfMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
            || (window.innerWidth <= 768);
    }
    
    positionWindowForDevice() {
        const windowElement = document.querySelector('.window');
        if (!windowElement) return;
        
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // For mobile, position the window in a good default position
        if (this.isMobile) {
            // Center horizontally, position near the top
            windowElement.style.left = '50%';
            windowElement.style.top = '10%';
            windowElement.style.transform = 'translateX(-50%)';
            
            // Set appropriate width
            if (width < 500) {
                windowElement.style.width = '90%';
                windowElement.style.minWidth = '280px';
            }
        } else {
            // For desktop, if window doesn't have explicit position, set one
            if (!windowElement.style.left) {
                windowElement.style.left = `${Math.max(20, (width - 400) / 2)}px`;
                windowElement.style.top = `${Math.max(20, (height - 400) / 3)}px`;
            }
        }
    }

    async setupScene() {
        try {
            // Load the Bliss wallpaper texture
            const textureLoader = new THREE.TextureLoader();
            
            // Updated Bliss image URL - use local file
            const blissImageUrl = 'shaders/bliss.jpg';
            // Fallback URLs if the main one fails
            const fallbackUrls = [
                'https://i.imgur.com/JMhHPz6.jpg',
                'https://cdn.wallpapersafari.com/38/77/hKvU4q.jpg'
            ];
            
            let blissTexture;
            try {
                blissTexture = await new Promise((resolve, reject) => {
                    textureLoader.setCrossOrigin('anonymous');
                    textureLoader.load(
                        blissImageUrl, 
                        texture => {
                            // Use ClampToEdgeWrapping to make image cut off at edges instead of repeating
                            texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
                            resolve(texture);
                        },
                        undefined,
                        error => {
                            console.warn('Primary texture failed to load, trying fallbacks:', error);
                            reject(error);
                        }
                    );
                });
            } catch (error) {
                // Try fallback URLs one by one
                for (const fallbackUrl of fallbackUrls) {
                    try {
                        console.log('Trying fallback URL:', fallbackUrl);
                        blissTexture = await new Promise((resolve, reject) => {
                            textureLoader.load(
                                fallbackUrl,
                                texture => {
                                    // Use ClampToEdgeWrapping for fallbacks too
                                    texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
                                    resolve(texture);
                                },
                                undefined,
                                reject
                            );
                        });
                        console.log('Successfully loaded fallback texture');
                        break; // Exit the loop if successful
                    } catch (fallbackError) {
                        console.warn('Fallback texture failed:', fallbackError);
                    }
                }
            }
            
            // If all URLs fail, create a canvas fallback
            if (!blissTexture) {
                console.warn('All texture URLs failed, creating canvas fallback');
                const canvas = document.createElement('canvas');
                canvas.width = 512;
                canvas.height = 384;
                const ctx = canvas.getContext('2d');
                
                // Plain green and blue background like Bliss
                const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
                gradient.addColorStop(0, '#66CCFF');  // Sky blue at top
                gradient.addColorStop(0.6, '#8CCCFF'); // Lighter blue
                gradient.addColorStop(1, '#66DD66');   // Green at bottom
                
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                blissTexture = new THREE.CanvasTexture(canvas);
                // Use ClampToEdgeWrapping for the canvas fallback too
                blissTexture.wrapS = blissTexture.wrapT = THREE.ClampToEdgeWrapping;
            }

            await this.loadShader('vertex-shader.glsl', 'fragment-shader.glsl', blissTexture);
            
            // Initialize the size
            const width = window.innerWidth;
            const height = window.innerHeight;
            this.renderer.setSize(width, height);
            
        } catch (error) {
            console.error('Error in setupScene:', error);
        }
    }

    async loadShader(vertexPath, fragmentPath, texture) {
        try {
            const responses = await Promise.all([
                fetch(vertexPath),
                fetch(fragmentPath)
            ]);
            
            const [vertexShader, fragmentShader] = await Promise.all(
                responses.map(r => r.text())
            );

            const geometry = new THREE.PlaneGeometry(2, 2);
            const material = new THREE.ShaderMaterial({
                vertexShader,
                fragmentShader,
                uniforms: {
                    iTime: { value: 0 },
                    iResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
                    iIntensity: { value: this.intensity * this.visualizationIntensity },
                    iTexture: { value: texture },
                    iKaleidoscopePattern: { value: this.kaleidoscopePattern }
                }
            });

            const mesh = new THREE.Mesh(geometry, material);
            this.scene.add(mesh);
            this.material = material;
            
            return material;
        } catch (error) {
            console.error('Error loading shader:', error);
            // Fallback to basic material if shader fails
            const geometry = new THREE.PlaneGeometry(2, 2);
            const material = new THREE.MeshBasicMaterial({ 
                map: texture,
                transparent: true,
                opacity: 1.0
            });

            const mesh = new THREE.Mesh(geometry, material);
            this.scene.add(mesh);
            this.material = material;
            
            return material;
        }
    }

    setupSpotifyAPI() {
        // Define the onSpotifyIframeApiReady callback function
        window.onSpotifyIframeApiReady = (IFrameAPI) => {
            console.log('Spotify iframe API is ready');
            
            // Get the container element
            const container = document.querySelector('.player-container');
            if (!container) {
                console.error('Spotify container not found');
                return;
            }
            
            console.log('Found Spotify container');
            
            // Check if we already have an iframe
            const existingIframe = container.querySelector('iframe#spotify-player');
            if (existingIframe) {
                console.log('Using existing iframe');
                
                // Try to attach to the existing iframe
                try {
                    IFrameAPI.createController(existingIframe, {}, (controller) => {
                        this.spotifyController = controller;
                        console.log('Successfully attached to existing iframe');
                        
                        // Listen for playback updates
                        this.setupControllerListeners(controller);
                    });
                } catch (error) {
                    console.error('Failed to attach to existing iframe:', error);
                }
            } else {
                // Create a new element for the iframe
                const element = document.createElement('div');
                element.id = 'spotify-embed-iframe';
                container.appendChild(element);
                
                // Options for creating a new embed
                const options = {
                    uri: 'spotify:track:3oBVv54hTMSYXXJGxO5JxJ',
                    width: '100%',
                    height: '152px'
                };
                
                try {
                    // Create the controller with a new iframe
                    IFrameAPI.createController(element, options, (controller) => {
                        // Store the controller reference
                        this.spotifyController = controller;
                        
                        console.log('Spotify controller created successfully');
                        
                        // Listen for playback updates
                        this.setupControllerListeners(controller);
                    });
                } catch (error) {
                    console.error('Failed to create Spotify controller:', error);
                    
                    // Fallback: Insert a standard iframe if the API method fails
                    this.createFallbackSpotifyEmbed(container);
                }
            }
        };
        
        // Load the Spotify iframe API script
        if (!document.getElementById('spotify-iframe-api')) {
            const script = document.createElement('script');
            script.id = 'spotify-iframe-api';
            script.src = 'https://open.spotify.com/embed-podcast/iframe-api/v1';
            script.async = true;
            document.head.appendChild(script);
        }
        
        // Setup direct event listeners on the iframe
        this.setupDirectIframeListeners();
        
        // Fallback: Check if we need to create a direct embed
        setTimeout(() => {
            const spotifyEmbed = document.querySelector('#spotify-embed-iframe iframe, #spotify-player');
            if (!spotifyEmbed || !spotifyEmbed.offsetHeight) {
                console.log('Spotify iframe not created or visible, using fallback');
                this.createFallbackSpotifyEmbed(document.querySelector('.player-container'));
            }
        }, 2000);
        
        // Keep the existing message event listener as a fallback
        window.addEventListener('message', (event) => {
            try {
                // Check if the message is from Spotify
                if (event.origin.includes('spotify.com')) {
                    console.log('Received message from Spotify:', event.data);
                    
                    // Check if it contains playback data
                    if (event.data && typeof event.data === 'object') {
                        // For Spotify Web Playback SDK
                        if (event.data.type === 'player_state_changed') {
                            this.intensity = !event.data.payload.paused ? 1.0 : 0.5;
                            this.updatePlaybackStatus(!event.data.payload.paused);
                            console.log('Playback status updated via SDK:', !event.data.payload.paused);
                        }
                        // For Spotify Embed API
                        else if (event.data.type === 'playback_update') {
                            this.intensity = !event.data.isPaused ? 1.0 : 0.5;
                            this.updatePlaybackStatus(!event.data.isPaused);
                            console.log('Playback status updated via Embed API:', !event.data.isPaused);
                        }
                        // Generic data
                        else if (event.data.playing !== undefined) {
                            this.intensity = event.data.playing ? 1.0 : 0.5;
                            this.updatePlaybackStatus(event.data.playing);
                            console.log('Playback status updated via generic event:', event.data.playing);
                        }
                    }
                }
            } catch (error) {
                console.error('Error processing Spotify message:', error);
            }
        });
    }
    
    // Setup controller event listeners
    setupControllerListeners(controller) {
        // Listen for playback updates
        controller.addListener('playback_update', (e) => {
            // Update the playing status based on the isPaused property
            this.isPlaying = !e.data.isPaused;
            
            // Update the intensity for visualization
            this.intensity = this.isPlaying ? 1.0 : 0.5;
            
            // Update the UI to reflect the current status
            this.updatePlaybackStatus(this.isPlaying);
            
            console.log('Playback status updated from controller:', 
                this.isPlaying ? 'Playing' : 'Paused', 
                'Position:', e.data.position, 
                'Duration:', e.data.duration);
        });
        
        // Also listen for ready event
        controller.addListener('ready', () => {
            console.log('Spotify player is ready');
            
            // Default to paused state at init
            this.updatePlaybackStatus(false);
        });
        
        // Listen for errors
        controller.addListener('error', (e) => {
            console.error('Spotify controller error:', e);
        });
    }

    // Setup direct event listeners on the iframe
    setupDirectIframeListeners() {
        // Try to listen for iframe events directly
        setTimeout(() => {
            const iframe = document.querySelector('#spotify-player, #spotify-embed-iframe iframe');
            if (iframe) {
                console.log('Setting up iframe listeners');
                
                // Set up a periodic check for playback state
                let lastIframeClickTime = 0;
                let lastPlaybackState = this.isPlaying;
                
                // Add click listener to iframe to detect user interactions
                iframe.addEventListener('load', () => {
                    console.log('Spotify iframe loaded, setting up listeners');
                    
                    // Try to register when user clicks on the iframe
                    iframe.addEventListener('click', () => {
                        lastIframeClickTime = Date.now();
                        console.log('Iframe clicked, will check for status change');
                        
                        // After a click, check if playback state changed several times
                        const checkForChanges = (checksLeft) => {
                            if (checksLeft <= 0) return;
                            
                            setTimeout(() => {
                                // Use public Spotify API check if available
                                if (this.spotifyController) {
                                    try {
                                        this.spotifyController.getPlaybackState().then(state => {
                                            const isPlaying = state && !state.isPaused;
                                            if (isPlaying !== lastPlaybackState) {
                                                console.log('Playback state changed from iframe click:', isPlaying);
                                                this.updatePlaybackStatus(isPlaying);
                                                this.intensity = isPlaying ? 1.0 : 0.5;
                                                lastPlaybackState = isPlaying;
                                            }
                                        }).catch(err => {
                                            console.warn('Error checking playback state:', err);
                                        });
                                    } catch (e) {
                                        console.warn('Error accessing controller:', e);
                                    }
                                }
                                
                                // Continue checking
                                checkForChanges(checksLeft - 1);
                            }, 300); // Check every 300ms
                        };
                        
                        // Start checking for changes
                        checkForChanges(5); // Check 5 times over 1.5 seconds
                    });
                });
                
                // Set up a MutationObserver to detect DOM changes in the iframe
                try {
                    // Monitor the iframe parent for changes that might indicate playback status
                    const parentObserver = new MutationObserver((mutations) => {
                        for (const mutation of mutations) {
                            if (mutation.type === 'attributes' || mutation.type === 'childList') {
                                // Check if the change might be related to playback
                                const now = Date.now();
                                if (now - lastIframeClickTime < 3000) { // If recent click
                                    console.log('Spotify iframe changed after click');
                                    
                                    // Wait just a bit for the state to settle
                                    setTimeout(() => {
                                        // Try to use the controller
                                        if (this.spotifyController) {
                                            try {
                                                this.spotifyController.getPlaybackState().then(state => {
                                                    const isPlaying = state && !state.isPaused;
                                                    if (isPlaying !== lastPlaybackState) {
                                                        console.log('Playback state changed after mutation:', isPlaying);
                                                        this.updatePlaybackStatus(isPlaying);
                                                        this.intensity = isPlaying ? 1.0 : 0.5;
                                                        lastPlaybackState = isPlaying;
                                                    }
                                                }).catch(err => {});
                                            } catch (e) {}
                                        }
                                    }, 200);
                                }
                            }
                        }
                    });
                    
                    // Observe the iframe parent element
                    const container = document.querySelector('.player-container');
                    if (container) {
                        parentObserver.observe(container, { 
                            attributes: true, 
                            childList: true, 
                            subtree: true 
                        });
                    }
                } catch (e) {
                    console.warn('Could not set up MutationObserver:', e);
                }
                
                // Try to monitor iframe interactions
                const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document;
                if (iframeDocument) {
                    try {
                        // Try to attach click listeners to the iframe content
                        iframeDocument.addEventListener('click', (e) => {
                            console.log('Iframe click detected');
                            
                            // Check clicks on play/pause button - very basic detection
                            setTimeout(() => {
                                // After a small delay, check if playback might have started
                                // by observing if any audio elements are playing
                                const isAnyAudioPlaying = Array.from(iframeDocument.querySelectorAll('audio, video'))
                                    .some(media => !media.paused);
                                
                                if (isAnyAudioPlaying !== this.isPlaying) {
                                    console.log('Audio state change detected in iframe:', isAnyAudioPlaying);
                                    this.updatePlaybackStatus(isAnyAudioPlaying);
                                    this.intensity = isAnyAudioPlaying ? 1.0 : 0.5;
                                }
                            }, 500);
                        });
                    } catch (e) {
                        console.warn('Could not attach listeners to iframe content:', e);
                    }
                }
                
                // Use MutationObserver as another way to detect changes
                try {
                    const observer = new MutationObserver((mutations) => {
                        // Look for changes that might indicate playback status change
                        console.log('Iframe mutation detected');
                        
                        // Check if play button classes changed
                        const hasPlayingClass = iframe.classList.contains('playing') || 
                                               iframe.classList.contains('active');
                        
                        if (hasPlayingClass !== this.isPlaying) {
                            console.log('Play state change detected via class:', hasPlayingClass);
                            this.updatePlaybackStatus(hasPlayingClass);
                            this.intensity = hasPlayingClass ? 1.0 : 0.5;
                        }
                    });
                    
                    observer.observe(iframe, { 
                        attributes: true, 
                        childList: false, 
                        subtree: false,
                        attributeFilter: ['class'] 
                    });
                } catch (e) {
                    console.warn('Could not set up MutationObserver:', e);
                }
            }
        }, 2000);
    }

    // Create a direct iframe embed as a fallback
    createFallbackSpotifyEmbed(container) {
        if (!container) return;
        
        container.innerHTML = `
            <iframe 
                id="spotify-player"
                style="border-radius:12px; display: block; position: relative; z-index: 20; width: 100%; height: 152px;"
                src="https://open.spotify.com/embed/track/3oBVv54hTMSYXXJGxO5JxJ?utm_source=generator" 
                frameBorder="0" 
                allowfullscreen="" 
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                loading="eager">
            </iframe>
        `;
        
        console.log('Created fallback Spotify embed');
    }
    
    // Toggle play/pause using the Spotify API
    togglePlayback() {
        // Get current playback state
        const isCurrentlyPlaying = this.isPlaying;
        console.log("Current playback state:", isCurrentlyPlaying);
        
        // Determine new playback state
        const newPlaybackState = !isCurrentlyPlaying;
        
        // Use the Spotify controller if available
        if (this.spotifyController) {
            try {
                if (newPlaybackState) {
                    // Explicitly call play on the controller
                    console.log("Sending PLAY command to Spotify controller");
                    this.spotifyController.playFromClickEvent(); // Use the play from click method
                } else {
                    // Explicitly call pause on the controller
                    console.log("Sending PAUSE command to Spotify controller");
                    this.spotifyController.pause();
                }
            } catch (e) {
                console.warn("Spotify playback command failed, trying toggle:", e);
                try {
                    // Fallback to toggle
                    this.spotifyController.toggle();
                } catch (err) {
                    console.error("All Spotify commands failed:", err);
                }
            }
        } else {
            // If no controller, try to find the iframe
            const spotifyFrame = document.querySelector('#spotify-embed-iframe iframe');
            if (spotifyFrame) {
                try {
                    // Try sending a message to the iframe
                    const message = newPlaybackState ? "play" : "pause";
                    console.log(`Sending ${message} message to Spotify iframe`);
                    spotifyFrame.contentWindow.postMessage({ command: message }, "*");
                    
                    // Try clicking the play button directly
                    setTimeout(() => {
                        try {
                            // Try to access the iframe content to click the play button
                            const playButton = spotifyFrame.contentDocument.querySelector('.play-pause-btn');
                            if (playButton) {
                                console.log("Found play button, clicking it");
                                playButton.click();
                            } else {
                                console.log("Play button not found in iframe");
                            }
                        } catch (err) {
                            console.warn("Error accessing iframe content:", err);
                        }
                    }, 100);
                } catch (e) {
                    console.error("Error controlling Spotify iframe:", e);
                }
            }
        }
        
        // Update our local playback state
        this.isPlaying = newPlaybackState;
        console.log("Updated playback state to:", this.isPlaying);
        
        // Update the status text display
        this.updatePlaybackStatus();
        
        // Update modal visualizer if available
        if (this.modalVisualizer) {
            this.modalVisualizer.updatePlaybackStatus(this.isPlaying);
        }
        
        // Notify listeners about playback change
        this.dispatchEvent('playback-update', { isPlaying: this.isPlaying });
        
        return this.isPlaying;
    }
    
    setupSpotifyListener() {
        // This method is replaced by setupSpotifyAPI, but keep for backwards compatibility
        
        // Add a more reliable detection method using iframe interaction
        const spotifyIframe = document.querySelector('.player-container iframe');
        if (!spotifyIframe) return;
        
        // Create an overlay to capture iframe interactions
        const interactionOverlay = document.createElement('div');
        interactionOverlay.style.position = 'absolute';
        interactionOverlay.style.top = '0';
        interactionOverlay.style.left = '0';
        interactionOverlay.style.width = '100%';
        interactionOverlay.style.height = '100%';
        interactionOverlay.style.zIndex = '1';
        interactionOverlay.style.cursor = 'pointer';
        interactionOverlay.style.opacity = '0';  // Make it fully transparent
        
        // Make it transparent to clicks so they pass through to the iframe
        interactionOverlay.style.pointerEvents = 'none';
        
        // Add it as a sibling to the iframe with relative positioning on the container
        const playerContainer = document.querySelector('.player-container');
        if (playerContainer) {
            playerContainer.style.position = 'relative';
            playerContainer.appendChild(interactionOverlay);
        }
        
        // Watch for visibility changes (important for playback status)
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                // When tab becomes visible again, check if playback status can be inferred
                this.checkPlaybackStatus();
            }
        });
    }
    
    handleIframeInteraction() {
        // If we have the Spotify controller, use it directly
        if (this.spotifyController) {
            this.togglePlayback();
            return;
        }
        
        // Legacy fallback if the API integration isn't working
        // Record the time of interaction
        this.lastInteractionTime = Date.now();
        
        // Clear any existing timeout
        if (this.playbackToggleTimeout) {
            clearTimeout(this.playbackToggleTimeout);
        }
        
        // Schedule a status toggle with a short delay
        this.playbackToggleTimeout = setTimeout(() => {
            // Toggle the playback status
            this.isPlaying = !this.isPlaying;
            this.updatePlaybackStatus(this.isPlaying);
            
            // Update visualization intensity
            this.intensity = this.isPlaying ? 1.0 : 0.5;
            
            // Send a message that other components might be listening for
            window.postMessage({
                type: 'playback_update',
                playing: this.isPlaying
            }, '*');
        }, 300); // Short delay to avoid processing multiple rapid clicks
    }
    
    createStatusDisplay() {
        // Create a status element if it doesn't exist
        if (!this.playbackStatusElement) {
            const container = document.querySelector('.controls');
            if (container) {
                this.playbackStatusElement = document.createElement('div');
                this.playbackStatusElement.className = 'playback-status';
                this.playbackStatusElement.style.marginLeft = '10px';
                this.playbackStatusElement.style.padding = '3px 8px';
                this.playbackStatusElement.style.border = '1px solid #ccc';
                this.playbackStatusElement.style.borderRadius = '3px';
                this.playbackStatusElement.style.backgroundColor = '#f0f0f0';
                this.playbackStatusElement.style.fontWeight = 'bold';
                container.appendChild(this.playbackStatusElement);
            }
        }
        
        // Initial status is "Paused"
        this.updatePlaybackStatus(false);
    }
    
    updatePlaybackStatus(newState = null) {
        // If a new state is provided, update the current state
        if (newState !== null) {
            this.isPlaying = newState;
        }

        // Update the visual indicator
        const statusElement = document.getElementById('playback-status');
        if (statusElement) {
            statusElement.textContent = this.isPlaying ? 'Playing' : 'Paused';
            statusElement.className = this.isPlaying ? 'status-playing' : 'status-paused';
        }

        // Update debug button text
        const debugButton = document.getElementById('toggle-button');
        if (debugButton) {
            debugButton.textContent = this.isPlaying ? 'Pause' : 'Play';
        }
        
        // Update intensity and shader parameters
        this.intensity = this.isPlaying ? 1.0 : 0.5;
        
        // Update modal visualizer if available
        if (this.modalVisualizer) {
            this.modalVisualizer.updatePlaybackStatus(this.isPlaying);
        }
        
        // Dispatch event for other components
        this.dispatchEvent('playback-update', { isPlaying: this.isPlaying });
    }
    
    checkPlaybackStatus() {
        // This method tries to infer playback status when direct detection isn't possible
        
        // For now we just use the last known state, but this could be enhanced
        // with additional heuristics like analyzing visualization patterns
        
        // If it's been more than 5 minutes since last interaction, assume stopped
        const fiveMinutes = 5 * 60 * 1000;
        if (Date.now() - this.lastInteractionTime > fiveMinutes && this.isPlaying) {
            this.updatePlaybackStatus(false);
        }
    }

    setupWindowsControls() {
        // Make the window draggable
        const windowElement = document.querySelector('.window');
        const titleBar = document.querySelector('.title-bar');
        
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        
        // Mouse events for desktop
        titleBar.addEventListener('mousedown', (e) => {
            isDragging = true;
            initialX = e.clientX - windowElement.offsetLeft;
            initialY = e.clientY - windowElement.offsetTop;
            titleBar.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
                
                // Ensure window stays within viewport boundaries
                currentX = Math.max(0, Math.min(window.innerWidth - windowElement.offsetWidth, currentX));
                currentY = Math.max(0, Math.min(window.innerHeight - windowElement.offsetHeight - 50, currentY));
                
                windowElement.style.left = `${currentX}px`;
                windowElement.style.top = `${currentY}px`;
                windowElement.style.transform = 'none'; // Remove any centering transform
            }
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
            titleBar.style.cursor = 'default';
        });
        
        // Improved touch events for mobile - critical fix
        titleBar.addEventListener('touchstart', (e) => {
            isDragging = true;
            
            // For mobile, need to get the actual position if using transform
            const rect = windowElement.getBoundingClientRect();
            if (windowElement.style.transform && windowElement.style.transform.includes('translate')) {
                // If centered with transform, calculate from the actual position
                initialX = e.touches[0].clientX - rect.left;
                initialY = e.touches[0].clientY - rect.top;
            } else {
                initialX = e.touches[0].clientX - windowElement.offsetLeft;
                initialY = e.touches[0].clientY - windowElement.offsetTop;
            }
            
            // Highlight to provide feedback
            titleBar.style.opacity = "0.8";
        }, { passive: false });
        
        document.addEventListener('touchmove', (e) => {
            if (isDragging) {
                e.preventDefault(); // Prevent scrolling while dragging
                
                currentX = e.touches[0].clientX - initialX;
                currentY = e.touches[0].clientY - initialY;
                
                // Constrain to viewport on mobile
                currentX = Math.max(0, Math.min(window.innerWidth - windowElement.offsetWidth, currentX));
                currentY = Math.max(0, Math.min(window.innerHeight - windowElement.offsetHeight - 60, currentY));
                
                windowElement.style.left = `${currentX}px`;
                windowElement.style.top = `${currentY}px`;
                windowElement.style.transform = 'none'; // Remove centering transform
            }
        }, { passive: false });
        
        document.addEventListener('touchend', () => {
            isDragging = false;
            titleBar.style.opacity = "1.0";
        });

        document.addEventListener('touchcancel', () => {
            isDragging = false;
            titleBar.style.opacity = "1.0";
        });

        // Handle window controls (commented out to avoid conflict with index.html handlers)
        // const closeButton = document.querySelector('button[aria-label="Close"]');
        // const maximizeButton = document.querySelector('button[aria-label="Maximize"]');
        // const minimizeButton = document.querySelector('button[aria-label="Minimize"]');

        // closeButton.addEventListener('click', () => {
        //     windowElement.style.display = 'none';
        // });

        // maximizeButton.addEventListener('click', () => {
        //     if (windowElement.style.width === '100vw' || windowElement.classList.contains('maximized')) {
        //         windowElement.style.width = '';
        //         windowElement.style.height = '';
        //         windowElement.style.top = '';
        //         windowElement.style.left = '';
        //         windowElement.classList.remove('maximized');
        //         
        //         // After restoring, reposition appropriately
        //         this.positionWindowForDevice();
        //     } else {
        //         windowElement.classList.add('maximized');
        //         windowElement.style.width = '100vw';
        //         windowElement.style.height = `calc(100vh - ${this.isMobile ? '40' : '40'}px)`;
        //         windowElement.style.top = '0';
        //         windowElement.style.left = '0';
        //         windowElement.style.transform = 'none';
        //         windowElement.style.margin = '0';
        //     }
        // });

        // Add visualization style button functionality
        const vizButton = document.querySelector('.btn-visualization');
        let vizStyle = 0;
        vizButton.addEventListener('click', () => {
            vizStyle = (vizStyle + 1) % 3;
            this.updateVisualizationStyle(vizStyle);
            
            // Provide visual feedback which mode is active
            const modeNames = ['Low', 'Medium', 'High'];
            vizButton.textContent = `Visual: ${modeNames[vizStyle]}`;
        });
        
        // Handle fullscreen button with better mobile support
        const fullscreenButton = document.querySelector('.btn-fullscreen');
        fullscreenButton.addEventListener('click', () => {
            const elem = document.documentElement;
            
            if (!document.fullscreenElement && !document.webkitFullscreenElement) {
                if (elem.requestFullscreen) {
                    elem.requestFullscreen();
                } else if (elem.webkitRequestFullscreen) { /* Safari */
                    elem.webkitRequestFullscreen();
                } else if (elem.msRequestFullscreen) { /* IE11 */
                    elem.msRequestFullscreen();
                }
                fullscreenButton.textContent = 'Exit Fullscreen';
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document.webkitExitFullscreen) { /* Safari */
                    document.webkitExitFullscreen();
                } else if (document.msExitFullscreen) { /* IE11 */
                    document.msExitFullscreen();
                }
                fullscreenButton.textContent = 'Fullscreen';
            }
        });
        
        // Handle Start button animation
        const startButton = document.querySelector('.start-button');
      // startButton.addEventListener('click', () => {
      //     startButton.classList.toggle('active');
      //     
      //     // Replace alert with a more appropriate Windows XP dialog
      //     if (this.isMobile) {
      //         // Just a simple message for mobile
      //         const notification = document.createElement('div');
      //       //  notification.className = 'xp-notification';
      //        // notification.innerHTML = 'Start menu functionality coming soon!';
      //       //  document.body.appendChild(notification);
      //         
      //         setTimeout(() => {
      //             notification.classList.add('fadeOut');
      //             setTimeout(() => {
      //                 notification.remove();
      //             }, 500);
      //         }, 2000);
      //     } else {
      //         // More elaborate dialog for desktop (if we want to implement later)
      //         const notification = document.createElement('div');
      //         notification.className = 'xp-notification';
      //         notification.innerHTML = 'Start menu functionality coming soon!';
      //         document.body.appendChild(notification);
      //         
      //         setTimeout(() => {
      //             notification.classList.add('fadeOut');
      //             setTimeout(() => {
      //                 notification.remove();
      //             }, 500);
      //         }, 2000);
      //     }
      // });
        
        // Make taskbar responsive to orientation changes
        window.addEventListener('orientationchange', () => {
            this.handleResize();
            
            // Wait a moment for the orientation change to complete
            setTimeout(() => {
                this.positionWindowForDevice();
            }, 100);
        });
    }

    updateVisualizationStyle(style) {
        // Different psychedelic intensity levels
        const intensities = [0.3, 0.7, 1.2];
        this.visualizationIntensity = intensities[style];
        
        // Only update if material exists and has uniforms
        if (this.material && this.material.uniforms) {
            const combinedIntensity = this.intensity * this.visualizationIntensity;
            this.material.uniforms.iIntensity.value = combinedIntensity;
        }
        
        // Store the current viz style in local storage for persistence
        try {
            localStorage.setItem('wmp_viz_style', style.toString());
        } catch (e) {
            console.warn('Could not save visualization style');
        }
    }

    handleResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        this.renderer.setSize(width, height);
        
        if (this.material && this.material.uniforms) {
            this.material.uniforms.iResolution.value.set(width, height);
        }
        
        // Adjust the window position if it's off-screen after resize
        const windowElement = document.querySelector('.window');
        if (windowElement) {
            const rect = windowElement.getBoundingClientRect();
            
            // If window is outside the viewport after resize, center it
            if (rect.left > width || rect.top > height || rect.right < 0 || rect.bottom < 0) {
                windowElement.style.left = `${(width - rect.width) / 2}px`;
                windowElement.style.top = `${(height - rect.height) / 3}px`; // Place at top third of screen
            }
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        if (this.material && this.material.uniforms) {
            const time = this.clock.getElapsedTime();
            this.material.uniforms.iTime.value = time;
            
            // Combine base intensity with visualization style intensity
            const combinedIntensity = this.intensity * this.visualizationIntensity;
            
            // Add subtle pulsing for more lively visualization, especially when playing
            let pulseFactor = 1.0;
            if (this.isPlaying) {
                // Add a subtle pulsing effect that's more pronounced when playing
                pulseFactor = 1.0 + 0.2 * Math.sin(time * 3.0);
            }
            
            this.material.uniforms.iIntensity.value = combinedIntensity * pulseFactor;
        }
        
        this.renderer.render(this.scene, this.camera);
    }

    setupClock() {
        const updateClock = () => {
            const now = new Date();
            const hours = now.getHours().toString().padStart(2, '0');
            const minutes = now.getMinutes().toString().padStart(2, '0');
            document.getElementById('taskbar-time').textContent = `${hours}:${minutes}`;
        };
        
        updateClock();
        setInterval(updateClock, 1000);
    }

    // Create a direct embed immediately for guaranteed visibility
    createDirectSpotifyEmbed() {
        setTimeout(() => {
            const container = document.querySelector('.player-container');
            if (!container) return;
            
            // Only create if empty or if iframe is invisible
            const existingFrame = container.querySelector('iframe');
            if (!existingFrame || existingFrame.offsetHeight < 10) {
                container.innerHTML = `
                    <iframe 
                        id="spotify-player"
                        style="border-radius:12px; display: block; position: relative; z-index: 20; width: 100%; height: 152px; background: white;"
                        src="https://open.spotify.com/embed/track/3oBVv54hTMSYXXJGxO5JxJ?utm_source=generator&theme=0" 
                        frameBorder="0" 
                        allowfullscreen="" 
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                        loading="eager">
                    </iframe>
                `;
                console.log('Created direct Spotify embed on startup');
            }
        }, 500);
    }

    // Add method to update kaleidoscope pattern
    updateKaleidoscopePattern(pattern) {
        // Store pattern index (1-4)
        this.kaleidoscopePattern = pattern;
        
        // Update shader uniform if exists
        if (this.material && this.material.uniforms) {
            this.material.uniforms.iKaleidoscopePattern.value = pattern;
            console.log(`Kaleidoscope pattern changed to: ${pattern}`);
        }
        
        // Store pattern preference
        try {
            localStorage.setItem('wmp_kaleido_pattern', pattern.toString());
        } catch (e) {
            console.warn('Could not save kaleidoscope pattern preference');
        }
    }

    initModalVisualizer() {
        const modalCanvas = document.getElementById('modal-visualizer');
        if (modalCanvas) {
            this.modalVisualizer = new ModalVisualizer(modalCanvas, this);
        }
    }

    initialize() {
        // Initialize THREE scene
        this.setupThreeJS();
        
        // Start capturing audio
        this.setupAudio();
        
        // Setup Spotify API if needed
        this.setupSpotifyAPI();
        
        // Add window event listeners
        this.setupEventListeners();
        
        // Create direct Spotify embed if needed
        this.createDirectSpotifyEmbed();
        
        // Start the animation
        this.animate();
        
        // Initialize the shader button text if it exists
        const shaderButton = document.getElementById('change-viz-shader');
        if (shaderButton && this.modalVisualizer) {
            const currentShader = this.modalVisualizer.shaderTypes[this.modalVisualizer.currentShaderIndex];
            shaderButton.textContent = `Shader: ${currentShader.name}`;
        }
    }

    // Event handling methods
    addEventListener(eventName, callback) {
        // Create event array if it doesn't exist yet
        if (!this.eventListeners[eventName]) {
            this.eventListeners[eventName] = [];
        }
        
        // Add the callback to the event listeners
        this.eventListeners[eventName].push(callback);
        return this; // For chaining
    }
    
    removeEventListener(eventName, callback) {
        // Check if this event type exists
        if (!this.eventListeners[eventName]) return this;
        
        // Filter out the specific callback
        this.eventListeners[eventName] = this.eventListeners[eventName].filter(
            listener => listener !== callback
        );
        
        return this; // For chaining
    }
    
    dispatchEvent(eventName, data = {}) {
        // Check if this event type has any listeners
        if (!this.eventListeners[eventName]) return false;
        
        // Create an event object
        const event = {
            type: eventName,
            target: this,
            data: data,
            timestamp: Date.now()
        };
        
        // Notify all listeners
        this.eventListeners[eventName].forEach(callback => {
            try {
                callback(event);
            } catch (error) {
                console.error(`Error in ${eventName} event listener:`, error);
            }
        });
        
        return true; // Event was processed
    }
}

// Modal-specific visualizer class
class ModalVisualizer {
    constructor(canvas, mainVisualizer) {
        this.canvas = canvas;
        this.mainVisualizer = mainVisualizer;
        this.isPlaying = false;
        this.isInitialized = false;
        this.statusElement = document.querySelector('.visualization-status');
        this.visualizationMode = 0; // Add mode tracking: 0 = kaleidoscopic, 1 = rotating line
        
        // Setup the canvas renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        });
        
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        this.clock = new THREE.Clock();
        
        // Event listeners system
        this.eventListeners = {};
        
        // Initialize with inactive state
        this.updateStatus('');
        
        // Set initial size
        this.handleResize();
        
        // Initialize our effects only when play starts
        this.material = null;
        this.mesh = null;
        
        // Add click listener to the background image
        this.setupImageClickHandler();
    }
    
    // Add method to setup image click handler
    setupImageClickHandler() {
        // Find the background image element
        const backgroundImg = document.querySelector('.modal-visualizer-container > img');
        if (backgroundImg) {
            backgroundImg.style.cursor = 'pointer'; // Change cursor to indicate it's clickable
            backgroundImg.addEventListener('click', () => {
                this.changeVisualizationMode();
            });
            console.log('Image click handler set up successfully');
        } else {
            console.warn('Background image not found for click handler');
        }
    }
    
    // Add method to change visualization mode
    changeVisualizationMode() {
        this.visualizationMode = (this.visualizationMode + 1) % 2; // Toggle between modes
        console.log(`Visualization mode changed to: ${this.visualizationMode === 0 ? 'Kaleidoscope' : 'Rotating Line'}`);
        
        // If already initialized, recreate the shader material
        if (this.isInitialized && this.mesh) {
            const newMaterial = this.createShaderMaterial();
            this.mesh.material = newMaterial;
            this.material = newMaterial;
        }
    }
    
    updatePlaybackStatus(isPlaying) {
        this.isPlaying = isPlaying;
        
        if (isPlaying) {
            if (!this.isInitialized) {
                this.initialize();
            }
            //this.updateStatus('Visualizing');
        } else {
            //this.updateStatus('Paused');
        }
    }
    
    createShaderMaterial() {
        // Common vertex shader
        const vertexShader = `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = vec4(position, 1.0);
            }
        `;
        
        // Choose shader based on current mode
        let fragmentShader;
        
        if (this.visualizationMode === 0) {
            // Kaleidoscopic LSD trip shader (original)
            fragmentShader = `
                uniform float iTime;
                uniform vec2 iResolution;
                uniform float iIntensity;
                
                varying vec2 vUv;
                
                // HSV to RGB conversion
                vec3 hsv2rgb(vec3 c) {
                    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
                    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
                    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
                }
                
                // Noise functions for psychedelic effects
                float random(vec2 st) {
                    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
                }
                
                float noise(vec2 st) {
                    vec2 i = floor(st);
                    vec2 f = fract(st);
                    
                    // Four corners in 2D of a tile
                    float a = random(i);
                    float b = random(i + vec2(1.0, 0.0));
                    float c = random(i + vec2(0.0, 1.0));
                    float d = random(i + vec2(1.0, 1.0));
                    
                    // Smooth interpolation
                    vec2 u = f * f * (3.0 - 2.0 * f);
                    
                    // Mix 4 corners
                    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
                }
                
                void main() {
                    vec2 uv = vUv;
                    float time = iTime * 0.5; // Slower time for better trip effect
                    
                    // Center coordinate system
                    vec2 p = uv - 0.5;
                    
                    // Kaleidoscopic mirror effect
                    float angle = atan(p.y, p.x);
                    float radius = length(p);
                    
                    // Create mirrored kaleidoscope segments
                    float segments = 8.0 + 4.0 * sin(time * 0.2);
                    float segmentAngle = 3.14159 * 2.0 / segments;
                    angle = mod(angle, segmentAngle);
                    angle = abs(angle - segmentAngle * 0.5);
                    
                    // Convert back to Cartesian
                    p = radius * vec2(cos(angle), sin(angle));
                    
                    // Apply time-based distortion to position
                    p += 0.1 * sin(p.x * 3.0 + time) * sin(p.y * 3.0 + time * 0.8);
                    
                    // LSD-like color waves
                    float r = length(p) * 2.0;
                    
                    // Multiple layers of psychedelic patterns
                    float pattern1 = 0.5 + 0.5 * sin(r * 5.0 - time * 1.5);
                    float pattern2 = 0.5 + 0.5 * sin(r * 10.0 + angle * 8.0 + time * 0.8);
                    float pattern3 = 0.5 + 0.5 * cos(r * 15.0 - angle * 4.0 - time);
                    
                    // Fractal-like recursive pattern
                    vec2 fractalUV = p;
                    float fractalLayer = 0.0;
                    for (int i = 0; i < 5; i++) {
                        fractalUV = 2.0 * fractalUV - 1.0;
                        fractalUV *= 1.5;
                        fractalUV = fractalUV * 0.9 + 0.1 * sin(fractalUV.yx * 1.5 + time * (0.5 + float(i) * 0.1));
                        fractalLayer += 0.5 + 0.5 * sin(length(fractalUV) * 5.0 - float(i) * 0.5 + time);
                    }
                    fractalLayer /= 5.0;
                    
                    // Noise-based distortion
                    float noisePattern = noise(uv * 5.0 + time * 0.3);
                    
                    // Combine patterns
                    float finalPattern = pattern1 * 0.3 + pattern2 * 0.3 + pattern3 * 0.2 + fractalLayer * 0.2;
                    
                    // Create psychedelic coloring
                    vec3 color;
                    
                    // Color based on radial distance and angle with time variations
                    float hue = fract(r * 0.5 + time * 0.1 + angle / 3.14159);
                    float sat = 0.8 + 0.2 * sin(time);
                    float val = finalPattern * (0.7 + 0.3 * noisePattern);
                    
                    // Apply playback intensity
                    val *= 0.3 + 0.7 * iIntensity;
                    
                    // Generate vibrant color
                    color = hsv2rgb(vec3(hue, sat, val));
                    
                    // Add outer glow for more trippiness
                    float glow = smoothstep(0.4, 0.0, radius) * 0.5 * iIntensity;
                    color += hsv2rgb(vec3(fract(time * 0.05), 0.8, 1.0)) * glow;
                    
                    // Add pulsing brightness when music plays
                    float pulse = 0.8 + 0.2 * sin(time * 2.0);
                    color *= mix(0.5, pulse, iIntensity);
                    
                    // Add subtle scanlines
                    float scanline = 0.9 + 0.1 * sin(uv.y * 100.0);
                    color *= scanline;
                    
                    gl_FragColor = vec4(color, 1.0);
                }
            `;
        } else {
            // New shader with rotating line that leaves traces
            fragmentShader = `
                uniform float iTime;
                uniform vec2 iResolution;
                uniform float iIntensity;
                
                varying vec2 vUv;
                
                // HSV to RGB conversion
                vec3 hsv2rgb(vec3 c) {
                    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
                    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
                    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
                }
                
                void main() {
                    vec2 uv = vUv;
                    vec2 center = vec2(0.5);
                    vec2 p = uv - center;
                    
                    // Base background color (dark)
                    vec3 color = vec3(0.05, 0.05, 0.07);
                    
                    // Time variables
                    float time = iTime;
                    float fadeTime = 5.0; // How long traces remain visible
                    
                    // Rotating line parameters
                    float lineLength = 0.4;
                    float lineWidth = 0.01 + 0.01 * iIntensity;
                    
                    // Create multiple rotating lines with different speeds and colors
                    for (int i = 0; i < 5; i++) {
                        float speed = 0.5 + float(i) * 0.15;
                        float phase = float(i) * 1.256;
                        float angle = time * speed + phase;
                        
                        // Current line position
                        vec2 lineDir = vec2(cos(angle), sin(angle));
                        
                        // Store previous line positions for trail effect
                        for (int j = 0; j < 30; j++) {
                            float pastTime = time - float(j) * 0.05;
                            if (pastTime < 0.0) continue;
                            
                            float pastAngle = pastTime * speed + phase;
                            vec2 pastLineDir = vec2(cos(pastAngle), sin(pastAngle));
                            
                            // Calculate distance from point to line segment
                            vec2 lineStart = center - pastLineDir * lineLength;
                            vec2 lineEnd = center + pastLineDir * lineLength;
                            
                            vec2 lineVec = lineEnd - lineStart;
                            float lineLength = length(lineVec);
                            vec2 lineNorm = lineVec / lineLength;
                            
                            // Project point onto line
                            float projection = dot(uv - lineStart, lineNorm);
                            projection = clamp(projection, 0.0, lineLength);
                            
                            vec2 closestPoint = lineStart + lineNorm * projection;
                            float dist = length(uv - closestPoint);
                            
                            // Fade effect based on time and distance
                            float fade = 1.0 - float(j) / 30.0;
                            float glow = exp(-dist * (30.0 - float(j) * 0.5)) * fade;
                            
                            // Different color for each line
                            float hue = float(i) / 5.0 + time * 0.05;
                            vec3 lineColor = hsv2rgb(vec3(hue, 0.8, 1.0));
                            
                            // Add color to the scene
                            color += lineColor * glow * (0.3 + 0.7 * iIntensity);
                        }
                    }
                    
                    // Add some twinkling stars in the background
                    for (int i = 0; i < 3; i++) {
                        float starPhase = float(i) * 1.5;
                        vec2 grid = floor(uv * (8.0 + float(i) * 6.0));
                        float star = fract(sin(dot(grid, vec2(234.567, 567.891)) + time * 0.5 + starPhase) * 5678.9);
                        
                        if (star > 0.97) {
                            float starGlow = pow(star, 20.0) * 2.0;
                            color += vec3(starGlow) * (0.5 + 0.5 * sin(time * 2.0 + grid.x * grid.y));
                        }
                    }
                    
                    // Apply pulsing effect when music is playing
                    float pulse = 1.0 + 0.2 * sin(time * 3.0) * iIntensity;
                    color *= pulse;
                    
                    gl_FragColor = vec4(color, 1.0);
                }
            `;
        }
        
        // Create THREE.js shader material
        return new THREE.ShaderMaterial({
            uniforms: {
                iTime: { value: 0 },
                iResolution: { value: new THREE.Vector2(this.canvas.width, this.canvas.height) },
                iIntensity: { value: this.isPlaying ? 1.0 : 0.3 }
            },
            vertexShader: vertexShader,
            fragmentShader: fragmentShader
        });
    }
    
    async initialize() {
        if (this.isInitialized) return;
        
        try {
            //this.updateStatus('Initializing...');
            
            // Create the plane geometry for the shader
            const geometry = new THREE.PlaneGeometry(2, 2);
            
            // Create shader material - use only one kaleidoscopic shader
            const material = this.createShaderMaterial();
            
            // Create mesh and add to scene
            this.mesh = new THREE.Mesh(geometry, material);
            this.scene.add(this.mesh);
            this.material = material;
            
            // Start animation loop
            this.animate();
            
            this.isInitialized = true;
         //   this.updateStatus('Ready');
            
            // If already playing, update status
          //  if (this.isPlaying) {
          //      this.updateStatus('Visualizing');
          //  }
            
            this.handleResize();
            console.log('Modal visualizer initialized');
            
            // Dispatch init event
            this.dispatchEvent('initialized');
            return true;
        } catch (error) {
            console.error('Error initializing modal visualizer:', error);
            this.updateStatus('Error: ' + error.message);
            return false;
        }
    }
    
    animate() {
        this.animationRunning = true;
        requestAnimationFrame(() => this.animate());
        
        if (this.material && this.material.uniforms) {
            const time = this.clock.getElapsedTime();
            this.material.uniforms.iTime.value = time;
            
            // Use the intensity based on play status from main visualizer
            let intensity = this.isPlaying ? 1.0 : 0.5;
            
            // Add pulsing when playing
            if (this.isPlaying) {
                intensity *= 1.0 + 0.2 * Math.sin(time * 3.0);
            }
            
            this.material.uniforms.iIntensity.value = intensity;
        }
        
        this.renderer.render(this.scene, this.camera);
    }
    
    handleResize() {
        const containerWidth = this.canvas.clientWidth;
        const containerHeight = this.canvas.clientHeight;
        
        this.renderer.setSize(containerWidth, containerHeight, false);
        
        if (this.material && this.material.uniforms) {
            this.material.uniforms.iResolution.value.set(containerWidth, containerHeight);
        }
    }
    
    updateStatus(message) {
        // Function disabled - no status text will be shown
        if (this.statusElement) {
            this.statusElement.style.opacity = '0';
            this.statusElement.style.display = 'none';
        }
    }

    // Event handling methods
    addEventListener(eventName, callback) {
        // Create event array if it doesn't exist yet
        if (!this.eventListeners[eventName]) {
            this.eventListeners[eventName] = [];
        }
        
        // Add the callback to the event listeners
        this.eventListeners[eventName].push(callback);
        return this; // For chaining
    }
    
    removeEventListener(eventName, callback) {
        // Check if this event type exists
        if (!this.eventListeners[eventName]) return this;
        
        // Filter out the specific callback
        this.eventListeners[eventName] = this.eventListeners[eventName].filter(
            listener => listener !== callback
        );
        
        return this; // For chaining
    }
    
    dispatchEvent(eventName, data = {}) {
        // Check if this event type has any listeners
        if (!this.eventListeners[eventName]) return false;
        
        // Create an event object
        const event = {
            type: eventName,
            target: this,
            data: data,
            timestamp: Date.now()
        };
        
        // Notify all listeners
        this.eventListeners[eventName].forEach(callback => {
            try {
                callback(event);
            } catch (error) {
                console.error(`Error in ${eventName} event listener:`, error);
            }
        });
        
        return true; // Event was processed
    }
}

// Initialize the visualizer when the page loads
window.addEventListener('load', () => {
    const visualizer = new Visualizer();
    
    // Restore previous visualization style if saved
    try {
        const savedStyle = localStorage.getItem('wmp_viz_style');
        if (savedStyle !== null) {
            const styleIndex = parseInt(savedStyle);
            if (!isNaN(styleIndex) && styleIndex >= 0 && styleIndex <= 2) {
                visualizer.updateVisualizationStyle(styleIndex);
                
                // Also update the button text
                const vizButton = document.querySelector('.btn-visualization');
                if (vizButton) {
                    const styleLabels = ['Low', 'Medium', 'High'];
                    vizButton.textContent = `Visual: ${styleLabels[styleIndex]}`;
                }
            }
        }
        
        // Restore previous kaleidoscope pattern if saved
        const savedPattern = localStorage.getItem('wmp_kaleido_pattern');
        if (savedPattern !== null) {
            const patternIndex = parseInt(savedPattern);
            if (!isNaN(patternIndex) && patternIndex >= 1 && patternIndex <= 4) {
                visualizer.updateKaleidoscopePattern(patternIndex);
                
                // Also update the button text
                const patternButton = document.querySelector('.btn-kaleidoscope');
                if (patternButton) {
                    patternButton.textContent = `Kaleidoscope: ${patternIndex}`;
                }
            }
        }
    } catch (e) {
        console.warn('Could not restore saved preferences', e);
    }
}); 