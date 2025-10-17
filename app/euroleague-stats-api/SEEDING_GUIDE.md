# Euroleague API Seeding Guide

This guide explains how to use the comprehensive seeding system that fetches all available data from the Euroleague API and populates your database.

## Overview

The seeding service will:
- ✅ **Fetch data from seasons E2024 and E2025** (2023-24 and 2024-25)
- ✅ **Process all available games** until no more data is found
- ✅ **Create teams, players, and games** automatically
- ✅ **Populate comprehensive stats** (player stats, team stats, scoring events)
- ✅ **Handle API errors gracefully** with retry logic and rate limiting
- ✅ **Avoid duplicates** by checking existing data

## What Gets Seeded

### 1. Seasons
- E2024 (2023-24 Season)
- E2025 (2024-25 Season - Current)

### 2. Teams
- All Euroleague teams from both seasons
- Team codes and names extracted from game data

### 3. Players
- All players who participated in games
- Player codes, names extracted from boxscore data

### 4. Games
- Every available game from both seasons
- Game codes, scores, team assignments

### 5. Player Game Statistics
- Individual player performance per game
- Points, rebounds, assists, steals, blocks, etc.
- Minutes played, shooting percentages

### 6. Team Game Statistics
- Team performance per game
- Aggregated team stats from player data

### 7. Scoring Events
- Individual scoring plays from Points API
- Shot locations, shot types, game context

## Running the Seeding

### Method 1: Via API Endpoint (Recommended for Development)

1. **Start the application:**
```bash
npm run start:dev
```

2. **Trigger seeding via HTTP POST:**
```bash
# Using curl
curl -X POST http://localhost:3000/seed/initialize

# Using PowerShell
Invoke-RestMethod -Uri "http://localhost:3000/seed/initialize" -Method POST
```

### Method 2: Direct CLI Script

1. **Run the seeding script directly:**
```bash
npm run seed
```

2. **Or with built version:**
```bash
npm run seed:build
```

## Expected Output

The seeding process will show detailed progress:

```
🏀 Starting Euroleague API seeding process...
🔄 Initializing seasons...
✅ Created season: E2024
✅ Created season: E2025
📅 Processing season: E2024
🔍 Starting to fetch games for season E2024...
🏀 Processing game 1 for season E2024
✅ Created team: ANADOLU EFES ISTANBUL
✅ Created team: MACCABI RAPYD TEL AVIV
✅ Created player: SHANE LARKIN
✅ Created player: KAI JONES
✅ Successfully processed game 1
🏀 Processing game 2 for season E2024
...
🏆 Finished processing season E2024. Last game attempted: 245
📅 Processing season: E2025
...
✅ Seeding completed successfully!
```

## Performance & Duration

- **Total API calls**: ~600-800 calls (depending on available games)
- **Expected duration**: 15-30 minutes (with API delays)
- **Rate limiting**: 500ms delay between requests
- **Retry logic**: Up to 3 attempts per failed request
- **Stop condition**: 10 consecutive failures (no more games)

## Database Impact

The seeding will populate these tables:
- `seasons` - 2 records
- `teams` - ~18-24 teams
- `players` - ~400-500 players
- `games` - ~500-600 games
- `player_game_stats` - ~15,000-20,000 records
- `team_game_stats` - ~1,000-1,200 records
- `scoring_events` - ~50,000-100,000 records

## Safety Features

### Duplicate Prevention
- ✅ **Seasons**: Checked by season code
- ✅ **Teams**: Checked by team code
- ✅ **Players**: Checked by player code
- ✅ **Games**: Checked by game code + season
- ✅ **Stats**: Linked to unique games

### Error Handling
- ✅ **404 errors**: Game not found - skipped gracefully
- ✅ **406 errors**: Endpoint not accessible - logged and continued
- ✅ **Network errors**: Automatic retry with exponential backoff
- ✅ **Rate limiting**: Built-in delays to avoid API blocking

### Data Validation
- ✅ **Required fields**: All database constraints respected
- ✅ **Foreign keys**: Proper relationships maintained
- ✅ **Data types**: Correct type conversion from API

## Monitoring Progress

### Database Queries
Check progress with these SQL queries:

```sql
-- Check seasons
SELECT * FROM seasons;

-- Check teams count
SELECT COUNT(*) as team_count FROM teams;

-- Check games per season
SELECT s.ssn_name, COUNT(g.gm_id) as game_count 
FROM seasons s 
LEFT JOIN games g ON s.ssn_id = g.gm_fk_ssn_id 
GROUP BY s.ssn_id;

-- Check latest processed game
SELECT MAX(gm_code) as last_game_code, s.ssn_name 
FROM games g 
JOIN seasons s ON g.gm_fk_ssn_id = s.ssn_id 
GROUP BY s.ssn_id;

-- Check player stats count
SELECT COUNT(*) as player_stats_count FROM player_game_stats;

-- Check scoring events count
SELECT COUNT(*) as scoring_events_count FROM scoring_events;
```

### API Logs
Watch the application logs for detailed progress information.

## Resuming Interrupted Seeding

The seeding is **resume-safe**:
- ✅ **Existing data is skipped** - no duplicates created
- ✅ **Continues from where it left off** - checks existing games
- ✅ **Incremental processing** - adds only new data

You can safely stop and restart the seeding process at any time.

## Configuration

### Seasons to Process
Edit in `seed.service.ts`:
```typescript
private readonly SEASONS = ['E2024', 'E2025']; // Add more seasons as needed
```

### API Settings
Adjust rate limiting and timeouts:
```typescript
private readonly DELAY_BETWEEN_REQUESTS = 500; // 500ms delay
private readonly MAX_RETRIES = 3; // 3 attempts per request
```

### Stop Conditions
Configure when to stop looking for more games:
```typescript
const maxConsecutiveFailures = 10; // Stop after 10 consecutive failures
```

## Troubleshooting

### Common Issues

1. **"Connection refused"**
   - Check database is running
   - Verify database configuration in `.env`

2. **"Too many API calls"**
   - Increase `DELAY_BETWEEN_REQUESTS`
   - Reduce batch processing

3. **"Memory issues"**
   - Process fewer games at once
   - Restart seeding periodically

4. **"Network timeouts"**
   - Check internet connection
   - Increase timeout values

### Manual Cleanup
If you need to start fresh:

```sql
-- Warning: This will delete all seeded data
TRUNCATE TABLE scoring_events;
TRUNCATE TABLE player_game_stats;
TRUNCATE TABLE team_game_stats;
TRUNCATE TABLE games;
TRUNCATE TABLE players;
TRUNCATE TABLE teams;
TRUNCATE TABLE seasons;
```

## API Endpoints Used

The seeding uses these Euroleague API endpoints:
- **Boxscore**: `https://live.euroleague.net/api/Boxscore?gamecode={game}&seasoncode={season}`
- **Points**: `https://live.euroleague.net/api/Points?gamecode={game}&seasoncode={season}`

## Next Steps

After seeding completes:
1. ✅ **Verify data integrity** with the SQL queries above
2. ✅ **Create API endpoints** to serve the seeded data
3. ✅ **Add analytics features** using the comprehensive stats
4. ✅ **Set up scheduled updates** for ongoing season data

---

**🏀 Your Euroleague database is now ready for analytics and API development!**