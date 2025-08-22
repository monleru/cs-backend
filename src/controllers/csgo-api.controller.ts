import { 
  Controller, 
  Get, 
  Query, 
  Param, 
  HttpException, 
  HttpStatus,
  Logger 
} from '@nestjs/common';
import { CsgoApiService } from '../services/csgo-api.service';
import { SupportedLanguage } from '../constants/csgo-api.constants';

@Controller('csgo')
export class CsgoApiController {
  private readonly logger = new Logger(CsgoApiController.name);

  constructor(private readonly csgoApiService: CsgoApiService) {}

  /**
   * Get all items from CS:GO API
   */
  @Get('all')
  async getAllItems(
    @Query('lang') language: SupportedLanguage = 'en'
  ) {
    try {
      this.logger.log(`Getting all items with language: ${language}`);
      return await this.csgoApiService.getAllItems(language);
    } catch (error) {
      this.logger.error(`Error getting all items: ${error.message}`);
      throw new HttpException(
        `Failed to get all items: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get detailed information about a specific skin by ID
   */
  @Get('skins/:id/details')
  async getSkinDetails(
    @Param('id') skinId: string,
    @Query('lang') language: SupportedLanguage = 'en'
  ) {
    try {
      if (!skinId || skinId.trim().length === 0) {
        throw new HttpException(
          'Skin ID is required',
          HttpStatus.BAD_REQUEST
        );
      }

      this.logger.log(`Getting detailed information for skin: ${skinId} with language: ${language}`);
      const skinDetails = await this.csgoApiService.getSkinDetails(skinId.trim(), language);
      
      return {
        skin_id: skinId.trim(),
        language,
        details: skinDetails
      };
    } catch (error) {
      this.logger.error(`Error getting skin details for ${skinId}: ${error.message}`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to get skin details: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get crate information by ID (without contents)
   */
  @Get('crates/:id')
  async getCrateById(
    @Param('id') crateId: string,
    @Query('lang') language: SupportedLanguage = 'en'
  ) {
    try {
      if (!crateId || crateId.trim().length === 0) {
        throw new HttpException(
          'Crate ID is required',
          HttpStatus.BAD_REQUEST
        );
      }

      this.logger.log(`Getting crate information for: ${crateId} with language: ${language}`);
      const crateInfo = await this.csgoApiService.getCrateById(crateId.trim(), language);
      
      return {
        crate_id: crateId.trim(),
        language,
        crate: crateInfo
      };
    } catch (error) {
      this.logger.error(`Error getting crate information for ${crateId}: ${error.message}`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to get crate information: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get detailed contents of a crate by ID
   */
  @Get('crates/:id/contents')
  async getCrateContents(
    @Param('id') crateId: string,
    @Query('lang') language: SupportedLanguage = 'en'
  ) {
    try {
      if (!crateId || crateId.trim().length === 0) {
        throw new HttpException(
          'Crate ID is required',
          HttpStatus.BAD_REQUEST
        );
      }

      this.logger.log(`Getting detailed contents for crate: ${crateId} with language: ${language}`);
      const crateContents = await this.csgoApiService.getCrateContentsById(crateId.trim(), language);
      
      return {
        crate_id: crateId.trim(),
        language,
        contents: crateContents
      };
    } catch (error) {
      this.logger.error(`Error getting crate contents for ${crateId}: ${error.message}`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to get crate contents: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get detailed contents of a collection by ID
   */
  @Get('collections/:id/contents')
  async getCollectionContents(
    @Param('id') collectionId: string,
    @Query('lang') language: SupportedLanguage = 'en'
  ) {
    try {
      if (!collectionId || collectionId.trim().length === 0) {
        throw new HttpException(
          'Collection ID is required',
          HttpStatus.BAD_REQUEST
        );
      }

      this.logger.log(`Getting detailed contents for collection: ${collectionId} with language: ${language}`);
      const collectionContents = await this.csgoApiService.getCollectionContentsById(collectionId.trim(), language);
      
      return {
        collection_id: collectionId.trim(),
        language,
        contents: collectionContents
      };
    } catch (error) {
      this.logger.error(`Error getting collection contents for ${collectionId}: ${error.message}`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to get collection contents: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Search skins by name
   */
  @Get('search/skins/name')
  async searchSkinsByName(
    @Query('q') query: string,
    @Query('lang') language: SupportedLanguage = 'en',
    @Query('limit') limit: number = 50
  ) {
    try {
      if (!query || query.trim().length === 0) {
        throw new HttpException(
          'Search query is required',
          HttpStatus.BAD_REQUEST
        );
      }

      this.logger.log(`Searching skins by name: "${query}" with language: ${language}, limit: ${limit}`);
      const results = await this.csgoApiService.searchSkinsByName(query.trim(), language, limit);
      
      return {
        query: query.trim(),
        language,
        limit,
        total: results.length,
        results
      };
    } catch (error) {
      this.logger.error(`Error searching skins by name: ${error.message}`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to search skins by name: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Search skins by weapon type
   */
  @Get('search/skins/weapon')
  async searchSkinsByWeapon(
    @Query('weapon') weapon: string,
    @Query('lang') language: SupportedLanguage = 'en',
    @Query('limit') limit: number = 50
  ) {
    try {
      if (!weapon || weapon.trim().length === 0) {
        throw new HttpException(
          'Weapon name is required',
          HttpStatus.BAD_REQUEST
        );
      }

      this.logger.log(`Searching skins by weapon: "${weapon}" with language: ${language}, limit: ${limit}`);
      const results = await this.csgoApiService.searchSkinsByWeapon(weapon.trim(), language, limit);
      
      return {
        weapon: weapon.trim(),
        language,
        limit,
        total: results.length,
        results
      };
    } catch (error) {
      this.logger.error(`Error searching skins by weapon: ${error.message}`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to search skins by weapon: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Search skins by rarity
   */
  @Get('search/skins/rarity')
  async searchSkinsByRarity(
    @Query('rarity') rarity: string,
    @Query('lang') language: SupportedLanguage = 'en',
    @Query('limit') limit: number = 50
  ) {
    try {
      if (!rarity || rarity.trim().length === 0) {
        throw new HttpException(
          'Rarity name is required',
          HttpStatus.BAD_REQUEST
        );
      }

      this.logger.log(`Searching skins by rarity: "${rarity}" with language: ${language}, limit: ${limit}`);
      const results = await this.csgoApiService.searchSkinsByRarity(rarity.trim(), language, limit);
      
      return {
        rarity: rarity.trim(),
        language,
        limit,
        total: results.length,
        results
      };
    } catch (error) {
      this.logger.error(`Error searching skins by rarity: ${error.message}`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to search skins by rarity: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Advanced skin search with multiple criteria
   */
  @Get('search/skins/advanced')
  async advancedSkinSearch(
    @Query('name') name?: string,
    @Query('weapon') weapon?: string,
    @Query('rarity') rarity?: string,
    @Query('category') category?: string,
    @Query('pattern') pattern?: string,
    @Query('stattrak') stattrak?: string,
    @Query('souvenir') souvenir?: string,
    @Query('lang') language: SupportedLanguage = 'en',
    @Query('limit') limit: number = 50
  ) {
    try {
      // Build criteria object
      const criteria: any = {};
      
      if (name && name.trim().length > 0) criteria.name = name.trim();
      if (weapon && weapon.trim().length > 0) criteria.weapon = weapon.trim();
      if (rarity && rarity.trim().length > 0) criteria.rarity = rarity.trim();
      if (category && category.trim().length > 0) criteria.category = category.trim();
      if (pattern && pattern.trim().length > 0) criteria.pattern = pattern.trim();
      
      // Handle boolean parameters
      if (stattrak !== undefined) {
        if (stattrak === 'true') criteria.stattrak = true;
        else if (stattrak === 'false') criteria.stattrak = false;
      }
      
      if (souvenir !== undefined) {
        if (souvenir === 'true') criteria.souvenir = true;
        else if (souvenir === 'false') criteria.souvenir = false;
      }

      // Check if at least one criteria is provided
      if (Object.keys(criteria).length === 0) {
        throw new HttpException(
          'At least one search criteria is required',
          HttpStatus.BAD_REQUEST
        );
      }

      this.logger.log(`Advanced skin search with criteria: ${JSON.stringify(criteria)} with language: ${language}, limit: ${limit}`);
      const results = await this.csgoApiService.advancedSkinSearch(criteria, language, limit);
      
      return {
        criteria,
        language,
        limit,
        total: results.length,
        results
      };
    } catch (error) {
      this.logger.error(`Error in advanced skin search: ${error.message}`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to perform advanced search: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get all skins from CS:GO API
   */
  @Get('skins')
  async getSkins(
    @Query('lang') language: SupportedLanguage = 'en',
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20'
  ) {
    try {
      // Преобразуем строки в числа
      const pageNum = parseInt(page, 10);
      const pageSizeNum = parseInt(pageSize, 10);
      
      this.logger.log(`Getting skins with pagination: page ${pageNum}, pageSize ${pageSizeNum}, language: ${language}`);
      
      // Валидация параметров пагинации
      if (isNaN(pageNum) || pageNum < 1) {
        throw new HttpException(
          'Page number must be a valid number greater than 0',
          HttpStatus.BAD_REQUEST
        );
      }
      
      if (isNaN(pageSizeNum) || pageSizeNum < 1 || pageSizeNum > 100) {
        throw new HttpException(
          'Page size must be a valid number between 1 and 100',
          HttpStatus.BAD_REQUEST
        );
      }
      
      return await this.csgoApiService.getSkinsPaginated(pageNum, pageSizeNum, language);
    } catch (error) {
      this.logger.error(`Error getting skins: ${error.message}`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to get skins: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get all skins not grouped from CS:GO API
   */
  @Get('skins-not-grouped')
  async getSkinsNotGrouped(
    @Query('lang') language: SupportedLanguage = 'en'
  ) {
    try {
      this.logger.log(`Getting skins not grouped with language: ${language}`);
      return await this.csgoApiService.getSkinsNotGrouped(language);
    } catch (error) {
      this.logger.error(`Error getting skins not grouped: ${error.message}`);
      throw new HttpException(
        `Failed to get skins not grouped: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get all stickers from CS:GO API
   */
  @Get('stickers')
  async getStickers(
    @Query('lang') language: SupportedLanguage = 'en'
  ) {
    try {
      this.logger.log(`Getting stickers with language: ${language}`);
      return await this.csgoApiService.getStickers(language);
    } catch (error) {
      this.logger.error(`Error getting stickers: ${error.message}`);
      throw new HttpException(
        `Failed to get stickers: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get all keychains from CS:GO API
   */
  @Get('keychains')
  async getKeychains(
    @Query('lang') language: SupportedLanguage = 'en'
  ) {
    try {
      this.logger.log(`Getting keychains with language: ${language}`);
      return await this.csgoApiService.getKeychains(language);
    } catch (error) {
      this.logger.error(`Error getting keychains: ${error.message}`);
      throw new HttpException(
        `Failed to get keychains: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get all collections from CS:GO API
   */
  @Get('collections')
  async getCollections(
    @Query('lang') language: SupportedLanguage = 'en'
  ) {
    try {
      this.logger.log(`Getting collections with language: ${language}`);
      return await this.csgoApiService.getCollections(language);
    } catch (error) {
      this.logger.error(`Error getting collections: ${error.message}`);
      throw new HttpException(
        `Failed to get collections: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get all crates from CS:GO API
   */
  @Get('crates')
  async getCrates(
    @Query('lang') language: SupportedLanguage = 'en'
  ) {
    try {
      this.logger.log(`Getting crates with language: ${language}`);
      return await this.csgoApiService.getCrates(language);
    } catch (error) {
      this.logger.error(`Error getting crates: ${error.message}`);
      throw new HttpException(
        `Failed to get crates: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get all keys from CS:GO API
   */
  @Get('keys')
  async getKeys(
    @Query('lang') language: SupportedLanguage = 'en'
  ) {
    try {
      this.logger.log(`Getting keys with language: ${language}`);
      return await this.csgoApiService.getKeys(language);
    } catch (error) {
      this.logger.error(`Error getting keys: ${error.message}`);
      throw new HttpException(
        `Failed to get keys: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get all collectibles from CS:GO API
   */
  @Get('collectibles')
  async getCollectibles(
    @Query('lang') language: SupportedLanguage = 'en'
  ) {
    try {
      this.logger.log(`Getting collectibles with language: ${language}`);
      return await this.csgoApiService.getCollectibles(language);
    } catch (error) {
      this.logger.error(`Error getting collectibles: ${error.message}`);
      throw new HttpException(
        `Failed to get collectibles: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get all agents from CS:GO API
   */
  @Get('agents')
  async getAgents(
    @Query('lang') language: SupportedLanguage = 'en'
  ) {
    try {
      this.logger.log(`Getting agents with language: ${language}`);
      return await this.csgoApiService.getAgents(language);
    } catch (error) {
      this.logger.error(`Error getting agents: ${error.message}`);
      throw new HttpException(
        `Failed to get agents: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get all patches from CS:GO API
   */
  @Get('patches')
  async getPatches(
    @Query('lang') language: SupportedLanguage = 'en'
  ) {
    try {
      this.logger.log(`Getting patches with language: ${language}`);
      return await this.csgoApiService.getPatches(language);
    } catch (error) {
      this.logger.error(`Error getting patches: ${error.message}`);
      throw new HttpException(
        `Failed to get patches: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get all graffiti from CS:GO API
   */
  @Get('graffiti')
  async getGraffiti(
    @Query('lang') language: SupportedLanguage = 'en'
  ) {
    try {
      this.logger.log(`Getting graffiti with language: ${language}`);
      return await this.csgoApiService.getGraffiti(language);
    } catch (error) {
      this.logger.error(`Error getting graffiti: ${error.message}`);
      throw new HttpException(
        `Failed to get graffiti: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get all music kits from CS:GO API
   */
  @Get('music-kits')
  async getMusicKits(
    @Query('lang') language: SupportedLanguage = 'en'
  ) {
    try {
      this.logger.log(`Getting music kits with language: ${language}`);
      return await this.csgoApiService.getMusicKits(language);
    } catch (error) {
      this.logger.error(`Error getting music kits: ${error.message}`);
      throw new HttpException(
        `Failed to get music kits: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get all base weapons from CS:GO API
   */
  @Get('base-weapons')
  async getBaseWeapons(
    @Query('lang') language: SupportedLanguage = 'en'
  ) {
    try {
      this.logger.log(`Getting base weapons with language: ${language}`);
      return await this.csgoApiService.getBaseWeapons(language);
    } catch (error) {
      this.logger.error(`Error getting base weapons: ${error.message}`);
      throw new HttpException(
        `Failed to get base weapons: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get all highlights from CS:GO API
   */
  @Get('highlights')
  async getHighlights(
    @Query('lang') language: SupportedLanguage = 'en'
  ) {
    try {
      this.logger.log(`Getting highlights with language: ${language}`);
      return await this.csgoApiService.getHighlights(language);
    } catch (error) {
      this.logger.error(`Error getting highlights: ${error.message}`);
      throw new HttpException(
        `Failed to get highlights: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Search skins by collection
   */
  @Get('search/skins/collection')
  async searchSkinsByCollection(
    @Query('collection') collection: string,
    @Query('lang') language: SupportedLanguage = 'en',
    @Query('limit') limit: number = 50
  ) {
    try {
      if (!collection || collection.trim().length === 0) {
        throw new HttpException(
          'Collection name is required',
          HttpStatus.BAD_REQUEST
        );
      }

      this.logger.log(`Searching skins by collection: "${collection}" with language: ${language}, limit: ${limit}`);
      const results = await this.csgoApiService.searchSkinsByCollection(collection.trim(), language, limit);
      
      return {
        collection: collection.trim(),
        language,
        limit,
        total: results.length,
        results
      };
    } catch (error) {
      this.logger.error(`Error searching skins by collection: ${error.message}`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to search skins by collection: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Search skins by crate
   */
  @Get('search/skins/crate')
  async searchSkinsByCrate(
    @Query('crate') crate: string,
    @Query('lang') language: SupportedLanguage = 'en',
    @Query('limit') limit: number = 50
  ) {
    try {
      if (!crate || crate.trim().length === 0) {
        throw new HttpException(
          'Crate name is required',
          HttpStatus.BAD_REQUEST
        );
      }

      this.logger.log(`Searching skins by crate: "${crate}" with language: ${language}, limit: ${limit}`);
      const results = await this.csgoApiService.searchSkinsByCrate(crate.trim(), language, limit);
      
      return {
        crate: crate.trim(),
        language,
        limit,
        total: results.length,
        results
      };
    } catch (error) {
      this.logger.error(`Error searching skins by crate: ${error.message}`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to search skins by crate: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Search items by price range
   */
  @Get('search/price')
  async searchItemsByPrice(
    @Query('min') minPrice: number,
    @Query('max') maxPrice: number,
    @Query('type') itemType: 'skins' | 'stickers' | 'all' = 'all',
    @Query('lang') language: SupportedLanguage = 'en',
    @Query('limit') limit: number = 50
  ) {
    try {
      if (minPrice === undefined || maxPrice === undefined) {
        throw new HttpException(
          'Min and max price are required',
          HttpStatus.BAD_REQUEST
        );
      }

      if (minPrice < 0 || maxPrice < 0 || minPrice > maxPrice) {
        throw new HttpException(
          'Invalid price range. Min and max must be positive numbers, and min must be less than max',
          HttpStatus.BAD_REQUEST
        );
      }

      this.logger.log(`Searching items by price: $${minPrice}-$${maxPrice}, type: ${itemType} with language: ${language}, limit: ${limit}`);
      const results = await this.csgoApiService.searchItemsByPrice(minPrice, maxPrice, itemType, language, limit);
      
      return {
        price_range: { min: minPrice, max: maxPrice },
        item_type: itemType,
        language,
        limit,
        total: results.length,
        results
      };
    } catch (error) {
      this.logger.error(`Error searching items by price: ${error.message}`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to search items by price: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Search items by team
   */
  @Get('search/team')
  async searchItemsByTeam(
    @Query('team') team: string,
    @Query('type') itemType: 'skins' | 'stickers' | 'agents' | 'all' = 'all',
    @Query('lang') language: SupportedLanguage = 'en',
    @Query('limit') limit: number = 50
  ) {
    try {
      if (!team || team.trim().length === 0) {
        throw new HttpException(
          'Team name is required',
          HttpStatus.BAD_REQUEST
        );
      }

      this.logger.log(`Searching items by team: "${team}", type: ${itemType} with language: ${language}, limit: ${limit}`);
      const results = await this.csgoApiService.searchItemsByTeam(team.trim(), itemType, language, limit);
      
      return {
        team: team.trim(),
        item_type: itemType,
        language,
        limit,
        total: results.length,
        results
      };
    } catch (error) {
      this.logger.error(`Error searching items by team: ${error.message}`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to search items by team: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Search items by tournament
   */
  @Get('search/tournament')
  async searchItemsByTournament(
    @Query('tournament') tournament: string,
    @Query('type') itemType: 'stickers' | 'highlights' | 'all' = 'all',
    @Query('lang') language: SupportedLanguage = 'en',
    @Query('limit') limit: number = 50
  ) {
    try {
      if (!tournament || tournament.trim().length === 0) {
        throw new HttpException(
          'Tournament name is required',
          HttpStatus.BAD_REQUEST
        );
      }

      this.logger.log(`Searching items by tournament: "${tournament}", type: ${itemType} with language: ${language}, limit: ${limit}`);
      const results = await this.csgoApiService.searchItemsByTournament(tournament.trim(), itemType, language, limit);
      
      return {
        tournament: tournament.trim(),
        item_type: itemType,
        language,
        limit,
        total: results.length,
        results
      };
    } catch (error) {
      this.logger.error(`Error searching items by tournament: ${error.message}`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to search items by tournament: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Search items by year
   */
  @Get('search/year')
  async searchItemsByYear(
    @Query('year') year: number,
    @Query('type') itemType: 'stickers' | 'highlights' | 'all' = 'all',
    @Query('lang') language: SupportedLanguage = 'en',
    @Query('limit') limit: number = 50
  ) {
    try {
      if (!year || year < 1999 || year > 2030) {
        throw new HttpException(
          'Valid year between 1999 and 2030 is required',
          HttpStatus.BAD_REQUEST
        );
      }

      this.logger.log(`Searching items by year: ${year}, type: ${itemType} with language: ${language}, limit: ${limit}`);
      const results = await this.csgoApiService.searchItemsByYear(year, itemType, language, limit);
      
      return {
        year,
        item_type: itemType,
        language,
        limit,
        total: results.length,
        results
      };
    } catch (error) {
      this.logger.error(`Error searching items by year: ${error.message}`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to search items by year: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Search items by pattern
   */
  @Get('search/pattern')
  async searchItemsByPattern(
    @Query('pattern') pattern: string,
    @Query('type') itemType: 'skins' | 'stickers' | 'all' = 'all',
    @Query('lang') language: SupportedLanguage = 'en',
    @Query('limit') limit: number = 50
  ) {
    try {
      if (!pattern || pattern.trim().length === 0) {
        throw new HttpException(
          'Pattern name is required',
          HttpStatus.BAD_REQUEST
        );
      }

      this.logger.log(`Searching items by pattern: "${pattern}", type: ${itemType} with language: ${language}, limit: ${limit}`);
      const results = await this.csgoApiService.searchItemsByPattern(pattern.trim(), itemType, language, limit);
      
      return {
        pattern: pattern.trim(),
        item_type: itemType,
        language,
        limit,
        total: results.length,
        results
      };
    } catch (error) {
      this.logger.error(`Error searching items by pattern: ${error.message}`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to search items by pattern: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Search skins by wear condition
   */
  @Get('search/skins/wear')
  async searchSkinsByWear(
    @Query('wear') wear: string,
    @Query('lang') language: SupportedLanguage = 'en',
    @Query('limit') limit: number = 50
  ) {
    try {
      if (!wear || wear.trim().length === 0) {
        throw new HttpException(
          'Wear condition is required',
          HttpStatus.BAD_REQUEST
        );
      }

      this.logger.log(`Searching skins by wear: "${wear}" with language: ${language}, limit: ${limit}`);
      const results = await this.csgoApiService.searchSkinsByWear(wear.trim(), language, limit);
      
      return {
        wear: wear.trim(),
        language,
        limit,
        total: results.length,
        results
      };
    } catch (error) {
      this.logger.error(`Error searching skins by wear: ${error.message}`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to search skins by wear: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Search items by category
   */
  @Get('search/category')
  async searchItemsByCategory(
    @Query('category') category: string,
    @Query('type') itemType: 'skins' | 'stickers' | 'all' = 'all',
    @Query('lang') language: SupportedLanguage = 'en',
    @Query('limit') limit: number = 50
  ) {
    try {
      if (!category || category.trim().length === 0) {
        throw new HttpException(
          'Category name is required',
          HttpStatus.BAD_REQUEST
        );
      }

      this.logger.log(`Searching items by category: "${category}", type: ${itemType} with language: ${language}, limit: ${limit}`);
      const results = await this.csgoApiService.searchItemsByCategory(category.trim(), itemType, language, limit);
      
      return {
        category: category.trim(),
        item_type: itemType,
        language,
        limit,
        total: results.length,
        results
      };
    } catch (error) {
      this.logger.error(`Error searching items by category: ${error.message}`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to search items by category: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Global search across all item types
   */
  @Get('search/global')
  async globalSearch(
    @Query('q') query: string,
    @Query('types') itemTypes: string = 'skins',
    @Query('lang') language: SupportedLanguage = 'en',
    @Query('limit') limit: number = 100
  ) {
    try {
      if (!query || query.trim().length === 0) {
        throw new HttpException(
          'Search query is required',
          HttpStatus.BAD_REQUEST
        );
      }

      // Parse item types from comma-separated string
      const types = itemTypes.split(',').map(t => t.trim()) as any[];
      
      // Validate item types
      const validTypes = ['skins', 'stickers', 'keychains', 'collectibles', 'agents', 'patches', 'graffiti', 'music_kits', 'highlights'];
      const filteredTypes = types.filter(t => validTypes.includes(t));
      
      if (filteredTypes.length === 0) {
        filteredTypes.push('skins'); // Default to skins if no valid types
      }

      this.logger.log(`Global search for: "${query}" across types: ${filteredTypes.join(', ')} with language: ${language}, limit: ${limit}`);
      const results = await this.csgoApiService.globalSearch(query.trim(), filteredTypes, language, limit);
      
      return {
        query: query.trim(),
        item_types: filteredTypes,
        language,
        limit,
        total_by_type: Object.entries(results).map(([type, items]) => ({ type, count: items.length })),
        total: Object.values(results).reduce((sum, arr) => sum + arr.length, 0),
        results
      };
    } catch (error) {
      this.logger.error(`Error in global search: ${error.message}`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to perform global search: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Comprehensive search across all fields and item types
   */
  @Get('search/comprehensive')
  async comprehensiveSearch(
    @Query('q') query: string,
    @Query('lang') language: SupportedLanguage = 'en',
    @Query('limit') limit: number = 100,
    @Query('fields') fields: string = 'name,description,weapon,pattern,team,tournament,category'
  ) {
    try {
      if (!query || query.trim().length === 0) {
        throw new HttpException(
          'Search query is required',
          HttpStatus.BAD_REQUEST
        );
      }

      // Parse fields from comma-separated string
      const includeFields = fields.split(',').map(f => f.trim());
      
      // Validate fields
      const validFields = ['name', 'description', 'weapon', 'pattern', 'team', 'tournament', 'category', 'rarity', 'collections', 'crates', 'market_hash_name'];
      const filteredFields = includeFields.filter(f => validFields.includes(f));
      
      if (filteredFields.length === 0) {
        filteredFields.push('name'); // Default to name if no valid fields
      }

      this.logger.log(`Comprehensive search for: "${query}" with fields: ${filteredFields.join(', ')} in language: ${language}, limit: ${limit}`);
      const results = await this.csgoApiService.comprehensiveSearch(query.trim(), language, limit, filteredFields);
      
      return {
        query: query.trim(),
        language,
        limit,
        fields_searched: filteredFields,
        total: results.total,
        search_stats: results.search_stats,
        results_by_type: results.results_by_type,
        results: results.results
      };
    } catch (error) {
      this.logger.error(`Error in comprehensive search: ${error.message}`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to perform comprehensive search: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get supported languages
   */
  @Get('languages')
  getSupportedLanguages() {
    this.logger.log('Getting supported languages');
    return this.csgoApiService.getSupportedLanguages();
  }

  /**
   * Get enhanced cache statistics with hash information
   */
  @Get('cache/stats')
  getCacheStats() {
    this.logger.log('Getting enhanced cache statistics');
    return this.csgoApiService.getCacheStats();
  }

  /**
   * Get specific cache entry by key
   */
  @Get('cache/entry/:key')
  getCacheEntry(@Param('key') key: string) {
    this.logger.log(`Getting cache entry for key: ${key}`);
    const entry = this.csgoApiService.getCacheEntry(key);
    if (!entry) {
      throw new HttpException(
        `Cache entry not found for key: ${key}`,
        HttpStatus.NOT_FOUND
      );
    }
    return entry;
  }

  /**
   * Validate cache integrity by checking hashes
   */
  @Get('cache/validate')
  validateCacheIntegrity() {
    this.logger.log('Validating cache integrity');
    return this.csgoApiService.validateCacheIntegrity();
  }

  /**
   * Clear cache
   */
  @Get('cache/clear')
  clearCache() {
    this.logger.log('Clearing cache');
    this.csgoApiService.clearCache();
    return { message: 'Cache cleared successfully' };
  }

  /**
   * Health check endpoint
   */
  @Get('health')
  health() {
    return { 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      service: 'CS:GO API Backend',
      features: {
        hashing: true,
        cacheTTL: '5 minutes',
        integrityValidation: true,
        search: {
          byName: true,
          byWeapon: true,
          byRarity: true,
          advanced: true
        },
        detailedInfo: {
          skins: true,
          crates: true,
          collections: true,
          relatedItems: true,
          rarityDistribution: true,
          marketInfo: true
        }
      }
    };
  }
}
