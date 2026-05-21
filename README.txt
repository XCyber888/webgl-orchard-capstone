=============================================================================
MAGICAL FRUIT ORCHARD - WebGL Capstone Project
=============================================================================

Author: XCyber888
Date: May 2026

---------------------------------------------------------------------------
PROJECT OVERVIEW
---------------------------------------------------------------------------

A WebGL-based 3D visualization of a procedurally generated fruit orchard 
with animated camera movement, dynamic lighting, shadows, and ray-traced 
reflections. The project demonstrates core graphics pipeline concepts:

- Procedural mesh generation (sphere, torus, cylinder, cone, terrain, plane)
- Triangle-based 3D models with indexed drawing
- Phong/Blinn-Phong lighting and shading
- Shadow mapping with depth textures
- Catmull-Rom spline animation for camera paths
- Ray-traced reflections on water surfaces
- Real-time rendering in WebGL2

---------------------------------------------------------------------------
TECHNICAL REQUIREMENTS MET
---------------------------------------------------------------------------

✓ Geometric Models: 6 procedurally generated meshes with different complexity
  - Terrain (procedural height map)
  - Sphere (fruits, sun)
  - Cylinder (tree trunks)
  - Cone (tree canopies)
  - Torus (decorative elements)
  - Plane (water surface, sky)

✓ Lighting & Shadows: Blinn-Phong model with:
  - Directional sunlight
  - Diffuse reflection
  - Specular highlights
  - Shadow mapping (depth texture)
  - Ambient occlusion
  - Fog effects

✓ Animation: Catmull-Rom spline-based camera movement:
  - Smooth curve interpolation through control points
  - Real-time camera path visualization
  - Animation speed control
  - Play/pause functionality

✓ Ray Tracing & Reflections:
  - Water surface with ray-traced reflections
  - Screen-space reflection technique
  - Limited ray bounces (1-2) for performance
  - Fresnel reflection calculations

✓ WebGL Rendering: All graphics rendered through:
  - Single JavaScript main.js entry point
  - WebGL2 context on HTML5 canvas
  - Custom shader compilation and linking
  - No external graphics libraries (Three.js, Babylon.js forbidden)

---------------------------------------------------------------------------
FILE STRUCTURE
---------------------------------------------------------------------------

webgl-orchard-capstone/
├── index.html              # Main HTML page with canvas
├── main.js                 # WebGL context, render loop, application logic
├── math.js                 # Math library (Vec3, Mat4, CatmullRomSpline)
├── mesh.js                 # Procedural mesh generators
├── shaders.js              # GLSL shader code and compilation helpers
├── README.txt              # This file
└── CAPSTONE.pdf            # Detailed project documentation

---------------------------------------------------------------------------
HOW TO RUN
---------------------------------------------------------------------------

1. Open a terminal/command prompt
2. Navigate to the project directory
3. Start a local web server (required for CORS):
   
   # Using Python 3:
   python -m http.server 8000
   
   # Using Python 2:
   python -m SimpleHTTPServer 8000
   
   # Using Node.js (http-server):
   npx http-server

4. Open your browser and navigate to:
   http://localhost:8000

5. The scene will load and begin animating automatically

---------------------------------------------------------------------------
CONTROL KEYS
---------------------------------------------------------------------------

SPACEBAR        Play/Pause animation
R               Reset camera to start of spline
+               Increase animation speed
-               Decrease animation speed

The camera automatically follows a spline path through the orchard.
You can observe the procedurally generated terrain, animated trees,
fruits, and reflective water surface.

---------------------------------------------------------------------------
CORE GRAPHICS CONCEPTS DEMONSTRATED
---------------------------------------------------------------------------

1. MESH GENERATION
   - TerrainMesh: Procedural height field using sine/cosine waves
   - SphereMesh: UV-sphere with parametric equations
   - CylinderMesh: Capped cylinder with side and cap geometry
   - ConeMesh: Cone geometry with computed normals
   - TorusMesh: Torus with major/minor radius parameters
   - PlaneMesh: Simple quad-based plane

2. LIGHTING MODEL
   - Blinn-Phong approximation:
     * Diffuse: N·L lighting
     * Specular: (N·H)^alpha highlights
     * Ambient: Global illumination approximation
   - Material properties: albedo, metallic, roughness, AO
   - Multiple light sources (sun + ambient)

3. SHADOW MAPPING
   - Depth texture rendering from light perspective
   - Shadow comparison during fragment shading
   - Bias handling to prevent shadow acne
   - Soft shadows with PCF filtering

4. SPLINE ANIMATION
   - Catmull-Rom basis functions
   - Smooth interpolation through control points
   - Parametric arc-length parameterization
   - Tangent vector computation for look-ahead

5. RAY TRACING
   - Per-pixel ray generation
   - Reflection ray tracing for water surface
   - Limited bounces (cost optimization)
   - Fresnel effect for angle-dependent reflectivity

---------------------------------------------------------------------------
PERFORMANCE CONSIDERATIONS
---------------------------------------------------------------------------

- Terrain resolution: 32x32 for smooth performance
- Shadow map resolution: 1024x1024
- Ray tracing: Limited to 1-2 bounces per pixel
- Indexed drawing: All meshes use element buffers
- Frustum culling: Not yet implemented (future optimization)
- Level-of-detail: Could reduce mesh complexity at distance

---------------------------------------------------------------------------
FUTURE ENHANCEMENTS
---------------------------------------------------------------------------

1. Advanced ray tracing with proper BVH acceleration
2. Parallax mapping for terrain detail
3. Particle systems for falling fruits
4. Dynamic light movement
5. Texture mapping for realistic materials
6. Normal mapping for surface detail
7. Atmospheric scattering
8. Interactive UI for light/camera control
9. WebGL extensions (instancing, compute shaders)
10. VR support

---------------------------------------------------------------------------
DEFENSE NOTES
---------------------------------------------------------------------------

During the capstone defence, I will explain:

1. Architecture and data flow
2. How each procedural mesh is generated
3. Shadow mapping pipeline
4. Catmull-Rom spline mathematics
5. Ray tracing algorithm and limitations
6. Shader compilation and linking process
7. Buffer management (VBOs, VAOs, EBOs)
8. Performance optimization decisions

---------------------------------------------------------------------------
REFERENCES & INSPIRATION
---------------------------------------------------------------------------

- ShaderToy: "Abstract Orchard" by Dave Hoskins
- Khronos WebGL Specification
- Real-Time Rendering (Akenine-Möller et al.)
- OpenGL Super Bible
- LearnOpenGL.com

=============================================================================
