// =========================================================================
// 3. THREE.JS SCENE, DUAL PROJECTION (PERSP / ORTHO), LIGHTING & GLSL POST-FX
// =========================================================================
const canvas = document.getElementById('viewport');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = state.exposure;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#e8d5be');
scene.fog = new THREE.Fog('#e8d5be', 42, 95);

const perspCamera = new THREE.PerspectiveCamera(state.fov, window.innerWidth / window.innerHeight, 0.12, 200);
const orthoCamera = new THREE.OrthographicCamera(-12, 12, 12, -12, 0.1, 200);
let activeCamera = perspCamera;

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

function updateOrthoFrustum() {
  const aspect = window.innerWidth / Math.max(1, window.innerHeight);
  const frustumH = Math.max(6, orbit.spherical.radius * 0.62);
  orthoCamera.left = -frustumH * aspect * 0.5;
  orthoCamera.right = frustumH * aspect * 0.5;
  orthoCamera.top = frustumH * 0.5;
  orthoCamera.bottom = -frustumH * 0.5;
  orthoCamera.updateProjectionMatrix();
}

function setProjectionMode(mode) {
  state.projection = mode;
  activeCamera = (mode === 'orthographic' && state.viewMode !== 'walk') ? orthoCamera : perspCamera;
  if (activeCamera === orthoCamera) updateOrthoFrustum();
}

function placeFpsAtFloor(floorIdx) {
  const baseLift = (state.showEnvironment && state.showSidewalk) ? 0.22 : 0;
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
    activeCamera = perspCamera;
    const speed = 0.085;
    const fwdVec = new THREE.Vector3(-Math.sin(fps.yaw), 0, -Math.cos(fps.yaw));
    const rightVec = new THREE.Vector3(Math.cos(fps.yaw), 0, -Math.sin(fps.yaw));
    if (fps.keys.fwd) fps.pos.addScaledVector(fwdVec, speed);
    if (fps.keys.back) fps.pos.addScaledVector(fwdVec, -speed);
    if (fps.keys.right) fps.pos.addScaledVector(rightVec, speed);
    if (fps.keys.left) fps.pos.addScaledVector(rightVec, -speed);
    const maxX = state.width / 2 + 3.8, maxZ = state.depth / 2 + 4.4;
    fps.pos.x = Math.max(-maxX, Math.min(maxX, fps.pos.x));
    fps.pos.z = Math.max(-maxZ, Math.min(maxZ, fps.pos.z));
    perspCamera.position.copy(fps.pos);
    const lookDir = new THREE.Vector3(-Math.sin(fps.yaw) * Math.cos(fps.pitch), Math.sin(fps.pitch), -Math.cos(fps.yaw) * Math.cos(fps.pitch));
    perspCamera.lookAt(fps.pos.clone().add(lookDir));
  } else {
    activeCamera = state.projection === 'orthographic' ? orthoCamera : perspCamera;
    orbit.spherical.radius += (orbit.desiredSpherical.radius - orbit.spherical.radius) * 0.14;
    orbit.spherical.phi += (orbit.desiredSpherical.phi - orbit.spherical.phi) * 0.14;
    orbit.spherical.theta += (orbit.desiredSpherical.theta - orbit.spherical.theta) * 0.14;
    orbit.target.lerp(orbit.desiredTarget, 0.14);
    if (state.autoRotate && !orbit.isDragging) orbit.desiredSpherical.theta += 0.0045;
    const offset = new THREE.Vector3().setFromSpherical(orbit.spherical);
    activeCamera.position.copy(orbit.target).add(offset);
    activeCamera.lookAt(orbit.target);
    if (activeCamera === orthoCamera) updateOrthoFrustum();
  }
}

canvas.addEventListener('pointerdown', (e) => {
  orbit.isDragging = true;
  orbit.isPanning = e.button === 2 || e.shiftKey;
  orbit.prevX = e.clientX; orbit.prevY = e.clientY;
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!orbit.isDragging) return;
  const dx = e.clientX - orbit.prevX, dy = e.clientY - orbit.prevY;
  orbit.prevX = e.clientX; orbit.prevY = e.clientY;
  if (state.viewMode === 'walk') {
    fps.yaw -= dx * 0.0055;
    fps.pitch = Math.max(-0.85, Math.min(0.85, fps.pitch - dy * 0.0045));
  } else if (orbit.isPanning) {
    const panScale = orbit.desiredSpherical.radius * 0.0014;
    const right = new THREE.Vector3().setFromMatrixColumn(activeCamera.matrix, 0);
    const up = new THREE.Vector3().setFromMatrixColumn(activeCamera.matrix, 1);
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
    orbit.desiredSpherical.radius = Math.max(7, Math.min(54, orbit.desiredSpherical.radius + e.deltaY * 0.015));
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
sunLight.shadow.mapSize.width = 2048; sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near = 2; sunLight.shadow.camera.far = 65;
sunLight.shadow.camera.left = -18; sunLight.shadow.camera.right = 18;
sunLight.shadow.camera.top = 18; sunLight.shadow.camera.bottom = -18;
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

const postScene = new THREE.Scene();
const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
let renderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
  minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat
});

const postMat = new THREE.ShaderMaterial({
  uniforms: {
    tDiffuse: { value: renderTarget.texture },
    uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    uDofAmount: { value: state.dofAmount },
    uDofFocus: { value: state.dofFocus },
    uBloom: { value: state.bloomAmount },
    uOutline: { value: state.outlineAmount },
    uVignette: { value: state.vignetteAmount },
    uWarmth: { value: state.warmthAmount }
  },
  vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec2 uResolution;
    uniform float uDofAmount;
    uniform float uDofFocus;
    uniform float uBloom;
    uniform float uOutline;
    uniform float uVignette;
    uniform float uWarmth;
    varying vec2 vUv;
    float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
    void main() {
      vec2 texel = 1.0 / uResolution;
      vec3 center = texture2D(tDiffuse, vUv).rgb;
      float distFromFocus = abs(vUv.y - uDofFocus);
      float blurFactor = smoothstep(0.10, 0.52, distFromFocus) * uDofAmount * 5.2;
      vec3 col = center;
      if (blurFactor > 0.05) {
        vec3 acc = center * 0.20;
        vec2 o1 = texel * blurFactor;
        vec2 o2 = texel * blurFactor * 2.0;
        acc += texture2D(tDiffuse, vUv + vec2( o1.x,  0.0)).rgb * 0.10;
        acc += texture2D(tDiffuse, vUv + vec2(-o1.x,  0.0)).rgb * 0.10;
        acc += texture2D(tDiffuse, vUv + vec2( 0.0,  o1.y)).rgb * 0.10;
        acc += texture2D(tDiffuse, vUv + vec2( 0.0, -o1.y)).rgb * 0.10;
        acc += texture2D(tDiffuse, vUv + vec2( o1.x,  o1.y)).rgb * 0.06;
        acc += texture2D(tDiffuse, vUv + vec2(-o1.x,  o1.y)).rgb * 0.06;
        acc += texture2D(tDiffuse, vUv + vec2( o1.x, -o1.y)).rgb * 0.06;
        acc += texture2D(tDiffuse, vUv + vec2(-o1.x, -o1.y)).rgb * 0.06;
        acc += texture2D(tDiffuse, vUv + vec2( o2.x,  0.0)).rgb * 0.04;
        acc += texture2D(tDiffuse, vUv + vec2(-o2.x,  0.0)).rgb * 0.04;
        acc += texture2D(tDiffuse, vUv + vec2( 0.0,  o2.y)).rgb * 0.04;
        acc += texture2D(tDiffuse, vUv + vec2( 0.0, -o2.y)).rgb * 0.04;
        col = acc;
      }
      if (uBloom > 0.01) {
        vec3 bloomAcc = vec3(0.0);
        vec2 bo = texel * 3.5;
        bloomAcc += max(texture2D(tDiffuse, vUv + vec2( bo.x,  bo.y)).rgb - vec3(0.72), vec3(0.0));
        bloomAcc += max(texture2D(tDiffuse, vUv + vec2(-bo.x,  bo.y)).rgb - vec3(0.72), vec3(0.0));
        bloomAcc += max(texture2D(tDiffuse, vUv + vec2( bo.x, -bo.y)).rgb - vec3(0.72), vec3(0.0));
        bloomAcc += max(texture2D(tDiffuse, vUv + vec2(-bo.x, -bo.y)).rgb - vec3(0.72), vec3(0.0));
        col += bloomAcc * (uBloom * 0.35);
      }
      if (uOutline > 0.01) {
        float tl = luma(texture2D(tDiffuse, vUv + vec2(-texel.x,  texel.y)).rgb);
        float t  = luma(texture2D(tDiffuse, vUv + vec2(     0.0,  texel.y)).rgb);
        float tr = luma(texture2D(tDiffuse, vUv + vec2( texel.x,  texel.y)).rgb);
        float l  = luma(texture2D(tDiffuse, vUv + vec2(-texel.x,      0.0)).rgb);
        float r  = luma(texture2D(tDiffuse, vUv + vec2( texel.x,      0.0)).rgb);
        float bl = luma(texture2D(tDiffuse, vUv + vec2(-texel.x, -texel.y)).rgb);
        float b  = luma(texture2D(tDiffuse, vUv + vec2(     0.0, -texel.y)).rgb);
        float br = luma(texture2D(tDiffuse, vUv + vec2( texel.x, -texel.y)).rgb);
        float gx = -tl - 2.0*l - bl + tr + 2.0*r + br;
        float gy = -tl - 2.0*t - tr + bl + 2.0*b + br;
        float edge = smoothstep(0.14, 0.42, sqrt(gx*gx + gy*gy));
        col = mix(col, vec3(0.16, 0.11, 0.08), edge * uOutline * 0.65);
      }
      col.r *= 1.0 + uWarmth * 0.08;
      col.g *= 1.0 + uWarmth * 0.03;
      col.b *= 1.0 - uWarmth * 0.06;
      if (uVignette > 0.01) {
        float d = distance(vUv, vec2(0.5));
        float vig = smoothstep(0.85, 0.32, d);
        col *= mix(1.0, vig, uVignette * 0.55);
      }
      gl_FragColor = vec4(col, 1.0);
    }
  `
});
postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), postMat));

function renderFrame() {
  renderer.toneMappingExposure = state.exposure;
  if (state.postFxEnabled && !state.wireframe) {
    postMat.uniforms.uDofAmount.value = state.viewMode === 'walk' ? state.dofAmount * 0.25 : state.dofAmount;
    postMat.uniforms.uDofFocus.value = state.dofFocus;
    postMat.uniforms.uBloom.value = state.bloomAmount;
    postMat.uniforms.uOutline.value = state.outlineAmount;
    postMat.uniforms.uVignette.value = state.vignetteAmount;
    postMat.uniforms.uWarmth.value = state.warmthAmount;
    renderer.setRenderTarget(renderTarget);
    renderer.render(scene, activeCamera);
    renderer.setRenderTarget(null);
    renderer.render(postScene, postCam);
  } else {
    renderer.setRenderTarget(null);
    renderer.render(scene, activeCamera);
  }
}
