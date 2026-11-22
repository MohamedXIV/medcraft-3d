export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface PaletteDef {
  id: string;
  name: string;
  wall: string;
  trim: string;
  shutter: string;
  awning: string;
  roof: string;
  flower: string;
}

export const PALETTES: PaletteDef[] = [
  { id: 'cream_emerald', name: 'كريمي وزمردي', wall: '#e8d7c3', trim: '#f5ece0', shutter: '#2f7a57', awning: '#2a8058', roof: '#c86442', flower: '#e04882' },
  { id: 'terracotta_olive', name: 'تيراكوتا وزيتوني', wall: '#de9a7c', trim: '#f3e1cf', shutter: '#3c6e47', awning: '#b84a39', roof: '#c45b38', flower: '#d9468f' },
  { id: 'ochre_teal', name: 'خردلي وفيروزي', wall: '#e5b869', trim: '#f8ebd2', shutter: '#2f7275', awning: '#2e7d5b', roof: '#c96840', flower: '#e85d75' },
  { id: 'peach_walnut', name: 'خوخي وجوزي', wall: '#e6b296', trim: '#f7eadc', shutter: '#6e4c36', awning: '#c45647', roof: '#bd5a3c', flower: '#d63f80' },
  { id: 'lavender_sand', name: 'لافندر ورملي', wall: '#d5c1d6', trim: '#f4edf5', shutter: '#4f6d7a', awning: '#c96f4a', roof: '#c26346', flower: '#e05297' },
  { id: 'mint_rust', name: 'نعناعي وصدئ', wall: '#9fc5b6', trim: '#eef4ef', shutter: '#355c4d', awning: '#c45b44', roof: '#bd5a3a', flower: '#f06292' }
];

export type RoofType = 'flat' | 'hipped' | 'gabled';
export type LightingMode = 'golden' | 'noon' | 'sunset' | 'night';

export interface BuildingConfig {
  seed: number;
  width: number;
  depth: number;
  floors: number;
  floorHeight: number;
  roofType: RoofType;
  wallColor: string;
  trimColor: string;
  shutterColor: string;
  awningColor: string;
  roofColor: string;
  weathering: number;
  lighting: LightingMode;
  showSidewalk: boolean;
}

export const BUILDING_PRESETS: Record<string, { label: string; subtitle: string; config: Partial<BuildingConfig> }> = {
  corner_pharmacy: {
    label: 'ناصية وصيدلية',
    subtitle: 'سطح مستوي + خزان مياه',
    config: { width: 9.0, depth: 7.0, floors: 2, floorHeight: 3.1, roofType: 'flat', wallColor: '#e8d7c3', trimColor: '#f5ece0', shutterColor: '#2f7a57', awningColor: '#2a8058', roofColor: '#c86442', weathering: 0.65 }
  },
  cafe_townhouse: {
    label: 'كافيه وسكني',
    subtitle: 'تندة مخططة + طاولات',
    config: { width: 8.5, depth: 7.0, floors: 2, floorHeight: 3.1, roofType: 'flat', wallColor: '#e5b869', trimColor: '#f7ebd4', shutterColor: '#3c6e47', awningColor: '#c45647', roofColor: '#c86442', weathering: 0.7 }
  },
  med_villa: {
    label: 'بيت قرميد متوسطي',
    subtitle: 'سقف قرميد هرمي دافئ',
    config: { width: 9.0, depth: 7.5, floors: 2, floorHeight: 3.0, roofType: 'hipped', wallColor: '#f0dec6', trimColor: '#faf3e8', shutterColor: '#4d7a57', awningColor: '#c45647', roofColor: '#cc613d', weathering: 0.45 }
  },
  town_hall: {
    label: 'مبنى البلدية',
    subtitle: 'واجهة عريضة + قرميد',
    config: { width: 12.5, depth: 7.5, floors: 2, floorHeight: 3.3, roofType: 'gabled', wallColor: '#efe2ce', trimColor: '#faf5ec', shutterColor: '#6e523d', awningColor: '#9e2a2b', roofColor: '#c75d3b', weathering: 0.35 }
  }
};
