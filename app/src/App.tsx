import React, { useRef } from 'react';
import type * as THREE from 'three';
import { Viewport3D } from './components/Viewport3D';
import { EditorToolbar } from './components/EditorToolbar';
import { InspectorPanel } from './components/InspectorPanel';

export default function App() {
  const sceneRootRef = useRef<THREE.Group>(null!);
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#1a1614]">
      <EditorToolbar />
      <InspectorPanel sceneRootRef={sceneRootRef} />
      <Viewport3D sceneRootRef={sceneRootRef} />
    </div>
  );
}
