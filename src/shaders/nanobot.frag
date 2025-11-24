// NanoBot Fragment Shader
// Stunning glow effects, fresnel, holographic shimmer, and cyberpunk aesthetics

precision highp float;

// Varyings from vertex shader
varying vec3 vNormal;
varying vec3 vWorldPosition;
varying vec3 vViewPosition;
varying vec2 vUv;
varying float vAo;
varying float vPulse;
varying vec3 vCameraPosition;

// Uniforms
uniform float time;
uniform float botState; // 0: idle, 1: active, 2: alert, 3: hivemind
uniform vec3 primaryColor;    // #00FF41
uniform vec3 secondaryColor;  // #00D9FF
uniform vec3 accentColor;     // #FF006E
uniform float emissiveIntensity;
uniform float fresnelPower;
uniform float holographicIntensity;

// Noise function for holographic effects
float noise(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

// 3D noise
float noise3d(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float n = i.x + i.y * 57.0 + 113.0 * i.z;
    return mix(
        mix(mix(fract(sin(n) * 43758.5453),
                fract(sin(n + 1.0) * 43758.5453), f.x),
            mix(fract(sin(n + 57.0) * 43758.5453),
                fract(sin(n + 58.0) * 43758.5453), f.x), f.y),
        mix(mix(fract(sin(n + 113.0) * 43758.5453),
                fract(sin(n + 114.0) * 43758.5453), f.x),
            mix(fract(sin(n + 170.0) * 43758.5453),
                fract(sin(n + 171.0) * 43758.5453), f.x), f.y),
        f.z
    );
}

// Fractal Brownian Motion for complex patterns
float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;

    for(int i = 0; i < 5; i++) {
        value += amplitude * noise3d(p * frequency);
        frequency *= 2.0;
        amplitude *= 0.5;
    }

    return value;
}

// Holographic shimmer effect
vec3 holographicShimmer(vec2 uv, vec3 normal, float time) {
    // Create scanning lines
    float scanline = sin(uv.y * 100.0 + time * 5.0) * 0.5 + 0.5;

    // Chromatic aberration effect
    float r = noise(uv * 10.0 + time * 0.1);
    float g = noise(uv * 10.0 + time * 0.1 + 0.33);
    float b = noise(uv * 10.0 + time * 0.1 + 0.66);

    vec3 chromatic = vec3(r, g, b);

    // Interference pattern
    float interference = sin(uv.x * 30.0 + time * 2.0) * sin(uv.y * 30.0 - time * 3.0);
    interference = interference * 0.5 + 0.5;

    // Combine effects
    vec3 shimmer = mix(chromatic, vec3(interference), 0.3) * scanline;

    return shimmer * 0.3;
}

// Fresnel effect for edge glow
float fresnel(vec3 normal, vec3 viewDir, float power) {
    return pow(1.0 - max(0.0, dot(normal, viewDir)), power);
}

// Color based on bot state
vec3 getStateColor(float state) {
    vec3 color;

    if(state < 0.5) {
        // Idle - primary color
        color = primaryColor;
    } else if(state < 1.5) {
        // Active - blend primary and secondary
        color = mix(primaryColor, secondaryColor, state - 0.5);
    } else if(state < 2.5) {
        // Alert - accent color
        color = mix(secondaryColor, accentColor, state - 1.5);
    } else {
        // Hivemind - all colors pulsing
        float t = sin(time * 3.0) * 0.5 + 0.5;
        color = mix(primaryColor, secondaryColor, t);
        color = mix(color, accentColor, sin(time * 5.0 + vWorldPosition.y * 2.0) * 0.5 + 0.5);
    }

    return color;
}

void main() {
    // Normalize vectors
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vCameraPosition - vWorldPosition);

    // Base color from state
    vec3 baseColor = getStateColor(botState);

    // Fresnel/rim lighting for edge glow
    float fresnelFactor = fresnel(normal, viewDir, fresnelPower);
    vec3 rimColor = baseColor * fresnelFactor * 2.0;

    // Holographic shimmer
    vec3 shimmer = holographicShimmer(vUv, normal, time) * holographicIntensity;

    // Pulsing emissive based on state and time
    float emissivePulse = vPulse * emissiveIntensity;
    float stateEmissive = mix(0.3, 1.0, botState / 3.0);

    // Add noise-based energy patterns
    vec3 energyPos = vWorldPosition * 3.0 + time * 0.5;
    float energyPattern = fbm(energyPos);
    energyPattern = smoothstep(0.4, 0.6, energyPattern);

    // Circuit-like patterns
    float circuits = step(0.95, noise3d(vWorldPosition * 20.0 + vec3(time * 0.1)));
    vec3 circuitGlow = secondaryColor * circuits * 3.0;

    // Ambient occlusion
    float ao = vAo;

    // Combine all effects
    vec3 emissive = baseColor * emissivePulse * stateEmissive;
    emissive += energyPattern * baseColor * 0.5;
    emissive += circuitGlow;

    // Final color composition
    vec3 finalColor = baseColor * ao * 0.2; // Base ambient
    finalColor += emissive;
    finalColor += rimColor;
    finalColor += shimmer * baseColor;

    // Add extra glow based on pulse
    finalColor += baseColor * vPulse * 0.3;

    // HDR output for bloom post-processing
    // Values > 1.0 will bloom beautifully
    finalColor *= mix(1.0, 3.0, emissivePulse);

    // Add subtle color variation
    finalColor += vec3(
        sin(time + vWorldPosition.x * 5.0),
        sin(time * 1.3 + vWorldPosition.y * 5.0),
        sin(time * 1.7 + vWorldPosition.z * 5.0)
    ) * 0.05 * botState / 3.0;

    gl_FragColor = vec4(finalColor, 1.0);
}
