// =========================================================================
// 4C. MAIN PROCEDURAL BUILDING GENERATOR (Decoupled Shell + Sims-4 Per-Floor Cutaway)
// =========================================================================
const buildingGroup = new THREE.Group();
scene.add(buildingGroup);

const structureGroup = new THREE.Group();
const interiorRootGroup = new THREE.Group();
const environmentGroup = new THREE.Group();
buildingGroup.add(structureGroup, interiorRootGroup, environmentGroup);

let floorMeta = [];
let floorInteriorGroups = [];
let roofGroup = null;
let lastMats = null;

function clearGroup(grp) {
  while (grp.children.length > 0) {
    const obj = grp.children[0];
    grp.remove(obj);
    obj.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
        else child.material.dispose();
      }
    });
  }
}

function addMesh(parent, geo, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, cast = true, receive = true) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  m.castShadow = cast;
  m.receiveShadow = receive;
  parent.add(m);
  return m;
}

function buildWindowUnit(mats, opts = {}) {
  const g = new THREE.Group();
  const w = opts.w || 1.05, h = opts.h || 1.35;
  if (state.hasInterior) {
    addMesh(g, new THREE.BoxGeometry(w + 0.22, 0.11, 0.16), mats.trim, 0, h / 2 + 0.045, 0.0);
    addMesh(g, new THREE.BoxGeometry(w + 0.30, 0.11, 0.26), mats.trim, 0, -h / 2 - 0.045, 0.05);
    addMesh(g, new THREE.BoxGeometry(0.10, h + 0.02, 0.16), mats.trim, -w / 2 - 0.045, 0, 0.0);
    addMesh(g, new THREE.BoxGeometry(0.10, h + 0.02, 0.16), mats.trim, w / 2 + 0.045, 0, 0.0);
    const wz = -0.10;
    addMesh(g, new THREE.BoxGeometry(w, 0.055, 0.07), mats.wood, 0, h / 2 - 0.025, wz);
    addMesh(g, new THREE.BoxGeometry(w, 0.055, 0.07), mats.wood, 0, -h / 2 + 0.025, wz);
    addMesh(g, new THREE.BoxGeometry(0.055, h, 0.07), mats.wood, -w / 2 + 0.025, 0, wz);
    addMesh(g, new THREE.BoxGeometry(0.055, h, 0.07), mats.wood, w / 2 - 0.025, 0, wz);
    addMesh(g, new THREE.BoxGeometry(0.04, h - 0.06, 0.05), mats.wood, 0, 0, wz);
    addMesh(g, new THREE.BoxGeometry(w - 0.06, 0.04, 0.05), mats.wood, 0, 0.08, wz);
    addMesh(g, new THREE.PlaneGeometry(w - 0.08, h - 0.08), mats.clearGlass, 0, 0, wz, 0, 0, 0, false, false);
  } else {
    addMesh(g, new THREE.BoxGeometry(w + 0.16, h + 0.16, 0.12), mats.trim, 0, 0, 0.02);
    addMesh(g, new THREE.BoxGeometry(w - 0.08, h - 0.08, 0.05), mats.glass, 0, 0, 0.05, 0, 0, 0, false, false);
    addMesh(g, new THREE.BoxGeometry(0.05, h - 0.06, 0.08), mats.wood, 0, 0, 0.07);
    addMesh(g, new THREE.BoxGeometry(w - 0.06, 0.05, 0.08), mats.wood, 0, 0.08, 0.07);
    addMesh(g, new THREE.BoxGeometry(w + 0.28, 0.11, 0.24), mats.trim, 0, -h / 2 - 0.06, 0.08);
  }
  if (opts.shutters) {
    const sw = w * 0.46, sh = h + 0.02;
    [-1, 1].forEach((side) => {
      const shutterGrp = new THREE.Group();
      shutterGrp.position.set(side * (w / 2 + 0.06), 0, 0.09);
      shutterGrp.rotation.y = side * (-0.18);
      addMesh(shutterGrp, new THREE.BoxGeometry(sw, sh, 0.05), mats.shutter, side * (sw / 2), 0, 0);
      for (let i = 0; i < 6; i++) {
        const sy = -sh * 0.36 + (i / 5) * (sh * 0.72);
        addMesh(shutterGrp, new THREE.BoxGeometry(sw * 0.76, 0.04, 0.07), mats.shutterDark, side * (sw / 2), sy, 0.01);
      }
      g.add(shutterGrp);
    });
  }
  if (opts.flowerBox) {
    const bw = w * 0.92;
    addMesh(g, new THREE.BoxGeometry(bw, 0.22, 0.24), mats.terracottaPot, 0, -h / 2 - 0.14, 0.18);
    for (let i = 0; i < 5; i++) {
      const fx = -bw * 0.36 + (i / 4) * bw * 0.72;
      addMesh(g, new THREE.IcosahedronGeometry(0.13, 0), mats.foliage, fx, -h / 2 + 0.01, 0.20);
      if (i % 2 === 0) addMesh(g, new THREE.IcosahedronGeometry(0.06, 0), mats.flower, fx + 0.03, -h / 2 + 0.09, 0.25);
    }
  }
  return g;
}

function buildBalcony(mats, w, hasLaundry, rng) {
  const g = new THREE.Group();
  const d = 0.95, railH = 0.85;
  addMesh(g, new THREE.BoxGeometry(w, 0.16, d), mats.trim, 0, 0, d / 2);
  const brackets = Math.max(2, Math.floor(w / 1.1));
  for (let i = 0; i < brackets; i++) addMesh(g, new THREE.BoxGeometry(0.14, 0.24, 0.45), mats.trim, -w * 0.42 + (i / Math.max(1, brackets - 1)) * (w * 0.84), -0.18, 0.24);
  addMesh(g, new THREE.BoxGeometry(w, 0.05, 0.05), mats.iron, 0, railH, d - 0.04);
  addMesh(g, new THREE.BoxGeometry(0.05, 0.05, d), mats.iron, -w / 2 + 0.03, railH, d / 2);
  addMesh(g, new THREE.BoxGeometry(0.05, 0.05, d), mats.iron, w / 2 - 0.03, railH, d / 2);
  const posts = Math.max(5, Math.floor(w * 3.5));
  for (let i = 0; i <= posts; i++) addMesh(g, new THREE.CylinderGeometry(0.018, 0.018, railH, 6), mats.iron, -w / 2 + 0.04 + (i / posts) * (w - 0.08), railH / 2, d - 0.04);
  for (let i = 1; i <= 3; i++) {
    const pz = (i / 4) * d;
    addMesh(g, new THREE.CylinderGeometry(0.018, 0.018, railH, 6), mats.iron, -w / 2 + 0.03, railH / 2, pz);
    addMesh(g, new THREE.CylinderGeometry(0.018, 0.018, railH, 6), mats.iron, w / 2 - 0.03, railH / 2, pz);
  }
  const pot = buildPottedPlant(mats, 0.55, rng); pot.position.set(w * 0.32, 0.08, d * 0.5); g.add(pot);
  if (hasLaundry && w >= 1.8) {
    const clothColors = ['#f2a7a7', '#f7f3eb', '#9dc3e6', '#f7d894'];
    for (let i = 0; i < 3; i++) {
      const cMat = new THREE.MeshStandardMaterial({ color: clothColors[(i + Math.floor(rng() * 4)) % 4], roughness: 0.85, wireframe: state.wireframe });
      addMesh(g, new THREE.BoxGeometry(0.32, 0.46 + rng() * 0.14, 0.04), cMat, -w * 0.28 + i * 0.42, railH - 0.24, d + 0.01, 0.08, 0, 0);
    }
  }
  return g;
}

function buildPottedPlant(mats, scale = 1, rng = Math.random) {
  const g = new THREE.Group();
  addMesh(g, new THREE.CylinderGeometry(0.24 * scale, 0.17 * scale, 0.34 * scale, 10), mats.terracottaPot, 0, 0.17 * scale, 0);
  addMesh(g, new THREE.CylinderGeometry(0.27 * scale, 0.26 * scale, 0.07 * scale, 10), mats.terracottaPot, 0, 0.34 * scale, 0);
  addMesh(g, new THREE.IcosahedronGeometry(0.32 * scale, 1), mats.foliage, 0, 0.56 * scale, 0);
  addMesh(g, new THREE.IcosahedronGeometry(0.22 * scale, 1), mats.foliageLight, 0.14 * scale, 0.68 * scale, 0.1 * scale);
  addMesh(g, new THREE.IcosahedronGeometry(0.20 * scale, 1), mats.foliage, -0.15 * scale, 0.62 * scale, -0.08 * scale);
  if (rng() > 0.45) {
    addMesh(g, new THREE.IcosahedronGeometry(0.08 * scale, 0), mats.flower, 0.12 * scale, 0.78 * scale, 0.15 * scale);
    addMesh(g, new THREE.IcosahedronGeometry(0.07 * scale, 0), mats.flower, -0.12 * scale, 0.74 * scale, 0.14 * scale);
  }
  return g;
}

function buildAwning(mats, width, depth = 1.25) {
  const g = new THREE.Group();
  addMesh(g, new THREE.BoxGeometry(width, 0.09, depth), mats.awning, 0, 0, depth * 0.48, 0.34, 0, 0);
  addMesh(g, new THREE.BoxGeometry(width, 0.24, 0.06), mats.awning, 0, -0.32, depth * 0.92);
  [-1, 1].forEach(s => addMesh(g, new THREE.CylinderGeometry(0.025, 0.025, depth * 0.85, 6), mats.iron, s * (width / 2 - 0.12), -0.22, depth * 0.44, Math.PI / 2 - 0.35, 0, 0));
  return g;
}

function buildACUnit(mats, scale = 1) {
  const g = new THREE.Group();
  addMesh(g, new THREE.BoxGeometry(0.85 * scale, 0.58 * scale, 0.36 * scale), mats.acBody, 0, 0, 0);
  addMesh(g, new THREE.CylinderGeometry(0.20 * scale, 0.20 * scale, 0.04 * scale, 14), mats.darkMetal, -0.12 * scale, 0, 0.18 * scale, Math.PI / 2, 0, 0);
  addMesh(g, new THREE.BoxGeometry(0.22 * scale, 0.38 * scale, 0.04 * scale), mats.acVent, 0.24 * scale, 0, 0.18 * scale);
  return g;
}

function buildWaterTank(mats) {
  const g = new THREE.Group();
  const legH = 0.65;
  [[-0.45, -0.45], [0.45, -0.45], [-0.45, 0.45], [0.45, 0.45]].forEach(([lx, lz]) => addMesh(g, new THREE.CylinderGeometry(0.035, 0.035, legH, 6), mats.iron, lx, legH / 2, lz));
  addMesh(g, new THREE.BoxGeometry(1.05, 0.06, 1.05), mats.iron, 0, legH, 0);
  addMesh(g, new THREE.CylinderGeometry(0.62, 0.64, 1.15, 16), mats.tank, 0, legH + 0.58, 0);
  [0.35, 0.65, 0.95].forEach(ry => addMesh(g, new THREE.TorusGeometry(0.63, 0.035, 6, 18), mats.tank, 0, legH + ry, 0, Math.PI / 2, 0, 0));
  addMesh(g, new THREE.CylinderGeometry(0.45, 0.62, 0.18, 16), mats.tank, 0, legH + 1.24, 0);
  addMesh(g, new THREE.CylinderGeometry(0.24, 0.24, 0.10, 12), mats.darkMetal, 0, legH + 1.36, 0);
  addMesh(g, new THREE.CylinderGeometry(0.035, 0.035, 0.9, 6), mats.iron, 0.68, 0.45, 0);
  addMesh(g, new THREE.CylinderGeometry(0.035, 0.035, 1.4, 6), mats.iron, 1.35, 0.06, 0, 0, 0, Math.PI / 2);
  return g;
}

function buildSatelliteDish(mats) {
  const g = new THREE.Group();
  addMesh(g, new THREE.CylinderGeometry(0.04, 0.05, 0.55, 8), mats.iron, 0, 0.27, 0);
  addMesh(g, new THREE.CylinderGeometry(0.28, 0.30, 0.06, 10), mats.darkMetal, 0, 0.03, 0);
  const dishGrp = new THREE.Group();
  dishGrp.position.set(0, 0.68, 0); dishGrp.rotation.set(-0.55, 0.5, 0);
  addMesh(dishGrp, new THREE.CylinderGeometry(0.52, 0.12, 0.18, 16), mats.acBody, 0, 0, 0, Math.PI / 2, 0, 0);
  addMesh(dishGrp, new THREE.CylinderGeometry(0.02, 0.02, 0.52, 6), mats.iron, 0, 0, 0.26, Math.PI / 2, 0, 0);
  addMesh(dishGrp, new THREE.BoxGeometry(0.08, 0.08, 0.12), mats.darkMetal, 0, 0, 0.52);
  g.add(dishGrp);
  return g;
}

function buildBougainvilleaVine(mats, height, rng) {
  const g = new THREE.Group();
  const clusters = Math.max(8, Math.floor(height * 4.5));
  for (let i = 0; i < clusters; i++) {
    const t = i / clusters, y = 0.4 + t * (height - 0.5), x = Math.sin(t * 7.5 + rng() * 2) * 0.45 + (rng() - 0.5) * 0.25, z = 0.08 + rng() * 0.12, r = 0.18 + rng() * 0.16;
    addMesh(g, new THREE.IcosahedronGeometry(r, 0), i % 3 === 0 ? mats.foliageLight : mats.foliage, x, y, z);
    if (rng() > 0.35) addMesh(g, new THREE.IcosahedronGeometry(r * 0.65, 0), mats.flower, x + (rng() - 0.5) * 0.18, y + 0.05, z + 0.1);
  }
  return g;
}

function buildCafeTableSet(mats) {
  const g = new THREE.Group();
  addMesh(g, new THREE.CylinderGeometry(0.42, 0.42, 0.05, 14), mats.wood, 0, 0.72, 0);
  addMesh(g, new THREE.CylinderGeometry(0.04, 0.04, 0.70, 8), mats.iron, 0, 0.35, 0);
  addMesh(g, new THREE.CylinderGeometry(0.24, 0.28, 0.04, 10), mats.iron, 0, 0.02, 0);
  [-0.62, 0.62].forEach((cx) => {
    const ch = new THREE.Group(); ch.position.set(cx, 0, 0); ch.rotation.y = cx < 0 ? Math.PI / 2 : -Math.PI / 2;
    addMesh(ch, new THREE.BoxGeometry(0.36, 0.05, 0.36), mats.wood, 0, 0.42, 0);
    addMesh(ch, new THREE.BoxGeometry(0.36, 0.42, 0.05), mats.wood, 0, 0.64, -0.16);
    [[-0.14, -0.14], [0.14, -0.14], [-0.14, 0.14], [0.14, 0.14]].forEach(([lx, lz]) => addMesh(ch, new THREE.CylinderGeometry(0.02, 0.02, 0.42, 6), mats.iron, lx, 0.21, lz));
    g.add(ch);
  });
  return g;
}

function buildProduceCrate(mats, fruitHex) {
  const g = new THREE.Group();
  addMesh(g, new THREE.BoxGeometry(0.75, 0.42, 0.55), mats.woodLight, 0, 0.21, 0);
  const fMat = new THREE.MeshStandardMaterial({ color: fruitHex, roughness: 0.45, wireframe: state.wireframe });
  for (let ix = -2; ix <= 2; ix++) for (let iz = -1; iz <= 1; iz++) addMesh(g, new THREE.SphereGeometry(0.085, 8, 6), fMat, ix * 0.13, 0.44 + (ix === 0 ? 0.04 : 0), iz * 0.14);
  return g;
}

function buildStreetLamp(mats, isNight) {
  const g = new THREE.Group();
  addMesh(g, new THREE.CylinderGeometry(0.08, 0.13, 0.45, 8), mats.iron, 0, 0.22, 0);
  addMesh(g, new THREE.CylinderGeometry(0.045, 0.06, 2.5, 8), mats.iron, 0, 1.5, 0);
  const bulbMat = new THREE.MeshStandardMaterial({ color: '#fff4c2', emissive: '#ffbe55', emissiveIntensity: isNight ? 1.8 : 0.35, roughness: 0.2, wireframe: state.wireframe });
  addMesh(g, new THREE.SphereGeometry(0.18, 12, 10), bulbMat, 0, 2.86, 0, 0, 0, 0, false, false);
  addMesh(g, new THREE.ConeGeometry(0.24, 0.14, 8), mats.iron, 0, 3.06, 0);
  return g;
}

function buildWallWithHoles(parent, len, floorH, wallT, openings, mats, addInnerLiner = true) {
  const hw = len / 2;
  const wallShape = new THREE.Shape();
  wallShape.moveTo(-hw, 0); wallShape.lineTo(hw, 0); wallShape.lineTo(hw, floorH); wallShape.lineTo(-hw, floorH); wallShape.closePath();

  const valid = [];
  for (const op of [...openings].sort((a, b) => a.u - b.u)) {
    const minX = op.u - op.w / 2, maxX = op.u + op.w / 2;
    const minY = Math.max(0.04, op.cy - op.h / 2), maxY = Math.min(floorH - 0.10, op.cy + op.h / 2);
    if (minX < -hw + 0.14 || maxX > hw - 0.14 || maxY - minY < 0.25) continue;
    if (valid.length > 0 && minX < valid[valid.length - 1].maxX + 0.12) continue;
    valid.push({ ...op, minX, maxX, minY, maxY });
  }
  for (const op of valid) {
    const hole = new THREE.Path();
    hole.moveTo(op.minX, op.minY); hole.lineTo(op.maxX, op.minY); hole.lineTo(op.maxX, op.maxY); hole.lineTo(op.minX, op.maxY); hole.closePath();
    wallShape.holes.push(hole);
  }
  const extGeo = new THREE.ExtrudeGeometry(wallShape, { depth: wallT, bevelEnabled: false });
  extGeo.translate(0, 0, -wallT);
  const uv = extGeo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 0.18, uv.getY(i) * 0.18);
  addMesh(parent, extGeo, mats.wall, 0, 0, 0);

  if (addInnerLiner) {
    const intGeo = new THREE.ExtrudeGeometry(wallShape, { depth: 0.025, bevelEnabled: false });
    intGeo.translate(0, 0, -wallT - 0.025);
    addMesh(parent, intGeo, mats.intWall, 0, 0, 0, 0, 0, 0, false, true);
  }
  return valid;
}

function buildSimsStubWall(len, wallT, mats) {
  const g = new THREE.Group();
  const h = 0.36;
  addMesh(g, new THREE.BoxGeometry(len, h, wallT), mats.wall, 0, h / 2, -wallT / 2);
  addMesh(g, new THREE.BoxGeometry(len + 0.02, 0.05, wallT + 0.04), mats.trim, 0, h + 0.025, -wallT / 2);
  g.visible = false;
  return g;
}

function buildHollowFloorShell(meta, W, D, floorH, chamfer, f, mats, rng) {
  const floorGrp = meta.floorGrp, hw = W / 2, hd = D / 2, wallT = 0.24;
  const isGround = f === 0, winW = 1.05, winH = 1.35, wy = floorH * 0.52;

  const floorShape = new THREE.Shape();
  floorShape.moveTo(-hw + 0.06, hd - 0.06); floorShape.lineTo(hw - 0.06, hd - 0.06);
  if (chamfer > 0) { floorShape.lineTo(hw - 0.06, -hd + chamfer + 0.04); floorShape.lineTo(hw - chamfer - 0.04, -hd + 0.06); }
  else floorShape.lineTo(hw - 0.06, -hd + 0.06);
  floorShape.lineTo(-hw + 0.06, -hd + 0.06); floorShape.closePath();

  const slabGeo = new THREE.ExtrudeGeometry(floorShape, { depth: 0.14, bevelEnabled: false });
  slabGeo.rotateX(-Math.PI / 2);
  const uvA = slabGeo.attributes.uv;
  for (let i = 0; i < uvA.count; i++) uvA.setXY(i, uvA.getX(i) * 0.22, uvA.getY(i) * 0.22);
  addMesh(floorGrp, slabGeo, isGround ? mats.gfFloor : mats.upperFloor, 0, 0, 0, 0, 0, 0, false, true);

  function makeWallPair(sideKey, x, z, ry, len) {
    const full = new THREE.Group(); full.position.set(x, 0, z); full.rotation.y = ry;
    const stub = buildSimsStubWall(len, wallT, mats); stub.position.set(x, 0, z); stub.rotation.y = ry;
    floorGrp.add(full, stub);
    meta.fullWalls[sideKey] = full; meta.stubWalls[sideKey] = stub;
    return full;
  }

  const frontLen = W - chamfer, frontCenterX = -chamfer / 2;
  const frontWall = makeWallPair('front', frontCenterX, hd, 0, frontLen);
  const frontOpenings = [];
  if (isGround) {
    const isShop = ['pharmacy', 'cafe', 'market', 'office'].includes(state.shopType);
    const openW = isShop ? Math.min(frontLen - 1.1, 5.8) : state.shopType === 'workshop' ? Math.min(frontLen * 0.48, 4.4) : state.shopType === 'civic' ? Math.min(frontLen * 0.55, 5.2) : 1.45;
    const openH = Math.min(floorH * 0.78, 2.45);
    frontOpenings.push({ u: 0, cy: openH / 2 + 0.02, w: openW, h: openH, isDoor: true });
    if (!isShop && state.shopType === 'residential' && W >= 7.0) {
      [-W * 0.32 - frontCenterX, W * 0.32 - frontCenterX].forEach(u => { if (Math.abs(u) > 1.7) frontOpenings.push({ u, cy: floorH * 0.54, w: winW, h: winH, isWindow: true, flowerBox: state.hasFlowerBoxes }); });
    }
    const doorW = 1.05, doorH = Math.min(openH - 0.1, 2.15);
    const doorPivot = new THREE.Group();
    doorPivot.position.set(isShop ? (-openW / 2 + 0.1) : (-doorW / 2), 0.08, -wallT / 2);
    doorPivot.rotation.y = state.doorOpen ? -1.32 : 0;
    addMesh(doorPivot, new THREE.BoxGeometry(doorW, doorH, 0.07), mats.wood, doorW / 2, doorH / 2, 0);
    addMesh(doorPivot, new THREE.PlaneGeometry(doorW * 0.65, doorH * 0.45), mats.clearGlass, doorW / 2, doorH * 0.66, 0.04, 0, 0, 0, false, false);
    addMesh(doorPivot, new THREE.SphereGeometry(0.045, 8, 6), mats.brass, doorW - 0.12, doorH * 0.45, 0.06);
    frontWall.add(doorPivot);
  } else {
    const availF = frontLen - 1.2, cntF = Math.max(1, Math.round((availF / 2.35) * state.winDensity)), stepF = availF / cntF;
    for (let i = 0; i < cntF; i++) {
      const u = -frontLen / 2 + 0.6 + stepF / 2 + i * stepF;
      const hasBal = state.hasBalconies && (i === Math.floor(cntF / 2) || (cntF >= 3 && i === 0 && f === 1));
      frontOpenings.push({ u, cy: wy, w: winW, h: winH, isWindow: true, hasBal, balW: Math.min(2.3, stepF * 0.88), flowerBox: state.hasFlowerBoxes && !hasBal });
    }
  }
  buildWallWithHoles(frontWall, frontLen, floorH, wallT, frontOpenings, mats, true).forEach(op => {
    if (op.isWindow) {
      const win = buildWindowUnit(mats, { w: op.w, h: op.h, shutters: state.hasShutters, flowerBox: op.flowerBox });
      win.position.set(op.u, op.cy, 0); frontWall.add(win);
      if (op.hasBal) { const bal = buildBalcony(mats, op.balW, state.hasLaundry && f === state.floors - 1, rng); bal.position.set(op.u, 0.08, 0); frontWall.add(bal); }
    }
  });

  const backWall = makeWallPair('back', 0, -hd, Math.PI, W);
  const backOpenings = [];
  if (!isGround) {
    const cntB = Math.max(1, Math.round(((W - 1.2) / 2.8) * state.winDensity)), stepB = (W - 1.2) / cntB;
    for (let i = 0; i < cntB; i++) backOpenings.push({ u: -hw + 0.6 + stepB / 2 + i * stepB, cy: wy, w: winW, h: winH, isWindow: true });
  }
  buildWallWithHoles(backWall, W, floorH, wallT, backOpenings, mats, true).forEach(op => {
    if (op.isWindow) { const win = buildWindowUnit(mats, { w: op.w, h: op.h, shutters: state.hasShutters, flowerBox: false }); win.position.set(op.u, op.cy, 0); backWall.add(win); }
  });

  const leftWall = makeWallPair('left', -hw, 0, -Math.PI / 2, D);
  const leftOpenings = [];
  if (isGround) { if (D >= 5.5) leftOpenings.push({ u: 0, cy: floorH * 0.56, w: winW, h: winH, isWindow: true, flowerBox: state.hasFlowerBoxes }); }
  else {
    const cntL = Math.max(1, Math.round(((D - 1.2) / 2.6) * state.winDensity)), stepL = (D - 1.2) / cntL;
    for (let i = 0; i < cntL; i++) leftOpenings.push({ u: -hd + 0.6 + stepL / 2 + i * stepL, cy: wy, w: winW, h: winH, isWindow: true, flowerBox: state.hasFlowerBoxes && rng() > 0.4 });
  }
  buildWallWithHoles(leftWall, D, floorH, wallT, leftOpenings, mats, true).forEach(op => {
    if (op.isWindow) { const win = buildWindowUnit(mats, { w: op.w, h: op.h, shutters: state.hasShutters, flowerBox: op.flowerBox }); win.position.set(op.u, op.cy, 0); leftWall.add(win); }
  });

  const rightLen = D - chamfer;
  const rightWall = makeWallPair('right', hw, -chamfer / 2, Math.PI / 2, rightLen);
  const rightOpenings = [];
  if (isGround) { if (D >= 5.5) rightOpenings.push({ u: rightLen * 0.15, cy: floorH * 0.56, w: winW, h: winH, isWindow: true, flowerBox: state.hasFlowerBoxes }); }
  else {
    const availR = rightLen - 1.2, cntR = Math.max(1, Math.round((availR / 2.5) * state.winDensity)), stepR = availR / cntR;
    for (let i = 0; i < cntR; i++) {
      const u = -rightLen / 2 + 0.6 + stepR / 2 + i * stepR, hasBal = state.hasBalconies && i === 0 && f === 1 && D >= 6.5;
      rightOpenings.push({ u, cy: wy, w: winW, h: winH, isWindow: true, hasBal, flowerBox: state.hasFlowerBoxes && !hasBal });
    }
  }
  buildWallWithHoles(rightWall, rightLen, floorH, wallT, rightOpenings, mats, true).forEach(op => {
    if (op.isWindow) {
      const win = buildWindowUnit(mats, { w: op.w, h: op.h, shutters: state.hasShutters, flowerBox: op.flowerBox });
      win.position.set(op.u, op.cy, 0); rightWall.add(win);
      if (op.hasBal) { const bal = buildBalcony(mats, 1.9, state.hasLaundry, rng); bal.position.set(op.u, 0.08, 0); rightWall.add(bal); }
    }
  });

  if (chamfer > 0) {
    const cLen = chamfer * Math.SQRT2 + 0.12;
    const cWall = makeWallPair('chamfer', hw - chamfer / 2, hd - chamfer / 2, Math.PI / 4, cLen);
    const cOpenings = isGround ? [{ u: 0, cy: 1.15, w: Math.max(0.9, cLen - 0.56), h: 2.26, isDoor: true }] : [{ u: 0, cy: wy, w: 0.9, h: 1.25, isWindow: true, flowerBox: state.hasFlowerBoxes }];
    buildWallWithHoles(cWall, cLen, floorH, wallT, cOpenings, mats, true).forEach(op => {
      if (op.isWindow) { const win = buildWindowUnit(mats, { w: op.w, h: op.h, shutters: state.hasShutters, flowerBox: op.flowerBox }); win.position.set(op.u, op.cy, 0); cWall.add(win); }
    });
  }

  const isTop = f === state.floors - 1, beltH = isTop ? 0.22 : 0.11, beltOut = isTop ? 0.16 : 0.07;
  addMesh(frontWall, new THREE.BoxGeometry(frontLen + beltOut, beltH, 0.18), mats.trim, 0, floorH - beltH / 2, beltOut / 2);
  addMesh(backWall, new THREE.BoxGeometry(W + beltOut * 2, beltH, 0.18), mats.trim, 0, floorH - beltH / 2, beltOut / 2);
  addMesh(leftWall, new THREE.BoxGeometry(D + beltOut * 2, beltH, 0.18), mats.trim, 0, floorH - beltH / 2, beltOut / 2);
  addMesh(rightWall, new THREE.BoxGeometry(rightLen + beltOut, beltH, 0.18), mats.trim, 0, floorH - beltH / 2, beltOut / 2);
}

function buildSharedMaterials() {
  const lp = LIGHTING_PRESETS[state.lighting] || LIGHTING_PRESETS.golden, isNight = state.lighting === 'night', wf = state.wireframe;
  const gfFloorStyle = state.shopType === 'pharmacy' ? 'checker' : state.shopType === 'civic' ? 'marble' : state.shopType === 'cafe' ? 'terracotta' : state.shopType === 'workshop' ? 'concrete' : 'wood';
  const shutterColor = new THREE.Color(state.shutter);
  return {
    wall: new THREE.MeshStandardMaterial({ map: createStuccoTexture(state.wall, state.weathering, state.seed), roughness: 0.88, metalness: 0.02, wireframe: wf }),
    intWall: new THREE.MeshStandardMaterial({ color: '#f4ebe0', roughness: 0.92, wireframe: wf }),
    gfFloor: new THREE.MeshStandardMaterial({ map: createInteriorFloorTexture(gfFloorStyle), roughness: 0.72, wireframe: wf }),
    upperFloor: new THREE.MeshStandardMaterial({ map: createInteriorFloorTexture('wood'), roughness: 0.78, wireframe: wf }),
    trim: new THREE.MeshStandardMaterial({ color: state.trim, roughness: 0.78, metalness: 0.02, wireframe: wf }),
    plinth: new THREE.MeshStandardMaterial({ color: '#b5a493', roughness: 0.9, wireframe: wf }),
    shutter: new THREE.MeshStandardMaterial({ color: shutterColor, roughness: 0.72, wireframe: wf }),
    shutterDark: new THREE.MeshStandardMaterial({ color: shutterColor.clone().multiplyScalar(0.72), roughness: 0.8, wireframe: wf }),
    wood: new THREE.MeshStandardMaterial({ color: '#6b4932', roughness: 0.78, wireframe: wf }),
    woodLight: new THREE.MeshStandardMaterial({ color: '#a87c4f', roughness: 0.82, wireframe: wf }),
    iron: new THREE.MeshStandardMaterial({ color: '#2b3036', roughness: 0.45, metalness: 0.65, wireframe: wf }),
    darkMetal: new THREE.MeshStandardMaterial({ color: '#454c54', roughness: 0.5, metalness: 0.5, wireframe: wf }),
    brass: new THREE.MeshStandardMaterial({ color: '#d4a84f', roughness: 0.3, metalness: 0.8, wireframe: wf }),
    acBody: new THREE.MeshStandardMaterial({ color: '#e6e2da', roughness: 0.55, metalness: 0.1, wireframe: wf }),
    acVent: new THREE.MeshStandardMaterial({ color: '#5b6169', roughness: 0.6, wireframe: wf }),
    tank: new THREE.MeshStandardMaterial({ color: '#586270', roughness: 0.48, metalness: 0.15, wireframe: wf }),
    awning: new THREE.MeshStandardMaterial({ map: createAwningTexture(state.awning), roughness: 0.85, wireframe: wf }),
    terracotta: new THREE.MeshStandardMaterial({ map: createTerracottaTexture(state.roof, state.seed), roughness: 0.78, wireframe: wf }),
    roofDeck: new THREE.MeshStandardMaterial({ color: '#b8a898', roughness: 0.95, wireframe: wf }),
    terracottaPot: new THREE.MeshStandardMaterial({ color: '#c4653f', roughness: 0.8, wireframe: wf }),
    foliage: new THREE.MeshStandardMaterial({ color: '#4a8540', roughness: 0.82, wireframe: wf }),
    foliageLight: new THREE.MeshStandardMaterial({ color: '#6ca64f', roughness: 0.8, wireframe: wf }),
    citrus: new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.45, wireframe: wf }),
    flower: new THREE.MeshStandardMaterial({ color: state.flower, roughness: 0.65, wireframe: wf }),
    warmBulb: new THREE.MeshStandardMaterial({ color: '#fff4cc', emissive: '#ffbb55', emissiveIntensity: 1.5, roughness: 0.2, wireframe: wf }),
    glass: new THREE.MeshStandardMaterial({ color: isNight ? '#ffd285' : '#4a6173', emissive: '#ffaa44', emissiveIntensity: lp.nightGlow, roughness: 0.18, metalness: 0.25, wireframe: wf }),
    clearGlass: new THREE.MeshStandardMaterial({ color: '#d8eef8', transparent: true, opacity: 0.24, roughness: 0.1, metalness: 0.15, side: THREE.DoubleSide, wireframe: wf }),
    shopGlass: state.hasInterior
      ? new THREE.MeshStandardMaterial({ color: '#e6f4fa', transparent: true, opacity: 0.22, roughness: 0.12, metalness: 0.1, side: THREE.DoubleSide, wireframe: wf })
      : new THREE.MeshStandardMaterial({ color: '#ffdca3', emissive: '#ffae42', emissiveIntensity: isNight ? 1.55 : 0.42, roughness: 0.2, metalness: 0.1, wireframe: wf }),
    sidewalk: new THREE.MeshStandardMaterial({ map: createSidewalkTexture(), roughness: 0.92, wireframe: wf }),
    curbDark: new THREE.MeshStandardMaterial({ color: '#393e46', roughness: 0.85, wireframe: wf }),
    curbLight: new THREE.MeshStandardMaterial({ color: '#ede4d8', roughness: 0.85, wireframe: wf }),
    greenSign: new THREE.MeshStandardMaterial({ color: '#279659', emissive: '#1ea85d', emissiveIntensity: isNight ? 0.9 : 0.25, roughness: 0.35, wireframe: wf }),
    banner: new THREE.MeshStandardMaterial({ color: '#b33939', roughness: 0.85, wireframe: wf }),
    clock: new THREE.MeshStandardMaterial({ map: createClockTexture(), roughness: 0.4, wireframe: wf }),
    brick: new THREE.MeshStandardMaterial({ color: '#a8543c', roughness: 0.88, wireframe: wf }),
  };
}

function rebuildInteriorOnly() {
  clearGroup(interiorRootGroup);
  floorInteriorGroups = [];
  if (!state.hasInterior || !state.showInteriorProps) { applyViewModeVisibility(); updateStats(); return; }
  const mats = lastMats || buildSharedMaterials();
  const baseLift = (state.showEnvironment && state.showSidewalk) ? 0.22 : 0;
  for (let f = 0; f < state.floors; f++) {
    const intRng = mulberry32(state.interiorSeed + f * 97);
    const fIntGrp = new THREE.Group(); fIntGrp.position.y = baseLift + f * state.floorH;
    if (f === 0) buildGroundFloorInterior(fIntGrp, state.width, state.depth, state.floorH, mats, intRng);
    else buildUpperApartmentInterior(fIntGrp, state.width, state.depth, state.floorH, mats, intRng);
    floorInteriorGroups.push(fIntGrp); interiorRootGroup.add(fIntGrp);
  }
  applyViewModeVisibility(); updateStats();
}

function rebuildEnvironmentOnly() {
  buildEnvironmentScene(environmentGroup, state.width, state.depth, lastMats || buildSharedMaterials(), state.lighting === 'night');
  updateStats();
}

function generateBuilding() {
  clearGroup(structureGroup);
  floorMeta = [];
  roofGroup = new THREE.Group();
  const rng = mulberry32(state.seed), lp = LIGHTING_PRESETS[state.lighting] || LIGHTING_PRESETS.golden, mats = buildSharedMaterials();
  lastMats = mats;

  const W = state.width, D = state.depth, floors = state.floors, floorH = state.floorH, totalH = floors * floorH;
  const baseLift = (state.showEnvironment && state.showSidewalk) ? 0.22 : 0;
  const hw = W / 2, hd = D / 2, chamfer = state.cornerChamfer ? Math.min(2.1, Math.min(W, D) * 0.28) : 0;

  buildEnvironmentScene(environmentGroup, W, D, mats, state.lighting === 'night');

  const bodyShape = new THREE.Shape();
  bodyShape.moveTo(-hw, hd); bodyShape.lineTo(hw, hd);
  if (chamfer > 0) { bodyShape.lineTo(hw, -hd + chamfer); bodyShape.lineTo(hw - chamfer, -hd); }
  else bodyShape.lineTo(hw, -hd);
  bodyShape.lineTo(-hw, -hd); bodyShape.closePath();

  for (let f = 0; f < floors; f++) {
    const fGrp = new THREE.Group(); fGrp.position.y = baseLift + f * floorH;
    const meta = { floorGrp: fGrp, fullWalls: {}, stubWalls: {}, storefrontGrp: new THREE.Group() };
    fGrp.add(meta.storefrontGrp);
    if (state.hasInterior) {
      buildHollowFloorShell(meta, W, D, floorH, chamfer, f, mats, rng);
      if (f < floors - 1 && W >= 6.0 && D >= 5.5) { const stair = buildInteriorStaircase(mats, floorH); stair.position.set(-hw + 0.85, 0.12, -hd + 0.55); fGrp.add(stair); }
      if (f < 2) { const pt = new THREE.PointLight('#ffd699', lp.intLight, Math.max(W, D) * 1.4, 1.5); pt.position.set(0, floorH - 0.65, 0); fGrp.add(pt); }
    } else {
      const segGeo = new THREE.ExtrudeGeometry(bodyShape, { depth: floorH, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.02, bevelSegments: 1 });
      segGeo.rotateX(-Math.PI / 2);
      const uvAttr = segGeo.attributes.uv; for (let i = 0; i < uvAttr.count; i++) uvAttr.setXY(i, uvAttr.getX(i) * 0.14, uvAttr.getY(i) * 0.14);
      addMesh(fGrp, segGeo, mats.wall, 0, 0, 0);
    }
    floorMeta.push(meta); structureGroup.add(fGrp);
  }

  const m0 = floorMeta[0], sf0 = m0.storefrontGrp, frontUsableW = W - chamfer - 0.8, frontCenterX = -chamfer / 2;
  if (['pharmacy', 'cafe', 'market', 'office'].includes(state.shopType)) {
    const shopW = Math.min(frontUsableW * 0.86, 5.8), shopH = Math.min(floorH * 0.78, 2.45);
    const shopGrp = new THREE.Group(); shopGrp.position.set(frontCenterX, 0, hd);
    const frameMat = state.shopType === 'pharmacy' || state.shopType === 'office' ? mats.shutter : mats.wood;
    addMesh(shopGrp, new THREE.BoxGeometry(shopW + 0.3, 0.22, 0.26), frameMat, 0, shopH + 0.08, 0.06);
    addMesh(shopGrp, new THREE.BoxGeometry(0.22, shopH, 0.26), frameMat, -shopW / 2 - 0.04, shopH / 2, 0.06);
    addMesh(shopGrp, new THREE.BoxGeometry(0.22, shopH, 0.26), frameMat, shopW / 2 + 0.04, shopH / 2, 0.06);
    const winStart = -shopW / 2 + 1.25, winSpan = Math.max(0.8, shopW - 1.35), winCenter = winStart + winSpan / 2;
    addMesh(shopGrp, new THREE.BoxGeometry(winSpan, 0.42, 0.22), frameMat, winCenter, 0.21, 0.04);
    addMesh(shopGrp, new THREE.BoxGeometry(winSpan, shopH - 0.45, 0.04), mats.shopGlass, winCenter, 0.42 + (shopH - 0.45) / 2, 0.04, 0, 0, 0, false, false);
    addMesh(shopGrp, new THREE.BoxGeometry(0.10, shopH, 0.20), frameMat, winStart - 0.05, shopH / 2, 0.05);
    if (state.hasAwning) { const awning = buildAwning(mats, shopW + 0.45, 1.25); awning.position.set(0, shopH + 0.22, 0.12); shopGrp.add(awning); }
    if (state.shopType === 'pharmacy') {
      const crossGrp = new THREE.Group(); crossGrp.position.set(0, shopH + 0.45, 0.22);
      addMesh(crossGrp, new THREE.BoxGeometry(0.75, 0.75, 0.14), mats.trim, 0, 0, 0);
      addMesh(crossGrp, new THREE.BoxGeometry(0.52, 0.18, 0.18), mats.greenSign, 0, 0, 0.02);
      addMesh(crossGrp, new THREE.BoxGeometry(0.18, 0.52, 0.18), mats.greenSign, 0, 0, 0.02);
      shopGrp.add(crossGrp);
    } else if (state.shopType === 'market') {
      const fruitColors = ['#f59e0b', '#dc2626', '#65a30d', '#facc15', '#ea580c'];
      const crates = Math.max(2, Math.floor(winSpan / 0.95));
      for (let i = 0; i < crates; i++) {
        const cr = buildProduceCrate(mats, fruitColors[i % 5]);
        cr.position.set(winStart + 0.45 + (i / Math.max(1, crates - 1)) * Math.max(0.1, winSpan - 0.9), 0, 0.65);
        shopGrp.add(cr);
      }
    } else if (state.shopType === 'office') {
      addMesh(shopGrp, new THREE.BoxGeometry(1.5, 0.55, 0.14), mats.trim, 0, shopH + 0.35, 0.14);
      addMesh(shopGrp, new THREE.BoxGeometry(0.45, 0.32, 0.18), mats.iron, 0, shopH + 0.35, 0.16);
      addMesh(shopGrp, new THREE.BoxGeometry(1.05, 0.82, 0.10), mats.woodLight, shopW / 2 + 0.68, 1.55, 0.06);
    }
    sf0.add(shopGrp);
    if (chamfer > 0) {
      const cornerGrp = new THREE.Group(); cornerGrp.position.set(hw - chamfer / 2, 0, hd - chamfer / 2); cornerGrp.rotation.y = Math.PI / 4;
      addMesh(cornerGrp, new THREE.BoxGeometry(chamfer * Math.SQRT2 * 0.78, 0.22, 0.22), mats.shutter, 0, 2.32, 0.04);
      if (state.shopType === 'pharmacy') {
        addMesh(cornerGrp, new THREE.CylinderGeometry(0.4, 0.4, 0.12, 16), mats.trim, 0, 2.7, 0.1, Math.PI / 2, 0, 0);
        addMesh(cornerGrp, new THREE.BoxGeometry(0.48, 0.16, 0.16), mats.greenSign, 0, 2.7, 0.12);
        addMesh(cornerGrp, new THREE.BoxGeometry(0.16, 0.48, 0.16), mats.greenSign, 0, 2.7, 0.12);
      }
      sf0.add(cornerGrp);
    }
  } else if (state.shopType === 'civic') {
    addMesh(sf0, new THREE.BoxGeometry(3.6, 0.16, 1.1), mats.trim, 0, 0.08, hd + 0.55);
    addMesh(sf0, new THREE.BoxGeometry(2.9, 0.28, 0.65), mats.trim, 0, 0.14, hd + 0.32);
    [-2.2, 2.2].forEach(bx => { addMesh(sf0, new THREE.BoxGeometry(0.42, 1.15, 0.06), mats.banner, bx, floorH + 0.45, hd + 0.12); addMesh(sf0, new THREE.BoxGeometry(0.52, 0.08, 0.10), mats.wood, bx, floorH + 1.04, hd + 0.12); });
  } else if (state.shopType === 'workshop') {
    addMesh(sf0, new THREE.BoxGeometry(Math.min(W * 0.48, 4.4) + 0.3, 0.25, 0.24), mats.darkMetal, 0, Math.min(floorH * 0.78, 2.45) + 0.08, hd + 0.06);
  } else {
    addMesh(sf0, new THREE.BoxGeometry(1.9, 0.2, 0.75), mats.trim, frontCenterX, 0.1, hd + 0.38);
  }

  if (state.hasWallAC) {
    const ac1 = buildACUnit(mats, 0.9); ac1.position.set(-hw + 0.65, floorH - 0.35, hd + 0.22); sf0.add(ac1);
    const ac2 = buildACUnit(mats, 0.9); ac2.position.set(hw + 0.22, floorH * 0.72, -hd * 0.52); ac2.rotation.y = Math.PI / 2;
    if (m0.fullWalls.right) m0.fullWalls.right.add(ac2); else m0.floorGrp.add(ac2);
  }
  if (state.hasVines) {
    const v1 = buildBougainvilleaVine(mats, totalH * 0.92, rng); v1.position.set(-hw + 0.22, baseLift, hd + 0.04); roofGroup.add(v1);
    const v2 = buildBougainvilleaVine(mats, totalH * 0.78, rng); v2.position.set(hw + 0.04, baseLift, -hd + 0.55); v2.rotation.y = Math.PI / 2; roofGroup.add(v2);
  }

  const roofY = baseLift + totalH, rScale = state.roofHeight;
  if (state.roofType === 'flat') {
    const parapetH = 0.72 * rScale, pThick = 0.32;
    const deckGeo = new THREE.ExtrudeGeometry(bodyShape, { depth: 0.14, bevelEnabled: false }); deckGeo.rotateX(-Math.PI / 2);
    addMesh(roofGroup, deckGeo, mats.roofDeck, 0, roofY - 0.04, 0);
    const paraShape = new THREE.Shape();
    paraShape.moveTo(-hw, hd); paraShape.lineTo(hw, hd);
    if (chamfer > 0) { paraShape.lineTo(hw, -hd + chamfer); paraShape.lineTo(hw - chamfer, -hd); } else paraShape.lineTo(hw, -hd);
    paraShape.lineTo(-hw, -hd); paraShape.closePath();
    const hole = new THREE.Path();
    hole.moveTo(-hw + pThick, hd - pThick); hole.lineTo(hw - pThick, hd - pThick);
    if (chamfer > 0) { hole.lineTo(hw - pThick, -hd + chamfer + pThick * 0.6); hole.lineTo(hw - chamfer - pThick * 0.6, -hd + pThick); } else hole.lineTo(hw - pThick, -hd + pThick);
    hole.lineTo(-hw + pThick, -hd + pThick); hole.closePath();
    paraShape.holes.push(hole);
    const paraGeo = new THREE.ExtrudeGeometry(paraShape, { depth: parapetH, bevelEnabled: false }); paraGeo.rotateX(-Math.PI / 2);
    addMesh(roofGroup, paraGeo, mats.wall, 0, roofY, 0);
    const capGeo = new THREE.ExtrudeGeometry(paraShape, { depth: 0.10, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.05, bevelSegments: 1 }); capGeo.rotateX(-Math.PI / 2);
    addMesh(roofGroup, capGeo, mats.trim, 0, roofY + parapetH, 0);
    if (state.hasWaterTank) { const t = buildWaterTank(mats); t.position.set(-hw * 0.44, roofY + 0.1, -hd * 0.25); roofGroup.add(t); }
    if (state.hasDish) { const d = buildSatelliteDish(mats); d.position.set(hw * 0.35, roofY + 0.1, -hd * 0.35); roofGroup.add(d); }
    if (state.hasRoofAC) {
      const rac1 = buildACUnit(mats, 1.05); rac1.position.set(hw * 0.26, roofY + 0.38, hd * 0.22); rac1.rotation.y = Math.PI; roofGroup.add(rac1);
      if (W >= 8.5) { const rac2 = buildACUnit(mats, 0.95); rac2.position.set(-hw * 0.02, roofY + 0.35, -hd * 0.44); roofGroup.add(rac2); }
    }
    if (state.hasRoofGarden) {
      [[-hw * 0.55, hd * 0.36], [hw * 0.46, hd * 0.32], [0, hd * 0.38], [-hw * 0.15, -hd * 0.05]].forEach(([px, pz], idx) => {
        if (chamfer > 0 && px > hw - chamfer - 0.5 && pz > hd - chamfer - 0.5) return;
        const pot = buildPottedPlant(mats, 1.05 + (idx % 2) * 0.35, rng); pot.position.set(px, roofY + 0.1, pz); roofGroup.add(pot);
      });
    }
    if (state.hasChimney) {
      addMesh(roofGroup, new THREE.BoxGeometry(2.1, 1.8, 2.0), mats.wall, 0.4, roofY + 0.9, -0.3);
      addMesh(roofGroup, new THREE.BoxGeometry(2.3, 0.15, 2.2), mats.trim, 0.4, roofY + 1.85, -0.3);
      addMesh(roofGroup, new THREE.BoxGeometry(0.85, 1.4, 0.12), mats.wood, 0.4, roofY + 0.72, 0.72);
    }
  } else if (state.roofType === 'hipped' || state.roofType === 'gabled') {
    const deckGeo = new THREE.ExtrudeGeometry(bodyShape, { depth: 0.12, bevelEnabled: false }); deckGeo.rotateX(-Math.PI / 2);
    addMesh(roofGroup, deckGeo, mats.intWall, 0, roofY - 0.04, 0);
    const overhang = 0.55, rH = Math.min(W, D) * 0.28 * rScale;
    if (state.roofType === 'hipped') {
      const rW = W + overhang * 2, rD = D + overhang * 2, ridgeLen = Math.max(0.2, Math.abs(rW - rD)), isWide = rW >= rD;
      const topX = isWide ? ridgeLen / 2 : 0.05, topZ = isWide ? 0.05 : ridgeLen / 2, bx = rW / 2, bz = rD / 2;
      const verts = new Float32Array([-bx,0,bz, bx,0,bz, topX,rH,topZ, -bx,0,bz, topX,rH,topZ, -topX,rH,topZ, bx,0,-bz, -bx,0,-bz, -topX,rH,-topZ, bx,0,-bz, -topX,rH,-topZ, topX,rH,-topZ, bx,0,bz, bx,0,-bz, topX,rH,-topZ, bx,0,bz, topX,rH,-topZ, topX,rH,topZ, -bx,0,-bz, -bx,0,bz, -topX,rH,topZ, -bx,0,-bz, -topX,rH,topZ, -topX,rH,-topZ]);
      const uvs = new Float32Array([0,0, 2,0, 1.6,1, 0,0, 1.6,1, 0.4,1, 0,0, 2,0, 1.6,1, 0,0, 1.6,1, 0.4,1, 0,0, 1.5,0, 0.9,1, 0,0, 0.9,1, 0.6,1, 0,0, 1.5,0, 0.9,1, 0,0, 0.9,1, 0.6,1]);
      const hipGeo = new THREE.BufferGeometry(); hipGeo.setAttribute('position', new THREE.BufferAttribute(verts, 3)); hipGeo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2)); hipGeo.computeVertexNormals();
      addMesh(roofGroup, hipGeo, mats.terracotta, 0, roofY, 0);
      addMesh(roofGroup, new THREE.CylinderGeometry(0.14, 0.14, ridgeLen + 0.25, 8), mats.terracottaPot, 0, roofY + rH, 0, 0, 0, isWide ? Math.PI / 2 : 0);
    } else {
      const wallTri = new THREE.Shape(); wallTri.moveTo(-D / 2, 0); wallTri.lineTo(D / 2, 0); wallTri.lineTo(0, rH - 0.12); wallTri.closePath();
      const gableWallGeo = new THREE.ExtrudeGeometry(wallTri, { depth: W, bevelEnabled: false }); gableWallGeo.rotateY(Math.PI / 2);
      addMesh(roofGroup, gableWallGeo, mats.wall, -W / 2, roofY, 0);
      const slopeLen = Math.hypot(D / 2 + overhang, rH), angle = Math.atan2(rH, D / 2 + overhang), roofLen = W + overhang * 2;
      addMesh(roofGroup, new THREE.BoxGeometry(roofLen, 0.18, slopeLen), mats.terracotta, 0, roofY + rH / 2, (D / 2 + overhang) / 2, angle, 0, 0);
      addMesh(roofGroup, new THREE.BoxGeometry(roofLen, 0.18, slopeLen), mats.terracotta, 0, roofY + rH / 2, -(D / 2 + overhang) / 2, -angle, 0, 0);
      addMesh(roofGroup, new THREE.CylinderGeometry(0.14, 0.14, roofLen + 0.1, 8), mats.terracottaPot, 0, roofY + rH + 0.04, 0, 0, 0, Math.PI / 2);
    }
    if (state.hasChimney) { addMesh(roofGroup, new THREE.BoxGeometry(0.75, rH + 0.9, 0.75), mats.brick, W * 0.26, roofY + (rH + 0.9) / 2, -D * 0.18); addMesh(roofGroup, new THREE.BoxGeometry(0.95, 0.16, 0.95), mats.trim, W * 0.26, roofY + rH + 0.92, -D * 0.18); }
    if (state.hasDish) { const d = buildSatelliteDish(mats); d.position.set(-W * 0.3, roofY + rH * 0.55, -D * 0.2); roofGroup.add(d); }
  } else if (state.roofType === 'civic') {
    const deckGeo = new THREE.ExtrudeGeometry(bodyShape, { depth: 0.12, bevelEnabled: false }); deckGeo.rotateX(-Math.PI / 2);
    addMesh(roofGroup, deckGeo, mats.intWall, 0, roofY - 0.04, 0);
    const rH = 2.0 * rScale, slopeLen = Math.hypot(D / 2 + 0.5, rH), angle = Math.atan2(rH, D / 2 + 0.5);
    addMesh(roofGroup, new THREE.BoxGeometry(W + 0.9, 0.2, slopeLen), mats.terracotta, 0, roofY + rH / 2, (D / 2 + 0.5) / 2, angle, 0, 0);
    addMesh(roofGroup, new THREE.BoxGeometry(W + 0.9, 0.2, slopeLen), mats.terracotta, 0, roofY + rH / 2, -(D / 2 + 0.5) / 2, -angle, 0, 0);
    addMesh(roofGroup, new THREE.CylinderGeometry(0.15, 0.15, W + 1.0, 8), mats.terracottaPot, 0, roofY + rH + 0.04, 0, 0, 0, Math.PI / 2);
    const pedW = Math.min(4.6, W * 0.42), pedH = 1.65 * rScale;
    addMesh(roofGroup, new THREE.BoxGeometry(pedW, pedH, D + 0.5), mats.wall, 0, roofY + pedH / 2, 0.15);
    const tri = new THREE.Shape(); tri.moveTo(-pedW / 2 - 0.1, 0); tri.lineTo(pedW / 2 + 0.1, 0); tri.lineTo(0, 1.45 * rScale); tri.closePath();
    addMesh(roofGroup, new THREE.ExtrudeGeometry(tri, { depth: D + 0.55, bevelEnabled: false }), mats.wall, 0, roofY + pedH, -(D + 0.55) / 2 + 0.15);
    const pSlope = Math.hypot(pedW / 2 + 0.35, 1.45 * rScale), pAng = Math.atan2(1.45 * rScale, pedW / 2 + 0.35);
    addMesh(roofGroup, new THREE.BoxGeometry(pSlope, 0.18, D + 1.1), mats.terracotta, -(pedW / 2 + 0.35) / 2, roofY + pedH + 0.72 * rScale, 0.15, 0, 0, pAng);
    addMesh(roofGroup, new THREE.BoxGeometry(pSlope, 0.18, D + 1.1), mats.terracotta, (pedW / 2 + 0.35) / 2, roofY + pedH + 0.72 * rScale, 0.15, 0, 0, -pAng);
    const clockR = Math.min(0.75, pedW * 0.19);
    addMesh(roofGroup, new THREE.CylinderGeometry(clockR + 0.08, clockR + 0.08, 0.14, 24), mats.trim, 0, roofY + pedH * 0.72, hd + 0.42, Math.PI / 2, 0, 0);
    addMesh(roofGroup, new THREE.CylinderGeometry(clockR, clockR, 0.18, 24), mats.clock, 0, roofY + pedH * 0.72, hd + 0.44, Math.PI / 2, 0, 0);
  } else if (state.roofType === 'sawtooth') {
    const teeth = 3, tw = W / teeth, th = 1.4 * rScale;
    for (let i = 0; i < teeth; i++) {
      const tx = -hw + tw / 2 + i * tw, sLen = Math.hypot(tw, th), sAng = Math.atan2(th, tw);
      addMesh(roofGroup, new THREE.BoxGeometry(sLen, 0.14, D + 0.2), mats.terracotta, tx, roofY + th / 2, 0, 0, 0, sAng);
      addMesh(roofGroup, new THREE.BoxGeometry(0.12, th, D - 0.3), mats.clearGlass, tx + tw / 2 - 0.06, roofY + th / 2, 0, 0, 0, 0, false, false);
    }
    if (state.hasChimney) { const chH = 4.2 * rScale; addMesh(roofGroup, new THREE.CylinderGeometry(0.32, 0.52, chH, 10), mats.brick, hw - 0.9, roofY + chH / 2, -hd + 0.9); addMesh(roofGroup, new THREE.CylinderGeometry(0.42, 0.38, 0.22, 10), mats.trim, hw - 0.9, roofY + chH, -hd + 0.9); }
    if (state.hasWaterTank) { const t = buildWaterTank(mats); t.position.set(hw + 1.35, baseLift, -hd * 0.25); structureGroup.add(t); }
  }
  structureGroup.add(roofGroup);

  rebuildInteriorOnly();
  if (state.activeFloor >= floors) state.activeFloor = floors - 1;
  rebuildFloorPills();
  applyViewModeVisibility();
  if (state.viewMode !== 'walk') orbit.desiredTarget.y = baseLift + (state.viewMode === 'cutaway' ? (state.activeFloor + 0.45) * floorH : totalH * 0.48);
  updateStats();
}

function applyViewModeVisibility() {
  const isCutaway = state.viewMode === 'cutaway', isWalk = state.viewMode === 'walk', mode = state.wallCutMode;
  if (roofGroup) roofGroup.visible = !isCutaway;
  floorMeta.forEach((meta, idx) => {
    const showFloor = isCutaway ? idx <= state.activeFloor : true;
    meta.floorGrp.visible = showFloor;
    if (floorInteriorGroups[idx]) floorInteriorGroups[idx].visible = showFloor && state.showInteriorProps;
    const isTarget = isCutaway && idx === state.activeFloor;
    ['front', 'back', 'left', 'right', 'chamfer'].forEach((side) => {
      const full = meta.fullWalls[side], stub = meta.stubWalls[side];
      if (!full || !stub) return;
      if (!isTarget || mode === 'up') { full.visible = true; stub.visible = false; }
      else if (mode === 'down') { full.visible = false; stub.visible = true; }
      else { const drop = side === 'front' || side === 'right' || side === 'chamfer'; full.visible = !drop; stub.visible = drop; }
    });
    if (meta.storefrontGrp) meta.storefrontGrp.visible = !(isTarget && (mode === 'cutaway' || mode === 'down'));
  });
  const hud = document.getElementById('interior-hud'), walkCtrl = document.getElementById('walk-controls'), simsBar = document.getElementById('sims-wall-bar');
  if (isCutaway || isWalk) { hud.classList.remove('hidden'); hud.classList.add('flex'); } else { hud.classList.add('hidden'); hud.classList.remove('flex'); }
  walkCtrl.classList.toggle('hidden', !isWalk);
  if (simsBar) simsBar.classList.toggle('hidden', !isCutaway);
  document.getElementById('floor-hud-label').textContent = isWalk ? 'انتقل للدور:' : 'مقطع الدور:';
}

function rebuildFloorPills() {
  const container = document.getElementById('floor-pills');
  container.innerHTML = '';
  for (let f = 0; f < state.floors; f++) {
    const btn = document.createElement('button');
    btn.className = `px-2.5 py-1 rounded-xl text-[11px] font-bold transition ${f === state.activeFloor ? 'bg-[#e07a5f] text-white' : 'bg-white/5 text-[#d6c6b8] hover:bg-white/15'}`;
    btn.textContent = f === 0 ? 'الأرضي' : `الدور ${f + 1}`;
    btn.addEventListener('click', () => {
      state.activeFloor = f; rebuildFloorPills(); applyViewModeVisibility();
      if (state.viewMode === 'walk') placeFpsAtFloor(f);
      else orbit.desiredTarget.y = ((state.showEnvironment && state.showSidewalk) ? 0.22 : 0) + (f + 0.45) * state.floorH;
    });
    container.appendChild(btn);
  }
}

function updateStats() {
  let tris = 0, meshes = 0;
  buildingGroup.traverse((obj) => {
    if (obj.isMesh && obj.visible && obj.geometry) {
      meshes++;
      const g = obj.geometry;
      if (g.index) tris += g.index.count / 3; else if (g.attributes.position) tris += g.attributes.position.count / 3;
    }
  });
  const totalH = state.floors * state.floorH + (state.roofType === 'flat' ? 0.8 : 2.1);
  document.getElementById('stat-tris').textContent = Math.round(tris).toLocaleString();
  document.getElementById('stat-meshes').textContent = meshes;
  document.getElementById('stat-dims').textContent = `${state.width.toFixed(1)}×${state.depth.toFixed(1)}×${totalH.toFixed(1)}m`;
}
