uniform float iTime;
uniform vec2 iResolution;
uniform float iIntensity;
uniform sampler2D iTexture;
uniform int iKaleidoscopePattern;

varying vec2 vUv;

// HSV to RGB conversion function
vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

// Classic WMP-style kaleidoscope effect
// This is now only used in the modal visualizer, not in the background
vec3 kaleidoscope(vec2 uv, float time, float intensity, int pattern) {
    // Create radial coordinates for classic visualizer effect
    vec2 center = vec2(0.5, 0.5);
    vec2 pos = uv - center;
    
    // Basic parameters
    float radius = length(pos);
    float angle = atan(pos.y, pos.x);
    
    // Different patterns based on pattern index
    if (pattern == 1) {
        // Original pattern - classic starry kaleidoscope
        float segments = 8.0 + 4.0 * sin(time * 0.2);
        float segmentAngle = 3.14159 * 2.0 / segments;
        angle = mod(angle, segmentAngle);
        angle = abs(angle - segmentAngle * 0.5);
        
        // Oscillations based on time and intensity
        float oscillation = sin(time * 1.0 + radius * 20.0) * intensity * 0.05;
        float oscillation2 = cos(time * 0.7 - radius * 10.0 + angle * 5.0) * intensity * 0.05;
        
        // Create symmetric patterns
        radius += oscillation + oscillation2;
        
        // Add vibrating rings effect
        float ring = fract(radius * 5.0 + time * 0.5);
        ring = smoothstep(0.0, 0.1, ring) * smoothstep(1.0, 0.9, ring);
        
        // Classic WMP color progression
        float hue = fract(time * 0.1 + radius + angle / 6.28318);
        float sat = 0.7 + 0.3 * sin(time + 3.0 * radius);
        float val = ring * (0.7 + 0.3 * cos(angle * 3.0));
        
        // Adjust intensity based on playback status
        val *= 0.4 + 0.6 * intensity;
        
        // Generate color
        vec3 color = hsv2rgb(vec3(hue, sat, val));
        
        // Add pulsing glow
        float pulse = 0.5 + 0.5 * sin(time * 2.0);
        pulse = 0.4 + 0.6 * pulse * intensity;
        color *= pulse;
        
        return color;
    } 
    else if (pattern == 2) {
        // Pattern 2 - "Bars" - Classic WMP equalizer-like bars
        // Create a grid pattern
        float barCount = 16.0;
        float barWidth = 1.0 / barCount;
        
        // Calculate which bar we're in
        float barIndex = floor(uv.x * barCount);
        
        // Generate bar height based on position and time
        float seed = fract(sin(barIndex * 12.3456 + floor(time)) * 43758.5453);
        float nextSeed = fract(sin(barIndex * 12.3456 + floor(time + 0.5)) * 43758.5453);
        
        // Smooth transition between heights
        float fract_time = fract(time * 0.7);
        float barHeight = mix(seed, nextSeed, smoothstep(0.0, 1.0, fract_time)) * 0.8 + 0.2;
        
        // Enhance with sound intensity
        barHeight = mix(barHeight * 0.3 + 0.1, barHeight, intensity);
        
        // Create the bar visualization
        float barY = step(1.0 - barHeight, uv.y);
        
        // Add some glow and color variation
        float barGlow = smoothstep(1.0 - barHeight - 0.05, 1.0 - barHeight + 0.05, uv.y);
        float hue = fract(barIndex / barCount + time * 0.1);
        float sat = 0.8;
        float val = barGlow * intensity;
        
        // Shape the bars with some texture
        val *= 0.8 + 0.2 * sin(uv.y * 40.0 + time);
        
        // Generate color
        vec3 color = hsv2rgb(vec3(hue, sat, val));
        
        return color;
    }
    else if (pattern == 3) {
        // Pattern 3 - "Spiral" - Hypnotic spiral pattern
        // Adjust angle and radius based on time
        angle += time * 0.5;
        
        // Create spiral effect
        float spiral = fract(angle / 6.28318 + radius * 3.0 - time * 0.2);
        spiral = smoothstep(0.3, 0.7, spiral);
        
        // Add ripple effect
        float ripple = sin(radius * 20.0 - time * 2.0) * 0.5 + 0.5;
        
        // Color based on angle
        float hue = fract(angle / 6.28318 * 2.0 + time * 0.05);
        float sat = 0.7 + 0.3 * ripple;
        float val = spiral * (0.5 + 0.5 * ripple) * intensity;
        
        // Generate color
        vec3 color = hsv2rgb(vec3(hue, sat, val));
        
        return color;
    }
    else if (pattern == 4) {
        // Pattern 4 - "Flower" - Flower-like pattern with petals
        // Create flower petals
        float petals = 5.0 + floor(sin(time * 0.1) * 2.0 + 2.0);
        float petalAngle = mod(angle + time * 0.2, 6.28318);
        
        // Create petal shape
        float petal = cos(petalAngle * petals);
        float flowerRadius = 0.3 + 0.1 * sin(time * 0.5);
        
        // Create flower shape
        float flower = 1.0 - smoothstep(flowerRadius * (0.7 + 0.3 * petal), 
                                       flowerRadius * (0.7 + 0.3 * petal) + 0.05, 
                                       radius);
        
        // Add ripple around flower
        float ripple = sin(radius * 15.0 - time * 1.5) * 0.5 + 0.5;
        ripple *= smoothstep(flowerRadius + 0.05, flowerRadius + 0.3, radius) *
                 smoothstep(flowerRadius + 0.6, flowerRadius + 0.3, radius);
        
        // Combine flower and ripple
        float shape = max(flower, ripple * 0.7);
        
        // Color based on angle and radius
        float hue = fract(petalAngle / 6.28318 + time * 0.1);
        float sat = 0.7 + 0.3 * ripple;
        float val = shape * intensity;
        
        // Generate color
        vec3 color = hsv2rgb(vec3(hue, sat, val));
        
        // Add some sparkles
        float sparkle = pow(fract(sin(radius * 100.0 + angle * 20.0 + time) * 10000.0), 20.0) * 5.0;
        color += sparkle * intensity * vec3(1.0);
        
        return color;
    }
    
    // Default/fallback
    return vec3(1.0, 1.0, 1.0) * intensity;
}

void main() {
    vec2 uv = vUv;
    
    // LSD-like distortion effects but with limits
    float time = iTime * 0.2;
    
    // Apply gentler effects that respect image boundaries
    // Limit the distortion to ensure it doesn't cause overflow
    float distortionLimit = 0.3; // Only allow distortion within the central 70% of the image
    float distanceFromCenter = length(uv - 0.5) * 2.0; // 0 at center, 1 at edges
    
    // Gradually reduce distortion as we approach the edges
    float edgeFactor = 1.0 - smoothstep(distortionLimit, 0.9, distanceFromCenter);
    
    // Rainbow wave distortion - reduced and limited to center
    float wavyX = sin(uv.y * 8.0 + time) * 0.005 * iIntensity * edgeFactor;
    float wavyY = cos(uv.x * 8.0 + time * 0.7) * 0.005 * iIntensity * edgeFactor;
    
    // Pulsating zoom effect - reduced and limited to center
    float zoom = sin(time * 0.5) * 0.01 * iIntensity * edgeFactor;
    vec2 zoomedUV = mix(uv, vec2(0.5), zoom);
    
    // Combine distortions with limits
    vec2 distortedUV = zoomedUV + vec2(wavyX, wavyY);
    
    // Swirling effect around center - reduced and limited
    float dist = length(uv - vec2(0.5));
    float angle = atan(uv.y - 0.5, uv.x - 0.5);
    float swirl = sin(dist * 10.0 - time * 1.5) * 0.02 * iIntensity * edgeFactor;
    distortedUV += swirl * vec2(cos(angle), sin(angle));
    
    // Ensure we stay within texture bounds (redundant with ClampToEdgeWrapping, but safer)
    distortedUV = clamp(distortedUV, 0.001, 0.999);
    
    // Sample the texture with distorted coordinates
    vec4 texColor = texture2D(iTexture, distortedUV);
    
    // Color effects - still apply these as they don't affect texture coordinates
    float hueShift = sin(time) * 0.1 * iIntensity;
    
    // Approximate HSV conversion
    float maxChannel = max(max(texColor.r, texColor.g), texColor.b);
    float minChannel = min(min(texColor.r, texColor.g), texColor.b);
    float delta = maxChannel - minChannel;
    
    // Approximate hue
    float hue = 0.0;
    if (delta > 0.0) {
        if (maxChannel == texColor.r) {
            hue = (texColor.g - texColor.b) / delta + (texColor.g < texColor.b ? 6.0 : 0.0);
        } else if (maxChannel == texColor.g) {
            hue = (texColor.b - texColor.r) / delta + 2.0;
        } else {
            hue = (texColor.r - texColor.g) / delta + 4.0;
        }
        hue /= 6.0;
    }
    
    // Shift hue - reduced effect
    hue = fract(hue + hueShift);
    
    // Saturation and value
    float sat = delta / (maxChannel + 0.00001);
    float val = maxChannel;
    
    // Enhance saturation - reduced effect
    sat = min(sat * (1.0 + 0.3 * iIntensity), 1.0);
    
    // Convert back to RGB
    vec3 hsvColor = vec3(hue, sat, val);
    vec3 shiftedColor = hsv2rgb(hsvColor);
    
    // Add pulsating glow - reduced effect
    float glow = sin(time * 0.8) * 0.1 * iIntensity + 1.0;
    shiftedColor *= glow;
    
    // Edge detection with limited sampling distance
    float sampleDist = 0.008;
    float edgeX = length(texture2D(iTexture, vec2(distortedUV.x + sampleDist, distortedUV.y)).rgb - 
                         texture2D(iTexture, vec2(distortedUV.x - sampleDist, distortedUV.y)).rgb);
    float edgeY = length(texture2D(iTexture, vec2(distortedUV.x, distortedUV.y + sampleDist)).rgb - 
                         texture2D(iTexture, vec2(distortedUV.x, distortedUV.y - sampleDist)).rgb);
    float edge = (edgeX + edgeY) * 2.0 * iIntensity * edgeFactor;
    
    // Create rainbow-colored edges - reduced effect
    vec3 rainbowColor = hsv2rgb(vec3(fract(time * 0.1 + dist * 2.0), 1.0, 1.0));
    shiftedColor = mix(shiftedColor, rainbowColor, min(edge, 0.3));
    
    // The final color is just the background effect (no kaleidoscope)
    vec3 finalColor = shiftedColor;
    
    // Final color
    gl_FragColor = vec4(finalColor, 1.0);
} 