export const GAME_WORLDS_DATA = {
  game_archery_master: {
    gameId: 'game_archery_master',
    title: 'Archery Master: Bullseye Pro',
    themeColor: 'linear-gradient(135deg, #00f2fe, #4facfe)',
    worlds: [
      {
        id: 'world_1',
        name: 'WORLD 1: SUNNY FOREST',
        icon: '🌲',
        levels: [
          {
            level: 1,
            title: 'Target Practice',
            difficulty: 1,
            targetScore: 200,
            starThresholds: [200, 350, 500],
            coinsReward: 100,
            xpReward: 150,
            objective: 'Hit stationary targets to learn basic aim & arrow trajectory.',
            windSpeed: 0,
            targetSpeed: 0,
            arrows: 5,
            unlockReward: 'Hunter Bow 🏹'
          },
          {
            level: 2,
            title: 'Gentle Breeze',
            difficulty: 2,
            targetScore: 300,
            starThresholds: [300, 500, 700],
            coinsReward: 120,
            xpReward: 180,
            objective: 'Compensate for light crosswinds (4 km/h) to score bullseyes.',
            windSpeed: 4,
            targetSpeed: 0,
            arrows: 5,
            unlockReward: 'Feather Quiver 🪶'
          },
          {
            level: 3,
            title: 'Moving Target',
            difficulty: 2,
            targetScore: 400,
            starThresholds: [400, 650, 900],
            coinsReward: 150,
            xpReward: 220,
            objective: 'Track oscillating targets moving slowly horizontally.',
            windSpeed: 5,
            targetSpeed: 1.2,
            arrows: 6,
            unlockReward: 'Hawkeye Scope 🎯'
          },
          {
            level: 4,
            title: 'Forest Storm Challenge',
            difficulty: 3,
            targetScore: 550,
            starThresholds: [550, 850, 1200],
            coinsReward: 200,
            xpReward: 300,
            objective: 'Overcome sudden gusts of wind (10 km/h) & distant targets.',
            windSpeed: 10,
            targetSpeed: 1.8,
            arrows: 6,
            unlockReward: 'Forest Master Badge 🌲'
          }
        ]
      },
      {
        id: 'world_2',
        name: 'WORLD 2: CYBER DOME',
        icon: '⚡',
        levels: [
          {
            level: 5,
            title: 'Neon Drift',
            difficulty: 3,
            targetScore: 700,
            starThresholds: [700, 1000, 1400],
            coinsReward: 250,
            xpReward: 350,
            objective: 'Rapidly moving holographic targets with changing wind vectors.',
            windSpeed: 12,
            targetSpeed: 2.2,
            arrows: 7,
            unlockReward: 'Plasma Arrowhead ⚡'
          },
          {
            level: 6,
            title: 'Laser Matrix',
            difficulty: 4,
            targetScore: 900,
            starThresholds: [900, 1300, 1800],
            coinsReward: 300,
            xpReward: 420,
            objective: 'Hit multi-layered concentric targets in rapid succession.',
            windSpeed: 15,
            targetSpeed: 2.8,
            arrows: 7,
            unlockReward: 'Cyber Reflex Bow 💫'
          },
          {
            level: 7,
            title: 'Vortex Gale',
            difficulty: 4,
            targetScore: 1100,
            starThresholds: [1100, 1600, 2200],
            coinsReward: 350,
            xpReward: 500,
            objective: 'Extreme turbulence (20 km/h) and zig-zag moving targets.',
            windSpeed: 20,
            targetSpeed: 3.4,
            arrows: 8,
            unlockReward: 'Titanium Quiver 🛡️'
          },
          {
            level: 8,
            title: 'Grand Master Showdown',
            difficulty: 5,
            targetScore: 1400,
            starThresholds: [1400, 2000, 2800],
            coinsReward: 500,
            xpReward: 800,
            objective: 'Final Bullseye Master trial! Extreme distance, high wind, and fast target speed.',
            windSpeed: 25,
            targetSpeed: 4.2,
            arrows: 8,
            unlockReward: '🏆 Legendary Grandmaster Trophy'
          }
        ]
      }
    ]
  },

  game_galaxy_shooter: {
    gameId: 'game_galaxy_shooter',
    title: 'Galaxy Invaders 3000',
    themeColor: 'linear-gradient(135deg, #7928ca, #ff0080)',
    worlds: [
      {
        id: 'sector_1',
        name: 'SECTOR 1: ORBITAL DEFENSE',
        icon: '🌌',
        levels: [
          {
            level: 1,
            title: 'Scout Vanguard',
            difficulty: 1,
            targetScore: 300,
            starThresholds: [300, 600, 1000],
            coinsReward: 100,
            xpReward: 150,
            objective: 'Eliminate incoming scout probes and learn starship dodging.',
            enemySpeed: 1.0,
            spawnRate: 1500,
            unlockReward: 'Dual Plasma Cannons 🚀'
          },
          {
            level: 2,
            title: 'Asteroid Belt Rush',
            difficulty: 2,
            targetScore: 500,
            starThresholds: [500, 900, 1400],
            coinsReward: 130,
            xpReward: 200,
            objective: 'Blast through tumbling dense asteroids and interceptors.',
            enemySpeed: 1.3,
            spawnRate: 1300,
            unlockReward: 'Deflector Shield Tier 1 🛡️'
          },
          {
            level: 3,
            title: 'Elite Drone Swarm',
            difficulty: 2,
            targetScore: 800,
            starThresholds: [800, 1400, 2000],
            coinsReward: 160,
            xpReward: 250,
            objective: 'Dodge homing projectiles from aggressive alien drones.',
            enemySpeed: 1.6,
            spawnRate: 1100,
            unlockReward: 'EMP Burst Mod 💥'
          },
          {
            level: 4,
            title: 'Destroyer Cruiser Patrol',
            difficulty: 3,
            targetScore: 1200,
            starThresholds: [1200, 1900, 2800],
            coinsReward: 220,
            xpReward: 320,
            objective: 'Defeat armored mini-cruisers with reinforced energy shields.',
            enemySpeed: 1.9,
            spawnRate: 900,
            unlockReward: 'Homing Missiles 🚀'
          }
        ]
      },
      {
        id: 'sector_2',
        name: 'SECTOR 2: NEBULA CORE',
        icon: '🛸',
        levels: [
          {
            level: 5,
            title: 'Plasma Storm',
            difficulty: 3,
            targetScore: 1600,
            starThresholds: [1600, 2500, 3600],
            coinsReward: 280,
            xpReward: 400,
            objective: 'Survive in low visibility with hyper-velocity enemy waves.',
            enemySpeed: 2.3,
            spawnRate: 750,
            unlockReward: 'Hyper Thrusters ⚡'
          },
          {
            level: 6,
            title: 'Mothership Assault',
            difficulty: 4,
            targetScore: 2200,
            starThresholds: [2200, 3400, 4800],
            coinsReward: 350,
            xpReward: 520,
            objective: 'Infiltrate the command fleet and breach perimeter defenses.',
            enemySpeed: 2.7,
            spawnRate: 650,
            unlockReward: 'Triple Fusion Laser 🌟'
          },
          {
            level: 7,
            title: 'Armada Finale',
            difficulty: 5,
            targetScore: 3000,
            starThresholds: [3000, 4500, 6500],
            coinsReward: 450,
            xpReward: 700,
            objective: 'Defeat the colossal Alien Dreadnought Boss!',
            enemySpeed: 3.2,
            spawnRate: 500,
            unlockReward: '👑 Admiral Star Fleet Crest'
          }
        ]
      }
    ]
  },

  game_brick_breaker: {
    gameId: 'game_brick_breaker',
    title: 'Brick Breaker Extreme',
    themeColor: 'linear-gradient(135deg, #ffb703, #fb8500)',
    worlds: [
      {
        id: 'zone_1',
        name: 'ZONE 1: RETRO GRID',
        icon: '🧱',
        levels: [
          { level: 1, title: 'Simple Wall', difficulty: 1, targetScore: 300, starThresholds: [300, 600, 900], coinsReward: 100, xpReward: 150, objective: 'Clear the 3-row basic brick formation.', rows: 3, ballSpeed: 4, unlockReward: 'Laser Blaster 🔫' },
          { level: 2, title: 'Checkered Pyramid', difficulty: 2, targetScore: 600, starThresholds: [600, 1000, 1500], coinsReward: 120, xpReward: 180, objective: 'Destroy the pyramid formation and catch power-ups.', rows: 4, ballSpeed: 4.5, unlockReward: 'Wide Paddle 🏓' },
          { level: 3, title: 'Steel Fortress', difficulty: 2, targetScore: 900, starThresholds: [900, 1500, 2200], coinsReward: 150, xpReward: 220, objective: 'Shatter reinforced double-hit silver bricks.', rows: 5, ballSpeed: 5, unlockReward: 'Fireball Sphere 🔥' },
          { level: 4, title: 'Diamond Grid', difficulty: 3, targetScore: 1300, starThresholds: [1300, 2000, 3000], coinsReward: 200, xpReward: 300, objective: 'Clear moving diamond barriers before the timer runs out.', rows: 6, ballSpeed: 5.5, unlockReward: 'Multi-Ball Matrix ⚾' }
        ]
      },
      {
        id: 'zone_2',
        name: 'ZONE 2: NEON BARRICADE',
        icon: '💎',
        levels: [
          { level: 5, title: 'Laser Maze', difficulty: 3, targetScore: 1800, starThresholds: [1800, 2700, 3800], coinsReward: 260, xpReward: 380, objective: 'Navigate tight laser corridors and bouncing angles.', rows: 6, ballSpeed: 6, unlockReward: 'Plasma Cannon 💥' },
          { level: 6, title: 'Crystal Cascade', difficulty: 4, targetScore: 2400, starThresholds: [2400, 3600, 5000], coinsReward: 320, xpReward: 480, objective: 'Clear 3-hit crystal blocks with explosive chains.', rows: 7, ballSpeed: 6.5, unlockReward: 'Electro Magnet 🧲' },
          { level: 7, title: 'Omega Core', difficulty: 5, targetScore: 3200, starThresholds: [3200, 4800, 6800], coinsReward: 450, xpReward: 700, objective: 'Break the revolving Boss Core shield!', rows: 8, ballSpeed: 7.2, unlockReward: '🏆 Master Breaker Trophy' }
        ]
      }
    ]
  },

  game_neon_snake: {
    gameId: 'game_neon_snake',
    title: 'Neon Snake Arena',
    themeColor: 'linear-gradient(135deg, #38b000, #70e000)',
    worlds: [
      {
        id: 'arena_1',
        name: 'ARENA 1: CYBER GRID',
        icon: '🐍',
        levels: [
          { level: 1, title: 'Green Glow', difficulty: 1, targetScore: 200, starThresholds: [200, 400, 600], coinsReward: 100, xpReward: 150, objective: 'Reach length of 20 in open arena without hitting walls.', speed: 110, unlockReward: 'Neon Blue Trail 🟦' },
          { level: 2, title: 'Speed Surge', difficulty: 2, targetScore: 400, starThresholds: [400, 700, 1000], coinsReward: 130, xpReward: 200, objective: 'Eat speed booster apples and score combo multipliers.', speed: 95, unlockReward: 'Golden Fruit Aura ✨' },
          { level: 3, title: 'Maze Barriers', difficulty: 3, targetScore: 600, starThresholds: [600, 1000, 1500], coinsReward: 170, xpReward: 260, objective: 'Steer through corner obstacles while growing longer.', speed: 85, unlockReward: 'Cyber Ghost Skin 👻' },
          { level: 4, title: 'Turbo Championship', difficulty: 4, targetScore: 900, starThresholds: [900, 1500, 2200], coinsReward: 250, xpReward: 380, objective: 'Survive at hyper speed (70ms tick) and reach length 50.', speed: 70, unlockReward: '👑 Apex Viper Trophy' }
        ]
      }
    ]
  },

  game_pixel_runner: {
    gameId: 'game_pixel_runner',
    title: 'Dino Runner: Jungle Jump',
    themeColor: 'linear-gradient(135deg, #00b4d8, #0077b6)',
    worlds: [
      {
        id: 'jungle_1',
        name: 'EXPEDITION: ANCIENT JUNGLE',
        icon: '🦖',
        levels: [
          { level: 1, title: 'Sunny Plains', difficulty: 1, targetScore: 300, starThresholds: [300, 600, 1000], coinsReward: 100, xpReward: 150, objective: 'Leap over small cacti and collect 20 gold rings.', speed: 6, unlockReward: 'Speed Boots 👟' },
          { level: 2, title: 'Night Desert', difficulty: 2, targetScore: 600, starThresholds: [600, 1100, 1700], coinsReward: 140, xpReward: 210, objective: 'Duck under flying pterodactyls in the dark.', speed: 7.5, unlockReward: 'Night Vision Goggles 🥽' },
          { level: 3, title: 'Volcano Pass', difficulty: 3, targetScore: 1000, starThresholds: [1000, 1800, 2600], coinsReward: 200, xpReward: 300, objective: 'Execute precise double jumps over lava pits.', speed: 9, unlockReward: 'Lava Shield 🌋' },
          { level: 4, title: 'Cyber Jungle Marathon', difficulty: 4, targetScore: 1500, starThresholds: [1500, 2500, 3800], coinsReward: 300, xpReward: 480, objective: 'Endless rush at maximum velocity!', speed: 11, unlockReward: '👑 Prehistoric Legend Crest' }
        ]
      }
    ]
  },
  game_cricket_premier_league: {
    gameId: 'game_cricket_premier_league',
    title: 'Cricket Premier League 3D',
    themeColor: 'linear-gradient(135deg, #10b981, #047857)',
    worlds: [
      {
        id: 'cpl_group',
        name: 'LEAGUE: GROUP STAGE',
        icon: '🏏',
        levels: [
          { level: 1, title: 'Super Over: Warm Up', difficulty: 1, targetScore: 16, starThresholds: [16, 24, 32], coinsReward: 120, xpReward: 180, objective: 'Score 16+ runs in 6 balls against Medium pacers.', unlockReward: 'Willow Master Bat 🏏' },
          { level: 2, title: 'Powerplay Blast', difficulty: 2, targetScore: 22, starThresholds: [22, 28, 36], coinsReward: 160, xpReward: 240, objective: 'Chase 22 runs against fast yorkers & swing balls.', unlockReward: 'Gold Batting Gloves 🧤' },
          { level: 3, title: 'Spin Web Challenge', difficulty: 3, targetScore: 28, starThresholds: [28, 34, 40], coinsReward: 220, xpReward: 320, objective: 'Time the googly spin deliveries to find boundaries.', unlockReward: 'Titanium Helmet 🪖' },
          { level: 4, title: '🏆 Grand IPL Trophy Final', difficulty: 4, targetScore: 36, starThresholds: [36, 42, 50], coinsReward: 400, xpReward: 600, objective: 'Score 36+ runs in the last over to lift the trophy!', unlockReward: '👑 Premier League Champion Trophy' }
        ]
      }
    ]
  },

  game_cyber_car_drift: {
    gameId: 'game_cyber_car_drift',
    title: 'Cyber Car Drift 2077',
    themeColor: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
    worlds: [
      {
        id: 'drift_city',
        name: 'NEON CITY CIRCUIT',
        icon: '🏎️',
        levels: [
          { level: 1, title: 'Neon Highway Drift', difficulty: 1, targetScore: 400, starThresholds: [400, 800, 1400], coinsReward: 120, xpReward: 180, objective: 'Maintain drift angles around wide highway turns.', unlockReward: 'Neon Purple Rims 🛞' },
          { level: 2, title: 'Apex Hairpin Alley', difficulty: 2, targetScore: 800, starThresholds: [800, 1400, 2200], coinsReward: 180, xpReward: 260, objective: 'Chain continuous drift combos without touching barriers.', unlockReward: 'Twin Turbo Exhaust 🔥' },
          { level: 3, title: 'Cyber Storm GP', difficulty: 3, targetScore: 1400, starThresholds: [1400, 2200, 3200], coinsReward: 250, xpReward: 360, objective: 'Drift at 200 km/h with nitro boost multipliers.', unlockReward: 'Carbon Aero Wing 🏁' },
          { level: 4, title: '👑 Drift King Final', difficulty: 4, targetScore: 2200, starThresholds: [2200, 3200, 4500], coinsReward: 450, xpReward: 650, objective: 'Beat the Tokyo Midnight Drift King high score!', unlockReward: '👑 Cyber Legend GT Car' }
        ]
      }
    ]
  },

  game_police_highway_pursuit: {
    gameId: 'game_police_highway_pursuit',
    title: 'Police Highway Pursuit',
    themeColor: 'linear-gradient(135deg, #2563eb, #dc2626)',
    worlds: [
      {
        id: 'pursuit_patrol',
        name: 'HIGHWAY PATROL ZONE',
        icon: '🚨',
        levels: [
          { level: 1, title: 'Code 2: Reckless Speeder', difficulty: 1, targetScore: 500, starThresholds: [500, 1000, 1800], coinsReward: 120, xpReward: 180, objective: 'Weave through light traffic and takedown 3 suspects.', unlockReward: 'Interceptor Siren 🚨' },
          { level: 2, title: 'Code 3: Fast Getaway', difficulty: 2, targetScore: 1000, starThresholds: [1000, 1800, 2800], coinsReward: 180, xpReward: 260, objective: 'Pursue armored getaway vehicles at high speed.', unlockReward: 'Reinforced Push Bumper 🛡️' },
          { level: 3, title: 'Spike Strip Trap', difficulty: 3, targetScore: 1800, starThresholds: [1800, 2800, 4000], coinsReward: 260, xpReward: 380, objective: 'Dodge oil slicks & roadblock trucks to arrest bosses.', unlockReward: 'Nitro Police Interceptor 🚓' },
          { level: 4, title: '👑 Most Wanted Bust', difficulty: 4, targetScore: 2800, starThresholds: [2800, 4200, 6000], coinsReward: 480, xpReward: 700, objective: 'Final high-octane city takedown of the syndicate kingpin!', unlockReward: '👑 Chief of Police Gold Star' }
        ]
      }
    ]
  },

  game_moto_xtreme: {
    gameId: 'game_moto_xtreme',
    title: 'Moto Xtreme Trials',
    themeColor: 'linear-gradient(135deg, #f97316, #ef4444)',
    worlds: [
      {
        id: 'dirt_trials',
        name: 'CANYON DIRT TRIALS',
        icon: '🏍️',
        levels: [
          { level: 1, title: 'Canyon Jump', difficulty: 1, targetScore: 300, starThresholds: [300, 600, 1000], coinsReward: 110, xpReward: 160, objective: 'Land clean jumps and perform your first backflip.', unlockReward: 'Stunt Helmet 🪖' },
          { level: 2, title: 'Rocky Ridge', difficulty: 2, targetScore: 700, starThresholds: [700, 1200, 1800], coinsReward: 160, xpReward: 240, objective: 'Balance bike pitch over steep rocky hill climbs.', unlockReward: 'Offroad Suspension ⚙️' },
          { level: 3, title: 'Lava Gap Leap', difficulty: 3, targetScore: 1200, starThresholds: [1200, 2000, 3000], coinsReward: 240, xpReward: 350, objective: 'Perform double backflips over hazardous pits.', unlockReward: 'Nitro Dirt Bike 🔥' },
          { level: 4, title: '👑 Xtreme Motocross Cup', difficulty: 4, targetScore: 2000, starThresholds: [2000, 3200, 4800], coinsReward: 420, xpReward: 620, objective: 'Complete the ultimate extreme obstacle trial course!', unlockReward: '👑 X-Games Motocross Gold Medal' }
        ]
      }
    ]
  },

  game_penalty_shootout: {
    gameId: 'game_penalty_shootout',
    title: 'Penalty Shootout Pro',
    themeColor: 'linear-gradient(135deg, #059669, #0284c7)',
    worlds: [
      {
        id: 'stadium_cup',
        name: 'WORLD SOCCER CUP',
        icon: '⚽',
        levels: [
          { level: 1, title: 'Round of 16', difficulty: 1, targetScore: 3, starThresholds: [3, 4, 5], coinsReward: 110, xpReward: 160, objective: 'Score 3 penalty goals past the rookie keeper.', unlockReward: 'Golden Boots 👟' },
          { level: 2, title: 'Quarter Final', difficulty: 2, targetScore: 4, starThresholds: [4, 5, 6], coinsReward: 160, xpReward: 240, objective: 'Curve shots into the top corners against agile goalie.', unlockReward: 'Match Soccer Ball ⚽' },
          { level: 3, title: 'Semi Final Thriller', difficulty: 3, targetScore: 5, starThresholds: [5, 6, 7], coinsReward: 240, xpReward: 350, objective: 'Overcome moving wind drift & elite reflexes.', unlockReward: 'Captain Armband 🏅' },
          { level: 4, title: '👑 World Cup Final', difficulty: 4, targetScore: 6, starThresholds: [6, 7, 8], coinsReward: 450, xpReward: 650, objective: 'Score consecutive top-bin penalties to win the World Cup!', unlockReward: '👑 World Cup Golden Trophy' }
        ]
      }
    ]
  }
};

// Generic Fallback Level Generator for any newly added games
export function getGameWorldData(game) {
  if (GAME_WORLDS_DATA[game.id]) {
    return GAME_WORLDS_DATA[game.id];
  }

  // Create standard 4 progressive levels
  return {
    gameId: game.id,
    title: game.title,
    themeColor: game.bannerColor || 'linear-gradient(135deg, #00f2fe, #4facfe)',
    worlds: [
      {
        id: 'world_1',
        name: 'WORLD 1: APEX TRIALS',
        icon: '⭐',
        levels: [
          { level: 1, title: 'Stage 1: Rookie Trial', difficulty: 1, targetScore: 200, starThresholds: [200, 400, 700], coinsReward: 100, xpReward: 150, objective: 'Learn basic mechanics and complete stage 1.', unlockReward: 'Bronze Badge 🥉' },
          { level: 2, title: 'Stage 2: Rising Challenger', difficulty: 2, targetScore: 400, starThresholds: [400, 800, 1200], coinsReward: 150, xpReward: 220, objective: 'Score points while adapting to faster pace.', unlockReward: 'Silver Badge 🥈' },
          { level: 3, title: 'Stage 3: Veteran Gauntlet', difficulty: 3, targetScore: 700, starThresholds: [700, 1300, 1900], coinsReward: 220, xpReward: 320, objective: 'Overcome high difficulty obstacles.', unlockReward: 'Gold Badge 🥇' },
          { level: 4, title: 'Stage 4: Champion Final', difficulty: 4, targetScore: 1100, starThresholds: [1100, 1900, 2800], coinsReward: 350, xpReward: 500, objective: 'Final master level showdown!', unlockReward: '👑 Champion Cup' }
        ]
      }
    ]
  };
}
