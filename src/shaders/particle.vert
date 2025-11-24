// GPU Particle System Vertex Shader
// Efficient particle rendering with trails and effects

precision highp float;

// Attributes
attribute vec3 position;
attribute vec3 velocity;
attribute float life; // 0 to 1, 1 being newly spawned
attribute float size;
attribute vec3 color;
attribute float particleType; // 0: sparkle, 1: trail, 2: energy

// Uniforms
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 modelMatrix;
uniform vec3 cameraPosition;

uniform float time;
uniform float deltaTime;
uniform vec3 gravity;
uniform float drag;

// Varyings
varying vec3 vColor;
varying float vLife;
varying float vParticleType;
varying vec2 vUv;
varying float vRotation;

// Noise for variation
float noise(float p) {
    return fract(sin(p) * 43758.5453123);
}

void main() {
    vColor = color;
    vLife = life;
    vParticleType = particleType;

    // Calculate particle position with physics
    vec3 vel = velocity;

    // Apply gravity and drag
    vel += gravity * (1.0 - life);
    vel *= (1.0 - drag * deltaTime);

    // Update position
    vec3 particlePos = position + vel * deltaTime;

    // Add swirl motion for energy particles
    if(particleType > 1.5) {
        float swirl = time * 2.0 + life * 6.28318;
        particlePos.x += sin(swirl) * 0.1 * (1.0 - life);
        particlePos.z += cos(swirl) * 0.1 * (1.0 - life);
    }

    // Calculate world position
    vec4 worldPosition = modelMatrix * vec4(particlePos, 1.0);
    vec3 worldPos = worldPosition.xyz;

    // Billboard to face camera
    vec3 toCamera = normalize(cameraPosition - worldPos);
    vec3 up = vec3(0.0, 1.0, 0.0);
    vec3 right = normalize(cross(up, toCamera));
    up = cross(toCamera, right);

    // Particle rotation
    float rotation = time + noise(life * 100.0) * 6.28318;
    vRotation = rotation;

    // Size based on life and particle type
    float particleSize = size * life;

    // Trail particles stretch based on velocity
    if(particleType > 0.5 && particleType < 1.5) {
        particleSize *= (1.0 + length(velocity) * 0.5);
    }

    // Calculate final position with billboard
    vec2 quadPos = vec2(
        (position.x > 0.5 ? 1.0 : -1.0),
        (position.y > 0.5 ? 1.0 : -1.0)
    );

    // Apply rotation
    float c = cos(rotation);
    float s = sin(rotation);
    vec2 rotatedPos = vec2(
        quadPos.x * c - quadPos.y * s,
        quadPos.x * s + quadPos.y * c
    );

    vec3 finalPos = worldPos + (right * rotatedPos.x + up * rotatedPos.y) * particleSize;

    // UV coordinates
    vUv = quadPos * 0.5 + 0.5;

    // Final position
    gl_Position = projectionMatrix * viewMatrix * vec4(finalPos, 1.0);
    gl_PointSize = particleSize * 100.0;
}
