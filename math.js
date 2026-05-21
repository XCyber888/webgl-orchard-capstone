// ============================================================================
// Math Library for WebGL Orchard
// Vec3, Mat4, Quaternion, and Spline functions
// ============================================================================

class Vec3 {
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    
    static add(a, b) {
        return new Vec3(a.x + b.x, a.y + b.y, a.z + b.z);
    }
    
    static sub(a, b) {
        return new Vec3(a.x - b.x, a.y - b.y, a.z - b.z);
    }
    
    static mul(v, s) {
        return new Vec3(v.x * s, v.y * s, v.z * s);
    }
    
    static div(v, s) {
        return Vec3.mul(v, 1 / s);
    }
    
    static dot(a, b) {
        return a.x * b.x + a.y * b.y + a.z * b.z;
    }
    
    static cross(a, b) {
        return new Vec3(
            a.y * b.z - a.z * b.y,
            a.z * b.x - a.x * b.z,
            a.x * b.y - a.y * b.x
        );
    }
    
    static length(v) {
        return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    }
    
    static normalize(v) {
        const len = Vec3.length(v);
        return len > 0 ? Vec3.div(v, len) : new Vec3();
    }
    
    static lerp(a, b, t) {
        return Vec3.add(a, Vec3.mul(Vec3.sub(b, a), t));
    }
    
    toArray() {
        return [this.x, this.y, this.z];
    }
}

class Mat4 {
    constructor(data = null) {
        if (data) {
            this.data = data;
        } else {
            this.data = new Float32Array(16);
            Mat4.identity(this.data);
        }
    }
    
    static identity(m) {
        m[0] = 1; m[1] = 0; m[2] = 0; m[3] = 0;
        m[4] = 0; m[5] = 1; m[6] = 0; m[7] = 0;
        m[8] = 0; m[9] = 0; m[10] = 1; m[11] = 0;
        m[12] = 0; m[13] = 0; m[14] = 0; m[15] = 1;
        return m;
    }
    
    static perspective(fov, aspect, near, far) {
        const f = 1.0 / Math.tan(fov / 2.0);
        const nf = 1.0 / (near - far);
        const m = new Float32Array(16);
        
        m[0] = f / aspect; m[1] = 0; m[2] = 0; m[3] = 0;
        m[4] = 0; m[5] = f; m[6] = 0; m[7] = 0;
        m[8] = 0; m[9] = 0; m[10] = (far + near) * nf; m[11] = -1;
        m[12] = 0; m[13] = 0; m[14] = 2 * far * near * nf; m[15] = 0;
        
        return new Mat4(m);
    }
    
    static lookAt(eye, target, up) {
        const zAxis = Vec3.normalize(Vec3.sub(eye, target));
        const xAxis = Vec3.normalize(Vec3.cross(up, zAxis));
        const yAxis = Vec3.cross(zAxis, xAxis);
        
        const m = new Float32Array(16);
        m[0] = xAxis.x; m[1] = yAxis.x; m[2] = zAxis.x; m[3] = 0;
        m[4] = xAxis.y; m[5] = yAxis.y; m[6] = zAxis.y; m[7] = 0;
        m[8] = xAxis.z; m[9] = yAxis.z; m[10] = zAxis.z; m[11] = 0;
        m[12] = -Vec3.dot(xAxis, eye);
        m[13] = -Vec3.dot(yAxis, eye);
        m[14] = -Vec3.dot(zAxis, eye);
        m[15] = 1;
        
        return new Mat4(m);
    }
    
    static multiply(a, b) {
        const result = new Float32Array(16);
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                result[i * 4 + j] = 0;
                for (let k = 0; k < 4; k++) {
                    result[i * 4 + j] += a[i * 4 + k] * b[k * 4 + j];
                }
            }
        }
        return new Mat4(result);
    }
    
    static translate(m, v) {
        const t = new Float32Array(16);
        Mat4.identity(t);
        t[12] = v.x;
        t[13] = v.y;
        t[14] = v.z;
        return Mat4.multiply(m, new Mat4(t));
    }
    
    static rotateX(m, angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        const r = new Float32Array(16);
        Mat4.identity(r);
        r[5] = c; r[6] = -s;
        r[9] = s; r[10] = c;
        return Mat4.multiply(m, new Mat4(r));
    }
    
    static rotateY(m, angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        const r = new Float32Array(16);
        Mat4.identity(r);
        r[0] = c; r[2] = s;
        r[8] = -s; r[10] = c;
        return Mat4.multiply(m, new Mat4(r));
    }
    
    static rotateZ(m, angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        const r = new Float32Array(16);
        Mat4.identity(r);
        r[0] = c; r[1] = -s;
        r[4] = s; r[5] = c;
        return Mat4.multiply(m, new Mat4(r));
    }
    
    static scale(m, v) {
        const s = new Float32Array(16);
        Mat4.identity(s);
        s[0] = v.x;
        s[5] = v.y;
        s[10] = v.z;
        return Mat4.multiply(m, new Mat4(s));
    }
}

// ============================================================================
// Catmull-Rom Spline
// ============================================================================

class CatmullRomSpline {
    constructor(controlPoints) {
        this.controlPoints = controlPoints;
        this.segmentCount = controlPoints.length - 1;
    }
    
    // Evaluate spline at parameter t (0 to 1)
    evaluate(t) {
        if (t <= 0) return this.controlPoints[0];
        if (t >= 1) return this.controlPoints[this.controlPoints.length - 1];
        
        // Find which segment
        const segment = Math.floor(t * (this.controlPoints.length - 1));
        const localT = (t * (this.controlPoints.length - 1)) - segment;
        
        // Get control points for this segment
        const p0 = this.controlPoints[Math.max(0, segment - 1)];
        const p1 = this.controlPoints[segment];
        const p2 = this.controlPoints[Math.min(segment + 1, this.controlPoints.length - 1)];
        const p3 = this.controlPoints[Math.min(segment + 2, this.controlPoints.length - 1)];
        
        return this.hermite(p0, p1, p2, p3, localT);
    }
    
    hermite(p0, p1, p2, p3, t) {
        const t2 = t * t;
        const t3 = t2 * t;
        
        // Catmull-Rom basis functions
        const h00 = 2 * t3 - 3 * t2 + 1;
        const h10 = t3 - 2 * t2 + t;
        const h01 = -2 * t3 + 3 * t2;
        const h11 = t3 - t2;
        
        // Tangent vectors
        const m1 = Vec3.mul(Vec3.sub(p2, p0), 0.5);
        const m2 = Vec3.mul(Vec3.sub(p3, p1), 0.5);
        
        return Vec3.add(
            Vec3.add(
                Vec3.mul(p1, h00),
                Vec3.mul(m1, h10)
            ),
            Vec3.add(
                Vec3.mul(p2, h01),
                Vec3.mul(m2, h11)
            )
        );
    }
    
    // Get tangent/derivative at parameter t
    getTangent(t) {
        const epsilon = 0.001;
        const p1 = this.evaluate(Math.max(0, t - epsilon));
        const p2 = this.evaluate(Math.min(1, t + epsilon));
        return Vec3.normalize(Vec3.sub(p2, p1));
    }
}

// ============================================================================
// Utility Functions
// ============================================================================

function radians(degrees) {
    return degrees * Math.PI / 180;
}

function degrees(radians) {
    return radians * 180 / Math.PI;
}

function clamp(x, min, max) {
    return Math.max(min, Math.min(max, x));
}

function mix(a, b, t) {
    return a * (1 - t) + b * t;
}

function smoothstep(edge0, edge1, x) {
    const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
}
