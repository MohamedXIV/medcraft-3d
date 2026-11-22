import * as THREE from 'three';
import { mulberry32 } from './prng';

const cache = new Map<string, THREE.CanvasTexture>();

function hexToRgb(hex: string) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16)
  };
}

export function createStuccoTexture(baseHex: string, weathering: number, seed: number): THREE.CanvasTexture {
  const key = `stucco_${baseHex}_${weathering.toFixed(2)}_${seed}`;
  const existing = cache.get(key);
  if (existing) return existing;

  const size = 256;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;
  const rng = mulberry32(seed + 101);
  const rgb = hexToRgb(baseHex);

  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, size, size);

  const blotches = Math.floor(35 + weathering * 70);
  for (let i = 0; i < blotches; i++) {
    const x = rng() * size;
    const y = rng() * size;
    const r = 12 + rng() * 44;
    const delta = (rng() - 0.5) * 32 * (0.4 + weathering);
    const grad = ctx.createRadialGradient(x, y, 1, x, y, r);
    const nr = Math.max(0, Math.min(255, Math.round(rgb.r + delta)));
    const ng = Math.max(0, Math.min(255, Math.round(rgb.g + delta * 0.9)));
    const nb = Math.max(0, Math.min(255, Math.round(rgb.b + delta * 0.8)));
    grad.addColorStop(0, `rgba(${nr},${ng},${nb},${0.16 + weathering * 0.14})`);
    grad.addColorStop(1, `rgba(${nr},${ng},${nb},0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 2000; i++) {
    ctx.fillStyle = rng() > 0.5 ? `rgba(60,35,20,${0.05 + weathering * 0.05})` : `rgba(255,248,235,${0.05 + weathering * 0.05})`;
    ctx.fillRect(rng() * size, rng() * size, 1.5, 1.5);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 1);
  tex.colorSpace = THREE.SRGBColorSpace;
  cache.set(key, tex);
  return tex;
}

export function createTerracottaTexture(baseHex: string, seed: number): THREE.CanvasTexture {
  const key = `terra_${baseHex}_${seed}`;
  const existing = cache.get(key);
  if (existing) return existing;

  const size = 256;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;
  const rng = mulberry32(seed + 303);
  const rgb = hexToRgb(baseHex);

  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, size, size);

  const cols = 10, rows = 12, cw = size / cols, rh = size / rows;
  for (let r = 0; r < rows; r++) {
    for (let col = 0; col < cols; col++) {
      const x = col * cw, y = r * rh, shade = (rng() - 0.5) * 34;
      const cr = Math.max(0, Math.min(255, Math.round(rgb.r + shade)));
      const cg = Math.max(0, Math.min(255, Math.round(rgb.g + shade * 0.85)));
      const cb = Math.max(0, Math.min(255, Math.round(rgb.b + shade * 0.7)));
      const g = ctx.createLinearGradient(x, y, x + cw, y);
      g.addColorStop(0, `rgb(${Math.max(0, cr - 32)},${Math.max(0, cg - 26)},${Math.max(0, cb - 22)})`);
      g.addColorStop(0.45, `rgb(${Math.min(255, cr + 24)},${Math.min(255, cg + 18)},${Math.min(255, cb + 12)})`);
      g.addColorStop(1, `rgb(${Math.max(0, cr - 38)},${Math.max(0, cg - 30)},${Math.max(0, cb - 25)})`);
      ctx.fillStyle = g;
      ctx.fillRect(x, y, cw, rh);
      ctx.fillStyle = 'rgba(45, 20, 10, 0.32)';
      ctx.fillRect(x, y + rh - 3, cw, 3);
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 2);
  tex.colorSpace = THREE.SRGBColorSpace;
  cache.set(key, tex);
  return tex;
}

export function createFloorTexture(style: 'wood' | 'checker' | 'terracotta'): THREE.CanvasTexture {
  const key = `floor_${style}`;
  const existing = cache.get(key);
  if (existing) return existing;

  const size = 256;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;

  if (style === 'checker') {
    const step = size / 8;
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        ctx.fillStyle = (x + y) % 2 === 0 ? '#efe7dc' : '#cfc2b0';
        ctx.fillRect(x * step, y * step, step, step);
      }
    }
  } else if (style === 'terracotta') {
    ctx.fillStyle = '#b97754';
    ctx.fillRect(0, 0, size, size);
    const step = size / 6;
    for (let y = 0; y < 6; y++) {
      for (let x = 0; x < 6; x++) {
        ctx.fillStyle = (x + y) % 2 === 0 ? '#c87f5a' : '#bd734e';
        ctx.fillRect(x * step + 2, y * step + 2, step - 4, step - 4);
      }
    }
  } else {
    ctx.fillStyle = '#a6764c';
    ctx.fillRect(0, 0, size, size);
    const rows = 8, rh = size / rows;
    for (let r = 0; r < rows; r++) {
      ctx.fillStyle = r % 2 === 0 ? '#b28258' : '#a3734a';
      ctx.fillRect(0, r * rh + 1, size, rh - 2);
      ctx.fillStyle = 'rgba(60,35,15,0.22)';
      ctx.fillRect(0, r * rh, size, 1.5);
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  tex.colorSpace = THREE.SRGBColorSpace;
  cache.set(key, tex);
  return tex;
}
