// ============================================================================
// Procedural Mesh Generators for WebGL Orchard
// ============================================================================

class Mesh {
    constructor(vertices, indices, normals, texCoords = null) {
        this.vertices = vertices;
        this.indices = indices;
        this.normals = normals;
        this.texCoords = texCoords;
        this.vertexCount = vertices.length / 3;
        this.indexCount = indices.length;
    }
    
    getVertexArray() {
        return new Float32Array(this.vertices);
    }
    
    getIndexArray() {
        return new Uint32Array(this.indices);
    }
    
    getNormalArray() {
        return new Float32Array(this.normals);
    }
    
    getTexCoordArray() {
        if (!this.texCoords) return null;
        return new Float32Array(this.texCoords);
    }
}

// ============================================================================
// Sphere Mesh (for fruits, sun)
// ============================================================================

function createSphereMesh(radius, segments, rings) {
    const vertices = [];
    const indices = [];
    const normals = [];
    const texCoords = [];
    
    for (let ring = 0; ring <= rings; ring++) {
        const theta = (ring / rings) * Math.PI;
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);
        
        for (let seg = 0; seg <= segments; seg++) {
            const phi = (seg / segments) * 2 * Math.PI;
            const sinPhi = Math.sin(phi);
            const cosPhi = Math.cos(phi);
            
            const x = radius * sinTheta * cosPhi;
            const y = radius * cosTheta;
            const z = radius * sinTheta * sinPhi;
            
            vertices.push(x, y, z);
            
            const nx = sinTheta * cosPhi;
            const ny = cosTheta;
            const nz = sinTheta * sinPhi;
            normals.push(nx, ny, nz);
            
            texCoords.push(seg / segments, ring / rings);
        }
    }
    
    for (let ring = 0; ring < rings; ring++) {
        for (let seg = 0; seg < segments; seg++) {
            const a = ring * (segments + 1) + seg;
            const b = a + 1;
            const c = a + (segments + 1);
            const d = c + 1;
            
            indices.push(a, c, b);
            indices.push(b, c, d);
        }
    }
    
    return new Mesh(vertices, indices, normals, texCoords);
}

// ============================================================================
// Torus Mesh (decorative)
// ============================================================================

function createTorusMesh(majorRadius, minorRadius, majorSegments, minorSegments) {
    const vertices = [];
    const indices = [];
    const normals = [];
    const texCoords = [];
    
    for (let major = 0; major <= majorSegments; major++) {
        const theta = (major / majorSegments) * 2 * Math.PI;
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);
        
        for (let minor = 0; minor <= minorSegments; minor++) {
            const phi = (minor / minorSegments) * 2 * Math.PI;
            const sinPhi = Math.sin(phi);
            const cosPhi = Math.cos(phi);
            
            const x = (majorRadius + minorRadius * cosPhi) * cosTheta;
            const y = minorRadius * sinPhi;
            const z = (majorRadius + minorRadius * cosPhi) * sinTheta;
            
            vertices.push(x, y, z);
            
            const nx = cosPhi * cosTheta;
            const ny = sinPhi;
            const nz = cosPhi * sinTheta;
            normals.push(nx, ny, nz);
            
            texCoords.push(major / majorSegments, minor / minorSegments);
        }
    }
    
    for (let major = 0; major < majorSegments; major++) {
        for (let minor = 0; minor < minorSegments; minor++) {
            const a = major * (minorSegments + 1) + minor;
            const b = a + 1;
            const c = a + (minorSegments + 1);
            const d = c + 1;
            
            indices.push(a, c, b);
            indices.push(b, c, d);
        }
    }
    
    return new Mesh(vertices, indices, normals, texCoords);
}

// ============================================================================
// Cylinder Mesh (tree trunks)
// ============================================================================

function createCylinderMesh(radius, height, segments, rings) {
    const vertices = [];
    const indices = [];
    const normals = [];
    const texCoords = [];
    
    // Side surface
    for (let ring = 0; ring <= rings; ring++) {
        const y = (ring / rings) * height - height / 2;
        
        for (let seg = 0; seg <= segments; seg++) {
            const angle = (seg / segments) * 2 * Math.PI;
            const x = radius * Math.cos(angle);
            const z = radius * Math.sin(angle);
            
            vertices.push(x, y, z);
            
            const nx = Math.cos(angle);
            const nz = Math.sin(angle);
            normals.push(nx, 0, nz);
            
            texCoords.push(seg / segments, ring / rings);
        }
    }
    
    const baseVertex = vertices.length / 3;
    
    // Top cap
    vertices.push(0, height / 2, 0);
    normals.push(0, 1, 0);
    texCoords.push(0.5, 0.5);
    
    for (let seg = 0; seg <= segments; seg++) {
        const angle = (seg / segments) * 2 * Math.PI;
        const x = radius * Math.cos(angle);
        const z = radius * Math.sin(angle);
        vertices.push(x, height / 2, z);
        normals.push(0, 1, 0);
        texCoords.push(0.5 + 0.5 * Math.cos(angle), 0.5 + 0.5 * Math.sin(angle));
    }
    
    // Bottom cap
    const bottomCenterIdx = vertices.length / 3;
    vertices.push(0, -height / 2, 0);
    normals.push(0, -1, 0);
    texCoords.push(0.5, 0.5);
    
    for (let seg = 0; seg <= segments; seg++) {
        const angle = (seg / segments) * 2 * Math.PI;
        const x = radius * Math.cos(angle);
        const z = radius * Math.sin(angle);
        vertices.push(x, -height / 2, z);
        normals.push(0, -1, 0);
        texCoords.push(0.5 + 0.5 * Math.cos(angle), 0.5 + 0.5 * Math.sin(angle));
    }
    
    // Side indices
    for (let ring = 0; ring < rings; ring++) {
        for (let seg = 0; seg < segments; seg++) {
            const a = ring * (segments + 1) + seg;
            const b = a + 1;
            const c = a + (segments + 1);
            const d = c + 1;
            
            indices.push(a, b, c);
            indices.push(b, d, c);
        }
    }
    
    // Top cap indices
    const topCenterIdx = baseVertex;
    for (let seg = 0; seg < segments; seg++) {
        indices.push(topCenterIdx, topCenterIdx + seg + 1, topCenterIdx + seg + 2);
    }
    
    // Bottom cap indices
    for (let seg = 0; seg < segments; seg++) {
        indices.push(bottomCenterIdx, bottomCenterIdx + seg + 2, bottomCenterIdx + seg + 1);
    }
    
    return new Mesh(vertices, indices, normals, texCoords);
}

// ============================================================================
// Cone Mesh (tree canopy)
// ============================================================================

function createConeMesh(radius, height, segments) {
    const vertices = [];
    const indices = [];
    const normals = [];
    const texCoords = [];
    
    // Apex
    vertices.push(0, height / 2, 0);
    normals.push(0, 1, 0);
    texCoords.push(0.5, 0);
    
    // Base circle
    for (let seg = 0; seg <= segments; seg++) {
        const angle = (seg / segments) * 2 * Math.PI;
        const x = radius * Math.cos(angle);
        const z = radius * Math.sin(angle);
        vertices.push(x, -height / 2, z);
        
        const nx = Math.cos(angle);
        const nz = Math.sin(angle);
        const len = Math.sqrt(nx * nx + nz * nz + (height / radius) * (height / radius));
        normals.push(nx / len, 0, nz / len);
        
        texCoords.push(0.5 + 0.5 * Math.cos(angle), seg / segments);
    }
    
    // Base center
    const baseCenterIdx = vertices.length / 3;
    vertices.push(0, -height / 2, 0);
    normals.push(0, -1, 0);
    texCoords.push(0.5, 0.5);
    
    // Side indices
    for (let seg = 0; seg < segments; seg++) {
        indices.push(0, seg + 2, seg + 1);
    }
    
    // Base indices
    for (let seg = 0; seg < segments; seg++) {
        indices.push(baseCenterIdx, seg + 2, seg + 1);
    }
    
    return new Mesh(vertices, indices, normals, texCoords);
}

// ============================================================================
// Terrain Mesh (ground with height map)
// ============================================================================

function createTerrainMesh(width, depth, resolution) {
    const vertices = [];
    const indices = [];
    const normals = [];
    const texCoords = [];
    
    const xStep = width / resolution;
    const zStep = depth / resolution;
    
    // Generate vertices with height variation
    for (let z = 0; z <= resolution; z++) {
        for (let x = 0; x <= resolution; x++) {
            const px = -width / 2 + x * xStep;
            const pz = -depth / 2 + z * zStep;
            
            // Procedural height using Perlin-like noise (sine/cosine waves)
            const h = Math.sin(px * 0.1) * 0.3 + Math.cos(pz * 0.08) * 0.2 +
                      Math.sin(px * 0.05 + pz * 0.07) * 0.15;
            
            vertices.push(px, h, pz);
            normals.push(0, 1, 0); // Will be recalculated
            texCoords.push(x / resolution, z / resolution);
        }
    }
    
    // Generate indices
    for (let z = 0; z < resolution; z++) {
        for (let x = 0; x < resolution; x++) {
            const a = z * (resolution + 1) + x;
            const b = a + 1;
            const c = a + (resolution + 1);
            const d = c + 1;
            
            indices.push(a, c, b);
            indices.push(b, c, d);
        }
    }
    
    // Recalculate normals
    const recalcNormals = new Array(vertices.length / 3 * 3).fill(0);
    for (let i = 0; i < indices.length; i += 3) {
        const i0 = indices[i];
        const i1 = indices[i + 1];
        const i2 = indices[i + 2];
        
        const v0 = [vertices[i0*3], vertices[i0*3+1], vertices[i0*3+2]];
        const v1 = [vertices[i1*3], vertices[i1*3+1], vertices[i1*3+2]];
        const v2 = [vertices[i2*3], vertices[i2*3+1], vertices[i2*3+2]];
        
        const e1 = [v1[0]-v0[0], v1[1]-v0[1], v1[2]-v0[2]];
        const e2 = [v2[0]-v0[0], v2[1]-v0[1], v2[2]-v0[2]];
        
        const n = [
            e1[1]*e2[2] - e1[2]*e2[1],
            e1[2]*e2[0] - e1[0]*e2[2],
            e1[0]*e2[1] - e1[1]*e2[0]
        ];
        
        recalcNormals[i0*3] += n[0];
        recalcNormals[i0*3+1] += n[1];
        recalcNormals[i0*3+2] += n[2];
        recalcNormals[i1*3] += n[0];
        recalcNormals[i1*3+1] += n[1];
        recalcNormals[i1*3+2] += n[2];
        recalcNormals[i2*3] += n[0];
        recalcNormals[i2*3+1] += n[1];
        recalcNormals[i2*3+2] += n[2];
    }
    
    for (let i = 0; i < recalcNormals.length; i += 3) {
        const len = Math.sqrt(recalcNormals[i]**2 + recalcNormals[i+1]**2 + recalcNormals[i+2]**2);
        if (len > 0) {
            normals[i] = recalcNormals[i] / len;
            normals[i+1] = recalcNormals[i+1] / len;
            normals[i+2] = recalcNormals[i+2] / len;
        }
    }
    
    return new Mesh(vertices, indices, normals, texCoords);
}

// ============================================================================
// Plane Mesh (water surface, sky)
// ============================================================================

function createPlaneMesh(width, depth, segments) {
    const vertices = [];
    const indices = [];
    const normals = [];
    const texCoords = [];
    
    const xStep = width / segments;
    const zStep = depth / segments;
    
    for (let z = 0; z <= segments; z++) {
        for (let x = 0; x <= segments; x++) {
            const px = -width / 2 + x * xStep;
            const pz = -depth / 2 + z * zStep;
            
            vertices.push(px, 0, pz);
            normals.push(0, 1, 0);
            texCoords.push(x / segments, z / segments);
        }
    }
    
    for (let z = 0; z < segments; z++) {
        for (let x = 0; x < segments; x++) {
            const a = z * (segments + 1) + x;
            const b = a + 1;
            const c = a + (segments + 1);
            const d = c + 1;
            
            indices.push(a, c, b);
            indices.push(b, c, d);
        }
    }
    
    return new Mesh(vertices, indices, normals, texCoords);
}
