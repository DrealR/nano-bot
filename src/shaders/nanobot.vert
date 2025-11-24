// NanoBot Vertex Shader
// Handles vertex displacement, pulsing effects, and data passing to fragment shader

precision highp float;

// Attributes
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;
attribute float ao;

// Uniforms
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;
uniform mat4 modelMatrix;
uniform vec3 cameraPosition;

uniform float time;
uniform float pulseIntensity;
uniform float pulseSpeed;
uniform float displacementAmount;
uniform float botState; // 0: idle, 1: active, 2: alert, 3: hivemind

// Varyings to pass to fragment shader
varying vec3 vNormal;
varying vec3 vWorldPosition;
varying vec3 vViewPosition;
varying vec2 vUv;
varying float vAo;
varying float vPulse;
varying vec3 vCameraPosition;

// Noise function for organic displacement
float noise(vec3 p) {
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

void main() {
    // Pass data to fragment shader
    vUv = uv;
    vAo = ao;
    vCameraPosition = cameraPosition;

    // Calculate pulse effect based on time and bot state
    float pulse = sin(time * pulseSpeed) * 0.5 + 0.5;
    float statePulse = sin(time * pulseSpeed * (1.0 + botState * 0.5)) * 0.5 + 0.5;
    vPulse = mix(pulse, statePulse, pulseIntensity);

    // Create organic displacement with noise
    vec3 noisePos = position * 2.0 + time * 0.3;
    float noiseValue = noise(noisePos) * 2.0 - 1.0;

    // Layered noise for more detail
    float detailNoise = noise(noisePos * 3.0 + time * 0.5) * 0.5;
    noiseValue += detailNoise;

    // Apply displacement along normal for pulsing effect
    vec3 displaced = position + normal * noiseValue * displacementAmount * vPulse;

    // Additional displacement based on bot state
    float stateDisplacement = sin(time * 2.0 + position.y * 5.0) * botState * 0.02;
    displaced += normal * stateDisplacement;

    // Calculate world position
    vec4 worldPosition = modelMatrix * vec4(displaced, 1.0);
    vWorldPosition = worldPosition.xyz;

    // Calculate view position
    vec4 viewPosition = modelViewMatrix * vec4(displaced, 1.0);
    vViewPosition = viewPosition.xyz;

    // Transform normal to world space
    vNormal = normalize(normalMatrix * normal);

    // Final position
    gl_Position = projectionMatrix * viewPosition;
}
