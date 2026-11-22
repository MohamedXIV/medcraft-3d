// =========================================================================
// 6. AI AGENT / MCP CONTROL API (window.MedCraftAPI + postMessage Bridge)
// =========================================================================
window.MedCraftAPI = {
  version: '2.0.0',

  getState() { return JSON.parse(JSON.stringify(state)); },

  setState(patch = {}) {
    if (!patch || typeof patch !== 'object') return { ok: false, error: 'Invalid patch object' };
    Object.assign(state, patch);
    if (patch.lighting) applyLighting(state.lighting);
    if (patch.projection) setProjectionMode(state.projection);
    if (patch.fov !== undefined) { perspCamera.fov = state.fov; perspCamera.updateProjectionMatrix(); }
    syncUIFromState();
    generateBuilding();
    return { ok: true, state: this.getState() };
  },

  applyPreset(presetId) {
    if (!PRESETS[presetId]) return { ok: false, error: `Unknown preset: ${presetId}`, available: Object.keys(PRESETS) };
    Object.assign(state, PRESETS[presetId]);
    state.preset = presetId;
    document.querySelectorAll('.preset-card').forEach(c => c.classList.toggle('active', c.dataset.preset === presetId));
    syncUIFromState();
    generateBuilding();
    return { ok: true, preset: presetId, state: this.getState() };
  },

  randomizeBuilding(seed) {
    state.seed = typeof seed === 'number' ? seed : Math.floor(1000 + Math.random() * 98000);
    const r = mulberry32(state.seed);
    const pal = PALETTES[Math.floor(r() * PALETTES.length)];
    const shops = ['pharmacy', 'cafe', 'market', 'office', 'residential'];
    const roofs = ['flat', 'flat', 'hipped', 'gabled'];
    state.floors = Math.floor(1 + r() * 3.6);
    state.width = Math.round((6.5 + r() * 6.5) * 2) / 2;
    state.depth = Math.round((5.5 + r() * 4.5) * 2) / 2;
    state.floorH = Math.round((2.8 + r() * 0.6) * 10) / 10;
    state.cornerChamfer = r() > 0.65;
    state.shopType = shops[Math.floor(r() * shops.length)];
    state.roofType = state.cornerChamfer ? 'flat' : roofs[Math.floor(r() * roofs.length)];
    state.hasAwning = state.shopType !== 'residential' && r() > 0.2;
    state.hasShutters = r() > 0.15;
    state.hasFlowerBoxes = r() > 0.25;
    state.hasBalconies = state.floors >= 2 && r() > 0.3;
    state.hasLaundry = state.hasBalconies && r() > 0.55;
    state.hasVines = r() > 0.45;
    state.hasWaterTank = state.roofType === 'flat' && r() > 0.25;
    state.hasDish = r() > 0.35;
    state.hasRoofAC = state.roofType === 'flat' && r() > 0.25;
    state.hasRoofGarden = state.roofType === 'flat' && r() > 0.45;
    state.hasChimney = r() > 0.6;
    state.wall = pal.wall; state.trim = pal.trim; state.shutter = pal.shutter;
    state.awning = pal.awning; state.roof = pal.roof; state.flower = pal.flower;
    state.weathering = Math.round((0.35 + r() * 0.5) * 10) / 10;
    document.querySelectorAll('.preset-card').forEach(c => c.classList.remove('active'));
    syncUIFromState();
    generateBuilding();
    return { ok: true, seed: state.seed };
  },

  randomizeInterior(seed) {
    state.interiorSeed = typeof seed === 'number' ? seed : Math.floor(1000 + Math.random() * 98000);
    const styles = ['warm', 'modern', 'rustic'];
    state.interiorStyle = styles[state.interiorSeed % styles.length];
    syncUIFromState();
    rebuildInteriorOnly();
    return { ok: true, interiorSeed: state.interiorSeed, interiorStyle: state.interiorStyle };
  },

  randomizeEnvironment(seed) {
    state.envSeed = typeof seed === 'number' ? seed : Math.floor(1000 + Math.random() * 98000);
    syncUIFromState();
    rebuildEnvironmentOnly();
    return { ok: true, envSeed: state.envSeed };
  },

  setCutaway({ floor, wallCutMode } = {}) {
    if (typeof floor === 'number') state.activeFloor = Math.max(0, Math.min(state.floors - 1, floor));
    if (wallCutMode && ['up', 'cutaway', 'down'].includes(wallCutMode)) state.wallCutMode = wallCutMode;
    setViewMode('cutaway');
    rebuildFloorPills();
    applyViewModeVisibility();
    return { ok: true, activeFloor: state.activeFloor, wallCutMode: state.wallCutMode };
  },

  setCamera(opts = {}) {
    if (opts.projection) setProjectionMode(opts.projection);
    if (typeof opts.fov === 'number') {
      state.fov = Math.max(20, Math.min(75, opts.fov));
      perspCamera.fov = state.fov; perspCamera.updateProjectionMatrix();
    }
    if (opts.preset && CAM_VIEWS[opts.preset]) {
      const v = CAM_VIEWS[opts.preset];
      orbit.desiredSpherical.set(v.radius, v.phi, v.theta);
    }
    ['postFxEnabled', 'dofAmount', 'dofFocus', 'bloomAmount', 'outlineAmount', 'vignetteAmount', 'warmthAmount', 'exposure'].forEach((k) => {
      if (opts[k] !== undefined) state[k] = opts[k];
    });
    syncUIFromState();
    return { ok: true, camera: { projection: state.projection, fov: state.fov, postFxEnabled: state.postFxEnabled } };
  },

  exportGLB(opts = {}) { return exportBuildingToGLB(opts); },
  capturePNG() { renderFrame(); return canvas.toDataURL('image/png'); },
  getStats() {
    return {
      triangles: document.getElementById('stat-tris').textContent,
      meshes: document.getElementById('stat-meshes').textContent,
      dimensions: document.getElementById('stat-dims').textContent
    };
  },
  listCommands() {
    return [
      'getState()', 'setState(patch)', 'applyPreset(presetId)',
      'randomizeBuilding(seed?)', 'randomizeInterior(seed?)', 'randomizeEnvironment(seed?)',
      'setCutaway({ floor, wallCutMode })', 'setCamera({ projection, fov, preset, postFxEnabled, dofAmount, dofFocus, bloomAmount, outlineAmount })',
      'exportGLB({ structure, interior, environment })', 'capturePNG()', 'getStats()'
    ];
  }
};

window.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || data.type !== 'MEDCRAFT_CMD') return;
  const { id, method, params } = data;
  try {
    if (typeof window.MedCraftAPI[method] !== 'function') throw new Error(`Unknown MedCraftAPI method: ${method}`);
    const result = Array.isArray(params)
      ? window.MedCraftAPI[method](...params)
      : (params !== undefined ? window.MedCraftAPI[method](params) : window.MedCraftAPI[method]());
    if (event.source && event.source.postMessage) event.source.postMessage({ type: 'MEDCRAFT_RES', id, ok: true, result }, '*');
  } catch (err) {
    if (event.source && event.source.postMessage) event.source.postMessage({ type: 'MEDCRAFT_RES', id, ok: false, error: err.message }, '*');
  }
});
