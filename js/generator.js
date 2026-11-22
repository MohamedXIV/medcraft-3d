// =========================================================================
// 4. PROCEDURAL BUILDING + INTERIOR GENERATOR ENGINE (WITH LIVE BOOLEAN CUTOUTS)
// =========================================================================
const buildingGroup = new THREE.Group();
scene.add(buildingGroup);

let floorGroups = [];
let roofGroup = null;
let frontCutawayGroups = [];

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

// --- Shared Exterior Sub-Component Builders ---
function buildWindowUnit(mats, opts = {}) {
  const g = new THREE.Group();
  const w = opts.w || 1.05;
  const h = opts.h || 1.35;
  const isHollow = Boolean(state.hasInterior);

  if (isHollow) {
    // True hollow 4-sided stone trim surround (real see-through Boolean cutout)
    addMesh(g, new THREE.BoxGeometry(w + 0.22, 0.11, 0.16), mats.trim, 0, h / 2 + 0.045, 0.0);
    addMesh(g, new THREE.BoxGeometry(w + 0.30, 0.11, 0.26), mats.trim, 0, -h / 2 - 0.045, 0.05);
    addMesh(g, new THREE.BoxGeometry(0.10, h + 0.02, 0.16), mats.trim, -w / 2 - 0.045, 0, 0.0);
    addMesh(g, new THREE.BoxGeometry(0.10, h + 0.02, 0.16), mats.trim, w / 2 + 0.045, 0, 0.0);

    // Recessed wooden casement frame inside the wall reveal
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
    const sw = w * 0.46;
    const sh = h + 0.02;
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
  for (let i = 0; i < brackets; i++) {
    const bx = -w * 0.42 + (i / Math.max(1, brackets - 1)) * (w * 0.84);
    addMesh(g, new THREE.BoxGeometry(0.14, 0.24, 0.45), mats.trim, bx, -0.18, 0.24);
  }
  addMesh(g, new THREE.BoxGeometry(w, 0.05, 0.05), mats.iron, 0, railH, d - 0.04);
  addMesh(g, new THREE.BoxGeometry(0.05, 0.05, d), mats.iron, -w / 2 + 0.03, railH, d / 2);
  addMesh(g, new THREE.BoxGeometry(0.05, 0.05, d), mats.iron, w / 2 - 0.03, railH, d / 2);

  const posts = Math.max(5, Math.floor(w * 3.5));
  for (let i = 0; i <= posts; i++) {
    const px = -w / 2 + 0.04 + (i / posts) * (w - 0.08);
    addMesh(g, new THREE.CylinderGeometry(0.018, 0.018, railH, 6), mats.iron, px, railH / 2, d - 0.04);
  }
  for (let i = 1; i <= 3; i++) {
    const pz = (i / 4) * d;
    addMesh(g, new THREE.CylinderGeometry(0.018, 0.018, railH, 6), mats.iron, -w / 2 + 0.03, railH / 2, pz);
    addMesh(g, new THREE.CylinderGeometry(0.018, 0.018, railH, 6), mats.iron, w / 2 - 0.03, railH / 2, pz);
  }

  const pot = buildPottedPlant(mats, 0.55, rng);
  pot.position.set(w * 0.32, 0.08, d * 0.5);
  g.add(pot);

  if (hasLaundry && w >= 1.8) {
    const clothColors = ['#f2a7a7', '#f7f3eb', '#9dc3e6', '#f7d894'];
    for (let i = 0; i < 3; i++) {
      const cx = -w * 0.28 + i * 0.42;
      const cMat = new THREE.MeshStandardMaterial({ color: clothColors[(i + Math.floor(rng() * 4)) % clothColors.length], roughness: 0.85, wireframe: state.wireframe });
      addMesh(g, new THREE.BoxGeometry(0.32, 0.46 + rng() * 0.14, 0.04), cMat, cx, railH - 0.24, d + 0.01, 0.08, 0, 0);
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
  [-1, 1].forEach(s => {
    addMesh(g, new THREE.CylinderGeometry(0.025, 0.025, depth * 0.85, 6), mats.iron, s * (width / 2 - 0.12), -0.22, depth * 0.44, Math.PI / 2 - 0.35, 0, 0);
  });
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
  [[-0.45, -0.45], [0.45, -0.45], [-0.45, 0.45], [0.45, 0.45]].forEach(([lx, lz]) => {
    addMesh(g, new THREE.CylinderGeometry(0.035, 0.035, legH, 6), mats.iron, lx, legH / 2, lz);
  });
  addMesh(g, new THREE.BoxGeometry(1.05, 0.06, 1.05), mats.iron, 0, legH, 0);
  addMesh(g, new THREE.CylinderGeometry(0.62, 0.64, 1.15, 16), mats.tank, 0, legH + 0.58, 0);
  [0.35, 0.65, 0.95].forEach(ry => {
    addMesh(g, new THREE.TorusGeometry(0.63, 0.035, 6, 18), mats.tank, 0, legH + ry, 0, Math.PI / 2, 0, 0);
  });
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
  dishGrp.position.set(0, 0.68, 0);
  dishGrp.rotation.set(-0.55, 0.5, 0);
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
    const t = i / clusters;
    const y = 0.4 + t * (height - 0.5);
    const x = Math.sin(t * 7.5 + rng() * 2) * 0.45 + (rng() - 0.5) * 0.25;
    const z = 0.08 + rng() * 0.12;
    const r = 0.18 + rng() * 0.16;
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
    const ch = new THREE.Group();
    ch.position.set(cx, 0, 0);
    ch.rotation.y = cx < 0 ? Math.PI / 2 : -Math.PI / 2;
    addMesh(ch, new THREE.BoxGeometry(0.36, 0.05, 0.36), mats.wood, 0, 0.42, 0);
    addMesh(ch, new THREE.BoxGeometry(0.36, 0.42, 0.05), mats.wood, 0, 0.64, -0.16);
    [[-0.14, -0.14], [0.14, -0.14], [-0.14, 0.14], [0.14, 0.14]].forEach(([lx, lz]) => {
      addMesh(ch, new THREE.CylinderGeometry(0.02, 0.02, 0.42, 6), mats.iron, lx, 0.21, lz);
    });
    g.add(ch);
  });
  return g;
}

function buildProduceCrate(mats, fruitHex) {
  const g = new THREE.Group();
  addMesh(g, new THREE.BoxGeometry(0.75, 0.42, 0.55), mats.woodLight, 0, 0.21, 0);
  const fMat = new THREE.MeshStandardMaterial({ color: fruitHex, roughness: 0.45, wireframe: state.wireframe });
  for (let ix = -2; ix <= 2; ix++) {
    for (let iz = -1; iz <= 1; iz++) {
      addMesh(g, new THREE.SphereGeometry(0.085, 8, 6), fMat, ix * 0.13, 0.44 + (Math.abs(ix) === 0 ? 0.04 : 0), iz * 0.14);
    }
  }
  return g;
}

function buildStreetLamp(mats, isNight) {
  const g = new THREE.Group();
  addMesh(g, new THREE.CylinderGeometry(0.08, 0.13, 0.45, 8), mats.iron, 0, 0.22, 0);
  addMesh(g, new THREE.CylinderGeometry(0.045, 0.06, 2.5, 8), mats.iron, 0, 1.5, 0);
  const bulbMat = new THREE.MeshStandardMaterial({
    color: '#fff4c2', emissive: '#ffbe55', emissiveIntensity: isNight ? 1.8 : 0.35, roughness: 0.2, wireframe: state.wireframe
  });
  addMesh(g, new THREE.SphereGeometry(0.18, 12, 10), bulbMat, 0, 2.86, 0, 0, 0, 0, false, false);
  addMesh(g, new THREE.ConeGeometry(0.24, 0.14, 8), mats.iron, 0, 3.06, 0);
  return g;
}

// --- PROCEDURAL INTERIOR FURNITURE & ARCHITECTURE BUILDERS ---
function buildPendantLamp(mats, floorH) {
  const g = new THREE.Group();
  const cordH = Math.max(0.35, floorH * 0.22);
  addMesh(g, new THREE.CylinderGeometry(0.015, 0.015, cordH, 6), mats.iron, 0, floorH - cordH / 2, 0, 0, 0, 0, false, false);
  addMesh(g, new THREE.ConeGeometry(0.24, 0.18, 12), mats.wood, 0, floorH - cordH - 0.05, 0, 0, 0, 0, false, false);
  addMesh(g, new THREE.SphereGeometry(0.10, 10, 8), mats.warmBulb, 0, floorH - cordH - 0.14, 0, 0, 0, 0, false, false);
  return g;
}

function buildInteriorStaircase(mats, floorH) {
  const g = new THREE.Group();
  const steps = 11, totalRun = 2.6, stairW = 1.05;
  const stepH = floorH / steps, stepD = totalRun / steps;
  for (let i = 0; i < steps; i++) {
    addMesh(g, new THREE.BoxGeometry(stairW, stepH * 0.9, stepD + 0.04), mats.woodLight, 0, (i + 0.5) * stepH, i * stepD);
  }
  addMesh(g, new THREE.CylinderGeometry(0.03, 0.03, 0.95, 6), mats.iron, stairW / 2 - 0.04, 0.5, 0.08);
  addMesh(g, new THREE.CylinderGeometry(0.03, 0.03, 0.95, 6), mats.iron, stairW / 2 - 0.04, floorH + 0.4, totalRun - 0.08);
  const railLen = Math.hypot(totalRun, floorH);
  const railAng = Math.atan2(floorH, totalRun);
  addMesh(g, new THREE.CylinderGeometry(0.025, 0.025, railLen, 6), mats.wood, stairW / 2 - 0.04, floorH / 2 + 0.85, totalRun / 2, Math.PI / 2 - railAng, 0, 0);
  return g;
}

function buildBookshelfOrMedicineRack(mats, w, h, isPharmacy, rng) {
  const g = new THREE.Group();
  const d = 0.42;
  addMesh(g, new THREE.BoxGeometry(w, h, 0.06), isPharmacy ? mats.acBody : mats.wood, 0, h / 2, -d / 2);
  [-w / 2 + 0.04, w / 2 - 0.04].forEach(sx => {
    addMesh(g, new THREE.BoxGeometry(0.08, h, d), isPharmacy ? mats.acBody : mats.wood, sx, h / 2, 0);
  });
  const shelves = 4;
  const itemColors = isPharmacy
    ? ['#2f855a', '#ffffff', '#3b82f6', '#ef4444', '#81b29a', '#f59e0b']
    : ['#b84a39', '#3d7a5a', '#d99b43', '#4f6d7a', '#8c5338', '#c46f6f'];

  for (let s = 0; s < shelves; s++) {
    const sy = 0.22 + (s / shelves) * (h - 0.35);
    addMesh(g, new THREE.BoxGeometry(w - 0.1, 0.05, d), isPharmacy ? mats.acBody : mats.woodLight, 0, sy, 0);
    const items = Math.max(4, Math.floor(w * 4.5));
    for (let i = 0; i < items; i++) {
      const ix = -w / 2 + 0.18 + (i / items) * (w - 0.32);
      const ih = 0.16 + rng() * 0.14;
      const iw = (w - 0.38) / items * 0.78;
      const mat = new THREE.MeshStandardMaterial({ color: itemColors[Math.floor(rng() * itemColors.length)], roughness: 0.6, wireframe: state.wireframe });
      addMesh(g, new THREE.BoxGeometry(iw, ih, 0.18), mat, ix, sy + ih / 2 + 0.025, 0.04);
    }
  }
  return g;
}

function buildGroundFloorInterior(parent, W, D, floorH, mats, rng) {
  const iw = W - 0.65, id = D - 0.65, type = state.shopType;

  const lamp1 = buildPendantLamp(mats, floorH);
  lamp1.position.set(-iw * 0.2, 0, 0);
  parent.add(lamp1);
  if (iw > 5.5) {
    const lamp2 = buildPendantLamp(mats, floorH);
    lamp2.position.set(iw * 0.2, 0, 0);
    parent.add(lamp2);
  }

  if (type === 'pharmacy') {
    const rackW = Math.min(iw * 0.62, 4.4);
    const rack = buildBookshelfOrMedicineRack(mats, rackW, 2.25, true, rng);
    rack.position.set(iw * 0.12, 0, -id / 2 + 0.28);
    parent.add(rack);
    const cntW = Math.min(iw * 0.56, 3.8);
    addMesh(parent, new THREE.BoxGeometry(cntW, 0.96, 0.65), mats.shutter, iw * 0.08, 0.48, -id * 0.08);
    addMesh(parent, new THREE.BoxGeometry(cntW + 0.08, 0.08, 0.74), mats.trim, iw * 0.08, 0.98, -id * 0.08);
    addMesh(parent, new THREE.BoxGeometry(0.45, 0.32, 0.06), mats.darkMetal, iw * 0.08 - 0.5, 1.24, -id * 0.08);
    addMesh(parent, new THREE.BoxGeometry(0.36, 0.22, 0.3), mats.acBody, iw * 0.08 + 0.55, 1.13, -id * 0.08);
    addMesh(parent, new THREE.BoxGeometry(0.48, 0.44, 1.5), mats.woodLight, iw / 2 - 0.42, 0.22, 0.4);
  } else if (type === 'cafe') {
    const barW = Math.min(iw * 0.62, 4.4);
    addMesh(parent, new THREE.BoxGeometry(barW, 1.0, 0.72), mats.wood, iw * 0.1, 0.5, -id / 2 + 1.15);
    addMesh(parent, new THREE.BoxGeometry(barW + 0.1, 0.09, 0.84), mats.trim, iw * 0.1, 1.02, -id / 2 + 1.15);
    addMesh(parent, new THREE.BoxGeometry(0.75, 0.52, 0.45), mats.darkMetal, iw * 0.1 - 0.7, 1.32, -id / 2 + 1.1);
    addMesh(parent, new THREE.BoxGeometry(1.15, 0.48, 0.52), mats.shopGlass, iw * 0.1 + 0.75, 1.3, -id / 2 + 1.15, 0, 0, 0, false, false);
    addMesh(parent, new THREE.CylinderGeometry(0.14, 0.14, 0.08, 10), mats.terracottaPot, iw * 0.1 + 0.55, 1.12, -id / 2 + 1.15);
    addMesh(parent, new THREE.CylinderGeometry(0.14, 0.14, 0.08, 10), mats.woodLight, iw * 0.1 + 0.95, 1.12, -id / 2 + 1.15);
    addMesh(parent, new THREE.BoxGeometry(2.4, 0.95, 0.06), mats.iron, iw * 0.1, 2.05, -id / 2 + 0.12);
    const t1 = buildCafeTableSet(mats);
    t1.position.set(0.3, 0, id * 0.16);
    parent.add(t1);
    if (iw > 6.5) {
      const t2 = buildCafeTableSet(mats);
      t2.position.set(-1.6, 0, id * 0.18);
      parent.add(t2);
    }
  } else if (type === 'market') {
    addMesh(parent, new THREE.BoxGeometry(1.8, 0.92, 0.65), mats.wood, iw * 0.28, 0.46, -id * 0.2);
    addMesh(parent, new THREE.BoxGeometry(1.9, 0.08, 0.72), mats.trim, iw * 0.28, 0.94, -id * 0.2);
    const colors = ['#f59e0b', '#dc2626', '#65a30d', '#facc15'];
    for (let i = 0; i < 3; i++) {
      const cr = buildProduceCrate(mats, colors[i % colors.length]);
      cr.position.set(-iw * 0.15 + i * 0.95, 0.25, 0.3);
      addMesh(parent, new THREE.BoxGeometry(0.8, 0.25, 0.6), mats.wood, -iw * 0.15 + i * 0.95, 0.125, 0.3);
      parent.add(cr);
    }
    const rack = buildBookshelfOrMedicineRack(mats, Math.min(iw * 0.55, 3.8), 2.1, false, rng);
    rack.position.set(0.5, 0, -id / 2 + 0.28);
    parent.add(rack);
  } else if (type === 'office') {
    addMesh(parent, new THREE.BoxGeometry(Math.min(iw * 0.6, 4.2), 0.03, Math.min(id * 0.55, 3.2)), mats.rug, 0.2, 0.015, 0.1);
    addMesh(parent, new THREE.BoxGeometry(1.85, 0.76, 0.88), mats.wood, 0.2, 0.38, -0.3);
    addMesh(parent, new THREE.BoxGeometry(0.52, 0.36, 0.06), mats.darkMetal, 0.2, 1.0, -0.45);
    addMesh(parent, new THREE.BoxGeometry(0.55, 0.55, 0.55), mats.iron, 0.2, 0.32, -1.05);
    addMesh(parent, new THREE.BoxGeometry(0.55, 0.65, 0.1), mats.iron, 0.2, 0.78, -1.28);
    const bs = buildBookshelfOrMedicineRack(mats, Math.min(iw * 0.55, 3.6), 2.2, false, rng);
    bs.position.set(0.4, 0, -id / 2 + 0.28);
    parent.add(bs);
  } else if (type === 'civic') {
    addMesh(parent, new THREE.BoxGeometry(2.1, 0.03, id - 0.4), mats.banner, 0, 0.015, 0);
    addMesh(parent, new THREE.BoxGeometry(2.6, 1.05, 0.75), mats.wood, 0, 0.525, -id * 0.28);
    addMesh(parent, new THREE.BoxGeometry(2.75, 0.1, 0.85), mats.trim, 0, 1.08, -id * 0.28);
    [-iw * 0.32, iw * 0.32].forEach(bx => {
      addMesh(parent, new THREE.BoxGeometry(0.55, 0.48, 2.2), mats.woodLight, bx, 0.24, 0.3);
    });
  } else if (type === 'workshop') {
    addMesh(parent, new THREE.BoxGeometry(2.6, 0.88, 0.85), mats.wood, -iw * 0.18, 0.44, -id * 0.26);
    addMesh(parent, new THREE.BoxGeometry(2.7, 0.08, 0.92), mats.darkMetal, -iw * 0.18, 0.9, -id * 0.26);
    addMesh(parent, new THREE.BoxGeometry(0.95, 0.95, 0.95), mats.woodLight, iw * 0.28, 0.475, -id * 0.2);
    addMesh(parent, new THREE.CylinderGeometry(0.32, 0.32, 0.95, 12), mats.shutter, iw * 0.34, 0.475, 0.65);
    addMesh(parent, new THREE.CylinderGeometry(0.32, 0.32, 0.95, 12), mats.terracottaPot, iw * 0.24, 0.475, 1.35);
  } else {
    addMesh(parent, new THREE.BoxGeometry(3.2, 0.03, 2.4), mats.rug, 0.4, 0.015, 0.1);
    addMesh(parent, new THREE.BoxGeometry(2.2, 0.42, 0.85), mats.sofa, 0.4, 0.21, -0.85);
    addMesh(parent, new THREE.BoxGeometry(2.2, 0.55, 0.2), mats.sofa, 0.4, 0.58, -1.18);
    [-1.0, 1.0].forEach(ax => addMesh(parent, new THREE.BoxGeometry(0.22, 0.52, 0.85), mats.sofa, 0.4 + ax, 0.36, -0.85));
    addMesh(parent, new THREE.BoxGeometry(1.15, 0.42, 0.62), mats.woodLight, 0.4, 0.21, 0.15);
    const bs = buildBookshelfOrMedicineRack(mats, 1.8, 2.0, false, rng);
    bs.position.set(iw / 2 - 0.3, 0, -0.3);
    bs.rotation.y = -Math.PI / 2;
    parent.add(bs);
  }
}

function buildUpperApartmentInterior(parent, W, D, floorH, mats, rng) {
  const iw = W - 0.65, id = D - 0.65;

  const l1 = buildPendantLamp(mats, floorH);
  l1.position.set(-iw * 0.22, 0, 0);
  parent.add(l1);
  const l2 = buildPendantLamp(mats, floorH);
  l2.position.set(iw * 0.24, 0, 0);
  parent.add(l2);

  if (iw >= 6.0) {
    const partX = 0.25, backSeg = id * 0.48;
    addMesh(parent, new THREE.BoxGeometry(0.14, floorH - 0.1, backSeg), mats.intWall, partX, (floorH - 0.1) / 2, -id / 2 + backSeg / 2);
    addMesh(parent, new THREE.BoxGeometry(0.14, floorH - 2.15, id - backSeg), mats.intWall, partX, 2.15 + (floorH - 2.15) / 2, id / 2 - (id - backSeg) / 2);
  }

  const bedX = iw * 0.28, bedZ = -id * 0.12;
  addMesh(parent, new THREE.BoxGeometry(1.55, 0.36, 2.05), mats.wood, bedX, 0.18, bedZ);
  addMesh(parent, new THREE.BoxGeometry(1.45, 0.22, 1.95), mats.trim, bedX, 0.44, bedZ);
  addMesh(parent, new THREE.BoxGeometry(1.48, 0.24, 1.32), mats.duvet, bedX, 0.46, bedZ + 0.3);
  addMesh(parent, new THREE.BoxGeometry(0.55, 0.14, 0.35), mats.acBody, bedX - 0.34, 0.60, bedZ - 0.72);
  addMesh(parent, new THREE.BoxGeometry(0.55, 0.14, 0.35), mats.acBody, bedX + 0.34, 0.60, bedZ - 0.72);
  addMesh(parent, new THREE.BoxGeometry(1.62, 0.95, 0.10), mats.wood, bedX, 0.48, bedZ - 1.02);
  addMesh(parent, new THREE.BoxGeometry(0.45, 0.48, 0.42), mats.woodLight, bedX - 1.08, 0.24, bedZ - 0.75);
  addMesh(parent, new THREE.CylinderGeometry(0.10, 0.14, 0.22, 10), mats.warmBulb, bedX - 1.08, 0.62, bedZ - 0.75, 0, 0, 0, false, false);

  const kitX = -iw * 0.22;
  if (iw >= 6.5) {
    addMesh(parent, new THREE.BoxGeometry(1.9, 0.03, 1.5), mats.rug, kitX + 0.3, 0.015, id * 0.18);
    addMesh(parent, new THREE.BoxGeometry(1.65, 0.4, 0.72), mats.sofa, kitX + 0.3, 0.2, id * 0.22);
    addMesh(parent, new THREE.BoxGeometry(1.65, 0.48, 0.18), mats.sofa, kitX + 0.3, 0.54, id * 0.22 + 0.28);
    addMesh(parent, new THREE.BoxGeometry(1.6, 0.88, 0.58), mats.acBody, -iw * 0.14, 0.44, -id / 2 + 0.38);
    addMesh(parent, new THREE.BoxGeometry(1.66, 0.07, 0.64), mats.woodLight, -iw * 0.14, 0.9, -id / 2 + 0.38);
  }
}

// Live Boolean Wall Extruder (punches exact rectangular window & door holes through wall)
function buildWallWithHoles(parent, len, floorH, wallT, openings, mats, addInnerLiner = true) {
  const hw = len / 2;
  const wallShape = new THREE.Shape();
  wallShape.moveTo(-hw, 0);
  wallShape.lineTo(hw, 0);
  wallShape.lineTo(hw, floorH);
  wallShape.lineTo(-hw, floorH);
  wallShape.closePath();

  const valid = [];
  const sorted = [...openings].sort((a, b) => a.u - b.u);
  for (const op of sorted) {
    const minX = op.u - op.w / 2;
    const maxX = op.u + op.w / 2;
    const minY = Math.max(0.04, op.cy - op.h / 2);
    const maxY = Math.min(floorH - 0.10, op.cy + op.h / 2);
    if (minX < -hw + 0.14 || maxX > hw - 0.14) continue;
    if (maxY - minY < 0.25) continue;
    if (valid.length > 0 && minX < valid[valid.length - 1].maxX + 0.12) continue;
    valid.push({ ...op, minX, maxX, minY, maxY });
  }

  for (const op of valid) {
    const hole = new THREE.Path();
    hole.moveTo(op.minX, op.minY);
    hole.lineTo(op.maxX, op.minY);
    hole.lineTo(op.maxX, op.maxY);
    hole.lineTo(op.minX, op.maxY);
    hole.closePath();
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

function buildHollowFloorShell(floorGrp, frontWallGrp, W, D, floorH, chamfer, f, mats, rng) {
  const hw = W / 2, hd = D / 2, wallT = 0.24;
  const isGround = f === 0;
  const winW = 1.05, winH = 1.35, wy = floorH * 0.52;

  const floorShape = new THREE.Shape();
  floorShape.moveTo(-hw + 0.06, hd - 0.06);
  floorShape.lineTo(hw - 0.06, hd - 0.06);
  if (chamfer > 0) {
    floorShape.lineTo(hw - 0.06, -hd + chamfer + 0.04);
    floorShape.lineTo(hw - chamfer - 0.04, -hd + 0.06);
  } else {
    floorShape.lineTo(hw - 0.06, -hd + 0.06);
  }
  floorShape.lineTo(-hw + 0.06, -hd + 0.06);
  floorShape.closePath();

  const slabGeo = new THREE.ExtrudeGeometry(floorShape, { depth: 0.14, bevelEnabled: false });
  slabGeo.rotateX(-Math.PI / 2);
  const uvA = slabGeo.attributes.uv;
  for (let i = 0; i < uvA.count; i++) uvA.setXY(i, uvA.getX(i) * 0.22, uvA.getY(i) * 0.22);
  addMesh(floorGrp, slabGeo, isGround ? mats.gfFloor : mats.upperFloor, 0, 0, 0, 0, 0, 0, false, true);

  // FRONT WALL (+Z)
  const frontLen = W - chamfer, frontCenterX = -chamfer / 2;
  const frontWall = new THREE.Group();
  frontWall.position.set(frontCenterX, 0, hd);
  const frontOpenings = [];

  if (isGround) {
    const isShop = ['pharmacy', 'cafe', 'market', 'office'].includes(state.shopType);
    const openW = isShop
      ? Math.min(frontLen - 1.1, 5.8)
      : state.shopType === 'workshop' ? Math.min(frontLen * 0.48, 4.4)
      : state.shopType === 'civic' ? Math.min(frontLen * 0.55, 5.2) : 1.45;
    const openH = Math.min(floorH * 0.78, 2.45);
    frontOpenings.push({ u: 0, cy: openH / 2 + 0.02, w: openW, h: openH, isDoor: true });

    if (!isShop && state.shopType === 'residential' && W >= 7.0) {
      [-W * 0.32 - frontCenterX, W * 0.32 - frontCenterX].forEach(u => {
        if (Math.abs(u) > 1.7) frontOpenings.push({ u, cy: floorH * 0.54, w: winW, h: winH, isWindow: true, flowerBox: state.hasFlowerBoxes });
      });
    }

    const doorW = 1.05, doorH = Math.min(openH - 0.1, 2.15);
    const doorPivot = new THREE.Group();
    const doorU = isShop ? (-openW / 2 + 0.1) : (-doorW / 2);
    doorPivot.position.set(doorU, 0.08, -wallT / 2);
    doorPivot.rotation.y = state.doorOpen ? -1.32 : 0;
    addMesh(doorPivot, new THREE.BoxGeometry(doorW, doorH, 0.07), mats.wood, doorW / 2, doorH / 2, 0);
    addMesh(doorPivot, new THREE.PlaneGeometry(doorW * 0.65, doorH * 0.45), mats.clearGlass, doorW / 2, doorH * 0.66, 0.04, 0, 0, 0, false, false);
    addMesh(doorPivot, new THREE.SphereGeometry(0.045, 8, 6), mats.brass, doorW - 0.12, doorH * 0.45, 0.06);
    frontWall.add(doorPivot);
  } else {
    const availF = frontLen - 1.2;
    const cntF = Math.max(1, Math.round((availF / 2.35) * state.winDensity));
    const stepF = availF / cntF;
    for (let i = 0; i < cntF; i++) {
      const u = -frontLen / 2 + 0.6 + stepF / 2 + i * stepF;
      const hasBal = state.hasBalconies && (i === Math.floor(cntF / 2) || (cntF >= 3 && i === 0 && f === 1));
      frontOpenings.push({ u, cy: wy, w: winW, h: winH, isWindow: true, hasBal, balW: Math.min(2.3, stepF * 0.88), flowerBox: state.hasFlowerBoxes && !hasBal });
    }
  }

  const cutFront = buildWallWithHoles(frontWall, frontLen, floorH, wallT, frontOpenings, mats, true);
  cutFront.forEach(op => {
    if (op.isWindow) {
      const win = buildWindowUnit(mats, { w: op.w, h: op.h, shutters: state.hasShutters, flowerBox: op.flowerBox });
      win.position.set(op.u, op.cy, 0);
      frontWall.add(win);
      if (op.hasBal) {
        const bal = buildBalcony(mats, op.balW, state.hasLaundry && f === state.floors - 1, rng);
        bal.position.set(op.u, 0.08, 0);
        frontWall.add(bal);
      }
    }
  });
  frontWallGrp.add(frontWall);

  // BACK WALL (-Z)
  const backWall = new THREE.Group();
  backWall.position.set(0, 0, -hd);
  backWall.rotation.y = Math.PI;
  const backOpenings = [];
  if (!isGround) {
    const cntB = Math.max(1, Math.round(((W - 1.2) / 2.8) * state.winDensity));
    const stepB = (W - 1.2) / cntB;
    for (let i = 0; i < cntB; i++) {
      backOpenings.push({ u: -hw + 0.6 + stepB / 2 + i * stepB, cy: wy, w: winW, h: winH, isWindow: true });
    }
  }
  const cutBack = buildWallWithHoles(backWall, W, floorH, wallT, backOpenings, mats, true);
  cutBack.forEach(op => {
    if (op.isWindow) {
      const win = buildWindowUnit(mats, { w: op.w, h: op.h, shutters: state.hasShutters, flowerBox: false });
      win.position.set(op.u, op.cy, 0);
      backWall.add(win);
    }
  });
  floorGrp.add(backWall);

  // LEFT WALL (-X)
  const leftWall = new THREE.Group();
  leftWall.position.set(-hw, 0, 0);
  leftWall.rotation.y = -Math.PI / 2;
  const leftOpenings = [];
  if (isGround) {
    if (D >= 5.5) leftOpenings.push({ u: 0, cy: floorH * 0.56, w: winW, h: winH, isWindow: true, flowerBox: state.hasFlowerBoxes });
  } else {
    const cntL = Math.max(1, Math.round(((D - 1.2) / 2.6) * state.winDensity));
    const stepL = (D - 1.2) / cntL;
    for (let i = 0; i < cntL; i++) {
      leftOpenings.push({ u: -hd + 0.6 + stepL / 2 + i * stepL, cy: wy, w: winW, h: winH, isWindow: true, flowerBox: state.hasFlowerBoxes && rng() > 0.4 });
    }
  }
  const cutLeft = buildWallWithHoles(leftWall, D, floorH, wallT, leftOpenings, mats, true);
  cutLeft.forEach(op => {
    if (op.isWindow) {
      const win = buildWindowUnit(mats, { w: op.w, h: op.h, shutters: state.hasShutters, flowerBox: op.flowerBox });
      win.position.set(op.u, op.cy, 0);
      leftWall.add(win);
    }
  });
  floorGrp.add(leftWall);

  // RIGHT WALL (+X)
  const rightLen = D - chamfer;
  const rightWall = new THREE.Group();
  rightWall.position.set(hw, 0, -chamfer / 2);
  rightWall.rotation.y = Math.PI / 2;
  const rightOpenings = [];
  if (isGround) {
    if (D >= 5.5) rightOpenings.push({ u: rightLen * 0.15, cy: floorH * 0.56, w: winW, h: winH, isWindow: true, flowerBox: state.hasFlowerBoxes });
  } else {
    const availR = rightLen - 1.2;
    const cntR = Math.max(1, Math.round((availR / 2.5) * state.winDensity));
    const stepR = availR / cntR;
    for (let i = 0; i < cntR; i++) {
      const u = -rightLen / 2 + 0.6 + stepR / 2 + i * stepR;
      const hasBal = state.hasBalconies && i === 0 && f === 1 && D >= 6.5;
      rightOpenings.push({ u, cy: wy, w: winW, h: winH, isWindow: true, hasBal, flowerBox: state.hasFlowerBoxes && !hasBal });
    }
  }
  const cutRight = buildWallWithHoles(rightWall, rightLen, floorH, wallT, rightOpenings, mats, true);
  cutRight.forEach(op => {
    if (op.isWindow) {
      const win = buildWindowUnit(mats, { w: op.w, h: op.h, shutters: state.hasShutters, flowerBox: op.flowerBox });
      win.position.set(op.u, op.cy, 0);
      rightWall.add(win);
      if (op.hasBal) {
        const bal = buildBalcony(mats, 1.9, state.hasLaundry, rng);
        bal.position.set(op.u, 0.08, 0);
        rightWall.add(bal);
      }
    }
  });
  floorGrp.add(rightWall);

  // CHAMFER WALL (45 deg corner)
  if (chamfer > 0) {
    const cLen = chamfer * Math.SQRT2 + 0.12;
    const cWall = new THREE.Group();
    cWall.position.set(hw - chamfer / 2, 0, hd - chamfer / 2);
    cWall.rotation.y = Math.PI / 4;
    const cOpenings = [];
    if (isGround) {
      const cw = Math.max(0.9, cLen - 0.56);
      cOpenings.push({ u: 0, cy: 1.15, w: cw, h: 2.26, isDoor: true });
    } else {
      cOpenings.push({ u: 0, cy: wy, w: 0.9, h: 1.25, isWindow: true, flowerBox: state.hasFlowerBoxes });
    }
    const cutC = buildWallWithHoles(cWall, cLen, floorH, wallT, cOpenings, mats, true);
    cutC.forEach(op => {
      if (op.isWindow) {
        const win = buildWindowUnit(mats, { w: op.w, h: op.h, shutters: state.hasShutters, flowerBox: op.flowerBox });
        win.position.set(op.u, op.cy, 0);
        cWall.add(win);
      }
    });
    frontWallGrp.add(cWall);
  }
}

function generateBuilding() {
  clearGroup(buildingGroup);
  floorGroups = [];
  frontCutawayGroups = [];
  roofGroup = new THREE.Group();

  const rng = mulberry32(state.seed);
  const lp = LIGHTING_PRESETS[state.lighting] || LIGHTING_PRESETS.golden;
  const isNight = state.lighting === 'night';
  const wf = state.wireframe;

  const wallTex = createStuccoTexture(state.wall, state.weathering, state.seed);
  const terraTex = createTerracottaTexture(state.roof, state.seed);
  const awningTex = createAwningTexture(state.awning);
  const sidewalkTex = createSidewalkTexture();

  const gfFloorStyle = state.shopType === 'pharmacy' ? 'checker'
    : state.shopType === 'civic' ? 'marble'
    : state.shopType === 'cafe' ? 'terracotta'
    : state.shopType === 'workshop' ? 'concrete' : 'wood';

  const shutterColor = new THREE.Color(state.shutter);
  const shutterDarkColor = shutterColor.clone().multiplyScalar(0.72);

  const mats = {
    wall: new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.88, metalness: 0.02, wireframe: wf }),
    intWall: new THREE.MeshStandardMaterial({ color: '#f4ebe0', roughness: 0.92, wireframe: wf }),
    gfFloor: new THREE.MeshStandardMaterial({ map: createInteriorFloorTexture(gfFloorStyle), roughness: 0.72, wireframe: wf }),
    upperFloor: new THREE.MeshStandardMaterial({ map: createInteriorFloorTexture('wood'), roughness: 0.78, wireframe: wf }),
    trim: new THREE.MeshStandardMaterial({ color: state.trim, roughness: 0.78, metalness: 0.02, wireframe: wf }),
    plinth: new THREE.MeshStandardMaterial({ color: '#b5a493', roughness: 0.9, wireframe: wf }),
    shutter: new THREE.MeshStandardMaterial({ color: shutterColor, roughness: 0.72, wireframe: wf }),
    shutterDark: new THREE.MeshStandardMaterial({ color: shutterDarkColor, roughness: 0.8, wireframe: wf }),
    wood: new THREE.MeshStandardMaterial({ color: '#6b4932', roughness: 0.78, wireframe: wf }),
    woodLight: new THREE.MeshStandardMaterial({ color: '#a87c4f', roughness: 0.82, wireframe: wf }),
    iron: new THREE.MeshStandardMaterial({ color: '#2b3036', roughness: 0.45, metalness: 0.65, wireframe: wf }),
    darkMetal: new THREE.MeshStandardMaterial({ color: '#454c54', roughness: 0.5, metalness: 0.5, wireframe: wf }),
    brass: new THREE.MeshStandardMaterial({ color: '#d4a84f', roughness: 0.3, metalness: 0.8, wireframe: wf }),
    acBody: new THREE.MeshStandardMaterial({ color: '#e6e2da', roughness: 0.55, metalness: 0.1, wireframe: wf }),
    acVent: new THREE.MeshStandardMaterial({ color: '#5b6169', roughness: 0.6, wireframe: wf }),
    tank: new THREE.MeshStandardMaterial({ color: '#586270', roughness: 0.48, metalness: 0.15, wireframe: wf }),
    awning: new THREE.MeshStandardMaterial({ map: awningTex, roughness: 0.85, wireframe: wf }),
    terracotta: new THREE.MeshStandardMaterial({ map: terraTex, roughness: 0.78, wireframe: wf }),
    roofDeck: new THREE.MeshStandardMaterial({ color: '#b8a898', roughness: 0.95, wireframe: wf }),
    terracottaPot: new THREE.MeshStandardMaterial({ color: '#c4653f', roughness: 0.8, wireframe: wf }),
    foliage: new THREE.MeshStandardMaterial({ color: '#4a8540', roughness: 0.82, wireframe: wf }),
    foliageLight: new THREE.MeshStandardMaterial({ color: '#6ca64f', roughness: 0.8, wireframe: wf }),
    flower: new THREE.MeshStandardMaterial({ color: state.flower, roughness: 0.65, wireframe: wf }),
    sofa: new THREE.MeshStandardMaterial({ color: '#c87d5c', roughness: 0.88, wireframe: wf }),
    duvet: new THREE.MeshStandardMaterial({ color: '#5b8a72', roughness: 0.85, wireframe: wf }),
    rug: new THREE.MeshStandardMaterial({ color: '#a84a3d', roughness: 0.95, wireframe: wf }),
    warmBulb: new THREE.MeshStandardMaterial({ color: '#fff4cc', emissive: '#ffbb55', emissiveIntensity: 1.5, roughness: 0.2, wireframe: wf }),
    glass: new THREE.MeshStandardMaterial({
      color: isNight ? '#ffd285' : '#4a6173', emissive: '#ffaa44', emissiveIntensity: lp.nightGlow,
      roughness: 0.18, metalness: 0.25, wireframe: wf
    }),
    clearGlass: new THREE.MeshStandardMaterial({
      color: '#d8eef8', transparent: true, opacity: 0.24, roughness: 0.1, metalness: 0.15, side: THREE.DoubleSide, wireframe: wf
    }),
    shopGlass: state.hasInterior
      ? new THREE.MeshStandardMaterial({ color: '#e6f4fa', transparent: true, opacity: 0.22, roughness: 0.12, metalness: 0.1, side: THREE.DoubleSide, wireframe: wf })
      : new THREE.MeshStandardMaterial({ color: '#ffdca3', emissive: '#ffae42', emissiveIntensity: isNight ? 1.55 : 0.42, roughness: 0.2, metalness: 0.1, wireframe: wf }),
    sidewalk: new THREE.MeshStandardMaterial({ map: sidewalkTex, roughness: 0.92, wireframe: wf }),
    curbDark: new THREE.MeshStandardMaterial({ color: '#393e46', roughness: 0.85, wireframe: wf }),
    curbLight: new THREE.MeshStandardMaterial({ color: '#ede4d8', roughness: 0.85, wireframe: wf }),
    greenSign: new THREE.MeshStandardMaterial({ color: '#279659', emissive: '#1ea85d', emissiveIntensity: isNight ? 0.9 : 0.25, roughness: 0.35, wireframe: wf }),
    banner: new THREE.MeshStandardMaterial({ color: '#b33939', roughness: 0.85, wireframe: wf }),
    clock: new THREE.MeshStandardMaterial({ map: createClockTexture(), roughness: 0.4, wireframe: wf }),
    brick: new THREE.MeshStandardMaterial({ color: '#a8543c', roughness: 0.88, wireframe: wf }),
  };

  const W = state.width, D = state.depth, floors = state.floors, floorH = state.floorH;
  const totalH = floors * floorH;
  const baseLift = state.showSidewalk ? 0.22 : 0;
  const hw = W / 2, hd = D / 2;
  const chamfer = state.cornerChamfer ? Math.min(2.1, Math.min(W, D) * 0.28) : 0;

  if (state.showSidewalk) {
    const padW = W + 4.4, padD = D + 4.4;
    addMesh(buildingGroup, new THREE.BoxGeometry(padW, 0.22, padD), mats.sidewalk, 0, 0.11, 0, 0, 0, 0, false, true);
    const curbLen = 0.85;
    const frontCount = Math.floor(padW / curbLen);
    for (let i = 0; i < frontCount; i++) {
      const cx = -padW / 2 + curbLen / 2 + i * curbLen;
      addMesh(buildingGroup, new THREE.BoxGeometry(curbLen - 0.02, 0.24, 0.22), i % 2 === 0 ? mats.curbDark : mats.curbLight, cx, 0.12, padD / 2 + 0.08);
    }
    const sideCount = Math.floor(padD / curbLen);
    for (let i = 0; i < sideCount; i++) {
      const cz = -padD / 2 + curbLen / 2 + i * curbLen;
      addMesh(buildingGroup, new THREE.BoxGeometry(0.22, 0.24, curbLen - 0.02), i % 2 === 0 ? mats.curbLight : mats.curbDark, padW / 2 + 0.08, 0.12, cz);
    }
  }

  const bodyShape = new THREE.Shape();
  bodyShape.moveTo(-hw, hd);
  bodyShape.lineTo(hw, hd);
  if (chamfer > 0) {
    bodyShape.lineTo(hw, -hd + chamfer);
    bodyShape.lineTo(hw - chamfer, -hd);
  } else {
    bodyShape.lineTo(hw, -hd);
  }
  bodyShape.lineTo(-hw, -hd);
  bodyShape.closePath();

  for (let f = 0; f < floors; f++) {
    const fGrp = new THREE.Group();
    fGrp.position.y = baseLift + f * floorH;
    const fFrontGrp = new THREE.Group();
    fGrp.add(fFrontGrp);

    if (state.hasInterior) {
      buildHollowFloorShell(fGrp, fFrontGrp, W, D, floorH, chamfer, f, mats, rng);
      if (f === 0) buildGroundFloorInterior(fGrp, W, D, floorH, mats, rng);
      else buildUpperApartmentInterior(fGrp, W, D, floorH, mats, rng);

      if (f < floors - 1 && W >= 6.0 && D >= 5.5) {
        const stair = buildInteriorStaircase(mats, floorH);
        stair.position.set(-hw + 0.85, 0.12, -hd + 0.55);
        fGrp.add(stair);
      }
      if (f < 2) {
        const pt = new THREE.PointLight('#ffd699', lp.intLight, Math.max(W, D) * 1.4, 1.5);
        pt.position.set(0, floorH - 0.65, 0);
        fGrp.add(pt);
      }
    } else {
      const segGeo = new THREE.ExtrudeGeometry(bodyShape, { depth: floorH, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.02, bevelSegments: 1 });
      segGeo.rotateX(-Math.PI / 2);
      const uvAttr = segGeo.attributes.uv;
      for (let i = 0; i < uvAttr.count; i++) uvAttr.setXY(i, uvAttr.getX(i) * 0.14, uvAttr.getY(i) * 0.14);
      addMesh(fGrp, segGeo, mats.wall, 0, 0, 0);
    }

    const isTop = f === floors - 1;
    const beltH = isTop ? 0.22 : 0.11;
    const beltOut = isTop ? 0.16 : 0.07;
    addMesh(fGrp, new THREE.BoxGeometry(W + beltOut * 2, beltH, 0.18), mats.trim, 0, floorH - beltH / 2, -hd - beltOut / 2);
    addMesh(fGrp, new THREE.BoxGeometry(0.18, beltH, D + beltOut * 2), mats.trim, -hw - beltOut / 2, floorH - beltH / 2, 0);
    addMesh(fGrp, new THREE.BoxGeometry(0.18, beltH, D - chamfer + beltOut), mats.trim, hw + beltOut / 2, floorH - beltH / 2, -hd + (D - chamfer) / 2);
    addMesh(fFrontGrp, new THREE.BoxGeometry(W - chamfer + beltOut, beltH, 0.18), mats.trim, -chamfer / 2, floorH - beltH / 2, hd + beltOut / 2);

    floorGroups.push(fGrp);
    frontCutawayGroups.push(fFrontGrp);
    buildingGroup.add(fGrp);
  }

  // Ground floor storefront trim, awnings & props
  const f0 = floorGroups[0], f0Front = frontCutawayGroups[0];
  const frontUsableW = W - chamfer - 0.8, frontCenterX = -chamfer / 2;

  if (['pharmacy', 'cafe', 'market', 'office'].includes(state.shopType)) {
    const shopW = Math.min(frontUsableW * 0.86, 5.8);
    const shopH = Math.min(floorH * 0.78, 2.45);
    const shopGrp = new THREE.Group();
    shopGrp.position.set(frontCenterX, 0, hd);

    const frameMat = state.shopType === 'pharmacy' || state.shopType === 'office' ? mats.shutter : mats.wood;
    addMesh(shopGrp, new THREE.BoxGeometry(shopW + 0.3, 0.22, 0.26), frameMat, 0, shopH + 0.08, 0.06);
    addMesh(shopGrp, new THREE.BoxGeometry(0.22, shopH, 0.26), frameMat, -shopW / 2 - 0.04, shopH / 2, 0.06);
    addMesh(shopGrp, new THREE.BoxGeometry(0.22, shopH, 0.26), frameMat, shopW / 2 + 0.04, shopH / 2, 0.06);

    const winStart = -shopW / 2 + 1.25;
    const winSpan = Math.max(0.8, shopW - 1.35);
    const winCenter = winStart + winSpan / 2;
    addMesh(shopGrp, new THREE.BoxGeometry(winSpan, 0.42, 0.22), frameMat, winCenter, 0.21, 0.04);
    addMesh(shopGrp, new THREE.BoxGeometry(winSpan, shopH - 0.45, 0.04), mats.shopGlass, winCenter, 0.42 + (shopH - 0.45) / 2, 0.04, 0, 0, 0, false, false);
    addMesh(shopGrp, new THREE.BoxGeometry(0.10, shopH, 0.20), frameMat, winStart - 0.05, shopH / 2, 0.05);

    if (state.hasAwning) {
      const awning = buildAwning(mats, shopW + 0.45, 1.25);
      awning.position.set(0, shopH + 0.22, 0.12);
      shopGrp.add(awning);
    }

    if (state.shopType === 'pharmacy') {
      const crossGrp = new THREE.Group();
      crossGrp.position.set(0, shopH + 0.45, 0.22);
      addMesh(crossGrp, new THREE.BoxGeometry(0.75, 0.75, 0.14), mats.trim, 0, 0, 0);
      addMesh(crossGrp, new THREE.BoxGeometry(0.52, 0.18, 0.18), mats.greenSign, 0, 0, 0.02);
      addMesh(crossGrp, new THREE.BoxGeometry(0.18, 0.52, 0.18), mats.greenSign, 0, 0, 0.02);
      shopGrp.add(crossGrp);
    } else if (state.shopType === 'cafe' && state.showSidewalk) {
      const t1 = buildCafeTableSet(mats);
      t1.position.set(shopW * 0.22, 0, 1.48);
      shopGrp.add(t1);
    } else if (state.shopType === 'market') {
      const fruitColors = ['#f59e0b', '#dc2626', '#65a30d', '#facc15', '#ea580c'];
      const crates = Math.max(2, Math.floor(winSpan / 0.95));
      for (let i = 0; i < crates; i++) {
        const cx = winStart + 0.45 + (i / Math.max(1, crates - 1)) * Math.max(0.1, winSpan - 0.9);
        const crate = buildProduceCrate(mats, fruitColors[i % fruitColors.length]);
        crate.position.set(cx, 0, 0.65);
        shopGrp.add(crate);
      }
    } else if (state.shopType === 'office') {
      addMesh(shopGrp, new THREE.BoxGeometry(1.5, 0.55, 0.14), mats.trim, 0, shopH + 0.35, 0.14);
      addMesh(shopGrp, new THREE.BoxGeometry(0.45, 0.32, 0.18), mats.iron, 0, shopH + 0.35, 0.16);
      addMesh(shopGrp, new THREE.BoxGeometry(1.05, 0.82, 0.10), mats.woodLight, shopW / 2 + 0.68, 1.55, 0.06);
    }
    f0Front.add(shopGrp);

    if (chamfer > 0) {
      const cornerGrp = new THREE.Group();
      cornerGrp.position.set(hw - chamfer / 2, 0, hd - chamfer / 2);
      cornerGrp.rotation.y = Math.PI / 4;
      const cw = chamfer * Math.SQRT2 * 0.78;
      addMesh(cornerGrp, new THREE.BoxGeometry(cw, 0.22, 0.22), mats.shutter, 0, 2.32, 0.04);
      if (state.shopType === 'pharmacy') {
        addMesh(cornerGrp, new THREE.CylinderGeometry(0.4, 0.4, 0.12, 16), mats.trim, 0, 2.7, 0.1, Math.PI / 2, 0, 0);
        addMesh(cornerGrp, new THREE.BoxGeometry(0.48, 0.16, 0.16), mats.greenSign, 0, 2.7, 0.12);
        addMesh(cornerGrp, new THREE.BoxGeometry(0.16, 0.48, 0.16), mats.greenSign, 0, 2.7, 0.12);
      }
      f0Front.add(cornerGrp);
    }
  } else if (state.shopType === 'civic') {
    addMesh(f0Front, new THREE.BoxGeometry(3.6, 0.16, 1.1), mats.trim, 0, 0.08, hd + 0.55);
    addMesh(f0Front, new THREE.BoxGeometry(2.9, 0.28, 0.65), mats.trim, 0, 0.14, hd + 0.32);
    [-2.2, 2.2].forEach(bx => {
      addMesh(f0Front, new THREE.BoxGeometry(0.42, 1.15, 0.06), mats.banner, bx, floorH + 0.45, hd + 0.12);
      addMesh(f0Front, new THREE.BoxGeometry(0.52, 0.08, 0.10), mats.wood, bx, floorH + 1.04, hd + 0.12);
    });
  } else if (state.shopType === 'workshop') {
    const bayW = Math.min(W * 0.48, 4.4), bayH = Math.min(floorH * 0.78, 2.45);
    addMesh(f0Front, new THREE.BoxGeometry(bayW + 0.3, 0.25, 0.24), mats.darkMetal, 0, bayH + 0.08, hd + 0.06);
    if (state.showSidewalk) {
      addMesh(f0Front, new THREE.BoxGeometry(0.85, 0.85, 0.85), mats.woodLight, -bayW / 2 - 0.8, 0.425, hd + 0.9);
      addMesh(f0Front, new THREE.BoxGeometry(0.75, 0.75, 0.75), mats.wood, -bayW / 2 - 0.75, 1.22, hd + 0.88, 0, 0.2, 0);
    }
  } else {
    addMesh(f0Front, new THREE.BoxGeometry(1.9, 0.2, 0.75), mats.trim, frontCenterX, 0.1, hd + 0.38);
    if (!state.hasInterior && W >= 7.0) {
      [-W * 0.32, W * 0.32].forEach(wx => {
        if (Math.abs(wx - frontCenterX) > 1.8) {
          const win = buildWindowUnit(mats, { shutters: state.hasShutters, flowerBox: state.hasFlowerBoxes });
          win.position.set(wx, floorH * 0.54, hd);
          f0Front.add(win);
        }
      });
    }
  }

  // Solid-mass fallback windows when hasInterior is OFF
  if (!state.hasInterior && D >= 5.5) {
    const gWinR = buildWindowUnit(mats, { shutters: state.hasShutters, flowerBox: state.hasFlowerBoxes });
    gWinR.position.set(hw, floorH * 0.56, -hd * 0.35);
    gWinR.rotation.y = Math.PI / 2;
    f0.add(gWinR);

    const gWinL = buildWindowUnit(mats, { shutters: state.hasShutters, flowerBox: state.hasFlowerBoxes });
    gWinL.position.set(-hw, floorH * 0.56, 0);
    gWinL.rotation.y = -Math.PI / 2;
    f0.add(gWinL);
  }

  if (!state.hasInterior) for (let f = 1; f < floors; f++) {
    const fGrp = floorGroups[f], fFront = frontCutawayGroups[f], wy = floorH * 0.52;
    const availFront = W - chamfer - 1.2;
    const winCountFront = Math.max(1, Math.round((availFront / 2.35) * state.winDensity));
    const stepF = availFront / winCountFront;
    for (let i = 0; i < winCountFront; i++) {
      const wx = -hw + 0.6 + stepF / 2 + i * stepF;
      const win = buildWindowUnit(mats, { shutters: state.hasShutters, flowerBox: state.hasFlowerBoxes && !(state.hasBalconies && i === Math.floor(winCountFront / 2)) });
      win.position.set(wx, wy, hd);
      fFront.add(win);
      if (state.hasBalconies && (i === Math.floor(winCountFront / 2) || (winCountFront >= 3 && i === 0 && f === 1))) {
        const bal = buildBalcony(mats, Math.min(2.3, stepF * 0.88), state.hasLaundry && f === floors - 1, rng);
        bal.position.set(wx, 0.08, hd);
        fFront.add(bal);
      }
    }
    const availRight = D - chamfer - 1.2;
    const winCountSide = Math.max(1, Math.round((availRight / 2.5) * state.winDensity));
    const stepS = availRight / winCountSide;
    for (let i = 0; i < winCountSide; i++) {
      const wz = -hd + 0.6 + stepS / 2 + i * stepS;
      const winR = buildWindowUnit(mats, { shutters: state.hasShutters, flowerBox: state.hasFlowerBoxes });
      winR.position.set(hw, wy, wz);
      winR.rotation.y = Math.PI / 2;
      fGrp.add(winR);
    }
    const availLeft = D - 1.2;
    const winCountL = Math.max(1, Math.round((availLeft / 2.6) * state.winDensity));
    const stepL = availLeft / winCountL;
    for (let i = 0; i < winCountL; i++) {
      const wz = -hd + 0.6 + stepL / 2 + i * stepL;
      const winL = buildWindowUnit(mats, { shutters: state.hasShutters, flowerBox: state.hasFlowerBoxes && rng() > 0.4 });
      winL.position.set(-hw, wy, wz);
      winL.rotation.y = -Math.PI / 2;
      fGrp.add(winL);
    }
    const winCountB = Math.max(1, Math.round(((W - 1.2) / 2.8) * state.winDensity));
    const stepB = (W - 1.2) / winCountB;
    for (let i = 0; i < winCountB; i++) {
      const wx = -hw + 0.6 + stepB / 2 + i * stepB;
      const winB = buildWindowUnit(mats, { shutters: state.hasShutters, flowerBox: false });
      winB.position.set(wx, wy, -hd);
      winB.rotation.y = Math.PI;
      fGrp.add(winB);
    }
    if (chamfer > 0) {
      const winC = buildWindowUnit(mats, { w: 0.9, h: 1.25, shutters: state.hasShutters, flowerBox: state.hasFlowerBoxes });
      winC.position.set(hw - chamfer / 2, wy, hd - chamfer / 2);
      winC.rotation.y = Math.PI / 4;
      fFront.add(winC);
    }
  }

  if (state.hasWallAC) {
    const ac1 = buildACUnit(mats, 0.9);
    ac1.position.set(-hw + 0.65, floorH - 0.35, hd + 0.22);
    f0Front.add(ac1);
    const ac2 = buildACUnit(mats, 0.9);
    ac2.position.set(hw + 0.22, floorH * 0.72, -hd * 0.52);
    ac2.rotation.y = Math.PI / 2;
    f0.add(ac2);
  }

  if (state.hasVines) {
    const v1 = buildBougainvilleaVine(mats, totalH * 0.92, rng);
    v1.position.set(-hw + 0.22, baseLift, hd + 0.04);
    roofGroup.add(v1);
    const v2 = buildBougainvilleaVine(mats, totalH * 0.78, rng);
    v2.position.set(hw + 0.04, baseLift, -hd + 0.55);
    v2.rotation.y = Math.PI / 2;
    roofGroup.add(v2);
  }

  // ROOF ARCHITECTURE
  const roofY = baseLift + totalH, rScale = state.roofHeight;

  if (state.roofType === 'flat') {
    const parapetH = 0.72 * rScale, pThick = 0.32;
    const deckGeo = new THREE.ExtrudeGeometry(bodyShape, { depth: 0.14, bevelEnabled: false });
    deckGeo.rotateX(-Math.PI / 2);
    addMesh(roofGroup, deckGeo, mats.roofDeck, 0, roofY - 0.04, 0);

    const paraShape = new THREE.Shape();
    paraShape.moveTo(-hw, hd); paraShape.lineTo(hw, hd);
    if (chamfer > 0) { paraShape.lineTo(hw, -hd + chamfer); paraShape.lineTo(hw - chamfer, -hd); }
    else paraShape.lineTo(hw, -hd);
    paraShape.lineTo(-hw, -hd); paraShape.closePath();

    const hole = new THREE.Path();
    hole.moveTo(-hw + pThick, hd - pThick); hole.lineTo(hw - pThick, hd - pThick);
    if (chamfer > 0) { hole.lineTo(hw - pThick, -hd + chamfer + pThick * 0.6); hole.lineTo(hw - chamfer - pThick * 0.6, -hd + pThick); }
    else hole.lineTo(hw - pThick, -hd + pThick);
    hole.lineTo(-hw + pThick, -hd + pThick); hole.closePath();
    paraShape.holes.push(hole);

    const paraGeo = new THREE.ExtrudeGeometry(paraShape, { depth: parapetH, bevelEnabled: false });
    paraGeo.rotateX(-Math.PI / 2);
    addMesh(roofGroup, paraGeo, mats.wall, 0, roofY, 0);

    const capGeo = new THREE.ExtrudeGeometry(paraShape, { depth: 0.10, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.05, bevelSegments: 1 });
    capGeo.rotateX(-Math.PI / 2);
    addMesh(roofGroup, capGeo, mats.trim, 0, roofY + parapetH, 0);

    if (state.hasWaterTank) {
      const tank = buildWaterTank(mats);
      tank.position.set(-hw * 0.44, roofY + 0.1, -hd * 0.25);
      roofGroup.add(tank);
    }
    if (state.hasDish) {
      const dish = buildSatelliteDish(mats);
      dish.position.set(hw * 0.35, roofY + 0.1, -hd * 0.35);
      roofGroup.add(dish);
    }
    if (state.hasRoofAC) {
      const rac1 = buildACUnit(mats, 1.05);
      rac1.position.set(hw * 0.26, roofY + 0.38, hd * 0.22);
      rac1.rotation.y = Math.PI;
      roofGroup.add(rac1);
      if (W >= 8.5) {
        const rac2 = buildACUnit(mats, 0.95);
        rac2.position.set(-hw * 0.02, roofY + 0.35, -hd * 0.44);
        roofGroup.add(rac2);
      }
    }
    if (state.hasRoofGarden) {
      [[-hw * 0.55, hd * 0.36], [hw * 0.46, hd * 0.32], [0, hd * 0.38], [-hw * 0.15, -hd * 0.05]].forEach(([px, pz], idx) => {
        if (chamfer > 0 && px > hw - chamfer - 0.5 && pz > hd - chamfer - 0.5) return;
        const pot = buildPottedPlant(mats, 1.05 + (idx % 2) * 0.35, rng);
        pot.position.set(px, roofY + 0.1, pz);
        roofGroup.add(pot);
      });
    }
    if (state.hasChimney) {
      addMesh(roofGroup, new THREE.BoxGeometry(2.1, 1.8, 2.0), mats.wall, 0.4, roofY + 0.9, -0.3);
      addMesh(roofGroup, new THREE.BoxGeometry(2.3, 0.15, 2.2), mats.trim, 0.4, roofY + 1.85, -0.3);
      addMesh(roofGroup, new THREE.BoxGeometry(0.85, 1.4, 0.12), mats.wood, 0.4, roofY + 0.72, 0.72);
    }
  } else if (state.roofType === 'hipped' || state.roofType === 'gabled') {
    const deckGeo = new THREE.ExtrudeGeometry(bodyShape, { depth: 0.12, bevelEnabled: false });
    deckGeo.rotateX(-Math.PI / 2);
    addMesh(roofGroup, deckGeo, mats.intWall, 0, roofY - 0.04, 0);

    const overhang = 0.55, rH = Math.min(W, D) * 0.28 * rScale;
    if (state.roofType === 'hipped') {
      const rW = W + overhang * 2, rD = D + overhang * 2;
      const ridgeLen = Math.max(0.2, Math.abs(rW - rD));
      const isWide = rW >= rD;
      const topX = isWide ? ridgeLen / 2 : 0.05, topZ = isWide ? 0.05 : ridgeLen / 2;
      const bx = rW / 2, bz = rD / 2;
      const verts = new Float32Array([
        -bx,0,bz, bx,0,bz, topX,rH,topZ,  -bx,0,bz, topX,rH,topZ, -topX,rH,topZ,
        bx,0,-bz, -bx,0,-bz, -topX,rH,-topZ,  bx,0,-bz, -topX,rH,-topZ, topX,rH,-topZ,
        bx,0,bz, bx,0,-bz, topX,rH,-topZ,  bx,0,bz, topX,rH,-topZ, topX,rH,topZ,
        -bx,0,-bz, -bx,0,bz, -topX,rH,topZ,  -bx,0,-bz, -topX,rH,topZ, -topX,rH,-topZ,
      ]);
      const uvs = new Float32Array([
        0,0, 2,0, 1.6,1,  0,0, 1.6,1, 0.4,1,  0,0, 2,0, 1.6,1,  0,0, 1.6,1, 0.4,1,
        0,0, 1.5,0, 0.9,1, 0,0, 0.9,1, 0.6,1,  0,0, 1.5,0, 0.9,1, 0,0, 0.9,1, 0.6,1
      ]);
      const hipGeo = new THREE.BufferGeometry();
      hipGeo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
      hipGeo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
      hipGeo.computeVertexNormals();
      addMesh(roofGroup, hipGeo, mats.terracotta, 0, roofY, 0);
      addMesh(roofGroup, new THREE.CylinderGeometry(0.14, 0.14, ridgeLen + 0.25, 8), mats.terracottaPot, 0, roofY + rH, 0, 0, 0, isWide ? Math.PI / 2 : 0);
    } else {
      const wallTri = new THREE.Shape();
      wallTri.moveTo(-D / 2, 0); wallTri.lineTo(D / 2, 0); wallTri.lineTo(0, rH - 0.12); wallTri.closePath();
      const gableWallGeo = new THREE.ExtrudeGeometry(wallTri, { depth: W, bevelEnabled: false });
      gableWallGeo.rotateY(Math.PI / 2);
      addMesh(roofGroup, gableWallGeo, mats.wall, -W / 2, roofY, 0);

      const slopeLen = Math.hypot(D / 2 + overhang, rH);
      const angle = Math.atan2(rH, D / 2 + overhang);
      const roofLen = W + overhang * 2;
      addMesh(roofGroup, new THREE.BoxGeometry(roofLen, 0.18, slopeLen), mats.terracotta, 0, roofY + rH / 2, (D / 2 + overhang) / 2, angle, 0, 0);
      addMesh(roofGroup, new THREE.BoxGeometry(roofLen, 0.18, slopeLen), mats.terracotta, 0, roofY + rH / 2, -(D / 2 + overhang) / 2, -angle, 0, 0);
      addMesh(roofGroup, new THREE.CylinderGeometry(0.14, 0.14, roofLen + 0.1, 8), mats.terracottaPot, 0, roofY + rH + 0.04, 0, 0, 0, Math.PI / 2);
    }
    if (state.hasChimney) {
      addMesh(roofGroup, new THREE.BoxGeometry(0.75, rH + 0.9, 0.75), mats.brick, W * 0.26, roofY + (rH + 0.9) / 2, -D * 0.18);
      addMesh(roofGroup, new THREE.BoxGeometry(0.95, 0.16, 0.95), mats.trim, W * 0.26, roofY + rH + 0.92, -D * 0.18);
    }
    if (state.hasDish) {
      const dish = buildSatelliteDish(mats);
      dish.position.set(-W * 0.3, roofY + rH * 0.55, -D * 0.2);
      roofGroup.add(dish);
    }
  } else if (state.roofType === 'civic') {
    const deckGeo = new THREE.ExtrudeGeometry(bodyShape, { depth: 0.12, bevelEnabled: false });
    deckGeo.rotateX(-Math.PI / 2);
    addMesh(roofGroup, deckGeo, mats.intWall, 0, roofY - 0.04, 0);

    const rH = 2.0 * rScale;
    const slopeLen = Math.hypot(D / 2 + 0.5, rH), angle = Math.atan2(rH, D / 2 + 0.5);
    addMesh(roofGroup, new THREE.BoxGeometry(W + 0.9, 0.2, slopeLen), mats.terracotta, 0, roofY + rH / 2, (D / 2 + 0.5) / 2, angle, 0, 0);
    addMesh(roofGroup, new THREE.BoxGeometry(W + 0.9, 0.2, slopeLen), mats.terracotta, 0, roofY + rH / 2, -(D / 2 + 0.5) / 2, -angle, 0, 0);
    addMesh(roofGroup, new THREE.CylinderGeometry(0.15, 0.15, W + 1.0, 8), mats.terracottaPot, 0, roofY + rH + 0.04, 0, 0, 0, Math.PI / 2);

    const pedW = Math.min(4.6, W * 0.42), pedH = 1.65 * rScale;
    addMesh(roofGroup, new THREE.BoxGeometry(pedW, pedH, D + 0.5), mats.wall, 0, roofY + pedH / 2, 0.15);
    const tri = new THREE.Shape();
    tri.moveTo(-pedW / 2 - 0.1, 0); tri.lineTo(pedW / 2 + 0.1, 0); tri.lineTo(0, 1.45 * rScale); tri.closePath();
    const triGeo = new THREE.ExtrudeGeometry(tri, { depth: D + 0.55, bevelEnabled: false });
    addMesh(roofGroup, triGeo, mats.wall, 0, roofY + pedH, -(D + 0.55) / 2 + 0.15);

    const pSlope = Math.hypot(pedW / 2 + 0.35, 1.45 * rScale), pAng = Math.atan2(1.45 * rScale, pedW / 2 + 0.35);
    addMesh(roofGroup, new THREE.BoxGeometry(pSlope, 0.18, D + 1.1), mats.terracotta, -(pedW / 2 + 0.35) / 2, roofY + pedH + 0.72 * rScale, 0.15, 0, 0, pAng);
    addMesh(roofGroup, new THREE.BoxGeometry(pSlope, 0.18, D + 1.1), mats.terracotta, (pedW / 2 + 0.35) / 2, roofY + pedH + 0.72 * rScale, 0.15, 0, 0, -pAng);

    const clockR = Math.min(0.75, pedW * 0.19);
    addMesh(roofGroup, new THREE.CylinderGeometry(clockR + 0.08, clockR + 0.08, 0.14, 24), mats.trim, 0, roofY + pedH * 0.72, hd + 0.42, Math.PI / 2, 0, 0);
    addMesh(roofGroup, new THREE.CylinderGeometry(clockR, clockR, 0.18, 24), mats.clock, 0, roofY + pedH * 0.72, hd + 0.44, Math.PI / 2, 0, 0);
  } else if (state.roofType === 'sawtooth') {
    const teeth = 3, tw = W / teeth, th = 1.4 * rScale;
    for (let i = 0; i < teeth; i++) {
      const tx = -hw + tw / 2 + i * tw;
      const sLen = Math.hypot(tw, th), sAng = Math.atan2(th, tw);
      addMesh(roofGroup, new THREE.BoxGeometry(sLen, 0.14, D + 0.2), mats.terracotta, tx, roofY + th / 2, 0, 0, 0, sAng);
      addMesh(roofGroup, new THREE.BoxGeometry(0.12, th, D - 0.3), mats.clearGlass, tx + tw / 2 - 0.06, roofY + th / 2, 0, 0, 0, 0, false, false);
    }
    if (state.hasChimney) {
      const chH = 4.2 * rScale;
      addMesh(roofGroup, new THREE.CylinderGeometry(0.32, 0.52, chH, 10), mats.brick, hw - 0.9, roofY + chH / 2, -hd + 0.9);
      addMesh(roofGroup, new THREE.CylinderGeometry(0.42, 0.38, 0.22, 10), mats.trim, hw - 0.9, roofY + chH, -hd + 0.9);
    }
    if (state.hasWaterTank) {
      const tank = buildWaterTank(mats);
      tank.position.set(hw + 1.35, baseLift, -hd * 0.25);
      buildingGroup.add(tank);
    }
  }
  buildingGroup.add(roofGroup);

  if (state.hasStreetProps && state.showSidewalk) {
    const p1 = buildPottedPlant(mats, 1.0, rng);
    p1.position.set(-hw - 0.55, baseLift, hd + 0.55);
    buildingGroup.add(p1);
    const p2 = buildPottedPlant(mats, 0.9, rng);
    p2.position.set(hw + 0.55, baseLift, hd + 0.45);
    buildingGroup.add(p2);
    const lamp = buildStreetLamp(mats, isNight);
    lamp.position.set(-hw - 1.35, baseLift, hd + 1.55);
    buildingGroup.add(lamp);
  }

  if (state.activeFloor >= floors) state.activeFloor = floors - 1;
  rebuildFloorPills();
  applyViewModeVisibility();

  if (state.viewMode !== 'walk') {
    orbit.desiredTarget.y = baseLift + (state.viewMode === 'cutaway' ? (state.activeFloor + 0.45) * floorH : totalH * 0.48);
  }
  updateStats(W, D, totalH + (state.roofType === 'flat' ? 0.8 : 2.1));
}

function applyViewModeVisibility() {
  const isCutaway = state.viewMode === 'cutaway';
  const isWalk = state.viewMode === 'walk';

  if (roofGroup) roofGroup.visible = !isCutaway;
  floorGroups.forEach((grp, idx) => { grp.visible = isCutaway ? idx <= state.activeFloor : true; });
  frontCutawayGroups.forEach((fGrp) => { fGrp.visible = !isCutaway; });

  const hud = document.getElementById('interior-hud');
  const walkCtrl = document.getElementById('walk-controls');
  if (isCutaway || isWalk) {
    hud.classList.remove('hidden'); hud.classList.add('flex');
  } else {
    hud.classList.add('hidden'); hud.classList.remove('flex');
  }
  walkCtrl.classList.toggle('hidden', !isWalk);
  document.getElementById('floor-hud-label').textContent = isWalk ? 'انتقل للدور:' : 'مقطع الدور:';
}

function rebuildFloorPills() {
  const container = document.getElementById('floor-pills');
  container.innerHTML = '';
  for (let f = 0; f < state.floors; f++) {
    const btn = document.createElement('button');
    const active = f === state.activeFloor;
    btn.className = `px-2.5 py-1 rounded-xl text-[11px] font-bold transition ${active ? 'bg-[#e07a5f] text-white' : 'bg-white/5 text-[#d6c6b8] hover:bg-white/15'}`;
    btn.textContent = f === 0 ? 'الأرضي' : `الدور ${f + 1}`;
    btn.addEventListener('click', () => {
      state.activeFloor = f;
      rebuildFloorPills();
      applyViewModeVisibility();
      if (state.viewMode === 'walk') {
        placeFpsAtFloor(f);
      } else {
        const baseLift = state.showSidewalk ? 0.22 : 0;
        orbit.desiredTarget.y = baseLift + (f + 0.45) * state.floorH;
      }
    });
    container.appendChild(btn);
  }
}

function updateStats(w, d, h) {
  let tris = 0, meshes = 0;
  buildingGroup.traverse((obj) => {
    if (obj.isMesh && obj.geometry) {
      meshes++;
      const g = obj.geometry;
      if (g.index) tris += g.index.count / 3;
      else if (g.attributes.position) tris += g.attributes.position.count / 3;
    }
  });
  document.getElementById('stat-tris').textContent = Math.round(tris).toLocaleString();
  document.getElementById('stat-meshes').textContent = meshes;
  document.getElementById('stat-dims').textContent = `${w.toFixed(1)}×${d.toFixed(1)}×${h.toFixed(1)}m`;
}
