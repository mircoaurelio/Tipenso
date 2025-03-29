// CRT shader for a vintage 2000s computer screen effect
// Inspired by classic CRT and early LCD displays

uniform float iTime;
uniform vec2 iResolution;
uniform float iIntensity;
uniform sampler2D iTexture;
uniform int iMode; // 0 = CRT, 1 = LCD, 2 = XP, 3 = Win98

varying vec2 vUv;

// Function to create scanlines
float scanline(vec2 uv, float time, int mode) {
    float scanlines;
    
    if (mode == 0) { // CRT
        // Create wavy scanlines instead of straight ones
        float wavyOffset = sin(uv.x * 10.0 + time * 0.5) * 0.05;
        // More pronounced horizontal scanlines for CRT look with wavy pattern
        scanlines = 0.5 + 0.5 * sin((uv.y + wavyOffset) * iResolution.y * 1.2 - time * 3.0);
        // Emphasize scanlines to make them more visible - "bad screen" effect
        scanlines = pow(scanlines, 1.3) * 0.2 + 0.8;
        
        // Add refresh line effect (horizontal moving line) - more obvious and wavy
        float refreshWave = sin(uv.x * 8.0) * 0.03;
        float refreshLine = smoothstep(0.0, 0.2, abs(fract(uv.y + refreshWave - time * 0.5) - 0.5) - 0.25);
        scanlines *= refreshLine * 0.95 + 0.05;
    } 
    else if (mode == 1) { // LCD
        // Early LCD has a visible pixel grid - more pronounced and slightly wavy
        float gridWaveX = sin(uv.y * 5.0 + time * 0.3) * 0.02;
        float gridWaveY = cos(uv.x * 5.0 + time * 0.3) * 0.02;
        float gridX = smoothstep(0.3, 0.7, fract((uv.x + gridWaveX) * iResolution.x * 0.3));
        float gridY = smoothstep(0.3, 0.7, fract((uv.y + gridWaveY) * iResolution.y * 0.3));
        scanlines = gridX * 0.08 + gridY * 0.08 + 0.84;
    }
    else if (mode == 2) { // Windows XP
        // More visible screen artifacts with slight wave
        float xpWave = sin(uv.x * 3.0 + time * 0.2) * 0.01;
        scanlines = 0.94 + 0.06 * sin((uv.y + xpWave) * iResolution.y * 0.7);
    }
    else if (mode == 3) { // Windows 98
        // More aggressive scanlines with pixel grid and wave pattern
        float win98Wave = sin(uv.x * 4.0 + time * 0.3) * cos(uv.y * 2.0 + time * 0.2) * 0.03;
        scanlines = 0.65 + 0.35 * sin((uv.y + win98Wave) * iResolution.y * 0.8 - time * 2.0);
        scanlines = pow(scanlines, 1.1) * 0.25 + 0.75;
        // Add subtle wavy grid
        float gridWave = cos(uv.y * 3.0 + time * 0.25) * 0.02;
        float gridX = smoothstep(0.4, 0.6, fract((uv.x + gridWave) * iResolution.x * 0.25));
        scanlines *= 0.93 + gridX * 0.07;
    }
    
    return scanlines;
}

// Function to create a CRT vignette effect (darkened corners)
float vignette(vec2 uv, int mode) {
    // Reduced vignette effect (no darkened corners)
    uv = (uv - 0.5) * 2.0;
    float vig;
    
    if (mode == 0) { // CRT
        // Much lighter vignette
        vig = clamp(1.0 - dot(uv, uv) * 0.2, 0.0, 1.0);
        // Add subtle uneven lighting
        vig *= (0.97 + 0.03 * sin(uv.x * 3.0) * sin(uv.y * 3.0));
    }
    else if (mode == 1) { // LCD
        // Very minimal vignette for LCD
        vig = clamp(1.0 - dot(uv, uv) * 0.15, 0.0, 1.0);
    }
    else if (mode == 2) { // Windows XP
        // Almost no vignette for XP
        vig = clamp(1.0 - dot(uv, uv) * 0.1, 0.0, 1.0);
    }
    else if (mode == 3) { // Windows 98
        // Light vignette with more uneven lighting
        vig = clamp(1.0 - dot(uv, uv) * 0.25, 0.0, 1.0);
        vig *= (0.95 + 0.05 * sin(uv.x * 4.0) * sin(uv.y * 4.0));
    }
    
    return vig;
}

// Create RGB shift like an old monitor - more pronounced
vec3 rgbShift(sampler2D tex, vec2 uv, float amount, int mode) {
    // Horizontal color shift for RGB components
    vec3 color;
    
    if (mode == 0) { // CRT - stronger shift
        color.r = texture2D(tex, vec2(uv.x + amount * 1.5, uv.y)).r;
        color.g = texture2D(tex, uv).g;
        color.b = texture2D(tex, vec2(uv.x - amount * 1.5, uv.y)).b;
    }
    else if (mode == 1) { // LCD - more noticeable shift
        color.r = texture2D(tex, vec2(uv.x + amount * 0.8, uv.y)).r;
        color.g = texture2D(tex, uv).g;
        color.b = texture2D(tex, vec2(uv.x - amount * 0.8, uv.y)).b;
    }
    else if (mode == 2 || mode == 3) { // Windows - medium shift
        color.r = texture2D(tex, vec2(uv.x + amount * 1.2, uv.y)).r;
        color.g = texture2D(tex, uv).g;
        color.b = texture2D(tex, vec2(uv.x - amount * 1.2, uv.y)).b;
    }
    
    return color;
}

// Screen flicker effect like an old CRT
float screenFlicker(float time, int mode) {
    // Combine slow and fast flicker - more noticeable
    float flicker = 1.0;
    
    if (mode == 0) { // CRT - more noticeable flicker
        float slowFlicker = 0.94 + 0.06 * sin(time * 0.3);
        float fastFlicker = 0.97 + 0.03 * sin(time * 2.1);
        // Add occasional dips
        float rare = 0.985 + 0.015 * sin(time * 0.5);
        flicker = slowFlicker * fastFlicker * rare;
    }
    else if (mode == 1) { // LCD - subtle flicker
        flicker = 0.985 + 0.015 * sin(time * 0.5);
    }
    else if (mode == 2) { // XP - very slight flicker
        flicker = 0.99 + 0.01 * sin(time * 0.2);
    }
    else if (mode == 3) { // Win98 - medium flicker
        float slowFlicker = 0.96 + 0.04 * sin(time * 0.4);
        float fastFlicker = 0.98 + 0.02 * sin(time * 1.8);
        flicker = slowFlicker * fastFlicker;
    }
    
    return flicker;
}

// Simulate screen curvature and distortion - significantly reduced or eliminated
vec2 crtCurvature(vec2 uv, int mode) {
    // Almost no screen curvature for any mode to eliminate rounded corners
    if (mode == 0) { // CRT - minimal curvature
        uv = uv * 2.0 - 1.0;
        // Greatly reduced curvature
        vec2 offset = abs(uv.yx) / vec2(30.0, 30.0);
        uv = uv + uv * offset * offset;
        uv = uv * 0.5 + 0.5;
    }
    else if (mode == 1 || mode == 2 || mode == 3) { // Other modes - effectively flat
        // No curvature at all
        // (keeping the uv as is)
    }
    
    return uv;
}

// Pixelate the screen like a low resolution display
vec2 pixelate(vec2 uv, float pixelSize, int mode) {
    float dx = pixelSize / iResolution.x;
    float dy = pixelSize / iResolution.y;
    
    if (mode == 0) { // CRT - more pixelation
        dx *= 2.0;
        dy *= 2.0;
    }
    else if (mode == 1) { // LCD - very visible pixelation
        dx *= 2.5;
        dy *= 2.5;
    }
    else if (mode == 2) { // XP - slight pixelation
        dx *= 1.5;
        dy *= 1.5;
    }
    else if (mode == 3) { // Win98 - strong pixelation
        dx *= 3.0;
        dy *= 3.0;
    }
    
    float x = floor(uv.x / dx) * dx;
    float y = floor(uv.y / dy) * dy;
    return vec2(x, y);
}

// New function for wavy, flowing effect instead of dots
vec2 wavyEffect(vec2 uv, float time, int mode) {
    // Base distortion strength varies by mode
    float distStrength = 0.0;
    
    if (mode == 0) { // CRT
        distStrength = 0.008; // Increased from 0.005
    }
    else if (mode == 1) { // LCD
        distStrength = 0.005; // Increased from 0.003
    }
    else if (mode == 2) { // XP
        distStrength = 0.004; // Increased from 0.002
    }
    else if (mode == 3) { // Win98
        distStrength = 0.01; // Increased from 0.006
    }
    
    // Get distance from center for radial wave effect
    vec2 center = vec2(0.5, 0.5);
    float dist = length(uv - center);
    
    // Create flowing wave patterns
    float wavyX = sin(uv.y * 15.0 + time * 0.7) * cos(uv.x * 10.0 + time * 0.5) * distStrength;
    float wavyY = cos(uv.x * 12.0 + time * 0.6) * sin(uv.y * 8.0 + time * 0.4) * distStrength;
    
    // Add secondary wave pattern for more organic feel
    wavyX += sin(uv.y * 7.0 - time * 0.3) * sin(uv.x * 5.0 + time * 0.2) * distStrength * 0.7;
    wavyY += cos(uv.x * 6.0 - time * 0.4) * cos(uv.y * 4.0 - time * 0.3) * distStrength * 0.7;
    
    // Add radial ripple effect
    float ripple = sin(dist * 30.0 - time * 1.5) * distStrength * 0.5;
    wavyX += ripple * (uv.x - center.x) / (dist + 0.01);
    wavyY += ripple * (uv.y - center.y) / (dist + 0.01);
    
    // Add slow-moving larger waves for more natural feel
    wavyX += sin(uv.y * 3.0 + time * 0.2) * cos(uv.x * 2.0 + time * 0.1) * distStrength * 1.2;
    wavyY += cos(uv.x * 2.5 + time * 0.15) * sin(uv.y * 3.5 + time * 0.25) * distStrength * 1.2;
    
    // Add some swirly motion
    float swirl = sin(dist * 10.0 - time) * distStrength * 0.3;
    float angle = atan(uv.y - center.y, uv.x - center.x);
    wavyX += swirl * sin(angle * 2.0 + time * 0.3);
    wavyY += swirl * cos(angle * 2.0 + time * 0.3);
    
    // Apply the distortion
    return vec2(uv.x + wavyX, uv.y + wavyY);
}

// Add static/noise like an old display - much more visible
float noise(vec2 uv, float time, int mode) {
    float noise = fract(sin(dot(uv, vec2(12.9898, 78.233)) * 43758.5453 + time));
    
    if (mode == 0) { // CRT - much more noticeable noise
        // Add static interference - more frequent
        float interference = step(0.94, noise); 
        return (noise * 0.06) + (interference * 0.15);
    }
    else if (mode == 1) { // LCD - more visible noise
        float interference = step(0.96, noise);
        return (noise * 0.03) + (interference * 0.08);
    }
    else if (mode == 2) { // XP - subtle but visible noise
        float interference = step(0.97, noise);
        return (noise * 0.02) + (interference * 0.05);
    }
    else if (mode == 3) { // Win98 - strong noise with more static
        float interference = step(0.93, noise);
        return (noise * 0.05) + (interference * 0.12);
    }
    
    // Default fallback
    return noise * 0.04;
}

// Color grading function for different display types
vec3 colorGrading(vec3 color, int mode) {
    if (mode == 0) { // CRT
        // Slightly adjust the gamma
        color = pow(color, vec3(0.9, 0.85, 0.9));
        // Add a green-ish tint (CRT phosphors)
        return mix(color, color * vec3(0.92, 1.05, 0.92), 0.2);
    }
    else if (mode == 1) { // LCD
        // Early LCD had poor color reproduction
        color = pow(color, vec3(1.0));
        // Slight blue tint of early LCDs
        return mix(color, color * vec3(0.97, 0.97, 1.06), 0.15);
    }
    else if (mode == 2) { // Windows XP
        // Vivid "Luna" theme colors
        color = pow(color, vec3(0.9, 0.85, 0.85));
        color *= vec3(1.08, 1.08, 1.15); // Enhance blues and overall brightness
        return color;
    }
    else if (mode == 3) { // Windows 98
        // Classic Windows 98 color palette
        color = pow(color, vec3(0.95));
        // Gray-ish with slight blue tint
        return mix(color, color * vec3(0.98, 1.0, 1.08), 0.25);
    }
    
    // Default fallback
    return color;
}

// Function to create glitches and digital artifacts
float glitchEffect(vec2 uv, float time, int mode) {
    // Random glitch patterns
    float glitchLine = step(0.98, fract(sin(floor(uv.y * 20.0) + time * 0.1) * 43758.5453));
    float glitchShift = sin(time * 10.0) * 0.02 * glitchLine;
    
    // Intensity based on mode
    if (mode == 0) { // CRT - strong glitches
        return glitchShift * 1.0;
    }
    else if (mode == 1) { // LCD - medium glitches
        return glitchShift * 0.7;
    }
    else if (mode == 2) { // XP - subtle glitches
        return glitchShift * 0.4;
    }
    else if (mode == 3) { // Win98 - very strong glitches
        return glitchShift * 1.5;
    }
    
    return glitchShift;
}

void main() {
    float time = iTime * 0.5;
    
    // Get the UV coordinates
    vec2 uv = vUv;
    
    // Apply minimal screen curvature
    vec2 curvedUv = crtCurvature(uv, iMode);
    
    // Check if the pixel is still within the screen after curvature (should be minimal now)
    if (curvedUv.x < 0.0 || curvedUv.x > 1.0 || curvedUv.y < 0.0 || curvedUv.y > 1.0) {
        // Black outside the screen
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
    }
    
    // Add glitch effect to UV coordinates
    float glitchAmount = glitchEffect(curvedUv, time, iMode);
    curvedUv.x += glitchAmount;
    
    // Apply the wavy effect instead of just pixelation
    vec2 wavyUv = wavyEffect(curvedUv, time, iMode);
    
    // We'll still apply some pixelation, but much less than before
    float pixelReduction = 4.0; // Increased from 3.0 for even less pixelation
    vec2 pixelatedUv = pixelate(wavyUv, 1.5 / pixelReduction, iMode);
    
    // Blend between wavy and pixelated for organic feel
    vec2 finalUv = mix(wavyUv, pixelatedUv, 0.25); // 75% wavy, 25% pixelated (changed from 60/40)
    
    // Get the base color from the texture
    vec3 color = texture2D(iTexture, finalUv).rgb;
    
    // Apply RGB shift based on mode - more pronounced and wavy
    float waveShift = sin(finalUv.y * 8.0 + time * 0.6) * 0.001; // Small wavy adjustment
    float shiftAmount = 0.004 + 0.002 * sin(time * 0.5) + waveShift;
    color = mix(color, rgbShift(iTexture, finalUv, shiftAmount, iMode), 0.4);
    
    // Apply wavy scanlines appropriate for the mode
    color *= scanline(finalUv, time, iMode);
    
    // Apply screen flicker based on mode
    color *= screenFlicker(time, iMode);
    
    // Apply vignette based on mode (much reduced)
    color *= vignette(curvedUv, iMode);
    
    // Add noise/static based on mode with wavy variation
    float noiseWave = sin(finalUv.x * 6.0 + finalUv.y * 6.0 + time * 0.2) * 0.2;
    color += noise(finalUv, time + noiseWave, iMode);
    
    // Apply color grading based on mode with slight wave effect
    color = colorGrading(color, iMode);
    vec2 center = vec2(0.5, 0.5);
    float dist = length(finalUv - center);
    float colorWave = sin(dist * 15.0 - time * 0.7) * 0.05;
    // Add subtle color pulsing from center
    color *= 1.0 + colorWave * (1.0 - dist * 2.0);
    
    // Apply very strong brightness boost (1.3x brighter)
    color *= 1.3;
    
    // Random vertical sync issues (more frequent)
    if ((iMode == 0 || iMode == 3) && sin(time * 0.37) > 0.96) {
        float syncShift = 0.03 * sin(time * 10.0);
        // Horizontal shift
        color = texture2D(iTexture, vec2(finalUv.x + syncShift, finalUv.y)).rgb;
    }
    
    // Occasional horizontal color bars (bad signal)
    if (sin(time * 0.13) > 0.97) {
        float colorBar = step(0.7, fract(curvedUv.y * 10.0 + time));
        color = mix(color, color * vec3(1.3, 0.8, 0.8), colorBar * 0.3);
    }
    
    // Output the final color
    gl_FragColor = vec4(color, iIntensity);
} 
