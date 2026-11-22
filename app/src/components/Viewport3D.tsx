import React, { useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Grid, OrbitControls, TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import { Brush, Evaluator, SUBTRACTION } from 'three-bvh-csg';
import { useSceneStore } from '../store/useSceneStore';
import type { FreeformWall, SceneNode } from '../types/scene';

const csgEvaluator = new Evaluator();

/** Upper floor slab with Live CSG Boolean Subtraction from any active staircase/slab cutter! */
function UpperFloorSlabCSG() {
  const nodes = useSceneStore((s) => s.nodes);
  const floorHeight = useSceneStore((s) => s.floorHeight);

  const slabGeo = useMemo(() => {
    const base = new Brush(new THREE.BoxGeometry(9.0, 0.18, 7.0));
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
  }, [nodes, floorHeight]);

  return (
    <mesh geometry={slabGeo} receiveShadow castShadow>
      <meshStandardMaterial color="#d8c3a5" roughness={0.8} transparent opacity={0.92} />
    </mesh>
  );
}

function WallMesh({ wall, floorHeight, cutMode }: { wall: FreeformWall; floorHeight: number; cutMode: string }) {
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

  return (
    <mesh position={[cx, h / 2, cz]} rotation={[0, angle, 0]} castShadow receiveShadow>
      <boxGeometry args={[len, h, wall.thickness]} />
      <meshStandardMaterial color={wall.exteriorColor} roughness={0.88} />
    </mesh>
  );
}

function ProceduralNodeMesh({
  node,
  selected,
  onSelect,
  onDragState
}: {
  node: SceneNode;
  selected: boolean;
  onSelect: () => void;
  onDragState: (dragging: boolean) => void;
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const transformMode = useSceneStore((s) => s.transformMode);
  const snapToGrid = useSceneStore((s) => s.snapToGrid);
  const gridSize = useSceneStore((s) => s.gridSize);
  const updateNodeTransform = useSceneStore((s) => s.updateNodeTransform);

  const renderGeometry = () => {
    if (node.recipe.kind === 'staircase') {
      const steps = 11;
      return (
        <group>
          {Array.from({ length: steps }).map((_, i) => (
            <mesh key={i} position={[0, (i + 0.5) * 0.28, i * 0.24]} castShadow receiveShadow>
              <boxGeometry args={[1.1, 0.24, 0.28]} />
              <meshStandardMaterial color="#a87c4f" roughness={0.8} />
            </mesh>
          ))}
        </group>
      );
    }
    if (node.recipe.kind === 'olive_tree') {
      return (
        <group>
          <mesh position={[0, 0.85, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.2, 1.7, 8]} />
            <meshStandardMaterial color="#6b4932" roughness={0.85} />
          </mesh>
          <mesh position={[0, 2.0, 0]} castShadow>
            <icosahedronGeometry args={[0.95, 1]} />
            <meshStandardMaterial color="#4a8540" roughness={0.8} />
          </mesh>
        </group>
      );
    }
    return (
      <group>
        <mesh position={[0, 0.72, 0]} castShadow>
          <cylinderGeometry args={[0.45, 0.45, 0.06, 16]} />
          <meshStandardMaterial color="#6b4932" roughness={0.75} />
        </mesh>
        <mesh position={[0, 0.36, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.72, 8]} />
          <meshStandardMaterial color="#2b3036" metalness={0.6} roughness={0.4} />
        </mesh>
      </group>
    );
  };

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
        {renderGeometry()}
        {node.booleanCutter?.enabled && (
          <mesh position={node.booleanCutter.boxOffset}>
            <boxGeometry args={node.booleanCutter.boxSize} />
            <meshBasicMaterial color="#e07a5f" wireframe transparent opacity={selected ? 0.85 : 0.3} />
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

export function Viewport3D() {
  const nodes = useSceneStore((s) => s.nodes);
  const walls = useSceneStore((s) => s.walls);
  const floorHeight = useSceneStore((s) => s.floorHeight);
  const wallCutMode = useSceneStore((s) => s.wallCutMode);
  const selectedId = useSceneStore((s) => s.selectedId);
  const selectNode = useSceneStore((s) => s.selectNode);
  const [draggingGizmo, setDraggingGizmo] = useState(false);

  return (
    <Canvas
      shadows
      camera={{ position: [14, 12, 16], fov: 38 }}
      onPointerMissed={() => selectNode(null)}
    >
      <color attach="background" args={['#e8d2b5']} />
      <hemisphereLight args={['#fff1db', '#8c694a', 0.82]} />
      <directionalLight position={[14, 22, 15]} intensity={1.5} castShadow shadow-mapSize={[2048, 2048]} />

      {/* Ground Floor Slab */}
      <mesh position={[0, -0.06, 0]} receiveShadow>
        <boxGeometry args={[9.0, 0.12, 7.0]} />
        <meshStandardMaterial color="#c9b8a7" roughness={0.9} />
      </mesh>

      {/* Upper Floor Slab with Live CSG Boolean Subtraction */}
      <UpperFloorSlabCSG />

      {/* Sims 4 Freeform Walls */}
      {walls.map((w) => (
        <WallMesh key={w.id} wall={w} floorHeight={floorHeight} cutMode={wallCutMode} />
      ))}

      {/* Interactive Selectable & Editable Scene Nodes */}
      {nodes.map((node) => (
        <ProceduralNodeMesh
          key={node.id}
          node={node}
          selected={node.id === selectedId}
          onSelect={() => selectNode(node.id)}
          onDragState={setDraggingGizmo}
        />
      ))}

      <Grid args={[30, 30]} cellSize={0.5} sectionSize={2} fadeDistance={35} position={[0, 0.005, 0]} />
      <OrbitControls makeDefault enabled={!draggingGizmo} />
    </Canvas>
  );
}
