// Hive-Mind Connection Lines Fragment Shader
// Animated data flow particles with pulsing glow

precision highp float;

// Varyings
varying float vLineProgress;
varying float vDistanceToCamera;
varying vec3 vWorldPosition;
varying float vPulse;
varying float vFlow;

// Uniforms
uniform float time;
uniform vec3 primaryColor;
uniform vec3 secondaryColor;
uniform float fadeDistance;
uniform float maxDistance;
uniform float particleCount;
uniform float particleSize;
uniform float glowIntensity;

// Noise for particle sparkle
float noise(float p) {
    return fract(sin(p) * 43758.5453123);
}

// Smooth pulse function
float smoothPulse(float center, float width, float x) {
    float edge0 = center - width * 0.5;
    float edge1 = center + width * 0.5;
    return smoothstep(edge0 - 0.1, edge0, x) * (1.0 - smoothstep(edge1, edge1 + 0.1, x));
}

void main() {
    // Distance-based fade
    float distanceFade = 1.0 - smoothstep(fadeDistance, maxDistance, vDistanceToCamera);

    if(distanceFade < 0.01) {
        discard;
    }

    // Base line glow
    float baseGlow = vPulse * 0.5 + 0.5;

    // Create data flow particles along the line
    float particlePattern = 0.0;
    for(float i = 0.0; i < 8.0; i++) {
        if(i >= particleCount) break;

        float particlePosition = fract(vFlow + i / particleCount);
        float particleGlow = smoothPulse(particlePosition, particleSize, vLineProgress);

        // Add sparkle variation
        float sparkle = noise(i * 100.0 + time * 0.5) * 0.5 + 0.5;
        particlePattern += particleGlow * sparkle;
    }

    // Color based on position and time
    vec3 color = mix(primaryColor, secondaryColor, vLineProgress);

    // Add shimmer
    float shimmer = sin(vLineProgress * 20.0 - time * 3.0) * 0.5 + 0.5;
    color = mix(color, secondaryColor, shimmer * 0.3);

    // Combine base glow with particles
    float totalGlow = baseGlow + particlePattern * 2.0;

    // Edge fade for smooth line appearance
    float edgeFade = smoothstep(0.0, 0.05, vLineProgress) *
                     smoothstep(1.0, 0.95, vLineProgress);

    // Apply all effects
    vec3 finalColor = color * totalGlow * glowIntensity;
    float alpha = totalGlow * distanceFade * edgeFade;

    // HDR output for bloom
    finalColor *= mix(1.0, 2.5, particlePattern);

    // Pulse the entire line
    finalColor *= 1.0 + vPulse * 0.5;

    gl_FragColor = vec4(finalColor, alpha);
}
