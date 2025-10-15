-- ===========================
-- CORE TABLES
-- ===========================

-- Users & Authentication
CREATE TABLE users (
    usr_id SERIAL PRIMARY KEY,
    usr_username VARCHAR(50) UNIQUE NOT NULL,
    usr_email VARCHAR(255) UNIQUE NOT NULL,
    usr_password_hash VARCHAR(255) NOT NULL,
    usr_role VARCHAR(20) DEFAULT 'user', -- admin, analyst, user
    usr_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usr_is_active BOOLEAN DEFAULT true
);

-- Seasons
CREATE TABLE seasons (
    ssn_id SERIAL PRIMARY KEY,
    ssn_code VARCHAR(10) UNIQUE NOT NULL, -- E2025, E2024
    ssn_name VARCHAR(50) NOT NULL, -- 2024-25
    ssn_is_current BOOLEAN DEFAULT false,
    ssn_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Teams
CREATE TABLE teams (
    tm_id SERIAL PRIMARY KEY,
    tm_code VARCHAR(10) UNIQUE NOT NULL, -- from API
    tm_name VARCHAR(100) NOT NULL,
    tm_city VARCHAR(100),
    tm_country VARCHAR(100),
    tm_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Players
CREATE TABLE players (
    plr_id SERIAL PRIMARY KEY,
    plr_code VARCHAR(20) UNIQUE NOT NULL, -- P123456 from API
    plr_first_name VARCHAR(100) NOT NULL,
    plr_last_name VARCHAR(100) NOT NULL,
    plr_position VARCHAR(10), -- PG, SG, SF, PF, C
    plr_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Games
CREATE TABLE games (
    gm_id SERIAL PRIMARY KEY,
    gm_code INT UNIQUE NOT NULL, -- 1-306 from API
    gm_fk_ssn_id INT REFERENCES seasons(ssn_id),
    gm_fk_home_tm_id INT REFERENCES teams(tm_id),
    gm_fk_away_tm_id INT REFERENCES teams(tm_id),
    gm_date TIMESTAMP,
    gm_home_score INT,
    gm_away_score INT,
    gm_status VARCHAR(20) DEFAULT 'Scheduled', -- Scheduled, Live, Finished
    gm_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================
-- STATISTICS TABLES
-- ===========================

-- Player Game Stats (από Boxscore)
CREATE TABLE player_game_stats (
    pgs_id SERIAL PRIMARY KEY,
    pgs_fk_gm_id INT REFERENCES games(gm_id),
    pgs_fk_plr_id INT REFERENCES players(plr_id),
    pgs_fk_tm_id INT REFERENCES teams(tm_id),
    pgs_minutes_played VARCHAR(10), -- 25:30 format or DNP
    pgs_points INT DEFAULT 0,
    pgs_field_goals_made INT DEFAULT 0,
    pgs_field_goals_attempted INT DEFAULT 0,
    pgs_three_pointers_made INT DEFAULT 0,
    pgs_three_pointers_attempted INT DEFAULT 0,
    pgs_free_throws_made INT DEFAULT 0,
    pgs_free_throws_attempted INT DEFAULT 0,
    pgs_total_rebounds INT DEFAULT 0,
    pgs_assists INT DEFAULT 0,
    pgs_steals INT DEFAULT 0,
    pgs_blocks INT DEFAULT 0,
    pgs_turnovers INT DEFAULT 0,
    pgs_fouls INT DEFAULT 0,
    UNIQUE(pgs_fk_gm_id, pgs_fk_plr_id)
);

-- Team Game Stats (από Boxscore)
CREATE TABLE team_game_stats (
    tmgs_id SERIAL PRIMARY KEY,
    tmgs_fk_gm_id INT REFERENCES games(gm_id),
    tmgs_fk_tm_id INT REFERENCES teams(tm_id),
    tmgs_is_home BOOLEAN,
    tmgs_points INT DEFAULT 0,
    tmgs_field_goals_made INT DEFAULT 0,
    tmgs_field_goals_attempted INT DEFAULT 0,
    tmgs_three_pointers_made INT DEFAULT 0,
    tmgs_three_pointers_attempted INT DEFAULT 0,
    tmgs_free_throws_made INT DEFAULT 0,
    tmgs_free_throws_attempted INT DEFAULT 0,
    tmgs_total_rebounds INT DEFAULT 0,
    tmgs_assists INT DEFAULT 0,
    tmgs_steals INT DEFAULT 0,
    tmgs_blocks INT DEFAULT 0,
    tmgs_turnovers INT DEFAULT 0,
    tmgs_fouls INT DEFAULT 0,
    UNIQUE(tmgs_fk_gm_id, tmgs_fk_tm_id)
);

-- Scoring Events (από Points)
CREATE TABLE scoring_events (
    sc_id SERIAL PRIMARY KEY,
    sc_fk_gm_id INT REFERENCES games(gm_id),
    sc_fk_tm_id INT REFERENCES teams(tm_id),
    sc_fk_plr_id INT REFERENCES players(plr_id),
    sc_period INT, -- 1-4 + overtime
    sc_time_remaining VARCHAR(10), -- 9:45 format
    sc_points_scored INT, -- 1, 2, 3
    sc_shot_type VARCHAR(50), -- 2PT, 3PT, FT
    sc_zone VARCHAR(50), -- shot zone from API
    sc_is_made BOOLEAN,
    sc_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================
-- INDEXES FOR PERFORMANCE
-- ===========================

-- Game lookups
CREATE INDEX idx_games_season ON games(gm_fk_ssn_id);
CREATE INDEX idx_games_date ON games(gm_date);
CREATE INDEX idx_games_teams ON games(gm_fk_home_tm_id, gm_fk_away_tm_id);

-- Stats lookups
CREATE INDEX idx_player_stats_game ON player_game_stats(pgs_fk_gm_id, pgs_fk_plr_id);
CREATE INDEX idx_player_stats_player ON player_game_stats(pgs_fk_plr_id);
CREATE INDEX idx_team_stats_game ON team_game_stats(tmgs_fk_gm_id, tmgs_fk_tm_id);

-- Scoring events
CREATE INDEX idx_scoring_events_game ON scoring_events(sc_fk_gm_id);
CREATE INDEX idx_scoring_events_player ON scoring_events(sc_fk_plr_id);