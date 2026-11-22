import React from 'react';
import { Download, Plus, Scissors, Sparkles } from 'lucide-react';
import type * as THREE from 'three';
import { useSceneStore } from '../store/useSceneStore';
import { BUILDING_PRESETS, PALETTES, type LightingMode, type RoofType } from '../procedural/prng';
import { exportObject3DToGLB } from '../procedural/exporter';
import type { ProceduralRecipe } from '../types/scene';

const SPAWN_ITEMS: Array<{ kind: ProceduralRecipe['kind']; label: string }> = [
  { kind: 'window_shuttered', label: '+ شباك (Boolean)' },
  { kind: 'door_arched', label: '+ باب (Boolean)' },
  { kind: 'staircase', label: '+ سلم (Boolean)' },
  { kind: 'cafe_table', label: '+ طاولة كافيه' },
  { kind: 'bed_mediterranean', label: '+ سرير' },
  { kind: 'olive_tree', label: '+ شجرة زيتون' },
  { kind: 'street_lamp', label: '+ عمود إنارة' },
  { kind: 'park_bench', label: '+ مقعد خشبي' },
  { kind: 'water_tank', label: '+ خزان مياه' }
];

export function InspectorPanel({ sceneRootRef }: { sceneRootRef: React.RefObject<THREE.Group> }) {
  const {
    building, updateBuilding, applyPreset,
    projection, setProjection,
    nodes, selectedId, spawnObject, toggleNodeBooleanCutter, updateBooleanCutterBox
  } = useSceneStore();

  const selectedNode = nodes.find((n) => n.id === selectedId) ?? null;

  const handleExportGLB = () => {
    if (!sceneRootRef.current) return;
    exportObject3DToGLB(sceneRootRef.current, `medcraft-v3-${building.seed}.glb`);
  };

  return (
    <aside className="fixed top-16 right-3 bottom-3 z-20 w-[320px] bg-[#181513]/90 backdrop-blur-md border border-white/15 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-xs">
      <div className="p-3 border-b border-white/10 flex items-center justify-between bg-black/25">
        <div className="font-extrabold text-[#fff5eb] flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-[#e07a5f]" />
          <span>MedCraft 3D v3 (R3F)</span>
        </div>
        <button
          onClick={() => setProjection(projection === 'perspective' ? 'orthographic' : 'perspective')}
          className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-bold text-[#ffbfa8]"
        >
          {projection === 'perspective' ? 'Perspective' : 'Ortho Iso'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Presets */}
        <div>
          <div className="font-bold text-[#f2cc8f] mb-1.5">قوالب سريعة</div>
          <div className="grid grid-cols-2 gap-1.5">
            {Object.entries(BUILDING_PRESETS).map(([id, p]) => (
              <button
                key={id}
                onClick={() => applyPreset(id)}
                className="text-right p-2 rounded-xl bg-white/5 hover:bg-[#e07a5f]/20 border border-white/10 transition"
              >
                <div className="font-bold text-white text-[11px]">{p.label}</div>
                <div className="text-[10px] text-[#bcaaa0]">{p.subtitle}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Spawn Objects */}
        <div className="pt-2 border-t border-white/10">
          <div className="font-bold text-[#f2cc8f] mb-1.5 flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /><span>إضافة عناصر للمشهد</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {SPAWN_ITEMS.map((item) => (
              <button
                key={item.kind}
                onClick={() => spawnObject(item.kind)}
                className="text-right px-2 py-1.5 rounded-xl bg-white/5 hover:bg-[#81b29a]/25 border border-white/10 text-[11px] text-[#e6d7c8] transition"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Object & Live Boolean Cutter Box */}
        {selectedNode && (
          <div className="p-2.5 rounded-xl bg-[#e07a5f]/15 border border-[#e07a5f]/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#ffbfa8] truncate">{selectedNode.name}</span>
              <button
                onClick={() => toggleNodeBooleanCutter(selectedNode.id)}
                className="px-2 py-0.5 rounded-lg bg-[#e07a5f] text-white text-[10px] font-bold flex items-center gap-1"
              >
                <Scissors className="w-3 h-3" />
                <span>{selectedNode.booleanCutter?.enabled ? 'Boolean ON' : 'Boolean OFF'}</span>
              </button>
            </div>
            {selectedNode.booleanCutter?.enabled && (
              <div className="space-y-1.5 pt-1">
                <div className="text-[10px] text-[#f2cc8f]">أبعاد صندوق القطع الحي (Live Boolean Box)</div>
                {(['X', 'Y', 'Z'] as const).map((axis, idx) => (
                  <label key={axis} className="flex items-center gap-2 text-[10px]">
                    <span className="w-4 font-mono">{axis}</span>
                    <input
                      type="range"
                      min={0.4}
                      max={4.5}
                      step={0.05}
                      value={selectedNode.booleanCutter!.boxSize[idx]}
                      onChange={(e) => {
                        const next = [...selectedNode.booleanCutter!.boxSize] as [number, number, number];
                        next[idx] = parseFloat(e.target.value);
                        updateBooleanCutterBox(selectedNode.id, next);
                      }}
                      className="flex-1"
                    />
                    <span className="w-8 text-left font-mono">{selectedNode.booleanCutter!.boxSize[idx].toFixed(1)}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Palettes & Roof & Lighting */}
        <div className="pt-2 border-t border-white/10 space-y-2">
          <div className="font-bold text-[#f2cc8f]">لوحة الألوان</div>
          <div className="grid grid-cols-3 gap-1.5">
            {PALETTES.map((pal) => (
              <button
                key={pal.id}
                onClick={() => updateBuilding({ wallColor: pal.wall, trimColor: pal.trim, shutterColor: pal.shutter, awningColor: pal.awning, roofColor: pal.roof })}
                className="p-1.5 rounded-xl bg-white/5 hover:border-[#e07a5f] border border-white/10"
              >
                <div className="flex h-3 rounded overflow-hidden mb-1">
                  <span className="flex-1" style={{ background: pal.wall }} />
                  <span className="flex-1" style={{ background: pal.shutter }} />
                  <span className="flex-1" style={{ background: pal.roof }} />
                </div>
                <div className="text-[9px] text-center truncate">{pal.name}</div>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <select
              value={building.roofType}
              onChange={(e) => updateBuilding({ roofType: e.target.value as RoofType })}
              className="bg-[#241f1c] border border-white/15 rounded-xl px-2 py-1.5 text-[11px]"
            >
              <option value="flat">سطح مستوي</option>
              <option value="hipped">قرميد هرمي</option>
              <option value="gabled">قرميد جمالون</option>
            </select>
            <select
              value={building.lighting}
              onChange={(e) => updateBuilding({ lighting: e.target.value as LightingMode })}
              className="bg-[#241f1c] border border-white/15 rounded-xl px-2 py-1.5 text-[11px]"
            >
              <option value="golden">☀️ الساعة الذهبية</option>
              <option value="noon">🌤️ ظهيرة</option>
              <option value="sunset">🌇 غروب</option>
              <option value="night">🌙 ليل دافئ</option>
            </select>
          </div>
        </div>
      </div>

      <div className="p-2.5 border-t border-white/10 bg-black/35">
        <button
          onClick={handleExportGLB}
          className="w-full bg-[#81b29a] hover:bg-[#6fa088] text-[#111c16] font-extrabold text-xs py-2 rounded-xl flex items-center justify-center gap-1.5"
        >
          <Download className="w-4 h-4" />
          <span>تصدير المشهد GLB</span>
        </button>
      </div>
    </aside>
  );
}
