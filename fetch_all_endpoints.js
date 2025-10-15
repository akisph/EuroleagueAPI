// fetch_all_endpoints.js
// Master script for all Euroleague API endpoints data collection
import fs from 'fs';
import path from 'path';

// Configuration
const seasoncode = "E2025";
const gamecodes = Array.from({length: 50}, (_, i) => i + 1); // First 50 games for testing
// For full season use: Array.from({length: 306}, (_, i) => i + 1);

// API Endpoints configuration
const endpoints = [
  {
    name: 'Boxscore',
    url: 'https://live.euroleague.net/api/Boxscore',
    description: 'Box score data with player and team statistics'
  },
  {
    name: 'PlaybyPlay',
    url: 'https://live.euroleague.net/api/PlaybyPlay',
    description: 'Play-by-play data with detailed action recording'
  },
  {
    name: 'Points',
    url: 'https://live.euroleague.net/api/Points',
    description: 'Scoring data with timestamps and shot zones'
  }
];

// Create directories for each endpoint
function createDirectories() {
  endpoints.forEach(endpoint => {
    const dir = path.resolve(`./${endpoint.name}/samples`);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

// Fetch data from specific endpoint with retry logic
async function fetchEndpointData(endpoint, gamecode, retries = 3) {
  const url = `${endpoint.url}?gamecode=${gamecode}&seasoncode=${seasoncode}`;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { 
        headers: { 
          'Accept': 'application/json', 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        } 
      });
      
      if (res.status === 404) {
        console.log(`${endpoint.name} - Gamecode ${gamecode}: Game not found (404) - skipping`);
        return { status: 'skipped', reason: '404' };
      }
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      
      const data = await res.json();
      
      // Save data to samples folder
      const outputDir = path.resolve(`./${endpoint.name}/samples`);
      const filePath = path.join(outputDir, `${endpoint.name.toLowerCase()}_${gamecode}_${seasoncode}.json`);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      
      console.log(`✓ ${endpoint.name} - Gamecode ${gamecode}: Saved`);
      return { status: 'success', data };
      
    } catch (err) {
      console.error(`${endpoint.name} - Attempt ${attempt}/${retries} failed for gamecode ${gamecode}:`, err.message);
      if (attempt === retries) {
        console.error(`❌ ${endpoint.name} - Failed gamecode ${gamecode} after ${retries} attempts`);
        return { status: 'failed', error: err.message };
      } else {
        await new Promise(r => setTimeout(r, 1000 * attempt)); // exponential backoff
      }
    }
  }
}

// Fetch all endpoints for a specific gamecode
async function fetchAllEndpointsForGame(gamecode) {
  console.log(`\n🏀 Processing gamecode ${gamecode}...`);
  const results = {};
  
  for (const endpoint of endpoints) {
    const result = await fetchEndpointData(endpoint, gamecode);
    results[endpoint.name] = result;
    
    // Small delay between endpoints
    await new Promise(r => setTimeout(r, 200));
  }
  
  return results;
}

// Main execution function
async function main() {
  console.log('🚀 Starting Euroleague API data collection...\n');
  console.log(`📊 Configuration:`);
  console.log(`   Season: ${seasoncode}`);
  console.log(`   Games: ${gamecodes.length} (${gamecodes[0]} to ${gamecodes[gamecodes.length-1]})`);
  console.log(`   Endpoints: ${endpoints.length}`);
  console.log(`   Total requests: ${gamecodes.length * endpoints.length}\n`);
  
  // Create directories for samples
  createDirectories();
  
  // Initialize statistics tracking
  const stats = {
    total: 0,
    success: 0,
    failed: 0,
    skipped: 0,
    byEndpoint: {}
  };
  
  endpoints.forEach(endpoint => {
    stats.byEndpoint[endpoint.name] = { success: 0, failed: 0, skipped: 0 };
  });
  
  // Process each gamecode sequentially
  for (const gamecode of gamecodes) {
    const results = await fetchAllEndpointsForGame(gamecode);
    
    // Update statistics
    Object.entries(results).forEach(([endpointName, result]) => {
      stats.total++;
      stats[result.status]++;
      stats.byEndpoint[endpointName][result.status]++;
    });
    
    // Delay between games to avoid rate limiting
    await new Promise(r => setTimeout(r, 1000));
  }
  
  // Print final statistics summary
  console.log(`\n📈 Final Statistics:`);
  console.log(`   Total requests: ${stats.total}`);
  console.log(`   ✅ Successful: ${stats.success}`);
  console.log(`   ❌ Failed: ${stats.failed}`);
  console.log(`   ⏭️  Skipped (404): ${stats.skipped}`);
  
  console.log(`\n📊 By Endpoint:`);
  Object.entries(stats.byEndpoint).forEach(([endpoint, endpointStats]) => {
    console.log(`   ${endpoint}:`);
    console.log(`     ✅ Success: ${endpointStats.success}`);
    console.log(`     ❌ Failed: ${endpointStats.failed}`);
    console.log(`     ⏭️  Skipped: ${endpointStats.skipped}`);
  });
  
  console.log('\n🎉 Data collection completed!');
  console.log('\n📁 Next steps:');
  console.log('   1. Check each endpoint folder for collected data');
  console.log('   2. Run generate-schema.js in each folder to create schemas');
  console.log('   3. Use the schemas for validation and documentation');
}

main().catch(console.error);