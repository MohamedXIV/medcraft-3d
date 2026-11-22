import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { chromium } from 'playwright';
import { z } from 'zod';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_URL = process.env.MEDCRAFT_URL || `file://${path.resolve(__dirname, '../index.html')}`;

let browser = null;
let page = null;

async function ensurePage() {
  if (page) return page;
  browser = await chromium.launch({ headless: process.env.HEADLESS !== 'false' });
  page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(APP_URL, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => Boolean(window.MedCraftAPI));
  return page;
}

const server = new McpServer({ name: 'medcraft-3d', version: '2.0.0' });

server.tool('get_state', 'Get the full current MedCraft 3D building, interior, environment, and camera state', {}, async () => {
  const p = await ensurePage();
  const state = await p.evaluate(() => window.MedCraftAPI.getState());
  return { content: [{ type: 'text', text: JSON.stringify(state, null, 2) }] };
});

server.tool(
  'apply_preset',
  'Apply one of the built-in Mediterranean building presets',
  { preset: z.enum(['corner_pharmacy', 'cafe_townhouse', 'market_shop', 'med_villa', 'town_hall', 'workshop']) },
  async ({ preset }) => {
    const p = await ensurePage();
    const res = await p.evaluate((id) => window.MedCraftAPI.applyPreset(id), preset);
    return { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }] };
  }
);

server.tool(
  'set_state',
  'Update any MedCraft 3D parameters (floors, width, depth, roofType, shopType, colors, lighting, etc.)',
  { patch: z.record(z.any()) },
  async ({ patch }) => {
    const p = await ensurePage();
    const res = await p.evaluate((obj) => window.MedCraftAPI.setState(obj), patch);
    return { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }] };
  }
);

server.tool(
  'randomize',
  'Randomize building structure, interior furniture, or street environment independently',
  {
    target: z.enum(['building', 'interior', 'environment']),
    seed: z.number().int().optional()
  },
  async ({ target, seed }) => {
    const p = await ensurePage();
    const res = await p.evaluate(({ t, s }) => {
      if (t === 'interior') return window.MedCraftAPI.randomizeInterior(s);
      if (t === 'environment') return window.MedCraftAPI.randomizeEnvironment(s);
      return window.MedCraftAPI.randomizeBuilding(s);
    }, { t: target, s: seed });
    return { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }] };
  }
);

server.tool(
  'set_cutaway',
  'Enable Sims 4-style per-floor cutaway inspection',
  {
    floor: z.number().int().min(0).max(4).optional(),
    wallCutMode: z.enum(['up', 'cutaway', 'down']).optional()
  },
  async ({ floor, wallCutMode }) => {
    const p = await ensurePage();
    const res = await p.evaluate((opts) => window.MedCraftAPI.setCutaway(opts), { floor, wallCutMode });
    return { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }] };
  }
);

server.tool(
  'set_camera',
  'Control camera projection (perspective/orthographic), FOV, view preset, and GLSL post-processing FX',
  {
    projection: z.enum(['perspective', 'orthographic']).optional(),
    fov: z.number().min(20).max(75).optional(),
    preset: z.enum(['iso', 'street', 'front', 'top']).optional(),
    postFxEnabled: z.boolean().optional(),
    dofAmount: z.number().min(0).max(1).optional(),
    dofFocus: z.number().min(0.15).max(0.85).optional(),
    bloomAmount: z.number().min(0).max(1).optional(),
    outlineAmount: z.number().min(0).max(1).optional()
  },
  async (opts) => {
    const p = await ensurePage();
    const res = await p.evaluate((o) => window.MedCraftAPI.setCamera(o), opts);
    return { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }] };
  }
);

server.tool('capture_screenshot', 'Capture a PNG screenshot of the current 3D viewport', {}, async () => {
  const p = await ensurePage();
  const dataUrl = await p.evaluate(() => window.MedCraftAPI.capturePNG());
  const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
  return { content: [{ type: 'image', data: base64, mimeType: 'image/png' }] };
});

const transport = new StdioServerTransport();
await server.connect(transport);
