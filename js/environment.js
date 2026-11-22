// =========================================================================
// 4A. DECOUPLED ENVIRONMENT & STREET SCENE GENERATOR (Sidewalk, Trees, Lamps, Benches)
// =========================================================================
function buildMediterraneanTree(mats, scale, rng) {
  const g = new THREE.Group();
  const trunkH = (1.35 + rng() * 0.45) * scale;
  addMesh(g, new THREE.CylinderGeometry(0.11 * scale, 0.19 * scale, trunkH, 8), mats.wood, 0, trunkH / 2, 0);
  addMesh(g, new THREE.CylinderGeometry(0.06 * scale, 0.10 * scale, 0.65 * scale, 7), mats.wood, 0.16 * scale, trunkH * 0.88, 0.08 * scale, 0.25, 0, -0.45);
  addMesh(g, new THREE.CylinderGeometry(0.06 * scale, 0.09 * scale, 0.58 * scale, 7), mats.wood, -0.15 * scale, trunkH * 0.84, -0.06 * scale, -0.2, 0, 0.42);
  const crownY = trunkH + 0.35 * scale;
  [
    [0, 0.28, 0, 0.82, mats.foliage],
    [0.52, 0.05, 0.26, 0.58, mats.foliageLight],
    [-0.48, 0.08, 0.32, 0.55, mats.foliage],
    [0.18, 0.12, -0.46, 0.56, mats.foliageLight],
    [-0.36, 0.24, -0.30, 0.52, mats.foliage],
    [0.12, 0.62, 0.08, 0.54, mats.foliageLight]
  ].forEach(([cx, cy, cz, r, mat]) => {
    addMesh(g, new THREE.IcosahedronGeometry(r * scale, 1), mat, cx * scale, crownY + cy * scale, cz * scale);
  });
  if (rng() > 0.35) {
    const accentMat = rng() > 0.5 ? mats.citrus : mats.flower;
    for (let i = 0; i < 6; i++) {
      const a = rng() * Math.PI * 2, rad = (0.45 + rng() * 0.32) * scale;
      addMesh(g, new THREE.SphereGeometry(0.075 * scale, 6, 5), accentMat, Math.cos(a) * rad, crownY + (0.05 + rng() * 0.45) * scale, Math.sin(a) * rad, 0, 0, 0, false, false);
    }
  }
  addMesh(g, new THREE.BoxGeometry(1.15 * scale, 0.10, 1.15 * scale), mats.trim, 0, 0.05, 0);
  addMesh(g, new THREE.BoxGeometry(0.92 * scale, 0.12, 0.92 * scale), mats.wood, 0, 0.06, 0);
  return g;
}

function buildParkBench(mats) {
  const g = new THREE.Group();
  addMesh(g, new THREE.BoxGeometry(1.45, 0.06, 0.42), mats.woodLight, 0, 0.44, 0);
  addMesh(g, new THREE.BoxGeometry(1.45, 0.34, 0.06), mats.woodLight, 0, 0.72, -0.19, -0.18, 0, 0);
  [-0.62, 0.62].forEach(lx => {
    addMesh(g, new THREE.BoxGeometry(0.07, 0.44, 0.42), mats.iron, lx, 0.22, 0);
    addMesh(g, new THREE.BoxGeometry(0.06, 0.42, 0.06), mats.iron, lx, 0.64, -0.18);
    addMesh(g, new THREE.BoxGeometry(0.06, 0.05, 0.38), mats.iron, lx, 0.62, 0);
  });
  return g;
}

function buildBollard(mats) {
  const g = new THREE.Group();
  addMesh(g, new THREE.CylinderGeometry(0.065, 0.085, 0.68, 10), mats.iron, 0, 0.34, 0);
  addMesh(g, new THREE.SphereGeometry(0.072, 10, 8), mats.brass, 0, 0.70, 0);
  return g;
}

function buildEnvironmentScene(envGrp, W, D, mats, isNight) {
  clearGroup(envGrp);
  if (!state.showEnvironment) return;
  const rng = mulberry32(state.envSeed);
  const hw = W / 2, hd = D / 2;
  const baseLift = state.showSidewalk ? 0.22 : 0;
  const padW = W + 5.2, padD = D + 5.2;

  if (state.showSidewalk) {
    addMesh(envGrp, new THREE.BoxGeometry(padW, 0.22, padD), mats.sidewalk, 0, 0.11, 0, 0, 0, 0, false, true);
    const curbLen = 0.85;
    const frontCount = Math.floor(padW / curbLen);
    for (let i = 0; i < frontCount; i++) {
      const cx = -padW / 2 + curbLen / 2 + i * curbLen;
      addMesh(envGrp, new THREE.BoxGeometry(curbLen - 0.02, 0.24, 0.22), i % 2 === 0 ? mats.curbDark : mats.curbLight, cx, 0.12, padD / 2 + 0.08);
    }
    const sideCount = Math.floor(padD / curbLen);
    for (let i = 0; i < sideCount; i++) {
      const cz = -padD / 2 + curbLen / 2 + i * curbLen;
      addMesh(envGrp, new THREE.BoxGeometry(0.22, 0.24, curbLen - 0.02), i % 2 === 0 ? mats.curbLight : mats.curbDark, padW / 2 + 0.08, 0.12, cz);
    }
  }

  if (state.envTrees) {
    const treeSlots = [[-hw - 1.55, hd + 1.45], [hw + 1.55, -hd * 0.45], [-hw - 1.55, -hd * 0.55], [hw + 1.45, hd + 1.35]];
    const maxTrees = Math.max(1, Math.min(treeSlots.length, Math.round(2 * state.envDensity)));
    [...treeSlots].sort(() => rng() - 0.5).slice(0, maxTrees).forEach(([tx, tz]) => {
      const tree = buildMediterraneanTree(mats, 0.85 + rng() * 0.35, rng);
      tree.position.set(tx + (rng() - 0.5) * 0.25, baseLift, tz + (rng() - 0.5) * 0.25);
      tree.rotation.y = rng() * Math.PI * 2;
      envGrp.add(tree);
    });
  }

  if (state.envLamps) {
    const lamp1 = buildStreetLamp(mats, isNight);
    lamp1.position.set(-hw - 1.4, baseLift, hd + 1.95);
    envGrp.add(lamp1);
    if (state.envDensity >= 0.9) {
      const lamp2 = buildStreetLamp(mats, isNight);
      lamp2.position.set(hw + 1.75, baseLift, hd * 0.35);
      envGrp.add(lamp2);
    }
    const bollardCount = Math.max(2, Math.round(3 * state.envDensity));
    for (let i = 0; i < bollardCount; i++) {
      const bx = -padW * 0.32 + (i / Math.max(1, bollardCount - 1)) * (padW * 0.64);
      const b = buildBollard(mats);
      b.position.set(bx, baseLift, padD / 2 - 0.32);
      envGrp.add(b);
    }
  }

  if (state.envBenches) {
    const bench = buildParkBench(mats);
    if (rng() > 0.45) { bench.position.set(hw + 1.25, baseLift, -hd * 0.1); bench.rotation.y = Math.PI / 2; }
    else { bench.position.set(-hw * 0.55, baseLift, hd + 1.72); }
    envGrp.add(bench);
    if (state.shopType === 'cafe' || (state.envDensity >= 1.2 && rng() > 0.4)) {
      const t1 = buildCafeTableSet(mats);
      t1.position.set(hw * 0.22, baseLift, hd + 1.52);
      envGrp.add(t1);
    }
  }

  if (state.envPlanters) {
    const spots = [[-hw - 0.55, hd + 0.55], [hw + 0.55, hd + 0.48], [-hw * 0.42, hd + 0.52], [hw + 0.55, -hd * 0.65]];
    const count = Math.max(2, Math.min(spots.length, Math.round(3 * state.envDensity)));
    for (let i = 0; i < count; i++) {
      const [px, pz] = spots[i];
      const pot = buildPottedPlant(mats, 0.85 + rng() * 0.3, rng);
      pot.position.set(px, baseLift, pz);
      envGrp.add(pot);
    }
  }
}
