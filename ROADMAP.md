# MedCraft 3D — Product & Engineering Roadmap (v3)

MedCraft 3D is evolving from a single-building procedural viewer (v2) into a **browser-based Blender Lite + Sims 4 Build Mode + Procedural Asset Studio** powered by **React Three Fiber, Three.js, TypeScript, Zustand, and `three-bvh-csg`**, with full **AI Agent / MCP** control.

---

## Architecture Direction (v2 → v3)

| Layer | v2 (Current `main` — Live Demo) | v3 (Target Clean Stack) |
|---|---|---|
| **3D Engine** | Vanilla Three.js r128 | **React Three Fiber + Three.js (r170+) + `@react-three/drei`** |
| **State & History** | Mutable global `state` object | **Zustand + `zundo` (Undo/Redo temporal history)** |
| **Live Booleans** | 2D `Shape` + `Path` holes on walls | **`three-bvh-csg` 3D Live Editable Bounding-Box Cutters** |
| **Gizmos & Snapping** | Camera-only orbit/walk | **`TransformControls` + BVH Surface-Normal Raycasting** |
| **Post-Processing** | Custom single-pass GLSL shader | **`@react-three/postprocessing` (DoF, Bloom, SSAO, Outline)** |
| **Persistence** | JSON clipboard copy | **Scene Serializer + Asset Library (`IndexedDB` + JSON)** |
| **AI Control** | `window.MedCraftAPI` + Playwright MCP | **Typed Command Bus + MCP v3 (Scene, Gizmo, CSG, Studio)** |

---

## Milestones

### Milestone 1 — v3 Stack Foundation (`feat/v3-r3f-foundation`)
- **#1** Initialize Vite + React + TypeScript + Tailwind + React Three Fiber + Zustand (`zundo`) workspace.
- **#2** Define canonical **Scene Graph Schema** (`SceneDocument`, `SceneNode`, `Transform`, `ProceduralRecipe`, `BooleanCutterConfig`).
- **#3** Port v2 Mediterranean Procedural Materials, Building Shell, Interior & Environment generators into clean TypeScript modules.

### Milestone 2 — DCC Lite Scene Editor, Surface Snapping & Scene Persistence
- **#4** Interactive Object Selection + **Transform Gizmos** (`Translate`, `Rotate`, `Scale`, Grid Snap, Local/World space, `G/R/S` shortcuts, Duplicate, Delete, Undo/Redo).
- **#5** **Surface-Aware Smart Placement Engine** (BVH Raycasting against floors, tabletops, walls, and roofs; auto-height & surface-normal alignment).
- **#6** **Save & Load Full Scenes** (Local `IndexedDB` scene manager + `.medcraft.json` export/import).

### Milestone 3 — Live 3D Boolean Cutters & Sims 4 Freeform Wall Builder
- **#7** **Live Editable Bounding-Box Boolean Cutters (`three-bvh-csg`)**: Attach a toggleable live CSG cutter box to any object (e.g., staircases automatically cutting upper floor slabs; windows/doors cutting any wall they intersect).
- **#8** **Sims 4–Style Freeform Wall Drawing Tool**: Click-to-draw walls on snap grid, auto-miter corners, full/half-wall/short-fence heights, per-face stucco/paint/tile material assignment, and Sims 4 wall cutaway modes (`Up` / `Cutaway` / `Down`).

### Milestone 4 — Isolated Procedural Object Studio & Personal Asset Library
- **#9** **Isolated Procedural Object Studio**: Dedicated studio viewport to generate standalone assets (furniture, olive/citrus trees, benches, lamps, fountains, planters, decor) with independent seeds & parameters.
- **#10** **Personal Asset Library & Drag-to-Place**: Save custom procedural recipes (with auto-rendered PNG thumbnails) to `IndexedDB` and drag/place them into any scene with Surface Snapping.

### Milestone 5 — Camera Optics, Post-FX & MCP Agent v3
- **#11** **Camera Optics & Post-Processing Pipeline**: Perspective/Orthographic toggle, DoF, Bloom, SSAO, Stylized Outline, and Lighting Presets via `@react-three/postprocessing`.
- **#12** **MCP Server v3 Upgrade**: Expose scene-graph CRUD, gizmo transforms, CSG cutter attachment, wall drawing, and studio asset generation to AI agents.
