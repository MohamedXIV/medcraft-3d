import React from 'react';
import type { ProceduralRecipe } from '../types/scene';

interface Props {
  recipe: ProceduralRecipe;
  shutterColor?: string;
  trimColor?: string;
}

export function ProceduralObjectMesh({ recipe, shutterColor = '#2f7a57', trimColor = '#f5ece0' }: Props) {
  switch (recipe.kind) {
    case 'staircase': {
      const steps = Number(recipe.params.steps ?? 11);
      const width = Number(recipe.params.width ?? 1.1);
      const run = Number(recipe.params.run ?? 2.7);
      const totalH = 3.1;
      const stepH = totalH / steps;
      const stepD = run / steps;
      return (
        <group>
          {Array.from({ length: steps }).map((_, i) => (
            <mesh key={i} position={[0, (i + 0.5) * stepH, i * stepD]} castShadow receiveShadow>
              <boxGeometry args={[width, stepH * 0.9, stepD + 0.04]} />
              <meshStandardMaterial color="#a87c4f" roughness={0.82} />
            </mesh>
          ))}
          <mesh position={[width / 2 - 0.05, 0.5, 0.08]} castShadow>
            <cylinderGeometry args={[0.03, 0.03, 0.95, 6]} />
            <meshStandardMaterial color="#2b3036" metalness={0.65} roughness={0.45} />
          </mesh>
          <mesh position={[width / 2 - 0.05, totalH + 0.4, run - 0.08]} castShadow>
            <cylinderGeometry args={[0.03, 0.03, 0.95, 6]} />
            <meshStandardMaterial color="#2b3036" metalness={0.65} roughness={0.45} />
          </mesh>
        </group>
      );
    }

    case 'window_shuttered': {
      const w = Number(recipe.params.width ?? 1.1);
      const h = Number(recipe.params.height ?? 1.35);
      return (
        <group>
          {/* Hollow 4-bar stone surround */}
          <mesh position={[0, h / 2 + 0.05, 0]} castShadow><boxGeometry args={[w + 0.22, 0.1, 0.22]} /><meshStandardMaterial color={trimColor} roughness={0.78} /></mesh>
          <mesh position={[0, -h / 2 - 0.05, 0.04]} castShadow><boxGeometry args={[w + 0.28, 0.11, 0.28]} /><meshStandardMaterial color={trimColor} roughness={0.78} /></mesh>
          <mesh position={[-w / 2 - 0.05, 0, 0]} castShadow><boxGeometry args={[0.1, h, 0.22]} /><meshStandardMaterial color={trimColor} roughness={0.78} /></mesh>
          <mesh position={[w / 2 + 0.05, 0, 0]} castShadow><boxGeometry args={[0.1, h, 0.22]} /><meshStandardMaterial color={trimColor} roughness={0.78} /></mesh>
          {/* Glass & muntins */}
          <mesh><planeGeometry args={[w - 0.06, h - 0.06]} /><meshStandardMaterial color="#d8eef8" transparent opacity={0.25} roughness={0.1} /></mesh>
          <mesh><boxGeometry args={[0.04, h - 0.04, 0.06]} /><meshStandardMaterial color="#6b4932" roughness={0.78} /></mesh>
          <mesh position={[0, 0.08, 0]}><boxGeometry args={[w - 0.04, 0.04, 0.06]} /><meshStandardMaterial color="#6b4932" roughness={0.78} /></mesh>
          {/* Louvered Shutters */}
          <mesh position={[-w / 2 - w * 0.28, 0, 0.14]} rotation={[0, 0.2, 0]} castShadow><boxGeometry args={[w * 0.46, h, 0.05]} /><meshStandardMaterial color={shutterColor} roughness={0.72} /></mesh>
          <mesh position={[w / 2 + w * 0.28, 0, 0.14]} rotation={[0, -0.2, 0]} castShadow><boxGeometry args={[w * 0.46, h, 0.05]} /><meshStandardMaterial color={shutterColor} roughness={0.72} /></mesh>
        </group>
      );
    }

    case 'door_arched': {
      return (
        <group>
          <mesh position={[0, 2.25, 0]} castShadow><boxGeometry args={[1.38, 0.14, 0.28]} /><meshStandardMaterial color={trimColor} roughness={0.78} /></mesh>
          <mesh position={[-0.64, 1.1, 0]} castShadow><boxGeometry args={[0.12, 2.2, 0.28]} /><meshStandardMaterial color={trimColor} roughness={0.78} /></mesh>
          <mesh position={[0.64, 1.1, 0]} castShadow><boxGeometry args={[0.12, 2.2, 0.28]} /><meshStandardMaterial color={trimColor} roughness={0.78} /></mesh>
          <group position={[-0.56, 0, 0]} rotation={[0, -1.15, 0]}>
            <mesh position={[0.56, 1.08, 0]} castShadow><boxGeometry args={[1.12, 2.16, 0.07]} /><meshStandardMaterial color="#6b4932" roughness={0.78} /></mesh>
            <mesh position={[0.98, 1.0, 0.06]}><sphereGeometry args={[0.045, 8, 8]} /><meshStandardMaterial color="#d4a84f" metalness={0.8} roughness={0.3} /></mesh>
          </group>
        </group>
      );
    }

    case 'olive_tree': {
      return (
        <group>
          <mesh position={[0, 0.05, 0]} receiveShadow><boxGeometry args={[1.15, 0.1, 1.15]} /><meshStandardMaterial color={trimColor} roughness={0.85} /></mesh>
          <mesh position={[0, 0.8, 0]} castShadow><cylinderGeometry args={[0.12, 0.2, 1.6, 8]} /><meshStandardMaterial color="#6b4932" roughness={0.85} /></mesh>
          <mesh position={[0, 1.95, 0]} castShadow><icosahedronGeometry args={[0.88, 1]} /><meshStandardMaterial color="#4a8540" roughness={0.82} /></mesh>
          <mesh position={[0.52, 1.75, 0.25]} castShadow><icosahedronGeometry args={[0.58, 1]} /><meshStandardMaterial color="#6ca64f" roughness={0.8} /></mesh>
          <mesh position={[-0.48, 1.78, 0.3]} castShadow><icosahedronGeometry args={[0.55, 1]} /><meshStandardMaterial color="#4a8540" roughness={0.82} /></mesh>
          <mesh position={[0.1, 2.35, 0.08]} castShadow><icosahedronGeometry args={[0.52, 1]} /><meshStandardMaterial color="#6ca64f" roughness={0.8} /></mesh>
        </group>
      );
    }

    case 'street_lamp': {
      return (
        <group>
          <mesh position={[0, 0.22, 0]} castShadow><cylinderGeometry args={[0.08, 0.13, 0.45, 8]} /><meshStandardMaterial color="#2b3036" metalness={0.65} roughness={0.45} /></mesh>
          <mesh position={[0, 1.5, 0]} castShadow><cylinderGeometry args={[0.045, 0.06, 2.5, 8]} /><meshStandardMaterial color="#2b3036" metalness={0.65} roughness={0.45} /></mesh>
          <mesh position={[0, 2.86, 0]}><sphereGeometry args={[0.18, 12, 10]} /><meshStandardMaterial color="#fff4c2" emissive="#ffbe55" emissiveIntensity={1.2} /></mesh>
          <mesh position={[0, 3.06, 0]} castShadow><coneGeometry args={[0.24, 0.14, 8]} /><meshStandardMaterial color="#2b3036" metalness={0.65} roughness={0.45} /></mesh>
        </group>
      );
    }

    case 'park_bench': {
      return (
        <group>
          <mesh position={[0, 0.44, 0]} castShadow><boxGeometry args={[1.45, 0.06, 0.42]} /><meshStandardMaterial color="#a87c4f" roughness={0.8} /></mesh>
          <mesh position={[0, 0.72, -0.19]} rotation={[-0.18, 0, 0]} castShadow><boxGeometry args={[1.45, 0.34, 0.06]} /><meshStandardMaterial color="#a87c4f" roughness={0.8} /></mesh>
          {[-0.62, 0.62].map((lx) => (
            <mesh key={lx} position={[lx, 0.22, 0]} castShadow><boxGeometry args={[0.07, 0.44, 0.42]} /><meshStandardMaterial color="#2b3036" metalness={0.65} roughness={0.45} /></mesh>
          ))}
        </group>
      );
    }

    case 'water_tank': {
      return (
        <group>
          <mesh position={[0, 0.65, 0]} castShadow><boxGeometry args={[1.05, 0.06, 1.05]} /><meshStandardMaterial color="#2b3036" metalness={0.65} roughness={0.45} /></mesh>
          <mesh position={[0, 1.24, 0]} castShadow><cylinderGeometry args={[0.62, 0.64, 1.15, 16]} /><meshStandardMaterial color="#586270" roughness={0.48} metalness={0.15} /></mesh>
          <mesh position={[0, 1.9, 0]} castShadow><cylinderGeometry args={[0.24, 0.24, 0.12, 12]} /><meshStandardMaterial color="#454c54" roughness={0.5} /></mesh>
        </group>
      );
    }

    case 'bed_mediterranean': {
      return (
        <group>
          <mesh position={[0, 0.18, 0]} castShadow><boxGeometry args={[1.55, 0.36, 2.05]} /><meshStandardMaterial color="#6b4932" roughness={0.8} /></mesh>
          <mesh position={[0, 0.44, 0]} castShadow><boxGeometry args={[1.45, 0.22, 1.95]} /><meshStandardMaterial color="#f5ece0" roughness={0.85} /></mesh>
          <mesh position={[0, 0.46, 0.3]} castShadow><boxGeometry args={[1.48, 0.24, 1.32]} /><meshStandardMaterial color="#5b8a72" roughness={0.85} /></mesh>
          <mesh position={[0, 0.48, -1.02]} castShadow><boxGeometry args={[1.62, 0.95, 0.1]} /><meshStandardMaterial color="#6b4932" roughness={0.8} /></mesh>
        </group>
      );
    }

    default: {
      return (
        <group>
          <mesh position={[0, 0.72, 0]} castShadow><cylinderGeometry args={[0.45, 0.45, 0.05, 16]} /><meshStandardMaterial color="#6b4932" roughness={0.75} /></mesh>
          <mesh position={[0, 0.36, 0]} castShadow><cylinderGeometry args={[0.04, 0.04, 0.72, 8]} /><meshStandardMaterial color="#2b3036" metalness={0.65} roughness={0.4} /></mesh>
          {[-0.65, 0.65].map((cx) => (
            <group key={cx} position={[cx, 0, 0]}>
              <mesh position={[0, 0.42, 0]} castShadow><boxGeometry args={[0.36, 0.05, 0.36]} /><meshStandardMaterial color="#a87c4f" roughness={0.8} /></mesh>
              <mesh position={[cx > 0 ? 0.16 : -0.16, 0.64, 0]} castShadow><boxGeometry args={[0.05, 0.42, 0.36]} /><meshStandardMaterial color="#a87c4f" roughness={0.8} /></mesh>
            </group>
          ))}
        </group>
      );
    }
  }
}
