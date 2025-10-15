// PlaybyPlay/generate-schema.js
// Analyzes all JSON files and creates a merged schema for PlaybyPlay endpoint
import fs from 'fs';
import path from 'path';

const samplesDir = './samples';
const outputFile = './euroleague-playbyplay-schema.json';

// Analyzes all JSON files and creates a merged schema
function analyzeJsonFiles() {
  const files = fs.readdirSync(samplesDir).filter(f => f.endsWith('.json'));
  console.log(`Analyzing ${files.length} PlaybyPlay files...`);
  
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

// Collects all unique values from an array at a given path
function collectUniqueValues(dataArray, path) {
  const values = new Set();
  
  for (const data of dataArray) {
    const value = getNestedValue(data, path);
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach(v => values.add(v));
      } else {
        values.add(value);
      }
    }
  }
  
  return Array.from(values);
}

// Gets nested value from object path (e.g., "stats.team.name")
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => {
    if (current && typeof current === 'object') {
      return current[key];
    }
    return undefined;
  }, obj);
}

// Analyzes play data to find all possible formats
function analyzePlayData(dataArray) {
  const allPlays = [];
  const actionTypes = new Set();
  const teams = new Set();
  const players = new Set();
  
  for (const data of dataArray) {
    if (data.FirstQuarter && Array.isArray(data.FirstQuarter)) {
      allPlays.push(...data.FirstQuarter);
    }
    if (data.SecondQuarter && Array.isArray(data.SecondQuarter)) {
      allPlays.push(...data.SecondQuarter);
    }
    if (data.ThirdQuarter && Array.isArray(data.ThirdQuarter)) {
      allPlays.push(...data.ThirdQuarter);
    }
    if (data.FourthQuarter && Array.isArray(data.FourthQuarter)) {
      allPlays.push(...data.FourthQuarter);
    }
    if (data.ExtraTime && Array.isArray(data.ExtraTime)) {
      allPlays.push(...data.ExtraTime);
    }
  }
  
  allPlays.forEach(play => {
    if (play.PLAYTYPE) actionTypes.add(play.PLAYTYPE);
    if (play.TEAM) teams.add(play.TEAM);
    if (play.PLAYER) players.add(play.PLAYER);
  });
  
  return { 
    allPlays, 
    actionTypes: Array.from(actionTypes), 
    teams: Array.from(teams),
    players: Array.from(players)
  };
}

// Creates the JSON Schema based on analyzed data
function generateSchema(dataArray) {
  const { allPlays, actionTypes, teams, players } = analyzePlayData(dataArray);
  
  const schema = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "Euroleague PlaybyPlay Schema",
    "description": "JSON Schema for Euroleague play-by-play data - Generated from sample data analysis",
    "type": "object",
    "required": ["FirstQuarter", "SecondQuarter", "ThirdQuarter", "FourthQuarter"],
    "properties": {
      "FirstQuarter": {
        "type": "array",
        "description": "Plays from the first quarter",
        "items": { "$ref": "#/definitions/PlayAction" }
      },
      "SecondQuarter": {
        "type": "array",
        "description": "Plays from the second quarter",
        "items": { "$ref": "#/definitions/PlayAction" }
      },
      "ThirdQuarter": {
        "type": "array",
        "description": "Plays from the third quarter",
        "items": { "$ref": "#/definitions/PlayAction" }
      },
      "FourthQuarter": {
        "type": "array",
        "description": "Plays from the fourth quarter",
        "items": { "$ref": "#/definitions/PlayAction" }
      },
      "ExtraTime": {
        "type": "array",
        "description": "Plays from overtime (if exists)",
        "items": { "$ref": "#/definitions/PlayAction" }
      }
    },
    "definitions": {
      "PlayAction": {
        "type": "object",
        "description": "Μια φάση στο παιχνίδι",
        "required": ["NUMBEROFPLAY", "CODETEAM", "PLAYTYPE"],
        "properties": {
          "NUMBEROFPLAY": {
            "type": "integer",
            "minimum": 1,
            "description": "Αριθμός φάσης"
          },
          "CODETEAM": {
            "type": "string",
            "description": "Κωδικός ομάδας"
          },
          "PLAYTYPE": {
            "type": "string",
            "enum": actionTypes.slice(0, 50), // Limit για readability
            "description": "Τύπος φάσης"
          },
          "TEAM": {
            "type": "string",
            "description": "Όνομα ομάδας"
          },
          "PLAYER": {
            "type": "string",
            "description": "Όνομα παίκτη"
          },
          "PLAYER_ID": {
            "type": "string",
            "pattern": "^P\\d{6}\\s*$",
            "description": "ID παίκτη"
          },
          "DORSAL": {
            "type": "string",
            "description": "Αριθμός φανέλας"
          },
          "MINUTE": {
            "type": "integer",
            "minimum": 0,
            "maximum": 50,
            "description": "Λεπτό παιχνιδιού"
          },
          "MARKERTIME": {
            "type": "string",
            "pattern": "^\\d{2}:\\d{2}$",
            "description": "Χρόνος στο ρολόι (MM:SS)"
          },
          "SCORE": {
            "type": "string",
            "pattern": "^\\d+-\\d+$",
            "description": "Σκορ τη στιγμή της φάσης"
          },
          "SCOREA": {
            "type": "integer",
            "minimum": 0,
            "description": "Πόντοι ομάδας Α"
          },
          "SCOREB": {
            "type": "integer",
            "minimum": 0,
            "description": "Πόντοι ομάδας Β"
          },
          "COMMENT": {
            "type": "string",
            "description": "Περιγραφή φάσης"
          }
        }
      }
    }
  };
  
  return schema;
}

// Δημιουργεί NestJS DTO classes
function generateNestJSDto(schema) {
  const dtoContent = `// euroleague-playbyplay.dto.ts
import { 
  IsString, IsNumber, IsArray, IsOptional, 
  ValidateNested, IsEnum, IsInt, Min, Max, Matches 
} from 'class-validator';
import { Type } from 'class-transformer';

export class PlayActionDto {
  @IsInt()
  @Min(1)
  NUMBEROFPLAY: number;

  @IsString()
  CODETEAM: string;

  @IsString()
  PLAYTYPE: string;

  @IsOptional()
  @IsString()
  TEAM?: string;

  @IsOptional()
  @IsString()
  PLAYER?: string;

  @IsOptional()
  @IsString()
  @Matches(/^P\\d{6}\\s*$/)
  PLAYER_ID?: string;

  @IsOptional()
  @IsString()
  DORSAL?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(50)
  MINUTE?: number;

  @IsOptional()
  @IsString()
  @Matches(/^\\d{2}:\\d{2}$/)
  MARKERTIME?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\\d+-\\d+$/)
  SCORE?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  SCOREA?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  SCOREB?: number;

  @IsOptional()
  @IsString()
  COMMENT?: string;
}

export class EuroleaguePlaybyPlayDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlayActionDto)
  FirstQuarter: PlayActionDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlayActionDto)
  SecondQuarter: PlayActionDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlayActionDto)
  ThirdQuarter: PlayActionDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlayActionDto)
  FourthQuarter: PlayActionDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlayActionDto)
  ExtraTime?: PlayActionDto[];
}
`;

  fs.writeFileSync('./euroleague-playbyplay.dto.ts', dtoContent);
  console.log('✅ NestJS DTO δημιουργήθηκε: euroleague-playbyplay.dto.ts');
}

// Δημιουργεί Postman test examples
function generatePostmanExamples() {
  const postmanTests = `// Postman Tests για Euroleague PlaybyPlay API
// Βάλε αυτό στο "Tests" tab του Postman request

pm.test("Response status code is 200", function () {
    pm.expect(pm.response.code).to.equal(200);
});

pm.test("Response has valid JSON structure", function () {
    const jsonData = pm.response.json();
    
    // Basic structure validation
    pm.expect(jsonData).to.have.property('FirstQuarter');
    pm.expect(jsonData).to.have.property('SecondQuarter');
    pm.expect(jsonData).to.have.property('ThirdQuarter');
    pm.expect(jsonData).to.have.property('FourthQuarter');
});

pm.test("All quarters are arrays", function () {
    const jsonData = pm.response.json();
    
    pm.expect(jsonData.FirstQuarter).to.be.an('array');
    pm.expect(jsonData.SecondQuarter).to.be.an('array');
    pm.expect(jsonData.ThirdQuarter).to.be.an('array');
    pm.expect(jsonData.FourthQuarter).to.be.an('array');
});

pm.test("Play actions have required fields", function () {
    const jsonData = pm.response.json();
    
    const allPlays = [
        ...jsonData.FirstQuarter,
        ...jsonData.SecondQuarter,
        ...jsonData.ThirdQuarter,
        ...jsonData.FourthQuarter
    ];
    
    if (jsonData.ExtraTime) {
        allPlays.push(...jsonData.ExtraTime);
    }
    
    allPlays.forEach(play => {
        pm.expect(play).to.have.property('NUMBEROFPLAY');
        pm.expect(play).to.have.property('CODETEAM');
        pm.expect(play).to.have.property('PLAYTYPE');
        
        pm.expect(play.NUMBEROFPLAY).to.be.a('number');
        pm.expect(play.CODETEAM).to.be.a('string');
        pm.expect(play.PLAYTYPE).to.be.a('string');
    });
});

pm.test("Player ID format validation", function () {
    const jsonData = pm.response.json();
    
    const allPlays = [
        ...jsonData.FirstQuarter,
        ...jsonData.SecondQuarter,
        ...jsonData.ThirdQuarter,
        ...jsonData.FourthQuarter
    ];
    
    allPlays.forEach(play => {
        if (play.PLAYER_ID) {
            pm.expect(play.PLAYER_ID).to.match(/^P\\d{6}\\s*$/);
        }
    });
});

pm.test("Score format validation", function () {
    const jsonData = pm.response.json();
    
    const allPlays = [
        ...jsonData.FirstQuarter,
        ...jsonData.SecondQuarter,
        ...jsonData.ThirdQuarter,
        ...jsonData.FourthQuarter
    ];
    
    allPlays.forEach(play => {
        if (play.SCORE) {
            pm.expect(play.SCORE).to.match(/^\\d+-\\d+$/);
        }
        if (play.MARKERTIME) {
            pm.expect(play.MARKERTIME).to.match(/^\\d{2}:\\d{2}$/);
        }
    });
});

console.log("✅ Όλα τα Euroleague PlaybyPlay validation tests πέρασαν!");
`;

  fs.writeFileSync('./postman-tests.js', postmanTests);
  console.log('✅ Postman tests δημιουργήθηκαν: postman-tests.js');
}

// Main function
function main() {
  console.log('🏀 Generating Euroleague PlaybyPlay JSON Schema...\n');
  
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
  console.log(`📈 Based on ${dataArray.length} playbyplay files`);
  
  // Generate NestJS DTO
  generateNestJSDto(schema);
  
  // Generate Postman examples
  generatePostmanExamples();
}

main();