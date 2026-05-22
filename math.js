/**
 * math.js - Mathematical Helper Functions
 * Vector, Matrix, and Spline calculations for WebGL
 * 
 * Capstone Project: Sehrli Meyvə Bağı
 * Author: [Student Name]
 * Date: 2026
 */

// ==================== VECTOR 3D OPERATIONS ====================

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

    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }

    normalize() {
        const len = this.length();
        if (len === 0) return new Vec3(0, 0, 0);
        return new Vec3(this.x / len, this.y / len, this.z / len);
    }

    clone() {
        return new Vec3(this.x, this.y, this.z);
    }

    toArray() {
        return [this.x, this.y, this.z];
    }
}

// ==================== 4x4 MATRIX OPERATIONS ====================

class Mat4 {
    constructor() {
        // Identity matrix
        this.data = new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
    }

    static identity() {
        return new Mat4();
    }

    static perspective(fov, aspect, near, far) {
        const mat = new Mat4();
        const f = 1.0 / Math.tan(fov / 2);
        const nf = 1 / (near - far);

        mat.data[0] = f / aspect;
        mat.data[1] = 0;
        mat.data[2] = 0;
        mat.data[3] = 0;
        mat.data[4] = 0;
        mat.data[5] = f;
        mat.data[6] = 0;
        mat.data[7] = 0;
        mat.data[8] = 0;
        mat.data[9] = 0;
        mat.data[10] = (far + near) * nf;
        mat.data[11] = -1;
        mat.data[12] = 0;
        mat.data[13] = 0;
        mat.data[14] = 2 * far * near * nf;
        mat.data[15] = 0;

        return mat;
    }

    static lookAt(eye, center, up) {
        const mat = new Mat4();

        const f = Vec3.sub(center, eye).normalize();
        const s = Vec3.cross(f, up).normalize();
        const u = Vec3.cross(s, f);

        mat.data[0] = s.x;
        mat.data[1] = u.x;
        mat.data[2] = -f.x;
        mat.data[3] = 0;
        mat.data[4] = s.y;
        mat.data[5] = u.y;
        mat.data[6] = -f.y;
        mat.data[7] = 0;
        mat.data[8] = s.z;
        mat.data[9] = u.z;
        mat.data[10] = -f.z;
        mat.data[11] = 0;
        mat.data[12] = -Vec3.dot(s, eye);
        mat.data[13] = -Vec3.dot(u, eye);
        mat.data[14] = Vec3.dot(f, eye);
        mat.data[15] = 1;

        return mat;
    }

    static translation(x, y, z) {
        const mat = new Mat4();
        mat.data[12] = x;
        mat.data[13] = y;
        mat.data[14] = z;
        return mat;
    }

    static rotationX(angle) {
        const mat = new Mat4();
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        mat.data[5] = c;
        mat.data[6] = -s;
        mat.data[9] = s;
        mat.data[10] = c;
        return mat;
    }

    static rotationY(angle) {
        const mat = new Mat4();
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        mat.data[0] = c;
        mat.data[2] = s;
        mat.data[8] = -s;
        mat.data[10] = c;
        return mat;
    }

    static rotationZ(angle) {
        const mat = new Mat4();
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        mat.data[0] = c;
        mat.data[1] = -s;
        mat.data[4] = s;
        mat.data[5] = c;
        return mat;
    }

    static scaling(x, y, z) {
        const mat = new Mat4();
        mat.data[0] = x;
        mat.data[5] = y;
        mat.data[10] = z;
        return mat;
    }

    multiply(other) {
        const result = new Mat4();
        const a = this.data;
        const b = other.data;
        const r = result.data;

        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                r[i * 4 + j] = 
                    a[i * 4 + 0] * b[0 * 4 + j] +
                    a[i * 4 + 1] * b[1 * 4 + j] +
                    a[i * 4 + 2] * b[2 * 4 + j] +
                    a[i * 4 + 3] * b[3 * 4 + j];
            }
        }
        return result;
    }

    transpose() {
        const result = new Mat4();
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                result.data[i * 4 + j] = this.data[j * 4 + i];
            }
        }
        return result;
    }

    inverse() {
        // Simplified inverse for affine transformations
        const result = new Mat4();
        const m = this.data;

        // 3x3 rotation matrix inverse (transpose)
        result.data[0] = m[0];
        result.data[1] = m[4];
        result.data[2] = m[8];
        result.data[4] = m[1];
        result.data[5] = m[5];
        result.data[6] = m[9];
        result.data[8] = m[2];
        result.data[9] = m[6];
        result.data[10] = m[10];

        // Translation inverse
        result.data[12] = -(m[12] * result.data[0] + m[13] * result.data[4] + m[14] * result.data[8]);
        result.data[13] = -(m[12] * result.data[1] + m[13] * result.data[5] + m[14] * result.data[9]);
        result.data[14] = -(m[12] * result.data[2] + m[13] * result.data[6] + m[14] * result.data[10]);
        result.data[15] = 1;

        return result;
    }

    toFloat32Array() {
        return this.data;
    }
}

// ==================== CATMULL-ROM SPLINE ====================

class CatmullRomSpline {
    /**
     * Catmull-Rom spline interpolation for smooth camera animation
     * @param {Vec3[]} points - Control points
     * @param {number} tension - Curve tension (0.5 default)
     */
    constructor(points, tension = 0.5) {
        // Ensure at least 4 points for proper Catmull-Rom
        if (!points || points.length === 0) {
            points = [
                new Vec3(0, 5, 15),
                new Vec3(10, 5, 10),
                new Vec3(20, 5, 0),
                new Vec3(10, 5, -10)
            ];
        }
        while (points.length < 4) {
            points.push(points[points.length - 1].clone());
        }
        this.points = points;
        this.tension = tension;
    }

    /**
     * Get point on spline at parameter t (0 <= t <= 1)
     */
    getPoint(t) {
        const n = this.points.length;
        if (n < 2) return this.points[0] ? this.points[0].clone() : new Vec3(0, 5, 15);

        // Clamp t to [0, 1]
        t = Math.max(0, Math.min(1, t));

        // Convert to segment index
        const segment = t * (n - 1);
        const i = Math.min(Math.floor(segment), n - 2);
        const localT = segment - i;

        // Get 4 points for Catmull-Rom
        const p0 = this.points[Math.max(0, i - 1)] || this.points[0];
        const p1 = this.points[i] || this.points[0];
        const p2 = this.points[Math.min(n - 1, i + 1)] || this.points[n - 1];
        const p3 = this.points[Math.min(n - 1, i + 2)] || this.points[n - 1];

        return this.interpolate(p0, p1, p2, p3, localT);
    }

    /**
     * Catmull-Rom basis function interpolation
     */
    interpolate(p0, p1, p2, p3, t) {
        // Ensure all points exist
        if (!p0) p0 = new Vec3(0, 0, 0);
        if (!p1) p1 = new Vec3(0, 0, 0);
        if (!p2) p2 = new Vec3(0, 0, 0);
        if (!p3) p3 = new Vec3(0, 0, 0);

        const t2 = t * t;
        const t3 = t2 * t;

        // Catmull-Rom basis functions
        const b0 = -this.tension * t + 2 * this.tension * t2 - this.tension * t3;
        const b1 = 1 + (this.tension - 3) * t2 + (2 - this.tension) * t3;
        const b2 = this.tension * t + (3 - 2 * this.tension) * t2 + (this.tension - 2) * t3;
        const b3 = -this.tension * t2 + this.tension * t3;

        return new Vec3(
            b0 * p0.x + b1 * p1.x + b2 * p2.x + b3 * p3.x,
            b0 * p0.y + b1 * p1.y + b2 * p2.y + b3 * p3.y,
            b0 * p0.z + b1 * p1.z + b2 * p2.z + b3 * p3.z
        );
    }

    /**
     * Get tangent (derivative) at point t for camera direction
     */
    getTangent(t) {
        const delta = 0.001;
        const p1 = this.getPoint(t);
        const p2 = this.getPoint(Math.min(1, t + delta));
        return Vec3.sub(p2, p1).normalize();
    }

    /**
     * Get all control points for visualization
     */
    getControlPoints() {
        return this.points;
    }
}

// ==================== PROCEDURAL NOISE ====================

class ProceduralMath {
    /**
     * Simple pseudo-random noise function
     */
    static noise(x, z, seed = 42) {
        const n = Math.floor(x) + Math.floor(z) * 57 + seed * 131;
        const nn = (n << 13) ^ n;
        return (1.0 - ((nn * (nn * nn * 15731 + 789221) + 1376312589) & 0x7fffffff) / 1073741824.0);
    }

    static smoothNoise(x, z, seed) {
        const corners = (this.noise(x - 1, z - 1, seed) + this.noise(x + 1, z - 1, seed) +
                        this.noise(x - 1, z + 1, seed) + this.noise(x + 1, z + 1, seed)) / 16;
        const sides = (this.noise(x - 1, z, seed) + this.noise(x + 1, z, seed) +
                      this.noise(x, z - 1, seed) + this.noise(x, z + 1, seed)) / 8;
        const center = this.noise(x, z, seed) / 4;
        return corners + sides + center;
    }

    static interpolatedNoise(x, z, seed) {
        const integerX = Math.floor(x);
        const fractionalX = x - integerX;
        const integerZ = Math.floor(z);
        const fractionalZ = z - integerZ;

        const v1 = this.smoothNoise(integerX, integerZ, seed);
        const v2 = this.smoothNoise(integerX + 1, integerZ, seed);
        const v3 = this.smoothNoise(integerX, integerZ + 1, seed);
        const v4 = this.smoothNoise(integerX + 1, integerZ + 1, seed);

        const i1 = this.cosineInterpolate(v1, v2, fractionalX);
        const i2 = this.cosineInterpolate(v3, v4, fractionalX);

        return this.cosineInterpolate(i1, i2, fractionalZ);
    }

    static cosineInterpolate(a, b, x) {
        const ft = x * Math.PI;
        const f = (1 - Math.cos(ft)) * 0.5;
        return a * (1 - f) + b * f;
    }

    /**
     * Octave-based Perlin noise for realistic terrain
     */
    static perlinNoise(x, z, octaves = 4, persistence = 0.5, seed = 42) {
        let total = 0;
        let frequency = 1;
        let amplitude = 1;
        let maxValue = 0;

        for (let i = 0; i < octaves; i++) {
            total += this.interpolatedNoise(x * frequency, z * frequency, seed + i) * amplitude;
            maxValue += amplitude;
            amplitude *= persistence;
            frequency *= 2;
        }

        return total / maxValue;
    }
}

// ==================== COLOR UTILITIES ====================

class ColorUtils {
    static hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16) / 255,
            g: parseInt(result[2], 16) / 255,
            b: parseInt(result[3], 16) / 255
        } : { r: 0, g: 0, b: 0 };
    }

    static lerpColor(c1, c2, t) {
        return {
            r: c1.r + (c2.r - c1.r) * t,
            g: c1.g + (c2.g - c1.g) * t,
            b: c1.b + (c2.b - c1.b) * t
        };
    }

    static rgbToArray(c) {
        return [c.r, c.g, c.b];
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Vec3, Mat4, CatmullRomSpline, ProceduralMath, ColorUtils };
}