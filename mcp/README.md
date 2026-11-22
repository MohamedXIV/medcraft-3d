# MedCraft 3D MCP Server

This MCP server lets any MCP-compatible AI agent (Claude Desktop, Cursor, Gemini CLI, etc.) control **MedCraft 3D** programmatically via `window.MedCraftAPI`.

## Setup

```bash
cd mcp
npm install
npx playwright install chromium
```

## Run / Connect to Your AI Client

Add this to your MCP client config (e.g. `claude_desktop_config.json` or `.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "medcraft-3d": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/medcraft-3d/mcp/server.js"],
      "env": {
        "HEADLESS": "false",
        "MEDCRAFT_URL": "https://mohamedxiv.github.io/medcraft-3d/"
      }
    }
  }
}
```

> Tip: Set `"HEADLESS": "false"` to watch the 3D building update live on your screen as the AI agent edits it!

## Exposed MCP Tools

- `get_state` — Inspect all current building, interior, environment, and camera parameters.
- `apply_preset` — Switch between the 6 architectural presets.
- `set_state` — Patch any building/color/lighting/material state field.
- `randomize` — Independently randomize `building`, `interior`, or `environment` (with optional deterministic `seed`).
- `set_cutaway` — Slice to any floor with Sims 4 wall modes (`up`, `cutaway`, `down`).
- `set_camera` — Switch `perspective` / `orthographic`, adjust `fov`, and tune GLSL post-processing (`dofAmount`, `bloomAmount`, `outlineAmount`).
- `capture_screenshot` — Return a live rendered PNG of the 3D scene directly to the agent.
