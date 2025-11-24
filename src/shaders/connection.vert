// Hive-Mind Connection Lines Vertex Shader
// Animated data flow particles along connection lines

precision highp float;

// Attributes
attribute vec3 position;
attribute vec3 nextPosition;
attribute float lineProgress; // 0 to 1 along the line
attribute float lineWidth;

// Uniforms
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 modelMatrix;
uniform vec3 cameraPosition;

uniform float time;
uniform float flowSpeed;
uniform float pulseSpeed;
uniform float lineThickness;

// Varyings
varying float vLineProgress;
varying float vDistanceToCamera;
varying vec3 vWorldPosition;
varying float vPulse;
varying float vFlow;

// Calculate camera-facing billboard
vec3 getCameraBillboard(vec3 pos, vec3 cameraPos, vec3 lineDir) {
    vec3 toCamera = normalize(cameraPos - pos);
    vec3 right = normalize(cross(lineDir, toCamera));
    return right;
}

void main() {
    vLineProgress = lineProgress;

    // Calculate pulse along the line
    float pulse = sin(time * pulseSpeed + lineProgress * 6.28318) * 0.5 + 0.5;
    vPulse = pulse;

    // Calculate flow animation
    float flow = fract(lineProgress + time * flowSpeed);
    vFlow = flow;

    // Calculate line direction
    vec3 lineDir = normalize(nextPosition - position);

    // Create billboard effect for line thickness
    vec3 right = getCameraBillboard(position, cameraPosition, lineDir);

    // Apply thickness with pulse
    float thickness = lineThickness * lineWidth * (1.0 + pulse * 0.3);
    vec3 offset = right * thickness;

    // Calculate world position
    vec4 worldPosition = modelMatrix * vec4(position + offset, 1.0);
    vWorldPosition = worldPosition.xyz;

    // Distance to camera for fade
    vDistanceToCamera = length(cameraPosition - vWorldPosition);

    // Final position
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position + offset, 1.0);
}
