// GPU Particle System Fragment Shader
// Beautiful particle effects with alpha fade and color interpolation

precision highp float;

// Varyings
varying vec3 vColor;
varying float vLife;
varying float vParticleType;
varying vec2 vUv;
varying float vRotation;

// Uniforms
uniform float time;
uniform vec3 colorStart;
uniform vec3 colorEnd;
uniform float alphaEasing;
uniform float softness;

// Noise for sparkle
float noise(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

// Smooth circle for soft particles
float softCircle(vec2 uv, float radius, float softness) {
    float dist = length(uv - 0.5);
    return 1.0 - smoothstep(radius - softness, radius, dist);
}

// Star shape for sparkles
float star(vec2 uv, float rotation, float points) {
    vec2 pos = uv - 0.5;
    float angle = atan(pos.y, pos.x) + rotation;
    float dist = length(pos);

    float pointAngle = 6.28318 / points;
    float a = mod(angle, pointAngle) - pointAngle * 0.5;
    float ray = cos(a * points * 0.5);

    return smoothstep(0.3, 0.0, dist) * ray;
}

// Trail shape (elongated)
float trail(vec2 uv, float rotation) {
    vec2 pos = uv - 0.5;

    // Rotate
    float c = cos(rotation);
    float s = sin(rotation);
    vec2 rotatedPos = vec2(
        pos.x * c - pos.y * s,
        pos.x * s + pos.y * c
    );

    // Elongated shape
    float x = abs(rotatedPos.x);
    float y = abs(rotatedPos.y * 2.0);

    float dist = max(x, y);
    return 1.0 - smoothstep(0.3, 0.5, dist);
}

// Energy particle (glowing orb with corona)
float energyOrb(vec2 uv, float time) {
    float dist = length(uv - 0.5);

    // Core
    float core = 1.0 - smoothstep(0.0, 0.2, dist);

    // Pulsing corona
    float pulse = sin(time * 5.0) * 0.5 + 0.5;
    float corona = 1.0 - smoothstep(0.2, 0.4 + pulse * 0.1, dist);
    corona *= 0.5;

    return core + corona;
}

void main() {
    // Life-based alpha with easing
    float alpha = pow(vLife, alphaEasing);

    // Color interpolation based on life
    vec3 color = mix(colorEnd, colorStart, vLife);
    color = mix(color, vColor, 0.5);

    // Shape based on particle type
    float shape = 0.0;

    if(vParticleType < 0.5) {
        // Sparkle - star shape
        shape = star(vUv, vRotation, 5.0);
        shape += softCircle(vUv, 0.2, 0.1) * 0.5; // Add core glow

        // Twinkle effect
        float twinkle = noise(vUv + time * 0.1) * 0.3 + 0.7;
        shape *= twinkle;

    } else if(vParticleType < 1.5) {
        // Trail - elongated shape
        shape = trail(vUv, vRotation);

        // Fade along trail
        float trailFade = smoothstep(1.0, 0.0, vUv.x);
        shape *= trailFade;

    } else {
        // Energy particle - glowing orb
        shape = energyOrb(vUv, time);

        // Add shimmer
        float shimmer = noise(vUv * 10.0 + time) * 0.2 + 0.8;
        shape *= shimmer;
    }

    // Apply shape to alpha
    alpha *= shape;

    // Add extra glow for very bright particles
    if(vLife > 0.8) {
        color *= 1.0 + (vLife - 0.8) * 2.0;
    }

    // Soft particle edges
    alpha *= softness;

    // Discard fully transparent fragments
    if(alpha < 0.01) {
        discard;
    }

    // HDR output for bloom on bright particles
    if(vParticleType > 1.5) {
        color *= 2.0; // Energy particles extra bright
    }

    gl_FragColor = vec4(color, alpha);
}
