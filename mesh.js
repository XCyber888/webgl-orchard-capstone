/**
 * mesh.js - Procedural Mesh Generators
 * Sphere, Torus, Terrain, Cylinder, Cone, Plane meshes
 * 
 * Capstone Project: Sehrli Meyvə Bağı
 * Author: [Student Name]
 * Date: 2026
 */

class Mesh {
    constructor() {
        this.vertices = [];     // [x, y, z, x, y, z, ...]
        this.normals = [];      // [nx, ny, nz, ...]
        this.uvs = [];          // [u, v, u, v, ...]
        this.indices = [];      // [i0, i1, i2, ...]
        this.tangents = [];     // Optional tangents for normal mapping
    }

    /**
     * Create WebGL buffers from mesh data
     */
    createBuffers(gl) {
        const buffers = {};

        // Vertex buffer
        buffers.vertex = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertex);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);

        // Normal buffer
        buffers.normal = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.normals), gl.STATIC_DRAW);

        // UV buffer
        buffers.uv = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.uv);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.uvs), gl.STATIC_DRAW);

        // Index buffer
        buffers.index = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.index);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);

        buffers.indexCount = this.indices.length;
        buffers.vertexCount = this.vertices.length / 3;

        return buffers;
    }

    /**
     * Compute vertex normals for smooth shading
     */
    computeNormals() {
        // Reset normals
        this.normals = new Array(this.vertices.length).fill(0);

        // Calculate face normals and accumulate to vertices
        for (let i = 0; i < this.indices.length; i += 3) {
            const i0 = this.indices[i] * 3;
            const i1 = this.indices[i + 1] * 3;
            const i2 = this.indices[i + 2] * 3;

            const v0 = new Vec3(this.vertices[i0], this.vertices[i0 + 1], this.vertices[i0 + 2]);
            const v1 = new Vec3(this.vertices[i1], this.vertices[i1 + 1], this.vertices[i1 + 2]);
            const v2 = new Vec3(this.vertices[i2], this.vertices[i2 + 1], this.vertices[i2 + 2]);

            const edge1 = Vec3.sub(v1, v0);
            const edge2 = Vec3.sub(v2, v0);
            const normal = Vec3.cross(edge1, edge2).normalize();

            // Add to all three vertices
            for (const idx of [i0, i1, i2]) {
                this.normals[idx] += normal.x;
                this.normals[idx + 1] += normal.y;
                this.normals[idx + 2] += normal.z;
            }
        }

        // Normalize all vertex normals
        for (let i = 0; i < this.normals.length; i += 3) {
            const n = new Vec3(this.normals[i], this.normals[i + 1], this.normals[i + 2]).normalize();
            this.normals[i] = n.x;
            this.normals[i + 1] = n.y;
            this.normals[i + 2] = n.z;
        }
    }

    /**
     * Compute tangents for normal mapping (optional)
     */
    computeTangents() {
        // Simplified tangent calculation
        this.tangents = new Array(this.vertices.length).fill(0);
        // Implementation would go here for normal mapping support
    }
}

// ==================== SPHERE MESH ====================

function createSphereMesh(radius = 1, segments = 32, rings = 16) {
    const mesh = new Mesh();

    for (let ring = 0; ring <= rings; ring++) {
        const phi = (Math.PI * ring) / rings;
        const sinPhi = Math.sin(phi);
        const cosPhi = Math.cos(phi);

        for (let seg = 0; seg <= segments; seg++) {
            const theta = (2 * Math.PI * seg) / segments;
            const sinTheta = Math.sin(theta);
            const cosTheta = Math.cos(theta);

            // Position
            const x = radius * sinPhi * cosTheta;
            const y = radius * cosPhi;
            const z = radius * sinPhi * sinTheta;

            mesh.vertices.push(x, y, z);

            // Normal (unit sphere)
            mesh.normals.push(sinPhi * cosTheta, cosPhi, sinPhi * sinTheta);

            // UV
            mesh.uvs.push(seg / segments, ring / rings);
        }
    }

    // Indices
    for (let ring = 0; ring < rings; ring++) {
        for (let seg = 0; seg < segments; seg++) {
            const current = ring * (segments + 1) + seg;
            const next = current + segments + 1;

            mesh.indices.push(current, next, current + 1);
            mesh.indices.push(next, next + 1, current + 1);
        }
    }

    return mesh;
}

// ==================== TORUS MESH ====================

function createTorusMesh(majorRadius = 1, minorRadius = 0.4, majorSegments = 32, minorSegments = 16) {
    const mesh = new Mesh();

    for (let i = 0; i <= majorSegments; i++) {
        const u = (i / majorSegments) * Math.PI * 2;
        const cosU = Math.cos(u);
        const sinU = Math.sin(u);

        for (let j = 0; j <= minorSegments; j++) {
            const v = (j / minorSegments) * Math.PI * 2;
            const cosV = Math.cos(v);
            const sinV = Math.sin(v);

            // Position
            const x = (majorRadius + minorRadius * cosV) * cosU;
            const y = minorRadius * sinV;
            const z = (majorRadius + minorRadius * cosV) * sinU;

            mesh.vertices.push(x, y, z);

            // Normal
            const centerX = majorRadius * cosU;
            const centerZ = majorRadius * sinU;
            const nx = x - centerX;
            const ny = y;
            const nz = z - centerZ;
            const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
            mesh.normals.push(nx / len, ny / len, nz / len);

            // UV
            mesh.uvs.push(i / majorSegments, j / minorSegments);
        }
    }

    // Indices
    for (let i = 0; i < majorSegments; i++) {
        for (let j = 0; j < minorSegments; j++) {
            const a = i * (minorSegments + 1) + j;
            const b = a + minorSegments + 1;

            mesh.indices.push(a, b, a + 1);
            mesh.indices.push(b, b + 1, a + 1);
        }
    }

    return mesh;
}

// ==================== TERRAIN MESH (Procedural Height Map) ====================

function createTerrainMesh(width = 100, depth = 100, subdivisions = 128, heightScale = 10, seed = 42) {
    const mesh = new Mesh();
    const halfWidth = width / 2;
    const halfDepth = depth / 2;

    // Generate vertices with Perlin noise height
    for (let z = 0; z <= subdivisions; z++) {
        for (let x = 0; x <= subdivisions; x++) {
            const u = x / subdivisions;
            const v = z / subdivisions;

            const worldX = u * width - halfWidth;
            const worldZ = v * depth - halfDepth;

            // Procedural height using Perlin noise
            const height = ProceduralMath.perlinNoise(worldX * 0.05, worldZ * 0.05, 4, 0.5, seed) * heightScale;

            mesh.vertices.push(worldX, height, worldZ);
            mesh.uvs.push(u, v);

            // Temporary normal (will be computed properly)
            mesh.normals.push(0, 1, 0);
        }
    }

    // Generate indices
    for (let z = 0; z < subdivisions; z++) {
        for (let x = 0; x < subdivisions; x++) {
            const a = z * (subdivisions + 1) + x;
            const b = a + subdivisions + 1;

            mesh.indices.push(a, b, a + 1);
            mesh.indices.push(b, b + 1, a + 1);
        }
    }

    // Compute proper normals
    mesh.computeNormals();

    return mesh;
}

// ==================== CYLINDER MESH ====================

function createCylinderMesh(radiusTop = 1, radiusBottom = 1, height = 2, segments = 32) {
    const mesh = new Mesh();
    const halfHeight = height / 2;

    // Side surface
    for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        const cosTheta = Math.cos(theta);
        const sinTheta = Math.sin(theta);

        // Bottom vertex
        mesh.vertices.push(radiusBottom * cosTheta, -halfHeight, radiusBottom * sinTheta);
        mesh.normals.push(cosTheta, 0, sinTheta);
        mesh.uvs.push(i / segments, 0);

        // Top vertex
        mesh.vertices.push(radiusTop * cosTheta, halfHeight, radiusTop * sinTheta);
        mesh.normals.push(cosTheta, 0, sinTheta);
        mesh.uvs.push(i / segments, 1);
    }

    // Side indices
    for (let i = 0; i < segments; i++) {
        const base = i * 2;
        mesh.indices.push(base, base + 1, base + 2);
        mesh.indices.push(base + 1, base + 3, base + 2);
    }

    // Bottom cap
    const bottomCenterIdx = mesh.vertices.length / 3;
    mesh.vertices.push(0, -halfHeight, 0);
    mesh.normals.push(0, -1, 0);
    mesh.uvs.push(0.5, 0.5);

    for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        mesh.vertices.push(radiusBottom * Math.cos(theta), -halfHeight, radiusBottom * Math.sin(theta));
        mesh.normals.push(0, -1, 0);
        mesh.uvs.push(Math.cos(theta) * 0.5 + 0.5, Math.sin(theta) * 0.5 + 0.5);
    }

    for (let i = 0; i < segments; i++) {
        mesh.indices.push(bottomCenterIdx, bottomCenterIdx + 1 + i, bottomCenterIdx + 2 + i);
    }

    // Top cap
    const topCenterIdx = mesh.vertices.length / 3;
    mesh.vertices.push(0, halfHeight, 0);
    mesh.normals.push(0, 1, 0);
    mesh.uvs.push(0.5, 0.5);

    for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        mesh.vertices.push(radiusTop * Math.cos(theta), halfHeight, radiusTop * Math.sin(theta));
        mesh.normals.push(0, 1, 0);
        mesh.uvs.push(Math.cos(theta) * 0.5 + 0.5, Math.sin(theta) * 0.5 + 0.5);
    }

    for (let i = 0; i < segments; i++) {
        mesh.indices.push(topCenterIdx, topCenterIdx + 2 + i, topCenterIdx + 1 + i);
    }

    return mesh;
}

// ==================== CONE MESH ====================

function createConeMesh(radius = 1, height = 2, segments = 32) {
    const mesh = new Mesh();
    const halfHeight = height / 2;
    const slantHeight = Math.sqrt(radius * radius + height * height);
    const cosSlant = height / slantHeight;
    const sinSlant = radius / slantHeight;

    // Apex
    mesh.vertices.push(0, halfHeight, 0);
    mesh.normals.push(0, 1, 0);
    mesh.uvs.push(0.5, 1);

    // Side surface
    for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        const cosTheta = Math.cos(theta);
        const sinTheta = Math.sin(theta);

        mesh.vertices.push(radius * cosTheta, -halfHeight, radius * sinTheta);

        // Cone slanted normal
        const nx = cosTheta * cosSlant;
        const ny = sinSlant;
        const nz = sinTheta * cosSlant;
        const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
        mesh.normals.push(nx / len, ny / len, nz / len);

        mesh.uvs.push(i / segments, 0);
    }

    // Side indices
    for (let i = 0; i < segments; i++) {
        mesh.indices.push(0, i + 1, i + 2);
    }

    // Bottom cap
    const bottomCenterIdx = mesh.vertices.length / 3;
    mesh.vertices.push(0, -halfHeight, 0);
    mesh.normals.push(0, -1, 0);
    mesh.uvs.push(0.5, 0.5);

    for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        mesh.vertices.push(radius * Math.cos(theta), -halfHeight, radius * Math.sin(theta));
        mesh.normals.push(0, -1, 0);
        mesh.uvs.push(Math.cos(theta) * 0.5 + 0.5, Math.sin(theta) * 0.5 + 0.5);
    }

    for (let i = 0; i < segments; i++) {
        mesh.indices.push(bottomCenterIdx, bottomCenterIdx + 2 + i, bottomCenterIdx + 1 + i);
    }

    return mesh;
}

// ==================== PLANE MESH ====================

function createPlaneMesh(width = 1, depth = 1, subdivisionsX = 1, subdivisionsZ = 1) {
    const mesh = new Mesh();
    const halfWidth = width / 2;
    const halfDepth = depth / 2;

    for (let z = 0; z <= subdivisionsZ; z++) {
        for (let x = 0; x <= subdivisionsX; x++) {
            const u = x / subdivisionsX;
            const v = z / subdivisionsZ;

            mesh.vertices.push(u * width - halfWidth, 0, v * depth - halfDepth);
            mesh.normals.push(0, 1, 0);
            mesh.uvs.push(u, v);
        }
    }

    for (let z = 0; z < subdivisionsZ; z++) {
        for (let x = 0; x < subdivisionsX; x++) {
            const a = z * (subdivisionsX + 1) + x;
            const b = a + subdivisionsX + 1;

            mesh.indices.push(a, b, a + 1);
            mesh.indices.push(b, b + 1, a + 1);
        }
    }

    return mesh;
}

// ==================== TREE MESH (Composite) ====================

function createTreeMesh(trunkHeight = 3, trunkRadius = 0.3, crownRadius = 1.5, seed = 123) {
    const mesh = new Mesh();

    // Trunk (cylinder)
    const trunk = createCylinderMesh(trunkRadius, trunkRadius * 0.8, trunkHeight, 12);

    // Foliage (cones)
    const crown = createConeMesh(crownRadius, crownRadius * 1.5, 16);

    // Add trunk
    const trunkOffset = mesh.vertices.length / 3;
    for (let i = 0; i < trunk.vertices.length; i += 3) {
        mesh.vertices.push(trunk.vertices[i], trunk.vertices[i + 1] + trunkHeight / 2, trunk.vertices[i + 2]);
        mesh.normals.push(trunk.normals[i], trunk.normals[i + 1], trunk.normals[i + 2]);
    }
    for (let i = 0; i < trunk.uvs.length; i += 2) {
        mesh.uvs.push(trunk.uvs[i], trunk.uvs[i + 1]);
    }
    for (const idx of trunk.indices) {
        mesh.indices.push(idx + trunkOffset);
    }

    // Add foliage
    const crownOffset = mesh.vertices.length / 3;
    for (let i = 0; i < crown.vertices.length; i += 3) {
        mesh.vertices.push(
            crown.vertices[i], 
            crown.vertices[i + 1] + trunkHeight, 
            crown.vertices[i + 2]
        );
        mesh.normals.push(crown.normals[i], crown.normals[i + 1], crown.normals[i + 2]);
    }
    for (let i = 0; i < crown.uvs.length; i += 2) {
        mesh.uvs.push(crown.uvs[i], crown.uvs[i + 1]);
    }
    for (const idx of crown.indices) {
        mesh.indices.push(idx + crownOffset);
    }

    return mesh;
}

// ==================== FRUIT MESH ====================

function createFruitMesh(radius = 0.15, type = 'apple') {
    let mesh;

    switch(type) {
        case 'apple':
            mesh = createSphereMesh(radius, 16, 12);
            break;
        case 'pear':
            // Pear shape (elongated sphere)
            mesh = createSphereMesh(radius, 16, 12);
            for (let i = 1; i < mesh.vertices.length; i += 3) {
                mesh.vertices[i] *= 1.3;
            }
            mesh.computeNormals();
            break;
        case 'orange':
            mesh = createSphereMesh(radius * 1.1, 16, 12);
            break;
        default:
            mesh = createSphereMesh(radius, 16, 12);
    }

    return mesh;
}

// ==================== SPLINE VISUALIZATION MESH ====================

function createSplinePathMesh(points, segments = 100, radius = 0.05) {
    const mesh = new Mesh();
    const spline = new CatmullRomSpline(points, 0.5);

    // Create tube along spline
    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const point = spline.getPoint(t);
        const tangent = spline.getTangent(t);

        // Create ring around point
        const up = Math.abs(tangent.y) > 0.9 ? new Vec3(0, 0, 1) : new Vec3(0, 1, 0);
        const right = Vec3.cross(tangent, up).normalize();
        const forward = Vec3.cross(right, tangent).normalize();

        for (let j = 0; j <= 8; j++) {
            const angle = (j / 8) * Math.PI * 2;
            const x = point.x + (right.x * Math.cos(angle) + forward.x * Math.sin(angle)) * radius;
            const y = point.y + (right.y * Math.cos(angle) + forward.y * Math.sin(angle)) * radius;
            const z = point.z + (right.z * Math.cos(angle) + forward.z * Math.sin(angle)) * radius;

            mesh.vertices.push(x, y, z);
            mesh.normals.push(
                right.x * Math.cos(angle) + forward.x * Math.sin(angle),
                right.y * Math.cos(angle) + forward.y * Math.sin(angle),
                right.z * Math.cos(angle) + forward.z * Math.sin(angle)
            );
            mesh.uvs.push(j / 8, t);
        }
    }

    // Indices for tube
    for (let i = 0; i < segments; i++) {
        for (let j = 0; j < 8; j++) {
            const a = i * 9 + j;
            const b = a + 9;
            mesh.indices.push(a, b, a + 1);
            mesh.indices.push(b, b + 1, a + 1);
        }
    }

    return mesh;
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        Mesh,
        createSphereMesh,
        createTorusMesh,
        createTerrainMesh,
        createCylinderMesh,
        createConeMesh,
        createPlaneMesh,
        createTreeMesh,
        createFruitMesh,
        createSplinePathMesh
    };
}