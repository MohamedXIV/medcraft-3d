import React from 'react';
import { Viewport3D } from './components/Viewport3D';
import { EditorToolbar } from './components/EditorToolbar';

export default function App() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#1a1614]">
      <EditorToolbar />
      <Viewport3D />
    </div>
  );
}
