/**
 * main.js - WebGL Rendering Engine
 * Sehrli Meyvə Bağı (Magic Fruit Garden) - Capstone Project
 * 
 * Features:
 * - Procedural mesh generation (terrain, trees, fruits)
 * - Blinn-Phong lighting with shadow mapping
 * - Catmull-Rom spline camera animation
 * - Ray-traced water reflections
 * - Season system (Spring/Summer/Autumn/Winter)
 * - Day/Night cycle
 * 
 * Author: [Student Name]
 * Date: 2026
 * Course: Computer Graphics Capstone
 */

class MagicFruitGarden {
    constructor() {
        this.canvas = document.getElementById('glCanvas');
        this.gl = null;
        this.program = null;
        this.shadowProgram = null;

        // Camera system
        this.camera = {
            position: new Vec3(0, 5, 15),
            target: new Vec3(0, 0, 0),
            up: new Vec3(0, 1, 0),
            fov: Math.PI / 4,
            near: 0.1,
            far: 200.0
        };

        // Spline camera animation
        this.splineCamera = {
            t: 0,
            speed: 0.5,
            spline: null,
            enabled: true,
            showPath: true
        };

        // Time and season
        this.time = 0;
        this.deltaTime = 0;
        this.lastTime = 0;
        this.isNight = false;
        this.currentSeason = 0; // 0: spring, 1: summer, 2: autumn, 3: winter

        // Shadow mapping
        this.shadowMap = {
            fbo: null,
            texture: null,
            size: 2048,
            lightSpaceMatrix: new Mat4()
        };

        // Meshes and buffers
        this.meshes = {};
        this.buffers = {};

        // Scene objects
        this.objects = [];
        this.splineMarkers = [];

        // FPS counter
        this.fps = 60;
        this.frameCount = 0;
        this.lastFpsTime = 0;

        // Mouse interaction
        this.mouse = { x: 0, y: 0, down: false };

        this.init();
    }

    // ==================== INITIALIZATION ====================

    async init() {
        try {
            // Get WebGL 2.0 context
            this.gl = this.canvas.getContext('webgl2', {
                antialias: true,
                alpha: false,
                depth: true,
                stencil: false
            });

            if (!this.gl) {
                throw new Error('WebGL 2.0 is not supported! Please use a modern browser.');
            }

            // Setup canvas size
            this.resizeCanvas();
            window.addEventListener('resize', () => this.resizeCanvas());

            // Load shaders
            await this.loadShaders();

            // Create shadow framebuffer
            this.createShadowFramebuffer();

            // Create all meshes
            this.createMeshes();

            // Create scene objects
            this.createSceneObjects();

            // Create camera spline path
            this.createCameraPath();

            // Setup UI events
            this.setupEvents();

            // Start render loop
            this.lastTime = performance.now();
            requestAnimationFrame((t) => this.render(t));

            console.log('Magic Fruit Garden initialized successfully!');

        } catch (error) {
            console.error('Initialization error:', error);
            document.getElementById('errorMsg').style.display = 'block';
            document.getElementById('errorMsg').textContent = 'Error: ' + error.message;
        }
    }

    resizeCanvas() {
        const container = document.getElementById('canvas-container');
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;

        if (this.gl) {
            this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    // ==================== SHADER LOADING ====================

    async loadShaders() {
        // Load shader sources
        const vertResponse = await fetch('shaders/vertex.glsl');
        const vertSource = await vertResponse.text();

        const fragResponse = await fetch('shaders/fragment.glsl');
        const fragSource = await fragResponse.text();

        const shadowVertResponse = await fetch('shaders/shadow.vert');
        const shadowVertSource = await shadowVertResponse.text();

        const shadowFragResponse = await fetch('shaders/shadow.frag');
        const shadowFragSource = await shadowFragResponse.text();

        // Create shader programs
        this.program = this.createShaderProgram(vertSource, fragSource);
        this.shadowProgram = this.createShaderProgram(shadowVertSource, shadowFragSource);

        // Cache uniform locations
        this.uniforms = {
            // Matrices
            modelMatrix: this.gl.getUniformLocation(this.program, 'u_modelMatrix'),
            viewMatrix: this.gl.getUniformLocation(this.program, 'u_viewMatrix'),
            projectionMatrix: this.gl.getUniformLocation(this.program, 'u_projectionMatrix'),
            normalMatrix: this.gl.getUniformLocation(this.program, 'u_normalMatrix'),
            lightSpaceMatrix: this.gl.getUniformLocation(this.program, 'u_lightSpaceMatrix'),

            // Camera and light
            cameraPos: this.gl.getUniformLocation(this.program, 'u_cameraPos'),
            lightPos: this.gl.getUniformLocation(this.program, 'u_lightPos'),
            lightColor: this.gl.getUniformLocation(this.program, 'u_lightColor'),
            lightIntensity: this.gl.getUniformLocation(this.program, 'u_lightIntensity'),

            // Material
            ambientColor: this.gl.getUniformLocation(this.program, 'u_ambientColor'),
            diffuseColor: this.gl.getUniformLocation(this.program, 'u_diffuseColor'),
            specularColor: this.gl.getUniformLocation(this.program, 'u_specularColor'),
            shininess: this.gl.getUniformLocation(this.program, 'u_shininess'),

            // Time and season
            time: this.gl.getUniformLocation(this.program, 'u_time'),
            season: this.gl.getUniformLocation(this.program, 'u_season'),
            isNight: this.gl.getUniformLocation(this.program, 'u_isNight'),

            // Shadow
            shadowMap: this.gl.getUniformLocation(this.program, 'u_shadowMap'),
            useShadows: this.gl.getUniformLocation(this.program, 'u_useShadows'),

            // Water
            isWater: this.gl.getUniformLocation(this.program, 'u_isWater')
        };

        // Shadow shader uniforms
        this.shadowUniforms = {
            lightSpaceMatrix: this.gl.getUniformLocation(this.shadowProgram, 'u_lightSpaceMatrix'),
            modelMatrix: this.gl.getUniformLocation(this.shadowProgram, 'u_modelMatrix')
        };
    }

    createShaderProgram(vertexSource, fragmentSource) {
        const gl = this.gl;

        // Compile vertex shader
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vertexSource);
        gl.compileShader(vertexShader);

        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            console.error('Vertex shader error:', gl.getShaderInfoLog(vertexShader));
            throw new Error('Vertex shader compilation failed');
        }

        // Compile fragment shader
        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, fragmentSource);
        gl.compileShader(fragmentShader);

        if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
            console.error('Fragment shader error:', gl.getShaderInfoLog(fragmentShader));
            throw new Error('Fragment shader compilation failed');
        }

        // Link program
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Program link error:', gl.getProgramInfoLog(program));
            throw new Error('Shader program linking failed');
        }

        return program;
    }

    // ==================== SHADOW FRAMEBUFFER ====================

    createShadowFramebuffer() {
        const gl = this.gl;

        // Create depth texture
        this.shadowMap.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.shadowMap.texture);
        gl.texImage2D(
            gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT32F,
            this.shadowMap.size, this.shadowMap.size, 0,
            gl.DEPTH_COMPONENT, gl.FLOAT, null
        );
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        // Create framebuffer
        this.shadowMap.fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.shadowMap.fbo);
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT,
            gl.TEXTURE_2D, this.shadowMap.texture, 0
        );

        // Check completeness
        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
            console.error('Shadow framebuffer incomplete!');
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    // ==================== MESH CREATION ====================

    createMeshes() {
        // Terrain (procedural height map)
        this.meshes.terrain = createTerrainMesh(80, 80, 128, 8, 42);
        this.buffers.terrain = this.meshes.terrain.createBuffers(this.gl);

        // Tree (composite mesh)
        this.meshes.tree = createTreeMesh(3, 0.3, 1.5, 123);
        this.buffers.tree = this.meshes.tree.createBuffers(this.gl);

        // Fruit (sphere variants)
        this.meshes.apple = createFruitMesh(0.15, 'apple');
        this.buffers.apple = this.meshes.apple.createBuffers(this.gl);

        // Water surface (plane with subdivision)
        this.meshes.water = createPlaneMesh(10, 10, 32, 32);
        this.buffers.water = this.meshes.water.createBuffers(this.gl);

        // Sun/Moon sphere
        this.meshes.sun = createSphereMesh(2, 32, 16);
        this.buffers.sun = this.meshes.sun.createBuffers(this.gl);

        // Rocks (low poly sphere)
        this.meshes.rock = createSphereMesh(0.5, 8, 6);
        this.buffers.rock = this.meshes.rock.createBuffers(this.gl);

        // Torus (decorative rings)
        this.meshes.torus = createTorusMesh(1, 0.3, 32, 16);
        this.buffers.torus = this.meshes.torus.createBuffers(this.gl);
    }

    // ==================== SCENE OBJECTS ====================

    createSceneObjects() {
        // Tree positions (procedural placement)
        const treePositions = [
            [-10, 0, -10], [10, 0, -10], [-10, 0, 10], [10, 0, 10],
            [0, 0, -15], [0, 0, 15], [-15, 0, 0], [15, 0, 0],
            [-7, 0, -7], [7, 0, -7], [-7, 0, 7], [7, 0, 7],
            [-20, 0, -20], [20, 0, -20], [-20, 0, 20], [20, 0, 20],
            [0, 0, 0], [-5, 0, 12], [5, 0, -12], [-12, 0, 5]
        ];

        for (const pos of treePositions) {
            // Get height from terrain
            const height = ProceduralMath.perlinNoise(pos[0] * 0.05, pos[2] * 0.05, 4, 0.5, 42) * 8;

            // Add tree
            this.objects.push({
                type: 'tree',
                position: new Vec3(pos[0], height, pos[2]),
                rotation: Math.random() * Math.PI * 2,
                scale: 0.8 + Math.random() * 0.4,
                mesh: 'tree',
                color: { r: 0.4, g: 0.25, b: 0.1 },
                specular: { r: 0.1, g: 0.1, b: 0.1 },
                shininess: 16
            });

            // Add fruits to each tree (3-5 fruits)
            const fruitCount = 3 + Math.floor(Math.random() * 3);
            for (let i = 0; i < fruitCount; i++) {
                const angle = (i / fruitCount) * Math.PI * 2 + Math.random() * 0.5;
                const radius = 0.8 + Math.random() * 0.5;
                const fruitY = height + 2.5 + Math.random() * 0.5;

                this.objects.push({
                    type: 'fruit',
                    position: new Vec3(
                        pos[0] + Math.cos(angle) * radius,
                        fruitY,
                        pos[2] + Math.sin(angle) * radius
                    ),
                    rotation: Math.random() * Math.PI,
                    scale: 1.0,
                    mesh: 'apple',
                    color: { r: 0.9, g: 0.1, b: 0.1 },
                    specular: { r: 0.3, g: 0.1, b: 0.1 },
                    shininess: 64
                });
            }
        }

        // Water pond
        this.objects.push({
            type: 'water',
            position: new Vec3(0, -0.5, 0),
            rotation: 0,
            scale: 1.0,
            mesh: 'water',
            color: { r: 0.0, g: 0.3, b: 0.6 },
            specular: { r: 0.8, g: 0.8, b: 0.9 },
            shininess: 128,
            isWater: true
        });

        // Rocks
        const rockPositions = [
            [5, 0, 5], [-5, 0, -5], [8, 0, -3], [-8, 0, 3],
            [3, 0, 8], [-3, 0, -8], [12, 0, 0], [-12, 0, 0]
        ];

        for (const pos of rockPositions) {
            const height = ProceduralMath.perlinNoise(pos[0] * 0.05, pos[2] * 0.05, 4, 0.5, 42) * 8;

            this.objects.push({
                type: 'rock',
                position: new Vec3(pos[0], height, pos[2]),
                rotation: Math.random() * Math.PI,
                scale: 0.5 + Math.random() * 0.8,
                mesh: 'rock',
                color: { r: 0.5, g: 0.5, b: 0.5 },
                specular: { r: 0.2, g: 0.2, b: 0.2 },
                shininess: 8
            });
        }

        // Sun/Moon
        this.objects.push({
            type: 'sun',
            position: new Vec3(30, 40, 30),
            rotation: 0,
            scale: 1.0,
            mesh: 'sun',
            color: { r: 1.0, g: 0.9, b: 0.3 },
            specular: { r: 1.0, g: 1.0, b: 0.8 },
            shininess: 32
        });

        // Decorative torus rings
        const torusPositions = [
            [-3, 2, 5], [4, 2.5, -3], [-2, 1.5, -6], [1, 2, 4]
        ];

        for (const pos of torusPositions) {
            this.objects.push({
                type: 'torus',
                position: new Vec3(pos[0], pos[1], pos[2]),
                rotation: Math.random() * Math.PI,
                scale: 0.5,
                mesh: 'torus',
                color: { r: 0.9, g: 0.6, b: 0.3 },
                specular: { r: 0.9, g: 0.7, b: 0.5 },
                shininess: 64
            });
        }
    }

    // ==================== CAMERA PATH (Catmull-Rom Spline) ====================

    createCameraPath() {
        // Define control points for spline
        const points = [
            new Vec3(0, 8, 25),
            new Vec3(20, 6, 20),
            new Vec3(25, 5, 0),
            new Vec3(20, 6, -20),
            new Vec3(0, 8, -25),
            new Vec3(-20, 6, -20),
            new Vec3(-25, 5, 0),
            new Vec3(-20, 6, 20)
        ];

        this.splineCamera.spline = new CatmullRomSpline(points, 0.5);

        // Create visual markers for control points
        if (this.splineCamera.showPath) {
            this.createSplineMarkers(points);
        }
    }

    createSplineMarkers(points) {
        const gl = this.gl;

        // Create small spheres at control points
        for (let i = 0; i < points.length; i++) {
            const marker = {
                position: points[i],
                mesh: 'sun',
                scale: 0.15,
                color: { r: 0.0, g: 1.0, b: 0.0 },
                specular: { r: 0.5, g: 1.0, b: 0.5 },
                shininess: 32
            };
            this.splineMarkers.push(marker);
        }
    }

    // ==================== EVENTS ====================

    setupEvents() {
        // Season buttons
        document.querySelectorAll('.season-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.season-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');

                const seasonMap = { 'spring': 0, 'summer': 1, 'autumn': 2, 'winter': 3 };
                this.currentSeason = seasonMap[e.target.dataset.season];
            });
        });

        // Day/Night toggle
        const dayNightToggle = document.getElementById('dayNightToggle');
        dayNightToggle.addEventListener('click', () => {
            this.isNight = !this.isNight;
            dayNightToggle.classList.toggle('active');
            document.getElementById('timeDisplay').textContent = this.isNight ? 'Gecə' : 'Gündüz';
        });

        // Camera speed
        document.getElementById('cameraSpeed').addEventListener('input', (e) => {
            this.splineCamera.speed = parseFloat(e.target.value);
        });

        // Spline visibility
        document.getElementById('showSpline').addEventListener('change', (e) => {
            this.splineCamera.showPath = e.target.checked;
        });

        // Mouse controls
        this.canvas.addEventListener('mousedown', (e) => {
            this.mouse.down = true;
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });

        this.canvas.addEventListener('mouseup', () => {
            this.mouse.down = false;
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (this.mouse.down) {
                const deltaX = e.clientX - this.mouse.x;
                const deltaY = e.clientY - this.mouse.y;

                // Manual camera control
                this.splineCamera.enabled = false;

                // Update camera angles
                this.camera.position.x += deltaX * 0.01;
                this.camera.position.y -= deltaY * 0.01;

                this.mouse.x = e.clientX;
                this.mouse.y = e.clientY;
            }
        });

        // Mouse wheel for zoom
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.camera.fov += e.deltaY * 0.001;
            this.camera.fov = Math.max(Math.PI / 6, Math.min(Math.PI / 2, this.camera.fov));
        });
    }

    // ==================== RENDER LOOP ====================

    render(currentTime) {
        const gl = this.gl;

        // Calculate delta time
        this.deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        this.time += this.deltaTime;

        // FPS counter
        this.frameCount++;
        if (currentTime - this.lastFpsTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastFpsTime = currentTime;
            document.getElementById('fpsCounter').textContent = 'FPS: ' + this.fps;
        }

        // Update camera position
        this.updateCamera();

        // Render shadow map
        this.renderShadowMap();

        // Render main scene
        this.renderScene();

        requestAnimationFrame((t) => this.render(t));
    }

    updateCamera() {
        if (this.splineCamera.enabled && this.splineCamera.spline) {
            // Move along spline
            this.splineCamera.t += this.deltaTime * this.splineCamera.speed * 0.1;
            if (this.splineCamera.t > 1) this.splineCamera.t -= 1;

            const pos = this.splineCamera.spline.getPoint(this.splineCamera.t);
            const tangent = this.splineCamera.spline.getTangent(this.splineCamera.t);

            this.camera.position = pos;
            this.camera.target = Vec3.add(pos, tangent);
        }
    }

    // ==================== SHADOW MAP RENDERING ====================

    renderShadowMap() {
        const gl = this.gl;

        // Calculate light space matrix
        const lightPos = this.isNight 
            ? new Vec3(-20, 30, -20)  // Moon position
            : new Vec3(30, 40, 30);   // Sun position

        const lightProjection = Mat4.perspective(Math.PI / 2.5, 1, 1, 100);
        const lightView = Mat4.lookAt(lightPos, new Vec3(0, 0, 0), new Vec3(0, 1, 0));
        this.shadowMap.lightSpaceMatrix = lightProjection.multiply(lightView);

        // Use shadow shader
        gl.useProgram(this.shadowProgram);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.shadowMap.fbo);
        gl.viewport(0, 0, this.shadowMap.size, this.shadowMap.size);
        gl.clear(gl.DEPTH_BUFFER_BIT);

        gl.enable(gl.DEPTH_TEST);
        gl.cullFace(gl.FRONT); // Prevent peter panning

        // Render objects to shadow map
        for (const obj of this.objects) {
            if (obj.type === 'sun' || obj.type === 'water') continue; // Skip emissive and transparent objects

            const modelMatrix = this.getModelMatrix(obj);
            gl.uniformMatrix4fv(this.shadowUniforms.lightSpaceMatrix, false, this.shadowMap.lightSpaceMatrix.data);
            gl.uniformMatrix4fv(this.shadowUniforms.modelMatrix, false, modelMatrix.data);

            this.drawMesh(this.buffers[obj.mesh]);
        }

        // Render terrain to shadow map
        const terrainMatrix = Mat4.identity();
        gl.uniformMatrix4fv(this.shadowUniforms.modelMatrix, false, terrainMatrix.data);
        this.drawMesh(this.buffers.terrain);

        gl.cullFace(gl.BACK);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    // ==================== MAIN SCENE RENDERING ====================

    renderScene() {
        const gl = this.gl;

        gl.useProgram(this.program);
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);

        // Clear
        const skyColor = this.isNight 
            ? [0.02, 0.02, 0.08] 
            : [0.53, 0.81, 0.92];
        gl.clearColor(...skyColor, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);

        // Setup matrices
        const aspect = this.canvas.width / this.canvas.height;
        const projectionMatrix = Mat4.perspective(this.camera.fov, aspect, this.camera.near, this.camera.far);
        const viewMatrix = Mat4.lookAt(this.camera.position, this.camera.target, this.camera.up);

        // Set uniforms
        gl.uniformMatrix4fv(this.uniforms.projectionMatrix, false, projectionMatrix.data);
        gl.uniformMatrix4fv(this.uniforms.viewMatrix, false, viewMatrix.data);
        gl.uniform3f(this.uniforms.cameraPos, this.camera.position.x, this.camera.position.y, this.camera.position.z);

        // Light setup
        const lightPos = this.isNight 
            ? new Vec3(-20, 30, -20)
            : new Vec3(30, 40, 30);
        gl.uniform3f(this.uniforms.lightPos, lightPos.x, lightPos.y, lightPos.z);
        gl.uniform3f(this.uniforms.lightColor, 1.0, 0.95, 0.8);
        gl.uniform1f(this.uniforms.lightIntensity, this.isNight ? 0.3 : 1.0);

        // Time and season
        gl.uniform1f(this.uniforms.time, this.time);
        gl.uniform1i(this.uniforms.season, this.currentSeason);
        gl.uniform1i(this.uniforms.isNight, this.isNight);

        // Shadow map
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.shadowMap.texture);
        gl.uniform1i(this.uniforms.shadowMap, 0);
        gl.uniform1i(this.uniforms.useShadows, 1);
        gl.uniformMatrix4fv(this.uniforms.lightSpaceMatrix, false, this.shadowMap.lightSpaceMatrix.data);

        // Render terrain
        this.renderObject({
            mesh: 'terrain',
            position: new Vec3(0, 0, 0),
            rotation: 0,
            scale: 1,
            color: { r: 0.3, g: 0.6, b: 0.2 },
            specular: { r: 0.1, g: 0.1, b: 0.1 },
            shininess: 4
        });

        // Render all objects
        for (const obj of this.objects) {
            this.renderObject(obj);
        }

        // Render spline markers if enabled
        if (this.splineCamera.showPath) {
            for (const marker of this.splineMarkers) {
                this.renderObject(marker);
            }
        }
    }

    renderObject(obj) {
        const gl = this.gl;

        const modelMatrix = this.getModelMatrix(obj);
        const normalMatrix = modelMatrix.inverse().transpose();

        gl.uniformMatrix4fv(this.uniforms.modelMatrix, false, modelMatrix.data);
        gl.uniformMatrix4fv(this.uniforms.normalMatrix, false, normalMatrix.data);

        // Material properties
        gl.uniform3f(this.uniforms.ambientColor, obj.color.r * 0.3, obj.color.g * 0.3, obj.color.b * 0.3);
        gl.uniform3f(this.uniforms.diffuseColor, obj.color.r, obj.color.g, obj.color.b);
        gl.uniform3f(this.uniforms.specularColor, obj.specular.r, obj.specular.g, obj.specular.b);
        gl.uniform1f(this.uniforms.shininess, obj.shininess);

        // Water flag
        gl.uniform1i(this.uniforms.isWater, obj.isWater ? 1 : 0);

        this.drawMesh(this.buffers[obj.mesh]);
    }

    getModelMatrix(obj) {
        let matrix = Mat4.identity();
        matrix = matrix.multiply(Mat4.translation(obj.position.x, obj.position.y, obj.position.z));
        matrix = matrix.multiply(Mat4.rotationY(obj.rotation));
        matrix = matrix.multiply(Mat4.scaling(obj.scale, obj.scale, obj.scale));
        return matrix;
    }

    drawMesh(buffers) {
        const gl = this.gl;

        // Position attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertex);
        const positionLoc = gl.getAttribLocation(this.program, 'a_position');
        gl.enableVertexAttribArray(positionLoc);
        gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);

        // Normal attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
        const normalLoc = gl.getAttribLocation(this.program, 'a_normal');
        gl.enableVertexAttribArray(normalLoc);
        gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 0, 0);

        // UV attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.uv);
        const uvLoc = gl.getAttribLocation(this.program, 'a_uv');
        gl.enableVertexAttribArray(uvLoc);
        gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 0, 0);

        // Draw
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.index);
        gl.drawElements(gl.TRIANGLES, buffers.indexCount, gl.UNSIGNED_SHORT, 0);
    }
}

// ==================== START APPLICATION ====================

window.addEventListener('DOMContentLoaded', () => {
    new MagicFruitGarden();
});