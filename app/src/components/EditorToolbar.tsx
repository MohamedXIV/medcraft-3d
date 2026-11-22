import React, { useEffect } from 'react';
import { Move, RotateCw, Maximize2, Scissors, Undo2, Redo2, Copy, Trash2, Save } from 'lucide-react';
import { useSceneStore } from '../store/useSceneStore';

export function EditorToolbar() {
  const {
    transformMode, setTransformMode,
    snapToGrid, toggleSnap,
    wallCutMode, setWallCutMode,
    selectedId, toggleNodeBooleanCutter,
    duplicateSelected, deleteSelected,
    exportSceneDocument
  } = useSceneStore();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      const k = e.key.toLowerCase();
      if (k === 'g' || k === 'w') setTransformMode('translate');
      if (k === 'r' || k === 'e') setTransformMode('rotate');
      if (k === 's') setTransformMode('scale');
      if (k === 'delete' || k === 'backspace') deleteSelected();
      if ((e.metaKey || e.ctrlKey) && k === 'z') {
        e.preventDefault();
        if (e.shiftKey) useSceneStore.temporal.getState().redo();
        else useSceneStore.temporal.getState().undo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setTransformMode, deleteSelected]);

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
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-[#181513]/90 backdrop-blur-md border border-white/15 px-3 py-1.5 rounded-2xl shadow-2xl">
      <button onClick={() => setTransformMode('translate')} className={`p-2 rounded-xl text-xs flex items-center gap-1 ${transformMode === 'translate' ? 'bg-[#e07a5f] text-white' : 'text-[#d6c6b8] hover:bg-white/10'}`} title="تحريك (G)">
        <Move className="w-4 h-4" />
      </button>
      <button onClick={() => setTransformMode('rotate')} className={`p-2 rounded-xl text-xs flex items-center gap-1 ${transformMode === 'rotate' ? 'bg-[#e07a5f] text-white' : 'text-[#d6c6b8] hover:bg-white/10'}`} title="تدوير (R)">
        <RotateCw className="w-4 h-4" />
      </button>
      <button onClick={() => setTransformMode('scale')} className={`p-2 rounded-xl text-xs flex items-center gap-1 ${transformMode === 'scale' ? 'bg-[#e07a5f] text-white' : 'text-[#d6c6b8] hover:bg-white/10'}`} title="تكبير (S)">
        <Maximize2 className="w-4 h-4" />
      </button>

      <div className="w-px h-5 bg-white/15 mx-1" />

      <button onClick={toggleSnap} className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold ${snapToGrid ? 'bg-[#81b29a]/25 text-[#b7ebd0]' : 'text-[#d6c6b8] hover:bg-white/10'}`}>
        Snap: {snapToGrid ? 'ON' : 'OFF'}
      </button>

      {selectedId && (
        <>
          <button onClick={() => toggleNodeBooleanCutter(selectedId)} className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-[#e07a5f]/20 text-[#ffbfa8] hover:bg-[#e07a5f]/35 flex items-center gap-1">
            <Scissors className="w-3.5 h-3.5" /><span>Live Boolean</span>
          </button>
          <button onClick={duplicateSelected} className="p-2 rounded-xl text-[#d6c6b8] hover:bg-white/10" title="نسخ"><Copy className="w-4 h-4" /></button>
          <button onClick={deleteSelected} className="p-2 rounded-xl text-red-300 hover:bg-red-500/20" title="حذف"><Trash2 className="w-4 h-4" /></button>
        </>
      )}

      <div className="w-px h-5 bg-white/15 mx-1" />

      <button onClick={() => useSceneStore.temporal.getState().undo()} className="p-2 rounded-xl text-[#d6c6b8] hover:bg-white/10" title="تراجع (Ctrl+Z)"><Undo2 className="w-4 h-4" /></button>
      <button onClick={() => useSceneStore.temporal.getState().redo()} className="p-2 rounded-xl text-[#d6c6b8] hover:bg-white/10" title="إعادة"><Redo2 className="w-4 h-4" /></button>

      <div className="w-px h-5 bg-white/15 mx-1" />

      <select
        value={wallCutMode}
        onChange={(e) => setWallCutMode(e.target.value as 'up' | 'cutaway' | 'down')}
        className="bg-[#241f1c] border border-white/15 rounded-xl px-2 py-1 text-[11px] text-white"
      >
        <option value="up">حوائط كاملة</option>
        <option value="cutaway">مقطع Sims 4</option>
        <option value="down">حوائط منخفضة</option>
      </select>

      <button onClick={handleSaveJSON} className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-[#81b29a] text-[#111c16] flex items-center gap-1">
        <Save className="w-3.5 h-3.5" /><span>حفظ المشهد</span>
      </button>
    </div>
  );
}
