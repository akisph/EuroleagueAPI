# Euroleague API Reverse Engineering

🏀 Complete reverse engineering suite for all Euroleague API endpoints with automatic schema generation.

## Overview

This project provides a comprehensive toolkit for reverse engineering and working with the Euroleague Basketball API. It automatically discovers API structures, generates validation schemas, creates TypeScript DTOs, and provides testing tools for seamless integration.

## Key Features

- **Automatic Data Discovery**: Fetches real game data from multiple endpoints
- **Schema Generation**: Creates JSON schemas based on actual API responses
- **TypeScript Support**: Generates NestJS DTOs with validation decorators
- **Testing Tools**: Provides Postman test collections for API validation
- **Production Ready**: Includes error handling, rate limiting, and retry logic

## 📁 Project Structure

```
EuroleagueAPI/
├── Boxscore/                    # Box score data endpoint
│   ├── samples/                 # JSON sample files from real games
│   ├── euroleague-boxscore-schema.json    # Generated JSON schema
│   ├── euroleague-boxscore.dto.ts         # NestJS DTO classes
│   ├── postman-tests.js                   # Postman validation tests
│   └── generate-schema.js                 # Schema generation script
├── PlaybyPlay/                  # Play-by-play data endpoint
│   ├── samples/                 # Real game play-by-play data
│   ├── euroleague-playbyplay-schema.json  # Generated JSON schema
│   ├── euroleague-playbyplay.dto.ts       # NestJS DTO classes
│   ├── postman-tests.js                   # Postman validation tests
│   └── generate-schema.js                 # Schema generation script
├── Points/                      # Points scoring data endpoint
│   ├── samples/                 # Scoring events data
│   ├── euroleague-points-schema.json      # Generated JSON schema
│   └── generate-schema.js                 # Schema generation script
├── fetch_all_endpoints.js       # Master data collection script
├── generate_all_schemas.js      # Master schema generation script
├── README.md                    # This documentation
└── FINAL_REPORT.md             # Comprehensive project report
```

## 🚀 Quick Start

### Prerequisites
- Node.js v18+ (for built-in fetch support)
- Internet connection for API access

### 1. Data Collection from All Endpoints

```bash
node fetch_all_endpoints.js
```

This will:
- Download data from all 3 API endpoints
- Create samples folders for each endpoint
- Save JSON files with data from real games
- Handle errors gracefully with retry logic
- Provide real-time progress tracking

### 2. Generate JSON Schemas

```bash
node generate_all_schemas.js
```

This will create for each endpoint with data:
- ✅ JSON Schema file for validation
- ✅ NestJS DTO classes with decorators
- ✅ Postman validation test collections

## 📊 Available Endpoints

| Endpoint | URL | Description | Status |
|----------|-----|-------------|--------|
| **Boxscore** | `/api/Boxscore` | Complete box score with player & team statistics | ✅ Working |
| **PlaybyPlay** | `/api/PlaybyPlay` | Detailed play-by-play game action recording | ✅ Working |
| **Points** | `/api/Points` | Scoring events data with timestamps & court zones | ✅ Working |

### API Base URL
```
https://live.euroleague.net/api/{endpoint}?gamecode={gamecode}&seasoncode={seasoncode}
```

### Parameters
- `gamecode`: Game identifier (1-306 for full season)
- `seasoncode`: Season identifier (e.g., "E2025" for 2024-25 season)

## 🔧 Configuration

### Basic Configuration

Edit the main scripts to configure your data collection:

```javascript
// fetch_all_endpoints.js
const seasoncode = "E2025";  // Current season
const gamecodes = Array.from({length: 50}, (_, i) => i + 1); // First 50 games

// For full season:
const gamecodes = Array.from({length: 306}, (_, i) => i + 1); // All 306 games

// For specific games:
const gamecodes = [1, 5, 10, 15, 20]; // Custom selection
```

### Rate Limiting Settings

```javascript
// Recommended delays to avoid API blocking
const DELAYS = {
  betweenRequests: 200,    // 200ms between endpoint calls
  betweenGames: 1000,      // 1 second between games
  retryDelay: 2000         // 2 seconds before retry
};
```

## 📝 Usage Examples

### NestJS Controller with Validation

```typescript
import { EuroleagueBoxscoreDto } from './Boxscore/euroleague-boxscore.dto';

@Controller('euroleague')
export class EuroleagueController {
  @Post('validate-boxscore')
  async validateBoxscore(@Body() boxscore: EuroleagueBoxscoreDto) {
    // Automatic validation happens with decorators!
    return { 
      message: 'Valid boxscore data!', 
      playerCount: boxscore.Stats[0].PlayersStats.length 
    };
  }
}
```

### JSON Schema Validation

```javascript
import Ajv from 'ajv';
import schema from './Boxscore/euroleague-boxscore-schema.json';

const ajv = new Ajv();
const validate = ajv.compile(schema);

const isValid = validate(yourBoxscoreData);
if (!isValid) {
  console.log('Validation errors:', validate.errors);
}
```

### Postman Testing

1. Copy content from `{endpoint}/postman-tests.js`
2. Paste in "Tests" tab of your Postman request
3. Make request to: `https://live.euroleague.net/api/{endpoint}?gamecode=1&seasoncode=E2025`
4. See automatic validation results

## 🎯 Features

### Comprehensive Data Analysis
- ✅ Real data from actual games
- ✅ Automatic pattern detection
- ✅ Enum generation from actual values
- ✅ Type inference and validation rules

### Multiple Output Formats
- 🔧 **JSON Schema** - for universal validation
- 🏗️ **NestJS DTOs** - for TypeScript APIs
- 🧪 **Postman Tests** - for API testing
- 📚 **Documentation** - with examples and descriptions

### Production Ready
- ⚡ Error handling with retries
- 🔄 Rate limiting for API protection  
- 📊 Progress tracking and statistics
- 🎯 Modular structure per endpoint

## 🚦 Rate Limiting & Best Practices

### Recommended Settings
```javascript
// Delay between requests
await new Promise(r => setTimeout(r, 500)); // 500ms delay

// Batch processing
const batchSize = 10; // 10 games at a time

// Retry logic
const retries = 3; // 3 attempts per request
```

### Respect API Limits
- 🚫 Don't make too many concurrent requests
- ⏱️ Use delays between requests
- 🔄 Implement exponential backoff for failed requests

## 📈 Monitoring & Debugging

### View Progress
Scripts show real-time progress:
```
🏀 Processing gamecode 15...
✓ Boxscore - Gamecode 15: Saved
✓ PlaybyPlay - Gamecode 15: Saved  
❌ Points - Gamecode 15: Failed (404)
```

### Check Results
```bash
# See how many files were collected
ls -la */samples/

# Run validation on specific endpoint
cd Boxscore && node generate-schema.js
cd PlaybyPlay && node generate-schema.js
cd Points && node generate-schema.js
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Add new endpoints or improvements
4. Submit pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🏀 Euroleague Data

All data comes from the official Euroleague API:
- 🌐 **API Base**: `https://live.euroleague.net/api/`
- 📚 **Documentation**: https://api-live.euroleague.net/swagger/index.html
- 🔗 **Season Code**: E2025 (2024-25 season)

## 📖 Complete Documentation

For detailed instructions, troubleshooting, and advanced usage, see:
- **[COMPLETE_DOCUMENTATION.md](./COMPLETE_DOCUMENTATION.md)** - Comprehensive guide with examples
- **[FINAL_REPORT.md](./FINAL_REPORT.md)** - Project summary and results

---

<div align="center">
  <strong>🏆 Built for Basketball Analytics & API Integration</strong>
</div>