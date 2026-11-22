# MedCraft 3D — Procedural Mediterranean Building Generator

An interactive, browser-based 3D procedural building generator built with **Three.js** and **Tailwind CSS**, inspired by warm stylized Mediterranean & Middle Eastern diorama architecture.

> **Live Demo (enable GitHub Pages on `main` → `/`):** https://mohamedxiv.github.io/medcraft-3d/

## Features

- **6 Architectural Presets:** Corner Pharmacy, Café & Townhouse, Produce Market, Mediterranean Terracotta Villa, Civic Town Hall (with 3D clock pediment), and Industrial Workshop.
- **Hollow Structural Shell & Live Boolean Cutouts:** Real wall thickness with mathematically exact window and doorway cutouts through both exterior stucco and interior plaster walls.
- **Context-Aware Furnished Interiors:** Automatically generated ground-floor interiors (pharmacy medicine racks & counter, café espresso bar & pastry case, market produce island, office desk & bookshelves, town hall marble foyer, workshop benches) plus upper-floor apartments and staircases.
- **3 Inspection Modes:** Exterior view, **Cutaway Floor Slicer** (dollhouse view per floor), and **First-Person Walk-Inside Mode** (`WASD` / Arrow keys + mouse look).
- **Procedural Materials & Lighting:** Canvas-generated weathered stucco, terracotta barrel tiles, striped awnings, sidewalk pavers, interior tile/wood floors, and 4 atmosphere presets (Golden Hour, Noon, Sunset, Cozy Night).
- **Zero-Dependency Exports:** Self-contained binary **`.GLB` (glTF 2.0)** exporter (ready for Blender, Unity, Godot, and Unreal), **`.PNG`** snapshot, and **`.JSON`** recipe copy.

## Project Structure

```text
medcraft-3d/
├── index.html          # Main application entry point (GitHub Pages ready)
├── css/
│   └── styles.css      # Custom studio UI styling & responsive controls
├── js/
│   ├── state.js        # Deterministic PRNG, presets, palettes, and app state
│   ├── textures.js     # Procedural canvas textures (stucco, terracotta, awnings, floors)
│   ├── scene.js        # Three.js renderer, lighting presets, orbit & FPS walk camera
│   ├── generator.js    # Procedural architecture, live Boolean wall cutouts & interiors
│   ├── exporter.js     # Self-contained binary glTF 2.0 (.GLB) exporter
│   └── ui.js           # Inspector panel wiring, cutaway slicer & animation loop
├── LICENSE             # MIT License
└── README.md
```

## Quick Start

No build step or dependencies required — open `index.html` in any modern browser or enable **Settings → Pages → Deploy from branch (`main` / `root`)** on GitHub.

## License

MIT License — see `LICENSE` for details.
