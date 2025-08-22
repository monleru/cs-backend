export const CSGO_API_CONSTANTS = {
  BASE_URL: 'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api',
  
  // Supported languages
  LANGUAGES: [
    'bg', 'cs', 'da', 'de', 'el', 'en', 'es-ES', 'es-MX', 
    'fi', 'fr', 'hu', 'it', 'ja', 'ko', 'nl', 'no', 'pl', 
    'pt-BR', 'pt-PT', 'ro', 'ru', 'sv', 'th', 'tr', 'uk', 
    'zh-CN', 'zh-TW', 'vi'
  ] as const,
  
  // Default language
  DEFAULT_LANGUAGE: 'en',
  
  // API endpoints
  ENDPOINTS: {
    ALL: '/all.json',
    SKINS: '/skins.json',
    SKINS_NOT_GROUPED: '/skins_not_grouped.json',
    STICKERS: '/stickers.json',
    KEYCHAINS: '/keychains.json',
    COLLECTIONS: '/collections.json',
    CRATES: '/crates.json',
    KEYS: '/keys.json',
    COLLECTIBLES: '/collectibles.json',
    AGENTS: '/agents.json',
    PATCHES: '/patches.json',
    GRAFFITI: '/graffiti.json',
    MUSIC_KITS: '/music_kits.json',
    BASE_WEAPONS: '/base_weapons.json',
    HIGHLIGHTS: '/highlights.json'
  },
  
  // HTTP timeout
  TIMEOUT: 30000,
  
  // Retry attempts
  MAX_RETRIES: 3,
  
  // Cache TTL (in milliseconds) - 5 minutes
  CACHE_TTL: 5 * 60 * 1000,
  
  // Hash algorithm
  HASH_ALGORITHM: 'sha256',
  
  // Hash display length (for logs)
  HASH_DISPLAY_LENGTH: 8,
  
  // Cache integrity check interval (in milliseconds) - 10 minutes
  INTEGRITY_CHECK_INTERVAL: 10 * 60 * 1000,
} as const;

export type SupportedLanguage = typeof CSGO_API_CONSTANTS.LANGUAGES[number];
export type ApiEndpoint = keyof typeof CSGO_API_CONSTANTS.ENDPOINTS;
