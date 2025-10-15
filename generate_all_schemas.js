// generate_all_schemas.js
// Master script that runs all generate-schema.js files across endpoints
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const endpoints = [
  'Boxscore',
  'PlaybyPlay', 
  'Points'
];

// Execute a generate-schema script for a specific endpoint
function runSchemaGeneration(endpoint) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(endpoint, 'generate-schema.js');
    const workingDir = path.resolve(endpoint);
    
    // Check if the script exists
    if (!fs.existsSync(scriptPath)) {
      console.log(`⏭️  Skipping ${endpoint} - No generate-schema.js found`);
      resolve({ endpoint, status: 'skipped', reason: 'No script found' });
      return;
    }
    
    // Check if samples exist
    const samplesDir = path.join(endpoint, 'samples');
    if (!fs.existsSync(samplesDir) || fs.readdirSync(samplesDir).length === 0) {
      console.log(`⏭️  Skipping ${endpoint} - No sample data found`);
      resolve({ endpoint, status: 'skipped', reason: 'No sample data' });
      return;
    }
    
    console.log(`🔄 Generating schema for ${endpoint}...`);
    
    const child = spawn('node', ['generate-schema.js'], {
      cwd: workingDir,
      stdio: 'inherit',
      shell: true
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${endpoint} schema generated successfully\n`);
        resolve({ endpoint, status: 'success' });
      } else {
        console.error(`❌ ${endpoint} schema generation failed with code ${code}\n`);
        resolve({ endpoint, status: 'failed', code });
      }
    });
    
    child.on('error', (err) => {
      console.error(`❌ ${endpoint} error:`, err.message);
      resolve({ endpoint, status: 'error', error: err.message });
    });
  });
}

// Main function - executes schema generation for all endpoints
async function main() {
  console.log('🚀 Generating all JSON Schemas...\n');
  console.log(`📊 Endpoints: ${endpoints.join(', ')}\n`);
  
  const results = [];
  
  // Run sequentially to avoid conflicts
  for (const endpoint of endpoints) {
    const result = await runSchemaGeneration(endpoint);
    results.push(result);
  }
  
  // Display final statistics
  console.log('📈 Final Results:');
  console.log('================');
  
  const stats = {
    success: 0,
    failed: 0,
    skipped: 0,
    error: 0
  };
  
  results.forEach(result => {
    const { endpoint, status, reason, code, error } = result;
    stats[status]++;
    
    switch (status) {
      case 'success':
        console.log(`✅ ${endpoint}: Schema generated successfully`);
        break;
      case 'failed':
        console.log(`❌ ${endpoint}: Failed (exit code: ${code})`);
        break;
      case 'skipped':
        console.log(`⏭️  ${endpoint}: Skipped (${reason})`);
        break;
      case 'error':
        console.log(`💥 ${endpoint}: Error (${error})`);
        break;
    }
  });
  
  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Successful: ${stats.success}`);
  console.log(`   ❌ Failed: ${stats.failed}`);
  console.log(`   ⏭️  Skipped: ${stats.skipped}`);
  console.log(`   💥 Errors: ${stats.error}`);
  console.log(`   📁 Total endpoints: ${endpoints.length}`);
  
  if (stats.success > 0) {
    console.log('\n🎉 Schema generation completed!');
    console.log('\n📁 Generated files in each endpoint folder:');
    console.log('   • euroleague-{endpoint}-schema.json');
    console.log('   • euroleague-{endpoint}.dto.ts');
    console.log('   • postman-tests.js');
  }
}

main().catch(console.error);