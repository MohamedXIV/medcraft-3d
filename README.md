# MedCraft 3D v2 — Procedural Mediterranean Building, Interior & Scene Generator

An interactive, browser-based 3D procedural generator built with **Three.js**, **GLSL Post-Processing**, and **Tailwind CSS**, featuring decoupled **Building Shell**, **Interior Furniture**, and **Street Environment** generators, **Sims 4–style per-floor cutaway modes**, and an **AI Agent / MCP Control API**.

> **Live Demo (GitHub Pages):** https://mohamedxiv.github.io/medcraft-3d/

## What's New in v2

- **Decoupled Street Environment (`js/environment.js`):** Independent `envSeed`, toggles, and procedural generator for sidewalk pads, Mediterranean olive/citrus trees, streetlamps, bollards, benches, and terracotta planters.
- **Decoupled Interior Furniture (`js/interior.js`):** Independent `interiorSeed`, density slider, and style presets (`warm` / `modern` / `rustic`) with per-room furniture variations.
- **Selective `.GLB` Export (`js/exporter.js`):** Choose individually whether to include the **Building Shell**, **Interior Furniture**, and/or **Street Environment** in exported `.glb` models.
- **Sims 4–Style Per-Floor Cutaway (`js/generator.js`):** Slice to any floor and toggle between **Walls Up**, **Sims 4 Half-Cutaway** (front/right walls drop to low stub baseboards while back/left stay full height), and **Walls Down**.
- **Camera Optics & Custom GLSL Post-Processing (`js/scene.js`):** Switch between **Perspective** and **True Orthographic (Isometric)** projections, tune **FOV** and **Exposure**, and control real-time **Tilt-Shift Depth of Field**, **Warm Bloom**, **Stylized Ink Outline**, and **Vignette**.
- **AI Agent & MCP Bridge (`js/agent_api.js` + `mcp/`):** Full programmatic control via `window.MedCraftAPI`, `window.postMessage`, and a starter Node.js MCP server in `mcp/`.

## Project Structure

```text
medcraft-3d/
├── index.html          # Main application entry point (GitHub Pages ready)
├── css/styles.css      # Studio UI styling
├── js/
│   ├── state.js        # Deterministic PRNG, presets, palettes, decoupled seeds & FX state
│   ├── textures.js     # Procedural canvas textures
│   ├── scene.js        # Dual Persp/Ortho camera rig, lighting & GLSL post-FX shader
│   ├── environment.js  # Decoupled sidewalk, trees, streetlamps, benches & planters
│   ├── interior.js     # Decoupled interior furniture generator & variations
│   ├── generator.js    # Live Boolean wall cutouts & Sims 4 per-floor cutaway engine
│   ├── exporter.js     # Selective binary glTF 2.0 (.GLB) exporter
│   ├── agent_api.js    # window.MedCraftAPI + postMessage command bus
│   └── ui.js           # Inspector controls & animation loop
├── mcp/
│   ├── package.json    # MCP server dependencies
│   ├── server.js       # Runnable MCP server controlling MedCraft 3D via Playwright
│   └── README.md       # Setup instructions for Claude / Cursor / Gemini CLI
├── LICENSE
└── README.md
```

## License

MIT License — see `LICENSE` for details.
