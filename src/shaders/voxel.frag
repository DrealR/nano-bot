// Voxel World Fragment Shader
// Beautiful lighting with AO, soft shadows, and fog

precision highp float;

// Varyings
varying vec3 vNormal;
varying vec3 vWorldPosition;
varying vec2 vUv;
varying vec3 vColor;
varying float vAo;
varying float vEmissive;
varying vec3 vSunDirection;
varying float vFogDepth;

// Uniforms
uniform float time;
uniform vec3 sunColor;
uniform vec3 skyColor;
uniform vec3 ambientColor;
uniform float fogDensity;
uniform float fogNear;
uniform float fogFar;
uniform vec3 fogColor;
uniform float shadowSoftness;

// Noise for subtle texture variation
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

// Soft shadow calculation
float softShadow(vec3 normal, vec3 lightDir) {
    float NdotL = dot(normal, lightDir);

    // Soft transition from light to shadow
    float shadow = smoothstep(-shadowSoftness, shadowSoftness, NdotL);

    return shadow;
}

// Fog calculation
vec3 applyFog(vec3 color, float depth) {
    float fogAmount = smoothstep(fogNear, fogFar, depth) * fogDensity;
    return mix(color, fogColor, fogAmount);
}

void main() {
    // Normalize normal
    vec3 normal = normalize(vNormal);

    // Add subtle texture variation
    float textureNoise = noise3d(vWorldPosition * 10.0) * 0.1;
    vec3 baseColor = vColor * (1.0 - textureNoise * 0.3);

    // Directional lighting (sun)
    vec3 lightDir = normalize(vSunDirection);
    float NdotL = max(0.0, dot(normal, lightDir));

    // Soft shadow
    float shadow = softShadow(normal, lightDir);

    // Diffuse lighting with soft shadows
    vec3 diffuse = sunColor * NdotL * shadow;

    // Sky light (hemisphere lighting)
    float skyLight = dot(normal, vec3(0.0, 1.0, 0.0)) * 0.5 + 0.5;
    vec3 skyLighting = skyColor * skyLight * 0.3;

    // Ambient occlusion
    float ao = vAo;

    // Ambient lighting with AO
    vec3 ambient = ambientColor * ao;

    // Combine lighting
    vec3 lighting = ambient + diffuse + skyLighting;

    // Apply lighting to base color
    vec3 litColor = baseColor * lighting;

    // Emissive materials
    if(vEmissive > 0.5) {
        // Emissive materials glow
        float emissiveStrength = 2.0 + sin(time * 2.0) * 0.3;
        litColor += baseColor * emissiveStrength;
    }

    // Apply fog
    vec3 finalColor = applyFog(litColor, vFogDepth);

    // Add slight color variation based on position for visual interest
    finalColor += vec3(
        noise(vWorldPosition.xz * 0.1),
        noise(vWorldPosition.xz * 0.1 + 0.33),
        noise(vWorldPosition.xz * 0.1 + 0.66)
    ) * 0.02;

    // Subtle vignette on distant blocks
    float distanceVignette = 1.0 - smoothstep(fogNear, fogFar * 0.8, vFogDepth) * 0.3;
    finalColor *= distanceVignette;

    gl_FragColor = vec4(finalColor, 1.0);
}
