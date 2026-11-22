import React, { useRef } from 'react';
import type * as THREE from 'three';
import { Viewport3D } from './components/Viewport3D';
import { EditorToolbar } from './components/EditorToolbar';
import { InspectorPanel } from './components/InspectorPanel';
import { ObjectStudio } from './components/ObjectStudio';
import { useSceneStore } from './store/useSceneStore';

export default function App() {
  const sceneRootRef = useRef<THREE.Group>(null!);
  const appMode = useSceneStore((s) => s.appMode);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#1a1614]">
      <EditorToolbar />
      {appMode === 'studio' ? (
        <ObjectStudio />
      ) : (
        <>
          <InspectorPanel sceneRootRef={sceneRootRef} />
          <Viewport3D sceneRootRef={sceneRootRef} />
        </>
      )}
    </div>
  );
}
