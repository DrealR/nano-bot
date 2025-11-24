/**
 * NanoBot Framework - GLSL Shader Collection
 * Beautiful, production-ready shaders for stunning 3D effects
 */

// NanoBot Shaders
export const nanobotVertexShader = `
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
uniform float botState;

// Varyings to pass to fragment shader
varying vec3 vNormal;
varying vec3 vWorldPosition;
varying vec3 vViewPosition;
varying vec2 vUv;
varying float vAo;
varying float vPulse;
varying vec3 vCameraPosition;

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
    vUv = uv;
    vAo = ao;
    vCameraPosition = cameraPosition;

    float pulse = sin(time * pulseSpeed) * 0.5 + 0.5;
    float statePulse = sin(time * pulseSpeed * (1.0 + botState * 0.5)) * 0.5 + 0.5;
    vPulse = mix(pulse, statePulse, pulseIntensity);

    vec3 noisePos = position * 2.0 + time * 0.3;
    float noiseValue = noise(noisePos) * 2.0 - 1.0;
    float detailNoise = noise(noisePos * 3.0 + time * 0.5) * 0.5;
    noiseValue += detailNoise;

    vec3 displaced = position + normal * noiseValue * displacementAmount * vPulse;
    float stateDisplacement = sin(time * 2.0 + position.y * 5.0) * botState * 0.02;
    displaced += normal * stateDisplacement;

    vec4 worldPosition = modelMatrix * vec4(displaced, 1.0);
    vWorldPosition = worldPosition.xyz;

    vec4 viewPosition = modelViewMatrix * vec4(displaced, 1.0);
    vViewPosition = viewPosition.xyz;

    vNormal = normalize(normalMatrix * normal);

    gl_Position = projectionMatrix * viewPosition;
}
`;

export const nanobotFragmentShader = `
precision highp float;

varying vec3 vNormal;
varying vec3 vWorldPosition;
varying vec3 vViewPosition;
varying vec2 vUv;
varying float vAo;
varying float vPulse;
varying vec3 vCameraPosition;

uniform float time;
uniform float botState;
uniform vec3 primaryColor;
uniform vec3 secondaryColor;
uniform vec3 accentColor;
uniform float emissiveIntensity;
uniform float fresnelPower;
uniform float holographicIntensity;

float noise(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

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

vec3 holographicShimmer(vec2 uv, vec3 normal, float time) {
    float scanline = sin(uv.y * 100.0 + time * 5.0) * 0.5 + 0.5;

    float r = noise(uv * 10.0 + time * 0.1);
    float g = noise(uv * 10.0 + time * 0.1 + 0.33);
    float b = noise(uv * 10.0 + time * 0.1 + 0.66);

    vec3 chromatic = vec3(r, g, b);

    float interference = sin(uv.x * 30.0 + time * 2.0) * sin(uv.y * 30.0 - time * 3.0);
    interference = interference * 0.5 + 0.5;

    vec3 shimmer = mix(chromatic, vec3(interference), 0.3) * scanline;

    return shimmer * 0.3;
}

float fresnel(vec3 normal, vec3 viewDir, float power) {
    return pow(1.0 - max(0.0, dot(normal, viewDir)), power);
}

vec3 getStateColor(float state) {
    vec3 color;

    if(state < 0.5) {
        color = primaryColor;
    } else if(state < 1.5) {
        color = mix(primaryColor, secondaryColor, state - 0.5);
    } else if(state < 2.5) {
        color = mix(secondaryColor, accentColor, state - 1.5);
    } else {
        float t = sin(time * 3.0) * 0.5 + 0.5;
        color = mix(primaryColor, secondaryColor, t);
        color = mix(color, accentColor, sin(time * 5.0 + vWorldPosition.y * 2.0) * 0.5 + 0.5);
    }

    return color;
}

void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vCameraPosition - vWorldPosition);

    vec3 baseColor = getStateColor(botState);

    float fresnelFactor = fresnel(normal, viewDir, fresnelPower);
    vec3 rimColor = baseColor * fresnelFactor * 2.0;

    vec3 shimmer = holographicShimmer(vUv, normal, time) * holographicIntensity;

    float emissivePulse = vPulse * emissiveIntensity;
    float stateEmissive = mix(0.3, 1.0, botState / 3.0);

    vec3 energyPos = vWorldPosition * 3.0 + time * 0.5;
    float energyPattern = fbm(energyPos);
    energyPattern = smoothstep(0.4, 0.6, energyPattern);

    float circuits = step(0.95, noise3d(vWorldPosition * 20.0 + vec3(time * 0.1)));
    vec3 circuitGlow = secondaryColor * circuits * 3.0;

    float ao = vAo;

    vec3 emissive = baseColor * emissivePulse * stateEmissive;
    emissive += energyPattern * baseColor * 0.5;
    emissive += circuitGlow;

    vec3 finalColor = baseColor * ao * 0.2;
    finalColor += emissive;
    finalColor += rimColor;
    finalColor += shimmer * baseColor;
    finalColor += baseColor * vPulse * 0.3;

    finalColor *= mix(1.0, 3.0, emissivePulse);

    finalColor += vec3(
        sin(time + vWorldPosition.x * 5.0),
        sin(time * 1.3 + vWorldPosition.y * 5.0),
        sin(time * 1.7 + vWorldPosition.z * 5.0)
    ) * 0.05 * botState / 3.0;

    gl_FragColor = vec4(finalColor, 1.0);
}
`;

// Connection Shaders
export const connectionVertexShader = `
precision highp float;

attribute vec3 position;
attribute vec3 nextPosition;
attribute float lineProgress;
attribute float lineWidth;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 modelMatrix;
uniform vec3 cameraPosition;

uniform float time;
uniform float flowSpeed;
uniform float pulseSpeed;
uniform float lineThickness;

varying float vLineProgress;
varying float vDistanceToCamera;
varying vec3 vWorldPosition;
varying float vPulse;
varying float vFlow;

vec3 getCameraBillboard(vec3 pos, vec3 cameraPos, vec3 lineDir) {
    vec3 toCamera = normalize(cameraPos - pos);
    vec3 right = normalize(cross(lineDir, toCamera));
    return right;
}

void main() {
    vLineProgress = lineProgress;

    float pulse = sin(time * pulseSpeed + lineProgress * 6.28318) * 0.5 + 0.5;
    vPulse = pulse;

    float flow = fract(lineProgress + time * flowSpeed);
    vFlow = flow;

    vec3 lineDir = normalize(nextPosition - position);
    vec3 right = getCameraBillboard(position, cameraPosition, lineDir);

    float thickness = lineThickness * lineWidth * (1.0 + pulse * 0.3);
    vec3 offset = right * thickness;

    vec4 worldPosition = modelMatrix * vec4(position + offset, 1.0);
    vWorldPosition = worldPosition.xyz;

    vDistanceToCamera = length(cameraPosition - vWorldPosition);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position + offset, 1.0);
}
`;

export const connectionFragmentShader = `
precision highp float;

varying float vLineProgress;
varying float vDistanceToCamera;
varying vec3 vWorldPosition;
varying float vPulse;
varying float vFlow;

uniform float time;
uniform vec3 primaryColor;
uniform vec3 secondaryColor;
uniform float fadeDistance;
uniform float maxDistance;
uniform float particleCount;
uniform float particleSize;
uniform float glowIntensity;

float noise(float p) {
    return fract(sin(p) * 43758.5453123);
}

float smoothPulse(float center, float width, float x) {
    float edge0 = center - width * 0.5;
    float edge1 = center + width * 0.5;
    return smoothstep(edge0 - 0.1, edge0, x) * (1.0 - smoothstep(edge1, edge1 + 0.1, x));
}

void main() {
    float distanceFade = 1.0 - smoothstep(fadeDistance, maxDistance, vDistanceToCamera);

    if(distanceFade < 0.01) {
        discard;
    }

    float baseGlow = vPulse * 0.5 + 0.5;

    float particlePattern = 0.0;
    for(float i = 0.0; i < 8.0; i++) {
        if(i >= particleCount) break;

        float particlePosition = fract(vFlow + i / particleCount);
        float particleGlow = smoothPulse(particlePosition, particleSize, vLineProgress);

        float sparkle = noise(i * 100.0 + time * 0.5) * 0.5 + 0.5;
        particlePattern += particleGlow * sparkle;
    }

    vec3 color = mix(primaryColor, secondaryColor, vLineProgress);

    float shimmer = sin(vLineProgress * 20.0 - time * 3.0) * 0.5 + 0.5;
    color = mix(color, secondaryColor, shimmer * 0.3);

    float totalGlow = baseGlow + particlePattern * 2.0;

    float edgeFade = smoothstep(0.0, 0.05, vLineProgress) *
                     smoothstep(1.0, 0.95, vLineProgress);

    vec3 finalColor = color * totalGlow * glowIntensity;
    float alpha = totalGlow * distanceFade * edgeFade;

    finalColor *= mix(1.0, 2.5, particlePattern);
    finalColor *= 1.0 + vPulse * 0.5;

    gl_FragColor = vec4(finalColor, alpha);
}
`;

// Voxel Shaders
export const voxelVertexShader = `
precision highp float;

attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;
attribute vec3 color;
attribute float ao;
attribute float emissive;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;
uniform mat4 modelMatrix;
uniform vec3 cameraPosition;

uniform float time;
uniform vec3 sunDirection;
uniform vec3 sunColor;

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

    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;

    vNormal = normalize(normalMatrix * normal);

    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    vFogDepth = -viewPosition.z;

    gl_Position = projectionMatrix * viewPosition;
}
`;

export const voxelFragmentShader = `
precision highp float;

varying vec3 vNormal;
varying vec3 vWorldPosition;
varying vec2 vUv;
varying vec3 vColor;
varying float vAo;
varying float vEmissive;
varying vec3 vSunDirection;
varying float vFogDepth;

uniform float time;
uniform vec3 sunColor;
uniform vec3 skyColor;
uniform vec3 ambientColor;
uniform float fogDensity;
uniform float fogNear;
uniform float fogFar;
uniform vec3 fogColor;
uniform float shadowSoftness;

float noise(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

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

float softShadow(vec3 normal, vec3 lightDir) {
    float NdotL = dot(normal, lightDir);
    float shadow = smoothstep(-shadowSoftness, shadowSoftness, NdotL);
    return shadow;
}

vec3 applyFog(vec3 color, float depth) {
    float fogAmount = smoothstep(fogNear, fogFar, depth) * fogDensity;
    return mix(color, fogColor, fogAmount);
}

void main() {
    vec3 normal = normalize(vNormal);

    float textureNoise = noise3d(vWorldPosition * 10.0) * 0.1;
    vec3 baseColor = vColor * (1.0 - textureNoise * 0.3);

    vec3 lightDir = normalize(vSunDirection);
    float NdotL = max(0.0, dot(normal, lightDir));

    float shadow = softShadow(normal, lightDir);

    vec3 diffuse = sunColor * NdotL * shadow;

    float skyLight = dot(normal, vec3(0.0, 1.0, 0.0)) * 0.5 + 0.5;
    vec3 skyLighting = skyColor * skyLight * 0.3;

    float ao = vAo;
    vec3 ambient = ambientColor * ao;

    vec3 lighting = ambient + diffuse + skyLighting;
    vec3 litColor = baseColor * lighting;

    if(vEmissive > 0.5) {
        float emissiveStrength = 2.0 + sin(time * 2.0) * 0.3;
        litColor += baseColor * emissiveStrength;
    }

    vec3 finalColor = applyFog(litColor, vFogDepth);

    finalColor += vec3(
        noise(vWorldPosition.xz * 0.1),
        noise(vWorldPosition.xz * 0.1 + 0.33),
        noise(vWorldPosition.xz * 0.1 + 0.66)
    ) * 0.02;

    float distanceVignette = 1.0 - smoothstep(fogNear, fogFar * 0.8, vFogDepth) * 0.3;
    finalColor *= distanceVignette;

    gl_FragColor = vec4(finalColor, 1.0);
}
`;

// Particle Shaders
export const particleVertexShader = `
precision highp float;

attribute vec3 position;
attribute vec3 velocity;
attribute float life;
attribute float size;
attribute vec3 color;
attribute float particleType;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 modelMatrix;
uniform vec3 cameraPosition;

uniform float time;
uniform float deltaTime;
uniform vec3 gravity;
uniform float drag;

varying vec3 vColor;
varying float vLife;
varying float vParticleType;
varying vec2 vUv;
varying float vRotation;

float noise(float p) {
    return fract(sin(p) * 43758.5453123);
}

void main() {
    vColor = color;
    vLife = life;
    vParticleType = particleType;

    vec3 vel = velocity;
    vel += gravity * (1.0 - life);
    vel *= (1.0 - drag * deltaTime);

    vec3 particlePos = position + vel * deltaTime;

    if(particleType > 1.5) {
        float swirl = time * 2.0 + life * 6.28318;
        particlePos.x += sin(swirl) * 0.1 * (1.0 - life);
        particlePos.z += cos(swirl) * 0.1 * (1.0 - life);
    }

    vec4 worldPosition = modelMatrix * vec4(particlePos, 1.0);
    vec3 worldPos = worldPosition.xyz;

    vec3 toCamera = normalize(cameraPosition - worldPos);
    vec3 up = vec3(0.0, 1.0, 0.0);
    vec3 right = normalize(cross(up, toCamera));
    up = cross(toCamera, right);

    float rotation = time + noise(life * 100.0) * 6.28318;
    vRotation = rotation;

    float particleSize = size * life;

    if(particleType > 0.5 && particleType < 1.5) {
        particleSize *= (1.0 + length(velocity) * 0.5);
    }

    vec2 quadPos = vec2(
        (position.x > 0.5 ? 1.0 : -1.0),
        (position.y > 0.5 ? 1.0 : -1.0)
    );

    float c = cos(rotation);
    float s = sin(rotation);
    vec2 rotatedPos = vec2(
        quadPos.x * c - quadPos.y * s,
        quadPos.x * s + quadPos.y * c
    );

    vec3 finalPos = worldPos + (right * rotatedPos.x + up * rotatedPos.y) * particleSize;

    vUv = quadPos * 0.5 + 0.5;

    gl_Position = projectionMatrix * viewMatrix * vec4(finalPos, 1.0);
    gl_PointSize = particleSize * 100.0;
}
`;

export const particleFragmentShader = `
precision highp float;

varying vec3 vColor;
varying float vLife;
varying float vParticleType;
varying vec2 vUv;
varying float vRotation;

uniform float time;
uniform vec3 colorStart;
uniform vec3 colorEnd;
uniform float alphaEasing;
uniform float softness;

float noise(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

float softCircle(vec2 uv, float radius, float softness) {
    float dist = length(uv - 0.5);
    return 1.0 - smoothstep(radius - softness, radius, dist);
}

float star(vec2 uv, float rotation, float points) {
    vec2 pos = uv - 0.5;
    float angle = atan(pos.y, pos.x) + rotation;
    float dist = length(pos);

    float pointAngle = 6.28318 / points;
    float a = mod(angle, pointAngle) - pointAngle * 0.5;
    float ray = cos(a * points * 0.5);

    return smoothstep(0.3, 0.0, dist) * ray;
}

float trail(vec2 uv, float rotation) {
    vec2 pos = uv - 0.5;

    float c = cos(rotation);
    float s = sin(rotation);
    vec2 rotatedPos = vec2(
        pos.x * c - pos.y * s,
        pos.x * s + pos.y * c
    );

    float x = abs(rotatedPos.x);
    float y = abs(rotatedPos.y * 2.0);

    float dist = max(x, y);
    return 1.0 - smoothstep(0.3, 0.5, dist);
}

float energyOrb(vec2 uv, float time) {
    float dist = length(uv - 0.5);

    float core = 1.0 - smoothstep(0.0, 0.2, dist);

    float pulse = sin(time * 5.0) * 0.5 + 0.5;
    float corona = 1.0 - smoothstep(0.2, 0.4 + pulse * 0.1, dist);
    corona *= 0.5;

    return core + corona;
}

void main() {
    float alpha = pow(vLife, alphaEasing);

    vec3 color = mix(colorEnd, colorStart, vLife);
    color = mix(color, vColor, 0.5);

    float shape = 0.0;

    if(vParticleType < 0.5) {
        shape = star(vUv, vRotation, 5.0);
        shape += softCircle(vUv, 0.2, 0.1) * 0.5;

        float twinkle = noise(vUv + time * 0.1) * 0.3 + 0.7;
        shape *= twinkle;

    } else if(vParticleType < 1.5) {
        shape = trail(vUv, vRotation);

        float trailFade = smoothstep(1.0, 0.0, vUv.x);
        shape *= trailFade;

    } else {
        shape = energyOrb(vUv, time);

        float shimmer = noise(vUv * 10.0 + time) * 0.2 + 0.8;
        shape *= shimmer;
    }

    alpha *= shape;

    if(vLife > 0.8) {
        color *= 1.0 + (vLife - 0.8) * 2.0;
    }

    alpha *= softness;

    if(alpha < 0.01) {
        discard;
    }

    if(vParticleType > 1.5) {
        color *= 2.0;
    }

    gl_FragColor = vec4(color, alpha);
}
`;

// Default uniforms for each shader type
export const nanobotDefaultUniforms = {
  time: { value: 0 },
  pulseIntensity: { value: 0.5 },
  pulseSpeed: { value: 2.0 },
  displacementAmount: { value: 0.01 },
  botState: { value: 0 },
  primaryColor: { value: [0.0, 1.0, 0.255] },    // #00FF41
  secondaryColor: { value: [0.0, 0.851, 1.0] },  // #00D9FF
  accentColor: { value: [1.0, 0.0, 0.431] },     // #FF006E
  emissiveIntensity: { value: 1.0 },
  fresnelPower: { value: 3.0 },
  holographicIntensity: { value: 0.5 },
};

export const connectionDefaultUniforms = {
  time: { value: 0 },
  flowSpeed: { value: 0.5 },
  pulseSpeed: { value: 2.0 },
  lineThickness: { value: 0.05 },
  primaryColor: { value: [0.0, 1.0, 0.255] },
  secondaryColor: { value: [0.0, 0.851, 1.0] },
  fadeDistance: { value: 50 },
  maxDistance: { value: 100 },
  particleCount: { value: 5 },
  particleSize: { value: 0.1 },
  glowIntensity: { value: 1.5 },
};

export const voxelDefaultUniforms = {
  time: { value: 0 },
  sunDirection: { value: [0.5, 1.0, 0.5] },
  sunColor: { value: [1.0, 0.95, 0.8] },
  skyColor: { value: [0.5, 0.7, 1.0] },
  ambientColor: { value: [0.2, 0.2, 0.3] },
  fogDensity: { value: 0.5 },
  fogNear: { value: 50 },
  fogFar: { value: 200 },
  fogColor: { value: [0.1, 0.1, 0.15] },
  shadowSoftness: { value: 0.1 },
};

export const particleDefaultUniforms = {
  time: { value: 0 },
  deltaTime: { value: 0.016 },
  gravity: { value: [0, -0.1, 0] },
  drag: { value: 0.98 },
  colorStart: { value: [0.0, 1.0, 0.255] },
  colorEnd: { value: [0.0, 0.851, 1.0] },
  alphaEasing: { value: 2.0 },
  softness: { value: 1.0 },
};

// Legacy exports for backward compatibility
export const nanoBotVertexShader = nanobotVertexShader;
export const nanoBotFragmentShader = nanobotFragmentShader;

export const orbitalRingVertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;

  uniform float time;
  uniform float rotation;

  void main() {
    vUv = uv;
    vPosition = position;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const orbitalRingFragmentShader = `
  varying vec2 vUv;
  varying vec3 vPosition;

  uniform float time;
  uniform vec3 color;
  uniform float opacity;
  uniform float energy;

  void main() {
    float angle = atan(vPosition.y, vPosition.x);
    float segments = sin(angle * 8.0 + time * 2.0) * 0.5 + 0.5;
    float flow = sin(angle * 3.0 - time * 4.0) * 0.5 + 0.5;
    float packets = smoothstep(0.9, 1.0, sin(angle * 20.0 - time * 10.0));

    vec3 finalColor = color * (segments * 0.5 + 0.5);
    finalColor += color * flow * 0.3;
    finalColor += vec3(1.0, 1.0, 1.0) * packets * energy;

    float alpha = opacity * (segments * 0.3 + 0.7);

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

export const connectionLineVertexShader = `
  varying vec2 vUv;
  varying float vProgress;

  attribute float progress;

  void main() {
    vUv = uv;
    vProgress = progress;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const connectionLineFragmentShader = `
  varying vec2 vUv;
  varying float vProgress;

  uniform float time;
  uniform vec3 color;
  uniform float opacity;

  void main() {
    float flow = sin(vProgress * 10.0 - time * 5.0) * 0.5 + 0.5;
    float packets = smoothstep(0.8, 1.0, sin(vProgress * 30.0 - time * 15.0));

    vec3 finalColor = color * flow;
    finalColor += vec3(1.0, 1.0, 1.0) * packets * 0.5;

    float edgeFade = smoothstep(0.0, 0.1, vProgress) * smoothstep(1.0, 0.9, vProgress);

    gl_FragColor = vec4(finalColor, opacity * edgeFade * (flow * 0.5 + 0.5));
  }
`;

export const replicationVertexShader = `
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec2 vUv;

  uniform float time;
  uniform float phase;

  void main() {
    vPosition = position;
    vNormal = normal;
    vUv = uv;

    vec3 pos = position;

    if (phase < 1.0) {
      float spiralPhase = phase;
      float angle = spiralPhase * 3.14159 * 4.0;
      float radius = spiralPhase * 2.0;
      pos += vec3(cos(angle) * radius, sin(angle) * radius, spiralPhase * 3.0);
    } else {
      float matPhase = phase - 1.0;
      float scale = 1.0 - matPhase;
      pos += normal * scale * 0.5;
    }

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

export const replicationFragmentShader = `
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec2 vUv;

  uniform float time;
  uniform float phase;
  uniform vec3 color;

  void main() {
    vec3 finalColor = color;
    float alpha = 1.0;

    if (phase < 1.0) {
      float energy = sin(length(vPosition) * 10.0 - time * 10.0) * 0.5 + 0.5;
      finalColor = mix(color, vec3(1.0, 1.0, 1.0), energy * phase);
      alpha = 0.5 + energy * 0.5;
    } else {
      float matPhase = phase - 1.0;
      float crystal = sin(vPosition.x * 20.0) * cos(vPosition.y * 20.0) * sin(vPosition.z * 20.0);
      crystal = crystal * 0.5 + 0.5;
      finalColor = mix(vec3(1.0, 1.0, 1.0), color, matPhase);
      finalColor += vec3(0.5, 0.8, 1.0) * crystal * (1.0 - matPhase);
      alpha = matPhase;
    }

    gl_FragColor = vec4(finalColor, alpha);
  }
`;
