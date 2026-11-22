// =========================================================================
// 6. UI WIRING & INTERACTIONS
// =========================================================================
let toastTimer = null;
function showToast(msg) {
  const el = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  el.classList.remove('opacity-0');
  el.classList.add('opacity-100');
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

  document.getElementById('ctrl-shopType').value = state.shopType;
  document.getElementById('ctrl-roofType').value = state.roofType;

  document.getElementById('color-wall').value = state.wall;
  document.getElementById('color-trim').value = state.trim;
  document.getElementById('color-shutter').value = state.shutter;
  document.getElementById('color-awning').value = state.awning;
  document.getElementById('color-roof').value = state.roof;
  document.getElementById('color-flower').value = state.flower;

  document.querySelectorAll('.toggle-pill').forEach((el) => {
    el.classList.toggle('on', Boolean(state[el.dataset.key]));
  });
}

function setViewMode(mode) {
  if ((mode === 'cutaway' || mode === 'walk') && !state.hasInterior) {
    state.hasInterior = true;
    syncUIFromState();
    generateBuilding();
  }
  state.viewMode = mode;
  document.querySelectorAll('.view-btn').forEach((b) => {
    const isAct = b.dataset.view === mode;
    b.classList.toggle('bg-[#81b29a]/25', isAct);
    b.classList.toggle('text-[#b7ebd0]', isAct);
    b.classList.toggle('text-[#d6c6b8]', !isAct);
  });

  if (mode === 'walk') {
    camera.fov = 62;
    camera.updateProjectionMatrix();
    state.doorOpen = true;
    syncUIFromState();
    generateBuilding();
    placeFpsAtFloor(state.activeFloor);
    showToast('أنت الآن أمام الباب — اضغط W أو ↑ للدخول للمبنى!');
  } else {
    camera.fov = 38;
    camera.updateProjectionMatrix();
    if (mode === 'cutaway') {
      orbit.desiredSpherical.set(17, Math.PI / 3.4, Math.PI / 7.5);
      showToast('تم تفعيل المقطع العرضي — اختر الدور لاستكشاف الغرف!');
    } else {
      orbit.desiredSpherical.set(24, Math.PI / 3.1, Math.PI / 4.2);
    }
    applyViewModeVisibility();
  }
}

document.querySelectorAll('.view-btn').forEach((btn) => {
  btn.addEventListener('click', () => setViewMode(btn.dataset.view));
});

document.querySelectorAll('.walk-key').forEach((btn) => {
  const dir = btn.dataset.dir;
  const start = (e) => { e.preventDefault(); fps.keys[dir] = true; };
  const stop = () => { fps.keys[dir] = false; };
  btn.addEventListener('pointerdown', start);
  btn.addEventListener('pointerup', stop);
  btn.addEventListener('pointerleave', stop);
});

const palGrid = document.getElementById('palette-grid');
PALETTES.forEach((p) => {
  const btn = document.createElement('button');
  btn.className = 'p-1.5 rounded-xl border border-white/10 bg-white/5 hover:border-[#e07a5f] transition flex flex-col gap-1';
  btn.innerHTML = `
    <div class="flex h-3.5 w-full rounded-md overflow-hidden">
      <span class="flex-1" style="background:${p.wall}"></span>
      <span class="flex-1" style="background:${p.shutter}"></span>
      <span class="flex-1" style="background:${p.awning}"></span>
      <span class="flex-1" style="background:${p.roof}"></span>
    </div>
    <span class="text-[10px] text-[#e6d7c8] truncate w-full text-center">${p.name}</span>
  `;
  btn.addEventListener('click', () => {
    Object.assign(state, { wall: p.wall, trim: p.trim, shutter: p.shutter, awning: p.awning, roof: p.roof, flower: p.flower });
    syncUIFromState();
    generateBuilding();
  });
  palGrid.appendChild(btn);
});

document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => { b.classList.remove('active'); b.classList.add('text-[#c8b8a8]'); });
    btn.classList.add('active'); btn.classList.remove('text-[#c8b8a8]');
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    document.getElementById(`tab-${btn.dataset.tab}`).classList.remove('hidden');
  });
});

document.querySelectorAll('.preset-card').forEach((card) => {
  card.addEventListener('click', () => {
    const key = card.dataset.preset;
    document.querySelectorAll('.preset-card').forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    Object.assign(state, PRESETS[key]);
    state.preset = key;
    syncUIFromState();
    generateBuilding();
  });
});

function bindSlider(id, key, fmt) {
  document.getElementById(id).addEventListener('input', (e) => {
    state[key] = parseFloat(e.target.value);
    document.getElementById(id.replace('ctrl-', 'val-')).textContent = fmt(state[key]);
    generateBuilding();
  });
}
bindSlider('ctrl-floors', 'floors', v => `${v}`);
bindSlider('ctrl-width', 'width', v => `${v.toFixed(1)} m`);
bindSlider('ctrl-depth', 'depth', v => `${v.toFixed(1)} m`);
bindSlider('ctrl-floorH', 'floorH', v => `${v.toFixed(1)} m`);
bindSlider('ctrl-winDensity', 'winDensity', v => `${Math.round(v * 100)}%`);
bindSlider('ctrl-roofHeight', 'roofHeight', v => `${v.toFixed(1)}x`);
bindSlider('ctrl-weathering', 'weathering', v => `${Math.round(v * 100)}%`);

document.getElementById('ctrl-shopType').addEventListener('change', (e) => { state.shopType = e.target.value; generateBuilding(); });
document.getElementById('ctrl-roofType').addEventListener('change', (e) => { state.roofType = e.target.value; generateBuilding(); });

document.querySelectorAll('.toggle-pill').forEach((el) => {
  el.addEventListener('click', () => {
    const key = el.dataset.key;
    state[key] = !state[key];
    el.classList.toggle('on', state[key]);
    generateBuilding();
  });
});

['wall', 'trim', 'shutter', 'awning', 'roof', 'flower'].forEach((k) => {
  document.getElementById(`color-${k}`).addEventListener('input', (e) => { state[k] = e.target.value; generateBuilding(); });
});

document.getElementById('input-seed').addEventListener('change', (e) => {
  const v = parseInt(e.target.value, 10);
  state.seed = isNaN(v) ? 1001 : Math.max(1, Math.min(999999, v));
  generateBuilding();
});

document.getElementById('btn-randomize').addEventListener('click', () => {
  state.seed = Math.floor(1000 + Math.random() * 98000);
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
  showToast(`تم توليد مبنى جديد مفروش من الداخل (Seed #${state.seed})`);
});

document.querySelectorAll('.light-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.light-btn').forEach(b => {
      b.classList.remove('active', 'border-[#e07a5f]', 'bg-[#e07a5f]/20', 'text-white', 'font-semibold');
      b.classList.add('border-white/10', 'bg-white/5', 'text-[#d6c6b8]');
    });
    btn.classList.add('active', 'border-[#e07a5f]', 'bg-[#e07a5f]/20', 'text-white', 'font-semibold');
    btn.classList.remove('border-white/10', 'bg-white/5', 'text-[#d6c6b8]');
    state.lighting = btn.dataset.light;
    applyLighting(state.lighting);
    generateBuilding();
  });
});

const CAM_VIEWS = {
  iso:    { radius: 24, phi: Math.PI / 3.1, theta: Math.PI / 4.2 },
  street: { radius: 20, phi: Math.PI / 2.65, theta: Math.PI / 7.5 },
  front:  { radius: 21, phi: Math.PI / 2.25, theta: 0.02 },
  top:    { radius: 27, phi: 0.36, theta: Math.PI / 4 }
};
document.querySelectorAll('.cam-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    if (state.viewMode === 'walk') setViewMode('exterior');
    document.querySelectorAll('.cam-btn').forEach(b => {
      b.classList.remove('bg-[#e07a5f]/25', 'text-[#ffbfa8]');
      b.classList.add('text-[#d6c6b8]');
    });
    btn.classList.add('bg-[#e07a5f]/25', 'text-[#ffbfa8]');
    btn.classList.remove('text-[#d6c6b8]');
    const v = CAM_VIEWS[btn.dataset.cam];
    orbit.desiredSpherical.set(v.radius, v.phi, v.theta);
  });
});

document.getElementById('btn-autorotate').addEventListener('click', (e) => {
  state.autoRotate = !state.autoRotate;
  e.currentTarget.classList.toggle('bg-[#e07a5f]/30', state.autoRotate);
  e.currentTarget.classList.toggle('text-[#ffbfa8]', state.autoRotate);
});

let panelOpen = window.innerWidth >= 640;
const panelEl = document.getElementById('inspector-panel');
const toggleLbl = document.getElementById('toggle-panel-label');
function updatePanelVisibility() {
  panelEl.style.transform = panelOpen ? 'translateX(0)' : 'translateX(calc(100% + 24px))';
  toggleLbl.textContent = panelOpen ? 'إخفاء التحكم' : 'إظهار التحكم';
}
updatePanelVisibility();
document.getElementById('btn-toggle-panel').addEventListener('click', () => {
  panelOpen = !panelOpen;
  updatePanelVisibility();
});

document.getElementById('btn-export-glb').addEventListener('click', exportBuildingToGLB);

document.getElementById('btn-export-png').addEventListener('click', () => {
  renderer.render(scene, camera);
  const url = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = `medcraft-building-${state.seed}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast('تم حفظ لقطة PNG للمبنى!');
});

document.getElementById('btn-export-json').addEventListener('click', () => {
  const json = JSON.stringify(state, null, 2);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(json).then(() => showToast('تم نسخ وصف المبنى (JSON) إلى الحافظة!')).catch(() => fallbackCopy(json));
  } else {
    fallbackCopy(json);
  }
});

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); showToast('تم نسخ وصف المبنى (JSON) إلى الحافظة!'); } catch (_) { showToast('تعذر النسخ التلقائي'); }
  document.body.removeChild(ta);
}

// =========================================================================
// 7. RESIZE & ANIMATION LOOP
// =========================================================================
function handleResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
}
window.addEventListener('resize', handleResize);

function animate() {
  requestAnimationFrame(animate);
  updateCamera();
  renderer.render(scene, camera);
}

window.addEventListener('load', () => {
  if (window.lucide) lucide.createIcons();
  handleResize();
  applyLighting(state.lighting);
  syncUIFromState();
  generateBuilding();
  animate();
});
