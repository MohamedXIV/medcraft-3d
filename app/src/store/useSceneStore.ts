import { create } from 'zustand';
import { temporal } from 'zundo';
import type {
  BooleanCutterConfig,
  FreeformWall,
  PlacementRule,
  ProceduralRecipe,
  SceneDocument,
  SceneNode,
  StudioAssetItem,
  Transform,
  TransformMode,
  Vec3,
  WallCutMode,
  WallHeightPreset
} from '../types/scene';
import { BUILDING_PRESETS, type BuildingConfig } from '../procedural/prng';

export type EditorToolMode = 'select' | 'draw_wall' | 'paint_wall' | 'place_object';

export interface PlacingDraft {
  name: string;
  recipe: ProceduralRecipe;
  placementRule: PlacementRule;
  booleanCutter?: BooleanCutterConfig;
}

const LS_LIBRARY_KEY = 'medcraft_v3_asset_library';
const LS_SCENES_KEY = 'medcraft_v3_saved_scenes';

function safeReadLS<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeWriteLS(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors
  }
}

interface EditorState {
  appMode: 'scene' | 'studio';
  toolMode: EditorToolMode;
  placingDraft: PlacingDraft | null;
  wallDrawHeight: WallHeightPreset;
  paintColor: string;

  sceneName: string;
  building: BuildingConfig;
  activeFloor: number;
  wallCutMode: WallCutMode;
  projection: 'perspective' | 'orthographic';

  nodes: SceneNode[];
  walls: FreeformWall[];

  selectedId: string | null;
  transformMode: TransformMode;
  snapToGrid: boolean;
  gridSize: number;

  // Persistent Personal Library & Saved Scenes
  assetLibrary: StudioAssetItem[];
  savedScenes: SceneDocument[];

  // Mode & Tool Actions
  setAppMode: (mode: 'scene' | 'studio') => void;
  setToolMode: (mode: EditorToolMode) => void;
  startPlacing: (draft: PlacingDraft) => void;
  cancelPlacing: () => void;
  setWallDrawHeight: (h: WallHeightPreset) => void;
  setPaintColor: (hex: string) => void;

  // Selection & Camera Actions
  selectNode: (id: string | null) => void;
  setTransformMode: (mode: TransformMode) => void;
  toggleSnap: () => void;
  setActiveFloor: (floor: number) => void;
  setWallCutMode: (mode: WallCutMode) => void;
  setProjection: (proj: 'perspective' | 'orthographic') => void;

  // Building & Scene Actions
  updateBuilding: (patch: Partial<BuildingConfig>) => void;
  applyPreset: (presetId: string) => void;
  spawnObject: (kind: ProceduralRecipe['kind']) => void;
  addNode: (node: SceneNode) => void;
  updateNodeTransform: (id: string, patch: Partial<Transform>) => void;
  toggleNodeBooleanCutter: (id: string) => void;
  updateBooleanCutterBox: (id: string, boxSize: Vec3) => void;
  duplicateSelected: () => void;
  deleteSelected: () => void;

  // Freeform Wall Actions
  addWall: (wall: FreeformWall) => void;
  paintWall: (wallId: string, color: string) => void;
  deleteWall: (wallId: string) => void;

  // Asset Library & Scene Persistence
  saveAssetToLibrary: (item: StudioAssetItem) => void;
  deleteAssetFromLibrary: (id: string) => void;
  saveNamedScene: (name: string) => void;
  loadNamedScene: (id: string) => void;
  deleteNamedScene: (id: string) => void;
  exportSceneDocument: () => SceneDocument;
  loadSceneDocument: (doc: SceneDocument) => void;
}

function buildPerimeterWalls(w: number, d: number, extColor: string): FreeformWall[] {
  const hw = w / 2, hd = d / 2;
  return [
    { id: 'w-back', floor: 0, start: [-hw, -hd], end: [hw, -hd], thickness: 0.26, heightPreset: 'full', exteriorColor: extColor, interiorColor: '#f4ebe0' },
    { id: 'w-left', floor: 0, start: [-hw, -hd], end: [-hw, hd], thickness: 0.26, heightPreset: 'full', exteriorColor: extColor, interiorColor: '#f4ebe0' },
    { id: 'w-right', floor: 0, start: [hw, -hd], end: [hw, hd], thickness: 0.26, heightPreset: 'full', exteriorColor: extColor, interiorColor: '#f4ebe0' },
    { id: 'w-front', floor: 0, start: [-hw, hd], end: [hw, hd], thickness: 0.26, heightPreset: 'full', exteriorColor: extColor, interiorColor: '#f4ebe0' }
  ];
}

const DEFAULT_BUILDING: BuildingConfig = {
  seed: 4027,
  width: 9.0,
  depth: 7.0,
  floors: 2,
  floorHeight: 3.1,
  roofType: 'flat',
  wallColor: '#e8d7c3',
  trimColor: '#f5ece0',
  shutterColor: '#2f7a57',
  awningColor: '#2a8058',
  roofColor: '#c86442',
  weathering: 0.65,
  lighting: 'golden',
  showSidewalk: true
};

const INITIAL_NODES: SceneNode[] = [
  {
    id: 'stair-1',
    name: 'سلم خشبي (Live Boolean)',
    layer: 'structure',
    floor: 0,
    visible: true,
    placementRule: 'floor',
    transform: { position: [-2.8, 0, -1.6], rotation: [0, 0, 0], scale: [1, 1, 1] },
    recipe: { kind: 'staircase', seed: 101, params: { steps: 11, width: 1.1, run: 2.7 } },
    booleanCutter: { enabled: true, boxSize: [1.35, 3.5, 2.9], boxOffset: [0, 1.75, 1.35], targets: ['slabs'] }
  },
  {
    id: 'win-1',
    name: 'شباك شيش (Live Boolean)',
    layer: 'structure',
    floor: 0,
    visible: true,
    placementRule: 'wall',
    transform: { position: [1.6, 1.65, -3.5], rotation: [0, Math.PI, 0], scale: [1, 1, 1] },
    recipe: { kind: 'window_shuttered', seed: 105, params: { width: 1.15, height: 1.35 } },
    booleanCutter: { enabled: true, boxSize: [1.15, 1.35, 0.75], boxOffset: [0, 0, 0], targets: ['walls'] }
  },
  {
    id: 'door-1',
    name: 'باب مدخل (Live Boolean)',
    layer: 'structure',
    floor: 0,
    visible: true,
    placementRule: 'wall',
    transform: { position: [0, 0, 3.5], rotation: [0, 0, 0], scale: [1, 1, 1] },
    recipe: { kind: 'door_arched', seed: 109, params: {} },
    booleanCutter: { enabled: true, boxSize: [1.22, 2.22, 0.75], boxOffset: [0, 1.11, 0], targets: ['walls'] }
  },
  {
    id: 'table-1',
    name: 'طاولة كافيه متوسطية',
    layer: 'interior',
    floor: 0,
    visible: true,
    placementRule: 'floor',
    transform: { position: [1.5, 0, 0.8], rotation: [0, 0.35, 0], scale: [1, 1, 1] },
    recipe: { kind: 'cafe_table', seed: 202, params: { chairs: 2 } }
  },
  {
    id: 'tree-1',
    name: 'شجرة زيتون',
    layer: 'environment',
    floor: 0,
    visible: true,
    placementRule: 'floor',
    transform: { position: [-5.8, 0, 4.1], rotation: [0, 0.6, 0], scale: [1, 1, 1] },
    recipe: { kind: 'olive_tree', seed: 303, params: { scale: 1.0 } }
  },
  {
    id: 'lamp-1',
    name: 'عمود إنارة',
    layer: 'environment',
    floor: 0,
    visible: true,
    placementRule: 'floor',
    transform: { position: [5.2, 0, 4.3], rotation: [0, 0, 0], scale: [1, 1, 1] },
    recipe: { kind: 'street_lamp', seed: 304, params: {} }
  }
];

export function makeDefaultDraft(kind: ProceduralRecipe['kind']): PlacingDraft {
  const isWallOp = kind === 'window_shuttered' || kind === 'door_arched';
  const isStair = kind === 'staircase';
  return {
    name: kind.replace('_', ' '),
    placementRule: isWallOp ? 'wall' : 'floor',
    recipe: { kind, seed: Math.floor(100 + Math.random() * 9000), params: {} },
    ...(isWallOp
      ? { booleanCutter: { enabled: true, boxSize: [1.2, kind === 'window_shuttered' ? 1.35 : 2.2, 0.75], boxOffset: [0, kind === 'window_shuttered' ? 0 : 1.1, 0], targets: ['walls'] } }
      : isStair
        ? { booleanCutter: { enabled: true, boxSize: [1.35, 3.5, 2.9], boxOffset: [0, 1.75, 1.35], targets: ['slabs'] } }
        : {})
  };
}

export const useSceneStore = create<EditorState>()(
  temporal(
    (set, get) => ({
      appMode: 'scene',
      toolMode: 'select',
      placingDraft: null,
      wallDrawHeight: 'full',
      paintColor: '#de9a7c',

      sceneName: 'Mediterranean Studio v3',
      building: DEFAULT_BUILDING,
      activeFloor: 0,
      wallCutMode: 'cutaway',
      projection: 'perspective',
      nodes: INITIAL_NODES,
      walls: buildPerimeterWalls(DEFAULT_BUILDING.width, DEFAULT_BUILDING.depth, DEFAULT_BUILDING.wallColor),
      selectedId: 'stair-1',
      transformMode: 'translate',
      snapToGrid: true,
      gridSize: 0.25,

      assetLibrary: safeReadLS<StudioAssetItem[]>(LS_LIBRARY_KEY, []),
      savedScenes: safeReadLS<SceneDocument[]>(LS_SCENES_KEY, []),

      setAppMode: (appMode) => set({ appMode }),
      setToolMode: (toolMode) => set({ toolMode, placingDraft: toolMode === 'place_object' ? get().placingDraft : null, selectedId: toolMode === 'select' ? get().selectedId : null }),
      startPlacing: (draft) => set({ appMode: 'scene', toolMode: 'place_object', placingDraft: draft, selectedId: null }),
      cancelPlacing: () => set({ toolMode: 'select', placingDraft: null }),
      setWallDrawHeight: (wallDrawHeight) => set({ wallDrawHeight }),
      setPaintColor: (paintColor) => set({ paintColor }),

      selectNode: (id) => set({ selectedId: id }),
      setTransformMode: (transformMode) => set({ transformMode }),
      toggleSnap: () => set((s) => ({ snapToGrid: !s.snapToGrid })),
      setActiveFloor: (activeFloor) => set({ activeFloor }),
      setWallCutMode: (wallCutMode) => set({ wallCutMode }),
      setProjection: (projection) => set({ projection }),

      updateBuilding: (patch) =>
        set((s) => {
          const next = { ...s.building, ...patch };
          const walls =
            patch.width !== undefined || patch.depth !== undefined || patch.wallColor !== undefined
              ? buildPerimeterWalls(next.width, next.depth, next.wallColor)
              : s.walls;
          return { building: next, walls };
        }),

      applyPreset: (presetId) => {
        const p = BUILDING_PRESETS[presetId];
        if (!p) return;
        get().updateBuilding(p.config);
      },

      spawnObject: (kind) => {
        // Enter Surface-Aware Smart Placement Mode so user places it directly onto any floor/wall/table!
        get().startPlacing(makeDefaultDraft(kind));
      },

      addNode: (node) => set((s) => ({ nodes: [...s.nodes, node], selectedId: node.id })),

      updateNodeTransform: (id, patch) =>
        set((s) => ({
          nodes: s.nodes.map((n) => (n.id === id ? { ...n, transform: { ...n.transform, ...patch } } : n))
        })),

      toggleNodeBooleanCutter: (id) =>
        set((s) => ({
          nodes: s.nodes.map((n) => {
            if (n.id !== id) return n;
            const current = n.booleanCutter ?? {
              enabled: false,
              boxSize: [1.4, 2.2, 1.4],
              boxOffset: [0, 1.1, 0],
              targets: ['walls', 'slabs']
            };
            return { ...n, booleanCutter: { ...current, enabled: !current.enabled } };
          })
        })),

      updateBooleanCutterBox: (id, boxSize) =>
        set((s) => ({
          nodes: s.nodes.map((n) =>
            n.id === id && n.booleanCutter
              ? { ...n, booleanCutter: { ...n.booleanCutter, boxSize } }
              : n
          )
        })),

      duplicateSelected: () => {
        const { selectedId, nodes } = get();
        const found = nodes.find((n) => n.id === selectedId);
        if (!found) return;
        const copy: SceneNode = {
          ...structuredClone(found),
          id: `${found.recipe.kind}-${Date.now()}`,
          name: `${found.name} (نسخة)`,
          transform: { ...found.transform, position: [found.transform.position[0] + 1.2, found.transform.position[1], found.transform.position[2]] }
        };
        set({ nodes: [...nodes, copy], selectedId: copy.id });
      },

      deleteSelected: () => {
        const { selectedId, nodes } = get();
        if (!selectedId) return;
        set({ nodes: nodes.filter((n) => n.id !== selectedId), selectedId: null });
      },

      addWall: (wall) => set((s) => ({ walls: [...s.walls, wall] })),

      paintWall: (wallId, color) =>
        set((s) => ({
          walls: s.walls.map((w) => (w.id === wallId ? { ...w, exteriorColor: color } : w))
        })),

      deleteWall: (wallId) => set((s) => ({ walls: s.walls.filter((w) => w.id !== wallId) })),

      saveAssetToLibrary: (item) =>
        set((s) => {
          const next = [item, ...s.assetLibrary];
          safeWriteLS(LS_LIBRARY_KEY, next);
          return { assetLibrary: next };
        }),

      deleteAssetFromLibrary: (id) =>
        set((s) => {
          const next = s.assetLibrary.filter((a) => a.id !== id);
          safeWriteLS(LS_LIBRARY_KEY, next);
          return { assetLibrary: next };
        }),

      saveNamedScene: (name) => {
        const doc = get().exportSceneDocument();
        doc.name = name.trim() || `مشهد ${new Date().toLocaleTimeString('ar-EG')}`;
        set((s) => {
          const next = [doc, ...s.savedScenes.filter((x) => x.id !== doc.id)];
          safeWriteLS(LS_SCENES_KEY, next);
          return { savedScenes: next, sceneName: doc.name };
        });
      },

      loadNamedScene: (id) => {
        const found = get().savedScenes.find((x) => x.id === id);
        if (found) get().loadSceneDocument(found);
      },

      deleteNamedScene: (id) =>
        set((s) => {
          const next = s.savedScenes.filter((x) => x.id !== id);
          safeWriteLS(LS_SCENES_KEY, next);
          return { savedScenes: next };
        }),

      exportSceneDocument: () => {
        const s = get();
        return {
          schemaVersion: '3.0',
          id: `scene-${Date.now()}`,
          name: s.sceneName,
          updatedAt: new Date().toISOString(),
          floors: s.building.floors,
          floorHeight: s.building.floorHeight,
          walls: s.walls,
          nodes: s.nodes
        };
      },

      loadSceneDocument: (doc) =>
        set((s) => ({
          sceneName: doc.name,
          building: { ...s.building, floors: doc.floors, floorHeight: doc.floorHeight },
          walls: doc.walls,
          nodes: doc.nodes,
          selectedId: null,
          toolMode: 'select',
          placingDraft: null
        }))
    }),
    {
      partialize: (s) => ({ nodes: s.nodes, walls: s.walls, building: s.building })
    }
  )
);
