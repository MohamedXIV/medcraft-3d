// =========================================================================
// 5. SELF-CONTAINED BINARY GLB (glTF 2.0) EXPORTER
// =========================================================================
function srgbToLinear(c) {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function exportBuildingToGLB() {
  buildingGroup.updateMatrixWorld(true);
  const meshes = [];
  buildingGroup.traverse((obj) => {
    if (obj.isMesh && obj.geometry && obj.geometry.attributes.position) meshes.push(obj);
  });

  const gltf = {
    asset: { version: '2.0', generator: 'MedCraft 3D Procedural Generator' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ name: `MedBuilding_${state.seed}`, children: [] }],
    meshes: [], materials: [], accessors: [], bufferViews: [], buffers: [{ byteLength: 0 }]
  };

  const binChunks = [];
  let byteOffset = 0;
  const matMap = new Map();

  function pushBuffer(typedArray, target) {
    const pad = (4 - (byteOffset % 4)) % 4;
    if (pad > 0) { binChunks.push(new Uint8Array(pad)); byteOffset += pad; }
    const bytes = new Uint8Array(typedArray.buffer, typedArray.byteOffset, typedArray.byteLength);
    const bvIndex = gltf.bufferViews.length;
    gltf.bufferViews.push({ buffer: 0, byteOffset, byteLength: bytes.byteLength, ...(target ? { target } : {}) });
    binChunks.push(bytes);
    byteOffset += bytes.byteLength;
    return bvIndex;
  }

  function getMatIndex(threeMat) {
    const col = threeMat.color ? threeMat.color : new THREE.Color('#cccccc');
    const em = threeMat.emissive ? threeMat.emissive : new THREE.Color('#000000');
    const ei = threeMat.emissiveIntensity || 0;
    const rough = threeMat.roughness !== undefined ? threeMat.roughness : 0.8;
    const metal = threeMat.metalness !== undefined ? threeMat.metalness : 0.0;
    const alpha = threeMat.transparent ? (threeMat.opacity || 0.3) : 1.0;
    const key = `${col.getHexString()}_${em.getHexString()}_${ei.toFixed(2)}_${rough.toFixed(2)}_${metal.toFixed(2)}_${alpha.toFixed(2)}`;
    if (matMap.has(key)) return matMap.get(key);

    const idx = gltf.materials.length;
    const matDef = {
      name: `Mat_${idx}`,
      pbrMetallicRoughness: {
        baseColorFactor: [srgbToLinear(col.r), srgbToLinear(col.g), srgbToLinear(col.b), alpha],
        roughnessFactor: rough,
        metallicFactor: metal
      }
    };
    if (alpha < 0.99) matDef.alphaMode = 'BLEND';
    if (ei > 0.05) {
      matDef.emissiveFactor = [
        Math.min(1, srgbToLinear(em.r) * ei),
        Math.min(1, srgbToLinear(em.g) * ei),
        Math.min(1, srgbToLinear(em.b) * ei)
      ];
    }
    gltf.materials.push(matDef);
    matMap.set(key, idx);
    return idx;
  }

  meshes.forEach((mesh, mIdx) => {
    const geom = mesh.geometry.clone();
    geom.applyMatrix4(mesh.matrixWorld);
    if (!geom.attributes.normal) geom.computeVertexNormals();

    const posAttr = geom.attributes.position;
    const normAttr = geom.attributes.normal;
    const posArr = new Float32Array(posAttr.count * 3);
    const normArr = new Float32Array(normAttr.count * 3);

    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i), y = posAttr.getY(i), z = posAttr.getZ(i);
      posArr[i * 3] = x; posArr[i * 3 + 1] = y; posArr[i * 3 + 2] = z;
      if (x < minX) minX = x; if (y < minY) minY = y; if (z < minZ) minZ = z;
      if (x > maxX) maxX = x; if (y > maxY) maxY = y; if (z > maxZ) maxZ = z;
      normArr[i * 3] = normAttr.getX(i); normArr[i * 3 + 1] = normAttr.getY(i); normArr[i * 3 + 2] = normAttr.getZ(i);
    }

    const posBV = pushBuffer(posArr, 34962);
    const posAcc = gltf.accessors.length;
    gltf.accessors.push({ bufferView: posBV, componentType: 5126, count: posAttr.count, type: 'VEC3', min: [minX, minY, minZ], max: [maxX, maxY, maxZ] });

    const normBV = pushBuffer(normArr, 34962);
    const normAcc = gltf.accessors.length;
    gltf.accessors.push({ bufferView: normBV, componentType: 5126, count: normAttr.count, type: 'VEC3' });

    const primitive = {
      attributes: { POSITION: posAcc, NORMAL: normAcc },
      material: getMatIndex(Array.isArray(mesh.material) ? mesh.material[0] : mesh.material)
    };

    if (geom.index) {
      const idxArr = new Uint32Array(geom.index.count);
      for (let i = 0; i < geom.index.count; i++) idxArr[i] = geom.index.getX(i);
      const idxBV = pushBuffer(idxArr, 34963);
      const idxAcc = gltf.accessors.length;
      gltf.accessors.push({ bufferView: idxBV, componentType: 5125, count: idxArr.length, type: 'SCALAR' });
      primitive.indices = idxAcc;
    }

    const meshIdx = gltf.meshes.length;
    gltf.meshes.push({ name: `Part_${mIdx}`, primitives: [primitive] });
    const nodeIdx = gltf.nodes.length;
    gltf.nodes.push({ mesh: meshIdx });
    gltf.nodes[0].children.push(nodeIdx);
    geom.dispose();
  });

  const binPad = (4 - (byteOffset % 4)) % 4;
  if (binPad > 0) { binChunks.push(new Uint8Array(binPad)); byteOffset += binPad; }
  gltf.buffers[0].byteLength = byteOffset;

  const jsonRaw = new TextEncoder().encode(JSON.stringify(gltf));
  const jsonPad = (4 - (jsonRaw.length % 4)) % 4;
  const jsonBuf = new Uint8Array(jsonRaw.length + jsonPad);
  jsonBuf.set(jsonRaw);
  for (let i = 0; i < jsonPad; i++) jsonBuf[jsonRaw.length + i] = 0x20;

  const totalLen = 12 + 8 + jsonBuf.length + 8 + byteOffset;
  const out = new Uint8Array(totalLen);
  const dv = new DataView(out.buffer);
  dv.setUint32(0, 0x46546C67, true);
  dv.setUint32(4, 2, true);
  dv.setUint32(8, totalLen, true);
  dv.setUint32(12, jsonBuf.length, true);
  dv.setUint32(16, 0x4E4F534A, true);
  out.set(jsonBuf, 20);

  const binStart = 20 + jsonBuf.length;
  dv.setUint32(binStart, byteOffset, true);
  dv.setUint32(binStart + 4, 0x004E4942, true);
  let cursor = binStart + 8;
  for (const ch of binChunks) { out.set(ch, cursor); cursor += ch.length; }

  const blob = new Blob([out], { type: 'model/gltf-binary' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `medcraft-building-${state.seed}.glb`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast(`تم تصدير المجسم الداخلي والخارجي medcraft-building-${state.seed}.glb!`);
}
