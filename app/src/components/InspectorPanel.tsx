import React, { useState } from 'react';
import { Bookmark, Camera, Dices, Download, FolderOpen, Plus, Save, Scissors, Sparkles, Trash2, Upload } from 'lucide-react';
import * as THREE from 'three';
import { useSceneStore } from '../store/useSceneStore';
import { BUILDING_PRESETS, PALETTES, type LightingMode, type RoofType } from '../procedural/prng';
import { exportObject3DToGLB } from '../procedural/exporter';
import type { ProceduralRecipe, SceneDocument } from '../types/scene';

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
    building, updateBuilding, applyPreset, randomizeBuilding,
    projection, setProjection, setAppMode,
    exportLayers, setExportLayer,
    nodes, selectedId, spawnObject, startPlacing, toggleNodeBooleanCutter, updateBooleanCutterBox,
    assetLibrary, deleteAssetFromLibrary,
    savedScenes, saveNamedScene, loadNamedScene, deleteNamedScene, loadSceneDocument
  } = useSceneStore();

  const [tab, setTab] = useState<'build' | 'library' | 'scenes'>('build');
  const [newSceneName, setNewSceneName] = useState('مشهد متوسطي جديد');
  const selectedNode = nodes.find((n) => n.id === selectedId) ?? null;

  const handleSelectiveExportGLB = () => {
    const root = sceneRootRef.current;
    if (!root) return;
    const temp = new THREE.Group();
    root.children.forEach((ch) => {
      const n = ch.name;
      const include =
        (n === 'layer_structure' && exportLayers.structure) ||
        (n === 'layer_interior' && exportLayers.interior) ||
        (n === 'layer_environment' && exportLayers.environment) ||
        (n === 'layer_custom' && exportLayers.interior);
      if (include) temp.add(ch.clone(true));
    });
    if (temp.children.length > 0) exportObject3DToGLB(temp, `medcraft-v3-${building.seed}.glb`);
  };

  const handleSnapshotPNG = () => {
    const c = document.querySelector('canvas');
    if (!c) return;
    const a = document.createElement('a');
    a.href = c.toDataURL('image/png');
    a.download = `medcraft-v3-${building.seed}.png`;
    a.click();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const doc = JSON.parse(String(reader.result)) as SceneDocument;
        if (doc && doc.nodes && doc.walls) loadSceneDocument(doc);
      } catch {
        // Ignore invalid JSON
      }
    };
    reader.readAsText(file);
  };

  return (
    <aside className="fixed top-16 right-3 bottom-3 z-20 w-[330px] studio-panel rounded-2xl flex flex-col overflow-hidden text-xs text-[#f6efe8]">
      <div className="p-2.5 border-b border-white/10 flex items-center justify-between bg-black/30">
        <div className="font-extrabold text-[#fff5eb] flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-[#e07a5f]" />
          <span>MedCraft 3D v3</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={randomizeBuilding} className="px-2 py-1 rounded-lg bg-[#e07a5f] hover:bg-[#eb886d] text-white text-[10px] font-bold flex items-center gap-1">
            <Dices className="w-3 h-3" /><span>عشوائي</span>
          </button>
          <button onClick={() => setProjection(projection === 'perspective' ? 'orthographic' : 'perspective')} className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-bold text-[#ffd3c2]">
            {projection === 'perspective' ? 'Persp' : 'Ortho'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1 p-1.5 border-b border-white/10 bg-black/20">
        <button onClick={() => setTab('build')} className={`py-1.5 rounded-lg text-[11px] font-bold transition ${tab === 'build' ? 'bg-[#e07a5f]/30 text-[#ffd3c2]' : 'text-[#d6c6b8] hover:text-white'}`}>البناء</button>
        <button onClick={() => setTab('library')} className={`py-1.5 rounded-lg text-[11px] font-bold transition ${tab === 'library' ? 'bg-[#e07a5f]/30 text-[#ffd3c2]' : 'text-[#d6c6b8] hover:text-white'}`}>مكتبتي ({assetLibrary.length})</button>
        <button onClick={() => setTab('scenes')} className={`py-1.5 rounded-lg text-[11px] font-bold transition ${tab === 'scenes' ? 'bg-[#e07a5f]/30 text-[#ffd3c2]' : 'text-[#d6c6b8] hover:text-white'}`}>المشاهد ({savedScenes.length})</button>
      </div>

      <div className="flex-1 overflow-y-auto studio-scroll p-3 space-y-4">
        {tab === 'build' && (
          <>
            <div>
              <div className="font-bold text-[#f2cc8f] mb-1.5">قوالب سريعة (6 أنماط)</div>
              <div className="grid grid-cols-2 gap-1.5">
                {Object.entries(BUILDING_PRESETS).map(([id, p]) => (
                  <button key={id} onClick={() => applyPreset(id)} className="text-right p-2 rounded-xl bg-white/5 hover:bg-[#e07a5f]/25 border border-white/10 transition">
                    <div className="font-bold text-white text-[11px]">{p.label}</div>
                    <div className="text-[10px] text-[#cbb8a8]">{p.subtitle}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Dimensions & Weathering Sliders */}
            <div className="pt-2 border-t border-white/10 space-y-2">
              <div className="font-bold text-[#f2cc8f]">أبعاد المبنى والواجهات</div>
              <label className="block">
                <div className="flex justify-between text-[11px] mb-1"><span>الأدوار</span><span className="font-mono text-[#ffd3c2]">{building.floors}</span></div>
                <input type="range" min={1} max={4} step={1} value={building.floors} onChange={(e) => updateBuilding({ floors: parseInt(e.target.value, 10) })} className="w-full" />
              </label>
              <label className="block">
                <div className="flex justify-between text-[11px] mb-1"><span>العرض × العمق</span><span className="font-mono text-[#ffd3c2]">{building.width.toFixed(1)} × {building.depth.toFixed(1)}m</span></div>
                <div className="grid grid-cols-2 gap-2">
                  <input type="range" min={6} max={14} step={0.5} value={building.width} onChange={(e) => updateBuilding({ width: parseFloat(e.target.value) })} />
                  <input type="range" min={5} max={11} step={0.5} value={building.depth} onChange={(e) => updateBuilding({ depth: parseFloat(e.target.value) })} />
                </div>
              </label>
              <label className="block">
                <div className="flex justify-between text-[11px] mb-1"><span>تقادم المحارة (Weathering)</span><span className="font-mono text-[#ffd3c2]">{Math.round(building.weathering * 100)}%</span></div>
                <input type="range" min={0} max={1} step={0.05} value={building.weathering} onChange={(e) => updateBuilding({ weathering: parseFloat(e.target.value) })} className="w-full" />
              </label>

              <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
                <label className="flex items-center gap-1.5 bg-white/5 px-2 py-1.5 rounded-xl border border-white/10 cursor-pointer"><input type="checkbox" checked={building.showSidewalk} onChange={(e) => updateBuilding({ showSidewalk: e.target.checked })} /><span>الرصيف</span></label>
                <label className="flex items-center gap-1.5 bg-white/5 px-2 py-1.5 rounded-xl border border-white/10 cursor-pointer"><input type="checkbox" checked={building.hasAwning} onChange={(e) => updateBuilding({ hasAwning: e.target.checked })} /><span>تندة مخططة</span></label>
                <label className="flex items-center gap-1.5 bg-white/5 px-2 py-1.5 rounded-xl border border-white/10 cursor-pointer"><input type="checkbox" checked={building.hasVines} onChange={(e) => updateBuilding({ hasVines: e.target.checked })} /><span>جهنمية</span></label>
                <label className="flex items-center gap-1.5 bg-white/5 px-2 py-1.5 rounded-xl border border-white/10 cursor-pointer"><input type="checkbox" checked={building.hasRooftopProps} onChange={(e) => updateBuilding({ hasRooftopProps: e.target.checked })} /><span>تجهيزات السطح</span></label>
                <label className="flex items-center gap-1.5 bg-white/5 px-2 py-1.5 rounded-xl border border-white/10 cursor-pointer col-span-2"><input type="checkbox" checked={building.postFxEnabled} onChange={(e) => updateBuilding({ postFxEnabled: e.target.checked })} /><span>تفعيل Post-Processing (Bloom + Vignette)</span></label>
              </div>
            </div>

            {/* Smart Surface Placement Spawner */}
            <div className="pt-2 border-t border-white/10">
              <div className="font-bold text-[#f2cc8f] mb-1 flex items-center gap-1"><Plus className="w-3.5 h-3.5" /><span>إضافة ذكية على الأسطح</span></div>
              <div className="text-[10px] text-[#cbb8a8] mb-1.5">اضغط على أي عنصر ثم وجّه الماوس للحائط أو الأرضية</div>
              <div className="grid grid-cols-2 gap-1.5">
                {SPAWN_ITEMS.map((item) => (
                  <button key={item.kind} onClick={() => spawnObject(item.kind)} className="text-right px-2 py-1.5 rounded-xl bg-white/5 hover:bg-[#81b29a]/25 border border-white/10 text-[11px] text-[#f5ece4] transition">
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {selectedNode && (
              <div className="p-2.5 rounded-xl bg-[#e07a5f]/20 border border-[#e07a5f]/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white truncate">{selectedNode.name}</span>
                  <button onClick={() => toggleNodeBooleanCutter(selectedNode.id)} className="px-2 py-0.5 rounded-lg bg-[#e07a5f] text-white text-[10px] font-bold flex items-center gap-1">
                    <Scissors className="w-3 h-3" /><span>{selectedNode.booleanCutter?.enabled ? 'Boolean ON' : 'Boolean OFF'}</span>
                  </button>
                </div>
                {selectedNode.booleanCutter?.enabled && (
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[10px] text-[#f2cc8f]">أبعاد صندوق القطع الحي (Live Boolean Box)</div>
                    {(['X', 'Y', 'Z'] as const).map((axis, idx) => (
                      <label key={axis} className="flex items-center gap-2 text-[10px]">
                        <span className="w-4 font-mono">{axis}</span>
                        <input
                          type="range" min={0.4} max={4.5} step={0.05}
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

            <div className="pt-2 border-t border-white/10 space-y-2">
              <div className="font-bold text-[#f2cc8f]">لوحة الألوان والسطح والإضاءة</div>
              <div className="grid grid-cols-3 gap-1.5">
                {PALETTES.map((pal) => (
                  <button key={pal.id} onClick={() => updateBuilding({ wallColor: pal.wall, trimColor: pal.trim, shutterColor: pal.shutter, awningColor: pal.awning, roofColor: pal.roof, flowerColor: pal.flower })} className="p-1.5 rounded-xl bg-white/5 hover:border-[#e07a5f] border border-white/10">
                    <div className="flex h-3 rounded overflow-hidden mb-1">
                      <span className="flex-1" style={{ background: pal.wall }} />
                      <span className="flex-1" style={{ background: pal.shutter }} />
                      <span className="flex-1" style={{ background: pal.roof }} />
                    </div>
                    <div className="text-[9px] text-center truncate text-[#f5ece4]">{pal.name}</div>
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <select value={building.roofType} onChange={(e) => updateBuilding({ roofType: e.target.value as RoofType })} className="bg-[#2b2521] border border-white/20 rounded-xl px-2 py-1.5 text-[11px] text-white">
                  <option value="flat">سطح مستوي</option>
                  <option value="hipped">قرميد هرمي</option>
                  <option value="gabled">قرميد جمالون</option>
                </select>
                <select value={building.lighting} onChange={(e) => updateBuilding({ lighting: e.target.value as LightingMode })} className="bg-[#2b2521] border border-white/20 rounded-xl px-2 py-1.5 text-[11px] text-white">
                  <option value="golden">☀️ الساعة الذهبية</option>
                  <option value="noon">🌤️ ظهيرة</option>
                  <option value="sunset">🌇 غروب</option>
                  <option value="night">🌙 ليل دافئ</option>
                </select>
              </div>
            </div>
          </>
        )}

        {tab === 'library' && (
          <div className="space-y-3">
            <button onClick={() => setAppMode('studio')} className="w-full bg-[#81b29a]/25 hover:bg-[#81b29a]/40 border border-[#81b29a]/50 text-[#c9f7df] font-bold py-2 rounded-xl flex items-center justify-center gap-1.5">
              <Bookmark className="w-3.5 h-3.5" /><span>افتح استوديو الأصول لتوليد قطعة جديدة</span>
            </button>
            {assetLibrary.length === 0 ? (
              <div className="text-center text-[#cbb8a8] py-6">لا توجد قطع محفوظة بعد — افتح استوديو الأصول واحفظ أول قطعة!</div>
            ) : (
              <div className="space-y-1.5">
                {assetLibrary.map((asset) => (
                  <div key={asset.id} className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10">
                    <button onClick={() => startPlacing({ name: asset.name, recipe: asset.recipe, placementRule: asset.placementRule, booleanCutter: asset.defaultBooleanCutter })} className="flex-1 text-right hover:text-[#ffd3c2]">
                      <div className="font-bold text-white">{asset.name}</div>
                      <div className="text-[10px] text-[#cbb8a8]">{asset.category} • #{asset.recipe.seed}</div>
                    </button>
                    <button onClick={() => deleteAssetFromLibrary(asset.id)} className="p-1.5 text-red-300 hover:bg-red-500/20 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'scenes' && (
          <div className="space-y-3">
            <div className="flex gap-1.5">
              <input type="text" value={newSceneName} onChange={(e) => setNewSceneName(e.target.value)} className="flex-1 bg-[#2b2521] border border-white/20 rounded-xl px-2.5 py-1.5 text-white text-xs" />
              <button onClick={() => saveNamedScene(newSceneName)} className="bg-[#e07a5f] text-white font-bold px-3 rounded-xl flex items-center gap-1"><Save className="w-3.5 h-3.5" /><span>حفظ</span></button>
            </div>
            <label className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-1.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer">
              <Upload className="w-3.5 h-3.5" /><span>استيراد ملف .medcraft.json</span>
              <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
            </label>
            <div className="space-y-1.5 pt-1">
              {savedScenes.map((sc) => (
                <div key={sc.id} className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10">
                  <button onClick={() => loadNamedScene(sc.id)} className="flex-1 text-right hover:text-[#c9f7df]">
                    <div className="font-bold text-white flex items-center gap-1"><FolderOpen className="w-3 h-3 text-[#81b29a]" /><span>{sc.name}</span></div>
                    <div className="text-[10px] text-[#cbb8a8]">{sc.nodes.length} عناصر • {sc.walls.length} حوائط</div>
                  </button>
                  <button onClick={() => deleteNamedScene(sc.id)} className="p-1.5 text-red-300 hover:bg-red-500/20 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Selective GLB Export + PNG Footer */}
      <div className="p-2.5 border-t border-white/10 bg-black/40 space-y-2">
        <div className="flex items-center justify-between text-[10px] text-[#e8dcd0] px-1">
          <span className="font-bold text-[#f2cc8f]">تضمين GLB:</span>
          <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={exportLayers.structure} onChange={(e) => setExportLayer('structure', e.target.checked)} /><span>المبنى</span></label>
          <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={exportLayers.interior} onChange={(e) => setExportLayer('interior', e.target.checked)} /><span>الأثاث</span></label>
          <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={exportLayers.environment} onChange={(e) => setExportLayer('environment', e.target.checked)} /><span>البيئة</span></label>
        </div>
        <div className="flex gap-1.5">
          <button onClick={handleSelectiveExportGLB} className="flex-1 bg-[#81b29a] hover:bg-[#6fa088] text-[#111c16] font-extrabold text-xs py-2 rounded-xl flex items-center justify-center gap-1.5">
            <Download className="w-4 h-4" /><span>تصدير GLB</span>
          </button>
          <button onClick={handleSnapshotPNG} className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1" title="حفظ لقطة PNG">
            <Camera className="w-3.5 h-3.5" /><span>PNG</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
