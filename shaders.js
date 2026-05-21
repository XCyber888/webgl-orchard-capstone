// ============================================================================
// Shader Programs for WebGL Orchard
// ============================================================================

const VERTEX_SHADER = `
#version 300 es
precision highp float;

in vec3 position;
in vec3 normal;
in vec2 texCoord;

out VS_OUT {
    vec3 fragPos;
    vec3 fragNormal;
    vec2 fragTexCoord;
    vec4 fragPosLightSpace;
} vs_out;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;
uniform mat4 uLightSpaceMatrix;

void main(void) {
    vs_out.fragPos = (uModel * vec4(position, 1.0)).xyz;
    vs_out.fragNormal = normalize((uModel * vec4(normal, 0.0)).xyz);
    vs_out.fragTexCoord = texCoord;
    vs_out.fragPosLightSpace = uLightSpaceMatrix * vec4(vs_out.fragPos, 1.0);
    
    gl_Position = uProjection * uView * vec4(vs_out.fragPos, 1.0);
}
`;

const FRAGMENT_SHADER = `
#version 300 es
precision highp float;

in VS_OUT {
    vec3 fragPos;
    vec3 fragNormal;
    vec2 fragTexCoord;
    vec4 fragPosLightSpace;
} fs_in;

out vec4 outColor;

uniform sampler2D uShadowMap;
uniform vec3 uCameraPos;
uniform vec3 uSunDirection;
uniform vec3 uSunColor;

const float PI = 3.14159265359;

// Material properties
struct Material {
    vec3 albedo;
    float metallic;
    float roughness;
    float ao;
};

// Light structure
struct Light {
    vec3 direction;
    vec3 color;
    float intensity;
};

float shadowCalculation(vec4 fragPosLightSpace)
{
    vec3 projCoords = fragPosLightSpace.xyz / fragPosLightSpace.w;
    projCoords = projCoords * 0.5 + 0.5;
    
    if(projCoords.z > 1.0)
        return 1.0;
    
    float closestDepth = texture(uShadowMap, projCoords.xy).r;
    float currentDepth = projCoords.z;
    
    float bias = 0.005;
    float shadow = currentDepth - bias > closestDepth ? 0.3 : 1.0;
    
    return shadow;
}

vec3 blinnPhong(vec3 normal, vec3 viewDir, vec3 lightDir, vec3 color, vec3 albedo)
{
    float diff = max(dot(normal, lightDir), 0.0);
    
    vec3 halfDir = normalize(viewDir + lightDir);
    float spec = pow(max(dot(normal, halfDir), 0.0), 32.0);
    
    vec3 diffuse = diff * albedo * color;
    vec3 specular = spec * color * 0.5;
    
    return diffuse + specular;
}

void main(void) {
    vec3 normal = normalize(fs_in.fragNormal);
    vec3 viewDir = normalize(uCameraPos - fs_in.fragPos);
    vec3 lightDir = normalize(uSunDirection);
    
    // Material - varied by height and normal
    Material mat;
    mat.albedo = mix(vec3(0.2, 0.6, 0.1), vec3(0.8, 0.5, 0.2), 0.3);
    mat.metallic = 0.0;
    mat.roughness = 0.7;
    mat.ao = 1.0;
    
    float shadow = shadowCalculation(fs_in.fragPosLightSpace);
    
    vec3 lighting = blinnPhong(normal, viewDir, lightDir, uSunColor, mat.albedo);
    
    // Ambient
    vec3 ambient = vec3(0.2) * mat.albedo;
    
    vec3 color = (ambient + lighting * shadow) * mat.ao;
    
    // Fog
    float dist = length(fs_in.fragPos - uCameraPos);
    float fogFactor = exp(-dist * 0.001);
    vec3 fogColor = vec3(0.7, 0.7, 0.8);
    color = mix(fogColor, color, fogFactor);
    
    // Tone mapping
    color = color / (color + vec3(1.0));
    color = pow(color, vec3(1.0/2.2));
    
    outColor = vec4(color, 1.0);
}
`;

// Shadow map shaders
const SHADOW_VERTEX_SHADER = `
#version 300 es
precision highp float;

in vec3 position;

uniform mat4 uLightSpaceMatrix;
uniform mat4 uModel;

void main(void) {
    gl_Position = uLightSpaceMatrix * uModel * vec4(position, 1.0);
}
`;

const SHADOW_FRAGMENT_SHADER = `
#version 300 es
precision highp float;

void main(void) {
    gl_FragDepth = gl_FragCoord.z;
}
`;

// Sky shader (screen quad)
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
