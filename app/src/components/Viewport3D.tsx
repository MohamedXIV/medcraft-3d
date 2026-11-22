import React, { useMemo, useRef, useState } from 'react';
import { Canvas, type ThreeEvent } from '@react-three/fiber';
import { Grid, OrbitControls, OrthographicCamera, PerspectiveCamera, TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import { Brush, Evaluator, SUBTRACTION } from 'three-bvh-csg';
import { useSceneStore } from '../store/useSceneStore';
import { createFloorTexture, createStuccoTexture, createTerracottaTexture } from '../procedural/textures';
import { ProceduralObjectMesh } from '../procedural/objects';
import type { FreeformWall, SceneNode, Vec3 } from '../types/scene';

const csgEvaluator = new Evaluator();

const LIGHTING_MAP = {
  golden: { bg: '#e8d2b5', sun: '#ffd9a8', sunInt: 1.5, hemiSky: '#fff1db', hemiGnd: '#8c694a' },
  noon: { bg: '#cfe3f0', sun: '#fffbf0', sunInt: 1.55, hemiSky: '#e8f4ff', hemiGnd: '#9c8a75' },
  sunset: { bg: '#d99b7e', sun: '#ff9e64', sunInt: 1.45, hemiSky: '#ffc8a8', hemiGnd: '#6b4740' },
  night: { bg: '#1e2436', sun: '#8da9d4', sunInt: 0.45, hemiSky: '#3b4a6b', hemiGnd: '#1e1b24' }
};

function snapVal(v: number, enabled: boolean, step: number): number {
  return enabled ? Math.round(v / step) * step : v;
}

interface GhostPose {
  position: Vec3;
  rotation: Vec3;
  valid: boolean;
}

/** Upper floor slab with Live CSG Boolean Subtraction */
function UpperFloorSlabCSG({ onSurfaceMove, onSurfaceClick }: { onSurfaceMove: (e: ThreeEvent<PointerEvent>, surface: 'floor') => void; onSurfaceClick: (e: ThreeEvent<MouseEvent>, surface: 'floor') => void }) {
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
    <mesh
      geometry={slabGeo}
      receiveShadow
      castShadow
      onPointerMove={(e) => onSurfaceMove(e, 'floor')}
      onClick={(e) => onSurfaceClick(e, 'floor')}
    >
      <meshStandardMaterial map={floorTex} roughness={0.78} />
    </mesh>
  );
}

/** Wall mesh with Live CSG Boolean Subtraction + Click-to-Paint + Surface Placement */
function WallCSGMesh({
  wall,
  floorHeight,
  cutMode,
  weathering,
  seed,
  onSurfaceMove,
  onSurfaceClick
}: {
  wall: FreeformWall;
  floorHeight: number;
  cutMode: string;
  weathering: number;
  seed: number;
  onSurfaceMove: (e: ThreeEvent<PointerEvent>, surface: 'wall') => void;
  onSurfaceClick: (e: ThreeEvent<MouseEvent>, surface: 'wall', wallId: string) => void;
}) {
  const nodes = useSceneStore((s) => s.nodes);
  const stuccoTex = useMemo(() => createStuccoTexture(wall.exteriorColor, weathering, seed), [wall.exteriorColor, weathering, seed]);

  const dx = wall.end[0] - wall.start[0];
  const dz = wall.end[1] - wall.start[1];
  const len = Math.max(0.2, Math.hypot(dx, dz));
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
    <mesh
      geometry={wallGeo}
      castShadow
      receiveShadow
      onPointerMove={(e) => onSurfaceMove(e, 'wall')}
      onClick={(e) => onSurfaceClick(e, 'wall', wall.id)}
    >
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
  const toolMode = useSceneStore((s) => s.toolMode);
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
          if (toolMode !== 'select') return;
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
      {selected && toolMode === 'select' && groupRef.current && (
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

/** Live Preview Wall while drawing freeform Sims 4 walls */
function WallDrawPreview({ start, end, height }: { start: [number, number]; end: [number, number]; height: number }) {
  const dx = end[0] - start[0];
  const dz = end[1] - start[1];
  const len = Math.max(0.15, Math.hypot(dx, dz));
  const cx = (start[0] + end[0]) / 2;
  const cz = (start[1] + end[1]) / 2;
  const angle = -Math.atan2(dz, dx);
  return (
    <mesh position={[cx, height / 2, cz]} rotation={[0, angle, 0]}>
      <boxGeometry args={[len, height, 0.26]} />
      <meshStandardMaterial color="#81b29a" transparent opacity={0.55} />
    </mesh>
  );
}

export function Viewport3D({ sceneRootRef }: { sceneRootRef: React.RefObject<THREE.Group> }) {
  const {
    nodes, walls, building, wallCutMode, projection,
    selectedId, selectNode, toolMode, placingDraft, cancelPlacing,
    addNode, addWall, paintWall, paintColor, wallDrawHeight,
    snapToGrid, gridSize, activeFloor
  } = useSceneStore();

  const [draggingGizmo, setDraggingGizmo] = useState(false);
  const [ghostPose, setGhostPose] = useState<GhostPose | null>(null);
  const [wallStart, setWallStart] = useState<[number, number] | null>(null);
  const [wallCursor, setWallCursor] = useState<[number, number] | null>(null);

  const gfFloorTex = useMemo(() => createFloorTexture('checker'), []);
  const lp = LIGHTING_MAP[building.lighting];

  // Surface-Aware Raycasting for Smart Placement & Freeform Wall Drawing
  const handleSurfaceMove = (e: ThreeEvent<PointerEvent>, surface: 'floor' | 'wall') => {
    if (toolMode === 'draw_wall' && surface === 'floor') {
      e.stopPropagation();
      const x = snapVal(e.point.x, snapToGrid, 0.5);
      const z = snapVal(e.point.z, snapToGrid, 0.5);
      setWallCursor([x, z]);
      return;
    }

    if (toolMode === 'place_object' && placingDraft) {
      e.stopPropagation();
      const isWallItem = placingDraft.placementRule === 'wall';
      const valid = isWallItem ? surface === 'wall' : surface === 'floor';

      const px = snapVal(e.point.x, snapToGrid, gridSize);
      const pz = snapVal(e.point.z, snapToGrid, gridSize);
      let py = Math.max(0, e.point.y);
      let ry = 0;

      if (isWallItem && surface === 'wall' && e.face) {
        // Compute world normal of clicked wall face so window/door aligns flush automatically!
        const normalMatrix = new THREE.Matrix3().getNormalMatrix(e.object.matrixWorld);
        const worldNormal = e.face.normal.clone().applyMatrix3(normalMatrix).normalize();
        ry = Math.atan2(worldNormal.x, worldNormal.z);
        py = placingDraft.recipe.kind === 'door_arched' ? 0 : Math.max(0.9, Math.min(building.floorHeight - 0.8, snapVal(e.point.y, snapToGrid, 0.1)));
      }
      setGhostPose({ position: [px, py, pz], rotation: [0, ry, 0], valid });
    }
  };

  const handleSurfaceClick = (e: ThreeEvent<MouseEvent>, surface: 'floor' | 'wall', wallId?: string) => {
    if (toolMode === 'paint_wall' && surface === 'wall' && wallId) {
      e.stopPropagation();
      paintWall(wallId, paintColor);
      return;
    }

    if (toolMode === 'draw_wall' && surface === 'floor') {
      e.stopPropagation();
      const pt: [number, number] = [snapVal(e.point.x, snapToGrid, 0.5), snapVal(e.point.z, snapToGrid, 0.5)];
      if (!wallStart) {
        setWallStart(pt);
        setWallCursor(pt);
      } else {
        if (Math.hypot(pt[0] - wallStart[0], pt[1] - wallStart[1]) >= 0.4) {
          addWall({
            id: `wall-${Date.now()}`,
            floor: activeFloor,
            start: wallStart,
            end: pt,
            thickness: 0.26,
            heightPreset: wallDrawHeight,
            exteriorColor: building.wallColor,
            interiorColor: '#f4ebe0'
          });
        }
        setWallStart(null);
        setWallCursor(null);
      }
      return;
    }

    if (toolMode === 'place_object' && placingDraft && ghostPose && ghostPose.valid) {
      e.stopPropagation();
      const kind = placingDraft.recipe.kind;
      const isStruct = kind === 'window_shuttered' || kind === 'door_arched' || kind === 'staircase' || kind === 'water_tank';
      const isEnv = kind === 'olive_tree' || kind === 'street_lamp' || kind === 'park_bench';
      addNode({
        id: `${kind}-${Date.now()}`,
        name: placingDraft.name,
        layer: isStruct ? 'structure' : isEnv ? 'environment' : 'interior',
        floor: activeFloor,
        visible: true,
        placementRule: placingDraft.placementRule,
        transform: { position: ghostPose.position, rotation: ghostPose.rotation, scale: [1, 1, 1] },
        recipe: { ...placingDraft.recipe },
        booleanCutter: placingDraft.booleanCutter ? structuredClone(placingDraft.booleanCutter) : undefined
      });
      setGhostPose(null);
      cancelPlacing();
    }
  };

  const previewWallH = wallDrawHeight === 'full' ? building.floorHeight : wallDrawHeight === 'half' ? building.floorHeight * 0.5 : 1.0;

  return (
    <Canvas
      shadows
      onPointerMissed={() => {
        if (toolMode === 'select') selectNode(null);
        if (toolMode === 'draw_wall') { setWallStart(null); setWallCursor(null); }
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        setWallStart(null);
        setWallCursor(null);
        setGhostPose(null);
        cancelPlacing();
      }}
    >
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
          <mesh
            position={[0, -0.14, 0]}
            receiveShadow
            onPointerMove={(e) => handleSurfaceMove(e, 'floor')}
            onClick={(e) => handleSurfaceClick(e, 'floor')}
          >
            <boxGeometry args={[building.width + 5.2, 0.16, building.depth + 5.2]} />
            <meshStandardMaterial color="#c9b8a7" roughness={0.92} />
          </mesh>
        )}

        {/* Ground Floor Slab */}
        <mesh
          position={[0, -0.04, 0]}
          receiveShadow
          onPointerMove={(e) => handleSurfaceMove(e, 'floor')}
          onClick={(e) => handleSurfaceClick(e, 'floor')}
        >
          <boxGeometry args={[building.width, 0.1, building.depth]} />
          <meshStandardMaterial map={gfFloorTex} roughness={0.75} />
        </mesh>

        {/* Upper Floor Slab with Live CSG Boolean Subtraction */}
        <UpperFloorSlabCSG onSurfaceMove={handleSurfaceMove} onSurfaceClick={handleSurfaceClick} />

        {/* Walls with Live CSG Boolean Subtraction + Click-to-Paint */}
        {walls.map((w) => (
          <WallCSGMesh
            key={w.id}
            wall={w}
            floorHeight={building.floorHeight}
            cutMode={wallCutMode}
            weathering={building.weathering}
            seed={building.seed}
            onSurfaceMove={handleSurfaceMove}
            onSurfaceClick={handleSurfaceClick}
          />
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

      {/* Surface-Aware Smart Placement Ghost */}
      {toolMode === 'place_object' && placingDraft && ghostPose && (
        <group position={ghostPose.position} rotation={ghostPose.rotation}>
          <ProceduralObjectMesh recipe={placingDraft.recipe} shutterColor={building.shutterColor} trimColor={building.trimColor} />
          <mesh position={[0, 0.6, 0]}>
            <boxGeometry args={[1.3, 1.3, 1.3]} />
            <meshBasicMaterial color={ghostPose.valid ? '#4ade80' : '#f87171'} wireframe transparent opacity={0.85} />
          </mesh>
        </group>
      )}

      {/* Sims 4 Freeform Wall Draw Preview */}
      {toolMode === 'draw_wall' && wallStart && wallCursor && (
        <WallDrawPreview start={wallStart} end={wallCursor} height={previewWallH} />
      )}

      <Grid args={[32, 32]} cellSize={0.5} sectionSize={2} fadeDistance={36} position={[0, 0.015, 0]} />
      <OrbitControls makeDefault enabled={!draggingGizmo} />
    </Canvas>
  );
}
