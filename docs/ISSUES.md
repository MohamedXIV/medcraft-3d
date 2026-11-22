# MedCraft 3D v3 — Engineering Issues Backlog

Each issue below is scoped for a single focused Pull Request and maps directly to `ROADMAP.md`.

---

## Milestone 1: v3 Stack Foundation

### Issue #1 — Scaffold Vite + React + TypeScript + R3F + Zustand Workspace
- **Labels:** `v3`, `architecture`, `foundation`
- **Goal:** Set up a clean TypeScript + Vite + Tailwind + `@react-three/fiber` + `@react-three/drei` + `zustand` + `zundo` + `three-bvh-csg` project structure while preserving the v2 legacy demo.
- **Acceptance Criteria:**
  - `npm run dev` renders the 3D Mediterranean viewport with golden-hour lighting and OrbitControls.
  - `npm run build` produces a static `dist/` bundle ready for GitHub Pages.
  - Zustand store with `zundo` temporal middleware supports `undo()` / `redo()`.

### Issue #2 — Define Canonical Scene Graph & Asset Recipe Schema
- **Labels:** `v3`, `architecture`, `data-model`
- **Goal:** Create TypeScript interfaces (`src/types/scene.ts`) separating `structure`, `walls`, `interior`, `environment`, and `customObjects`.
- **Acceptance Criteria:**
  - Every scene node has `id`, `name`, `layer` (`structure | interior | environment | custom`), `transform` (`position`, `rotation`, `scale`), `recipe`, `booleanCutter?`, and `placementRule` (`floor | wall | table | ceiling | free`).
  - Full scene serializes/deserializes losslessly to JSON.

### Issue #3 — Port v2 Procedural Building, Interior & Environment Generators to TypeScript
- **Labels:** `v3`, `procedural`, `migration`
- **Goal:** Migrate v2 procedural textures, building shell, interior furniture, and street environment into pure TypeScript geometry builders decoupled from React components.
- **Acceptance Criteria:**
  - All 6 presets (`corner_pharmacy`, `cafe_townhouse`, `market_shop`, `med_villa`, `town_hall`, `workshop`) generate identically in v3.
  - Selective `.GLB` exporter supports toggling `structure`, `interior`, `environment`, and `customObjects`.

---

## Milestone 2: DCC Lite Scene Editor & Persistence

### Issue #4 — Interactive Selection & Blender-Style Transform Gizmos
- **Labels:** `v3`, `editor`, `ux`
- **Goal:** Allow selecting any generated or placed object in the viewport and editing it with `@react-three/drei`'s `<TransformControls>`.
- **Acceptance Criteria:**
  - Click to select object (with subtle selection highlight/bounding outline); `Esc` to deselect.
  - Hotkeys & toolbar for Move (`G`/`W`), Rotate (`R`/`E`), Scale (`S`), Duplicate (`Shift+D`), Delete (`Del`), Grid Snap toggle, and Undo/Redo (`Ctrl+Z` / `Ctrl+Shift+Z`).
  - Orbit camera automatically locks while dragging a gizmo handle.

### Issue #5 — Surface-Aware Smart Placement Engine (Raycast + Normal Alignment)
- **Labels:** `v3`, `editor`, `physics-raycast`
- **Goal:** Automatically detect target surfaces (`floor`, `tabletop`, `wall`, `roof`) when placing or dragging objects and align position + orientation to the hit surface normal.
- **Acceptance Criteria:**
  - Wall-mounted items (paintings, wall ACs, sconces, shelves) automatically rotate flush against the clicked wall face.
  - Tabletop items snap to the top surface of counters/tables; floor items stay grounded on the active floor slab.
  - Visual placement ghost preview turns green on valid surfaces and red on invalid ones.

### Issue #6 — Scene Save / Load Manager (`IndexedDB` + JSON File)
- **Labels:** `v3`, `persistence`, `ux`
- **Goal:** Let users save multiple named scenes locally with thumbnails, reload them anytime, and export/import `.medcraft.json` scene files.
- **Acceptance Criteria:**
  - Save current scene with custom name + auto-captured viewport thumbnail.
  - Load, rename, duplicate, or delete saved scenes from a clean Scene Manager drawer.

---

## Milestone 3: Live CSG Boolean Cutters & Sims 4 Wall Builder

### Issue #7 — Live Editable Bounding-Box Boolean Cutters (`three-bvh-csg`)
- **Labels:** `v3`, `csg-boolean`, `geometry`
- **Goal:** Allow enabling a live editable Boolean Cutter bounding box on any object (staircases, windows, doors, arches, skylights) to dynamically subtract geometry from intersecting floors or walls.
- **Acceptance Criteria:**
  - Staircases automatically cut a clean stairwell opening through the upper floor slab when `booleanCutter.enabled = true`.
  - Moving, rotating, or scaling a cutter object or its bounding box updates the CSG subtraction live.
  - Non-destructive: disabling or moving the cutter restores the original wall/slab geometry cleanly.

### Issue #8 — Sims 4–Style Freeform Wall Drawing & Painting Tool
- **Labels:** `v3`, `sims-mode`, `architecture`
- **Goal:** Add an interactive Wall Draw mode where users click point-to-point on a snap grid to create custom rooms and partitions.
- **Acceptance Criteria:**
  - Supports **Full Wall**, **Half Wall**, and **Short Fence** heights.
  - Clean corner mitering and per-side material/paint brush (exterior stucco vs. interior plaster/tile).
  - Integrates seamlessly with Sims 4 cutaway modes (`Up`, `Cutaway`, `Down`) and Live Boolean window/door cutters.

---

## Milestone 4: Isolated Procedural Object Studio & Asset Library

### Issue #9 — Isolated Procedural Object Studio Mode
- **Labels:** `v3`, `studio`, `procedural`
- **Goal:** Provide a dedicated isolated studio viewport where users procedurally generate standalone objects (chairs, tables, beds, shelves, olive/citrus trees, streetlamps, fountains, planters) with fine-grained sliders and seeds.
- **Acceptance Criteria:**
  - Clean turntable studio lighting + isolated `.GLB` export per object.
  - Parametric controls adapt dynamically to the selected object category.

### Issue #10 — Personal Asset Library (Save, Browse & Drag-to-Place)
- **Labels:** `v3`, `library`, `persistence`
- **Goal:** Save user-generated procedural objects from the Studio into a persistent Asset Library (`IndexedDB`) with thumbnails and tags, and place them into any building scene.
- **Acceptance Criteria:**
  - One-click "Save to Library" from the Isolated Studio.
  - Filterable Asset Library drawer (Furniture, Trees, Street, Decor) with click-to-place using the Surface-Aware Placement Engine (#5).

---

## Milestone 5: Camera Optics, Post-FX & MCP v3

### Issue #11 — Camera Optics & `@react-three/postprocessing` Pipeline
- **Labels:** `v3`, `rendering`, `shaders`
- **Goal:** Upgrade rendering with Perspective/Orthographic camera switching, real Depth of Field, Bloom, SSAO/N8AO ambient occlusion, and Stylized Outline passes.
- **Acceptance Criteria:**
  - Real-time sliders for FOV, Exposure, DoF Focus/Bokeh, Bloom, Outline, and Vignette.

### Issue #12 — Upgrade MCP Server to Control Full v3 Scene Graph
- **Labels:** `v3`, `mcp`, `ai-agent`
- **Goal:** Extend `window.MedCraftAPI` and `mcp/server.js` so AI agents can spawn assets, move/rotate objects, draw Sims 4 walls, toggle CSG Boolean cutters, and save/export scenes.
- **Acceptance Criteria:**
  - Full JSON-schema MCP tools for `spawn_object`, `transform_object`, `toggle_boolean_cutter`, `draw_wall`, `save_scene`, and `export_glb`.
