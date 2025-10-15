# Euroleague API Reverse Engineering - Complete Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Installation & Setup](#installation--setup)
3. [Core Scripts](#core-scripts)
4. [Endpoints Documentation](#endpoints-documentation)
5. [Schema Generation](#schema-generation)
6. [Usage Examples](#usage-examples)
7. [API Integration](#api-integration)
8. [Troubleshooting](#troubleshooting)

## 🎯 Project Overview

This project provides a comprehensive reverse engineering solution for the Euroleague Basketball API. It automatically:

- **Discovers API structures** by fetching real game data
- **Generates JSON schemas** for validation
- **Creates TypeScript DTOs** for NestJS integration
- **Provides testing tools** for Postman validation
- **Handles errors gracefully** with retry logic and rate limiting

### Key Benefits
- ✅ **Production Ready**: Complete error handling and validation
- 🔧 **Developer Friendly**: TypeScript support with full IntelliSense
- 📊 **Data Science Ready**: Structured data for analytics
- 🧪 **Testing Ready**: Automated validation with Postman
- 🚀 **Scalable**: Modular design for easy extension

## 🛠️ Installation & Setup

### Prerequisites
```bash
# Node.js version 18 or higher (for built-in fetch support)
node --version  # Should be v18.0.0 or higher

# Internet connection for API access
# No API key required for basic endpoints
```

### Project Setup
```bash
# Clone or download the project
# Navigate to project directory
cd EuroleagueAPI

# No npm install required - uses built-in Node.js modules
```

### File Permissions
```bash
# Ensure scripts are executable (Unix/Linux/Mac)
chmod +x *.js

# Windows - no additional setup required
```

## 🚀 Core Scripts

### 1. `fetch_all_endpoints.js` - Master Data Collector

**Purpose**: Downloads real game data from all Euroleague API endpoints

**Command**:
```bash
node fetch_all_endpoints.js
```

**Configuration Options**:
```javascript
// Season configuration
const seasoncode = "E2025";  // 2024-25 season

// Game range options:
const gamecodes = Array.from({length: 50}, (_, i) => i + 1);   // First 50 games (testing)
const gamecodes = Array.from({length: 306}, (_, i) => i + 1);  // Full season (production)
const gamecodes = [1, 5, 10, 15, 20];                         // Specific games
```

**What it does**:
1. Creates `samples/` folders for each endpoint
2. Fetches data from 6 different API endpoints
3. Saves JSON files with naming convention: `{endpoint}_{gamecode}_{season}.json`
4. Provides real-time progress tracking
5. Handles errors with automatic retries
6. Applies rate limiting to avoid API blocking

**Output Example**:
```
🚀 Starting Euroleague API data collection...

📊 Configuration:
   Season: E2025
   Games: 50 (1 to 50)
   Endpoints: 6
   Total requests: 300

🏀 Processing gamecode 1...
✓ Boxscore - Gamecode 1: Saved
✓ PlaybyPlay - Gamecode 1: Saved
✓ Points - Gamecode 1: Saved
❌ Boxscore - Failed gamecode 1 after 3 attempts
```

**Error Handling**:
- **404 errors**: Game not found - automatically skipped
- **406 errors**: Endpoint not accessible - logged but continues
- **Network errors**: Automatic retry with exponential backoff
- **Rate limiting**: Built-in delays between requests

### 2. `generate_all_schemas.js` - Master Schema Generator

**Purpose**: Runs schema generation for all endpoints with collected data

**Command**:
```bash
node generate_all_schemas.js
```

**What it does**:
1. Scans all endpoint folders for sample data
2. Runs individual `generate-schema.js` scripts
3. Creates JSON schemas, TypeScript DTOs, and Postman tests
4. Provides summary statistics of generation results

**Output Files Per Endpoint**:
- `euroleague-{endpoint}-schema.json` - JSON Schema for validation
- `euroleague-{endpoint}.dto.ts` - NestJS DTO classes
- `postman-tests.js` - Postman test collection

**Output Example**:
```
🚀 Generating all JSON Schemas...

📊 Endpoints: Boxscore, PlaybyPlay, Points

🔄 Generating schema for Boxscore...
🏀 Generating Euroleague Boxscore JSON Schema...
✅ Boxscore schema generated successfully
```

## 📡 Endpoints Documentation

### Working Endpoints (✅ Functional)

#### 1. Boxscore Endpoint
**URL**: `https://live.euroleague.net/api/Boxscore?gamecode={gamecode}&seasoncode={seasoncode}`

**Description**: Complete box score with player and team statistics

**Data Structure**:
```json
{
  "Live": false,
  "Referees": "JAVOR, DAMIR, ALIAGA, JORDI, GIOVANNETTI, GUIDO",
  "Attendance": "2110",
  "ByQuarter": [
    {
      "Team": "ANADOLU EFES ISTANBUL",
      "Quarter1": 21,
      "Quarter2": 19,
      "Quarter3": 20,
      "Quarter4": 25
    }
  ],
  "Stats": [
    {
      "Team": "ANADOLU EFES ISTANBUL",
      "Coach": "KOKOSKOV, IGOR",
      "PlayersStats": [
        {
          "Player_ID": "P007200   ",
          "Player": "LARKIN, SHANE",
          "Points": 14,
          "Minutes": "33:21"
        }
      ]
    }
  ]
}
```

**Key Features**:
- Individual player statistics
- Team totals and rebounds
- Quarter-by-quarter scoring
- Coach and referee information
- Attendance figures

#### 2. PlaybyPlay Endpoint
**URL**: `https://live.euroleague.net/api/PlaybyPlay?gamecode={gamecode}&seasoncode={seasoncode}`

**Description**: Detailed play-by-play game action recording

**Data Structure**:
```json
{
  "Live": false,
  "TeamA": "Anadolu Efes Istanbul",
  "TeamB": "Maccabi Rapyd Tel Aviv",
  "FirstQuarter": [
    {
      "NUMBEROFPLAY": 4,
      "CODETEAM": "IST       ",
      "PLAYER_ID": "P014102   ",
      "PLAYTYPE": "2FGM",
      "PLAYER": "JONES, KAI",
      "MINUTE": 1,
      "MARKERTIME": "09:39",
      "POINTS_A": 2,
      "POINTS_B": 0
    }
  ]
}
```

**Key Features**:
- Chronological play sequence
- Player actions with timestamps
- Score progression
- Play types (shots, fouls, timeouts, etc.)
- Quarter-based organization

#### 3. Points Endpoint
**URL**: `https://live.euroleague.net/api/Points?gamecode={gamecode}&seasoncode={seasoncode}`

**Description**: Scoring events with timestamps and court zones

**Data Structure**:
```json
{
  "Rows": [
    {
      "ID_PLAYER": "P014102   ",
      "PLAYER": "JONES, KAI",
      "ID_ACTION": "2FGM",
      "ACTION": "Two Pointer",
      "POINTS": 2,
      "COORD_X": -12,
      "COORD_Y": -6,
      "ZONE": "A",
      "MINUTE": 1,
      "CONSOLE": "09:39",
      "UTC": "20250930174549"
    }
  ]
}
```

**Key Features**:
- Court coordinates for shots
- Shot zones and types
- Precise timestamps
- Fast break and second chance indicators
- Points off turnovers tracking

### Limited Endpoints (❌ 406 Errors)

#### 4. ShotData Endpoint
## 🏗️ Schema Generation

### Individual Schema Generation

Each endpoint has its own `generate-schema.js` script:

```bash
# Generate schema for specific endpoint
cd Boxscore
node generate-schema.js

cd ../PlaybyPlay
node generate-schema.js

cd ../Points
node generate-schema.js
```

### Schema Generation Process

1. **Data Analysis**:
   - Reads all JSON files in `samples/` folder
   - Analyzes data structures and types
   - Extracts unique values for enums
   - Identifies patterns and constraints

2. **Schema Creation**:
   - Generates JSON Schema Draft-07 compliant schemas
   - Includes validation rules and patterns
   - Adds descriptions and examples
   - Creates nested object definitions

3. **DTO Generation**:
   - Creates TypeScript classes with decorators
   - Adds class-validator decorators for validation
   - Includes class-transformer decorators for serialization
   - Provides complete type safety

4. **Test Generation**:
   - Creates Postman test collections
   - Includes validation for all fields
   - Tests data types and formats
   - Validates enum values and patterns

### Schema Features

**JSON Schema Capabilities**:
- Type validation (string, number, boolean, array, object)
- Pattern matching with regex
- Enum validation for known values
- Required field enforcement
- Nested object validation
- Array item validation

**NestJS DTO Features**:
```typescript
export class PlayerStatsDto {
  @IsString()
  @Matches(/^P\d{6}\s*$/)
  Player_ID: string;

  @IsInt()
  @Min(0)
  Points: number;

  @IsOptional()
  @Matches(/^(\d{1,2}:\d{2}|DNP)$/)
  Minutes?: string | null;
}
```

## 💻 Usage Examples

### 1. NestJS Integration

```typescript
// app.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { EuroleagueBoxscoreDto } from './boxscore/euroleague-boxscore.dto';

@Controller('euroleague')
export class EuroleagueController {
  @Post('validate-boxscore')
  async validateBoxscore(@Body() boxscore: EuroleagueBoxscoreDto) {
    // Automatic validation happens here!
    return {
      success: true,
      message: 'Valid boxscore data',
      playerCount: boxscore.Stats[0].PlayersStats.length
    };
  }

  @Post('analyze-playbyplay')
  async analyzePlaybyPlay(@Body() playbyplay: EuroleaguePlaybyPlayDto) {
    const totalPlays = playbyplay.FirstQuarter.length +
                      playbyplay.SecondQuarter.length +
                      playbyplay.ThirdQuarter.length +
                      playbyplay.FourthQuarter.length;
    
    return { totalPlays, quarters: 4 };
  }
}
```

### 2. JSON Schema Validation

```javascript
// validation.js
import Ajv from 'ajv';
import boxscoreSchema from './Boxscore/euroleague-boxscore-schema.json';
import playbyplaySchema from './PlaybyPlay/euroleague-playbyplay-schema.json';

const ajv = new Ajv();
const validateBoxscore = ajv.compile(boxscoreSchema);
const validatePlaybyPlay = ajv.compile(playbyplaySchema);

// Validate API response
function validateApiResponse(endpoint, data) {
  let validate;
  
  switch(endpoint) {
    case 'boxscore':
      validate = validateBoxscore;
      break;
    case 'playbyplay':
      validate = validatePlaybyPlay;
      break;
    default:
      throw new Error(`Unknown endpoint: ${endpoint}`);
  }
  
  const isValid = validate(data);
  
  if (!isValid) {
    console.error('Validation errors:', validate.errors);
    return false;
  }
  
  console.log('✅ Data is valid!');
  return true;
}

// Usage
fetch('https://live.euroleague.net/api/Boxscore?gamecode=1&seasoncode=E2025')
  .then(res => res.json())
  .then(data => validateApiResponse('boxscore', data));
```

### 3. Data Analysis with Validation

```javascript
// analytics.js
import fs from 'fs';
import path from 'path';

class EuroleagueAnalytics {
  constructor() {
    this.schemas = {
      boxscore: JSON.parse(fs.readFileSync('./Boxscore/euroleague-boxscore-schema.json')),
      playbyplay: JSON.parse(fs.readFileSync('./PlaybyPlay/euroleague-playbyplay-schema.json')),
      points: JSON.parse(fs.readFileSync('./Points/euroleague-points-schema.json'))
    };
  }

  analyzePlayerPerformance(boxscoreData) {
    // Validate first
    if (!this.validateData('boxscore', boxscoreData)) {
      throw new Error('Invalid boxscore data');
    }

    const playerStats = [];
    
    boxscoreData.Stats.forEach(teamStats => {
      teamStats.PlayersStats.forEach(player => {
        if (player.IsPlaying === 1) {
          playerStats.push({
            name: player.Player,
            team: player.Team,
            points: player.Points,
            efficiency: this.calculateEfficiency(player)
          });
        }
      });
    });

    return playerStats.sort((a, b) => b.efficiency - a.efficiency);
  }

  calculateEfficiency(player) {
    return (player.Points + player.TotalRebounds + player.Assistances) - 
           (player.Turnovers + player.FoulsCommited);
  }

  validateData(type, data) {
    const ajv = new Ajv();
    const validate = ajv.compile(this.schemas[type]);
    return validate(data);
  }
}

// Usage
const analytics = new EuroleagueAnalytics();
const gameData = JSON.parse(fs.readFileSync('./Boxscore/samples/boxscore_1_E2025.json'));
const topPlayers = analytics.analyzePlayerPerformance(gameData);
console.log('Top 5 performers:', topPlayers.slice(0, 5));
```

### 4. Postman Integration

**Step 1**: Copy test code from generated `postman-tests.js`
**Step 2**: Create new Postman request
**Step 3**: Paste code in "Tests" tab
**Step 4**: Run request

```javascript
// Example Postman test (from generated file)
pm.test("Response has valid JSON structure", function () {
    const jsonData = pm.response.json();
    
    // Basic structure validation
    pm.expect(jsonData).to.have.property('Live');
    pm.expect(jsonData).to.have.property('ByQuarter');
    pm.expect(jsonData).to.have.property('Stats');
});

pm.test("Player ID format validation", function () {
    const jsonData = pm.response.json();
    
    jsonData.Stats.forEach(teamStats => {
        teamStats.PlayersStats.forEach(player => {
            pm.expect(player.Player_ID).to.match(/^P\d{6}\s*$/);
        });
    });
});
```

## 🔧 API Integration

### Rate Limiting Best Practices

```javascript
// Recommended configuration
const CONFIG = {
  DELAY_BETWEEN_REQUESTS: 500,    // 500ms delay
  DELAY_BETWEEN_GAMES: 1000,      // 1 second between games
  MAX_RETRIES: 3,                 // Maximum retry attempts
  BATCH_SIZE: 10,                 // Process 10 games at once
  TIMEOUT: 30000                  // 30 second timeout
};

// Example rate-limited fetcher
class EuroleagueAPI {
  constructor(config = CONFIG) {
    this.config = config;
    this.requestCount = 0;
    this.startTime = Date.now();
  }

  async fetchWithRateLimit(url, retries = this.config.MAX_RETRIES) {
    // Track requests per minute
    this.requestCount++;
    const elapsed = Date.now() - this.startTime;
    const requestsPerMinute = (this.requestCount / elapsed) * 60000;
    
    if (requestsPerMinute > 60) { // Limit to 60 requests per minute
      await this.delay(1000);
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (compatible; EuroleagueAnalytics/1.0)'
          },
          signal: AbortSignal.timeout(this.config.TIMEOUT)
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        if (attempt === retries) throw error;
        await this.delay(1000 * attempt); // Exponential backoff
      }
    }
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### Error Handling Strategies

```javascript
// Comprehensive error handling
class APIErrorHandler {
  static handle(error, context = {}) {
    const { endpoint, gamecode, attempt } = context;
    
    switch(true) {
      case error.message.includes('404'):
        console.log(`⏭️  Game ${gamecode} not found - skipping`);
        return { status: 'skipped', reason: 'game_not_found' };
        
      case error.message.includes('406'):
        console.log(`❌ Endpoint ${endpoint} not accessible`);
        return { status: 'blocked', reason: 'endpoint_restricted' };
        
      case error.message.includes('429'):
        console.log(`⏰ Rate limited - waiting before retry`);
        return { status: 'retry', delay: 5000 };
        
      case error.name === 'AbortError':
        console.log(`⏱️  Request timeout for ${endpoint}`);
        return { status: 'timeout', reason: 'request_timeout' };
        
      default:
        console.error(`💥 Unexpected error:`, error.message);
        return { status: 'error', error: error.message };
    }
  }
}
```

## 🛠️ Troubleshooting

### Common Issues

#### 1. "Cannot find module" Error
```bash
# Make sure you're using Node.js 18+
node --version

# Update Node.js if necessary
# https://nodejs.org/
```

#### 2. "Permission denied" Error
```bash
# Unix/Linux/Mac
chmod +x *.js

# Windows - Run PowerShell as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### 3. Network/API Errors
```bash
# Check internet connection
ping euroleague.net

# Test API directly
curl "https://live.euroleague.net/api/Boxscore?gamecode=1&seasoncode=E2025"
```

#### 4. No Sample Data Generated
- Check if games exist for the specified season/gamecodes
- Verify the season code (E2025 for 2024-25 season)
- Try with smaller gamecode ranges first
- Check console output for specific error messages

#### 5. Schema Generation Fails
```bash
# Check if samples folder exists and has JSON files
ls -la */samples/

# Verify JSON file validity
node -e "console.log(JSON.parse(require('fs').readFileSync('./Boxscore/samples/boxscore_1_E2025.json')))"
```

### Performance Optimization

#### 1. Reduce Memory Usage
```javascript
// Process games in smaller batches
const BATCH_SIZE = 5; // Instead of 50

// Clear data after processing
allData = null;
gc(); // If --expose-gc flag is used
```

#### 2. Faster Processing
```javascript
// Use parallel processing for independent operations
const promises = gamecodes.slice(0, 10).map(gamecode => 
  fetchEndpointData(endpoint, gamecode)
);
const results = await Promise.allSettled(promises);
```

#### 3. Disk Space Management
```bash
# Check sample file sizes
du -sh */samples/

# Clean up if needed
find . -name "*.json" -size +1M
```

### Debugging Tips

#### 1. Verbose Logging
```javascript
// Add to any script for detailed logging
const DEBUG = process.env.DEBUG === 'true';

function debugLog(...args) {
  if (DEBUG) console.log('[DEBUG]', ...args);
}

// Usage
DEBUG=true node fetch_all_endpoints.js
```

#### 2. Request Inspection
```javascript
// Add to fetch calls for request debugging
const response = await fetch(url, {
  headers: {
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0 (compatible; EuroleagueAnalytics/1.0)'
  }
});

console.log('Request URL:', url);
console.log('Response Status:', response.status);
console.log('Response Headers:', Object.fromEntries(response.headers));
```

#### 3. Data Validation
```javascript
// Validate JSON before saving
function validateJsonData(data, filename) {
  try {
    JSON.stringify(data);
    if (typeof data !== 'object' || data === null) {
      throw new Error('Data is not an object');
    }
    return true;
  } catch (error) {
    console.error(`Invalid JSON data in ${filename}:`, error.message);
    return false;
  }
}
```

### Support and Resources

- **Official Euroleague API**: https://api-live.euroleague.net/swagger/index.html
- **JSON Schema Documentation**: https://json-schema.org/
- **NestJS Validation**: https://docs.nestjs.com/techniques/validation
- **Postman Testing**: https://learning.postman.com/docs/writing-scripts/test-scripts/

---

<div align="center">
<strong>🏀 Complete Euroleague API Documentation</strong><br>
<em>Ready for Production • Development • Analytics</em>
</div>