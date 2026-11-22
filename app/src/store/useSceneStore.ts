import { create } from 'zustand';
import { temporal } from 'zundo';
import type {
  FreeformWall,
  SceneDocument,
  SceneNode,
  Transform,
  TransformMode,
  WallCutMode
} from '../types/scene';

interface EditorState {
  sceneName: string;
  floors: number;
  floorHeight: number;
  activeFloor: number;
  wallCutMode: WallCutMode;
  projection: 'perspective' | 'orthographic';

  nodes: SceneNode[];
  walls: FreeformWall[];

  selectedId: string | null;
  transformMode: TransformMode;
  snapToGrid: boolean;
  gridSize: number;

  // Actions
  selectNode: (id: string | null) => void;
  setTransformMode: (mode: TransformMode) => void;
  toggleSnap: () => void;
  setActiveFloor: (floor: number) => void;
  setWallCutMode: (mode: WallCutMode) => void;
  setProjection: (proj: 'perspective' | 'orthographic') => void;

  addNode: (node: SceneNode) => void;
  updateNodeTransform: (id: string, patch: Partial<Transform>) => void;
  toggleNodeBooleanCutter: (id: string) => void;
  duplicateSelected: () => void;
  deleteSelected: () => void;
  addWall: (wall: FreeformWall) => void;

  exportSceneDocument: () => SceneDocument;
  loadSceneDocument: (doc: SceneDocument) => void;
}

const INITIAL_WALLS: FreeformWall[] = [
  { id: 'w-back', floor: 0, start: [-4.5, -3.5], end: [4.5, -3.5], thickness: 0.24, heightPreset: 'full', exteriorColor: '#e8d7c3', interiorColor: '#f4ebe0' },
  { id: 'w-left', floor: 0, start: [-4.5, -3.5], end: [-4.5, 3.5], thickness: 0.24, heightPreset: 'full', exteriorColor: '#e8d7c3', interiorColor: '#f4ebe0' },
  { id: 'w-right', floor: 0, start: [4.5, -3.5], end: [4.5, 3.5], thickness: 0.24, heightPreset: 'full', exteriorColor: '#e8d7c3', interiorColor: '#f4ebe0' },
  { id: 'w-front', floor: 0, start: [-4.5, 3.5], end: [4.5, 3.5], thickness: 0.24, heightPreset: 'full', exteriorColor: '#e8d7c3', interiorColor: '#f4ebe0' }
];

const INITIAL_NODES: SceneNode[] = [
  {
    id: 'stair-1',
    name: 'سلم خشبي (مع Live Boolean Cutter)',
    layer: 'structure',
    floor: 0,
    visible: true,
    placementRule: 'floor',
    transform: { position: [-2.8, 0, -1.6], rotation: [0, 0, 0], scale: [1, 1, 1] },
    recipe: { kind: 'staircase', seed: 101, params: { steps: 11, width: 1.1, run: 2.7 } },
    booleanCutter: { enabled: true, boxSize: [1.3, 3.4, 2.9], boxOffset: [0, 1.7, 1.35], targets: ['slabs'] }
  },
  {
    id: 'table-1',
    name: 'طاولة كافيه متوسطية',
    layer: 'interior',
    floor: 0,
    visible: true,
    placementRule: 'floor',
    transform: { position: [1.4, 0, 0.8], rotation: [0, 0.4, 0], scale: [1, 1, 1] },
    recipe: { kind: 'cafe_table', seed: 202, params: { chairs: 2 } }
  },
  {
    id: 'tree-1',
    name: 'شجرة زيتون',
    layer: 'environment',
    floor: 0,
    visible: true,
    placementRule: 'floor',
    transform: { position: [-6.0, 0, 4.2], rotation: [0, 0.6, 0], scale: [1, 1, 1] },
    recipe: { kind: 'olive_tree', seed: 303, params: { scale: 1.0 } }
  }
];

export const useSceneStore = create<EditorState>()(
  temporal(
    (set, get) => ({
      sceneName: 'Mediterranean Corner Studio',
      floors: 2,
      floorHeight: 3.1,
      activeFloor: 0,
      wallCutMode: 'cutaway',
      projection: 'perspective',
      nodes: INITIAL_NODES,
      walls: INITIAL_WALLS,
      selectedId: 'stair-1',
      transformMode: 'translate',
      snapToGrid: true,
      gridSize: 0.25,

      selectNode: (id) => set({ selectedId: id }),
      setTransformMode: (transformMode) => set({ transformMode }),
      toggleSnap: () => set((s) => ({ snapToGrid: !s.snapToGrid })),
      setActiveFloor: (activeFloor) => set({ activeFloor }),
      setWallCutMode: (wallCutMode) => set({ wallCutMode }),
      setProjection: (projection) => set({ projection }),

      addNode: (node) => set((s) => ({ nodes: [...s.nodes, node], selectedId: node.id })),

      updateNodeTransform: (id, patch) =>
        set((s) => ({
          nodes: s.nodes.map((n) =>
            n.id === id ? { ...n, transform: { ...n.transform, ...patch } } : n
          )
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

      duplicateSelected: () => {
        const { selectedId, nodes } = get();
        const found = nodes.find((n) => n.id === selectedId);
        if (!found) return;
        const copy: SceneNode = {
          ...structuredClone(found),
          id: `${found.recipe.kind}-${Date.now()}`,
          name: `${found.name} (نسخة)`,
          transform: {
            ...found.transform,
            position: [found.transform.position[0] + 1.2, found.transform.position[1], found.transform.position[2]]
          }
        };
        set({ nodes: [...nodes, copy], selectedId: copy.id });
      },

      deleteSelected: () => {
        const { selectedId, nodes } = get();
        if (!selectedId) return;
        set({ nodes: nodes.filter((n) => n.id !== selectedId), selectedId: null });
      },

      addWall: (wall) => set((s) => ({ walls: [...s.walls, wall] })),

      exportSceneDocument: () => {
        const s = get();
        return {
          schemaVersion: '3.0',
          id: `scene-${Date.now()}`,
          name: s.sceneName,
          updatedAt: new Date().toISOString(),
          floors: s.floors,
          floorHeight: s.floorHeight,
          walls: s.walls,
          nodes: s.nodes
        };
      },

      loadSceneDocument: (doc) =>
        set({
          sceneName: doc.name,
          floors: doc.floors,
          floorHeight: doc.floorHeight,
          walls: doc.walls,
          nodes: doc.nodes,
          selectedId: null
        })
    }),
    {
      partialize: (s) => ({ nodes: s.nodes, walls: s.walls, floors: s.floors })
    }
  )
);
