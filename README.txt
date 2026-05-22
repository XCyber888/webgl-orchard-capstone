SEHRLI MEYVE BAGI (Magic Fruit Garden) - WebGL Capstone Project
===============================================================

Author: [Student Name]
Date: 2026
Course: Computer Graphics Capstone
Institution: [University Name]

PROJECT DESCRIPTION
-------------------
This project demonstrates a complete WebGL 2.0 rendering pipeline with:
- Procedural mesh generation (terrain, trees, fruits, decorative objects)
- Blinn-Phong lighting model with shadow mapping
- Catmull-Rom spline-based camera animation
- Ray-traced water reflections
- Dynamic season system (Spring/Summer/Autumn/Winter)
- Day/Night cycle with automatic transition

TECHNICAL REQUIREMENTS MET
--------------------------
1. Geometric Models (Triangle Meshes):
   - Procedural terrain from height map (Perlin noise)
   - Sphere mesh (fruits, sun, rocks)
   - Torus mesh (decorative rings)
   - Cylinder and Cone meshes (tree trunks and foliage)
   - Plane mesh (water surface)
   All meshes use indexed drawing with VBOs/VAOs

2. Lighting and Shadows:
   - Blinn-Phong lighting model (ambient + diffuse + specular)
   - Directional light source (sun/moon)
   - Shadow mapping with PCF filtering
   - Multiple material properties per object

3. Animation (Spline):
   - Catmull-Rom spline for smooth camera path
   - 8 control points forming closed loop
   - Visual markers for control points
   - Adjustable camera speed

4. Ray Tracing / Reflections:
   - Simplified ray-traced reflections on water surface
   - Fresnel effect for realistic water
   - Procedural sky reflection
   - Not simple cube mapping - actual ray direction calculation

5. Rendering:
   - All graphics rendered from single main.js
   - WebGL 2.0 context with custom shaders
   - No external libraries used (only self-written math/mesh modules)

FILE STRUCTURE
--------------
index.html          - Main HTML page with UI controls
main.js             - WebGL engine, render loop, scene management
math.js             - Vec3, Mat4, CatmullRomSpline, ProceduralMath
mesh.js             - Procedural mesh generators
shaders/
  vertex.glsl       - Main vertex shader
  fragment.glsl     - Main fragment shader (Blinn-Phong + reflection)
  shadow.vert       - Shadow map vertex shader
  shadow.frag       - Shadow map fragment shader
README.txt          - This file

HOW TO RUN
----------
1. Extract all files to a folder
2. Start a local web server (required for shader loading):
   - Python 3: python -m http.server 8000
   - Node.js: npx serve
   - VS Code: Use Live Server extension
3. Open http://localhost:8000 in a modern browser
4. Ensure WebGL 2.0 is enabled

CONTROLS
--------
- Season Buttons: Switch between Spring/Summer/Autumn/Winter
- Day/Night Toggle: Switch lighting mode
- Camera Speed Slider: Adjust spline animation speed
- Show Spline Checkbox: Toggle control point visibility
- Mouse Drag: Manual camera control (pauses spline)
- Mouse Wheel: Zoom in/out

SEASON EFFECTS
--------------
Spring: Fresh green foliage, flowers blooming
Summer: Deep green, bright fruits, sunny
Autumn: Yellow/orange leaves, falling leaves effect
Winter: Snow coverage, bare trees, cool blue tones

BROWSER REQUIREMENTS
--------------------
- Chrome 56+ / Firefox 51+ / Edge 79+ / Safari 15+
- WebGL 2.0 support
- JavaScript enabled

PERFORMANCE NOTES
-----------------
- Terrain: 128x128 subdivisions (16k triangles)
- Trees: 20 instances with 3-5 fruits each
- Shadow map: 2048x2048 resolution
- Target: 60 FPS on modern hardware

KNOWN ISSUES
------------
- Must be served via HTTP/HTTPS (not file://) due to shader loading
- Mobile performance may vary

CREDITS
-------
All code written from scratch for this capstone project.
No external libraries used.
Procedural noise algorithm based on classic Perlin noise.