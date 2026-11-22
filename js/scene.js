// =========================================================================
// 3. THREE.JS SCENE, LIGHTING & DUAL CAMERA CONTROLLER (ORBIT + WALK FPS)
// =========================================================================
const canvas = document.getElementById('viewport');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#e8d5be');
scene.fog = new THREE.Fog('#e8d5be', 42, 95);

const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.12, 200);

const orbit = {
  target: new THREE.Vector3(0, 3.2, 0),
  spherical: new THREE.Spherical(24, Math.PI / 3.1, Math.PI / 4.2),
  desiredSpherical: new THREE.Spherical(24, Math.PI / 3.1, Math.PI / 4.2),
  desiredTarget: new THREE.Vector3(0, 3.2, 0),
  isDragging: false,
  isPanning: false,
  prevX: 0,
  prevY: 0
};

const fps = {
  pos: new THREE.Vector3(0, 1.85, 6.2),
  yaw: 0,
  pitch: -0.05,
  keys: { fwd: false, back: false, left: false, right: false }
};

function placeFpsAtFloor(floorIdx) {
  const baseLift = state.showSidewalk ? 0.22 : 0;
  const eyeY = baseLift + floorIdx * state.floorH + 1.62;
  if (floorIdx === 0) {
    const chamfer = state.cornerChamfer ? Math.min(2.1, Math.min(state.width, state.depth) * 0.28) : 0;
    fps.pos.set(-chamfer / 2, eyeY, state.depth / 2 + 2.2);
    fps.yaw = 0;
    fps.pitch = -0.04;
  } else {
    fps.pos.set(0, eyeY, state.depth * 0.28);
    fps.yaw = 0;
    fps.pitch = -0.06;
  }
}

function updateCamera() {
  if (state.viewMode === 'walk') {
    const speed = 0.085;
    const fwdVec = new THREE.Vector3(-Math.sin(fps.yaw), 0, -Math.cos(fps.yaw));
    const rightVec = new THREE.Vector3(Math.cos(fps.yaw), 0, -Math.sin(fps.yaw));

    if (fps.keys.fwd) fps.pos.addScaledVector(fwdVec, speed);
    if (fps.keys.back) fps.pos.addScaledVector(fwdVec, -speed);
    if (fps.keys.right) fps.pos.addScaledVector(rightVec, speed);
    if (fps.keys.left) fps.pos.addScaledVector(rightVec, -speed);

    const maxX = state.width / 2 + 3.2;
    const maxZ = state.depth / 2 + 3.8;
    fps.pos.x = Math.max(-maxX, Math.min(maxX, fps.pos.x));
    fps.pos.z = Math.max(-maxZ, Math.min(maxZ, fps.pos.z));

    camera.position.copy(fps.pos);
    const lookDir = new THREE.Vector3(
      -Math.sin(fps.yaw) * Math.cos(fps.pitch),
      Math.sin(fps.pitch),
      -Math.cos(fps.yaw) * Math.cos(fps.pitch)
    );
    camera.lookAt(fps.pos.clone().add(lookDir));
  } else {
    orbit.spherical.radius += (orbit.desiredSpherical.radius - orbit.spherical.radius) * 0.14;
    orbit.spherical.phi += (orbit.desiredSpherical.phi - orbit.spherical.phi) * 0.14;
    orbit.spherical.theta += (orbit.desiredSpherical.theta - orbit.spherical.theta) * 0.14;
    orbit.target.lerp(orbit.desiredTarget, 0.14);

    if (state.autoRotate && !orbit.isDragging) {
      orbit.desiredSpherical.theta += 0.0045;
    }
    const offset = new THREE.Vector3().setFromSpherical(orbit.spherical);
    camera.position.copy(orbit.target).add(offset);
    camera.lookAt(orbit.target);
  }
}

canvas.addEventListener('pointerdown', (e) => {
  orbit.isDragging = true;
  orbit.isPanning = e.button === 2 || e.shiftKey;
  orbit.prevX = e.clientX;
  orbit.prevY = e.clientY;
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!orbit.isDragging) return;
  const dx = e.clientX - orbit.prevX;
  const dy = e.clientY - orbit.prevY;
  orbit.prevX = e.clientX;
  orbit.prevY = e.clientY;

  if (state.viewMode === 'walk') {
    fps.yaw -= dx * 0.0055;
    fps.pitch = Math.max(-0.85, Math.min(0.85, fps.pitch - dy * 0.0045));
  } else if (orbit.isPanning) {
    const panScale = orbit.desiredSpherical.radius * 0.0014;
    const right = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 0);
    const up = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 1);
    orbit.desiredTarget.addScaledVector(right, -dx * panScale);
    orbit.desiredTarget.addScaledVector(up, dy * panScale);
  } else {
    orbit.desiredSpherical.theta -= dx * 0.007;
    orbit.desiredSpherical.phi = Math.max(0.22, Math.min(Math.PI / 2 - 0.04, orbit.desiredSpherical.phi - dy * 0.007));
  }
});
canvas.addEventListener('pointerup', () => { orbit.isDragging = false; orbit.isPanning = false; });
canvas.addEventListener('contextmenu', (e) => e.preventDefault());
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  if (state.viewMode === 'walk') {
    const fwdVec = new THREE.Vector3(-Math.sin(fps.yaw), 0, -Math.cos(fps.yaw));
    fps.pos.addScaledVector(fwdVec, -e.deltaY * 0.004);
  } else {
    orbit.desiredSpherical.radius = Math.max(7, Math.min(52, orbit.desiredSpherical.radius + e.deltaY * 0.015));
  }
}, { passive: false });

window.addEventListener('keydown', (e) => {
  if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'SELECT')) return;
  const k = e.key.toLowerCase();
  if (k === 'w' || k === 'arrowup') fps.keys.fwd = true;
  if (k === 's' || k === 'arrowdown') fps.keys.back = true;
  if (k === 'a' || k === 'arrowleft') fps.keys.left = true;
  if (k === 'd' || k === 'arrowright') fps.keys.right = true;
});
window.addEventListener('keyup', (e) => {
  const k = e.key.toLowerCase();
  if (k === 'w' || k === 'arrowup') fps.keys.fwd = false;
  if (k === 's' || k === 'arrowdown') fps.keys.back = false;
  if (k === 'a' || k === 'arrowleft') fps.keys.left = false;
  if (k === 'd' || k === 'arrowright') fps.keys.right = false;
});

const hemiLight = new THREE.HemisphereLight('#fff4e0', '#8d6e53', 0.78);
scene.add(hemiLight);

const sunLight = new THREE.DirectionalLight('#ffdfba', 1.45);
sunLight.position.set(14, 22, 16);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near = 2;
sunLight.shadow.camera.far = 65;
sunLight.shadow.camera.left = -16;
sunLight.shadow.camera.right = 16;
sunLight.shadow.camera.top = 16;
sunLight.shadow.camera.bottom = -16;
sunLight.shadow.bias = -0.0005;
scene.add(sunLight);

const fillLight = new THREE.DirectionalLight('#a7c7e7', 0.42);
fillLight.position.set(-14, 10, -10);
scene.add(fillLight);

const groundMesh = new THREE.Mesh(
  new THREE.CircleGeometry(65, 48),
  new THREE.MeshStandardMaterial({ color: '#d8c3a9', roughness: 0.96, metalness: 0.0 })
);
groundMesh.rotation.x = -Math.PI / 2;
groundMesh.position.y = -0.02;
groundMesh.receiveShadow = true;
scene.add(groundMesh);

const LIGHTING_PRESETS = {
  golden: { bg: '#e8d2b5', ground: '#d6bfa0', sunColor: '#ffd9a8', sunInt: 1.5, sunPos: [14, 20, 15], hemiSky: '#fff1db', hemiGnd: '#8c694a', hemiInt: 0.82, fillInt: 0.38, nightGlow: 0.2, intLight: 0.9 },
  noon:   { bg: '#cfe3f0', ground: '#d5c7b2', sunColor: '#fffbf0', sunInt: 1.55, sunPos: [8, 28, 12], hemiSky: '#e8f4ff', hemiGnd: '#9c8a75', hemiInt: 0.9, fillInt: 0.32, nightGlow: 0.05, intLight: 0.7 },
  sunset: { bg: '#d99b7e', ground: '#b5846b', sunColor: '#ff9e64', sunInt: 1.45, sunPos: [20, 10, 12], hemiSky: '#ffc8a8', hemiGnd: '#6b4740', hemiInt: 0.75, fillInt: 0.45, nightGlow: 0.55, intLight: 1.2 },
  night:  { bg: '#1e2436', ground: '#262b38', sunColor: '#8da9d4', sunInt: 0.42, sunPos: [-12, 20, 14], hemiSky: '#3b4a6b', hemiGnd: '#1e1b24', hemiInt: 0.52, fillInt: 0.25, nightGlow: 1.35, intLight: 1.65 }
};

function applyLighting(mode) {
  const p = LIGHTING_PRESETS[mode] || LIGHTING_PRESETS.golden;
  scene.background.set(p.bg);
  scene.fog.color.set(p.bg);
  groundMesh.material.color.set(p.ground);
  sunLight.color.set(p.sunColor);
  sunLight.intensity = p.sunInt;
  sunLight.position.set(...p.sunPos);
  hemiLight.color.set(p.hemiSky);
  hemiLight.groundColor.set(p.hemiGnd);
  hemiLight.intensity = p.hemiInt;
  fillLight.intensity = p.fillInt;
}
