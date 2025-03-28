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
        // More pronounced horizontal scanlines for CRT look
        scanlines = 0.5 + 0.5 * sin(uv.y * iResolution.y * 1.0 - time * 3.0);
        // Make scanlines more subtle for better brightness
        scanlines = pow(scanlines, 1.5) * 0.15 + 0.85;
        
        // Add refresh line effect (horizontal moving line)
        float refreshLine = smoothstep(0.0, 0.15, abs(fract(uv.y - time * 0.5) - 0.5) - 0.35);
        scanlines *= refreshLine * 0.97 + 0.03;
    } 
    else if (mode == 1) { // LCD
        // Early LCD has a visible pixel grid
        float gridX = smoothstep(0.4, 0.6, fract(uv.x * iResolution.x * 0.25));
        float gridY = smoothstep(0.4, 0.6, fract(uv.y * iResolution.y * 0.25));
        scanlines = gridX * 0.03 + gridY * 0.03 + 0.94;
    }
    else if (mode == 2) { // Windows XP
        // Subtle screen artifacts
        scanlines = 0.97 + 0.03 * sin(uv.y * iResolution.y * 0.5);
    }
    else if (mode == 3) { // Windows 98
        // More aggressive scanlines with pixel grid
        scanlines = 0.7 + 0.3 * sin(uv.y * iResolution.y * 0.8 - time * 2.0);
        scanlines = pow(scanlines, 1.2) * 0.2 + 0.8;
        // Add subtle grid
        float gridX = smoothstep(0.45, 0.55, fract(uv.x * iResolution.x * 0.2));
        scanlines *= 0.97 + gridX * 0.03;
    }
    
    return scanlines;
}

// Function to create a CRT vignette effect (darkened corners)
float vignette(vec2 uv, int mode) {
    // Stronger vignette effect for CRT corners
    uv = (uv - 0.5) * 2.0;
    float vig;
    
    if (mode == 0) { // CRT
        vig = clamp(1.0 - dot(uv, uv) * 0.45, 0.0, 1.0);
        // Add subtle uneven lighting
        vig *= (0.97 + 0.03 * sin(uv.x * 3.0) * sin(uv.y * 3.0));
    }
    else if (mode == 1) { // LCD
        // Less pronounced vignette for LCD
        vig = clamp(1.0 - dot(uv, uv) * 0.3, 0.0, 1.0);
    }
    else if (mode == 2) { // Windows XP
        // Very subtle vignette for XP
        vig = clamp(1.0 - dot(uv, uv) * 0.2, 0.0, 1.0);
    }
    else if (mode == 3) { // Windows 98
        // Medium vignette with more uneven lighting (CRT monitor effect)
        vig = clamp(1.0 - dot(uv, uv) * 0.35, 0.0, 1.0);
        vig *= (0.95 + 0.05 * sin(uv.x * 4.0) * sin(uv.y * 4.0));
    }
    
    return vig;
}

// Create subtle RGB shift like an old monitor
vec3 rgbShift(sampler2D tex, vec2 uv, float amount, int mode) {
    // Horizontal color shift for RGB components
    vec3 color;
    
    if (mode == 0) { // CRT - strong shift
        color.r = texture2D(tex, vec2(uv.x + amount, uv.y)).r;
        color.g = texture2D(tex, uv).g;
        color.b = texture2D(tex, vec2(uv.x - amount, uv.y)).b;
    }
    else if (mode == 1) { // LCD - very subtle shift
        color.r = texture2D(tex, vec2(uv.x + amount * 0.3, uv.y)).r;
        color.g = texture2D(tex, uv).g;
        color.b = texture2D(tex, vec2(uv.x - amount * 0.3, uv.y)).b;
    }
    else if (mode == 2 || mode == 3) { // Windows - medium shift
        color.r = texture2D(tex, vec2(uv.x + amount * 0.6, uv.y)).r;
        color.g = texture2D(tex, uv).g;
        color.b = texture2D(tex, vec2(uv.x - amount * 0.6, uv.y)).b;
    }
    
    return color;
}

// Screen flicker effect like an old CRT
float screenFlicker(float time, int mode) {
    // Combine slow and fast flicker
    float flicker = 1.0;
    
    if (mode == 0) { // CRT - noticeable flicker
        float slowFlicker = 0.98 + 0.02 * sin(time * 0.3);
        float fastFlicker = 0.99 + 0.01 * sin(time * 2.1);
        // Add a very rare dip
        float rare = 0.995 + 0.005 * sin(time * 0.5);
        flicker = slowFlicker * fastFlicker * rare;
    }
    else if (mode == 1) { // LCD - very subtle flicker
        flicker = 0.995 + 0.005 * sin(time * 0.5);
    }
    else if (mode == 2) { // XP - almost no flicker
        flicker = 0.997 + 0.003 * sin(time * 0.2);
    }
    else if (mode == 3) { // Win98 - medium flicker
        float slowFlicker = 0.99 + 0.01 * sin(time * 0.4);
        float fastFlicker = 0.995 + 0.005 * sin(time * 1.8);
        flicker = slowFlicker * fastFlicker;
    }
    
    return flicker;
}

// Simulate screen curvature and distortion
vec2 crtCurvature(vec2 uv, int mode) {
    if (mode == 0) { // CRT - strong curvature
        // Convert to curved coordinates - more pronounced for CRT look
        uv = uv * 2.0 - 1.0;
        // Adjust these values for different curvature amount
        vec2 offset = abs(uv.yx) / vec2(5.0, 4.0);
        uv = uv + uv * offset * offset;
        uv = uv * 0.5 + 0.5;
    }
    else if (mode == 1) { // LCD - very slight curvature
        uv = uv * 2.0 - 1.0;
        vec2 offset = abs(uv.yx) / vec2(15.0, 15.0);
        uv = uv + uv * offset * offset;
        uv = uv * 0.5 + 0.5;
    }
    else if (mode == 2) { // XP - almost flat
        uv = uv * 2.0 - 1.0;
        vec2 offset = abs(uv.yx) / vec2(25.0, 25.0);
        uv = uv + uv * offset * offset;
        uv = uv * 0.5 + 0.5;
    }
    else if (mode == 3) { // Win98 - medium curvature
        uv = uv * 2.0 - 1.0;
        vec2 offset = abs(uv.yx) / vec2(8.0, 7.0);
        uv = uv + uv * offset * offset;
        uv = uv * 0.5 + 0.5;
    }
    
    return uv;
}

// Pixelate the screen like a low resolution display
vec2 pixelate(vec2 uv, float pixelSize, int mode) {
    float dx = pixelSize / iResolution.x;
    float dy = pixelSize / iResolution.y;
    
    if (mode == 0) { // CRT - subtle pixelation
        dx *= 1.5;
        dy *= 1.5;
    }
    else if (mode == 1) { // LCD - more visible pixelation
        dx *= 2.0;
        dy *= 2.0;
    }
    else if (mode == 2) { // XP - very slight pixelation
        dx *= 1.0;
        dy *= 1.0;
    }
    else if (mode == 3) { // Win98 - strong pixelation
        dx *= 3.0;
        dy *= 3.0;
    }
    
    float x = floor(uv.x / dx) * dx;
    float y = floor(uv.y / dy) * dy;
    return vec2(x, y);
}

// Add subtle noise like an old display
float noise(vec2 uv, float time, int mode) {
    float noise = fract(sin(dot(uv, vec2(12.9898, 78.233)) * 43758.5453 + time));
    
    if (mode == 0) { // CRT - noticeable noise
        // Add static interference
        float interference = step(0.985, noise); 
        return (noise * 0.02) + (interference * 0.03);
    }
    else if (mode == 1) { // LCD - very subtle noise
        return noise * 0.007;
    }
    else if (mode == 2) { // XP - minimal noise
        return noise * 0.003;
    }
    else if (mode == 3) { // Win98 - medium noise with more static
        float interference = step(0.98, noise);
        return (noise * 0.015) + (interference * 0.02);
    }
    
    // Default fallback
    return noise * 0.01;
}

// Color grading function for different display types
vec3 colorGrading(vec3 color, int mode) {
    if (mode == 0) { // CRT
        // Slightly adjust the gamma
        color = pow(color, vec3(1.0, 0.95, 1.0));
        // Add a subtle green-ish tint (CRT phosphors)
        return mix(color, color * vec3(0.95, 1.03, 0.95), 0.15);
    }
    else if (mode == 1) { // LCD
        // Early LCD had poor color reproduction and contrast
        color = pow(color, vec3(1.1));
        color = mix(color, vec3(dot(color, vec3(0.299, 0.587, 0.114))), 0.05); // Slight desaturation
        // Slight blue tint of early LCDs
        return mix(color, color * vec3(0.97, 0.97, 1.04), 0.1);
    }
    else if (mode == 2) { // Windows XP
        // Vivid "Luna" theme colors
        color = pow(color, vec3(0.95, 0.9, 0.9));
        color *= vec3(1.05, 1.05, 1.13); // Enhance blues slightly and overall brightness
        return color;
    }
    else if (mode == 3) { // Windows 98
        // Classic Windows 98 color palette
        color = pow(color, vec3(1.05));
        // Gray-ish with slight blue tint
        return mix(color, color * vec3(0.97, 0.98, 1.05), 0.2);
    }
    
    // Default fallback
    return color;
}

void main() {
    float time = iTime * 0.5;
    
    // Get the UV coordinates
    vec2 uv = vUv;
    
    // Apply screen curvature based on mode
    vec2 curvedUv = crtCurvature(uv, iMode);
    
    // Check if the pixel is still within the screen after curvature
    if (curvedUv.x < 0.0 || curvedUv.x > 1.0 || curvedUv.y < 0.0 || curvedUv.y > 1.0) {
        // Black outside the screen
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
    }
    
    // Apply appropriate pixelation for the mode
    vec2 pixelatedUv = pixelate(curvedUv, 1.5, iMode);
    
    // Get the base color from the texture
    vec3 color = texture2D(iTexture, pixelatedUv).rgb;
    
    // Apply RGB shift based on mode
    float shiftAmount = 0.003 + 0.001 * sin(time * 0.5);
    color = mix(color, rgbShift(iTexture, pixelatedUv, shiftAmount, iMode), 0.3);
    
    // Apply scanlines appropriate for the mode
    color *= scanline(pixelatedUv, time, iMode);
    
    // Apply screen flicker based on mode
    color *= screenFlicker(time, iMode);
    
    // Apply vignette based on mode
    color *= vignette(curvedUv, iMode);
    
    // Add noise/static based on mode
    color += noise(pixelatedUv, time, iMode);
    
    // Apply color grading based on mode
    color = colorGrading(color, iMode);
    
    // Apply overall brightness boost (1.15x brighter)
    color *= 1.15;
    
    // Occasional horizontal sync issues for CRT and Win98 (make them more rare)
    if ((iMode == 0 || iMode == 3) && sin(time * 0.27) > 0.997) {
        float syncShift = 0.01 * sin(time * 10.0);
        color = texture2D(iTexture, vec2(pixelatedUv.x + syncShift, pixelatedUv.y)).rgb;
    }
    
    // Output the final color
    gl_FragColor = vec4(color, iIntensity);
} 
