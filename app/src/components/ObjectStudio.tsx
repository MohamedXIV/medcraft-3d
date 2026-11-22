import React, { useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows, Grid, OrbitControls } from '@react-three/drei';
import { BookmarkPlus, Dices, Download, Sparkles } from 'lucide-react';
import type * as THREE from 'three';
import { ProceduralObjectMesh } from '../procedural/objects';
import { exportObject3DToGLB } from '../procedural/exporter';
import { useSceneStore } from '../store/useSceneStore';
import type { ProceduralRecipe, StudioAssetItem } from '../types/scene';

const CATEGORIES: Array<{ kind: ProceduralRecipe['kind']; label: string; cat: StudioAssetItem['category'] }> = [
  { kind: 'olive_tree', label: 'شجرة زيتون وحمضيات', cat: 'trees' },
  { kind: 'cafe_table', label: 'طاولة كافيه وكراسي', cat: 'furniture' },
  { kind: 'bed_mediterranean', label: 'سرير متوسطي', cat: 'furniture' },
  { kind: 'park_bench', label: 'مقعد حديقة خشبي', cat: 'street' },
  { kind: 'street_lamp', label: 'عمود إنارة كلاسيكي', cat: 'street' },
  { kind: 'water_tank', label: 'خزان مياه سطح', cat: 'decor' },
  { kind: 'window_shuttered', label: 'شباك شيش (Boolean)', cat: 'openings' },
  { kind: 'door_arched', label: 'باب مدخل (Boolean)', cat: 'openings' },
  { kind: 'staircase', label: 'سلم خشبي (Boolean)', cat: 'openings' }
];

export function ObjectStudio() {
  const { saveAssetToLibrary, startPlacing } = useSceneStore();
  const assetRootRef = useRef<THREE.Group>(null!);

  const [kind, setKind] = useState<ProceduralRecipe['kind']>('olive_tree');
  const [seed, setSeed] = useState<number>(1024);
  const [scale, setScale] = useState<number>(1.0);
  const [shutterColor, setShutterColor] = useState<string>('#2f7a57');
  const [trimColor, setTrimColor] = useState<string>('#f5ece0');
  const [assetName, setAssetName] = useState<string>('شجرة زيتون مخصصة');
  const [savedMsg, setSavedMsg] = useState<string>('');

  const recipe: ProceduralRecipe = { kind, seed, params: { scale } };

  const handleSave = (placeImmediately = false) => {
    const meta = CATEGORIES.find((c) => c.kind === kind)!;
    const isWall = kind === 'window_shuttered' || kind === 'door_arched';
    const isStair = kind === 'staircase';
    const defaultBooleanCutter = isWall
      ? { enabled: true, boxSize: [1.2, kind === 'window_shuttered' ? 1.35 : 2.2, 0.75] as [number, number, number], boxOffset: [0, kind === 'window_shuttered' ? 0 : 1.1, 0] as [number, number, number], targets: ['walls' as const] }
      : isStair
        ? { enabled: true, boxSize: [1.35, 3.5, 2.9] as [number, number, number], boxOffset: [0, 1.75, 1.35] as [number, number, number], targets: ['slabs' as const] }
        : undefined;

    const item: StudioAssetItem = {
      id: `asset-${Date.now()}`,
      name: assetName.trim() || meta.label,
      category: meta.cat,
      createdAt: new Date().toISOString(),
      placementRule: isWall ? 'wall' : 'floor',
      recipe,
      defaultBooleanCutter
    };
    saveAssetToLibrary(item);
    setSavedMsg('تم الحفظ في مكتبتك الشخصية!');
    setTimeout(() => setSavedMsg(''), 2200);

    if (placeImmediately) {
      startPlacing({ name: item.name, recipe: item.recipe, placementRule: item.placementRule, booleanCutter: item.defaultBooleanCutter });
    }
  };

  return (
    <div className="relative w-full h-full">
      <Canvas shadows camera={{ position: [4.2, 3.2, 5.0], fov: 38 }}>
        <color attach="background" args={['#241f1c']} />
        <hemisphereLight args={['#fff4e0', '#5c4b3f', 0.9]} />
        <directionalLight position={[6, 10, 8]} intensity={1.5} castShadow />
        <group ref={assetRootRef} scale={[scale, scale, scale]}>
          <ProceduralObjectMesh recipe={recipe} shutterColor={shutterColor} trimColor={trimColor} />
        </group>
        <ContactShadows position={[0, 0.01, 0]} opacity={0.45} scale={10} blur={2} />
        <Grid args={[12, 12]} cellSize={0.5} sectionSize={2} fadeDistance={18} />
        <OrbitControls makeDefault autoRotate autoRotateSpeed={1.2} />
      </Canvas>

      <aside className="fixed top-16 right-3 bottom-3 z-20 w-[320px] studio-panel rounded-2xl flex flex-col overflow-hidden text-xs text-[#f6efe8]">
        <div className="p-3 border-b border-white/10 bg-black/30 font-extrabold text-[#fff5eb] flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-[#81b29a]" />
          <span>استوديو الأصول المعزول (Object Studio)</span>
        </div>

        <div className="flex-1 overflow-y-auto studio-scroll p-3 space-y-3.5">
          <div>
            <label className="block font-bold text-[#f2cc8f] mb-1">اسم القطعة</label>
            <input type="text" value={assetName} onChange={(e) => setAssetName(e.target.value)} className="w-full bg-[#2b2521] border border-white/20 rounded-xl px-2.5 py-1.5 text-white text-xs" />
          </div>

          <div>
            <div className="font-bold text-[#f2cc8f] mb-1.5">نوع العنصر الإجرائي</div>
            <div className="grid grid-cols-1 gap-1">
              {CATEGORIES.map((c) => (
                <button key={c.kind} onClick={() => { setKind(c.kind); setAssetName(c.label); }} className={`text-right px-2.5 py-1.5 rounded-xl border text-[11px] transition ${kind === c.kind ? 'bg-[#e07a5f]/30 border-[#e07a5f] text-white font-bold' : 'bg-white/5 border-white/10 text-[#e8dcd0] hover:bg-white/10'}`}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-white/10 space-y-2.5">
            <div className="flex items-center gap-2">
              <button onClick={() => setSeed(Math.floor(100 + Math.random() * 98000))} className="flex-1 bg-[#e07a5f]/30 hover:bg-[#e07a5f]/45 border border-[#e07a5f]/50 text-[#ffd3c2] font-bold py-1.5 rounded-xl flex items-center justify-center gap-1"><Dices className="w-3.5 h-3.5" /><span>تنويعة عشوائية</span></button>
              <span className="font-mono text-[11px] px-2 py-1 rounded-lg bg-white/5 border border-white/10">#{seed}</span>
            </div>
            <div>
              <div className="flex justify-between mb-1"><span>الحجم (Scale)</span><span className="font-mono text-[#ffd3c2]">{scale.toFixed(2)}x</span></div>
              <input type="range" min={0.5} max={2.0} step={0.05} value={scale} onChange={(e) => setScale(parseFloat(e.target.value))} className="w-full" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center justify-between bg-white/5 px-2 py-1 rounded-xl border border-white/10"><span>الشيش</span><input type="color" value={shutterColor} onChange={(e) => setShutterColor(e.target.value)} /></label>
              <label className="flex items-center justify-between bg-white/5 px-2 py-1 rounded-xl border border-white/10"><span>الإطار</span><input type="color" value={trimColor} onChange={(e) => setTrimColor(e.target.value)} /></label>
            </div>
          </div>

          {savedMsg && <div className="p-2 rounded-xl bg-[#81b29a]/30 text-[#c9f7df] text-center font-bold">{savedMsg}</div>}
        </div>

        <div className="p-2.5 border-t border-white/10 bg-black/40 space-y-1.5">
          <button onClick={() => handleSave(true)} className="w-full bg-[#e07a5f] hover:bg-[#eb886d] text-white font-extrabold py-2 rounded-xl flex items-center justify-center gap-1.5"><BookmarkPlus className="w-4 h-4" /><span>حفظ في المكتبة ووضعه في المشهد</span></button>
          <div className="grid grid-cols-2 gap-1.5">
            <button onClick={() => handleSave(false)} className="bg-white/10 hover:bg-white/20 text-white font-bold py-1.5 rounded-xl">حفظ فقط</button>
            <button onClick={() => assetRootRef.current && exportObject3DToGLB(assetRootRef.current, `${kind}-${seed}.glb`)} className="bg-[#81b29a] text-[#111c16] font-extrabold py-1.5 rounded-xl flex items-center justify-center gap-1"><Download className="w-3.5 h-3.5" /><span>GLB</span></button>
          </div>
        </div>
      </aside>
    </div>
  );
}
