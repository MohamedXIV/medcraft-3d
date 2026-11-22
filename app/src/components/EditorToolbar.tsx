import React, { useEffect } from 'react';
import {
  Box, Building2, Copy, Maximize2, MousePointer2, Move,
  Paintbrush, PenTool, Redo2, RotateCw, Save, Scissors, Trash2, Undo2
} from 'lucide-react';
import { useSceneStore } from '../store/useSceneStore';
import type { WallHeightPreset } from '../types/scene';

export function EditorToolbar() {
  const {
    appMode, setAppMode,
    toolMode, setToolMode, cancelPlacing,
    wallDrawHeight, setWallDrawHeight,
    paintColor, setPaintColor,
    transformMode, setTransformMode,
    snapToGrid, toggleSnap,
    wallCutMode, setWallCutMode,
    selectedId, toggleNodeBooleanCutter,
    duplicateSelected, deleteSelected,
    exportSceneDocument
  } = useSceneStore();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      const k = e.key.toLowerCase();
      if (k === 'escape') cancelPlacing();
      if (k === 'v') setToolMode('select');
      if (k === 'b') setToolMode('draw_wall');
      if (k === 'p') setToolMode('paint_wall');
      if (k === 'g' || k === 'w') { setToolMode('select'); setTransformMode('translate'); }
      if (k === 'r' || k === 'e') { setToolMode('select'); setTransformMode('rotate'); }
      if (k === 's') { setToolMode('select'); setTransformMode('scale'); }
      if (k === 'delete' || k === 'backspace') deleteSelected();
      if ((e.metaKey || e.ctrlKey) && k === 'z') {
        e.preventDefault();
        if (e.shiftKey) useSceneStore.temporal.getState().redo();
        else useSceneStore.temporal.getState().undo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cancelPlacing, setToolMode, setTransformMode, deleteSelected]);

  const handleSaveJSON = () => {
    const doc = exportSceneDocument();
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medcraft-scene-${Date.now()}.medcraft.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-30 flex flex-wrap items-center gap-1.5 bg-[#181513]/92 backdrop-blur-md border border-white/15 px-3 py-1.5 rounded-2xl shadow-2xl max-w-[96vw]">
      {/* App Mode Switcher: Scene Editor vs Isolated Object Studio */}
      <button
        onClick={() => setAppMode('scene')}
        className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 ${appMode === 'scene' ? 'bg-[#e07a5f] text-white' : 'text-[#d6c6b8] hover:bg-white/10'}`}
      >
        <Building2 className="w-3.5 h-3.5" /><span>المشهد</span>
      </button>
      <button
        onClick={() => setAppMode('studio')}
        className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 ${appMode === 'studio' ? 'bg-[#81b29a] text-[#111c16]' : 'text-[#d6c6b8] hover:bg-white/10'}`}
      >
        <Box className="w-3.5 h-3.5" /><span>استوديو الأصول</span>
      </button>

      {appMode === 'scene' && (
        <>
          <div className="w-px h-5 bg-white/15 mx-0.5" />

          {/* Tool Modes: Select / Draw Wall / Paint Wall */}
          <button onClick={() => setToolMode('select')} className={`p-1.5 rounded-xl ${toolMode === 'select' ? 'bg-white/20 text-white' : 'text-[#d6c6b8] hover:bg-white/10'}`} title="تحديد (V)">
            <MousePointer2 className="w-4 h-4" />
          </button>
          <button onClick={() => setToolMode('draw_wall')} className={`px-2 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 ${toolMode === 'draw_wall' ? 'bg-[#81b29a] text-[#111c16]' : 'text-[#d6c6b8] hover:bg-white/10'}`} title="رسم حوائط Sims 4 (B)">
            <PenTool className="w-3.5 h-3.5" /><span>رسم حائط</span>
          </button>
          {toolMode === 'draw_wall' && (
            <select value={wallDrawHeight} onChange={(e) => setWallDrawHeight(e.target.value as WallHeightPreset)} className="bg-[#241f1c] border border-white/15 rounded-lg px-1.5 py-1 text-[10px] text-white">
              <option value="full">كامل</option>
              <option value="half">نصف حائط</option>
              <option value="fence">سور قصير</option>
            </select>
          )}
          <button onClick={() => setToolMode('paint_wall')} className={`px-2 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 ${toolMode === 'paint_wall' ? 'bg-[#f2cc8f] text-[#1a1614]' : 'text-[#d6c6b8] hover:bg-white/10'}`} title="دهان الحوائط (P)">
            <Paintbrush className="w-3.5 h-3.5" /><span>دهان</span>
          </button>
          {toolMode === 'paint_wall' && (
            <input type="color" value={paintColor} onChange={(e) => setPaintColor(e.target.value)} className="w-6 h-6 rounded border border-white/20 cursor-pointer" />
          )}

          <div className="w-px h-5 bg-white/15 mx-0.5" />

          {/* Gizmos */}
          <button onClick={() => { setToolMode('select'); setTransformMode('translate'); }} className={`p-1.5 rounded-xl ${toolMode === 'select' && transformMode === 'translate' ? 'bg-[#e07a5f] text-white' : 'text-[#d6c6b8] hover:bg-white/10'}`} title="تحريك (G)">
            <Move className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => { setToolMode('select'); setTransformMode('rotate'); }} className={`p-1.5 rounded-xl ${toolMode === 'select' && transformMode === 'rotate' ? 'bg-[#e07a5f] text-white' : 'text-[#d6c6b8] hover:bg-white/10'}`} title="تدوير (R)">
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => { setToolMode('select'); setTransformMode('scale'); }} className={`p-1.5 rounded-xl ${toolMode === 'select' && transformMode === 'scale' ? 'bg-[#e07a5f] text-white' : 'text-[#d6c6b8] hover:bg-white/10'}`} title="تكبير (S)">
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={toggleSnap} className={`px-2 py-1 rounded-xl text-[10px] font-bold ${snapToGrid ? 'bg-[#81b29a]/25 text-[#b7ebd0]' : 'text-[#d6c6b8] hover:bg-white/10'}`}>
            Snap
          </button>

          {selectedId && (
            <>
              <button onClick={() => toggleNodeBooleanCutter(selectedId)} className="px-2 py-1 rounded-xl text-[10px] font-bold bg-[#e07a5f]/20 text-[#ffbfa8] flex items-center gap-1">
                <Scissors className="w-3 h-3" /><span>Boolean</span>
              </button>
              <button onClick={duplicateSelected} className="p-1.5 rounded-xl text-[#d6c6b8] hover:bg-white/10" title="نسخ"><Copy className="w-3.5 h-3.5" /></button>
              <button onClick={deleteSelected} className="p-1.5 rounded-xl text-red-300 hover:bg-red-500/20" title="حذف"><Trash2 className="w-3.5 h-3.5" /></button>
            </>
          )}

          <div className="w-px h-5 bg-white/15 mx-0.5" />

          <button onClick={() => useSceneStore.temporal.getState().undo()} className="p-1.5 rounded-xl text-[#d6c6b8] hover:bg-white/10" title="تراجع"><Undo2 className="w-3.5 h-3.5" /></button>
          <button onClick={() => useSceneStore.temporal.getState().redo()} className="p-1.5 rounded-xl text-[#d6c6b8] hover:bg-white/10" title="إعادة"><Redo2 className="w-3.5 h-3.5" /></button>

          <select value={wallCutMode} onChange={(e) => setWallCutMode(e.target.value as 'up' | 'cutaway' | 'down')} className="bg-[#241f1c] border border-white/15 rounded-xl px-2 py-1 text-[10px] text-white">
            <option value="up">حوائط كاملة</option>
            <option value="cutaway">مقطع Sims 4</option>
            <option value="down">حوائط منخفضة</option>
          </select>

          <button onClick={handleSaveJSON} className="px-2 py-1.5 rounded-xl text-[10px] font-bold bg-[#81b29a] text-[#111c16] flex items-center gap-1">
            <Save className="w-3 h-3" /><span>JSON</span>
          </button>
        </>
      )}
    </div>
  );
}
