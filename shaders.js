// ============================================================================
// Shader Programs for WebGL Magic Forest
// ============================================================================

// ==================== MAIN FRAGMENT SHADER ====================
const FRAGMENT_SHADER = `
#version 300 es
precision highp float;

// Varyings from vertex shader
in vec3 v_worldPos;
in vec3 v_normal;
in vec2 v_uv;
in vec4 v_lightSpacePos;

// Uniforms
uniform vec3 u_cameraPos;
uniform vec3 u_lightPos;
uniform vec3 u_lightColor;
uniform float u_lightIntensity;
uniform vec3 u_ambientColor;
uniform vec3 u_diffuseColor;
uniform vec3 u_specularColor;
uniform float u_shininess;
uniform float u_time;
uniform int u_season;        // 0: spring, 1: summer, 2: autumn, 3: winter
uniform bool u_isNight;

// Shadow mapping
uniform sampler2D u_shadowMap;
uniform bool u_useShadows;

// Ray tracing for water reflection
uniform bool u_isWater;

// Output
out vec4 fragColor;

// ==================== SHADOW CALCULATION ====================

float calculateShadow(vec4 lightSpacePos) {
    // Perspective divide
    vec3 projCoords = lightSpacePos.xyz / lightSpacePos.w;

    // Transform to [0,1] range
    projCoords = projCoords * 0.5 + 0.5;

    // Bounds check
    if (projCoords.x < 0.0 || projCoords.x > 1.0 || 
        projCoords.y < 0.0 || projCoords.y > 1.0 ||
        projCoords.z < 0.0 || projCoords.z > 1.0) {
        return 0.0;
    }

    // PCF (Percentage Closer Filtering) for soft shadows
    float shadow = 0.0;
    vec2 texelSize = vec2(1.0) / vec2(textureSize(u_shadowMap, 0));
    float bias = 0.005;
    float currentDepth = projCoords.z;

    for (int x = -1; x <= 1; x++) {
        for (int y = -1; y <= 1; y++) {
            vec2 offset = vec2(float(x), float(y)) * texelSize;
            float pcfDepth = texture(u_shadowMap, projCoords.xy + offset).r;
            shadow += (currentDepth - bias > pcfDepth) ? 1.0 : 0.0;
        }
    }
    shadow /= 9.0;

    return shadow;
}

// ==================== BLINN-PHONG LIGHTING ====================

vec3 calculateBlinnPhong(vec3 normal, vec3 viewDir, vec3 lightDir, float shadow) {
    // Normalize vectors
    normal = normalize(normal);
    lightDir = normalize(lightDir);
    viewDir = normalize(viewDir);

    // Half vector for Blinn-Phong
    vec3 halfDir = normalize(lightDir + viewDir);

    // Diffuse component
    float diff = max(dot(normal, lightDir), 0.0);

    // Specular component
    float spec = pow(max(dot(normal, halfDir), 0.0), u_shininess);

    // Ambient, Diffuse, Specular
    vec3 ambient = u_ambientColor;
    vec3 diffuse = u_diffuseColor * diff * u_lightColor * u_lightIntensity;
    vec3 specular = u_specularColor * spec * u_lightColor * u_lightIntensity;

    // Apply shadow
    diffuse *= (1.0 - shadow);
    specular *= (1.0 - shadow);

    // Night mode adjustments
    if (u_isNight) {
        ambient *= 0.2;
        diffuse *= 0.3;
        specular *= 0.1;
    }

    return ambient + diffuse + specular;
}

// ==================== RAY-TRACED REFLECTION (Simplified) ====================

vec3 calculateWaterReflection(vec3 viewDir, vec3 normal) {
    // Simplified ray-traced reflection for water surface
    // Instead of full ray tracing, we use environment reflection with procedural sky

    vec3 reflectDir = reflect(-viewDir, normalize(normal));

    // Procedural sky gradient
    float y = reflectDir.y;
    vec3 skyColor = mix(
        vec3(0.5, 0.7, 0.9),  // Horizon
        vec3(0.1, 0.2, 0.5),  // Zenith
        clamp(y, 0.0, 1.0)
    );

    // Night sky
    if (u_isNight) {
        skyColor = mix(
            vec3(0.05, 0.05, 0.15),
            vec3(0.0, 0.0, 0.05),
            clamp(y, 0.0, 1.0)
        );
    }

    // Water wave effect
    float wave = sin(v_worldPos.x * 10.0 + u_time) * sin(v_worldPos.z * 10.0 + u_time * 0.8);
    vec3 waterColor = vec3(0.0, 0.3, 0.6) + wave * 0.1;

    // Fresnel effect
    float fresnel = pow(1.0 - max(dot(normalize(normal), viewDir), 0.0), 3.0);

    return mix(waterColor, skyColor, fresnel * 0.6);
}

// ==================== SEASON COLORS ====================

vec3 getSeasonColor(vec3 baseColor) {
    vec3 seasonColor = baseColor;

    if (u_season == 0) {  // Spring - fresh green
        seasonColor = mix(baseColor, vec3(0.4, 0.8, 0.4), 0.3);
    } else if (u_season == 1) {  // Summer - deep green
        seasonColor = mix(baseColor, vec3(0.2, 0.6, 0.2), 0.2);
    } else if (u_season == 2) {  // Autumn - yellow/orange
        float autumnMix = sin(v_worldPos.x * 0.5) * 0.5 + 0.5;
        vec3 autumnColor = mix(vec3(0.9, 0.6, 0.1), vec3(0.8, 0.3, 0.1), autumnMix);
        seasonColor = mix(baseColor, autumnColor, 0.6);
    } else if (u_season == 3) {  // Winter - snow/gray
        seasonColor = mix(baseColor, vec3(0.9, 0.95, 1.0), 0.7);
    }

    return seasonColor;
}

// ==================== MAIN FUNCTION ====================

void main() {
    vec3 normal = normalize(v_normal);
    vec3 viewDir = normalize(u_cameraPos - v_worldPos);
    vec3 lightDir = normalize(u_lightPos - v_worldPos);

    // Calculate shadow
    float shadow = 0.0;
    if (u_useShadows) {
        shadow = calculateShadow(v_lightSpacePos);
    }

    // Apply season colors
    vec3 color = getSeasonColor(u_diffuseColor);

    // Water surface with ray-traced reflection
    if (u_isWater) {
        color = calculateWaterReflection(viewDir, normal);
        // Add Blinn-Phong for water
        vec3 bp = calculateBlinnPhong(normal, viewDir, lightDir, shadow);
        color = mix(color, bp, 0.3);
    } else {
        // Standard Blinn-Phong
        color = calculateBlinnPhong(normal, viewDir, lightDir, shadow);
    }

    // Snow effect in winter at high altitudes
    if (u_season == 3 && v_worldPos.y > 2.0) {
        color = mix(color, vec3(0.95, 0.98, 1.0), 0.5);
    }

    // Gamma correction
    color = pow(color, vec3(1.0 / 2.2));

    fragColor = vec4(color, 1.0);
}
`;

// ==================== VERTEX SHADER ====================
const VERTEX_SHADER = `
#version 300 es

// Attributes
in vec3 a_position;
in vec3 a_normal;
in vec2 a_uv;

// Uniforms - Transformation matrices
uniform mat4 u_modelMatrix;
uniform mat4 u_viewMatrix;
uniform mat4 u_projectionMatrix;
uniform mat4 u_normalMatrix;
uniform mat4 u_lightSpaceMatrix;  // For shadow mapping

// Varyings passed to fragment shader
out vec3 v_worldPos;
out vec3 v_normal;
out vec2 v_uv;
out vec4 v_lightSpacePos;

void main() {
    // World position
    vec4 worldPos = u_modelMatrix * vec4(a_position, 1.0);
    v_worldPos = worldPos.xyz;

    // Normal transformation
    v_normal = mat3(u_normalMatrix) * a_normal;

    // UV coordinates
    v_uv = a_uv;

    // Light space position for shadow mapping
    v_lightSpacePos = u_lightSpaceMatrix * worldPos;

    // Final position
    gl_Position = u_projectionMatrix * u_viewMatrix * worldPos;
}
`;

// ==================== SHADOW MAPPING SHADERS ====================

const SHADOW_VERTEX_SHADER = `
#version 300 es

in vec3 a_position;

uniform mat4 u_lightSpaceMatrix;
uniform mat4 u_modelMatrix;

void main() {
    gl_Position = u_lightSpaceMatrix * u_modelMatrix * vec4(a_position, 1.0);
}
`;

const SHADOW_FRAGMENT_SHADER = `
#version 300 es
precision highp float;

out vec4 fragColor;

void main() {
    // Write depth to shadow map
    fragColor = vec4(gl_FragCoord.z, 0.0, 0.0, 1.0);
}
`;

// Sky shader (screen quad) - LEGACY (kept for compatibility)
const SKY_VERTEX_SHADER = `
#version 300 es

in vec3 position;

out vec3 vRayDir;

uniform mat4 uInvProjection;
uniform mat4 uInvView;

void main(void) {
    gl_Position = vec4(position, 1.0);
    
    vec4 ray = uInvProjection * vec4(position.xy, 1.0, 1.0);
    ray = uInvView * vec4(ray.xy, 1.0, 0.0);
    vRayDir = normalize(ray.xyz);
}
`;

const SKY_FRAGMENT_SHADER = `
#version 300 es
precision highp float;

in vec3 vRayDir;

out vec4 outColor;

uniform vec3 uSunDirection;
uniform vec3 uSunColor;

vec3 getSkyColor(vec3 dir) {
    vec3 sunColor = uSunColor;
    vec3 skyColor = mix(vec3(0.7, 0.7, 0.8), vec3(1.0, 0.8, 0.6), 0.5);
    
    float sunAmount = pow(max(dot(dir, uSunDirection), 0.0), 128.0);
    
    return mix(skyColor, sunColor, sunAmount);
}

void main(void) {
    vec3 color = getSkyColor(normalize(vRayDir));
    outColor = vec4(color, 1.0);
}
`;

// ============================================================================
// Shader Helper Functions
// ============================================================================

function compileShader(gl, source, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(`Shader compilation error: ${gl.getShaderInfoLog(shader)}`);
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function createProgram(gl, vertexSource, fragmentSource) {
    const vertexShader = compileShader(gl, vertexSource, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(gl, fragmentSource, gl.FRAGMENT_SHADER);
    
    if (!vertexShader || !fragmentShader) return null;
    
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(`Program linking error: ${gl.getProgramInfoLog(program)}`);
        gl.deleteProgram(program);
        return null;
    }
    
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    
    return program;
}

function getUniformLocation(gl, program, name) {
    return gl.getUniformLocation(program, name);
}

function getAttribLocation(gl, program, name) {
    return gl.getAttribLocation(program, name);
}
