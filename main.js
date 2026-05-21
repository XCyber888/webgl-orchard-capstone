// ============================================================================
// WebGL Orchard - Main Application
// ============================================================================

class OrchardScene {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.gl = this.canvas.getContext('webgl2', {
            antialias: true,
            depth: true
        });
        
        if (!this.gl) {
            alert('WebGL2 not supported!');
            return;
        }
        
        this.setupCanvas();
        this.initGL();
        this.createShaders();
        this.createMeshes();
        this.createScene();
        this.setupSpline();
        
        this.time = 0;
        this.animationSpeed = 1.0;
        this.isAnimating = true;
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.fps = 0;
        
        this.setupControls();
        this.render();
    }
    
    setupCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        window.addEventListener('resize', () => this.handleResize());
    }
    
    handleResize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }
    
    initGL() {
        const gl = this.gl;
        
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.clearColor(0.7, 0.7, 0.8, 1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);
    }
    
    createShaders() {
        const gl = this.gl;
        
        this.mainProgram = createProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);
        this.shadowProgram = createProgram(gl, SHADOW_VERTEX_SHADER, SHADOW_FRAGMENT_SHADER);
        this.skyProgram = createProgram(gl, SKY_VERTEX_SHADER, SKY_FRAGMENT_SHADER);
        
        if (!this.mainProgram || !this.shadowProgram) {
            console.error('Failed to create shader programs');
        }
    }
    
    createMeshes() {
        this.meshes = {
            sphere: createSphereMesh(1.0, 32, 16),
            torus: createTorusMesh(1.0, 0.3, 32, 16),
            cylinder: createCylinderMesh(0.5, 3.0, 16, 8),
            cone: createConeMesh(2.0, 4.0, 16),
            terrain: createTerrainMesh(100, 100, 32),
            plane: createPlaneMesh(50, 50, 8)
        };
        
        this.buffers = {};
        for (const [name, mesh] of Object.entries(this.meshes)) {
            this.buffers[name] = this.createMeshBuffers(mesh);
        }
    }
    
    createMeshBuffers(mesh) {
        const gl = this.gl;
        
        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);
        
        // Vertex positions
        const posVBO = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, posVBO);
        gl.bufferData(gl.ARRAY_BUFFER, mesh.getVertexArray(), gl.STATIC_DRAW);
        
        const posLoc = getAttribLocation(this.gl, this.mainProgram, 'position');
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 12, 0);
        
        // Vertex normals
        const normVBO = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, normVBO);
        gl.bufferData(gl.ARRAY_BUFFER, mesh.getNormalArray(), gl.STATIC_DRAW);
        
        const normLoc = getAttribLocation(this.gl, this.mainProgram, 'normal');
        gl.enableVertexAttribArray(normLoc);
        gl.vertexAttribPointer(normLoc, 3, gl.FLOAT, false, 12, 0);
        
        // Texture coordinates
        let texVBO = null;
        const texCoords = mesh.getTexCoordArray();
        if (texCoords) {
            texVBO = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, texVBO);
            gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
            
            const texLoc = getAttribLocation(this.gl, this.mainProgram, 'texCoord');
            gl.enableVertexAttribArray(texLoc);
            gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, 8, 0);
        }
        
        // Index buffer
        const ebo = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.getIndexArray(), gl.STATIC_DRAW);
        
        gl.bindVertexArray(null);
        
        return {
            vao: vao,
            posVBO: posVBO,
            normVBO: normVBO,
            texVBO: texVBO,
            ebo: ebo,
            indexCount: mesh.indexCount
        };
    }
    
    createScene() {
        this.objects = [];
        
        // Terrain
        this.objects.push({
            mesh: 'terrain',
            position: new Vec3(0, -1, 0),
            scale: new Vec3(1, 1, 1),
            rotation: new Vec3(0, 0, 0)
        });
        
        // Trees
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2;
            const dist = 20;
            
            // Trunk
            this.objects.push({
                mesh: 'cylinder',
                position: new Vec3(Math.cos(angle) * dist, 0, Math.sin(angle) * dist),
                scale: new Vec3(1, 1.5, 1),
                rotation: new Vec3(0, 0, 0)
            });
            
            // Canopy
            this.objects.push({
                mesh: 'cone',
                position: new Vec3(Math.cos(angle) * dist, 2, Math.sin(angle) * dist),
                scale: new Vec3(1.2, 1.2, 1.2),
                rotation: new Vec3(0, 0, 0)
            });
        }
        
        // Fruits
        for (let i = 0; i < 10; i++) {
            const angle = (i / 10) * Math.PI * 2;
            const dist = 25;
            const height = Math.sin(i * 0.5) * 2 + 3;
            
            this.objects.push({
                mesh: 'sphere',
                position: new Vec3(Math.cos(angle) * dist, height, Math.sin(angle) * dist),
                scale: new Vec3(0.5, 0.5, 0.5),
                rotation: new Vec3(0, 0, 0)
            });
        }
        
        // Water surface
        this.objects.push({
            mesh: 'plane',
            position: new Vec3(0, -2, 0),
            scale: new Vec3(1, 1, 1),
            rotation: new Vec3(0, 0, 0),
            reflective: true
        });
    }
    
    setupSpline() {
        const controlPoints = [
            new Vec3(30, 5, 0),
            new Vec3(20, 5, 20),
            new Vec3(-20, 5, 30),
            new Vec3(-30, 5, 10),
            new Vec3(-20, 5, -20),
            new Vec3(20, 5, -30),
            new Vec3(30, 5, 0)
        ];
        
        this.spline = new CatmullRomSpline(controlPoints);
    }
    
    setupControls() {
        window.addEventListener('keydown', (e) => {
            switch (e.code) {
                case 'Space':
                    this.isAnimating = !this.isAnimating;
                    break;
                case 'KeyR':
                    this.time = 0;
                    break;
                case 'Equal':
                    this.animationSpeed = Math.min(2.0, this.animationSpeed + 0.1);
                    break;
                case 'Minus':
                    this.animationSpeed = Math.max(0.1, this.animationSpeed - 0.1);
                    break;
            }
        });
    }
    
    render() {
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        if (this.isAnimating) {
            this.time += deltaTime * this.animationSpeed;
        }
        
        // Update FPS
        this.frameCount++;
        if (this.frameCount % 30 === 0) {
            this.fps = Math.round(1 / deltaTime);
            document.getElementById('fps').textContent = `FPS: ${this.fps}`;
        }
        
        this.updateCamera();
        this.updateScene();
        this.renderScene();
        
        requestAnimationFrame(() => this.render());
    }
    
    updateCamera() {
        // Get camera position from spline
        const t = (this.time % 10) / 10; // Loop every 10 seconds
        this.cameraPos = this.spline.evaluate(t);
        this.cameraPos.y += 2; // Offset above ground
        
        // Look ahead on spline
        const lookT = Math.min(1, t + 0.05);
        this.lookTarget = this.spline.evaluate(lookT);
        this.lookTarget.y += 2;
    }
    
    updateScene() {
        // Animate objects
        for (let i = 0; i < this.objects.length; i++) {
            const obj = this.objects[i];
            obj.rotation.y += 0.01;
        }
    }
    
    renderScene() {
        const gl = this.gl;
        
        // Clear
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        // Setup matrices
        const projection = Mat4.perspective(Math.PI / 4, this.canvas.width / this.canvas.height, 0.1, 1000);
        const view = Mat4.lookAt(this.cameraPos, this.lookTarget, new Vec3(0, 1, 0));
        
        // Draw objects
        gl.useProgram(this.mainProgram);
        
        const projLoc = getUniformLocation(gl, this.mainProgram, 'uProjection');
        const viewLoc = getUniformLocation(gl, this.mainProgram, 'uView');
        const modelLoc = getUniformLocation(gl, this.mainProgram, 'uModel');
        const cameraPosLoc = getUniformLocation(gl, this.mainProgram, 'uCameraPos');
        const sunDirLoc = getUniformLocation(gl, this.mainProgram, 'uSunDirection');
        const sunColorLoc = getUniformLocation(gl, this.mainProgram, 'uSunColor');
        
        gl.uniformMatrix4fv(projLoc, false, projection.data);
        gl.uniformMatrix4fv(viewLoc, false, view.data);
        gl.uniform3fv(cameraPosLoc, this.cameraPos.toArray());
        gl.uniform3fv(sunDirLoc, Vec3.normalize(new Vec3(0.8, 1, 0.5)).toArray());
        gl.uniform3fv(sunColorLoc, [1.0, 0.9, 0.8]);
        
        for (const obj of this.objects) {
            let model = new Mat4();
            
            // Translate
            model = Mat4.translate(model, obj.position);
            
            // Rotate
            model = Mat4.rotateX(model, obj.rotation.x);
            model = Mat4.rotateY(model, obj.rotation.y);
            model = Mat4.rotateZ(model, obj.rotation.z);
            
            // Scale
            model = Mat4.scale(model, obj.scale);
            
            gl.uniformMatrix4fv(modelLoc, false, model.data);
            
            const buffer = this.buffers[obj.mesh];
            gl.bindVertexArray(buffer.vao);
            gl.drawElements(gl.TRIANGLES, buffer.indexCount, gl.UNSIGNED_INT, 0);
        }
        
        gl.bindVertexArray(null);
    }
}

// ============================================================================
// Application Initialization
// ============================================================================

window.addEventListener('DOMContentLoaded', () => {
    const scene = new OrchardScene();
    
    document.getElementById('status').textContent = 'Status: Running';
    document.getElementById('meshes').textContent = `Meshes: ${Object.keys(scene.meshes).length}`;
});
