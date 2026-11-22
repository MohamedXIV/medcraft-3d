// =========================================================================
// 4B. DECOUPLED PROCEDURAL INTERIOR FURNITURE ENGINE (Independent Seed & Variations)
// =========================================================================
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
  for (let i = 0; i < steps; i++) addMesh(g, new THREE.BoxGeometry(stairW, stepH * 0.9, stepD + 0.04), mats.woodLight, 0, (i + 0.5) * stepH, i * stepD);
  addMesh(g, new THREE.CylinderGeometry(0.03, 0.03, 0.95, 6), mats.iron, stairW / 2 - 0.04, 0.5, 0.08);
  addMesh(g, new THREE.CylinderGeometry(0.03, 0.03, 0.95, 6), mats.iron, stairW / 2 - 0.04, floorH + 0.4, totalRun - 0.08);
  const railLen = Math.hypot(totalRun, floorH), railAng = Math.atan2(floorH, totalRun);
  addMesh(g, new THREE.CylinderGeometry(0.025, 0.025, railLen, 6), mats.wood, stairW / 2 - 0.04, floorH / 2 + 0.85, totalRun / 2, Math.PI / 2 - railAng, 0, 0);
  return g;
}

function buildBookshelfOrMedicineRack(mats, w, h, isPharmacy, rng) {
  const g = new THREE.Group();
  const d = 0.42;
  addMesh(g, new THREE.BoxGeometry(w, h, 0.06), isPharmacy ? mats.acBody : mats.wood, 0, h / 2, -d / 2);
  [-w / 2 + 0.04, w / 2 - 0.04].forEach(sx => addMesh(g, new THREE.BoxGeometry(0.08, h, d), isPharmacy ? mats.acBody : mats.wood, sx, h / 2, 0));
  const itemColors = isPharmacy ? ['#2f855a', '#ffffff', '#3b82f6', '#ef4444', '#81b29a', '#f59e0b'] : ['#b84a39', '#3d7a5a', '#d99b43', '#4f6d7a', '#8c5338', '#c46f6f'];
  for (let s = 0; s < 4; s++) {
    const sy = 0.22 + (s / 4) * (h - 0.35);
    addMesh(g, new THREE.BoxGeometry(w - 0.1, 0.05, d), isPharmacy ? mats.acBody : mats.woodLight, 0, sy, 0);
    const items = Math.max(4, Math.floor(w * 4.5 * state.interiorDensity));
    for (let i = 0; i < items; i++) {
      const ix = -w / 2 + 0.18 + (i / items) * (w - 0.32), ih = 0.16 + rng() * 0.14, iw = (w - 0.38) / items * 0.78;
      const mat = new THREE.MeshStandardMaterial({ color: itemColors[Math.floor(rng() * itemColors.length)], roughness: 0.6, wireframe: state.wireframe });
      addMesh(g, new THREE.BoxGeometry(iw, ih, 0.18), mat, ix, sy + ih / 2 + 0.025, 0.04);
    }
  }
  return g;
}

function buildFramedWallArt(mats, rng) {
  const g = new THREE.Group();
  const artColors = ['#e07a5f', '#81b29a', '#f2cc8f', '#457b9d', '#d97757'];
  const cMat = new THREE.MeshStandardMaterial({ color: artColors[Math.floor(rng() * artColors.length)], roughness: 0.7, wireframe: state.wireframe });
  addMesh(g, new THREE.BoxGeometry(0.95, 0.68, 0.05), mats.wood, 0, 0, 0);
  addMesh(g, new THREE.BoxGeometry(0.82, 0.55, 0.06), cMat, 0, 0, 0.01);
  return g;
}

function buildIndoorFloorPlant(mats, rng) {
  const g = new THREE.Group();
  addMesh(g, new THREE.CylinderGeometry(0.20, 0.14, 0.34, 10), mats.terracottaPot, 0, 0.17, 0);
  addMesh(g, new THREE.IcosahedronGeometry(0.28, 1), mats.foliage, 0, 0.54, 0);
  addMesh(g, new THREE.IcosahedronGeometry(0.20, 1), mats.foliageLight, 0.12, 0.72, 0.08);
  if (rng() > 0.5) addMesh(g, new THREE.IcosahedronGeometry(0.18, 1), mats.foliage, -0.14, 0.66, -0.06);
  return g;
}

function getInteriorStyleColors(rng) {
  const stylePalettes = {
    warm:   { sofa: ['#c87d5c', '#b56547', '#d49a6a'], duvet: ['#5b8a72', '#d4a373', '#81b29a'], rug: ['#a84a3d', '#b86b35', '#7f4f24'] },
    modern: { sofa: ['#52667a', '#6b7280', '#4a6b65'], duvet: ['#64748b', '#94a3b8', '#475569'], rug: ['#334155', '#57534e', '#4b5563'] },
    rustic: { sofa: ['#8c5a3c', '#7c5238', '#9c6644'], duvet: ['#a67c52', '#6b705c', '#b08968'], rug: ['#8c3f2e', '#6f4e37', '#99582a'] }
  };
  const p = stylePalettes[state.interiorStyle] || stylePalettes.warm;
  return {
    sofa: p.sofa[Math.floor(rng() * p.sofa.length)],
    duvet: p.duvet[Math.floor(rng() * p.duvet.length)],
    rug: p.rug[Math.floor(rng() * p.rug.length)]
  };
}

function buildGroundFloorInterior(parent, W, D, floorH, mats, rng) {
  const iw = W - 0.65, id = D - 0.65, type = state.shopType, dens = state.interiorDensity;
  const sc = getInteriorStyleColors(rng);
  const sofaMat = new THREE.MeshStandardMaterial({ color: sc.sofa, roughness: 0.88, wireframe: state.wireframe });
  const rugMat = new THREE.MeshStandardMaterial({ color: sc.rug, roughness: 0.95, wireframe: state.wireframe });

  const lamp1 = buildPendantLamp(mats, floorH); lamp1.position.set(-iw * 0.2, 0, 0); parent.add(lamp1);
  if (iw > 5.5) { const lamp2 = buildPendantLamp(mats, floorH); lamp2.position.set(iw * 0.2, 0, 0); parent.add(lamp2); }

  if (type === 'pharmacy') {
    const rack = buildBookshelfOrMedicineRack(mats, Math.min(iw * 0.62, 4.4), 2.25, true, rng);
    rack.position.set(iw * 0.12, 0, -id / 2 + 0.28); parent.add(rack);
    const cntW = Math.min(iw * 0.56, 3.8);
    addMesh(parent, new THREE.BoxGeometry(cntW, 0.96, 0.65), mats.shutter, iw * 0.08, 0.48, -id * 0.08);
    addMesh(parent, new THREE.BoxGeometry(cntW + 0.08, 0.08, 0.74), mats.trim, iw * 0.08, 0.98, -id * 0.08);
    addMesh(parent, new THREE.BoxGeometry(0.45, 0.32, 0.06), mats.darkMetal, iw * 0.08 - 0.5, 1.24, -id * 0.08);
    addMesh(parent, new THREE.BoxGeometry(0.36, 0.22, 0.3), mats.acBody, iw * 0.08 + 0.55, 1.13, -id * 0.08);
    addMesh(parent, new THREE.BoxGeometry(0.48, 0.44, 1.5), mats.woodLight, iw / 2 - 0.42, 0.22, 0.4);
    if (dens >= 1.0) { const pl = buildIndoorFloorPlant(mats, rng); pl.position.set(-iw * 0.36, 0, id * 0.26); parent.add(pl); }
  } else if (type === 'cafe') {
    const barW = Math.min(iw * 0.62, 4.4);
    addMesh(parent, new THREE.BoxGeometry(barW, 1.0, 0.72), mats.wood, iw * 0.1, 0.5, -id / 2 + 1.15);
    addMesh(parent, new THREE.BoxGeometry(barW + 0.1, 0.09, 0.84), mats.trim, iw * 0.1, 1.02, -id / 2 + 1.15);
    addMesh(parent, new THREE.BoxGeometry(0.75, 0.52, 0.45), mats.darkMetal, iw * 0.1 - 0.7, 1.32, -id / 2 + 1.1);
    addMesh(parent, new THREE.BoxGeometry(1.15, 0.48, 0.52), mats.shopGlass, iw * 0.1 + 0.75, 1.3, -id / 2 + 1.15, 0, 0, 0, false, false);
    addMesh(parent, new THREE.CylinderGeometry(0.14, 0.14, 0.08, 10), mats.terracottaPot, iw * 0.1 + 0.55, 1.12, -id / 2 + 1.15);
    addMesh(parent, new THREE.CylinderGeometry(0.14, 0.14, 0.08, 10), mats.woodLight, iw * 0.1 + 0.95, 1.12, -id / 2 + 1.15);
    addMesh(parent, new THREE.BoxGeometry(2.4, 0.95, 0.06), mats.iron, iw * 0.1, 2.05, -id / 2 + 0.12);
    const t1 = buildCafeTableSet(mats); t1.position.set(0.3 + (rng() - 0.5) * 0.3, 0, id * 0.16); parent.add(t1);
    if (iw > 6.2 && dens >= 0.8) { const t2 = buildCafeTableSet(mats); t2.position.set(-1.6, 0, id * 0.18); parent.add(t2); }
    if (dens >= 1.1) { const pl = buildIndoorFloorPlant(mats, rng); pl.position.set(iw * 0.38, 0, id * 0.28); parent.add(pl); }
  } else if (type === 'market') {
    addMesh(parent, new THREE.BoxGeometry(1.8, 0.92, 0.65), mats.wood, iw * 0.28, 0.46, -id * 0.2);
    addMesh(parent, new THREE.BoxGeometry(1.9, 0.08, 0.72), mats.trim, iw * 0.28, 0.94, -id * 0.2);
    const colors = ['#f59e0b', '#dc2626', '#65a30d', '#facc15', '#ea580c'];
    const crateCount = Math.max(2, Math.min(4, Math.round(3 * dens)));
    for (let i = 0; i < crateCount; i++) {
      const cx = -iw * 0.24 + i * 0.92;
      const cr = buildProduceCrate(mats, colors[(i + Math.floor(rng() * 5)) % colors.length]);
      cr.position.set(cx, 0.25, 0.35);
      addMesh(parent, new THREE.BoxGeometry(0.8, 0.25, 0.6), mats.wood, cx, 0.125, 0.35);
      parent.add(cr);
    }
    const rack = buildBookshelfOrMedicineRack(mats, Math.min(iw * 0.55, 3.8), 2.1, false, rng);
    rack.position.set(0.5, 0, -id / 2 + 0.28); parent.add(rack);
  } else if (type === 'office') {
    addMesh(parent, new THREE.BoxGeometry(Math.min(iw * 0.6, 4.2), 0.03, Math.min(id * 0.55, 3.2)), rugMat, 0.2, 0.015, 0.1);
    addMesh(parent, new THREE.BoxGeometry(1.85, 0.76, 0.88), mats.wood, 0.2, 0.38, -0.3);
    addMesh(parent, new THREE.BoxGeometry(0.52, 0.36, 0.06), mats.darkMetal, 0.2, 1.0, -0.45);
    addMesh(parent, new THREE.BoxGeometry(0.55, 0.55, 0.55), mats.iron, 0.2, 0.32, -1.05);
    addMesh(parent, new THREE.BoxGeometry(0.55, 0.65, 0.1), mats.iron, 0.2, 0.78, -1.28);
    const bs = buildBookshelfOrMedicineRack(mats, Math.min(iw * 0.55, 3.6), 2.2, false, rng);
    bs.position.set(0.4, 0, -id / 2 + 0.28); parent.add(bs);
  } else if (type === 'civic') {
    addMesh(parent, new THREE.BoxGeometry(2.1, 0.03, id - 0.4), mats.banner, 0, 0.015, 0);
    addMesh(parent, new THREE.BoxGeometry(2.6, 1.05, 0.75), mats.wood, 0, 0.525, -id * 0.28);
    addMesh(parent, new THREE.BoxGeometry(2.75, 0.1, 0.85), mats.trim, 0, 1.08, -id * 0.28);
    [-iw * 0.32, iw * 0.32].forEach(bx => addMesh(parent, new THREE.BoxGeometry(0.55, 0.48, 2.2), mats.woodLight, bx, 0.24, 0.3));
  } else if (type === 'workshop') {
    addMesh(parent, new THREE.BoxGeometry(2.6, 0.88, 0.85), mats.wood, -iw * 0.18, 0.44, -id * 0.26);
    addMesh(parent, new THREE.BoxGeometry(2.7, 0.08, 0.92), mats.darkMetal, -iw * 0.18, 0.9, -id * 0.26);
    addMesh(parent, new THREE.BoxGeometry(0.95, 0.95, 0.95), mats.woodLight, iw * 0.28, 0.475, -id * 0.2);
    addMesh(parent, new THREE.CylinderGeometry(0.32, 0.32, 0.95, 12), mats.shutter, iw * 0.34, 0.475, 0.65);
    addMesh(parent, new THREE.CylinderGeometry(0.32, 0.32, 0.95, 12), mats.terracottaPot, iw * 0.24, 0.475, 1.35);
  } else {
    addMesh(parent, new THREE.BoxGeometry(3.2, 0.03, 2.4), rugMat, 0.4, 0.015, 0.1);
    addMesh(parent, new THREE.BoxGeometry(2.2, 0.42, 0.85), sofaMat, 0.4, 0.21, -0.85);
    addMesh(parent, new THREE.BoxGeometry(2.2, 0.55, 0.2), sofaMat, 0.4, 0.58, -1.18);
    [-1.0, 1.0].forEach(ax => addMesh(parent, new THREE.BoxGeometry(0.22, 0.52, 0.85), sofaMat, 0.4 + ax, 0.36, -0.85));
    addMesh(parent, new THREE.BoxGeometry(1.15, 0.42, 0.62), mats.woodLight, 0.4, 0.21, 0.15);
    const bs = buildBookshelfOrMedicineRack(mats, 1.8, 2.0, false, rng);
    bs.position.set(iw / 2 - 0.3, 0, -0.3); bs.rotation.y = -Math.PI / 2; parent.add(bs);
  }

  if (dens >= 0.9) {
    const art = buildFramedWallArt(mats, rng);
    art.position.set(-iw * 0.32, 1.75, -id / 2 + 0.08);
    parent.add(art);
  }
}

function buildUpperApartmentInterior(parent, W, D, floorH, mats, rng) {
  const iw = W - 0.65, id = D - 0.65, dens = state.interiorDensity;
  const sc = getInteriorStyleColors(rng);
  const sofaMat = new THREE.MeshStandardMaterial({ color: sc.sofa, roughness: 0.88, wireframe: state.wireframe });
  const duvetMat = new THREE.MeshStandardMaterial({ color: sc.duvet, roughness: 0.85, wireframe: state.wireframe });
  const rugMat = new THREE.MeshStandardMaterial({ color: sc.rug, roughness: 0.95, wireframe: state.wireframe });

  const l1 = buildPendantLamp(mats, floorH); l1.position.set(-iw * 0.22, 0, 0); parent.add(l1);
  const l2 = buildPendantLamp(mats, floorH); l2.position.set(iw * 0.24, 0, 0); parent.add(l2);

  if (iw >= 6.0) {
    const partX = 0.25, backSeg = id * 0.48;
    addMesh(parent, new THREE.BoxGeometry(0.14, floorH - 0.1, backSeg), mats.intWall, partX, (floorH - 0.1) / 2, -id / 2 + backSeg / 2);
    addMesh(parent, new THREE.BoxGeometry(0.14, floorH - 2.15, id - backSeg), mats.intWall, partX, 2.15 + (floorH - 2.15) / 2, id / 2 - (id - backSeg) / 2);
  }

  const bedX = iw * 0.28, bedZ = -id * 0.12;
  addMesh(parent, new THREE.BoxGeometry(1.55, 0.36, 2.05), mats.wood, bedX, 0.18, bedZ);
  addMesh(parent, new THREE.BoxGeometry(1.45, 0.22, 1.95), mats.trim, bedX, 0.44, bedZ);
  addMesh(parent, new THREE.BoxGeometry(1.48, 0.24, 1.32), duvetMat, bedX, 0.46, bedZ + 0.3);
  addMesh(parent, new THREE.BoxGeometry(0.55, 0.14, 0.35), mats.acBody, bedX - 0.34, 0.60, bedZ - 0.72);
  addMesh(parent, new THREE.BoxGeometry(0.55, 0.14, 0.35), mats.acBody, bedX + 0.34, 0.60, bedZ - 0.72);
  addMesh(parent, new THREE.BoxGeometry(1.62, 0.95, 0.10), mats.wood, bedX, 0.48, bedZ - 1.02);
  addMesh(parent, new THREE.BoxGeometry(0.45, 0.48, 0.42), mats.woodLight, bedX - 1.08, 0.24, bedZ - 0.75);
  addMesh(parent, new THREE.CylinderGeometry(0.10, 0.14, 0.22, 10), mats.warmBulb, bedX - 1.08, 0.62, bedZ - 0.75, 0, 0, 0, false, false);

  if (dens >= 1.0 && id >= 5.5) addMesh(parent, new THREE.BoxGeometry(1.25, 1.85, 0.52), mats.wood, bedX + 0.1, 0.925, id / 2 - 0.42);

  const kitX = -iw * 0.22;
  if (iw >= 6.5) {
    addMesh(parent, new THREE.BoxGeometry(1.9, 0.03, 1.5), rugMat, kitX + 0.3, 0.015, id * 0.18);
    addMesh(parent, new THREE.BoxGeometry(1.65, 0.4, 0.72), sofaMat, kitX + 0.3, 0.2, id * 0.22);
    addMesh(parent, new THREE.BoxGeometry(1.65, 0.48, 0.18), sofaMat, kitX + 0.3, 0.54, id * 0.22 + 0.28);
    addMesh(parent, new THREE.BoxGeometry(1.6, 0.88, 0.58), mats.acBody, -iw * 0.14, 0.44, -id / 2 + 0.38);
    addMesh(parent, new THREE.BoxGeometry(1.66, 0.07, 0.64), mats.woodLight, -iw * 0.14, 0.9, -id / 2 + 0.38);
    if (dens >= 0.95) {
      const art = buildFramedWallArt(mats, rng); art.position.set(bedX, 1.72, -id / 2 + 0.08); parent.add(art);
      const pl = buildIndoorFloorPlant(mats, rng); pl.position.set(kitX - 0.75, 0, id * 0.28); parent.add(pl);
    }
  }
}
