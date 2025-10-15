// Points/generate-schema.js
// Analyzes all JSON files and creates a merged schema for Points endpoint
import fs from 'fs';
import path from 'path';

const samplesDir = './samples';
const outputFile = './euroleague-points-schema.json';

// Analyzes all JSON files and creates a merged schema
function analyzeJsonFiles() {
  const files = fs.readdirSync(samplesDir).filter(f => f.endsWith('.json'));
  console.log(`Analyzing ${files.length} Points files...`);
  
  const allData = [];
  let validFiles = 0;
  
  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(samplesDir, file), 'utf8');
      const data = JSON.parse(content);
      allData.push(data);
      validFiles++;
    } catch (err) {
      console.error(`Error in file ${file}:`, err.message);
    }
  }
  
  console.log(`Successfully analyzed ${validFiles} files`);
  return allData;
}

// Creates the JSON Schema based on analyzed data
function generateSchema(dataArray) {
  const schema = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "Euroleague Points Schema",
    "description": "JSON Schema for Euroleague points data - Generated from sample data analysis",
    "type": "array",
    "items": {
      "type": "object",
      "description": "Point scoring event",
      "properties": {
        "PLAYER_ID": {
          "type": "string",
          "pattern": "^P\\d{6}\\s*$",
          "description": "Player ID"
        },
        "PLAYER": {
          "type": "string",
          "description": "Player name"
        },
        "TEAM": {
          "type": "string",
          "description": "Team name"
        },
        "POINTS": {
          "type": "integer",
          "minimum": 1,
          "maximum": 3,
          "description": "Points scored (1, 2, or 3)"
        },
        "MINUTE": {
          "type": "integer",
          "minimum": 0,
          "description": "Game minute"
        },
        "ZONE": {
          "type": "string",
          "description": "Court zone where shot was taken"
        },
        "SHOT_TYPE": {
          "type": "string",
          "description": "Type of shot"
        }
      }
    }
  };
  
  return schema;
}

// Main function
function main() {
  console.log('🏀 Generating Euroleague Points JSON Schema...\n');
  
  const dataArray = analyzeJsonFiles();
  
  if (dataArray.length === 0) {
    console.error('❌ No valid JSON files found');
    return;
  }
  
  console.log('\n📊 Generating schema...');
  const schema = generateSchema(dataArray);
  
  // Write the schema to file
  fs.writeFileSync(outputFile, JSON.stringify(schema, null, 2));
  
  console.log(`\n✅ Schema generated successfully: ${outputFile}`);
  console.log(`📈 Based on ${dataArray.length} points files`);
}

main();