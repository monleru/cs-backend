// Weapon interface
export interface Weapon {
  id: string;
  weapon_id: number;
  name: string;
}

// Category interface
export interface Category {
  id: string;
  name: string;
}

// Pattern interface
export interface Pattern {
  id: string;
  name: string;
}

// Rarity interface
export interface Rarity {
  id: string;
  name: string;
  color: string;
}

// Wear interface
export interface Wear {
  id: string;
  name: string;
}

// Collection interface
export interface Collection {
  id: string;
  name: string;
  crates: Crate[];
  contains_rare: any[];
  market_hash_name: string;
  rental: boolean;
  image: string;
  model_player: string;
  loot_list: any;
}

// Crate interface
export interface Crate {
  id: string;
  name: string;
  image: string;
}

// Team interface
export interface Team {
  id: string;
  name: string;
}

// Style interface
export interface Style {
  id: number;
  name: string;
  url: string;
}

// Skin interface
export interface Skin {
  id: string;
  name: string;
  description: string;
  weapon: Weapon;
  category: Category;
  pattern: Pattern;
  min_float: number;
  max_float: number;
  rarity: Rarity;
  stattrak: boolean;
  souvenir: boolean;
  paint_index: string;
  wears: Wear[];
  collections: Collection[];
  crates: Crate[];
  team: Team;
  legacy_model: boolean;
  image: string;
  // Дополнительная информация для детального просмотра
  crate_details?: CrateDetail[];
  collection_details?: CollectionDetail[];
  market_info?: MarketInfo;
}

// Skin not grouped interface
export interface SkinNotGrouped {
  id: string;
  skin_id: string;
  name: string;
  description: string;
  weapon: Weapon;
  category: Category;
  pattern: Pattern;
  min_float: number;
  max_float: number;
  wear: Wear;
  stattrak: boolean;
  souvenir: boolean;
  paint_index: string;
  rarity: Rarity;
  market_hash_name: string;
  team: Team;
  style: Style;
  legacy_model: boolean;
  image: string;
  // Дополнительная информация
  crate_details?: CrateDetail[];
  collection_details?: CollectionDetail[];
  market_info?: MarketInfo;
}

// Sticker interface
export interface Sticker {
  id: string;
  name: string;
  description: string;
  rarity: Rarity;
  crates: Crate[];
  tournament_event?: string;
  tournament_team?: string;
  type: string;
  market_hash_name: string;
  effect: string;
  image: string;
  // Дополнительная информация
  crate_details?: CrateDetail[];
  market_info?: MarketInfo;
}

// Keychain interface
export interface Keychain {
  id: string;
  name: string;
  description: string;
  rarity: Rarity;
  collections: Collection[];
  market_hash_name: string;
  image: string;
  // Дополнительная информация
  collection_details?: CollectionDetail[];
  market_info?: MarketInfo;
}

// Collectible interface
export interface Collectible {
  id: string;
  name: string;
  description: string;
  rarity: Rarity;
  type: string | null;
  genuine: boolean;
  market_hash_name: string | null;
  image: string;
  // Дополнительная информация
  collection_details?: CollectionDetail[];
  market_info?: MarketInfo;
}

// Agent interface
export interface Agent {
  id: string;
  name: string;
  description: string;
  rarity: Rarity;
  collections: Collection[];
  team: Team;
  market_hash_name: string;
  image: string;
  // Дополнительная информация
  collection_details?: CollectionDetail[];
  market_info?: MarketInfo;
}

// Patch interface
export interface Patch {
  id: string;
  name: string;
  description: string;
  rarity: Rarity;
  market_hash_name: string;
  image: string;
  // Дополнительная информация
  market_info?: MarketInfo;
}

// Graffiti interface
export interface Graffiti {
  id: string;
  name: string;
  description: string;
  rarity: Rarity;
  crates: Crate[];
  market_hash_name: string;
  image: string;
  // Дополнительная информация
  crate_details?: CrateDetail[];
  market_info?: MarketInfo;
}

// Music kit interface
export interface MusicKit {
  id: string;
  name: string;
  description: string;
  rarity: Rarity;
  market_hash_name: string;
  exclusive: boolean;
  image: string;
  // Дополнительная информация
  market_info?: MarketInfo;
}

// Base weapon interface
export interface BaseWeapon {
  id: string;
  name: string;
  description: string;
  image: string;
}

// Highlight interface
export interface Highlight {
  id: string;
  name: string;
  description: string;
  tournament_event: string;
  team0: string;
  team1: string;
  stage: string;
  map: string;
  market_hash_name: string;
  image: string;
  video: string;
}

// All items interface
export interface AllItems {
  [key: string]: Skin | Sticker | Keychain | Collectible | Agent | Patch | Graffiti | MusicKit | BaseWeapon | Highlight;
}

// Новые интерфейсы для детальной информации
export interface DetailedSkin extends Skin {
  crate_details: CrateDetail[];
  collection_details: CollectionDetail[];
  market_info: MarketInfo;
  related_items?: RelatedItem[];
}

export interface RelatedItem {
  type: 'skin' | 'sticker' | 'keychain' | 'collectible' | 'agent' | 'patch' | 'graffiti' | 'music_kit';
  id: string;
  name: string;
  rarity: Rarity;
  image: string;
  relationship: 'same_collection' | 'same_crate' | 'same_rarity' | 'same_weapon';
}

export interface CrateContents {
  crate: Crate;
  contents: {
    skins: Skin[];
    stickers: Sticker[];
    keychains: Keychain[];
    collectibles: Collectible[];
    agents: Agent[];
    patches: Patch[];
    graffiti: Graffiti[];
    music_kits: MusicKit[];
  };
  rarity_distribution: RarityDistribution;
  special_items: any[];
  key_required: boolean;
  key_info?: KeyInfo;
}

export interface CollectionContents {
  collection: Collection;
  contents: {
    skins: Skin[];
    stickers: Sticker[];
    keychains: Keychain[];
    collectibles: Collectible[];
    agents: Agent[];
    patches: Patch[];
    graffiti: Graffiti[];
    music_kits: MusicKit[];
  };
  rarity_distribution: RarityDistribution;
  special_items: any[];
  drop_source: string;
}

export interface CrateDetail {
  crate: Crate;
  drop_chance?: number;
  rarity_distribution?: RarityDistribution;
  contains_items?: Skin[];
  special_items?: any[];
  key_required?: boolean;
  key_info?: KeyInfo;
}

export interface CollectionDetail {
  collection: Collection;
  rarity_distribution?: RarityDistribution;
  contains_skins?: Skin[];
  special_items?: any[];
  drop_source?: string;
}

export interface RarityDistribution {
  common: number;
  uncommon: number;
  rare: number;
  legendary: number;
  ancient: number;
  contraband: number;
}

export interface KeyInfo {
  id: string;
  name: string;
  price?: number;
  market_hash_name: string;
  image: string;
}

export interface MarketInfo {
  market_hash_name: string;
  price_range?: {
    min: number;
    max: number;
  };
  trade_up_contract?: boolean;
  souvenir_contract?: boolean;
}

// Интерфейс для пагинированного ответа
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}
