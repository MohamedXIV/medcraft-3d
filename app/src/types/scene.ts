export type Vec3 = [number, number, number];

export type LayerType = 'structure' | 'interior' | 'environment' | 'custom';
export type PlacementRule = 'floor' | 'wall' | 'table' | 'ceiling' | 'free';
export type TransformMode = 'translate' | 'rotate' | 'scale';
export type WallHeightPreset = 'full' | 'half' | 'fence';
export type WallCutMode = 'up' | 'cutaway' | 'down';

export interface Transform {
  position: Vec3;
  rotation: Vec3;
  scale: Vec3;
}

export interface BooleanCutterConfig {
  enabled: boolean;
  /** Size of the live editable CSG bounding box in local space */
  boxSize: Vec3;
  /** Offset of the cutter box relative to the object pivot */
  boxOffset: Vec3;
  /** Which structural targets this cutter subtracts from */
  targets: Array<'walls' | 'slabs'>;
}

export interface ProceduralRecipe {
  kind:
    | 'staircase'
    | 'window_shuttered'
    | 'door_arched'
    | 'cafe_table'
    | 'olive_tree'
    | 'street_lamp'
    | 'water_tank'
    | 'park_bench'
    | 'bed_mediterranean'
    | 'custom_box';
  seed: number;
  params: Record<string, number | string | boolean>;
}

export interface SceneNode {
  id: string;
  name: string;
  layer: LayerType;
  floor: number;
  visible: boolean;
  locked?: boolean;
  placementRule: PlacementRule;
  transform: Transform;
  recipe: ProceduralRecipe;
  booleanCutter?: BooleanCutterConfig;
}

export interface FreeformWall {
  id: string;
  floor: number;
  start: [number, number];
  end: [number, number];
  thickness: number;
  heightPreset: WallHeightPreset;
  exteriorColor: string;
  interiorColor: string;
}

export interface StudioAssetItem {
  id: string;
  name: string;
  category: 'furniture' | 'trees' | 'street' | 'decor' | 'openings';
  createdAt: string;
  thumbnailDataUrl?: string;
  placementRule: PlacementRule;
  recipe: ProceduralRecipe;
  defaultBooleanCutter?: BooleanCutterConfig;
}

export interface SceneDocument {
  schemaVersion: '3.0';
  id: string;
  name: string;
  updatedAt: string;
  floors: number;
  floorHeight: number;
  walls: FreeformWall[];
  nodes: SceneNode[];
}
