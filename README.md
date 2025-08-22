# CS:GO API Backend

Полнофункциональный бэкенд на NestJS для работы с CS:GO API, включающий кэширование, хеширование, поиск и детальную информацию о предметах.

## 🚀 Быстрый старт

### 1. Запуск сервера

```bash
# Клонируйте репозиторий
git clone <your-repo-url>
cd cs-backend

# Установите зависимости
npm install

# Запустите сервер
npm run start:dev
```

Сервер запустится на `http://localhost:3002`

### 2. Проверка работоспособности

```bash
curl http://localhost:3002/api/csgo/health
```

## 🔗 Подключение к API

### Базовый URL
```
http://localhost:3002/api/csgo
```

### Основные эндпоинты

#### Получить все предметы
```http
GET /all?lang={language}
```

#### Получить скины
```http
GET /skins?lang={language}
```

#### Получить наклейки
```http
GET /stickers?lang={language}
```

#### Получить коллекции
```http
GET /collections?lang={language}
```

#### Получить кейсы
```http
GET /crates?lang={language}
```

## 🔍 Поиск скинов

### Поиск по имени
```http
GET /search/skins/name?q={query}&lang={language}&limit={limit}
```

**Пример:**
```bash
curl "http://localhost:3002/api/csgo/search/skins/name?q=AK&lang=en&limit=5"
```

### Поиск по оружию
```http
GET /search/skins/weapon?weapon={weapon}&lang={language}&limit={limit}
```

**Пример:**
```bash
curl "http://localhost:3002/api/csgo/search/skins/weapon?weapon=AK-47&lang=en&limit=3"
```

### Поиск по редкости
```http
GET /search/skins/rarity?rarity={rarity}&lang={language}&limit={limit}
```

**Пример:**
```bash
curl "http://localhost:3002/api/csgo/search/skins/rarity?rarity=Covert&lang=en&limit=10"
```

### Поиск по коллекции
```http
GET /search/skins/collection?collection={collection}&lang={language}&limit={limit}
```

**Пример:**
```bash
curl "http://localhost:3002/api/csgo/search/skins/collection?collection=Revolution&lang=en&limit=10"
```

### Поиск по кейсу
```http
GET /search/skins/crate?crate={crate}&lang={language}&limit={limit}
```

**Пример:**
```bash
curl "http://localhost:3002/api/csgo/search/skins/crate?crate=Revolution&lang=en&limit=15"
```

### Поиск по износу
```http
GET /search/skins/wear?wear={wear}&lang={language}&limit={limit}
```

**Пример:**
```bash
curl "http://localhost:3002/api/csgo/search/skins/wear?wear=Factory&lang=en&limit=20"
```

### Расширенный поиск
```http
GET /search/skins/advanced?name={name}&weapon={weapon}&rarity={rarity}&category={category}&pattern={pattern}&stattrak={true/false}&souvenir={true/false}&lang={language}&limit={limit}
```

**Пример:**
```bash
curl "http://localhost:3002/api/csgo/search/skins/advanced?weapon=AK-47&rarity=Covert&stattrak=false&lang=en&limit=5"
```

## 🔍 Поиск по другим критериям

### Поиск по цене (оценка)
```http
GET /search/price?min={minPrice}&max={maxPrice}&type={itemType}&lang={language}&limit={limit}
```

**Пример:**
```bash
curl "http://localhost:3002/api/csgo/search/price?min=5&max=50&type=skins&lang=en&limit=20"
```

### Поиск по команде
```http
GET /search/team?team={teamName}&type={itemType}&lang={language}&limit={limit}
```

**Пример:**
```bash
curl "http://localhost:3002/api/csgo/search/team?team=Natus&type=stickers&lang=en&limit=15"
```

### Поиск по турниру
```http
GET /search/tournament?tournament={tournamentName}&type={itemType}&lang={language}&limit={limit}
```

**Пример:**
```bash
curl "http://localhost:3002/api/csgo/search/tournament?tournament=Katowice&type=stickers&lang=en&limit=25"
```

### Поиск по году
```http
GET /search/year?year={year}&type={itemType}&lang={language}&limit={limit}
```

**Пример:**
```bash
curl "http://localhost:3002/api/csgo/search/year?year=2023&type=stickers&lang=en&limit=30"
```

### Поиск по паттерну/дизайну
```http
GET /search/pattern?pattern={patternName}&type={itemType}&lang={language}&limit={limit}
```

**Пример:**
```bash
curl "http://localhost:3002/api/csgo/search/pattern?pattern=Dragon&type=skins&lang=en&limit=15"
```

### Поиск по категории
```http
GET /search/category?category={categoryName}&type={itemType}&lang={language}&limit={limit}
```

**Пример:**
```bash
curl "http://localhost:3002/api/csgo/search/category?category=Pistols&type=skins&lang=en&limit=20"
```

## 🌐 Глобальный поиск

### Поиск по всем типам предметов
```http
GET /search/global?q={query}&types={itemTypes}&lang={language}&limit={limit}
```

**Пример:**
```bash
# Поиск по всем типам
curl "http://localhost:3002/api/csgo/search/global?q=Dragon&types=skins,stickers&lang=en&limit=50"

# Поиск только по скинам
curl "http://localhost:3002/api/csgo/search/global?q=AK&types=skins&lang=en&limit=30"
```

**Поддерживаемые типы предметов:**
- `skins` - Скины оружия
- `stickers` - Наклейки
- `keychains` - Брелоки
- `collectibles` - Коллекционные предметы
- `agents` - Агенты
- `patches` - Патчи
- `graffiti` - Граффити
- `music_kits` - Музыкальные наборы
- `highlights` - Хайлайты турниров

## 🔍 Комплексный поиск по всем полям

### Поиск по всем полям одновременно
```http
GET /search/comprehensive?q={query}&fields={fields}&lang={language}&limit={limit}
```

**Пример:**
```bash
# Поиск по всем полям
curl "http://localhost:3002/api/csgo/search/comprehensive?q=AK&lang=en&limit=50"

# Поиск по конкретным полям
curl "http://localhost:3002/api/csgo/search/comprehensive?q=Dragon&fields=name,weapon,pattern&lang=en&limit=30"

# Поиск по командам и турнирам
curl "http://localhost:3002/api/csgo/search/comprehensive?q=Natus&fields=team,tournament&lang=en&limit=25"
```

**Доступные поля для поиска:**
- `name` - Название предмета
- `description` - Описание
- `weapon` - Оружие (для скинов)
- `pattern` - Паттерн/дизайн (для скинов)
- `team` - Команда
- `tournament` - Турнир
- `category` - Категория
- `rarity` - Редкость
- `collections` - Коллекции
- `crates` - Кейсы
- `market_hash_name` - Название на рынке

**Особенности комплексного поиска:**
- **Умная система ранжирования** - результаты сортируются по релевантности
- **Поиск по всем типам предметов** - скины, наклейки, агенты, кейсы и т.д.
- **Гибкая настройка полей** - можно указать, в каких полях искать
- **Статистика поиска** - процент совпадений, количество просмотренных предметов
- **Детальная информация** - показывает, в каких полях найдено совпадение

### Практические примеры комплексного поиска

#### Поиск по названию и оружию
```bash
curl "http://localhost:3002/api/csgo/search/comprehensive?q=AK&fields=name,weapon&lang=en&limit=15"
```

#### Поиск по командам и турнирам
```bash
curl "http://localhost:3002/api/csgo/search/comprehensive?q=Natus&fields=team,tournament&lang=en&limit=15"
```

#### Поиск по паттернам и оружию
```bash
curl "http://localhost:3002/api/csgo/search/comprehensive?q=Dragon&fields=name,weapon,pattern&lang=en&limit=15"
```

#### Поиск по цене и редкости
```bash
curl "http://localhost:3002/api/csgo/search/comprehensive?q=Covert&fields=rarity,name&lang=en&limit=15"
```

#### Пример ответа комплексного поиска
```json
{
  "query": "AK",
  "language": "en",
  "limit": 15,
  "fields_searched": ["name", "weapon", "pattern", "team"],
  "total": 12,
  "search_stats": {
    "total_items_searched": 1500,
    "items_with_matches": 12,
    "match_percentage": 0.8,
    "fields_searched": ["name", "weapon", "pattern", "team"]
  },
  "results_by_type": {
    "skins": [
      {
        "id": "skin-vanilla-weapon_knife_css",
        "name": "★ Classic Knife",
        "weapon": {
          "id": "sfui_wpnhud_knifecss",
          "weapon_id": 504,
          "name": "Classic Knife"
        },
        "item_type": "skin",
        "match_field": ["name"],
        "match_score": 85
      }
    ],
    "stickers": [
      {
        "id": "collectible-948",
        "name": "Dragon Lore",
        "item_type": "sticker",
        "match_field": ["name"],
        "match_score": 90
      }
    ]
  },
  "results": [
    {
      "id": "skin-vanilla-weapon_knife_css",
      "name": "★ Classic Knife",
      "item_type": "skin",
      "match_field": ["name"],
      "match_score": 85
    }
  ]
}
```

## 📊 Детальная информация

### Детали скина по ID
```http
GET /skins/{id}/details?lang={language}
```

**Пример:**
```bash
curl "http://localhost:3002/api/csgo/skins/skin-e757fd7191f9/details?lang=en"
```

**Возвращает:**
- Основную информацию о скине
- Коллекции, в которых находится скин
- Кейсы, из которых может выпасть
- Распределение редкости
- Связанные предметы
- Рыночную информацию

### Содержимое кейса
```http
GET /crates/{id}/contents?lang={language}
```

**Пример:**
```bash
curl "http://localhost:3002/api/csgo/crates/crate-1210/contents?lang=en"
```

**Возвращает:**
- Все предметы в кейсе
- Распределение редкости
- Информацию о ключе
- Специальные предметы

### Содержимое коллекции
```http
GET /collections/{id}/contents?lang={language}
```

**Пример:**
```bash
curl "http://localhost:3002/api/csgo/collections/collection-set-community-3/contents?lang=en"
```

**Возвращает:**
- Все предметы в коллекции
- Распределение редкости
- Источник выпадения

## 🌍 Поддерживаемые языки

- `en` - Английский (по умолчанию)
- `ru` - Русский
- `de` - Немецкий
- `fr` - Французский
- `es-ES` - Испанский (Испания)
- `es-MX` - Испанский (Мексика)
- `pt-BR` - Португальский (Бразилия)
- `pt-PT` - Португальский (Португалия)
- `it` - Итальянский
- `ja` - Японский
- `ko` - Корейский
- `zh-CN` - Китайский (упрощенный)
- `zh-TW` - Китайский (традиционный)
- `bg` - Болгарский
- `cs` - Чешский
- `da` - Датский
- `el` - Греческий
- `fi` - Финский
- `hu` - Венгерский
- `nl` - Голландский
- `no` - Норвежский
- `pl` - Польский
- `ro` - Румынский
- `sv` - Шведский
- `th` - Тайский
- `tr` - Турецкий
- `uk` - Украинский
- `vi` - Вьетнамский

## 💻 Примеры интеграции

### JavaScript/Node.js
```javascript
const API_BASE = 'http://localhost:3002/api/csgo';

// Поиск скинов по имени
async function searchSkins(query, lang = 'en') {
  const response = await fetch(`${API_BASE}/search/skins/name?q=${query}&lang=${lang}`);
  return await response.json();
}

// Поиск скинов по коллекции
async function searchSkinsByCollection(collection, lang = 'en') {
  const response = await fetch(`${API_BASE}/search/skins/collection?collection=${collection}&lang=${lang}`);
  return await response.json();
}

// Поиск скинов по кейсу
async function searchSkinsByCrate(crate, lang = 'en') {
  const response = await fetch(`${API_BASE}/search/skins/crate?crate=${crate}&lang=${lang}`);
  return await response.json();
}

// Поиск по цене
async function searchByPrice(min, max, type = 'skins', lang = 'en') {
  const response = await fetch(`${API_BASE}/search/price?min=${min}&max=${max}&type=${type}&lang=${lang}`);
  return await response.json();
}

// Поиск по команде
async function searchByTeam(team, type = 'stickers', lang = 'en') {
  const response = await fetch(`${API_BASE}/search/team?team=${team}&type=${type}&lang=${lang}`);
  return await response.json();
}

// Поиск по турниру
async function searchByTournament(tournament, type = 'stickers', lang = 'en') {
  const response = await fetch(`${API_BASE}/search/tournament?tournament=${tournament}&type=${type}&lang=${lang}`);
  return await response.json();
}

// Глобальный поиск
async function globalSearch(query, types = 'skins', lang = 'en') {
  const response = await fetch(`${API_BASE}/search/global?q=${query}&types=${types}&lang=${lang}`);
  return await response.json();
}

// Комплексный поиск по всем полям
async function comprehensiveSearch(query, fields = 'name,description,weapon,pattern', lang = 'en') {
  const response = await fetch(`${API_BASE}/search/comprehensive?q=${query}&fields=${fields}&lang=${lang}`);
  return await response.json();
}

// Получение детальной информации о скине
async function getSkinDetails(skinId, lang = 'en') {
  const response = await fetch(`${API_BASE}/skins/${skinId}/details?lang=${lang}`);
  return await response.json();
}

// Получение скинов с пагинацией
async function getSkinsPaginated(page = 1, pageSize = 20, lang = 'en') {
  const response = await fetch(`${API_BASE}/skins?page=${page}&pageSize=${pageSize}&lang=${lang}`);
  return await response.json();
}

// Навигация по страницам
async function navigateSkins() {
  // Первая страница (20 скинов)
  const page1 = await getSkinsPaginated(1, 20, 'en');
  console.log(`Страница 1: ${page1.data.length} скинов`);
  console.log(`Всего страниц: ${page1.pagination.totalPages}`);
  console.log(`Всего скинов: ${page1.pagination.total}`);
  
  // Следующая страница
  if (page1.pagination.hasNext) {
    const page2 = await getSkinsPaginated(2, 20, 'en');
    console.log(`Страница 2: ${page2.data.length} скинов`);
    console.log(`Есть предыдущая: ${page2.pagination.hasPrevious}`);
  }
  
  // Последняя страница
  const lastPage = await getSkinsPaginated(page1.pagination.totalPages, 20, 'en');
  console.log(`Последняя страница: ${lastPage.pagination.page}`);
  console.log(`Есть следующая: ${lastPage.pagination.hasNext}`);
}

// Использование
async function example() {
  // Поиск скинов AK
  const akSkins = await searchSkins('AK', 'en');
  console.log(`Найдено ${akSkins.total} скинов AK`);

  // Поиск скинов из коллекции Revolution
  const revolutionSkins = await searchSkinsByCollection('Revolution', 'en');
  console.log(`Найдено ${revolutionSkins.total} скинов из коллекции Revolution`);

  // Поиск дорогих скинов
  const expensiveSkins = await searchByPrice(20, 100, 'skins', 'en');
  console.log(`Найдено ${expensiveSkins.total} дорогих скинов`);

  // Поиск наклеек команды Natus Vincere
  const naviStickers = await searchByTeam('Natus', 'stickers', 'en');
  console.log(`Найдено ${naviStickers.total} наклеек Na'Vi`);

  // Глобальный поиск
  const globalResults = await globalSearch('Dragon', 'skins,stickers', 'en');
  console.log(`Глобальный поиск: ${globalResults.total} результатов`);

  // Комплексный поиск по всем полям
  const comprehensiveResults = await comprehensiveSearch('AK', 'name,weapon,pattern,team', 'en');
  console.log(`Комплексный поиск: ${comprehensiveResults.total} результатов`);
  console.log(`Статистика: ${comprehensiveResults.search_stats.match_percentage}% совпадений`);

  // Комплексный поиск по командам и турнирам
  const teamResults = await comprehensiveSearch('Natus', 'team,tournament', 'en');
  console.log(`Поиск по командам: ${teamResults.total} результатов`);

  // Комплексный поиск по паттернам и оружию
  const patternResults = await comprehensiveSearch('Dragon', 'name,weapon,pattern', 'en');
  console.log(`Поиск по паттернам: ${patternResults.total} результатов`);

  // Получение детальной информации о скине
  const skinDetails = await getSkinDetails('skin-vanilla-weapon_knife_css', 'en');
  console.log(`Скин: ${skinDetails.details.name}`);
  console.log(`Оружие: ${skinDetails.details.weapon.name}`);
  console.log(`Редкость: ${skinDetails.details.rarity.name}`);
}
```

## 🛠️ Управление кэшем

### Статистика кэша
```http
GET /cache/stats
```

### Валидация целостности
```http
GET /cache/validate
```

### Очистка кэша
```http
GET /cache/clear
```

## 📋 Структура ответов

### Примеры ответов

#### Поиск скинов
```json
{
  "query": "AK",
  "language": "en",
  "limit": 10,
  "total": 15,
  "results": [
    {
      "id": "skin-vanilla-weapon_knife_css",
      "name": "★ Classic Knife",
      "description": "The Classic Knife is a CS:S classic...",
      "weapon": {
        "id": "sfui_wpnhud_knifecss",
        "weapon_id": 504,
        "name": "Classic Knife"
      },
      "rarity": {
        "id": "rarity_ancient_weapon",
        "name": "Covert",
        "color": "#eb4b4b"
      }
    }
  ]
}
```

#### Поиск наклеек
```json
{
  "query": "Dragon",
  "language": "en",
  "limit": 10,
  "total": 8,
  "results": [
    {
      "id": "collectible-948",
      "name": "Dragon Lore",
      "description": "A legendary dragon sticker...",
      "rarity": {
        "id": "rarity_ancient",
        "name": "Covert",
        "color": "#eb4b4b"
      }
    }
  ]
}
```

#### Детали скина
```json
{
  "skin_id": "skin-vanilla-weapon_knife_css",
  "language": "en",
  "details": {
    "id": "skin-vanilla-weapon_knife_css",
    "name": "★ Classic Knife",
    "description": "The Classic Knife is a CS:S classic...",
    "weapon": {
      "id": "sfui_wpnhud_knifecss",
      "weapon_id": 504,
      "name": "Classic Knife"
    },
    "collections": [
      {
        "id": "collection-community-24",
        "name": "CS20 Collection",
        "rarity": {
          "id": "rarity_ancient",
          "name": "Covert",
          "color": "#eb4b4b"
        }
      }
    ],
    "crates": [
      {
        "id": "crate-4669",
        "name": "CS20 Case",
        "rarity": {
          "id": "rarity_ancient",
          "name": "Covert",
          "color": "#eb4b4b"
        }
      }
    ]
  }
}
```

### Поиск по коллекции
```json
{
  "collection": "Revolution",
  "language": "en",
  "limit": 10,
  "total": 8,
  "results": [
    {
      "id": "skin-456",
      "name": "AK-47 | Revolution",
      "weapon": { "name": "AK-47" },
      "pattern": { "name": "Revolution" },
      "rarity": { "name": "Classified" }
    }
  ]
}
```

### Глобальный поиск
```json
{
  "query": "Dragon",
  "item_types": ["skins", "stickers"],
  "language": "en",
  "limit": 50,
  "total_by_type": [
    { "type": "skins", "count": 15 },
    { "type": "stickers", "count": 8 }
  ],
  "total": 23,
  "results": {
    "skins": [...],
    "stickers": [...]
  }
}
```

### Комплексный поиск
```json
{
  "query": "AK",
  "language": "en",
  "limit": 50,
  "fields_searched": ["name", "weapon", "pattern", "team"],
  "total": 25,
  "search_stats": {
    "total_items_searched": 50000,
    "items_with_matches": 25,
    "match_percentage": 0.05,
    "fields_searched": ["name", "weapon", "pattern", "team"]
  },
  "results_by_type": {
    "skins": [
      {
        "id": "skin-123",
        "name": "AK-47 | Searing Rage",
        "weapon": { "name": "AK-47" },
        "pattern": { "name": "Searing Rage" },
        "match_field": ["name", "weapon"],
        "match_score": 180
      }
    ],
    "stickers": [
      {
        "id": "sticker-456",
        "name": "Sticker | AK-47 | Katowice 2014",
        "match_field": ["name"],
        "match_score": 100
      }
    ]
  },
  "results": [
    {
      "id": "skin-123",
      "name": "AK-47 | Searing Rage",
      "item_type": "skins",
      "match_field": ["name", "weapon"],
      "match_score": 180
    }
  ]
}
```

### Детали скина
```json
{
  "skin_id": "skin-123",
  "language": "en",
  "details": {
    "id": "skin-123",
    "name": "AK-47 | Searing Rage (Factory New)",
    "weapon": { "name": "AK-47" },
    "pattern": { "name": "Searing Rage" },
    "rarity": { "name": "Classified" },
    "collections": [...],
    "crates": [...],
    "collection_details": [...],
    "crate_details": [...],
    "market_info": {...},
    "related_items": [...]
  }
}
```

### Получение данных

#### Скины (Skins)
```bash
# Получить все скины с пагинацией (по умолчанию: страница 1, размер 20)
GET /api/csgo/skins?lang=en&page=1&pageSize=20

# Получить скины с кастомными параметрами пагинации
GET /api/csgo/skins?lang=en&page=2&pageSize=10

# Получить детальную информацию о скине
GET /api/csgo/skins/:id/details?lang=en
```

**Параметры пагинации:**
- `page` - номер страницы (по умолчанию: 1)
- `pageSize` - размер страницы (по умолчанию: 20, максимум: 100)
- `lang` - язык (по умолчанию: en)

**Пример ответа с пагинацией:**
```json
{
  "data": [
    {
      "id": "skin-e757fd7191f9",
      "name": "★ Hand Wraps | Spruce DDPAT",
      "weapon": { "name": "Hand Wraps" },
      "rarity": { "name": "Extraordinary", "color": "#eb4b4b" }
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 1996,
    "totalPages": 100,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

## ⚡ Особенности API

- **Кэширование**: TTL 5 минут для высокой производительности
- **Хеширование**: SHA-256 для проверки целостности данных
- **Расширенный поиск**: 15+ различных критериев поиска
- **Мультиязычность**: 28 поддерживаемых языков
- **Детальная информация**: Полная информация о коллекциях, кейсах и связанных предметах
- **Retry механизм**: Автоматические повторные попытки при ошибках
- **Валидация**: Проверка параметров и обработка ошибок
- **Глобальный поиск**: Поиск по всем типам предметов одновременно

## 🚨 Обработка ошибок

API возвращает стандартные HTTP статус коды:

- `200` - Успешный запрос
- `400` - Неверный запрос (отсутствуют обязательные параметры)
- `404` - Ресурс не найден
- `500` - Внутренняя ошибка сервера

**Пример ошибки:**
```json
{
  "statusCode": 400,
  "message": "Search query is required"
}
```

## 🔧 Настройка

### Переменные окружения
- `PORT` - Порт сервера (по умолчанию: 3002)

### Изменение порта
```bash
PORT=3001 npm run start:dev
```

## 🤝 Поддержка

При возникновении проблем:

1. Проверьте, что сервер запущен на порту 3002
2. Убедитесь, что внешний CS:GO API доступен
3. Проверьте корректность параметров запроса
4. Очистите кэш при необходимости: `/cache/clear`

## 📊 Статистика данных

| Тип данных | Количество элементов |
|------------|---------------------|
| Скины | ~2,000 |
| Скины без группировки | ~15,000 |
| Наклейки | ~8,850 |
| Брелоки | ~525 |
| Коллекции | ~98 |
| Кейсы | ~445 |
| Ключи | ~39 |
| Коллекционные предметы | ~555 |
| Агенты | ~63 |
| Патчи | ~112 |
| Граффити | ~2,045 |
| Музыкальные наборы | ~177 |
| Базовое оружие | ~67 |
| Хайлайты | ~492 |

---

**Готово! Теперь вы можете использовать этот API в своих проектах.** 🎯

## 📋 Типы данных и структуры

### Основные типы предметов

#### Скины (Skins)
```typescript
interface Skin {
  id: string;
  name: string;
  description: string;
  weapon: {
    id: string;
    weapon_id: number;
    name: string;
  };
  category: {
    id: string;
    name: string;
  };
  pattern: {
    id: string;
    name: string;
  };
  min_float: number;
  max_float: number;
  wear: {
    id: string;
    name: string;
  };
  rarity: {
    id: string;
    name: string;
    color: string;
  };
  stattrak: boolean;
  souvenir: boolean;
  paint_index: string;
  image: string;
  collections: Collection[];
  crates: Crate[];
  team?: {
    id: string;
    name: string;
  };
}
```

#### Наклейки (Stickers)
```typescript
interface Sticker {
  id: string;
  name: string;
  description: string;
  rarity: {
    id: string;
    name: string;
    color: string;
  };
  tournament_event: string;
  tournament_team: string;
  type: string;
  image: string;
  crates: Crate[];
}
```

#### Агенты (Agents)
```typescript
interface Agent {
  id: string;
  name: string;
  description: string;
  rarity: {
    id: string;
    name: string;
    color: string;
  };
  team: {
    id: string;
    name: string;
  };
  collections: Collection[];
  image: string;
  model_player: string;
}
```

#### Кейсы (Crates)
```typescript
interface Crate {
  id: string;
  name: string;
  description: string;
  rarity: {
    id: string;
    name: string;
    color: string;
  };
  key: Key;
  image: string;
  items: any[];
}
```

#### Коллекции (Collections)
```typescript
interface Collection {
  id: string;
  name: string;
  description: string;
  rarity: {
    id: string;
    name: string;
    color: string;
  };
  image: string;
  items: any[];
}
```

### Типы поиска

#### Результат поиска
```typescript
interface SearchResult {
  query: string;
  language: string;
  limit: number;
  total: number;
  results: any[];
}
```

#### Результат комплексного поиска
```typescript
interface ComprehensiveSearchResult {
  query: string;
  language: string;
  limit: number;
  fields_searched: string[];
  total: number;
  search_stats: {
    total_items_searched: number;
    items_with_matches: number;
    match_percentage: number;
    fields_searched: string[];
  };
  results_by_type: {
    [key: string]: any[];
  };
  results: Array<{
    ...any;
    item_type: string;
    match_field: string[];
    match_score: number;
  }>;
}
```

#### Детали скина
```typescript
interface SkinDetails {
  skin_id: string;
  language: string;
  details: {
    ...Skin;
    collection_details: Collection[];
    crate_details: Crate[];
    market_info: any;
    related_items: any[];
  };
}
```

### Поддерживаемые языки
```typescript
type SupportedLanguage = 
  | 'en' | 'ru' | 'de' | 'fr' | 'es-ES' | 'es-MX' 
  | 'pt-BR' | 'pt-PT' | 'it' | 'ja' | 'ko' 
  | 'zh-CN' | 'zh-TW' | 'bg' | 'cs' | 'da' 
  | 'el' | 'fi' | 'hu' | 'nl' | 'no' | 'pl' 
  | 'ro' | 'sv' | 'th' | 'tr' | 'uk' | 'vi';
```