// =========================================================================
// 1. DETERMINISTIC PRNG & STATE MODEL (Decoupled Building / Interior / Env / Camera FX)
// =========================================================================
function mulberry32(seed) {
  let a = seed >>> 0;
  return function() {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const PALETTES = [
  { id: 'cream_emerald', name: 'كريمي وزمردي', wall: '#e8d7c3', trim: '#f5ece0', shutter: '#2f7a57', awning: '#2a8058', roof: '#c86442', flower: '#e04882' },
  { id: 'terracotta_olive', name: 'تيراكوتا وزيتوني', wall: '#de9a7c', trim: '#f3e1cf', shutter: '#3c6e47', awning: '#b84a39', roof: '#c45b38', flower: '#d9468f' },
  { id: 'ochre_teal', name: 'خردلي وفيروزي', wall: '#e5b869', trim: '#f8ebd2', shutter: '#2f7275', awning: '#2e7d5b', roof: '#c96840', flower: '#e85d75' },
  { id: 'peach_walnut', name: 'خوخي وجوزي', wall: '#e6b296', trim: '#f7eadc', shutter: '#6e4c36', awning: '#c45647', roof: '#bd5a3c', flower: '#d63f80' },
  { id: 'lavender_sand', name: 'لافندر ورملي', wall: '#d5c1d6', trim: '#f4edf5', shutter: '#4f6d7a', awning: '#c96f4a', roof: '#c26346', flower: '#e05297' },
  { id: 'mint_rust', name: 'نعناعي وصدئ', wall: '#9fc5b6', trim: '#eef4ef', shutter: '#355c4d', awning: '#c45b44', roof: '#bd5a3a', flower: '#f06292' },
];

const PRESETS = {
  corner_pharmacy: {
    floors: 2, width: 9.0, depth: 7.5, floorH: 3.1, cornerChamfer: true, showSidewalk: true,
    hasInterior: true, showInteriorProps: true, doorOpen: true,
    shopType: 'pharmacy', hasAwning: true, hasShutters: true, hasFlowerBoxes: true,
    hasBalconies: true, hasLaundry: false, hasVines: false, hasWallAC: true, hasStreetProps: true,
    winDensity: 1.0, roofType: 'flat', hasWaterTank: true, hasDish: true, hasRoofAC: true,
    hasRoofGarden: false, hasChimney: false, roofHeight: 1.0,
    wall: '#e8d7c3', trim: '#f5ece0', shutter: '#2f7a57', awning: '#2a8058', roof: '#c86442', flower: '#e04882', weathering: 0.65
  },
  cafe_townhouse: {
    floors: 2, width: 8.5, depth: 7.0, floorH: 3.1, cornerChamfer: false, showSidewalk: true,
    hasInterior: true, showInteriorProps: true, doorOpen: true,
    shopType: 'cafe', hasAwning: true, hasShutters: true, hasFlowerBoxes: true,
    hasBalconies: true, hasLaundry: true, hasVines: true, hasWallAC: true, hasStreetProps: true,
    winDensity: 1.0, roofType: 'flat', hasWaterTank: true, hasDish: true, hasRoofAC: true,
    hasRoofGarden: true, hasChimney: false, roofHeight: 1.0,
    wall: '#e5b869', trim: '#f7ebd4', shutter: '#3c6e47', awning: '#c45647', roof: '#c86442', flower: '#e04882', weathering: 0.7
  },
  market_shop: {
    floors: 2, width: 9.5, depth: 7.0, floorH: 3.0, cornerChamfer: false, showSidewalk: true,
    hasInterior: true, showInteriorProps: true, doorOpen: true,
    shopType: 'market', hasAwning: true, hasShutters: true, hasFlowerBoxes: true,
    hasBalconies: false, hasLaundry: false, hasVines: true, hasWallAC: true, hasStreetProps: true,
    winDensity: 1.1, roofType: 'flat', hasWaterTank: false, hasDish: false, hasRoofAC: true,
    hasRoofGarden: true, hasChimney: false, roofHeight: 1.0,
    wall: '#e8bc66', trim: '#f9eed5', shutter: '#3a7a54', awning: '#2f855a', roof: '#c86442', flower: '#e85d75', weathering: 0.55
  },
  med_villa: {
    floors: 2, width: 9.0, depth: 7.5, floorH: 3.0, cornerChamfer: false, showSidewalk: true,
    hasInterior: true, showInteriorProps: true, doorOpen: true,
    shopType: 'residential', hasAwning: false, hasShutters: true, hasFlowerBoxes: true,
    hasBalconies: true, hasLaundry: false, hasVines: true, hasWallAC: false, hasStreetProps: true,
    winDensity: 1.0, roofType: 'hipped', hasWaterTank: false, hasDish: true, hasRoofAC: false,
    hasRoofGarden: false, hasChimney: true, roofHeight: 1.1,
    wall: '#f0dec6', trim: '#faf3e8', shutter: '#4d7a57', awning: '#c45647', roof: '#cc613d', flower: '#d9468f', weathering: 0.45
  },
  town_hall: {
    floors: 2, width: 13.5, depth: 7.5, floorH: 3.3, cornerChamfer: false, showSidewalk: true,
    hasInterior: true, showInteriorProps: true, doorOpen: true,
    shopType: 'civic', hasAwning: false, hasShutters: false, hasFlowerBoxes: true,
    hasBalconies: false, hasLaundry: false, hasVines: false, hasWallAC: false, hasStreetProps: true,
    winDensity: 1.1, roofType: 'civic', hasWaterTank: false, hasDish: false, hasRoofAC: false,
    hasRoofGarden: false, hasChimney: false, roofHeight: 1.1,
    wall: '#efe2ce', trim: '#faf5ec', shutter: '#6e523d', awning: '#9e2a2b', roof: '#c75d3b', flower: '#e04882', weathering: 0.35
  },
  workshop: {
    floors: 1, width: 11.5, depth: 8.5, floorH: 4.0, cornerChamfer: false, showSidewalk: true,
    hasInterior: true, showInteriorProps: true, doorOpen: true,
    shopType: 'workshop', hasAwning: false, hasShutters: false, hasFlowerBoxes: false,
    hasBalconies: false, hasLaundry: false, hasVines: false, hasWallAC: true, hasStreetProps: true,
    winDensity: 0.9, roofType: 'sawtooth', hasWaterTank: true, hasDish: false, hasRoofAC: false,
    hasRoofGarden: false, hasChimney: true, roofHeight: 1.1,
    wall: '#d8d2cb', trim: '#ece7e1', shutter: '#4b5563', awning: '#4a5568', roof: '#6b7280', flower: '#e04882', weathering: 0.75
  }
};

const state = {
  seed: 4027,
  interiorSeed: 7319,
  envSeed: 5192,
  preset: 'corner_pharmacy',
  ...PRESETS.corner_pharmacy,
  interiorDensity: 1.0,
  interiorStyle: 'warm',
  showEnvironment: true,
  envTrees: true,
  envLamps: true,
  envBenches: true,
  envPlanters: true,
  envDensity: 1.0,
  exportStructure: true,
  exportInterior: true,
  exportEnvironment: false,
  viewMode: 'exterior',
  wallCutMode: 'cutaway',
  activeFloor: 0,
  projection: 'perspective',
  fov: 38,
  exposure: 1.08,
  postFxEnabled: true,
  dofAmount: 0.28,
  dofFocus: 0.50,
  bloomAmount: 0.22,
  outlineAmount: 0.18,
  vignetteAmount: 0.25,
  warmthAmount: 0.15,
  lighting: 'golden',
  wireframe: false,
  autoRotate: false
};
