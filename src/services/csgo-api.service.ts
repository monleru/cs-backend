import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, catchError, timeout, retry } from 'rxjs';
import { createHash } from 'crypto';
import { 
  CSGO_API_CONSTANTS, 
  SupportedLanguage, 
  ApiEndpoint 
} from '../constants/csgo-api.constants';
import {
  AllItems,
  Skin,
  SkinNotGrouped,
  Sticker,
  Keychain,
  Collection,
  Crate,
  Collectible,
  Agent,
  Patch,
  Graffiti,
  MusicKit,
  BaseWeapon,
  Highlight,
  DetailedSkin,
  CrateContents,
  CollectionContents,
  RelatedItem,
  CrateDetail,
  CollectionDetail,
  RarityDistribution,
  KeyInfo,
  MarketInfo,
  PaginatedResponse
} from '../interfaces/csgo-api.interface';

@Injectable()
export class CsgoApiService {
  private readonly logger = new Logger(CsgoApiService.name);
  private readonly cache = new Map<string, { data: any; timestamp: number; hash: string }>();

  constructor(private readonly httpService: HttpService) {}

  /**
   * Get all items from CS:GO API
   */
  async getAllItems(language: SupportedLanguage = CSGO_API_CONSTANTS.DEFAULT_LANGUAGE): Promise<AllItems> {
    return this.fetchData<AllItems>('ALL', language);
  }

  /**
   * Get detailed information about a specific skin by ID
   */
  async getSkinDetails(
    skinId: string,
    language: SupportedLanguage = CSGO_API_CONSTANTS.DEFAULT_LANGUAGE
  ): Promise<DetailedSkin> {
    try {
      this.logger.log(`Getting detailed information for skin: ${skinId} in language: ${language}`);
      
      // Сначала пробуем найти в getAllItems
      let skin: Skin | undefined;
      try {
        const allItems = await this.getAllItems(language);
        const foundSkin = allItems[skinId];
        if (foundSkin && this.isSkin(foundSkin)) {
          skin = foundSkin as Skin;
        }
      } catch (error) {
        this.logger.log(`Skin not found in getAllItems, trying alternative sources...`);
      }
      
      // Если не нашли в getAllItems, ищем в скинах
      if (!skin) {
        try {
          const skins = await this.getSkins(language);
          skin = skins.find(s => s.id === skinId);
        } catch (error) {
          this.logger.log(`Skin not found in getSkins, trying search...`);
        }
      }
      
      // Если все еще не нашли, пробуем поиск
      if (!skin) {
        try {
          const searchResults = await this.searchSkinsByName(skinId, language, 100);
          skin = searchResults.find(s => s.id === skinId);
        } catch (error) {
          this.logger.log(`Skin not found in search, trying global search...`);
        }
      }
      
      // Последняя попытка - глобальный поиск
      if (!skin) {
        try {
          const globalResults = await this.globalSearch(skinId, ['skins'], language, 100);
          skin = globalResults.results.find(s => s.id === skinId);
        } catch (error) {
          this.logger.log(`Skin not found in global search`);
        }
      }
      
      if (!skin || !this.isSkin(skin)) {
        throw new HttpException(
          `Skin with ID ${skinId} not found in any available source`,
          HttpStatus.NOT_FOUND
        );
      }

      const detailedSkin = skin as Skin;
      
      // Получаем детальную информацию о коллекциях
      const collectionDetails = await this.getCollectionDetails(detailedSkin.collections, language);
      
      // Получаем детальную информацию о кейсах
      const crateDetails = await this.getCrateDetails(detailedSkin.crates, language);
      
      // Получаем рыночную информацию
      const marketInfo = await this.getMarketInfo(detailedSkin);
      
      // Получаем связанные предметы
      let relatedItems: RelatedItem[] = [];
      try {
        const allItems = await this.getAllItems(language);
        relatedItems = await this.getRelatedItems(detailedSkin, allItems, language);
      } catch (error) {
        this.logger.log(`Could not get related items, continuing without them`);
      }
      
      const result: DetailedSkin = {
        ...detailedSkin,
        collection_details: collectionDetails,
        crate_details: crateDetails,
        market_info: marketInfo,
        related_items: relatedItems
      };
      
      this.logger.log(`Successfully retrieved detailed information for skin: ${skinId}`);
      return result;
      
    } catch (error) {
      this.logger.error(`Error getting skin details for ${skinId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get detailed information about collections
   */
  private async getCollectionDetails(
    collections: Collection[],
    language: SupportedLanguage
  ): Promise<CollectionDetail[]> {
    try {
      const collectionDetails: CollectionDetail[] = [];
      
      for (const collection of collections) {
        // Получаем содержимое коллекции
        const contents = await this.getCollectionContents(collection.id, language);
        
        // Анализируем распределение редкости
        const rarityDistribution = this.analyzeRarityDistribution(contents);
        
        collectionDetails.push({
          collection,
          rarity_distribution: rarityDistribution,
          contains_skins: contents.skins,
          special_items: contents.special_items,
          drop_source: contents.drop_source
        });
      }
      
      return collectionDetails;
    } catch (error) {
      this.logger.error(`Error getting collection details: ${error.message}`);
      return [];
    }
  }

  /**
   * Get detailed information about crates
   */
  private async getCrateDetails(
    crates: Crate[],
    language: SupportedLanguage
  ): Promise<CrateDetail[]> {
    try {
      const crateDetails: CrateDetail[] = [];
      
      for (const crate of crates) {
        // Получаем содержимое кейса
        const contents = await this.getCrateContents(crate.id, language);
        
        // Определяем, нужен ли ключ
        const keyRequired = this.isKeyRequired(crate);
        const keyInfo = keyRequired ? await this.getKeyInfo(crate.id, language) : undefined;
        
        // Анализируем распределение редкости
        const rarityDistribution = this.analyzeRarityDistribution(contents);
        
        crateDetails.push({
          crate,
          rarity_distribution: rarityDistribution,
          contains_items: contents.skins,
          special_items: contents.special_items,
          key_required: keyRequired,
          key_info: keyInfo
        });
      }
      
      return crateDetails;
    } catch (error) {
      this.logger.error(`Error getting crate details: ${error.message}`);
      return [];
    }
  }

  /**
   * Get collection contents
   */
  private async getCollectionContents(
    collectionId: string,
    language: SupportedLanguage
  ): Promise<CollectionContents['contents'] & { special_items: any[]; drop_source: string }> {
    try {
      // В реальном API здесь был бы запрос к коллекции
      // Пока возвращаем заглушку
      return {
        skins: [],
        stickers: [],
        keychains: [],
        collectibles: [],
        agents: [],
        patches: [],
        graffiti: [],
        music_kits: [],
        special_items: [],
        drop_source: 'Collection drop'
      };
    } catch (error) {
      this.logger.error(`Error getting collection contents: ${error.message}`);
      return {
        skins: [],
        stickers: [],
        keychains: [],
        collectibles: [],
        agents: [],
        patches: [],
        graffiti: [],
        music_kits: [],
        special_items: [],
        drop_source: 'Unknown'
      };
    }
  }

  /**
   * Get crate contents
   */
  private async getCrateContents(
    crateId: string,
    language: SupportedLanguage
  ): Promise<CrateContents['contents'] & { special_items: any[] }> {
    try {
      // В реальном API здесь был бы запрос к кейсу
      // Пока возвращаем заглушку
      return {
        skins: [],
        stickers: [],
        keychains: [],
        collectibles: [],
        agents: [],
        patches: [],
        graffiti: [],
        music_kits: [],
        special_items: []
      };
    } catch (error) {
      this.logger.error(`Error getting crate contents: ${error.message}`);
      return {
        skins: [],
        stickers: [],
        keychains: [],
        collectibles: [],
        agents: [],
        patches: [],
        graffiti: [],
        music_kits: [],
        special_items: []
      };
    }
  }

  /**
   * Get key information for a crate
   */
  private async getKeyInfo(
    crateId: string,
    language: SupportedLanguage
  ): Promise<KeyInfo | undefined> {
    try {
      // В реальном API здесь был бы запрос к информации о ключе
      // Пока возвращаем заглушку
      return {
        id: `key-${crateId}`,
        name: 'Case Key',
        market_hash_name: 'Case Key',
        image: 'https://example.com/key.png'
      };
    } catch (error) {
      this.logger.error(`Error getting key info: ${error.message}`);
      return undefined;
    }
  }

  /**
   * Check if crate requires a key
   */
  private isKeyRequired(crate: Crate): boolean {
    // Логика определения необходимости ключа
    return !crate.name.toLowerCase().includes('gift') && 
           !crate.name.toLowerCase().includes('package') &&
           !crate.name.toLowerCase().includes('drop');
  }

  /**
   * Analyze rarity distribution in contents
   */
  private analyzeRarityDistribution(contents: any): RarityDistribution {
    const distribution: RarityDistribution = {
      common: 0,
      uncommon: 0,
      rare: 0,
      legendary: 0,
      ancient: 0,
      contraband: 0
    };

    // Анализируем все предметы и подсчитываем редкости
    const allItems = [
      ...contents.skins || [],
      ...contents.stickers || [],
      ...contents.keychains || [],
      ...contents.collectibles || [],
      ...contents.agents || [],
      ...contents.patches || [],
      ...contents.graffiti || [],
      ...contents.music_kits || []
    ];

    for (const item of allItems) {
      if ('rarity' in item && item.rarity) {
        const rarityName = item.rarity.name.toLowerCase();
        if (rarityName.includes('consumer') || rarityName.includes('common')) {
          distribution.common++;
        } else if (rarityName.includes('industrial') || rarityName.includes('uncommon')) {
          distribution.uncommon++;
        } else if (rarityName.includes('mil-spec') || rarityName.includes('rare')) {
          distribution.rare++;
        } else if (rarityName.includes('restricted') || rarityName.includes('legendary')) {
          distribution.legendary++;
        } else if (rarityName.includes('classified') || rarityName.includes('ancient')) {
          distribution.ancient++;
        } else if (rarityName.includes('covert') || rarityName.includes('contraband')) {
          distribution.contraband++;
        }
      }
    }

    return distribution;
  }

  /**
   * Get market information for an item
   */
  private async getMarketInfo(item: any): Promise<MarketInfo> {
    try {
      const marketInfo: MarketInfo = {
        market_hash_name: item.market_hash_name || item.name,
        trade_up_contract: this.canTradeUp(item),
        souvenir_contract: item.souvenir || false
      };

      // В реальном API здесь был бы запрос к Steam Market API
      // Пока возвращаем базовую информацию
      return marketInfo;
    } catch (error) {
      this.logger.error(`Error getting market info: ${error.message}`);
      return {
        market_hash_name: item.market_hash_name || item.name,
        trade_up_contract: false,
        souvenir_contract: false
      };
    }
  }

  /**
   * Check if item can be used in trade-up contract
   */
  private canTradeUp(item: any): boolean {
    if (!this.isSkin(item)) return false;
    
    const skin = item as Skin;
    return skin.rarity && 
           (skin.rarity.name.includes('Consumer') || 
            skin.rarity.name.includes('Industrial') ||
            skin.rarity.name.includes('Mil-Spec'));
  }

  /**
   * Get related items
   */
  private async getRelatedItems(
    skin: Skin,
    allItems: AllItems,
    language: SupportedLanguage
  ): Promise<RelatedItem[]> {
    try {
      const relatedItems: RelatedItem[] = [];
      
      for (const [id, item] of Object.entries(allItems)) {
        if (id === skin.id) continue;
        
        let relationship: RelatedItem['relationship'] | null = null;
        
        // Проверяем связь по коллекции
        if (this.isSkin(item) && this.hasSameCollection(skin, item as Skin)) {
          relationship = 'same_collection';
        }
        // Проверяем связь по кейсу
        else if (this.isSkin(item) && this.hasSameCrate(skin, item as Skin)) {
          relationship = 'same_crate';
        }
        // Проверяем связь по редкости
        else if (this.isSkin(item) && this.hasSameRarity(skin, item as Skin)) {
          relationship = 'same_rarity';
        }
        // Проверяем связь по оружию
        else if (this.isSkin(item) && this.hasSameWeapon(skin, item as Skin)) {
          relationship = 'same_weapon';
        }
        
        if (relationship && 'rarity' in item) {
          const relatedItem: RelatedItem = {
            type: 'skin',
            id: item.id || id,
            name: item.name,
            rarity: item.rarity,
            image: item.image,
            relationship
          };
          
          relatedItems.push(relatedItem);
          
          // Ограничиваем количество связанных предметов
          if (relatedItems.length >= 10) break;
        }
      }
      
      return relatedItems;
    } catch (error) {
      this.logger.error(`Error getting related items: ${error.message}`);
      return [];
    }
  }

  /**
   * Check if two skins belong to the same collection
   */
  private hasSameCollection(skin1: Skin, skin2: Skin): boolean {
    const collectionIds1 = skin1.collections.map(c => c.id);
    const collectionIds2 = skin2.collections.map(c => c.id);
    return collectionIds1.some(id => collectionIds2.includes(id));
  }

  /**
   * Check if two skins can drop from the same crate
   */
  private hasSameCrate(skin1: Skin, skin2: Skin): boolean {
    const crateIds1 = skin1.crates.map(c => c.id);
    const crateIds2 = skin2.crates.map(c => c.id);
    return crateIds1.some(id => crateIds2.includes(id));
  }

  /**
   * Check if two skins have the same rarity
   */
  private hasSameRarity(skin1: Skin, skin2: Skin): boolean {
    return skin1.rarity.id === skin2.rarity.id;
  }

  /**
   * Check if two skins are for the same weapon
   */
  private hasSameWeapon(skin1: Skin, skin2: Skin): boolean {
    return skin1.weapon.id === skin2.weapon.id;
  }

  /**
   * Get crate information by ID (without contents)
   */
  async getCrateById(
    crateId: string,
    language: SupportedLanguage = CSGO_API_CONSTANTS.DEFAULT_LANGUAGE
  ): Promise<Crate> {
    try {
      this.logger.log(`Getting crate information for: ${crateId} in language: ${language}`);
      
      // Получаем информацию о кейсе
      const crates = await this.getCrates(language);
      const crate = crates.find(c => c.id === crateId);
      
      if (!crate) {
        throw new HttpException(
          `Crate with ID ${crateId} not found`,
          HttpStatus.NOT_FOUND
        );
      }
      
      this.logger.log(`Successfully retrieved crate information for: ${crateId}`);
      return crate;
      
    } catch (error) {
      this.logger.error(`Error getting crate information for ${crateId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get detailed crate contents by ID
   */
  async getCrateContentsById(
    crateId: string,
    language: SupportedLanguage = CSGO_API_CONSTANTS.DEFAULT_LANGUAGE
  ): Promise<CrateContents> {
    try {
      this.logger.log(`Getting detailed contents for crate: ${crateId} in language: ${language}`);
      
      // Получаем информацию о кейсе
      const crates = await this.getCrates(language);
      const crate = crates.find(c => c.id === crateId);
      
      if (!crate) {
        throw new HttpException(
          `Crate with ID ${crateId} not found`,
          HttpStatus.NOT_FOUND
        );
      }
      
      // Получаем содержимое кейса
      const contents = await this.getCrateContents(crateId, language);
      
      // Анализируем распределение редкости
      const rarityDistribution = this.analyzeRarityDistribution(contents);
      
      // Определяем, нужен ли ключ
      const keyRequired = this.isKeyRequired(crate);
      const keyInfo = keyRequired ? await this.getKeyInfo(crateId, language) : undefined;
      
      const result: CrateContents = {
        crate,
        contents,
        rarity_distribution: rarityDistribution,
        special_items: contents.special_items,
        key_required: keyRequired,
        key_info: keyInfo
      };
      
      this.logger.log(`Successfully retrieved detailed contents for crate: ${crateId}`);
      return result;
      
    } catch (error) {
      this.logger.error(`Error getting crate contents for ${crateId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get detailed collection contents by ID
   */
  async getCollectionContentsById(
    collectionId: string,
    language: SupportedLanguage = CSGO_API_CONSTANTS.DEFAULT_LANGUAGE
  ): Promise<CollectionContents> {
    try {
      this.logger.log(`Getting detailed contents for collection: ${collectionId} in language: ${language}`);
      
      // Получаем информацию о коллекции
      const collections = await this.getCollections(language);
      const collection = collections.find(c => c.id === collectionId);
      
      if (!collection) {
        throw new HttpException(
          `Collection with ID ${collectionId} not found`,
          HttpStatus.NOT_FOUND
        );
      }
      
      // Получаем содержимое коллекции
      const contents = await this.getCollectionContents(collectionId, language);
      
      // Анализируем распределение редкости
      const rarityDistribution = this.analyzeRarityDistribution(contents);
      
      const result: CollectionContents = {
        collection,
        contents,
        rarity_distribution: rarityDistribution,
        special_items: contents.special_items,
        drop_source: contents.drop_source
      };
      
      this.logger.log(`Successfully retrieved detailed contents for collection: ${collectionId}`);
      return result;
      
    } catch (error) {
      this.logger.error(`Error getting collection contents for ${collectionId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Search skins by name in all items
   */
  async searchSkinsByName(
    searchQuery: string, 
    language: SupportedLanguage = CSGO_API_CONSTANTS.DEFAULT_LANGUAGE,
    limit: number = 50
  ): Promise<Skin[]> {
    try {
      this.logger.log(`Searching skins by name: "${searchQuery}" in language: ${language}`);
      
      // Get all items first
      const allItems = await this.getAllItems(language);
      
      // Filter skins by name (case-insensitive search)
      const searchLower = searchQuery.toLowerCase();
      const matchingSkins: Skin[] = [];
      
      for (const [id, item] of Object.entries(allItems)) {
        // Check if item is a skin (has weapon property)
        if (this.isSkin(item)) {
          const skin = item as Skin;
          if (skin.name.toLowerCase().includes(searchLower)) {
            matchingSkins.push(skin);
            
            // Limit results if specified
            if (limit > 0 && matchingSkins.length >= limit) {
              break;
            }
          }
        }
      }
      
      this.logger.log(`Found ${matchingSkins.length} matching skins for query: "${searchQuery}"`);
      return matchingSkins;
      
    } catch (error) {
      this.logger.error(`Error searching skins by name: ${error.message}`);
      throw new HttpException(
        `Failed to search skins: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Search skins by weapon type
   */
  async searchSkinsByWeapon(
    weaponName: string,
    language: SupportedLanguage = CSGO_API_CONSTANTS.DEFAULT_LANGUAGE,
    limit: number = 50
  ): Promise<Skin[]> {
    try {
      this.logger.log(`Searching skins by weapon: "${weaponName}" in language: ${language}`);
      
      const allItems = await this.getAllItems(language);
      const weaponLower = weaponName.toLowerCase();
      const matchingSkins: Skin[] = [];
      
      for (const [id, item] of Object.entries(allItems)) {
        if (this.isSkin(item)) {
          const skin = item as Skin;
          if (skin.weapon.name.toLowerCase().includes(weaponLower)) {
            matchingSkins.push(skin);
            
            if (limit > 0 && matchingSkins.length >= limit) {
              break;
            }
          }
        }
      }
      
      this.logger.log(`Found ${matchingSkins.length} skins for weapon: "${weaponName}"`);
      return matchingSkins;
      
    } catch (error) {
      this.logger.error(`Error searching skins by weapon: ${error.message}`);
      throw new HttpException(
        `Failed to search skins by weapon: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Search skins by rarity
   */
  async searchSkinsByRarity(
    rarityName: string,
    language: SupportedLanguage = CSGO_API_CONSTANTS.DEFAULT_LANGUAGE,
    limit: number = 50
  ): Promise<Skin[]> {
    try {
      this.logger.log(`Searching skins by rarity: "${rarityName}" in language: ${language}`);
      
      const allItems = await this.getAllItems(language);
      const rarityLower = rarityName.toLowerCase();
      const matchingSkins: Skin[] = [];
      
      for (const [id, item] of Object.entries(allItems)) {
        if (this.isSkin(item)) {
          const skin = item as Skin;
          if (skin.rarity.name.toLowerCase().includes(rarityLower)) {
            matchingSkins.push(skin);
            
            if (limit > 0 && matchingSkins.length >= limit) {
              break;
            }
          }
        }
      }
      
      this.logger.log(`Found ${matchingSkins.length} skins with rarity: "${rarityName}"`);
      return matchingSkins;
      
    } catch (error) {
      this.logger.error(`Error searching skins by rarity: ${error.message}`);
      throw new HttpException(
        `Failed to search skins by rarity: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Advanced search with multiple criteria
   */
  async advancedSkinSearch(
    criteria: {
      name?: string;
      weapon?: string;
      rarity?: string;
      category?: string;
      pattern?: string;
      stattrak?: boolean;
      souvenir?: boolean;
    },
    language: SupportedLanguage = CSGO_API_CONSTANTS.DEFAULT_LANGUAGE,
    limit: number = 50
  ): Promise<Skin[]> {
    try {
      this.logger.log(`Advanced skin search with criteria: ${JSON.stringify(criteria)} in language: ${language}`);
      
      const allItems = await this.getAllItems(language);
      const matchingSkins: Skin[] = [];
      
      for (const [id, item] of Object.entries(allItems)) {
        if (this.isSkin(item)) {
          const skin = item as Skin;
          let matches = true;
          
          // Check name
          if (criteria.name && !skin.name.toLowerCase().includes(criteria.name.toLowerCase())) {
            matches = false;
          }
          
          // Check weapon
          if (criteria.weapon && !skin.weapon.name.toLowerCase().includes(criteria.weapon.toLowerCase())) {
            matches = false;
          }
          
          // Check rarity
          if (criteria.rarity && !skin.rarity.name.toLowerCase().includes(criteria.rarity.toLowerCase())) {
            matches = false;
          }
          
          // Check category
          if (criteria.category && !skin.category.name.toLowerCase().includes(criteria.category.toLowerCase())) {
            matches = false;
          }
          
          // Check pattern
          if (criteria.pattern && !skin.pattern.name.toLowerCase().includes(criteria.pattern.toLowerCase())) {
            matches = false;
          }
          
          // Check StatTrak
          if (criteria.stattrak !== undefined && skin.stattrak !== criteria.stattrak) {
            matches = false;
          }
          
          // Check souvenir
          if (criteria.souvenir !== undefined && skin.souvenir !== criteria.souvenir) {
            matches = false;
          }
          
          if (matches) {
            matchingSkins.push(skin);
            
            if (limit > 0 && matchingSkins.length >= limit) {
              break;
            }
          }
        }
      }
      
      this.logger.log(`Advanced search found ${matchingSkins.length} matching skins`);
      return matchingSkins;
      
    } catch (error) {
      this.logger.error(`Error in advanced skin search: ${error.message}`);
      throw new HttpException(
        `Failed to perform advanced search: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Type guard to check if item is a skin
   */
  private isSkin(item: any): item is Skin {
    return item && 
           typeof item === 'object' && 
           'weapon' in item && 
           'category' in item && 
           'pattern' in item &&
           'rarity' in item;
  }

  /**
   * Get all skins from CS:GO API
   */
  async getSkins(language: SupportedLanguage = CSGO_API_CONSTANTS.DEFAULT_LANGUAGE): Promise<Skin[]> {
    return this.fetchData<Skin[]>('SKINS', language);
  }

  /**
   * Get skins with pagination from CS:GO API
   */
  async getSkinsPaginated(
    page: number = 1,
    pageSize: number = 20,
    language: SupportedLanguage = CSGO_API_CONSTANTS.DEFAULT_LANGUAGE
  ): Promise<PaginatedResponse<Skin>> {
    try {
      this.logger.log(`Getting skins with pagination: page ${page}, pageSize ${pageSize}, language: ${language}`);
      
      const allSkins = await this.getSkins(language);
      const total = allSkins.length;
      const totalPages = Math.ceil(total / pageSize);
      
      // Валидация параметров
      if (page < 1) page = 1;
      if (page > totalPages) page = totalPages;
      if (pageSize < 1) pageSize = 20;
      
      // Вычисляем индексы для среза
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      
      // Получаем скин для текущей страницы
      const skins = allSkins.slice(startIndex, endIndex);
      
      const result: PaginatedResponse<Skin> = {
        data: skins,
        pagination: {
          page,
          pageSize,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrevious: page > 1
        }
      };
      
      this.logger.log(`Successfully retrieved skins page ${page}/${totalPages} (${skins.length} items)`);
      return result;
      
    } catch (error) {
      this.logger.error(`Error getting skins with pagination: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all skins not grouped from CS:GO API
   */
  async getSkinsNotGrouped(language: SupportedLanguage = CSGO_API_CONSTANTS.DEFAULT_LANGUAGE): Promise<SkinNotGrouped[]> {
    return this.fetchData<SkinNotGrouped[]>('SKINS_NOT_GROUPED', language);
  }

  /**
   * Get all stickers from CS:GO API
   */
  async getStickers(language: SupportedLanguage = CSGO_API_CONSTANTS.DEFAULT_LANGUAGE): Promise<Sticker[]> {
    return this.fetchData<Sticker[]>('STICKERS', language);
  }

  /**
   * Get all keychains from CS:GO API
   */
  async getKeychains(language: SupportedLanguage = CSGO_API_CONSTANTS.DEFAULT_LANGUAGE): Promise<Keychain[]> {
    return this.fetchData<Keychain[]>('KEYCHAINS', language);
  }

  /**
   * Get all collections from CS:GO API
   */
  async getCollections(language: SupportedLanguage = CSGO_API_CONSTANTS.DEFAULT_LANGUAGE): Promise<Collection[]> {
    return this.fetchData<Collection[]>('COLLECTIONS', language);
  }

  /**
   * Get all crates from CS:GO API
   */
  async getCrates(language: SupportedLanguage = CSGO_API_CONSTANTS.DEFAULT_LANGUAGE): Promise<Crate[]> {
    return this.fetchData<Crate[]>('CRATES', language);
  }

  /**
   * Get all keys from CS:GO API
   */
  async getKeys(language: SupportedLanguage = CSGO_API_CONSTANTS.DEFAULT_LANGUAGE): Promise<any[]> {
    return this.fetchData<any[]>('KEYS', language);
  }

  /**
   * Get all collectibles from CS:GO API
   */
  async getCollectibles(language: SupportedLanguage = CSGO_API_CONSTANTS.DEFAULT_LANGUAGE): Promise<Collectible[]> {
    return this.fetchData<Collectible[]>('COLLECTIBLES', language);
  }

  /**
   * Get all agents from CS:GO API
   */
  async getAgents(language: SupportedLanguage = CSGO_API_CONSTANTS.DEFAULT_LANGUAGE): Promise<Agent[]> {
    return this.fetchData<Agent[]>('AGENTS', language);
  }

  /**
   * Get all patches from CS:GO API
   */
  async getPatches(language: SupportedLanguage = CSGO_API_CONSTANTS.DEFAULT_LANGUAGE): Promise<Patch[]> {
    return this.fetchData<Patch[]>('PATCHES', language);
  }

  /**
   * Get all graffiti from CS:GO API
   */
  async getGraffiti(language: SupportedLanguage = CSGO_API_CONSTANTS.DEFAULT_LANGUAGE): Promise<Graffiti[]> {
    return this.fetchData<Graffiti[]>('GRAFFITI', language);
  }

  /**
   * Get all music kits from CS:GO API
   */
  async getMusicKits(language: SupportedLanguage = CSGO_API_CONSTANTS.DEFAULT_LANGUAGE): Promise<MusicKit[]> {
    return this.fetchData<MusicKit[]>('MUSIC_KITS', language);
  }

  /**
   * Get all base weapons from CS:GO API
   */
  async getBaseWeapons(language: SupportedLanguage = CSGO_API_CONSTANTS.DEFAULT_LANGUAGE): Promise<BaseWeapon[]> {
    return this.fetchData<BaseWeapon[]>('BASE_WEAPONS', language);
  }

  /**
   * Get all highlights from CS:GO API
   */
  async getHighlights(language: SupportedLanguage = CSGO_API_CONSTANTS.DEFAULT_LANGUAGE): Promise<Highlight[]> {
    return this.fetchData<Highlight[]>('HIGHLIGHTS', language);
  }

  /**
   * Generate hash for data
   */
  private generateHash(data: any): string {
    const dataString = JSON.stringify(data);
    return createHash('sha256').update(dataString).digest('hex');
  }

  /**
   * Get data from specific endpoint with caching and hashing
   */
  private async fetchData<T>(
    endpoint: ApiEndpoint, 
    language: SupportedLanguage = CSGO_API_CONSTANTS.DEFAULT_LANGUAGE
  ): Promise<T> {
    const cacheKey = `${endpoint}_${language}`;
    const now = Date.now();

    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (now - cached.timestamp < CSGO_API_CONSTANTS.CACHE_TTL) {
        this.logger.log(`Returning cached data for ${endpoint} in ${language} (hash: ${cached.hash.substring(0, 8)}...)`);
        return cached.data;
      }
    }

    try {
      const url = `${CSGO_API_CONSTANTS.BASE_URL}/${language}${CSGO_API_CONSTANTS.ENDPOINTS[endpoint]}`;
      this.logger.log(`Fetching data from: ${url}`);

      const response = await firstValueFrom(
        this.httpService.get<T>(url).pipe(
          timeout(CSGO_API_CONSTANTS.TIMEOUT),
          retry(CSGO_API_CONSTANTS.MAX_RETRIES),
          catchError((error) => {
            this.logger.error(`Error fetching data from ${url}: ${error.message}`);
            throw new HttpException(
              `Failed to fetch data from CS:GO API: ${error.message}`,
              HttpStatus.INTERNAL_SERVER_ERROR
            );
          })
        )
      );

      // Generate hash for the response data
      const dataHash = this.generateHash(response.data);
      
      // Cache the response with hash
      this.cache.set(cacheKey, { 
        data: response.data, 
        timestamp: now, 
        hash: dataHash 
      });
      
      this.logger.log(`Successfully fetched data for ${endpoint} in ${language} (hash: ${dataHash.substring(0, 8)}...)`);
      return response.data;

    } catch (error) {
      this.logger.error(`Failed to fetch data for ${endpoint} in ${language}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages(): SupportedLanguage[] {
    return [...CSGO_API_CONSTANTS.LANGUAGES];
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    this.logger.log('Cache cleared');
  }

  /**
   * Get cache statistics with hash information
   */
  getCacheStats(): { size: number; keys: string[]; hashes: string[]; details: Array<{ key: string; hash: string; age: number }> } {
    const now = Date.now();
    const details = Array.from(this.cache.entries()).map(([key, value]) => ({
      key,
      hash: value.hash.substring(0, 8) + '...',
      age: Math.floor((now - value.timestamp) / 1000) // age in seconds
    }));

    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      hashes: Array.from(this.cache.values()).map(v => v.hash.substring(0, 8) + '...'),
      details
    };
  }

  /**
   * Get cache entry by key
   */
  getCacheEntry(key: string): { data: any; hash: string; age: number } | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    return {
      data: entry.data,
      hash: entry.hash,
      age: Math.floor((now - entry.timestamp) / 1000)
    };
  }

  /**
   * Validate cache integrity by checking hashes
   */
  validateCacheIntegrity(): { valid: boolean; invalidEntries: string[] } {
    const invalidEntries: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      const currentHash = this.generateHash(entry.data);
      if (currentHash !== entry.hash) {
        invalidEntries.push(key);
        this.logger.warn(`Cache integrity check failed for ${key}`);
      }
    }

    return {
      valid: invalidEntries.length === 0,
      invalidEntries
    };
  }

  /**
   * Search skins by collection
   */
  async searchSkinsByCollection(
    collectionName: string,
    language: SupportedLanguage = CSGO_API_CONSTANTS.DEFAULT_LANGUAGE,
    limit: number = 50
  ): Promise<Skin[]> {
    try {
      this.logger.log(`Searching skins by collection: "${collectionName}" in language: ${language}`);
      
      const allItems = await this.getAllItems(language);
      const collectionLower = collectionName.toLowerCase();
      const matchingSkins: Skin[] = [];
      
      for (const [id, item] of Object.entries(allItems)) {
        if (this.isSkin(item)) {
          const skin = item as Skin;
          if (skin.collections.some(collection => 
            collection.name.toLowerCase().includes(collectionLower)
          )) {
            matchingSkins.push(skin);
            
            if (limit > 0 && matchingSkins.length >= limit) {
              break;
            }
          }
        }
      }
      
      this.logger.log(`Found ${matchingSkins.length} skins in collection: "${collectionName}"`);
      return matchingSkins;
      
    } catch (error) {
      this.logger.error(`Error searching skins by collection: ${error.message}`);
      throw new HttpException(
        `Failed to search skins by collection: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Search skins by crate
   */
  async searchSkinsByCrate(
    crateName: string,
    language: SupportedLanguage = CSGO_API_CONSTANTS.DEFAULT_LANGUAGE,
    limit: number = 50
  ): Promise<Skin[]> {
    try {
      this.logger.log(`Searching skins by crate: "${crateName}" in language: ${language}`);
      
      const allItems = await this.getAllItems(language);
      const crateLower = crateName.toLowerCase();
      const matchingSkins: Skin[] = [];
      
      for (const [id, item] of Object.entries(allItems)) {
        if (this.isSkin(item)) {
          const skin = item as Skin;
          if (skin.crates.some(crate => 
            crate.name.toLowerCase().includes(crateLower)
          )) {
            matchingSkins.push(skin);
            
            if (limit > 0 && matchingSkins.length >= limit) {
              break;
            }
          }
        }
      }
      
      this.logger.log(`Found ${matchingSkins.length} skins in crate: "${crateName}"`);
      return matchingSkins;
      
    } catch (error) {
      this.logger.error(`Error searching skins by crate: ${error.message}`);
      throw new HttpException(
        `Failed to search skins by crate: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Search items by price range (estimated)
   */
  async searchItemsByPrice(
    minPrice: number,
    maxPrice: number,
    itemType: 'skins' | 'stickers' | 'all' = 'all',
    language: SupportedLanguage = CSGO_API_CONSTANTS.DEFAULT_LANGUAGE,
    limit: number = 50
  ): Promise<any[]> {
    try {
      this.logger.log(`Searching items by price range: $${minPrice}-$${maxPrice}, type: ${itemType} in language: ${language}`);
      
      const allItems = await this.getAllItems(language);
      const matchingItems: any[] = [];
      
      for (const [id, item] of Object.entries(allItems)) {
        let shouldInclude = false;
        
        // Check item type
        if (itemType === 'all') {
          shouldInclude = true;
        } else if (itemType === 'skins' && this.isSkin(item)) {
          shouldInclude = true;
        } else if (itemType === 'stickers' && this.isSticker(item)) {
          shouldInclude = true;
        }
        
        if (shouldInclude) {
          // Estimate price based on rarity (this is a simplified approach)
          const estimatedPrice = this.estimateItemPrice(item);
          
          if (estimatedPrice >= minPrice && estimatedPrice <= maxPrice) {
            matchingItems.push(item);
            
            if (limit > 0 && matchingItems.length >= limit) {
              break;
            }
          }
        }
      }
      
      this.logger.log(`Found ${matchingItems.length} items in price range: $${minPrice}-$${maxPrice}`);
      return matchingItems;
      
    } catch (error) {
      this.logger.error(`Error searching items by price: ${error.message}`);
      throw new HttpException(
        `Failed to search items by price: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Search items by team
   */
  async searchItemsByTeam(
    teamName: string,
    itemType: 'skins' | 'stickers' | 'agents' | 'all' = 'all',
    language: SupportedLanguage = CSGO_API_CONSTANTS.DEFAULT_LANGUAGE,
    limit: number = 50
  ): Promise<any[]> {
    try {
      this.logger.log(`Searching items by team: "${teamName}", type: ${itemType} in language: ${language}`);
      
      const allItems = await this.getAllItems(language);
      const teamLower = teamName.toLowerCase();
      const matchingItems: any[] = [];
      
      for (const [id, item] of Object.entries(allItems)) {
        let shouldInclude = false;
        let hasTeam = false;
        
        // Check item type
        if (itemType === 'all') {
          shouldInclude = true;
        } else if (itemType === 'skins' && this.isSkin(item)) {
          shouldInclude = true;
        } else if (itemType === 'stickers' && this.isSticker(item)) {
          shouldInclude = true;
        } else if (itemType === 'agents' && this.isAgent(item)) {
          shouldInclude = true;
        }
        
        if (shouldInclude) {
          // Check if item has team information
          if (this.isSkin(item) && item.team && item.team.name.toLowerCase().includes(teamLower)) {
            hasTeam = true;
          } else if (this.isSticker(item) && item.tournament_team && item.tournament_team.toLowerCase().includes(teamLower)) {
            hasTeam = true;
          } else if (this.isAgent(item) && item.team && item.team.name.toLowerCase().includes(teamLower)) {
            hasTeam = true;
          }
          
          if (hasTeam) {
            matchingItems.push(item);
            
            if (limit > 0 && matchingItems.length >= limit) {
              break;
            }
          }
        }
      }
      
      this.logger.log(`Found ${matchingItems.length} items for team: "${teamName}"`);
      return matchingItems;
      
    } catch (error) {
      this.logger.error(`Error searching items by team: ${error.message}`);
      throw new HttpException(
        `Failed to search items by team: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Search items by tournament
   */
  async searchItemsByTournament(
    tournamentName: string,
    itemType: 'stickers' | 'highlights' | 'all' = 'all',
    language: SupportedLanguage = CSGO_API_CONSTANTS.DEFAULT_LANGUAGE,
    limit: number = 50
  ): Promise<any[]> {
    try {
      this.logger.log(`Searching items by tournament: "${tournamentName}", type: ${itemType} in language: ${language}`);
      
      const allItems = await this.getAllItems(language);
      const tournamentLower = tournamentName.toLowerCase();
      const matchingItems: any[] = [];
      
      for (const [id, item] of Object.entries(allItems)) {
        let shouldInclude = false;
        let hasTournament = false;
        
        // Check item type
        if (itemType === 'all') {
          shouldInclude = true;
        } else if (itemType === 'stickers' && this.isSticker(item)) {
          shouldInclude = true;
        } else if (itemType === 'highlights' && this.isHighlight(item)) {
          shouldInclude = true;
        }
        
        if (shouldInclude) {
          // Check if item has tournament information
          if (this.isSticker(item) && item.tournament_event && item.tournament_event.toLowerCase().includes(tournamentLower)) {
            hasTournament = true;
          } else if (this.isHighlight(item) && item.tournament_event && item.tournament_event.toLowerCase().includes(tournamentLower)) {
            hasTournament = true;
          }
          
          if (hasTournament) {
            matchingItems.push(item);
            
            if (limit > 0 && matchingItems.length >= limit) {
              break;
            }
          }
        }
      }
      
      this.logger.log(`Found ${matchingItems.length} items for tournament: "${tournamentName}"`);
      return matchingItems;
      
    } catch (error) {
      this.logger.error(`Error searching items by tournament: ${error.message}`);
      throw new HttpException(
        `Failed to search items by tournament: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Search items by year (for tournament items and releases)
   */
  async searchItemsByYear(
    year: number,
    itemType: 'stickers' | 'highlights' | 'all' = 'all',
    language: SupportedLanguage = CSGO_API_CONSTANTS.DEFAULT_LANGUAGE,
    limit: number = 50
  ): Promise<any[]> {
    try {
      this.logger.log(`Searching items by year: ${year}, type: ${itemType} in language: ${language}`);
      
      const allItems = await this.getAllItems(language);
      const yearStr = year.toString();
      const matchingItems: any[] = [];
      
      for (const [id, item] of Object.entries(allItems)) {
        let shouldInclude = false;
        let hasYear = false;
        
        // Check item type
        if (itemType === 'all') {
          shouldInclude = true;
        } else if (itemType === 'stickers' && this.isSticker(item)) {
          shouldInclude = true;
        } else if (itemType === 'highlights' && this.isHighlight(item)) {
          shouldInclude = true;
        }
        
        if (shouldInclude) {
          // Check if item has year information
          if (this.isSticker(item) && item.tournament_event && item.tournament_event.includes(yearStr)) {
            hasYear = true;
          } else if (this.isHighlight(item) && item.tournament_event && item.tournament_event.includes(yearStr)) {
            hasYear = true;
          }
          
          if (hasYear) {
            matchingItems.push(item);
            
            if (limit > 0 && matchingItems.length >= limit) {
              break;
            }
          }
        }
      }
      
      this.logger.log(`Found ${matchingItems.length} items for year: ${year}`);
      return matchingItems;
      
    } catch (error) {
      this.logger.error(`Error searching items by year: ${error.message}`);
      throw new HttpException(
        `Failed to search items by year: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Search items by pattern/design
   */
  async searchItemsByPattern(
    patternName: string,
    itemType: 'skins' | 'stickers' | 'all' = 'all',
    language: SupportedLanguage = CSGO_API_CONSTANTS.DEFAULT_LANGUAGE,
    limit: number = 50
  ): Promise<any[]> {
    try {
      this.logger.log(`Searching items by pattern: "${patternName}", type: ${itemType} in language: ${language}`);
      
      const allItems = await this.getAllItems(language);
      const patternLower = patternName.toLowerCase();
      const matchingItems: any[] = [];
      
      for (const [id, item] of Object.entries(allItems)) {
        let shouldInclude = false;
        let hasPattern = false;
        
        // Check item type
        if (itemType === 'all') {
          shouldInclude = true;
        } else if (itemType === 'skins' && this.isSkin(item)) {
          shouldInclude = true;
        } else if (itemType === 'stickers' && this.isSticker(item)) {
          shouldInclude = true;
        }
        
        if (shouldInclude) {
          // Check if item has pattern information
          if (this.isSkin(item) && item.pattern && item.pattern.name.toLowerCase().includes(patternLower)) {
            hasPattern = true;
          } else if (this.isSticker(item) && item.name.toLowerCase().includes(patternLower)) {
            hasPattern = true;
          }
          
          if (hasPattern) {
            matchingItems.push(item);
            
            if (limit > 0 && matchingItems.length >= limit) {
              break;
            }
          }
        }
      }
      
      this.logger.log(`Found ${matchingItems.length} items with pattern: "${patternName}"`);
      return matchingItems;
      
    } catch (error) {
      this.logger.error(`Error searching items by pattern: ${error.message}`);
      throw new HttpException(
        `Failed to search items by pattern: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Search items by wear condition (for skins)
   */
  async searchSkinsByWear(
    wearCondition: string,
    language: SupportedLanguage = CSGO_API_CONSTANTS.DEFAULT_LANGUAGE,
    limit: number = 50
  ): Promise<Skin[]> {
    try {
      this.logger.log(`Searching skins by wear: "${wearCondition}" in language: ${language}`);
      
      const allItems = await this.getAllItems(language);
      const wearLower = wearCondition.toLowerCase();
      const matchingSkins: Skin[] = [];
      
      for (const [id, item] of Object.entries(allItems)) {
        if (this.isSkin(item)) {
          const skin = item as Skin;
          if (skin.wears.some(wear => 
            wear.name.toLowerCase().includes(wearLower)
          )) {
            matchingSkins.push(skin);
            
            if (limit > 0 && matchingSkins.length >= limit) {
              break;
            }
          }
        }
      }
      
      this.logger.log(`Found ${matchingSkins.length} skins with wear: "${wearCondition}"`);
      return matchingSkins;
      
    } catch (error) {
      this.logger.error(`Error searching skins by wear: ${error.message}`);
      throw new HttpException(
        `Failed to search skins by wear: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Search items by category
   */
  async searchItemsByCategory(
    categoryName: string,
    itemType: 'skins' | 'stickers' | 'all' = 'all',
    language: SupportedLanguage = CSGO_API_CONSTANTS.DEFAULT_LANGUAGE,
    limit: number = 50
  ): Promise<any[]> {
    try {
      this.logger.log(`Searching items by category: "${categoryName}", type: ${itemType} in language: ${language}`);
      
      const allItems = await this.getAllItems(language);
      const categoryLower = categoryName.toLowerCase();
      const matchingItems: any[] = [];
      
      for (const [id, item] of Object.entries(allItems)) {
        let shouldInclude = false;
        let hasCategory = false;
        
        // Check item type
        if (itemType === 'all') {
          shouldInclude = true;
        } else if (itemType === 'skins' && this.isSkin(item)) {
          shouldInclude = true;
        } else if (itemType === 'stickers' && this.isSticker(item)) {
          shouldInclude = true;
        }
        
        if (shouldInclude) {
          // Check if item has category information
          if (this.isSkin(item) && item.category && item.category.name.toLowerCase().includes(categoryLower)) {
            hasCategory = true;
          } else if (this.isSticker(item) && item.type && item.type.toLowerCase().includes(categoryLower)) {
            hasCategory = true;
          }
          
          if (hasCategory) {
            matchingItems.push(item);
            
            if (limit > 0 && matchingItems.length >= limit) {
              break;
            }
          }
        }
      }
      
      this.logger.log(`Found ${matchingItems.length} items in category: "${categoryName}"`);
      return matchingItems;
      
    } catch (error) {
      this.logger.error(`Error searching items by category: ${error.message}`);
      throw new HttpException(
        `Failed to search items by category: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Global search across all item types
   */
  async globalSearch(
    searchQuery: string,
    itemTypes: ('skins' | 'stickers' | 'keychains' | 'collectibles' | 'agents' | 'patches' | 'graffiti' | 'music_kits' | 'highlights')[] = ['skins'],
    language: SupportedLanguage = CSGO_API_CONSTANTS.DEFAULT_LANGUAGE,
    limit: number = 100
  ): Promise<{ [key: string]: any[] }> {
    try {
      this.logger.log(`Global search for: "${searchQuery}" across types: ${itemTypes.join(', ')} in language: ${language}`);
      
      const allItems = await this.getAllItems(language);
      const searchLower = searchQuery.toLowerCase();
      const results: { [key: string]: any[] } = {};
      
      // Initialize results for each item type
      itemTypes.forEach(type => {
        results[type] = [];
      });
      
      for (const [id, item] of Object.entries(allItems)) {
        let itemType: string | null = null;
        
        // Determine item type
        if (this.isSkin(item)) itemType = 'skins';
        else if (this.isSticker(item)) itemType = 'stickers';
        else if (this.isKeychain(item)) itemType = 'keychains';
        else if (this.isCollectible(item)) itemType = 'collectibles';
        else if (this.isAgent(item)) itemType = 'agents';
        else if (this.isPatch(item)) itemType = 'patches';
        else if (this.isGraffiti(item)) itemType = 'graffiti';
        else if (this.isMusicKit(item)) itemType = 'music_kits';
        else if (this.isHighlight(item)) itemType = 'highlights';
        
        // Check if this item type is in our search scope
        if (itemType && itemTypes.includes(itemType as any)) {
          // Check if item matches search query
          let matches = false;
          
          if (item.name.toLowerCase().includes(searchLower)) {
            matches = true;
          } else if (item.description && item.description.toLowerCase().includes(searchLower)) {
            matches = true;
          } else if (this.isSkin(item) && item.weapon.name.toLowerCase().includes(searchLower)) {
            matches = true;
          } else if (this.isSkin(item) && item.pattern.name.toLowerCase().includes(searchLower)) {
            matches = true;
          }
          
          if (matches) {
            results[itemType].push(item);
            
            // Check total limit across all types
            const totalItems = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);
            if (totalItems >= limit) break;
          }
        }
      }
      
      this.logger.log(`Global search completed. Found items across types:`, 
        Object.entries(results).map(([type, items]) => `${type}: ${items.length}`).join(', ')
      );
      
      return results;
      
    } catch (error) {
      this.logger.error(`Error in global search: ${error.message}`);
      throw new HttpException(
        `Failed to perform global search: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Comprehensive search across all fields and item types
   */
  async comprehensiveSearch(
    searchQuery: string,
    language: SupportedLanguage = CSGO_API_CONSTANTS.DEFAULT_LANGUAGE,
    limit: number = 100,
    includeFields: string[] = ['name', 'description', 'weapon', 'pattern', 'team', 'tournament', 'category']
  ): Promise<{
    query: string;
    language: string;
    total: number;
    results_by_type: { [key: string]: any[] };
    results: any[];
    search_stats: {
      total_items_searched: number;
      items_with_matches: number;
      match_percentage: number;
      fields_searched: string[];
    };
  }> {
    try {
      this.logger.log(`Comprehensive search for: "${searchQuery}" in language: ${language}, limit: ${limit}`);
      
      const allItems = await this.getAllItems(language);
      const searchLower = searchQuery.toLowerCase();
      const resultsByType: { [key: string]: any[] } = {};
      const allResults: any[] = [];
      let totalItemsSearched = 0;
      let itemsWithMatches = 0;
      
      // Initialize results for each item type
      const itemTypes = ['skins', 'stickers', 'keychains', 'collectibles', 'agents', 'patches', 'graffiti', 'music_kits', 'highlights', 'crates', 'collections'];
      itemTypes.forEach(type => {
        resultsByType[type] = [];
      });
      
      for (const [id, item] of Object.entries(allItems)) {
        totalItemsSearched++;
        let itemType: string | null = null;
        let hasMatch = false;
        
        // Determine item type
        if (this.isSkin(item)) itemType = 'skins';
        else if (this.isSticker(item)) itemType = 'stickers';
        else if (this.isKeychain(item)) itemType = 'keychains';
        else if (this.isCollectible(item)) itemType = 'collectibles';
        else if (this.isAgent(item)) itemType = 'agents';
        else if (this.isPatch(item)) itemType = 'patches';
        else if (this.isGraffiti(item)) itemType = 'graffiti';
        else if (this.isMusicKit(item)) itemType = 'music_kits';
        else if (this.isHighlight(item)) itemType = 'highlights';
        else if (this.isCrate(item)) itemType = 'crates';
        else if (this.isCollection(item)) itemType = 'collections';
        
        if (itemType) {
          // Search in all specified fields
          for (const field of includeFields) {
            if (this.searchInField(item, field, searchLower)) {
              hasMatch = true;
              break;
            }
          }
          
          if (hasMatch) {
            itemsWithMatches++;
            
            // Add to type-specific results
            if (resultsByType[itemType]) {
              resultsByType[itemType].push({
                ...item,
                match_field: this.getMatchField(item, searchLower, includeFields),
                match_score: this.calculateMatchScore(item, searchLower, includeFields)
              });
            }
            
            // Add to general results
            allResults.push({
              ...item,
              item_type: itemType,
              match_field: this.getMatchField(item, searchLower, includeFields),
              match_score: this.calculateMatchScore(item, searchLower, includeFields)
            });
            
            // Check total limit
            if (allResults.length >= limit) break;
          }
        }
        
        if (allResults.length >= limit) break;
      }
      
      // Sort results by match score (highest first)
      Object.keys(resultsByType).forEach(type => {
        resultsByType[type].sort((a, b) => b.match_score - a.match_score);
      });
      allResults.sort((a, b) => b.match_score - a.match_score);
      
      const matchPercentage = totalItemsSearched > 0 ? (itemsWithMatches / totalItemsSearched) * 100 : 0;
      
      this.logger.log(`Comprehensive search completed. Found ${allResults.length} items across ${Object.keys(resultsByType).filter(k => resultsByType[k].length > 0).length} types`);
      
      return {
        query: searchQuery,
        language,
        total: allResults.length,
        results_by_type: resultsByType,
        results: allResults,
        search_stats: {
          total_items_searched: totalItemsSearched,
          items_with_matches: itemsWithMatches,
          match_percentage: Math.round(matchPercentage * 100) / 100,
          fields_searched: includeFields
        }
      };
      
    } catch (error) {
      this.logger.error(`Error in comprehensive search: ${error.message}`);
      throw new HttpException(
        `Failed to perform comprehensive search: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Search in a specific field of an item
   */
  private searchInField(item: any, field: string, searchQuery: string): boolean {
    try {
      switch (field) {
        case 'name':
          return item.name && item.name.toLowerCase().includes(searchQuery);
        
        case 'description':
          return item.description && item.description.toLowerCase().includes(searchQuery);
        
        case 'weapon':
          return this.isSkin(item) && item.weapon && item.weapon.name && 
                 item.weapon.name.toLowerCase().includes(searchQuery);
        
        case 'pattern':
          return this.isSkin(item) && item.pattern && item.pattern.name && 
                 item.pattern.name.toLowerCase().includes(searchQuery);
        
        case 'team':
          if (this.isSkin(item) && item.team && item.team.name) {
            return item.team.name.toLowerCase().includes(searchQuery);
          }
          if (this.isSticker(item) && item.tournament_team) {
            return item.tournament_team.toLowerCase().includes(searchQuery);
          }
          if (this.isAgent(item) && item.team && item.team.name) {
            return item.team.name.toLowerCase().includes(searchQuery);
          }
          return false;
        
        case 'tournament':
          if (this.isSticker(item) && item.tournament_event) {
            return item.tournament_event.toLowerCase().includes(searchQuery);
          }
          if (this.isHighlight(item) && item.tournament_event) {
            return item.tournament_event.toLowerCase().includes(searchQuery);
          }
          return false;
        
        case 'category':
          if (this.isSkin(item) && item.category && item.category.name) {
            return item.category.name.toLowerCase().includes(searchQuery);
          }
          if (this.isSticker(item) && item.type) {
            return item.type.toLowerCase().includes(searchQuery);
          }
          return false;
        
        case 'rarity':
          return item.rarity && item.rarity.name && 
                 item.rarity.name.toLowerCase().includes(searchQuery);
        
        case 'collections':
          if (this.isSkin(item) && item.collections) {
            return item.collections.some((col: any) => 
              col.name && col.name.toLowerCase().includes(searchQuery)
            );
          }
          return false;
        
        case 'crates':
          if (this.isSkin(item) && item.crates) {
            return item.crates.some((crate: any) => 
              crate.name && crate.name.toLowerCase().includes(searchQuery)
            );
          }
          return false;
        
        case 'market_hash_name':
          return item.market_hash_name && 
                 item.market_hash_name.toLowerCase().includes(searchQuery);
        
        default:
          return false;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Get the field where the match was found
   */
  private getMatchField(item: any, searchQuery: string, fields: string[]): string[] {
    const matchedFields: string[] = [];
    
    for (const field of fields) {
      if (this.searchInField(item, field, searchQuery)) {
        matchedFields.push(field);
      }
    }
    
    return matchedFields;
  }

  /**
   * Calculate match score based on relevance
   */
  private calculateMatchScore(item: any, searchQuery: string, fields: string[]): number {
    let score = 0;
    
    for (const field of fields) {
      if (this.searchInField(item, field, searchQuery)) {
        // Different fields have different weights
        switch (field) {
          case 'name':
            score += 100; // Highest weight for name matches
            break;
          case 'weapon':
          case 'pattern':
            score += 80; // High weight for weapon/pattern
            break;
          case 'team':
          case 'tournament':
            score += 60; // Medium weight for team/tournament
            break;
          case 'description':
            score += 40; // Lower weight for description
            break;
          case 'category':
          case 'rarity':
            score += 30; // Lower weight for category/rarity
            break;
          default:
            score += 20; // Default weight for other fields
        }
        
        // Bonus for exact matches
        if (field === 'name' && item.name.toLowerCase() === searchQuery) {
          score += 50;
        }
        
        // Bonus for partial matches at start
        if (field === 'name' && item.name.toLowerCase().startsWith(searchQuery)) {
          score += 25;
        }
      }
    }
    
    return score;
  }

  /**
   * Type guards for additional item types
   */
  private isCrate(item: any): boolean {
    return item && typeof item === 'object' && 'crate_id' in item && 'key' in item;
  }

  private isCollection(item: any): boolean {
    return item && typeof item === 'object' && 'collection_id' in item && 'name' in item;
  }

  /**
   * Estimate item price based on rarity (simplified)
   */
  private estimateItemPrice(item: any): number {
    if (!item.rarity) return 0;
    
    const rarityName = item.rarity.name.toLowerCase();
    
    if (rarityName.includes('consumer') || rarityName.includes('common')) {
      return 0.05;
    } else if (rarityName.includes('industrial') || rarityName.includes('uncommon')) {
      return 0.15;
    } else if (rarityName.includes('mil-spec') || rarityName.includes('rare')) {
      return 0.50;
    } else if (rarityName.includes('restricted') || rarityName.includes('legendary')) {
      return 2.00;
    } else if (rarityName.includes('classified') || rarityName.includes('ancient')) {
      return 8.00;
    } else if (rarityName.includes('covert') || rarityName.includes('contraband')) {
      return 25.00;
    } else if (rarityName.includes('extraordinary')) {
      return 100.00;
    }
    
    return 0;
  }

  /**
   * Type guards for different item types
   */
  private isSticker(item: any): item is Sticker {
    return item && typeof item === 'object' && 'tournament_event' in item && 'type' in item;
  }

  private isKeychain(item: any): item is Keychain {
    return item && typeof item === 'object' && 'collections' in item && !('weapon' in item);
  }

  private isCollectible(item: any): item is Collectible {
    return item && typeof item === 'object' && 'genuine' in item && !('weapon' in item);
  }

  private isAgent(item: any): item is Agent {
    return item && typeof item === 'object' && 'team' in item && 'collections' in item;
  }

  private isPatch(item: any): item is Patch {
    return item && typeof item === 'object' && 'market_hash_name' in item && !('weapon' in item);
  }

  private isGraffiti(item: any): item is Graffiti {
    return item && typeof item === 'object' && 'crates' in item && !('weapon' in item);
  }

  private isMusicKit(item: any): item is MusicKit {
    return item && typeof item === 'object' && 'exclusive' in item && !('weapon' in item);
  }

  private isHighlight(item: any): item is Highlight {
    return item && typeof item === 'object' && 'tournament_event' in item && 'map' in item;
  }
}
