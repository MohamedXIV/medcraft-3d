// =========================================================================
// 7. UI WIRING, INSPECTOR CONTROLS & ANIMATION LOOP
// =========================================================================
let toastTimer = null;
function showToast(msg) {
  const el = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  el.classList.remove('opacity-0'); el.classList.add('opacity-100');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.classList.remove('opacity-100'); el.classList.add('opacity-0'); }, 2600);
}

function syncUIFromState() {
  document.getElementById('input-seed').value = state.seed;
  document.getElementById('ctrl-floors').value = state.floors;
  document.getElementById('val-floors').textContent = state.floors;
  document.getElementById('ctrl-width').value = state.width;
  document.getElementById('val-width').textContent = `${state.width.toFixed(1)} m`;
  document.getElementById('ctrl-depth').value = state.depth;
  document.getElementById('val-depth').textContent = `${state.depth.toFixed(1)} m`;
  document.getElementById('ctrl-floorH').value = state.floorH;
  document.getElementById('val-floorH').textContent = `${state.floorH.toFixed(1)} m`;
  document.getElementById('ctrl-winDensity').value = state.winDensity;
  document.getElementById('val-winDensity').textContent = `${Math.round(state.winDensity * 100)}%`;
  document.getElementById('ctrl-roofHeight').value = state.roofHeight;
  document.getElementById('val-roofHeight').textContent = `${state.roofHeight.toFixed(1)}x`;
  document.getElementById('ctrl-weathering').value = state.weathering;
  document.getElementById('val-weathering').textContent = `${Math.round(state.weathering * 100)}%`;
  document.getElementById('ctrl-intDensity').value = state.interiorDensity;
  document.getElementById('val-intDensity').textContent = `${Math.round(state.interiorDensity * 100)}%`;
  document.getElementById('ctrl-intStyle').value = state.interiorStyle;
  document.getElementById('ctrl-envDensity').value = state.envDensity;
  document.getElementById('val-envDensity').textContent = `${Math.round(state.envDensity * 100)}%`;
  document.getElementById('ctrl-fov').value = state.fov;
  document.getElementById('val-fov').textContent = `${Math.round(state.fov)}°`;
  document.getElementById('ctrl-exposure').value = state.exposure;
  document.getElementById('val-exposure').textContent = `${state.exposure.toFixed(2)}`;
  document.getElementById('ctrl-dof').value = state.dofAmount;
  document.getElementById('val-dof').textContent = `${Math.round(state.dofAmount * 100)}%`;
  document.getElementById('ctrl-dofFocus').value = state.dofFocus;
  document.getElementById('val-dofFocus').textContent = `${Math.round(state.dofFocus * 100)}%`;
  document.getElementById('ctrl-bloom').value = state.bloomAmount;
  document.getElementById('val-bloom').textContent = `${Math.round(state.bloomAmount * 100)}%`;
  document.getElementById('ctrl-outline').value = state.outlineAmount;
  document.getElementById('val-outline').textContent = `${Math.round(state.outlineAmount * 100)}%`;
  document.getElementById('ctrl-vignette').value = state.vignetteAmount;
  document.getElementById('val-vignette').textContent = `${Math.round(state.vignetteAmount * 100)}%`;
  document.getElementById('ctrl-shopType').value = state.shopType;
  document.getElementById('ctrl-roofType').value = state.roofType;
  document.getElementById('color-wall').value = state.wall;
  document.getElementById('color-trim').value = state.trim;
  document.getElementById('color-shutter').value = state.shutter;
  document.getElementById('color-awning').value = state.awning;
  document.getElementById('color-roof').value = state.roof;
  document.getElementById('color-flower').value = state.flower;
  document.getElementById('chk-exp-struct').checked = state.exportStructure;
  document.getElementById('chk-exp-int').checked = state.exportInterior;
  document.getElementById('chk-exp-env').checked = state.exportEnvironment;
  document.querySelectorAll('.toggle-pill').forEach((el) => el.classList.toggle('on', Boolean(state[el.dataset.key])));
  document.querySelectorAll('.proj-btn').forEach((b) => {
    const act = b.dataset.proj === state.projection;
    b.classList.toggle('border-[#e07a5f]', act); b.classList.toggle('bg-[#e07a5f]/20', act); b.classList.toggle('text-white', act);
  });
  document.querySelectorAll('.sims-wall-btn').forEach((b) => {
    const act = b.dataset.wallmode === state.wallCutMode;
    b.classList.toggle('bg-[#81b29a]', act); b.classList.toggle('text-[#111c16]', act); b.classList.toggle('text-[#d6c6b8]', !act);
  });
}

function setViewMode(mode) {
  if ((mode === 'cutaway' || mode === 'walk') && !state.hasInterior) { state.hasInterior = true; syncUIFromState(); generateBuilding(); }
  state.viewMode = mode;
  document.querySelectorAll('.view-btn').forEach((b) => {
    const isAct = b.dataset.view === mode;
    b.classList.toggle('bg-[#81b29a]/25', isAct); b.classList.toggle('text-[#b7ebd0]', isAct); b.classList.toggle('text-[#d6c6b8]', !isAct);
  });
  if (mode === 'walk') {
    perspCamera.fov = 62; perspCamera.updateProjectionMatrix();
    state.doorOpen = true; syncUIFromState(); generateBuilding(); placeFpsAtFloor(state.activeFloor);
    showToast('أنت الآن أمام الباب — اضغط W أو ↑ للدخول للمبنى!');
  } else {
    perspCamera.fov = state.fov; perspCamera.updateProjectionMatrix(); setProjectionMode(state.projection);
    if (mode === 'cutaway') { orbit.desiredSpherical.set(17.5, Math.PI / 3.3, Math.PI / 5.2); showToast('تم تفعيل مقطع Sims 4 — بدّل بين الأدوار وأوضاع الحوائط!'); }
    else orbit.desiredSpherical.set(24, Math.PI / 3.1, Math.PI / 4.2);
    applyViewModeVisibility();
  }
}

document.querySelectorAll('.view-btn').forEach((btn) => btn.addEventListener('click', () => setViewMode(btn.dataset.view)));
document.querySelectorAll('.sims-wall-btn').forEach((btn) => btn.addEventListener('click', () => { state.wallCutMode = btn.dataset.wallmode; syncUIFromState(); applyViewModeVisibility(); }));
document.querySelectorAll('.walk-key').forEach((btn) => {
  const dir = btn.dataset.dir;
  btn.addEventListener('pointerdown', (e) => { e.preventDefault(); fps.keys[dir] = true; });
  btn.addEventListener('pointerup', () => { fps.keys[dir] = false; });
  btn.addEventListener('pointerleave', () => { fps.keys[dir] = false; });
});

const palGrid = document.getElementById('palette-grid');
PALETTES.forEach((p) => {
  const btn = document.createElement('button');
  btn.className = 'p-1.5 rounded-xl border border-white/10 bg-white/5 hover:border-[#e07a5f] transition flex flex-col gap-1';
  btn.innerHTML = `<div class="flex h-3.5 w-full rounded-md overflow-hidden"><span class="flex-1" style="background:${p.wall}"></span><span class="flex-1" style="background:${p.shutter}"></span><span class="flex-1" style="background:${p.awning}"></span><span class="flex-1" style="background:${p.roof}"></span></div><span class="text-[10px] text-[#e6d7c8] truncate w-full text-center">${p.name}</span>`;
  btn.addEventListener('click', () => { Object.assign(state, { wall: p.wall, trim: p.trim, shutter: p.shutter, awning: p.awning, roof: p.roof, flower: p.flower }); syncUIFromState(); generateBuilding(); });
  palGrid.appendChild(btn);
});

document.querySelectorAll('.tab-btn').forEach((btn) => btn.addEventListener('click', () => {
  document.querySelectorAll('.tab-btn').forEach(b => { b.classList.remove('active'); b.classList.add('text-[#c8b8a8]'); });
  btn.classList.add('active'); btn.classList.remove('text-[#c8b8a8]');
  document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
  document.getElementById(`tab-${btn.dataset.tab}`).classList.remove('hidden');
}));

document.querySelectorAll('.preset-card').forEach((card) => card.addEventListener('click', () => window.MedCraftAPI.applyPreset(card.dataset.preset)));

function bindSlider(id, key, fmt, onChange = generateBuilding) {
  document.getElementById(id).addEventListener('input', (e) => { state[key] = parseFloat(e.target.value); document.getElementById(id.replace('ctrl-', 'val-')).textContent = fmt(state[key]); onChange(); });
}
bindSlider('ctrl-floors', 'floors', v => `${v}`);
bindSlider('ctrl-width', 'width', v => `${v.toFixed(1)} m`);
bindSlider('ctrl-depth', 'depth', v => `${v.toFixed(1)} m`);
bindSlider('ctrl-floorH', 'floorH', v => `${v.toFixed(1)} m`);
bindSlider('ctrl-winDensity', 'winDensity', v => `${Math.round(v * 100)}%`);
bindSlider('ctrl-roofHeight', 'roofHeight', v => `${v.toFixed(1)}x`);
bindSlider('ctrl-weathering', 'weathering', v => `${Math.round(v * 100)}%`);
bindSlider('ctrl-intDensity', 'interiorDensity', v => `${Math.round(v * 100)}%`, rebuildInteriorOnly);
bindSlider('ctrl-envDensity', 'envDensity', v => `${Math.round(v * 100)}%`, rebuildEnvironmentOnly);
bindSlider('ctrl-fov', 'fov', v => `${Math.round(v)}°`, () => { perspCamera.fov = state.fov; perspCamera.updateProjectionMatrix(); });
bindSlider('ctrl-exposure', 'exposure', v => `${v.toFixed(2)}`, () => {});
bindSlider('ctrl-dof', 'dofAmount', v => `${Math.round(v * 100)}%`, () => {});
bindSlider('ctrl-dofFocus', 'dofFocus', v => `${Math.round(v * 100)}%`, () => {});
bindSlider('ctrl-bloom', 'bloomAmount', v => `${Math.round(v * 100)}%`, () => {});
bindSlider('ctrl-outline', 'outlineAmount', v => `${Math.round(v * 100)}%`, () => {});
bindSlider('ctrl-vignette', 'vignetteAmount', v => `${Math.round(v * 100)}%`, () => {});

document.getElementById('ctrl-shopType').addEventListener('change', (e) => { state.shopType = e.target.value; generateBuilding(); });
document.getElementById('ctrl-roofType').addEventListener('change', (e) => { state.roofType = e.target.value; generateBuilding(); });
document.getElementById('ctrl-intStyle').addEventListener('change', (e) => { state.interiorStyle = e.target.value; rebuildInteriorOnly(); });

document.querySelectorAll('.proj-btn').forEach((btn) => btn.addEventListener('click', () => {
  setProjectionMode(btn.dataset.proj); syncUIFromState();
  showToast(btn.dataset.proj === 'orthographic' ? 'تم التبديل لإسقاط أيزومتريك حقيقي (Orthographic)' : 'تم التبديل للإسقاط المنظوري (Perspective)');
}));

const ENV_KEYS = new Set(['showEnvironment', 'envTrees', 'envLamps', 'envBenches', 'envPlanters']);
const INT_KEYS = new Set(['showInteriorProps']);
const FX_KEYS = new Set(['postFxEnabled']);
document.querySelectorAll('.toggle-pill').forEach((el) => el.addEventListener('click', () => {
  const key = el.dataset.key; state[key] = !state[key]; el.classList.toggle('on', state[key]);
  if (FX_KEYS.has(key)) return;
  if (INT_KEYS.has(key)) { rebuildInteriorOnly(); return; }
  if (ENV_KEYS.has(key)) { rebuildEnvironmentOnly(); return; }
  generateBuilding();
}));

document.getElementById('btn-randomize').addEventListener('click', () => { const res = window.MedCraftAPI.randomizeBuilding(); showToast(`تم توليد مبنى جديد (Seed #${res.seed})`); });
document.getElementById('btn-rand-interior').addEventListener('click', () => { const res = window.MedCraftAPI.randomizeInterior(); showToast(`تم تنويع الأثاث الداخلي (${res.interiorStyle} #${res.interiorSeed})`); });
document.getElementById('btn-rand-env').addEventListener('click', () => { const res = window.MedCraftAPI.randomizeEnvironment(); showToast(`تم توليد مشهد شارع وشجر جديد (#${res.envSeed})`); });

document.getElementById('chk-exp-struct').addEventListener('change', (e) => { state.exportStructure = e.target.checked; });
document.getElementById('chk-exp-int').addEventListener('change', (e) => { state.exportInterior = e.target.checked; });
document.getElementById('chk-exp-env').addEventListener('change', (e) => { state.exportEnvironment = e.target.checked; });

['wall', 'trim', 'shutter', 'awning', 'roof', 'flower'].forEach((k) => document.getElementById(`color-${k}`).addEventListener('input', (e) => { state[k] = e.target.value; generateBuilding(); }));
document.getElementById('input-seed').addEventListener('change', (e) => { const v = parseInt(e.target.value, 10); state.seed = isNaN(v) ? 1001 : Math.max(1, Math.min(999999, v)); generateBuilding(); });

document.querySelectorAll('.light-btn').forEach((btn) => btn.addEventListener('click', () => {
  document.querySelectorAll('.light-btn').forEach(b => { b.classList.remove('active', 'border-[#e07a5f]', 'bg-[#e07a5f]/20', 'text-white', 'font-semibold'); b.classList.add('border-white/10', 'bg-white/5', 'text-[#d6c6b8]'); });
  btn.classList.add('active', 'border-[#e07a5f]', 'bg-[#e07a5f]/20', 'text-white', 'font-semibold'); btn.classList.remove('border-white/10', 'bg-white/5', 'text-[#d6c6b8]');
  state.lighting = btn.dataset.light; applyLighting(state.lighting); generateBuilding();
}));

const CAM_VIEWS = { iso: { radius: 24, phi: Math.PI / 3.1, theta: Math.PI / 4.2 }, street: { radius: 20, phi: Math.PI / 2.65, theta: Math.PI / 7.5 }, front: { radius: 21, phi: Math.PI / 2.25, theta: 0.02 }, top: { radius: 27, phi: 0.36, theta: Math.PI / 4 } };
document.querySelectorAll('.cam-btn').forEach((btn) => btn.addEventListener('click', () => {
  if (state.viewMode === 'walk') setViewMode('exterior');
  document.querySelectorAll('.cam-btn').forEach(b => { b.classList.remove('bg-[#e07a5f]/25', 'text-[#ffbfa8]'); b.classList.add('text-[#d6c6b8]'); });
  btn.classList.add('bg-[#e07a5f]/25', 'text-[#ffbfa8]'); btn.classList.remove('text-[#d6c6b8]');
  const v = CAM_VIEWS[btn.dataset.cam]; orbit.desiredSpherical.set(v.radius, v.phi, v.theta);
}));

document.getElementById('btn-autorotate').addEventListener('click', (e) => { state.autoRotate = !state.autoRotate; e.currentTarget.classList.toggle('bg-[#e07a5f]/30', state.autoRotate); e.currentTarget.classList.toggle('text-[#ffbfa8]', state.autoRotate); });

let panelOpen = window.innerWidth >= 640;
const panelEl = document.getElementById('inspector-panel'), toggleLbl = document.getElementById('toggle-panel-label');
function updatePanelVisibility() { panelEl.style.transform = panelOpen ? 'translateX(0)' : 'translateX(calc(100% + 24px))'; toggleLbl.textContent = panelOpen ? 'إخفاء التحكم' : 'إظهار التحكم'; }
updatePanelVisibility();
document.getElementById('btn-toggle-panel').addEventListener('click', () => { panelOpen = !panelOpen; updatePanelVisibility(); });

document.getElementById('btn-export-glb').addEventListener('click', () => exportBuildingToGLB());
document.getElementById('btn-export-png').addEventListener('click', () => {
  renderFrame(); const a = document.createElement('a'); a.href = canvas.toDataURL('image/png'); a.download = `medcraft-building-${state.seed}.png`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a); showToast('تم حفظ لقطة PNG بالمؤثرات البصرية!');
});
document.getElementById('btn-export-json').addEventListener('click', () => copyText(JSON.stringify(state, null, 2), 'تم نسخ وصف المبنى (JSON) إلى الحافظة!'));
document.getElementById('btn-copy-api').addEventListener('click', () => copyText(JSON.stringify({ api: 'window.MedCraftAPI', version: window.MedCraftAPI.version, commands: window.MedCraftAPI.listCommands() }, null, 2), 'تم نسخ أوامر Agent API / MCP إلى الحافظة!'));

function copyText(text, successMsg) {
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => showToast(successMsg)).catch(() => fallbackCopy(text, successMsg));
  else fallbackCopy(text, successMsg);
}
function fallbackCopy(text, successMsg) {
  const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); showToast(successMsg); } catch (_) { showToast('تعذر النسخ التلقائي'); }
  document.body.removeChild(ta);
}

function handleResize() {
  const w = window.innerWidth, h = window.innerHeight;
  perspCamera.aspect = w / Math.max(1, h); perspCamera.updateProjectionMatrix();
  updateOrthoFrustum(); renderer.setSize(w, h, false);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  renderTarget.setSize(Math.floor(w * dpr), Math.floor(h * dpr));
  postMat.uniforms.uResolution.value.set(w * dpr, h * dpr);
}
window.addEventListener('resize', handleResize);
function animate() { requestAnimationFrame(animate); updateCamera(); renderFrame(); }

window.addEventListener('load', () => {
  if (window.lucide) lucide.createIcons();
  handleResize(); applyLighting(state.lighting); syncUIFromState(); generateBuilding(); animate();
});
