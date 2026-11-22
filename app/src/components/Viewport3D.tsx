import React, { useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Grid, OrbitControls, OrthographicCamera, PerspectiveCamera, TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import { Brush, Evaluator, SUBTRACTION } from 'three-bvh-csg';
import { useSceneStore } from '../store/useSceneStore';
import { createFloorTexture, createStuccoTexture, createTerracottaTexture } from '../procedural/textures';
import { ProceduralObjectMesh } from '../procedural/objects';
import type { FreeformWall, SceneNode } from '../types/scene';

const csgEvaluator = new Evaluator();

const LIGHTING_MAP = {
  golden: { bg: '#e8d2b5', sun: '#ffd9a8', sunInt: 1.5, hemiSky: '#fff1db', hemiGnd: '#8c694a' },
  noon: { bg: '#cfe3f0', sun: '#fffbf0', sunInt: 1.55, hemiSky: '#e8f4ff', hemiGnd: '#9c8a75' },
  sunset: { bg: '#d99b7e', sun: '#ff9e64', sunInt: 1.45, hemiSky: '#ffc8a8', hemiGnd: '#6b4740' },
  night: { bg: '#1e2436', sun: '#8da9d4', sunInt: 0.45, hemiSky: '#3b4a6b', hemiGnd: '#1e1b24' }
};

/** Upper floor slab with Live CSG Boolean Subtraction from any staircase/slab cutter */
function UpperFloorSlabCSG() {
  const nodes = useSceneStore((s) => s.nodes);
  const { width, depth, floorHeight, floors } = useSceneStore((s) => s.building);
  const floorTex = useMemo(() => createFloorTexture('wood'), []);

  const slabGeo = useMemo(() => {
    const base = new Brush(new THREE.BoxGeometry(width, 0.18, depth));
    base.position.set(0, floorHeight, 0);
    base.updateMatrixWorld();

    let result: Brush = base;
    for (const node of nodes) {
      const cutter = node.booleanCutter;
      if (!cutter?.enabled || !cutter.targets.includes('slabs')) continue;
      const [bw, bh, bd] = cutter.boxSize;
      const [ox, oy, oz] = cutter.boxOffset;
      const [px, py, pz] = node.transform.position;
      const [rx, ry, rz] = node.transform.rotation;
      const [sx, sy, sz] = node.transform.scale;

      const sub = new Brush(new THREE.BoxGeometry(bw * sx, bh * sy, bd * sz));
      sub.position.set(px + ox, py + oy, pz + oz);
      sub.rotation.set(rx, ry, rz);
      sub.updateMatrixWorld();

      result = csgEvaluator.evaluate(result, sub, SUBTRACTION);
    }
    return result.geometry;
  }, [nodes, width, depth, floorHeight]);

  if (floors < 2) return null;
  return (
    <mesh geometry={slabGeo} receiveShadow castShadow>
      <meshStandardMaterial map={floorTex} roughness={0.78} />
    </mesh>
  );
}

/** Wall mesh with Live CSG Boolean Subtraction for any window/door cutter intersecting it! */
function WallCSGMesh({ wall, floorHeight, cutMode, stuccoTex }: { wall: FreeformWall; floorHeight: number; cutMode: string; stuccoTex: THREE.CanvasTexture }) {
  const nodes = useSceneStore((s) => s.nodes);
  const dx = wall.end[0] - wall.start[0];
  const dz = wall.end[1] - wall.start[1];
  const len = Math.hypot(dx, dz);
  const cx = (wall.start[0] + wall.end[0]) / 2;
  const cz = (wall.start[1] + wall.end[1]) / 2;
  const angle = -Math.atan2(dz, dx);

  let h = wall.heightPreset === 'full' ? floorHeight : wall.heightPreset === 'half' ? floorHeight * 0.5 : 1.0;
  const isFrontOrRight = cz > 2.0 || cx > 3.0;
  if (cutMode === 'down' || (cutMode === 'cutaway' && isFrontOrRight)) {
    h = 0.36;
  }

  const wallGeo = useMemo(() => {
    const base = new Brush(new THREE.BoxGeometry(len, h, wall.thickness));
    base.position.set(cx, h / 2, cz);
    base.rotation.set(0, angle, 0);
    base.updateMatrixWorld();

    let result: Brush = base;
    for (const node of nodes) {
      const cutter = node.booleanCutter;
      if (!cutter?.enabled || !cutter.targets.includes('walls')) continue;
      const [bw, bh, bd] = cutter.boxSize;
      const [ox, oy, oz] = cutter.boxOffset;
      const [px, py, pz] = node.transform.position;
      const [rx, ry, rz] = node.transform.rotation;
      const [sx, sy, sz] = node.transform.scale;

      const sub = new Brush(new THREE.BoxGeometry(bw * sx, bh * sy, bd * sz));
      sub.position.set(px + ox, py + oy, pz + oz);
      sub.rotation.set(rx, ry, rz);
      sub.updateMatrixWorld();

      result = csgEvaluator.evaluate(result, sub, SUBTRACTION);
    }
    return result.geometry;
  }, [nodes, len, h, wall.thickness, cx, cz, angle]);

  return (
    <mesh geometry={wallGeo} castShadow receiveShadow>
      <meshStandardMaterial map={stuccoTex} roughness={0.88} />
    </mesh>
  );
}

function ProceduralRoof({ cutMode }: { cutMode: string }) {
  const { width, depth, floors, floorHeight, roofType, roofColor, trimColor, seed } = useSceneStore((s) => s.building);
  const terraTex = useMemo(() => createTerracottaTexture(roofColor, seed), [roofColor, seed]);
  if (cutMode !== 'up') return null;
  const roofY = floors * floorHeight;

  if (roofType === 'flat') {
    return (
      <group position={[0, roofY, 0]}>
        <mesh position={[0, 0.08, 0]} receiveShadow><boxGeometry args={[width + 0.2, 0.16, depth + 0.2]} /><meshStandardMaterial color="#b8a898" roughness={0.95} /></mesh>
        <mesh position={[0, 0.45, -depth / 2]} castShadow><boxGeometry args={[width + 0.2, 0.65, 0.26]} /><meshStandardMaterial color={trimColor} roughness={0.82} /></mesh>
        <mesh position={[0, 0.45, depth / 2]} castShadow><boxGeometry args={[width + 0.2, 0.65, 0.26]} /><meshStandardMaterial color={trimColor} roughness={0.82} /></mesh>
        <mesh position={[-width / 2, 0.45, 0]} castShadow><boxGeometry args={[0.26, 0.65, depth + 0.2]} /><meshStandardMaterial color={trimColor} roughness={0.82} /></mesh>
        <mesh position={[width / 2, 0.45, 0]} castShadow><boxGeometry args={[0.26, 0.65, depth + 0.2]} /><meshStandardMaterial color={trimColor} roughness={0.82} /></mesh>
      </group>
    );
  }
  return (
    <mesh position={[0, roofY + 1.25, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
      <coneGeometry args={[Math.max(width, depth) * 0.78, 2.5, 4]} />
      <meshStandardMaterial map={terraTex} roughness={0.78} />
    </mesh>
  );
}

function SelectableNode({ node, selected, onSelect, onDragState }: { node: SceneNode; selected: boolean; onSelect: () => void; onDragState: (d: boolean) => void }) {
  const groupRef = useRef<THREE.Group>(null!);
  const transformMode = useSceneStore((s) => s.transformMode);
  const snapToGrid = useSceneStore((s) => s.snapToGrid);
  const gridSize = useSceneStore((s) => s.gridSize);
  const { shutterColor, trimColor } = useSceneStore((s) => s.building);
  const updateNodeTransform = useSceneStore((s) => s.updateNodeTransform);

  return (
    <>
      <group
        ref={groupRef}
        position={node.transform.position}
        rotation={node.transform.rotation}
        scale={node.transform.scale}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        <ProceduralObjectMesh recipe={node.recipe} shutterColor={shutterColor} trimColor={trimColor} />
        {node.booleanCutter?.enabled && (
          <mesh position={node.booleanCutter.boxOffset}>
            <boxGeometry args={node.booleanCutter.boxSize} />
            <meshBasicMaterial color="#e07a5f" wireframe transparent opacity={selected ? 0.9 : 0.28} />
          </mesh>
        )}
      </group>
      {selected && groupRef.current && (
        <TransformControls
          object={groupRef.current}
          mode={transformMode}
          translationSnap={snapToGrid ? gridSize : null}
          rotationSnap={snapToGrid ? Math.PI / 12 : null}
          onMouseDown={() => onDragState(true)}
          onMouseUp={() => {
            onDragState(false);
            const g = groupRef.current;
            if (!g) return;
            updateNodeTransform(node.id, {
              position: [g.position.x, g.position.y, g.position.z],
              rotation: [g.rotation.x, g.rotation.y, g.rotation.z],
              scale: [g.scale.x, g.scale.y, g.scale.z]
            });
          }}
        />
      )}
    </>
  );
}

export function Viewport3D({ sceneRootRef }: { sceneRootRef: React.RefObject<THREE.Group> }) {
  const nodes = useSceneStore((s) => s.nodes);
  const walls = useSceneStore((s) => s.walls);
  const building = useSceneStore((s) => s.building);
  const wallCutMode = useSceneStore((s) => s.wallCutMode);
  const projection = useSceneStore((s) => s.projection);
  const selectedId = useSceneStore((s) => s.selectedId);
  const selectNode = useSceneStore((s) => s.selectNode);
  const [draggingGizmo, setDraggingGizmo] = useState(false);

  const stuccoTex = useMemo(
    () => createStuccoTexture(building.wallColor, building.weathering, building.seed),
    [building.wallColor, building.weathering, building.seed]
  );
  const gfFloorTex = useMemo(() => createFloorTexture('checker'), []);
  const lp = LIGHTING_MAP[building.lighting];

  return (
    <Canvas shadows onPointerMissed={() => selectNode(null)}>
      {projection === 'orthographic' ? (
        <OrthographicCamera makeDefault position={[18, 16, 18]} zoom={42} near={0.1} far={200} />
      ) : (
        <PerspectiveCamera makeDefault position={[15, 12, 16]} fov={38} near={0.1} far={200} />
      )}

      <color attach="background" args={[lp.bg]} />
      <hemisphereLight args={[lp.hemiSky, lp.hemiGnd, 0.82]} />
      <directionalLight position={[14, 22, 15]} color={lp.sun} intensity={lp.sunInt} castShadow shadow-mapSize={[2048, 2048]} />

      <group ref={sceneRootRef} name="MedCraftSceneRoot">
        {/* Sidewalk Pad */}
        {building.showSidewalk && (
          <mesh position={[0, -0.14, 0]} receiveShadow>
            <boxGeometry args={[building.width + 5.2, 0.16, building.depth + 5.2]} />
            <meshStandardMaterial color="#c9b8a7" roughness={0.92} />
          </mesh>
        )}

        {/* Ground Floor Checkered Tile Slab */}
        <mesh position={[0, -0.04, 0]} receiveShadow>
          <boxGeometry args={[building.width, 0.1, building.depth]} />
          <meshStandardMaterial map={gfFloorTex} roughness={0.75} />
        </mesh>

        {/* Upper Floor Slab with Live CSG Boolean Subtraction */}
        <UpperFloorSlabCSG />

        {/* Walls with Live CSG Boolean Window/Door Subtraction */}
        {walls.map((w) => (
          <WallCSGMesh key={w.id} wall={w} floorHeight={building.floorHeight} cutMode={wallCutMode} stuccoTex={stuccoTex} />
        ))}

        {/* Procedural Roof */}
        <ProceduralRoof cutMode={wallCutMode} />

        {/* Interactive Selectable & Editable Scene Nodes */}
        {nodes.map((node) => (
          <SelectableNode
            key={node.id}
            node={node}
            selected={node.id === selectedId}
            onSelect={() => selectNode(node.id)}
            onDragState={setDraggingGizmo}
          />
        ))}
      </group>

      <Grid args={[32, 32]} cellSize={0.5} sectionSize={2} fadeDistance={36} position={[0, 0.015, 0]} />
      <OrbitControls makeDefault enabled={!draggingGizmo} />
    </Canvas>
  );
}
