// Voxel World Vertex Shader
// Beautiful voxel rendering with smooth lighting

precision highp float;

// Attributes
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;
attribute vec3 color;
attribute float ao; // Ambient occlusion per vertex
attribute float emissive; // Emissive flag

// Uniforms
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;
uniform mat4 modelMatrix;
uniform vec3 cameraPosition;

uniform float time;
uniform vec3 sunDirection;
uniform vec3 sunColor;

// Varyings
varying vec3 vNormal;
varying vec3 vWorldPosition;
varying vec2 vUv;
varying vec3 vColor;
varying float vAo;
varying float vEmissive;
varying vec3 vSunDirection;
varying float vFogDepth;

void main() {
    vUv = uv;
    vColor = color;
    vAo = ao;
    vEmissive = emissive;
    vSunDirection = sunDirection;

    // Calculate world position
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;

    // Transform normal to world space
    vNormal = normalize(normalMatrix * normal);

    // Calculate view position for fog
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    vFogDepth = -viewPosition.z;

    // Final position
    gl_Position = projectionMatrix * viewPosition;
}
