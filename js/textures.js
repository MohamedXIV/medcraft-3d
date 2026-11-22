// =========================================================================
// 2. PROCEDURAL TEXTURE GENERATORS
// =========================================================================
const texCache = {};

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16)
  };
}

function createStuccoTexture(baseHex, weathering, seed) {
  const key = `stucco_${baseHex}_${weathering}_${seed}`;
  if (texCache[key]) return texCache[key];

  const size = 256;
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  const ctx = c.getContext('2d');
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

  for (let i = 0; i < 2400; i++) {
    const x = rng() * size;
    const y = rng() * size;
    const dark = rng() > 0.5;
    ctx.fillStyle = dark ? `rgba(60,35,20,${0.05 + weathering * 0.06})` : `rgba(255,248,235,${0.05 + weathering * 0.05})`;
    ctx.fillRect(x, y, 1.5, 1.5);
  }

  if (weathering > 0.15) {
    const g = ctx.createLinearGradient(0, size * 0.72, 0, size);
    g.addColorStop(0, 'rgba(95, 65, 45, 0)');
    g.addColorStop(1, `rgba(95, 65, 45, ${weathering * 0.24})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, size * 0.72, size, size * 0.28);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.encoding = THREE.sRGBEncoding;
  texCache[key] = tex;
  return tex;
}

function createTerracottaTexture(baseHex, seed) {
  const key = `terra_${baseHex}_${seed}`;
  if (texCache[key]) return texCache[key];

  const size = 256;
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  const ctx = c.getContext('2d');
  const rng = mulberry32(seed + 303);
  const rgb = hexToRgb(baseHex);

  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, size, size);

  const cols = 10, rows = 12;
  const cw = size / cols, rh = size / rows;

  for (let r = 0; r < rows; r++) {
    for (let col = 0; col < cols; col++) {
      const x = col * cw, y = r * rh;
      const shade = (rng() - 0.5) * 34;
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
  tex.encoding = THREE.sRGBEncoding;
  texCache[key] = tex;
  return tex;
}

function createAwningTexture(stripeHex) {
  const key = `awning_${stripeHex}`;
  if (texCache[key]) return texCache[key];
  const c = document.createElement('canvas');
  c.width = 256; c.height = 128;
  const ctx = c.getContext('2d');
  const stripes = 12;
  const sw = c.width / stripes;
  for (let i = 0; i < stripes; i++) {
    ctx.fillStyle = i % 2 === 0 ? stripeHex : '#f7efe3';
    ctx.fillRect(i * sw, 0, sw + 0.5, c.height);
  }
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  for (let y = 0; y < c.height; y += 4) ctx.fillRect(0, y, c.width, 1);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.encoding = THREE.sRGBEncoding;
  texCache[key] = tex;
  return tex;
}

function createSidewalkTexture() {
  if (texCache.sidewalk) return texCache.sidewalk;
  const size = 256;
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  const ctx = c.getContext('2d');
  const rng = mulberry32(777);
  ctx.fillStyle = '#c9b8a7';
  ctx.fillRect(0, 0, size, size);
  const grid = 8, step = size / grid;
  for (let y = 0; y < grid; y++) {
    for (let x = 0; x < grid; x++) {
      const d = (rng() - 0.5) * 18;
      ctx.fillStyle = `rgb(${Math.round(205 + d)},${Math.round(188 + d)},${Math.round(172 + d)})`;
      ctx.fillRect(x * step + 1.5, y * step + 1.5, step - 3, step - 3);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  tex.encoding = THREE.sRGBEncoding;
  texCache.sidewalk = tex;
  return tex;
}

function createInteriorFloorTexture(style) {
  const key = `intFloor_${style}`;
  if (texCache[key]) return texCache[key];
  const size = 256;
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  const ctx = c.getContext('2d');

  if (style === 'checker' || style === 'marble') {
    const c1 = style === 'marble' ? '#f5efe6' : '#e9f2ec';
    const c2 = style === 'marble' ? '#cfc4b6' : '#c6ddd0';
    const step = size / 8;
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        ctx.fillStyle = (x + y) % 2 === 0 ? c1 : c2;
        ctx.fillRect(x * step, y * step, step, step);
      }
    }
  } else if (style === 'terracotta') {
    ctx.fillStyle = '#b97754';
    ctx.fillRect(0, 0, size, size);
    const step = size / 6;
    const rng = mulberry32(99);
    for (let y = 0; y < 6; y++) {
      for (let x = 0; x < 6; x++) {
        const d = (rng() - 0.5) * 20;
        ctx.fillStyle = `rgb(${Math.round(198 + d)},${Math.round(126 + d * 0.7)},${Math.round(88 + d * 0.5)})`;
        ctx.fillRect(x * step + 2, y * step + 2, step - 4, step - 4);
      }
    }
  } else if (style === 'concrete') {
    ctx.fillStyle = '#9ca0a4';
    ctx.fillRect(0, 0, size, size);
    const rng = mulberry32(412);
    for (let i = 0; i < 1200; i++) {
      ctx.fillStyle = rng() > 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)';
      ctx.fillRect(rng() * size, rng() * size, 3, 3);
    }
  } else {
    ctx.fillStyle = '#a6764c';
    ctx.fillRect(0, 0, size, size);
    const rows = 8, rh = size / rows;
    const rng = mulberry32(55);
    for (let r = 0; r < rows; r++) {
      const d = (rng() - 0.5) * 22;
      ctx.fillStyle = `rgb(${Math.round(176 + d)},${Math.round(128 + d * 0.8)},${Math.round(84 + d * 0.6)})`;
      ctx.fillRect(0, r * rh + 1, size, rh - 2);
      ctx.fillStyle = 'rgba(60,35,15,0.22)';
      ctx.fillRect(0, r * rh, size, 1.5);
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  tex.encoding = THREE.sRGBEncoding;
  texCache[key] = tex;
  return tex;
}

function createClockTexture() {
  if (texCache.clock) return texCache.clock;
  const size = 256;
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#faf3e6';
  ctx.beginPath(); ctx.arc(128, 128, 120, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#4a3a2d'; ctx.lineWidth = 10; ctx.stroke();
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    ctx.save(); ctx.translate(128, 128); ctx.rotate(a);
    ctx.fillStyle = '#3a2d24'; ctx.fillRect(-3, -104, 6, i % 3 === 0 ? 22 : 12);
    ctx.restore();
  }
  ctx.strokeStyle = '#2b2019'; ctx.lineCap = 'round';
  ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(128, 128); ctx.lineTo(86, 94); ctx.stroke();
  ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(128, 128); ctx.lineTo(176, 86); ctx.stroke();
  ctx.fillStyle = '#b84a39'; ctx.beginPath(); ctx.arc(128, 128, 9, 0, Math.PI * 2); ctx.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.encoding = THREE.sRGBEncoding;
  texCache.clock = tex;
  return tex;
}
