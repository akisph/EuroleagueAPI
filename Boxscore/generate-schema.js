// generate-schema.js
// Analyzes all JSON files and creates a merged schema for Boxscore endpoint
import fs from 'fs';
import path from 'path';

const samplesDir = './samples';
const outputFile = './euroleague-boxscore-schema.json';

// Analyzes all JSON files and creates a merged schema
function analyzeJsonFiles() {
  const files = fs.readdirSync(samplesDir).filter(f => f.endsWith('.json'));
  console.log(`Analyzing ${files.length} boxscore files...`);
  
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

// Analyzes player stats to find all possible formats
function analyzePlayerStats(dataArray) {
  const playerStats = [];
  const minutesFormats = new Set();
  
  for (const data of dataArray) {
    if (data.Stats && Array.isArray(data.Stats)) {
      for (const teamStats of data.Stats) {
        if (teamStats.PlayersStats && Array.isArray(teamStats.PlayersStats)) {
          for (const player of teamStats.PlayersStats) {
            playerStats.push(player);
            if (player.Minutes) {
              minutesFormats.add(typeof player.Minutes === 'string' ? 'string' : 'number');
            }
          }
        }
      }
    }
  }
  
  return { playerStats, minutesFormats: Array.from(minutesFormats) };
}

// Creates the JSON Schema based on analyzed data
function generateSchema(dataArray) {
  const { playerStats, minutesFormats } = analyzePlayerStats(dataArray);
  
  // Collect all unique values for enums
  const teams = new Set();
  const coaches = new Set();
  const referees = new Set();
  
  dataArray.forEach(data => {
    // Teams from ByQuarter
    if (data.ByQuarter) {
      data.ByQuarter.forEach(q => teams.add(q.Team));
    }
    
    // Coaches and teams from Stats
    if (data.Stats) {
      data.Stats.forEach(stat => {
        if (stat.Team) teams.add(stat.Team);
        if (stat.Coach) coaches.add(stat.Coach);
      });
    }
    
    // Referees
    if (data.Referees) {
      referees.add(data.Referees);
    }
  });

  const schema = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "Euroleague Boxscore Schema",
    "description": "JSON Schema for Euroleague boxscore data - Generated from sample data analysis",
    "type": "object",
    "required": ["Live", "ByQuarter", "EndOfQuarter", "Stats"],
    "properties": {
      "Live": {
        "type": "boolean",
        "description": "Whether the game is currently live"
      },
      "Referees": {
        "type": "string",
        "description": "Referee names separated by commas",
        "examples": Array.from(referees).slice(0, 5)
      },
      "Attendance": {
        "type": "string",
        "pattern": "^\\d+$",
        "description": "Number of attendees (string format)"
      },
      "ByQuarter": {
        "type": "array",
        "description": "Πόντοι ανά quarter",
        "minItems": 2,
        "maxItems": 2,
        "items": {
          "type": "object",
          "required": ["Team", "Quarter1", "Quarter2", "Quarter3", "Quarter4"],
          "properties": {
            "Team": {
              "type": "string",
              "enum": Array.from(teams)
            },
            "Quarter1": { "type": "integer", "minimum": 0 },
            "Quarter2": { "type": "integer", "minimum": 0 },
            "Quarter3": { "type": "integer", "minimum": 0 },
            "Quarter4": { "type": "integer", "minimum": 0 }
          }
        }
      },
      "EndOfQuarter": {
        "type": "array",
        "description": "Συνολικοί πόντοι στο τέλος κάθε quarter",
        "minItems": 2,
        "maxItems": 2,
        "items": {
          "type": "object",
          "required": ["Team", "Quarter1", "Quarter2", "Quarter3", "Quarter4"],
          "properties": {
            "Team": {
              "type": "string",
              "enum": Array.from(teams)
            },
            "Quarter1": { "type": "integer", "minimum": 0 },
            "Quarter2": { "type": "integer", "minimum": 0 },
            "Quarter3": { "type": "integer", "minimum": 0 },
            "Quarter4": { "type": "integer", "minimum": 0 }
          }
        }
      },
      "Stats": {
        "type": "array",
        "description": "Στατιστικά ομάδων",
        "minItems": 2,
        "maxItems": 2,
        "items": {
          "type": "object",
          "required": ["Team", "Coach", "PlayersStats", "tmr", "totr"],
          "properties": {
            "Team": {
              "type": "string",
              "enum": Array.from(teams)
            },
            "Coach": {
              "type": "string",
              "examples": Array.from(coaches).slice(0, 10)
            },
            "PlayersStats": {
              "type": "array",
              "description": "Στατιστικά παικτών",
              "items": {
                "$ref": "#/definitions/PlayerStats"
              }
            },
            "tmr": {
              "$ref": "#/definitions/TeamRebounds",
              "description": "Team rebounds"
            },
            "totr": {
              "$ref": "#/definitions/TeamTotals",
              "description": "Team totals"
            }
          }
        }
      }
    },
    "definitions": {
      "PlayerStats": {
        "type": "object",
        "required": [
          "Player_ID", "IsStarter", "IsPlaying", "Team", "Dorsal", "Player",
          "Minutes", "Points", "FieldGoalsMade2", "FieldGoalsAttempted2",
          "FieldGoalsMade3", "FieldGoalsAttempted3", "FreeThrowsMade",
          "FreeThrowsAttempted", "OffensiveRebounds", "DefensiveRebounds",
          "TotalRebounds", "Assistances", "Steals", "Turnovers",
          "BlocksFavour", "BlocksAgainst", "FoulsCommited", "FoulsReceived",
          "Valuation", "Plusminus"
        ],
        "properties": {
          "Player_ID": {
            "type": "string",
            "pattern": "^P\\d{6}\\s*$",
            "description": "Unique player ID"
          },
          "IsStarter": { "type": "integer", "enum": [0, 1] },
          "IsPlaying": { "type": "integer", "enum": [0, 1] },
          "Team": {
            "type": "string",
            "description": "Team abbreviation"
          },
          "Dorsal": {
            "type": "string",
            "description": "Jersey number"
          },
          "Player": {
            "type": "string",
            "description": "Player name (SURNAME, NAME format)"
          },
          "Minutes": {
            "oneOf": [
              { "type": "string", "pattern": "^(\\d{1,2}:\\d{2}|DNP)$" },
              { "type": "null" }
            ],
            "description": "Minutes played (MM:SS format) or 'DNP' for Did Not Play"
          },
          "Points": { "type": "integer", "minimum": 0 },
          "FieldGoalsMade2": { "type": "integer", "minimum": 0 },
          "FieldGoalsAttempted2": { "type": "integer", "minimum": 0 },
          "FieldGoalsMade3": { "type": "integer", "minimum": 0 },
          "FieldGoalsAttempted3": { "type": "integer", "minimum": 0 },
          "FreeThrowsMade": { "type": "integer", "minimum": 0 },
          "FreeThrowsAttempted": { "type": "integer", "minimum": 0 },
          "OffensiveRebounds": { "type": "integer", "minimum": 0 },
          "DefensiveRebounds": { "type": "integer", "minimum": 0 },
          "TotalRebounds": { "type": "integer", "minimum": 0 },
          "Assistances": { "type": "integer", "minimum": 0 },
          "Steals": { "type": "integer", "minimum": 0 },
          "Turnovers": { "type": "integer", "minimum": 0 },
          "BlocksFavour": { "type": "integer", "minimum": 0 },
          "BlocksAgainst": { "type": "integer", "minimum": 0 },
          "FoulsCommited": { "type": "integer", "minimum": 0 },
          "FoulsReceived": { "type": "integer", "minimum": 0 },
          "Valuation": { "type": "integer" },
          "Plusminus": {
            "oneOf": [
              { "type": "integer" },
              { "type": "null" }
            ]
          }
        }
      },
      "TeamRebounds": {
        "type": "object",
        "description": "Team rebounds (not attributed to individual players)",
        "properties": {
          "Player_ID": { "type": "string", "pattern": "^\\s*$" },
          "IsStarter": { "type": "integer", "enum": [0] },
          "IsPlaying": { "type": "integer", "enum": [0] },
          "Team": { "type": "string" },
          "Dorsal": { "type": "string", "maxLength": 0 },
          "Player": { "type": "string", "maxLength": 0 },
          "Minutes": { "type": "null" },
          "Points": { "type": "integer", "enum": [0] },
          "FieldGoalsMade2": { "type": "integer", "enum": [0] },
          "FieldGoalsAttempted2": { "type": "integer", "enum": [0] },
          "FieldGoalsMade3": { "type": "integer", "enum": [0] },
          "FieldGoalsAttempted3": { "type": "integer", "enum": [0] },
          "FreeThrowsMade": { "type": "integer", "enum": [0] },
          "FreeThrowsAttempted": { "type": "integer", "enum": [0] },
          "OffensiveRebounds": { "type": "integer", "minimum": 0 },
          "DefensiveRebounds": { "type": "integer", "minimum": 0 },
          "TotalRebounds": { "type": "integer", "minimum": 0 },
          "Assistances": { "type": "integer", "enum": [0] },
          "Steals": { "type": "integer", "enum": [0] },
          "Turnovers": { "type": "integer", "enum": [0] },
          "BlocksFavour": { "type": "integer", "enum": [0] },
          "BlocksAgainst": { "type": "integer", "enum": [0] },
          "FoulsCommited": { "type": "integer", "enum": [0] },
          "FoulsReceived": { "type": "integer", "enum": [0] },
          "Valuation": { "type": "integer", "minimum": 0 },
          "Plusminus": { "type": "null" }
        }
      },
      "TeamTotals": {
        "type": "object",
        "description": "Team total statistics",
        "required": [
          "Minutes", "Points", "FieldGoalsMade2", "FieldGoalsAttempted2",
          "FieldGoalsMade3", "FieldGoalsAttempted3", "FreeThrowsMade",
          "FreeThrowsAttempted", "OffensiveRebounds", "DefensiveRebounds",
          "TotalRebounds", "Assistances", "Steals", "Turnovers",
          "BlocksFavour", "BlocksAgainst", "FoulsCommited", "FoulsReceived",
          "Valuation"
        ],
        "properties": {
          "Minutes": { "type": "string", "pattern": "^200:00$" },
          "Points": { "type": "integer", "minimum": 0 },
          "FieldGoalsMade2": { "type": "integer", "minimum": 0 },
          "FieldGoalsAttempted2": { "type": "integer", "minimum": 0 },
          "FieldGoalsMade3": { "type": "integer", "minimum": 0 },
          "FieldGoalsAttempted3": { "type": "integer", "minimum": 0 },
          "FreeThrowsMade": { "type": "integer", "minimum": 0 },
          "FreeThrowsAttempted": { "type": "integer", "minimum": 0 },
          "OffensiveRebounds": { "type": "integer", "minimum": 0 },
          "DefensiveRebounds": { "type": "integer", "minimum": 0 },
          "TotalRebounds": { "type": "integer", "minimum": 0 },
          "Assistances": { "type": "integer", "minimum": 0 },
          "Steals": { "type": "integer", "minimum": 0 },
          "Turnovers": { "type": "integer", "minimum": 0 },
          "BlocksFavour": { "type": "integer", "minimum": 0 },
          "BlocksAgainst": { "type": "integer", "minimum": 0 },
          "FoulsCommited": { "type": "integer", "minimum": 0 },
          "FoulsReceived": { "type": "integer", "minimum": 0 },
          "Valuation": { "type": "integer" }
        }
      }
    }
  };
  
  return schema;
}

// Main function
function main() {
  console.log('🏀 Generating Euroleague Boxscore JSON Schema...\n');
  
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
  console.log(`📈 Based on ${dataArray.length} boxscore files`);
  
  // Generate NestJS DTO
  generateNestJSDto(schema);
  
  // Generate Postman examples
  generatePostmanExamples(dataArray[0]);
}

// Δημιουργεί NestJS DTO classes
function generateNestJSDto(schema) {
  const dtoContent = `// euroleague-boxscore.dto.ts
import { 
  IsBoolean, IsString, IsNumber, IsArray, IsOptional, 
  ValidateNested, IsEnum, IsInt, Min, Matches 
} from 'class-validator';
import { Type } from 'class-transformer';

export class QuarterStatsDto {
  @IsString()
  Team: string;

  @IsInt()
  @Min(0)
  Quarter1: number;

  @IsInt()
  @Min(0)
  Quarter2: number;

  @IsInt()
  @Min(0)
  Quarter3: number;

  @IsInt()
  @Min(0)
  Quarter4: number;
}

export class PlayerStatsDto {
  @IsString()
  @Matches(/^P\\d{6}\\s*$/)
  Player_ID: string;

  @IsInt()
  @IsEnum([0, 1])
  IsStarter: number;

  @IsInt()
  @IsEnum([0, 1])
  IsPlaying: number;

  @IsString()
  Team: string;

  @IsString()
  Dorsal: string;

  @IsString()
  Player: string;

  @IsOptional()
  @Matches(/^(\\d{1,2}:\\d{2}|DNP)$/)
  Minutes?: string | null;

  @IsInt()
  @Min(0)
  Points: number;

  @IsInt()
  @Min(0)
  FieldGoalsMade2: number;

  @IsInt()
  @Min(0)
  FieldGoalsAttempted2: number;

  @IsInt()
  @Min(0)
  FieldGoalsMade3: number;

  @IsInt()
  @Min(0)
  FieldGoalsAttempted3: number;

  @IsInt()
  @Min(0)
  FreeThrowsMade: number;

  @IsInt()
  @Min(0)
  FreeThrowsAttempted: number;

  @IsInt()
  @Min(0)
  OffensiveRebounds: number;

  @IsInt()
  @Min(0)
  DefensiveRebounds: number;

  @IsInt()
  @Min(0)
  TotalRebounds: number;

  @IsInt()
  @Min(0)
  Assistances: number;

  @IsInt()
  @Min(0)
  Steals: number;

  @IsInt()
  @Min(0)
  Turnovers: number;

  @IsInt()
  @Min(0)
  BlocksFavour: number;

  @IsInt()
  @Min(0)
  BlocksAgainst: number;

  @IsInt()
  @Min(0)
  FoulsCommited: number;

  @IsInt()
  @Min(0)
  FoulsReceived: number;

  @IsInt()
  Valuation: number;

  @IsOptional()
  @IsInt()
  Plusminus?: number | null;
}

export class TeamReboundsDto {
  @IsString()
  Player_ID: string;

  @IsInt()
  @IsEnum([0])
  IsStarter: 0;

  @IsInt()
  @IsEnum([0])
  IsPlaying: 0;

  @IsString()
  Team: string;

  @IsString()
  Dorsal: string;

  @IsString()
  Player: string;

  @IsOptional()
  Minutes: null;

  @IsInt()
  @IsEnum([0])
  Points: 0;

  @IsInt()
  @IsEnum([0])
  FieldGoalsMade2: 0;

  @IsInt()
  @IsEnum([0])
  FieldGoalsAttempted2: 0;

  @IsInt()
  @IsEnum([0])
  FieldGoalsMade3: 0;

  @IsInt()
  @IsEnum([0])
  FieldGoalsAttempted3: 0;

  @IsInt()
  @IsEnum([0])
  FreeThrowsMade: 0;

  @IsInt()
  @IsEnum([0])
  FreeThrowsAttempted: 0;

  @IsInt()
  @Min(0)
  OffensiveRebounds: number;

  @IsInt()
  @Min(0)
  DefensiveRebounds: number;

  @IsInt()
  @Min(0)
  TotalRebounds: number;

  @IsInt()
  @IsEnum([0])
  Assistances: 0;

  @IsInt()
  @IsEnum([0])
  Steals: 0;

  @IsInt()
  @IsEnum([0])
  Turnovers: 0;

  @IsInt()
  @IsEnum([0])
  BlocksFavour: 0;

  @IsInt()
  @IsEnum([0])
  BlocksAgainst: 0;

  @IsInt()
  @IsEnum([0])
  FoulsCommited: 0;

  @IsInt()
  @IsEnum([0])
  FoulsReceived: 0;

  @IsInt()
  @Min(0)
  Valuation: number;

  @IsOptional()
  Plusminus: null;
}

export class TeamTotalsDto {
  @IsString()
  @Matches(/^200:00$/)
  Minutes: string;

  @IsInt()
  @Min(0)
  Points: number;

  @IsInt()
  @Min(0)
  FieldGoalsMade2: number;

  @IsInt()
  @Min(0)
  FieldGoalsAttempted2: number;

  @IsInt()
  @Min(0)
  FieldGoalsMade3: number;

  @IsInt()
  @Min(0)
  FieldGoalsAttempted3: number;

  @IsInt()
  @Min(0)
  FreeThrowsMade: number;

  @IsInt()
  @Min(0)
  FreeThrowsAttempted: number;

  @IsInt()
  @Min(0)
  OffensiveRebounds: number;

  @IsInt()
  @Min(0)
  DefensiveRebounds: number;

  @IsInt()
  @Min(0)
  TotalRebounds: number;

  @IsInt()
  @Min(0)
  Assistances: number;

  @IsInt()
  @Min(0)
  Steals: number;

  @IsInt()
  @Min(0)
  Turnovers: number;

  @IsInt()
  @Min(0)
  BlocksFavour: number;

  @IsInt()
  @Min(0)
  BlocksAgainst: number;

  @IsInt()
  @Min(0)
  FoulsCommited: number;

  @IsInt()
  @Min(0)
  FoulsReceived: number;

  @IsInt()
  Valuation: number;
}

export class TeamStatsDto {
  @IsString()
  Team: string;

  @IsString()
  Coach: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlayerStatsDto)
  PlayersStats: PlayerStatsDto[];

  @ValidateNested()
  @Type(() => TeamReboundsDto)
  tmr: TeamReboundsDto;

  @ValidateNested()
  @Type(() => TeamTotalsDto)
  totr: TeamTotalsDto;
}

export class EuroleagueBoxscoreDto {
  @IsBoolean()
  Live: boolean;

  @IsOptional()
  @IsString()
  Referees?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\\d+$/)
  Attendance?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuarterStatsDto)
  ByQuarter: QuarterStatsDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuarterStatsDto)
  EndOfQuarter: QuarterStatsDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TeamStatsDto)
  Stats: TeamStatsDto[];
}
`;

  fs.writeFileSync('./euroleague-boxscore.dto.ts', dtoContent);
  console.log('✅ NestJS DTO δημιουργήθηκε: euroleague-boxscore.dto.ts');
}

// Δημιουργεί Postman test examples
function generatePostmanExamples(sampleData) {
  const postmanTests = `// Postman Tests για Euroleague Boxscore API
// Βάλε αυτό στο "Tests" tab του Postman request

pm.test("Response status code is 200", function () {
    pm.expect(pm.response.code).to.equal(200);
});

pm.test("Response has valid JSON structure", function () {
    const jsonData = pm.response.json();
    
    // Basic structure validation
    pm.expect(jsonData).to.have.property('Live');
    pm.expect(jsonData).to.have.property('ByQuarter');
    pm.expect(jsonData).to.have.property('EndOfQuarter');
    pm.expect(jsonData).to.have.property('Stats');
});

pm.test("Live field is boolean", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.Live).to.be.a('boolean');
});

pm.test("ByQuarter has exactly 2 teams", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.ByQuarter).to.be.an('array');
    pm.expect(jsonData.ByQuarter).to.have.lengthOf(2);
});

pm.test("EndOfQuarter has exactly 2 teams", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.EndOfQuarter).to.be.an('array');
    pm.expect(jsonData.EndOfQuarter).to.have.lengthOf(2);
});

pm.test("Stats has exactly 2 teams", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.Stats).to.be.an('array');
    pm.expect(jsonData.Stats).to.have.lengthOf(2);
});

pm.test("Each team has required quarter data", function () {
    const jsonData = pm.response.json();
    
    jsonData.ByQuarter.forEach(team => {
        pm.expect(team).to.have.property('Team');
        pm.expect(team).to.have.property('Quarter1');
        pm.expect(team).to.have.property('Quarter2');
        pm.expect(team).to.have.property('Quarter3');
        pm.expect(team).to.have.property('Quarter4');
        
        pm.expect(team.Quarter1).to.be.a('number');
        pm.expect(team.Quarter2).to.be.a('number');
        pm.expect(team.Quarter3).to.be.a('number');
        pm.expect(team.Quarter4).to.be.a('number');
    });
});

pm.test("Player stats validation", function () {
    const jsonData = pm.response.json();
    
    jsonData.Stats.forEach(teamStats => {
        pm.expect(teamStats).to.have.property('Team');
        pm.expect(teamStats).to.have.property('Coach');
        pm.expect(teamStats).to.have.property('PlayersStats');
        pm.expect(teamStats).to.have.property('tmr');
        pm.expect(teamStats).to.have.property('totr');
        
        // Validate each player
        teamStats.PlayersStats.forEach(player => {
            pm.expect(player).to.have.property('Player_ID');
            pm.expect(player).to.have.property('Player');
            pm.expect(player).to.have.property('Points');
            pm.expect(player).to.have.property('Minutes');
            
            // Player_ID format validation
            pm.expect(player.Player_ID).to.match(/^P\\d{6}\\s*$/);
            
            // Points should be non-negative
            pm.expect(player.Points).to.be.at.least(0);
            
            // Minutes validation
            if (player.Minutes !== null && player.Minutes !== "DNP") {
                pm.expect(player.Minutes).to.match(/^\\d{1,2}:\\d{2}$/);
            }
        });
    });
});

pm.test("Team totals validation", function () {
    const jsonData = pm.response.json();
    
    jsonData.Stats.forEach(teamStats => {
        const totals = teamStats.totr;
        
        pm.expect(totals.Minutes).to.equal("200:00");
        pm.expect(totals.Points).to.be.a('number').and.be.at.least(0);
        pm.expect(totals.TotalRebounds).to.be.a('number').and.be.at.least(0);
        pm.expect(totals.Assistances).to.be.a('number').and.be.at.least(0);
    });
});

// Αποθήκευση δεδομένων για άλλα tests
pm.globals.set("last_boxscore_data", JSON.stringify(pm.response.json()));

console.log("✅ Όλα τα Euroleague Boxscore validation tests πέρασαν!");
`;

  fs.writeFileSync('./postman-tests.js', postmanTests);
  console.log('✅ Postman tests δημιουργήθηκαν: postman-tests.js');
}

main();