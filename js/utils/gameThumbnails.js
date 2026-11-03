// GAMINGZONE — High-Resolution Vector Artwork & Thumbnail Generator
// Every single one of the 56 games has dedicated, authentic, visually accurate artwork.
// Crisp at any DPI / 4K resolution, ultra-fast zero-network loading, modern 16:10 aspect ratio.

export function getGameThumbnailSVG(game) {
  if (!game) return '';

  // If game has uploaded thumbnail image or explicit SVG
  if (game.thumbnail) {
    if (game.thumbnail.startsWith('<svg')) {
      return game.thumbnail;
    }
    if (game.thumbnail.startsWith('/') || game.thumbnail.startsWith('http') || game.thumbnail.startsWith('data:')) {
      return `<img src="${game.thumbnail}" alt="${game.title || 'Game'}" style="width: 100%; height: 100%; object-fit: cover; display: block;" loading="lazy" />`;
    }
  }

  const id = game.id || '';
  const engine = game.engine || '';
  const title = (game.title || 'Game').toUpperCase();
  const category = (game.category || 'arcade').toUpperCase();

  // 1. Arrow Maze Escape
  if (id === 'game_arrow_maze_escape' || engine === 'ArrowMazeEscape') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg_arrow" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#1c1917"/><stop offset="100%" stop-color="#292524"/></linearGradient>
      </defs>
      <rect width="320" height="200" fill="url(#bg_arrow)"/>
      <circle cx="160" cy="95" r="75" fill="#1f1d1a" stroke="#44403c" stroke-width="2"/>
      <rect x="140" y="160" width="40" height="20" rx="4" fill="#1f1d1a" stroke="#44403c" stroke-width="2"/>
      <path d="M 110,105 L 110,70 L 160,70 L 160,110 L 205,110 L 205,70 L 235,70" fill="none" stroke="#f59e0b" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M 235,70 L 225,62 M 235,70 L 225,78" stroke="#f59e0b" stroke-width="4.5" stroke-linecap="round"/>
      <path d="M 95,130 L 140,130 L 140,155 L 180,155 L 180,125 L 225,125" fill="none" stroke="#ef4444" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M 225,125 L 217,117 M 225,125 L 217,133" stroke="#ef4444" stroke-width="4.5" stroke-linecap="round"/>
      <path d="M 160,85 L 160,45 L 125,45" fill="none" stroke="#00e5ff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M 125,45 L 133,37 M 125,45 L 133,53" stroke="#00e5ff" stroke-width="4.5" stroke-linecap="round"/>
      <circle cx="100" cy="40" r="5" fill="#38bdf8"/>
      <circle cx="115" cy="40" r="5" fill="#38bdf8"/>
      <circle cx="130" cy="40" r="5" fill="#38bdf8"/>
      <text x="160" y="186" font-family="'Outfit', sans-serif" font-size="11" font-weight="800" fill="#f59e0b" letter-spacing="1.5" text-anchor="middle">ARROW MAZE ESCAPE</text>
    </svg>`;
  }

  // 2. Cricket Premier League
  if (id === 'game_cricket_premier_league' || engine === 'CricketPremierLeague') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="cricketGlow" cx="50%" cy="30%" r="70%"><stop offset="0%" stop-color="#14532d"/><stop offset="100%" stop-color="#052e16"/></radialGradient>
        <linearGradient id="cBat" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fbbf24"/><stop offset="100%" stop-color="#d97706"/></linearGradient>
      </defs>
      <rect width="320" height="200" fill="url(#cricketGlow)"/>
      <ellipse cx="160" cy="140" rx="140" ry="55" fill="#166534" stroke="#22c55e" stroke-width="2"/>
      <path d="M 125,115 L 195,115 L 210,185 L 110,185 Z" fill="#b45309" opacity="0.8"/>
      <!-- Wickets -->
      <line x1="150" y1="95" x2="150" y2="120" stroke="#fef08a" stroke-width="2.5"/>
      <line x1="160" y1="95" x2="160" y2="120" stroke="#fef08a" stroke-width="2.5"/>
      <line x1="170" y1="95" x2="170" y2="120" stroke="#fef08a" stroke-width="2.5"/>
      <line x1="148" y1="95" x2="172" y2="95" stroke="#fef08a" stroke-width="2.5"/>
      <!-- Cricket Bat & Ball -->
      <g transform="translate(140, 50) rotate(35)">
        <rect x="0" y="0" width="18" height="95" rx="5" fill="url(#cBat)" stroke="#78350f" stroke-width="1.5"/>
        <rect x="5" y="93" width="8" height="32" rx="2" fill="#ffffff"/>
      </g>
      <circle cx="215" cy="85" r="14" fill="#dc2626" stroke="#ffffff" stroke-width="2"/>
      <path d="M 205,85 Q 215,75 225,85" stroke="#ffffff" stroke-width="1.5" fill="none"/>
      <text x="160" y="32" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#ffffff" letter-spacing="1.5" text-anchor="middle">CRICKET PREMIER LEAGUE</text>
    </svg>`;
  }

  // 3. Cricket World Cup Chase
  if (id === 'game_cricket_world_cup_chase' || engine === 'CricketWorldCupChase') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="wcGlow" cx="50%" cy="20%" r="80%"><stop offset="0%" stop-color="#0369a1"/><stop offset="100%" stop-color="#082f49"/></radialGradient>
      </defs>
      <rect width="320" height="200" fill="url(#wcGlow)"/>
      <ellipse cx="160" cy="145" rx="145" ry="50" fill="#15803d" stroke="#4ade80" stroke-width="2"/>
      <!-- Stadium Floodlights -->
      <circle cx="40" cy="35" r="14" fill="#fef08a" opacity="0.3"/><circle cx="40" cy="35" r="7" fill="#ffffff"/>
      <circle cx="280" cy="35" r="14" fill="#fef08a" opacity="0.3"/><circle cx="280" cy="35" r="7" fill="#ffffff"/>
      <!-- Trophy -->
      <g transform="translate(160, 95)">
        <path d="M -16,-20 L 16,-20 L 12,10 L -12,10 Z" fill="#f59e0b"/>
        <path d="M -22,-16 C -28,-16 -28,0 -14,2" fill="none" stroke="#f59e0b" stroke-width="3"/>
        <path d="M 22,-16 C 28,-16 28,0 14,2" fill="none" stroke="#f59e0b" stroke-width="3"/>
        <rect x="-6" y="10" width="12" height="14" fill="#d97706"/>
        <rect x="-14" y="24" width="28" height="8" rx="2" fill="#92400e"/>
      </g>
      <text x="160" y="32" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#f59e0b" letter-spacing="1.5" text-anchor="middle">50-OVER WORLD CUP CHASE</text>
    </svg>`;
  }

  // 4. Cyber Car Drift 2077
  if (id === 'game_cyber_car_drift' || engine === 'CyberCarDrift') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cyberRoad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#0f172a"/><stop offset="100%" stop-color="#1e1b4b"/></linearGradient>
      </defs>
      <rect width="320" height="200" fill="url(#cyberRoad)"/>
      <polygon points="0,200 320,200 190,90 130,90" fill="#090d16" stroke="#00e5ff" stroke-width="1.5"/>
      <line x1="160" y1="90" x2="160" y2="200" stroke="#f59e0b" stroke-width="3" stroke-dasharray="10,10"/>
      <!-- Drifting Sports Car -->
      <g transform="translate(100, 115) rotate(-6)">
        <path d="M 15,35 L 35,12 L 75,12 L 95,35 L 110,42 L 0,42 Z" fill="#00e5ff"/>
        <polygon points="40,14 70,14 85,32 30,32" fill="#090d16"/>
        <ellipse cx="25" cy="44" rx="12" ry="12" fill="#111827" stroke="#38bdf8" stroke-width="2"/>
        <ellipse cx="90" cy="44" rx="12" ry="12" fill="#111827" stroke="#38bdf8" stroke-width="2"/>
        <!-- Headlight Beams -->
        <polygon points="110,38 170,25 170,55 110,42" fill="#fef08a" opacity="0.3"/>
      </g>
      <text x="160" y="32" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#00e5ff" letter-spacing="1.5" text-anchor="middle">CYBER CAR DRIFT 2077</text>
    </svg>`;
  }

  // 5. Helix Jump Neon
  if (id === 'game_helix_jump_neon' || engine === 'HelixJumpNeon') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#0b0f19"/>
      <!-- Central Cylinder Tower -->
      <rect x="145" y="10" width="30" height="180" fill="#1e293b"/>
      <!-- Helix Disks -->
      <ellipse cx="160" cy="50" rx="75" ry="16" fill="#10b981" opacity="0.8"/>
      <ellipse cx="160" cy="95" rx="75" ry="16" fill="#10b981" opacity="0.8"/>
      <path d="M 120,95 A 75 16 0 0 0 160,111 L 160,95 Z" fill="#ef4444"/>
      <ellipse cx="160" cy="140" rx="75" ry="16" fill="#10b981" opacity="0.8"/>
      <!-- Bouncing Cyan Orb -->
      <circle cx="160" cy="74" r="14" fill="#00e5ff"/>
      <circle cx="156" cy="70" r="4" fill="#ffffff"/>
      <text x="160" y="186" font-family="'Outfit', sans-serif" font-size="11" font-weight="800" fill="#10b981" letter-spacing="1.5" text-anchor="middle">HELIX JUMP NEON</text>
    </svg>`;
  }

  // 6. Stack Tower Builder
  if (id === 'game_stack_tower_builder' || engine === 'StackTowerBuilder') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#090d16"/>
      <g transform="translate(160, 160)">
        <polygon points="0,-15 55,10 0,35 -55,10" fill="#3b82f6"/>
        <polygon points="0,-35 55,-10 0,15 -55,-10" fill="#06b6d4"/>
        <polygon points="0,-55 55,-30 0,-5 -55,-30" fill="#10b981"/>
        <polygon points="0,-75 55,-50 0,-25 -55,-50" fill="#f59e0b"/>
        <polygon points="0,-95 55,-70 0,-45 -55,-70" fill="#ec4899"/>
        <polygon points="0,-115 55,-90 0,-65 -55,-90" fill="#8b5cf6"/>
      </g>
      <text x="160" y="32" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#ec4899" letter-spacing="1.5" text-anchor="middle">STACK TOWER BUILDER</text>
    </svg>`;
  }

  // 7. Candy Blast Match-3
  if (id === 'game_candy_blast_match3' || engine === 'CandyBlastMatch3') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#4a044e"/>
      <circle cx="85" cy="100" r="24" fill="#ef4444"/><text x="85" y="108" font-size="24" text-anchor="middle">🍓</text>
      <circle cx="135" cy="100" r="26" fill="#f59e0b"/><text x="135" y="109" font-size="26" text-anchor="middle">🍋</text>
      <circle cx="185" cy="100" r="26" fill="#ec4899"/><text x="185" y="109" font-size="26" text-anchor="middle">🍬</text>
      <circle cx="235" cy="100" r="24" fill="#3b82f6"/><text x="235" y="108" font-size="24" text-anchor="middle">🫐</text>
      <text x="160" y="34" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#f472b6" letter-spacing="1.5" text-anchor="middle">CANDY BLAST MATCH-3</text>
    </svg>`;
  }

  // 8. Table Tennis Pro
  if (id === 'game_table_tennis_pro' || engine === 'TableTennisPro') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#0f172a"/>
      <!-- Ping Pong Table -->
      <polygon points="40,150 280,150 240,80 80,80" fill="#047857" stroke="#ffffff" stroke-width="2"/>
      <line x1="160" y1="80" x2="160" y2="150" stroke="#ffffff" stroke-width="1.5"/>
      <line x1="60" y1="115" x2="260" y2="115" stroke="#ffffff" stroke-width="3" stroke-dasharray="6,4"/>
      <!-- Paddle & Ball -->
      <circle cx="110" cy="95" r="20" fill="#ef4444" stroke="#ffffff" stroke-width="1.5"/>
      <rect x="95" y="110" width="10" height="24" rx="2" fill="#78350f"/>
      <circle cx="175" cy="100" r="7" fill="#ffffff" stroke="#cbd5e1" stroke-width="1"/>
      <text x="160" y="32" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#34d399" letter-spacing="1.5" text-anchor="middle">TABLE TENNIS PRO</text>
    </svg>`;
  }

  // 9. Darts Bullseye King
  if (id === 'game_darts_bullseye_king' || engine === 'DartsBullseyeKing') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#090d16"/>
      <!-- Dartboard -->
      <circle cx="160" cy="100" r="70" fill="#18181b" stroke="#71717a" stroke-width="3"/>
      <circle cx="160" cy="100" r="54" fill="none" stroke="#22c55e" stroke-width="6"/>
      <circle cx="160" cy="100" r="32" fill="none" stroke="#ef4444" stroke-width="6"/>
      <circle cx="160" cy="100" r="14" fill="#22c55e"/>
      <circle cx="160" cy="100" r="6" fill="#ef4444"/>
      <!-- Dart in Bullseye -->
      <g transform="translate(160, 100) rotate(-40)">
        <line x1="0" y1="0" x2="55" y2="0" stroke="#e2e8f0" stroke-width="3"/>
        <polygon points="50,-8 65,0 50,8" fill="#f59e0b"/>
      </g>
      <text x="160" y="30" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#ef4444" letter-spacing="1.5" text-anchor="middle">DARTS BULLSEYE KING</text>
    </svg>`;
  }

  // 10. Pac-Maze Classic
  if (id === 'game_pac_maze_classic' || engine === 'PacMazeClassic') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#000000"/>
      <rect x="30" y="45" width="260" height="120" rx="10" fill="none" stroke="#2563eb" stroke-width="3.5"/>
      <path d="M 30,105 L 100,105 M 220,105 L 290,105" stroke="#2563eb" stroke-width="3.5"/>
      <!-- Pacman -->
      <circle cx="110" cy="105" r="22" fill="#ffd166"/>
      <polygon points="110,105 135,92 135,118" fill="#000000"/>
      <circle cx="150" cy="105" r="4.5" fill="#fef08a"/>
      <circle cx="175" cy="105" r="4.5" fill="#fef08a"/>
      <!-- Ghost -->
      <g transform="translate(195, 90)">
        <path d="M 0,15 C 0,3 24,3 24,15 L 24,28 L 18,24 L 12,28 L 6,24 L 0,28 Z" fill="#ef4444"/>
        <circle cx="7" cy="12" r="3" fill="#fff"/><circle cx="8" cy="12" r="1.5" fill="#00f"/>
        <circle cx="17" cy="12" r="3" fill="#fff"/><circle cx="18" cy="12" r="1.5" fill="#00f"/>
      </g>
      <text x="160" y="30" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#ffd166" letter-spacing="1.5" text-anchor="middle">PAC-MAZE CLASSIC</text>
    </svg>`;
  }

  // 11. Billiards 8-Ball
  if (id === 'game_billiards_8ball' || engine === 'Billiards8Ball') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#064e3b"/>
      <rect x="25" y="35" width="270" height="130" rx="14" fill="#047857" stroke="#78350f" stroke-width="8"/>
      <!-- Corner Pocket -->
      <circle cx="35" cy="45" r="12" fill="#18181b"/>
      <circle cx="285" cy="45" r="12" fill="#18181b"/>
      <circle cx="35" cy="155" r="12" fill="#18181b"/>
      <circle cx="285" cy="155" r="12" fill="#18181b"/>
      <!-- 8-Ball & Cue Ball -->
      <circle cx="140" cy="100" r="16" fill="#111827"/>
      <circle cx="140" cy="100" r="6" fill="#ffffff"/>
      <text x="140" y="103" font-size="7" font-weight="900" text-anchor="middle">8</text>
      <circle cx="190" cy="115" r="16" fill="#ffffff" stroke="#cbd5e1"/>
      <line x1="260" y1="140" x2="208" y2="121" stroke="#d97706" stroke-width="4.5" stroke-linecap="round"/>
      <text x="160" y="24" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#fbbf24" letter-spacing="1.5" text-anchor="middle">8-BALL POOL BILLIARDS</text>
    </svg>`;
  }

  // 12. Stickman Street Fighter / Combat
  if (id === 'game_street_fighter_stick' || id === 'game_stickman_shadow_combat' || engine === 'StreetFighterStick' || engine === 'StickmanShadowCombat') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="dojoBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#18181b"/><stop offset="100%" stop-color="#09090b"/></linearGradient>
      </defs>
      <rect width="320" height="200" fill="url(#dojoBg)"/>
      <circle cx="160" cy="100" r="40" fill="#f59e0b" opacity="0.2"/>
      <polygon points="160,70 170,95 195,100 170,105 160,130 150,105 125,100 150,95" fill="#00e5ff"/>
      <!-- Blue Fighter -->
      <g transform="translate(100, 95)">
        <circle cx="0" cy="-25" r="8" fill="#00e5ff"/>
        <line x1="0" y1="-17" x2="0" y2="5" stroke="#00e5ff" stroke-width="3.5"/>
        <line x1="0" y1="-8" x2="20" y2="-8" stroke="#00e5ff" stroke-width="3.5"/>
        <line x1="0" y1="5" x2="-10" y2="25" stroke="#00e5ff" stroke-width="3.5"/>
        <line x1="0" y1="5" x2="15" y2="25" stroke="#00e5ff" stroke-width="3.5"/>
      </g>
      <!-- Red Fighter -->
      <g transform="translate(220, 95) scale(-1, 1)">
        <circle cx="0" cy="-25" r="8" fill="#ef4444"/>
        <line x1="0" y1="-17" x2="0" y2="5" stroke="#ef4444" stroke-width="3.5"/>
        <line x1="0" y1="-8" x2="20" y2="-8" stroke="#ef4444" stroke-width="3.5"/>
        <line x1="0" y1="5" x2="-10" y2="25" stroke="#ef4444" stroke-width="3.5"/>
        <line x1="0" y1="5" x2="15" y2="25" stroke="#ef4444" stroke-width="3.5"/>
      </g>
      <text x="160" y="32" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#ef4444" letter-spacing="1.5" text-anchor="middle">STICKMAN SHADOW COMBAT</text>
    </svg>`;
  }

  // 13. Zombie Survival Shooter
  if (id === 'game_zombie_survival_shooter' || engine === 'ZombieSurvivalShooter') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#052e16"/>
      <!-- Crosshairs -->
      <circle cx="160" cy="100" r="45" fill="none" stroke="#22c55e" stroke-width="2"/>
      <line x1="160" y1="45" x2="160" y2="155" stroke="#22c55e" stroke-width="1.5"/>
      <line x1="105" y1="100" x2="215" y2="100" stroke="#22c55e" stroke-width="1.5"/>
      <circle cx="160" cy="100" r="4" fill="#ef4444"/>
      <!-- Zombie Silhouette -->
      <circle cx="160" cy="85" r="16" fill="#15803d"/>
      <rect x="145" y="105" width="30" height="40" rx="4" fill="#15803d"/>
      <text x="160" y="32" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#22c55e" letter-spacing="1.5" text-anchor="middle">ZOMBIE SURVIVAL 3D</text>
    </svg>`;
  }

  // 14. Color Switch Pulse
  if (id === 'game_color_switch_pulse' || engine === 'ColorSwitchPulse') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#090d16"/>
      <!-- 4-Quadrant Ring -->
      <circle cx="160" cy="100" r="50" fill="none" stroke="#3b82f6" stroke-width="14" stroke-dasharray="78.5 235.5" stroke-dashoffset="0"/>
      <circle cx="160" cy="100" r="50" fill="none" stroke="#ec4899" stroke-width="14" stroke-dasharray="78.5 235.5" stroke-dashoffset="-78.5"/>
      <circle cx="160" cy="100" r="50" fill="none" stroke="#eab308" stroke-width="14" stroke-dasharray="78.5 235.5" stroke-dashoffset="-157"/>
      <circle cx="160" cy="100" r="50" fill="none" stroke="#10b981" stroke-width="14" stroke-dasharray="78.5 235.5" stroke-dashoffset="-235.5"/>
      <!-- Matching Ball -->
      <circle cx="160" cy="100" r="12" fill="#ec4899"/>
      <text x="160" y="30" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#00e5ff" letter-spacing="1.5" text-anchor="middle">COLOR SWITCH PULSE</text>
    </svg>`;
  }

  // 15. Connect Four Glow
  if (id === 'game_connect_four_glow' || engine === 'ConnectFourGlow') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#0f172a"/>
      <rect x="70" y="45" width="180" height="120" rx="10" fill="#1d4ed8"/>
      <!-- Holes & Chips -->
      <circle cx="95" cy="70" r="10" fill="#ef4444"/>
      <circle cx="125" cy="70" r="10" fill="#0f172a"/>
      <circle cx="155" cy="70" r="10" fill="#0f172a"/>
      <circle cx="185" cy="70" r="10" fill="#facc15"/>
      <circle cx="215" cy="70" r="10" fill="#0f172a"/>

      <circle cx="95" cy="100" r="10" fill="#ef4444"/>
      <circle cx="125" cy="100" r="10" fill="#facc15"/>
      <circle cx="155" cy="100" r="10" fill="#ef4444"/>
      <circle cx="185" cy="100" r="10" fill="#facc15"/>
      <circle cx="215" cy="100" r="10" fill="#0f172a"/>

      <circle cx="95" cy="130" r="10" fill="#ef4444"/>
      <circle cx="125" cy="130" r="10" fill="#facc15"/>
      <circle cx="155" cy="130" r="10" fill="#facc15"/>
      <circle cx="185" cy="130" r="10" fill="#ef4444"/>
      <circle cx="215" cy="130" r="10" fill="#facc15"/>
      <text x="160" y="30" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#38bdf8" letter-spacing="1.5" text-anchor="middle">CONNECT FOUR GLOW</text>
    </svg>`;
  }

  // 16. Neon Air Strike 1945
  if (id === 'game_neon_air_strike_1945' || engine === 'NeonAirStrike1945') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#082f49"/>
      <!-- Clouds -->
      <circle cx="60" cy="130" r="30" fill="#0c4a6e" opacity="0.5"/>
      <circle cx="260" cy="70" r="35" fill="#0c4a6e" opacity="0.5"/>
      <!-- Warbird Airplane -->
      <g transform="translate(160, 115)">
        <polygon points="0,-35 8,10 0,25 -8,10" fill="#38bdf8"/>
        <polygon points="-45,-5 45,-5 35,5 -35,5" fill="#0284c7"/>
        <polygon points="-16,20 16,20 12,25 -12,25" fill="#0284c7"/>
        <!-- Gun Tracers -->
        <line x1="-30" y1="-8" x2="-30" y2="-65" stroke="#fef08a" stroke-width="2"/>
        <line x1="30" y1="-8" x2="30" y2="-65" stroke="#fef08a" stroke-width="2"/>
      </g>
      <text x="160" y="30" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#38bdf8" letter-spacing="1.5" text-anchor="middle">AIR STRIKE 1945</text>
    </svg>`;
  }

  // 17. Space Asteroids Blast
  if (id === 'game_space_asteroids_blast' || engine === 'SpaceAsteroidsBlast') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#030712"/>
      <!-- Rocky Asteroids -->
      <polygon points="50,45 80,35 100,55 90,85 60,95 40,70" fill="none" stroke="#94a3b8" stroke-width="2.5"/>
      <polygon points="230,120 265,110 280,135 270,165 240,170 215,150" fill="none" stroke="#94a3b8" stroke-width="2.5"/>
      <!-- Triangular Vector Ship -->
      <g transform="translate(160, 110)">
        <polygon points="0,-25 18,18 0,10 -18,18" fill="none" stroke="#00e5ff" stroke-width="3"/>
        <line x1="0" y1="-25" x2="0" y2="-80" stroke="#f43f5e" stroke-width="2.5"/>
      </g>
      <text x="160" y="30" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#00e5ff" letter-spacing="1.5" text-anchor="middle">ASTEROIDS VECTOR BLAST</text>
    </svg>`;
  }

  // 18. Crossy Road Runner
  if (id === 'game_crossy_road_runner' || engine === 'CrossyRoadRunner') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#14532d"/>
      <!-- Roadway -->
      <rect x="0" y="70" width="320" height="65" fill="#334155"/>
      <line x1="0" y1="102" x2="320" y2="102" stroke="#fef08a" stroke-width="3" stroke-dasharray="14,14"/>
      <!-- Pixel Car -->
      <rect x="180" y="78" width="55" height="22" rx="3" fill="#ef4444"/>
      <!-- Chicken -->
      <rect x="100" y="145" width="20" height="22" rx="4" fill="#ffffff"/>
      <rect x="115" y="152" width="6" height="6" fill="#f97316"/>
      <rect x="107" y="140" width="8" height="6" fill="#ef4444"/>
      <text x="160" y="32" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#ffffff" letter-spacing="1.5" text-anchor="middle">CROSSY ROAD RUNNER</text>
    </svg>`;
  }

  // 19. Sudoku Cyber Master
  if (id === 'game_sudoku_cyber_master' || engine === 'SudokuCyberMaster') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#090d16"/>
      <rect x="95" y="35" width="130" height="130" fill="#111827" stroke="#00e5ff" stroke-width="2.5"/>
      <line x1="138" y1="35" x2="138" y2="165" stroke="#374151" stroke-width="1.5"/>
      <line x1="181" y1="35" x2="181" y2="165" stroke="#374151" stroke-width="1.5"/>
      <line x1="95" y1="78" x2="225" y2="78" stroke="#374151" stroke-width="1.5"/>
      <line x1="95" y1="121" x2="225" y2="121" stroke="#374151" stroke-width="1.5"/>
      <!-- Numbers -->
      <text x="116" y="65" font-size="18" font-weight="900" fill="#00e5ff" text-anchor="middle">5</text>
      <text x="160" y="65" font-size="18" font-weight="900" fill="#ffffff" text-anchor="middle">3</text>
      <text x="203" y="108" font-size="18" font-weight="900" fill="#f59e0b" text-anchor="middle">7</text>
      <text x="116" y="150" font-size="18" font-weight="900" fill="#38bdf8" text-anchor="middle">9</text>
      <text x="160" y="150" font-size="18" font-weight="900" fill="#00e5ff" text-anchor="middle">1</text>
      <text x="160" y="24" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#00e5ff" letter-spacing="1.5" text-anchor="middle">SUDOKU CYBER MASTER</text>
    </svg>`;
  }

  // 20. Cyber Space Racer
  if (id === 'game_cyber_space_racer' || engine === 'CyberSpaceRacer') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#1e1b4b"/>
      <!-- Grid Perspective -->
      <line x1="160" y1="80" x2="0" y2="200" stroke="#a855f7" stroke-width="2"/>
      <line x1="160" y1="80" x2="80" y2="200" stroke="#a855f7" stroke-width="2"/>
      <line x1="160" y1="80" x2="160" y2="200" stroke="#00e5ff" stroke-width="3"/>
      <line x1="160" y1="80" x2="240" y2="200" stroke="#a855f7" stroke-width="2"/>
      <line x1="160" y1="80" x2="320" y2="200" stroke="#a855f7" stroke-width="2"/>
      <!-- Horizon Sun -->
      <circle cx="160" cy="80" r="35" fill="#f43f5e"/>
      <text x="160" y="32" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#a855f7" letter-spacing="1.5" text-anchor="middle">CYBER SPACE RACER</text>
    </svg>`;
  }

  // 21. Drift Boss Rally
  if (id === 'game_drift_boss_rally' || engine === 'DriftBossRally') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#064e3b"/>
      <!-- Zigzag Road -->
      <path d="M 60,180 L 120,120 L 200,120 L 260,60" fill="none" stroke="#334155" stroke-width="32" stroke-linecap="square"/>
      <path d="M 60,180 L 120,120 L 200,120 L 260,60" fill="none" stroke="#f59e0b" stroke-width="2" stroke-dasharray="6,6"/>
      <rect x="145" y="110" width="30" height="18" rx="4" fill="#ef4444"/>
      <text x="160" y="30" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#f59e0b" letter-spacing="1.5" text-anchor="middle">DRIFT BOSS RALLY</text>
    </svg>`;
  }

  // 22. Laser Cannon Puzzle
  if (id === 'game_laser_cannon_puzzle' || engine === 'LaserCannonPuzzle') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#0f172a"/>
      <!-- Emitter -->
      <rect x="40" y="90" width="25" height="20" rx="3" fill="#3b82f6"/>
      <!-- Mirrors -->
      <line x1="140" y1="85" x2="165" y2="115" stroke="#00e5ff" stroke-width="4"/>
      <line x1="140" y1="145" x2="165" y2="175" stroke="#00e5ff" stroke-width="4"/>
      <circle cx="260" cy="160" r="14" fill="#10b981"/>
      <!-- Laser Beam -->
      <path d="M 65,100 L 152,100 L 152,160 L 246,160" fill="none" stroke="#ef4444" stroke-width="3"/>
      <text x="160" y="32" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#ef4444" letter-spacing="1.5" text-anchor="middle">LASER CANNON PUZZLE</text>
    </svg>`;
  }

  // 23. Paper Airplane Flight
  if (id === 'game_paper_airplane_flight' || engine === 'PaperAirplaneFlight') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#38bdf8"/>
      <ellipse cx="80" cy="150" rx="40" ry="16" fill="#ffffff" opacity="0.8"/>
      <ellipse cx="240" cy="80" rx="50" ry="18" fill="#ffffff" opacity="0.8"/>
      <!-- Paper Glider -->
      <g transform="translate(150, 90) rotate(-15)">
        <polygon points="50,0 -30,-22 0,0 -30,22" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
        <line x1="0" y1="0" x2="50" y2="0" stroke="#94a3b8" stroke-width="2"/>
      </g>
      <path d="M 60,130 Q 110,80 150,90" fill="none" stroke="#ffffff" stroke-width="2" stroke-dasharray="4,4"/>
      <text x="160" y="32" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#0f172a" letter-spacing="1.5" text-anchor="middle">PAPER AIRPLANE FLIGHT</text>
    </svg>`;
  }

  // 24. Speed Typing Warrior
  if (id === 'game_speed_typing_warrior' || engine === 'SpeedTypingWarrior') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#0f172a"/>
      <!-- Keys -->
      <rect x="70" y="60" width="36" height="36" rx="6" fill="#1e293b" stroke="#00e5ff" stroke-width="2"/>
      <text x="88" y="84" font-size="16" font-weight="900" fill="#00e5ff" text-anchor="middle">W</text>
      <rect x="115" y="60" width="36" height="36" rx="6" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5"/>
      <text x="133" y="84" font-size="16" font-weight="900" fill="#ffffff" text-anchor="middle">P</text>
      <rect x="160" y="60" width="36" height="36" rx="6" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5"/>
      <text x="178" y="84" font-size="16" font-weight="900" fill="#ffffff" text-anchor="middle">M</text>
      <rect x="205" y="60" width="45" height="36" rx="6" fill="#00e5ff"/>
      <text x="227" y="84" font-size="14" font-weight="900" fill="#0a0e17" text-anchor="middle">120</text>
      <rect x="90" y="115" width="140" height="36" rx="6" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5"/>
      <text x="160" y="139" font-size="14" font-weight="900" fill="#ffd166" text-anchor="middle">SPACEBAR</text>
      <text x="160" y="32" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#00e5ff" letter-spacing="1.5" text-anchor="middle">SPEED TYPING WARRIOR</text>
    </svg>`;
  }

  // 25. Dodgeball Extreme
  if (id === 'game_dodgeball_extreme' || engine === 'DodgeBallExtreme') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#78350f"/>
      <rect x="20" y="30" width="280" height="140" rx="8" fill="#b45309" stroke="#fef08a" stroke-width="2"/>
      <line x1="160" y1="30" x2="160" y2="170" stroke="#fef08a" stroke-width="2.5"/>
      <!-- Red Dodgeball Flying -->
      <circle cx="150" cy="100" r="24" fill="#dc2626" stroke="#ffffff" stroke-width="2"/>
      <text x="160" y="24" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#ffffff" letter-spacing="1.5" text-anchor="middle">DODGEBALL EXTREME</text>
    </svg>`;
  }

  // 26. Fishing Legend Catch
  if (id === 'game_fishing_legend_catch' || engine === 'FishingLegendCatch') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ocean" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#0284c7"/><stop offset="100%" stop-color="#082f49"/></linearGradient>
      </defs>
      <rect width="320" height="200" fill="url(#ocean)"/>
      <line x1="160" y1="0" x2="160" y2="110" stroke="#ffffff" stroke-width="2"/>
      <path d="M 160,110 C 160,122 172,122 172,112" fill="none" stroke="#f59e0b" stroke-width="3"/>
      <!-- Fish -->
      <g transform="translate(195, 125)">
        <ellipse cx="0" cy="0" rx="18" ry="9" fill="#f43f5e"/>
        <polygon points="16,0 26,-7 26,7" fill="#f43f5e"/>
      </g>
      <text x="160" y="32" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#38bdf8" letter-spacing="1.5" text-anchor="middle">FISHING LEGEND CATCH</text>
    </svg>`;
  }

  // 27. Word Scramble Rush
  if (id === 'game_word_scramble_rush' || engine === 'WordScrambleRush') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#1e1b4b"/>
      <!-- Scramble Tiles -->
      <rect x="55" y="75" width="40" height="42" rx="6" fill="#f59e0b"/>
      <text x="75" y="103" font-size="22" font-weight="900" fill="#ffffff" text-anchor="middle">W</text>
      <rect x="105" y="75" width="40" height="42" rx="6" fill="#f59e0b"/>
      <text x="125" y="103" font-size="22" font-weight="900" fill="#ffffff" text-anchor="middle">O</text>
      <rect x="155" y="75" width="40" height="42" rx="6" fill="#f59e0b"/>
      <text x="175" y="103" font-size="22" font-weight="900" fill="#ffffff" text-anchor="middle">R</text>
      <rect x="205" y="75" width="40" height="42" rx="6" fill="#f59e0b"/>
      <text x="225" y="103" font-size="22" font-weight="900" fill="#ffffff" text-anchor="middle">D</text>
      <text x="160" y="36" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#facc15" letter-spacing="1.5" text-anchor="middle">WORD SCRAMBLE RUSH</text>
    </svg>`;
  }

  // 28. Chess Blitz Tactics
  if (id === 'game_chess_blitz_tactics' || engine === 'ChessBlitzTactics') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#0a0e17"/>
      <!-- Board -->
      <rect x="100" y="40" width="120" height="120" fill="#b58863"/>
      <rect x="100" y="40" width="30" height="30" fill="#f0d9b5"/><rect x="160" y="40" width="30" height="30" fill="#f0d9b5"/>
      <rect x="130" y="70" width="30" height="30" fill="#f0d9b5"/><rect x="190" y="70" width="30" height="30" fill="#f0d9b5"/>
      <rect x="100" y="100" width="30" height="30" fill="#f0d9b5"/><rect x="160" y="100" width="30" height="30" fill="#f0d9b5"/>
      <rect x="130" y="130" width="30" height="30" fill="#f0d9b5"/><rect x="190" y="130" width="30" height="30" fill="#f0d9b5"/>
      <!-- Pieces -->
      <text x="115" y="65" font-size="26" text-anchor="middle">♚</text>
      <text x="175" y="95" font-size="26" text-anchor="middle" fill="#ffffff">♕</text>
      <text x="160" y="185" font-family="'Outfit', sans-serif" font-size="11" font-weight="800" fill="#f0d9b5" letter-spacing="1.5" text-anchor="middle">CHESS BLITZ TACTICS</text>
    </svg>`;
  }

  // 29. Archery Master
  if (id === 'game_archery_master' || engine === 'ArcheryMaster') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#042f2e"/>
      <!-- Target -->
      <circle cx="160" cy="100" r="65" fill="#ffffff"/>
      <circle cx="160" cy="100" r="52" fill="#0284c7"/>
      <circle cx="160" cy="100" r="38" fill="#ef4444"/>
      <circle cx="160" cy="100" r="22" fill="#facc15"/>
      <circle cx="160" cy="100" r="8" fill="#eab308"/>
      <!-- Arrow in Bullseye -->
      <line x1="90" y1="100" x2="160" y2="100" stroke="#111827" stroke-width="3"/>
      <polygon points="90,95 80,100 90,105" fill="#f59e0b"/>
      <text x="160" y="24" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#facc15" letter-spacing="1.5" text-anchor="middle">ARCHERY MASTER BULLSEYE</text>
    </svg>`;
  }

  // 30. Penalty Shootout
  if (id === 'game_penalty_shootout' || engine === 'PenaltyShootout') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#14532d"/>
      <rect x="50" y="55" width="220" height="95" fill="none" stroke="#ffffff" stroke-width="4"/>
      <!-- Soccer Net -->
      <line x1="50" y1="55" x2="80" y2="35" stroke="#cbd5e1" stroke-width="2"/>
      <line x1="270" y1="55" x2="240" y2="35" stroke="#cbd5e1" stroke-width="2"/>
      <line x1="80" y1="35" x2="240" y2="35" stroke="#cbd5e1" stroke-width="2"/>
      <!-- Soccer Ball in Top Corner -->
      <circle cx="235" cy="75" r="16" fill="#ffffff" stroke="#111827" stroke-width="1.5"/>
      <polygon points="235,68 241,73 239,80 231,80 229,73" fill="#111827"/>
      <text x="160" y="180" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#ffffff" letter-spacing="1.5" text-anchor="middle">WORLD CUP PENALTY SHOOTOUT</text>
    </svg>`;
  }

  // 31. Moto Xtreme
  if (id === 'game_moto_xtreme' || engine === 'MotoXtreme') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#451a03"/>
      <!-- Dirt Hill -->
      <path d="M 0,180 Q 120,130 200,100 L 320,180 Z" fill="#78350f"/>
      <!-- Motocross Bike Silhouette -->
      <g transform="translate(160, 85) rotate(-20)">
        <circle cx="-25" cy="15" r="14" fill="none" stroke="#f59e0b" stroke-width="3.5"/>
        <circle cx="25" cy="15" r="14" fill="none" stroke="#f59e0b" stroke-width="3.5"/>
        <line x1="-25" y1="15" x2="0" y2="0" stroke="#f59e0b" stroke-width="3.5"/>
        <line x1="25" y1="15" x2="0" y2="0" stroke="#f59e0b" stroke-width="3.5"/>
      </g>
      <text x="160" y="30" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#f59e0b" letter-spacing="1.5" text-anchor="middle">MOTO XTREME TRIALS</text>
    </svg>`;
  }

  // 32. Monster Truck Climb
  if (id === 'game_monster_truck_climb' || engine === 'MonsterTruckClimb') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#1c1917"/>
      <!-- Rocky Hill -->
      <polygon points="0,200 140,110 320,170" fill="#44403c"/>
      <!-- Monster Truck -->
      <g transform="translate(140, 105)">
        <rect x="-30" y="-20" width="60" height="25" rx="5" fill="#22c55e"/>
        <circle cx="-20" cy="15" r="18" fill="#09090b" stroke="#15803d" stroke-width="4"/>
        <circle cx="20" cy="15" r="18" fill="#09090b" stroke="#15803d" stroke-width="4"/>
      </g>
      <text x="160" y="32" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#22c55e" letter-spacing="1.5" text-anchor="middle">MONSTER TRUCK HILL CLIMB</text>
    </svg>`;
  }

  // 33. Police Highway Pursuit
  if (id === 'game_police_highway_pursuit' || engine === 'PoliceHighwayPursuit') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#020617"/>
      <polygon points="0,200 320,200 200,80 120,80" fill="#1e293b"/>
      <!-- Police Interceptor -->
      <g transform="translate(130, 115)">
        <rect x="0" y="0" width="60" height="35" rx="6" fill="#ffffff" stroke="#000000" stroke-width="2"/>
        <rect x="22" y="-6" width="16" height="6" rx="2" fill="#ef4444"/>
        <circle cx="16" cy="-3" r="5" fill="#3b82f6"/>
        <circle cx="44" cy="-3" r="5" fill="#ef4444"/>
      </g>
      <text x="160" y="32" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#38bdf8" letter-spacing="1.5" text-anchor="middle">POLICE HIGHWAY PURSUIT</text>
    </svg>`;
  }

  // 34. Basketball Hoops
  if (id === 'game_basketball_hoops' || engine === 'BasketballHoops') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#18181b"/>
      <!-- Hoop & Backboard -->
      <rect x="220" y="50" width="8" height="85" fill="#ffffff"/>
      <rect x="180" y="95" width="45" height="6" fill="#ef4444"/>
      <polygon points="185,101 220,101 210,135 195,135" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-dasharray="3,3"/>
      <!-- Ball -->
      <circle cx="120" cy="85" r="24" fill="#ea580c"/>
      <path d="M 96,85 Q 120,85 144,85 M 120,61 Q 120,85 120,109" stroke="#7c2d12" stroke-width="2"/>
      <text x="160" y="28" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#ea580c" letter-spacing="1.5" text-anchor="middle">BASKETBALL ARC HOOPS</text>
    </svg>`;
  }

  // 35. Air Hockey Battle
  if (id === 'game_air_hockey_battle' || engine === 'AirHockeyBattle') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#082f49"/>
      <rect x="30" y="35" width="260" height="130" rx="14" fill="#0f172a" stroke="#00e5ff" stroke-width="2.5"/>
      <line x1="160" y1="35" x2="160" y2="165" stroke="#00e5ff" stroke-width="2" stroke-dasharray="6,4"/>
      <!-- Strikers & Puck -->
      <circle cx="95" cy="100" r="18" fill="#3b82f6" stroke="#ffffff" stroke-width="2"/>
      <circle cx="225" cy="100" r="18" fill="#ef4444" stroke="#ffffff" stroke-width="2"/>
      <circle cx="160" cy="100" r="9" fill="#00e5ff"/>
      <text x="160" y="24" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#00e5ff" letter-spacing="1.5" text-anchor="middle">AIR HOCKEY BATTLE 1v1</text>
    </svg>`;
  }

  // 36. Fruit Ninja Slicer
  if (id === 'game_fruit_ninja_slicer' || engine === 'FruitNinjaSlicer') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#2e1065"/>
      <!-- Sliced Watermelon -->
      <g transform="translate(130, 90)">
        <path d="M 0,0 A 26 26 0 0 1 52,0 Z" fill="#22c55e" stroke="#15803d" stroke-width="2"/>
        <path d="M 4,-2 A 22 22 0 0 1 48,-2 Z" fill="#ef4444"/>
      </g>
      <!-- Blade Slash Trail -->
      <path d="M 80,140 Q 160,100 240,60" fill="none" stroke="#00e5ff" stroke-width="4.5" stroke-linecap="round"/>
      <circle cx="220" cy="110" r="16" fill="#f59e0b"/>
      <text x="160" y="32" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#38bdf8" letter-spacing="1.5" text-anchor="middle">FRUIT NINJA SLICER</text>
    </svg>`;
  }

  // 37. Knife Hit Master
  if (id === 'game_knife_hit_master' || engine === 'KnifeHitMaster') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#18181b"/>
      <!-- Rotating Wood Target -->
      <circle cx="160" cy="90" r="45" fill="#78350f" stroke="#d97706" stroke-width="4"/>
      <circle cx="160" cy="90" r="28" fill="#92400e"/>
      <!-- Embedded Knives -->
      <rect x="157" y="20" width="6" height="26" rx="2" fill="#e2e8f0"/>
      <rect x="157" y="134" width="6" height="26" rx="2" fill="#e2e8f0"/>
      <rect x="204" y="87" width="26" height="6" rx="2" fill="#e2e8f0"/>
      <text x="160" y="184" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#f59e0b" letter-spacing="1.5" text-anchor="middle">KNIFE HIT ROTATING TARGET</text>
    </svg>`;
  }

  // 38. Neon Piano Tiles
  if (id === 'game_neon_piano_tiles' || engine === 'NeonPianoTiles') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#090d16"/>
      <!-- 4 Piano Lanes -->
      <line x1="100" y1="10" x2="100" y2="190" stroke="#1e293b" stroke-width="2"/>
      <line x1="140" y1="10" x2="140" y2="190" stroke="#1e293b" stroke-width="2"/>
      <line x1="180" y1="10" x2="180" y2="190" stroke="#1e293b" stroke-width="2"/>
      <line x1="220" y1="10" x2="220" y2="190" stroke="#1e293b" stroke-width="2"/>
      <!-- Falling Tiles -->
      <rect x="102" y="35" width="36" height="50" rx="4" fill="#00e5ff"/>
      <rect x="182" y="70" width="36" height="50" rx="4" fill="#a855f7"/>
      <rect x="142" y="120" width="36" height="50" rx="4" fill="#00e5ff"/>
      <text x="160" y="30" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#a855f7" letter-spacing="1.5" text-anchor="middle">NEON PIANO TILES</text>
    </svg>`;
  }

  // 39. Bubble Shooter Blitz
  if (id === 'game_bubble_shooter_blitz' || engine === 'BubbleShooterBlitz') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#1e1b4b"/>
      <!-- Top Bubbles -->
      <circle cx="80" cy="45" r="14" fill="#ef4444"/><circle cx="110" cy="45" r="14" fill="#3b82f6"/>
      <circle cx="140" cy="45" r="14" fill="#10b981"/><circle cx="170" cy="45" r="14" fill="#f59e0b"/>
      <circle cx="200" cy="45" r="14" fill="#ec4899"/><circle cx="230" cy="45" r="14" fill="#3b82f6"/>
      <circle cx="95" cy="70" r="14" fill="#10b981"/><circle cx="125" cy="70" r="14" fill="#ef4444"/>
      <circle cx="155" cy="70" r="14" fill="#f59e0b"/><circle cx="185" cy="70" r="14" fill="#10b981"/>
      <circle cx="215" cy="70" r="14" fill="#ec4899"/>
      <!-- Shooter Pointer -->
      <circle cx="160" cy="165" r="15" fill="#f59e0b"/>
      <line x1="160" y1="165" x2="160" y2="110" stroke="#fef08a" stroke-width="3"/>
      <text x="160" y="24" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#f43f5e" letter-spacing="1.5" text-anchor="middle">BUBBLE SHOOTER BLITZ</text>
    </svg>`;
  }

  // 40. Subway Skater Rush
  if (id === 'game_subway_skater_rush' || engine === 'SubwaySkaterRush') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#0f172a"/>
      <!-- Perspective 3D Track -->
      <polygon points="120,60 200,60 320,200 0,200" fill="#1e293b"/>
      <line x1="160" y1="60" x2="60" y2="200" stroke="#64748b" stroke-width="3"/>
      <line x1="160" y1="60" x2="160" y2="200" stroke="#64748b" stroke-width="3"/>
      <line x1="160" y1="60" x2="260" y2="200" stroke="#64748b" stroke-width="3"/>
      <!-- Subway Train -->
      <rect x="180" y="85" width="45" height="50" rx="5" fill="#ef4444" stroke="#ffffff" stroke-width="1.5"/>
      <circle cx="190" cy="120" r="4" fill="#fef08a"/><circle cx="215" cy="120" r="4" fill="#fef08a"/>
      <!-- Runner -->
      <circle cx="110" cy="140" r="9" fill="#3b82f6"/>
      <rect x="103" y="148" width="14" height="18" rx="3" fill="#f97316"/>
      <text x="160" y="32" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#38bdf8" letter-spacing="1.5" text-anchor="middle">SUBWAY SKATER RUSH 3D</text>
    </svg>`;
  }

  // 41. Bowling Strike
  if (id === 'game_bowling_strike' || engine === 'BowlingStrike') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#1c1917"/>
      <!-- Bowling Lane -->
      <polygon points="110,40 210,40 240,200 80,200" fill="#d97706" opacity="0.9"/>
      <!-- Pins -->
      <circle cx="160" cy="55" r="5" fill="#ffffff"/>
      <circle cx="150" cy="50" r="5" fill="#ffffff"/><circle cx="170" cy="50" r="5" fill="#ffffff"/>
      <circle cx="140" cy="45" r="5" fill="#ffffff"/><circle cx="160" cy="45" r="5" fill="#ffffff"/><circle cx="180" cy="45" r="5" fill="#ffffff"/>
      <!-- Bowling Ball -->
      <circle cx="160" cy="140" r="22" fill="#0f172a" stroke="#ffffff" stroke-width="1.5"/>
      <circle cx="155" cy="135" r="2.5" fill="#ffffff"/><circle cx="165" cy="135" r="2.5" fill="#ffffff"/><circle cx="160" cy="145" r="2.5" fill="#ffffff"/>
      <text x="160" y="25" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#f59e0b" letter-spacing="1.5" text-anchor="middle">BOWLING STRIKE 10-PIN</text>
    </svg>`;
  }

  // 42. Mini Golf Paradise
  if (id === 'game_mini_golf_paradise' || engine === 'MiniGolfParadise') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#14532d"/>
      <path d="M 50,150 Q 120,60 220,90 Q 280,120 270,170 Z" fill="#15803d"/>
      <!-- Hole & Flag -->
      <circle cx="210" cy="115" r="8" fill="#052e16"/>
      <line x1="210" y1="115" x2="210" y2="65" stroke="#ffffff" stroke-width="2"/>
      <polygon points="210,65 235,74 210,83" fill="#ef4444"/>
      <!-- Golf Ball -->
      <circle cx="110" cy="145" r="7" fill="#ffffff" stroke="#cbd5e1"/>
      <text x="160" y="30" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#4ade80" letter-spacing="1.5" text-anchor="middle">MINI GOLF PARADISE</text>
    </svg>`;
  }

  // 43. Tank Arena Wars
  if (id === 'game_tank_arena_wars' || engine === 'TankArenaWars') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#1c1917"/>
      <!-- Tank Body -->
      <g transform="translate(160, 110)">
        <rect x="-35" y="-22" width="70" height="44" rx="6" fill="#15803d"/>
        <rect x="-40" y="-26" width="80" height="10" rx="3" fill="#1e293b"/>
        <rect x="-40" y="16" width="80" height="10" rx="3" fill="#1e293b"/>
        <circle cx="0" cy="0" r="16" fill="#166534" stroke="#22c55e" stroke-width="2"/>
        <line x1="0" y1="0" x2="45" y2="0" stroke="#22c55e" stroke-width="6"/>
      </g>
      <text x="160" y="32" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#22c55e" letter-spacing="1.5" text-anchor="middle">TANK ARENA WARS 1v1</text>
    </svg>`;
  }

  // 44. Helicopter Gunship
  if (id === 'game_helicopter_gunship' || engine === 'HelicopterGunship') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#0f172a"/>
      <!-- Attack Helicopter -->
      <g transform="translate(160, 105)">
        <ellipse cx="0" cy="0" rx="40" ry="20" fill="#334155"/>
        <rect x="-70" y="-4" width="40" height="8" rx="2" fill="#334155"/>
        <line x1="-80" y1="-20" x2="80" y2="-20" stroke="#94a3b8" stroke-width="3"/>
        <line x1="0" y1="-20" x2="0" y2="-12" stroke="#94a3b8" stroke-width="4"/>
        <line x1="-20" y1="20" x2="20" y2="20" stroke="#94a3b8" stroke-width="3"/>
      </g>
      <text x="160" y="32" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#38bdf8" letter-spacing="1.5" text-anchor="middle">HELICOPTER COMBAT GUNSHIP</text>
    </svg>`;
  }

  // 45. Stickman Shadow Combat
  if (id === 'game_stickman_shadow_combat' || engine === 'StickmanShadowCombat') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#090d16"/>
      <circle cx="160" cy="100" r="45" fill="#f43f5e" opacity="0.2"/>
      <path d="M 80,140 Q 160,70 240,110" fill="none" stroke="#00e5ff" stroke-width="4"/>
      <text x="160" y="32" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#f43f5e" letter-spacing="1.5" text-anchor="middle">SHADOW COMBAT DOJO</text>
    </svg>`;
  }

  // 46. Tower Defense Kingdom
  if (id === 'game_tower_defense_kingdom' || engine === 'TowerDefenseKingdom') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#1c1917"/>
      <!-- Castle Tower -->
      <g transform="translate(160, 110)">
        <rect x="-35" y="-30" width="70" height="70" fill="#44403c"/>
        <polygon points="-40,-30 -40,-45 -25,-45 -25,-30 -10,-30 -10,-45 10,-45 10,-30 25,-30 25,-45 40,-45 40,-30" fill="#57534e"/>
        <rect x="-10" y="10" width="20" height="30" rx="10" fill="#0c0a09"/>
      </g>
      <text x="160" y="30" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#f59e0b" letter-spacing="1.5" text-anchor="middle">TOWER DEFENSE SIEGE</text>
    </svg>`;
  }

  // 47. Pinball Retro Magic
  if (id === 'game_pinball_retro_magic' || engine === 'PinballRetroMagic') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#18181b"/>
      <!-- Bumpers -->
      <circle cx="120" cy="75" r="16" fill="#ef4444" stroke="#ffffff" stroke-width="2"/>
      <circle cx="200" cy="75" r="16" fill="#3b82f6" stroke="#ffffff" stroke-width="2"/>
      <circle cx="160" cy="110" r="16" fill="#f59e0b" stroke="#ffffff" stroke-width="2"/>
      <!-- Flippers -->
      <line x1="110" y1="165" x2="145" y2="155" stroke="#00e5ff" stroke-width="6" stroke-linecap="round"/>
      <line x1="210" y1="165" x2="175" y2="155" stroke="#00e5ff" stroke-width="6" stroke-linecap="round"/>
      <!-- Chrome Ball -->
      <circle cx="150" cy="88" r="8" fill="#e2e8f0" stroke="#94a3b8"/>
      <text x="160" y="28" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#00e5ff" letter-spacing="1.5" text-anchor="middle">PINBALL RETRO MAGIC</text>
    </svg>`;
  }

  // 48. Galaxy Invaders 3000
  if (id === 'game_galaxy_shooter' || engine === 'GalaxyShooter') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#030712"/>
      <!-- Invader Aliens -->
      <text x="110" y="65" font-size="24" text-anchor="middle">👾</text>
      <text x="160" y="65" font-size="24" text-anchor="middle">👾</text>
      <text x="210" y="65" font-size="24" text-anchor="middle">👾</text>
      <!-- Space Fighter Ship -->
      <g transform="translate(160, 145)">
        <polygon points="0,-25 18,15 0,8 -18,15" fill="#38bdf8"/>
        <line x1="-12" y1="0" x2="-12" y2="-45" stroke="#f43f5e" stroke-width="2.5"/>
        <line x1="12" y1="0" x2="12" y2="-45" stroke="#f43f5e" stroke-width="2.5"/>
      </g>
      <text x="160" y="28" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#38bdf8" letter-spacing="1.5" text-anchor="middle">GALAXY INVADERS 3000</text>
    </svg>`;
  }

  // 49. Brick Breaker Extreme
  if (id === 'game_brick_breaker' || engine === 'BrickBreaker') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#090d16"/>
      <!-- Row of Bricks -->
      <rect x="50" y="45" width="45" height="15" rx="3" fill="#ef4444"/>
      <rect x="102" y="45" width="45" height="15" rx="3" fill="#f59e0b"/>
      <rect x="154" y="45" width="45" height="15" rx="3" fill="#10b981"/>
      <rect x="206" y="45" width="45" height="15" rx="3" fill="#3b82f6"/>
      <!-- Paddle & Ball -->
      <rect x="125" y="160" width="70" height="12" rx="6" fill="#00e5ff"/>
      <circle cx="160" cy="115" r="7" fill="#ffffff"/>
      <line x1="160" y1="115" x2="185" y2="75" stroke="#ffffff" stroke-width="1.5" stroke-dasharray="3,3"/>
      <text x="160" y="28" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#00e5ff" letter-spacing="1.5" text-anchor="middle">BRICK BREAKER EXTREME</text>
    </svg>`;
  }

  // 50. Dino Runner / Pixel Runner
  if (id === 'game_pixel_runner' || engine === 'PixelRunner') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#172554"/>
      <!-- Ground line -->
      <line x1="0" y1="150" x2="320" y2="150" stroke="#38bdf8" stroke-width="2"/>
      <!-- Dino & Cactus -->
      <text x="90" y="145" font-size="36" text-anchor="middle">🦖</text>
      <text x="210" y="148" font-size="28" text-anchor="middle">🌵</text>
      <text x="160" y="36" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#38bdf8" letter-spacing="1.5" text-anchor="middle">DINO RUNNER: JUNGLE JUMP</text>
    </svg>`;
  }

  // 51. Neon Snake Arena
  if (id === 'game_neon_snake' || engine === 'NeonSnake') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#052e16"/>
      <!-- Grid -->
      <g stroke="#064e3b" stroke-width="1">
        <line x1="80" y1="30" x2="80" y2="170"/><line x1="120" y1="30" x2="120" y2="170"/><line x1="160" y1="30" x2="160" y2="170"/>
        <line x1="200" y1="30" x2="200" y2="170"/><line x1="240" y1="30" x2="240" y2="170"/>
      </g>
      <!-- Snake Body -->
      <rect x="85" y="115" width="20" height="20" rx="4" fill="#22c55e"/>
      <rect x="110" y="115" width="20" height="20" rx="4" fill="#22c55e"/>
      <rect x="135" y="115" width="20" height="20" rx="4" fill="#22c55e"/>
      <rect x="160" y="115" width="20" height="20" rx="4" fill="#4ade80"/>
      <!-- Food -->
      <circle cx="215" cy="85" r="9" fill="#ef4444"/>
      <text x="160" y="24" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#4ade80" letter-spacing="1.5" text-anchor="middle">NEON SNAKE ARENA</text>
    </svg>`;
  }

  // 52. 2048 Cyber Fusion
  if (id === 'game_2048_cyber' || engine === 'Game2048') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#1c1917"/>
      <rect x="95" y="45" width="60" height="60" rx="8" fill="#eab308"/>
      <text x="125" y="83" font-size="20" font-weight="900" fill="#ffffff" text-anchor="middle">2048</text>
      <rect x="165" y="45" width="60" height="60" rx="8" fill="#ea580c"/>
      <text x="195" y="83" font-size="20" font-weight="900" fill="#ffffff" text-anchor="middle">1024</text>
      <rect x="95" y="115" width="60" height="60" rx="8" fill="#f97316"/>
      <text x="125" y="153" font-size="20" font-weight="900" fill="#ffffff" text-anchor="middle">512</text>
      <rect x="165" y="115" width="60" height="60" rx="8" fill="#e11d48"/>
      <text x="195" y="153" font-size="20" font-weight="900" fill="#ffffff" text-anchor="middle">256</text>
      <text x="160" y="28" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#facc15" letter-spacing="1.5" text-anchor="middle">2048 CYBER FUSION</text>
    </svg>`;
  }

  // 53. Flappy Wings Deluxe
  if (id === 'game_flappy_wings' || engine === 'FlappyWings') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#38bdf8"/>
      <!-- Pipes -->
      <rect x="200" y="0" width="45" height="65" fill="#22c55e" stroke="#15803d" stroke-width="2.5"/>
      <rect x="200" y="135" width="45" height="65" fill="#22c55e" stroke="#15803d" stroke-width="2.5"/>
      <!-- Bird -->
      <circle cx="110" cy="100" r="18" fill="#facc15" stroke="#ca8a04" stroke-width="2"/>
      <circle cx="118" cy="94" r="5" fill="#ffffff"/><circle cx="120" cy="94" r="2.5" fill="#000000"/>
      <polygon points="125,98 138,103 125,108" fill="#f97316"/>
      <text x="160" y="30" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#ffffff" letter-spacing="1.5" text-anchor="middle">FLAPPY WINGS DELUXE</text>
    </svg>`;
  }

  // 54. Cyber Pong 2-Player
  if (id === 'game_pong_battle' || engine === 'PongBattle') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#090d16"/>
      <line x1="160" y1="10" x2="160" y2="190" stroke="#334155" stroke-width="2" stroke-dasharray="8,8"/>
      <!-- Paddles -->
      <rect x="40" y="70" width="10" height="55" rx="3" fill="#00e5ff"/>
      <rect x="270" y="85" width="10" height="55" rx="3" fill="#ec4899"/>
      <!-- Ball -->
      <rect x="180" y="95" width="12" height="12" rx="2" fill="#ffffff"/>
      <text x="160" y="30" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#00e5ff" letter-spacing="1.5" text-anchor="middle">CYBER PONG 2-PLAYER</text>
    </svg>`;
  }

  // 55. Memory Match Masters
  if (id === 'game_memory_cards' || engine === 'MemoryCards') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#1e1b4b"/>
      <!-- Cards Grid -->
      <rect x="70" y="60" width="40" height="55" rx="5" fill="#ffffff"/>
      <text x="90" y="95" font-size="20" text-anchor="middle">⭐</text>
      <rect x="120" y="60" width="40" height="55" rx="5" fill="#3b82f6"/>
      <rect x="170" y="60" width="40" height="55" rx="5" fill="#3b82f6"/>
      <rect x="220" y="60" width="40" height="55" rx="5" fill="#ffffff"/>
      <text x="240" y="95" font-size="20" text-anchor="middle">⭐</text>
      <text x="160" y="32" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#a855f7" letter-spacing="1.5" text-anchor="middle">MEMORY MATCH MASTERS</text>
    </svg>`;
  }

  // 56. MineSweeper Pro
  if (id === 'game_mine_sweeper' || engine === 'MineSweeper') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#18181b"/>
      <!-- MineSweeper Tiles -->
      <g transform="translate(100, 50)">
        <rect x="0" y="0" width="35" height="35" fill="#27272a" stroke="#3f3f46"/>
        <text x="17" y="24" font-size="18" font-weight="900" fill="#3b82f6" text-anchor="middle">1</text>
        <rect x="40" y="0" width="35" height="35" fill="#27272a" stroke="#3f3f46"/>
        <text x="57" y="24" font-size="18" font-weight="900" fill="#22c55e" text-anchor="middle">2</text>
        <rect x="80" y="0" width="35" height="35" fill="#27272a" stroke="#3f3f46"/>
        <text x="97" y="24" font-size="18" font-weight="900" fill="#ef4444" text-anchor="middle">🚩</text>
        <rect x="0" y="40" width="35" height="35" fill="#27272a" stroke="#3f3f46"/>
        <text x="17" y="64" font-size="18" font-weight="900" fill="#ef4444" text-anchor="middle">3</text>
        <rect x="40" y="40" width="35" height="35" fill="#27272a" stroke="#3f3f46"/>
        <text x="57" y="64" font-size="18" font-weight="900" fill="#ffffff" text-anchor="middle">💣</text>
        <rect x="80" y="40" width="35" height="35" fill="#3f3f46" stroke="#52525b"/>
      </g>
      <text x="160" y="30" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#ef4444" letter-spacing="1.5" text-anchor="middle">MINESWEEPER PRO</text>
    </svg>`;
  }

  // 56. Cosmic Idle Miner
  if (id === 'game_cosmic_idle_miner' || engine === 'CosmicIdleMiner') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="nebulaBg" cx="40%" cy="50%" r="70%"><stop offset="0%" stop-color="#0f172a"/><stop offset="60%" stop-color="#070b14"/><stop offset="100%" stop-color="#020408"/></radialGradient>
        <radialGradient id="astGlow" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#00e5ff"/><stop offset="100%" stop-color="transparent"/></radialGradient>
      </defs>
      <rect width="320" height="200" fill="url(#nebulaBg)"/>
      <circle cx="120" cy="100" r="65" fill="url(#astGlow)" opacity="0.3"/>
      <!-- Asteroid -->
      <polygon points="120,40 160,55 175,95 155,145 110,160 70,135 65,85 90,50" fill="#1e293b" stroke="#00e5ff" stroke-width="2.5"/>
      <circle cx="105" cy="85" r="10" fill="#00e5ff" opacity="0.8"/>
      <circle cx="140" cy="115" r="7" fill="#ffd166"/>
      <circle cx="125" cy="125" r="5" fill="#00e5ff"/>
      <!-- Mining Drone -->
      <g transform="translate(230, 75)">
        <ellipse cx="0" cy="0" rx="24" ry="12" fill="#334155" stroke="#38bdf8" stroke-width="2"/>
        <circle cx="0" cy="-4" r="7" fill="#38bdf8" opacity="0.9"/>
        <line x1="-15" y1="10" x2="-25" y2="28" stroke="#00e5ff" stroke-width="2" stroke-dasharray="2,2"/>
        <line x1="15" y1="10" x2="25" y2="28" stroke="#00e5ff" stroke-width="2" stroke-dasharray="2,2"/>
      </g>
      <text x="160" y="185" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#00e5ff" letter-spacing="1.5" text-anchor="middle">COSMIC IDLE MINER</text>
    </svg>`;
  }

  // 57. Neon Survivor Arena
  if (id === 'game_neon_survivor_arena' || engine === 'NeonSurvivorArena') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#060911"/>
      <circle cx="160" cy="100" r="55" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1.5"/>
      <circle cx="160" cy="100" r="28" fill="none" stroke="#a855f7" stroke-width="2" stroke-dasharray="4,4"/>
      <!-- Player -->
      <circle cx="160" cy="100" r="15" fill="#00e5ff" stroke="#ffffff" stroke-width="2"/>
      <circle cx="188" cy="100" r="6" fill="#a855f7"/>
      <!-- Swarm Enemies -->
      <polygon points="75,65 90,80 75,95 60,80" fill="#ef4444"/>
      <polygon points="245,65 260,80 245,95 230,80" fill="#ef4444"/>
      <polygon points="90,140 105,155 90,170 75,155" fill="#ec4899"/>
      <polygon points="230,140 245,155 230,170 215,155" fill="#ec4899"/>
      <!-- XP Crystals -->
      <circle cx="120" cy="80" r="4" fill="#38bdf8"/>
      <circle cx="195" cy="130" r="4" fill="#38bdf8"/>
      <text x="160" y="186" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#a855f7" letter-spacing="1.5" text-anchor="middle">NEON SURVIVOR ARENA</text>
    </svg>`;
  }

  // 58. Hex Conqueror IO
  if (id === 'game_hex_conqueror_io' || engine === 'HexConquerorIO') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#080d1a"/>
      <!-- Territory Zone -->
      <polygon points="50,60 140,40 180,110 120,150 40,120" fill="rgba(0, 229, 255, 0.3)" stroke="#00e5ff" stroke-width="2"/>
      <polygon points="210,50 280,60 270,130 190,120" fill="rgba(239, 68, 68, 0.3)" stroke="#ef4444" stroke-width="2"/>
      <!-- Player Head & Trail -->
      <path d="M 180,110 L 210,135 L 180,165" fill="none" stroke="#00e5ff" stroke-width="5" stroke-linecap="round"/>
      <circle cx="180" cy="165" r="9" fill="#00e5ff" stroke="#ffffff" stroke-width="2"/>
      <text x="160" y="32" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#00e5ff" letter-spacing="1.5" text-anchor="middle">HEX CONQUEROR IO</text>
    </svg>`;
  }

  // 59. Solitaire Klondike Pro
  if (id === 'game_solitaire_klondike_pro' || engine === 'SolitaireKlondikePro') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#14532d"/>
      <!-- Card 1: Ace of Spades -->
      <g transform="translate(90, 50)">
        <rect width="60" height="85" rx="6" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
        <text x="8" y="22" font-family="'Outfit', sans-serif" font-size="16" font-weight="800" fill="#0f172a">A</text>
        <text x="8" y="36" font-size="12" fill="#0f172a">♠</text>
        <text x="30" y="58" font-size="28" fill="#0f172a" text-anchor="middle">♠</text>
      </g>
      <!-- Card 2: King of Hearts -->
      <g transform="translate(170, 50)">
        <rect width="60" height="85" rx="6" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
        <text x="8" y="22" font-family="'Outfit', sans-serif" font-size="16" font-weight="800" fill="#dc2626">K</text>
        <text x="8" y="36" font-size="12" fill="#dc2626">♥</text>
        <text x="30" y="58" font-size="28" fill="#dc2626" text-anchor="middle">♥</text>
      </g>
      <text x="160" y="175" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#facc15" letter-spacing="1.5" text-anchor="middle">SOLITAIRE KLONDIKE PRO</text>
    </svg>`;
  }

  // 60. Ragdoll Cannon Blast
  if (id === 'game_ragdoll_cannon_blast' || engine === 'RagdollCannonBlast') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#0a0e17"/>
      <!-- Cannon -->
      <g transform="translate(60, 150) rotate(-35)">
        <rect x="0" y="-12" width="55" height="24" rx="4" fill="#475569" stroke="#94a3b8" stroke-width="1.5"/>
        <rect x="48" y="-15" width="8" height="30" rx="2" fill="#00e5ff"/>
      </g>
      <circle cx="60" cy="150" r="18" fill="#1e293b" stroke="#475569" stroke-width="2"/>
      <!-- Ragdoll in Flight -->
      <g transform="translate(160, 80) rotate(25)">
        <circle cx="0" cy="0" r="9" fill="#ffffff"/>
        <line x1="0" y1="0" x2="0" y2="24" stroke="#00e5ff" stroke-width="4"/>
        <line x1="0" y1="8" x2="-14" y2="18" stroke="#00e5ff" stroke-width="3"/>
        <line x1="0" y1="8" x2="14" y2="2" stroke="#00e5ff" stroke-width="3"/>
        <line x1="0" y1="24" x2="-10" y2="42" stroke="#00e5ff" stroke-width="3"/>
        <line x1="0" y1="24" x2="10" y2="38" stroke="#00e5ff" stroke-width="3"/>
      </g>
      <!-- Target Portal -->
      <circle cx="265" cy="90" r="28" fill="rgba(168, 85, 247, 0.25)" stroke="#a855f7" stroke-width="3"/>
      <circle cx="265" cy="90" r="12" fill="#a855f7"/>
      <text x="160" y="186" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#00e5ff" letter-spacing="1.5" text-anchor="middle">RAGDOLL CANNON BLAST</text>
    </svg>`;
  }

  // 61. Block Puzzle 1010
  if (id === 'game_block_puzzle_1010' || engine === 'BlockPuzzle1010') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#0f0728"/>
      <!-- Mini Grid -->
      <g transform="translate(105, 35)">
        <rect width="110" height="110" rx="8" fill="#1e1035" stroke="#4c1d95" stroke-width="1.5"/>
        <rect x="10" y="10" width="26" height="26" rx="4" fill="#00e5ff"/>
        <rect x="38" y="10" width="26" height="26" rx="4" fill="#00e5ff"/>
        <rect x="66" y="10" width="26" height="26" rx="4" fill="#00e5ff"/>
        <rect x="10" y="38" width="26" height="26" rx="4" fill="#ec4899"/>
        <rect x="38" y="38" width="26" height="26" rx="4" fill="#ffd166"/>
        <rect x="66" y="66" width="26" height="26" rx="4" fill="#10b981"/>
      </g>
      <text x="160" y="178" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#ec4899" letter-spacing="1.5" text-anchor="middle">BLOCK PUZZLE 1010</text>
    </svg>`;
  }

  // 62. Jetpack Neon Escape
  if (id === 'game_jetpack_neon_escape' || engine === 'JetpackNeonEscape') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#080c16"/>
      <rect x="0" y="0" width="320" height="16" fill="#1e293b"/>
      <line x1="0" y1="16" x2="320" y2="16" stroke="#ef4444" stroke-width="2"/>
      <rect x="0" y="184" width="320" height="16" fill="#1e293b"/>
      <line x1="0" y1="184" x2="320" y2="184" stroke="#ef4444" stroke-width="2"/>
      <!-- Jetpack Hero -->
      <g transform="translate(100, 100)">
        <circle cx="0" cy="0" r="14" fill="#00e5ff" stroke="#ffffff" stroke-width="2"/>
        <rect x="-16" y="-8" width="8" height="16" rx="2" fill="#64748b"/>
        <!-- Flame Particles -->
        <circle cx="-24" cy="8" r="5" fill="#f59e0b"/>
        <circle cx="-32" cy="14" r="3" fill="#ef4444"/>
      </g>
      <!-- Zapper -->
      <g transform="translate(230, 80) rotate(35)">
        <line x1="0" y1="0" x2="60" y2="0" stroke="#00e5ff" stroke-width="5"/>
        <circle cx="0" cy="0" r="7" fill="#ffffff"/>
        <circle cx="60" cy="0" r="7" fill="#ffffff"/>
      </g>
      <text x="160" y="175" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#00e5ff" letter-spacing="1.5" text-anchor="middle">JETPACK NEON ESCAPE</text>
    </svg>`;
  }

  // 63. Draw Physics Drop
  if (id === 'game_draw_physics_drop' || engine === 'DrawPhysicsDrop') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#0a101d"/>
      <!-- Hand-Drawn Curve Ramp -->
      <path d="M 60,65 Q 140,140 220,110" fill="none" stroke="#00e5ff" stroke-width="5" stroke-linecap="round"/>
      <!-- Ball -->
      <circle cx="100" cy="72" r="12" fill="#f59e0b" stroke="#ffffff" stroke-width="2"/>
      <!-- Basket -->
      <path d="M 230,120 L 230,150 Q 255,160 280,150 L 280,120" fill="rgba(16, 185, 129, 0.25)" stroke="#10b981" stroke-width="3"/>
      <text x="160" y="186" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#10b981" letter-spacing="1.5" text-anchor="middle">DRAW PHYSICS DROP</text>
    </svg>`;
  }

  // 64. Rooftop Snipers Duel
  if (id === 'game_rooftop_snipers_duel' || engine === 'RooftopSnipersDuel') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="roofGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#0f172a"/><stop offset="60%" stop-color="#312e81"/><stop offset="100%" stop-color="#f43f5e"/></linearGradient>
      </defs>
      <rect width="320" height="200" fill="url(#roofGrad)"/>
      <!-- Rooftop -->
      <rect x="50" y="145" width="220" height="55" fill="#0f172a" stroke="#00e5ff" stroke-width="2"/>
      <!-- P1 Sniper (Left) -->
      <circle cx="95" cy="120" r="8" fill="#fde047"/>
      <rect x="88" y="128" width="14" height="18" fill="#0284c7"/>
      <line x1="95" y1="132" x2="135" y2="122" stroke="#00e5ff" stroke-width="4"/>
      <!-- P2 Sniper (Right) -->
      <circle cx="225" cy="120" r="8" fill="#fde047"/>
      <rect x="218" y="128" width="14" height="18" fill="#be123c"/>
      <line x1="225" y1="132" x2="185" y2="124" stroke="#f43f5e" stroke-width="4"/>
      <!-- Bullet Tracer -->
      <circle cx="155" cy="123" r="3" fill="#fbbf24"/>
      <text x="160" y="36" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#00e5ff" letter-spacing="1.5" text-anchor="middle">ROOFTOP SNIPERS DUEL</text>
    </svg>`;
  }

  // 65. Slice Master ASMR
  if (id === 'game_slice_master_asmr' || engine === 'SliceMasterASMR') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#1e1b4b"/>
      <!-- Cutting Board -->
      <rect x="0" y="150" width="320" height="50" fill="#b45309"/>
      <rect x="0" y="150" width="320" height="6" fill="#d97706"/>
      <!-- Knife (Flipping) -->
      <g transform="translate(110, 95) rotate(-28)">
        <rect x="-20" y="-5" width="20" height="10" rx="2" fill="#78350f"/>
        <path d="M 0,-6 L 45,-6 Q 55,0 55,4 L 0,6 Z" fill="#e2e8f0" stroke="#ffffff" stroke-width="1"/>
      </g>
      <!-- Sliced Watermelon Halves -->
      <g transform="translate(205, 135)">
        <path d="M -18,-6 A 18 18 0 0 0 -36 12 Z" fill="#ef4444" stroke="#10b981" stroke-width="3"/>
        <path d="M 18,-6 A 18 18 0 0 1 36 12 Z" fill="#ef4444" stroke="#10b981" stroke-width="3"/>
      </g>
      <text x="160" y="36" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#ec4899" letter-spacing="1.5" text-anchor="middle">SLICE MASTER ASMR</text>
    </svg>`;
  }

  // 66. Cubes 2048 IO
  if (id === 'game_cubes_2048_io' || engine === 'Cubes2048IO') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#0a0f1d"/>
      <!-- Grid -->
      <line x1="0" y1="80" x2="320" y2="80" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
      <line x1="0" y1="130" x2="320" y2="130" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
      <!-- Snake Cubes -->
      <rect x="75" y="85" width="34" height="34" rx="6" fill="#3b82f6"/>
      <text x="92" y="107" font-size="14" font-weight="900" fill="#fff" text-anchor="middle">2</text>
      <rect x="115" y="85" width="34" height="34" rx="6" fill="#06b6d4"/>
      <text x="132" y="107" font-size="14" font-weight="900" fill="#fff" text-anchor="middle">4</text>
      <rect x="155" y="85" width="34" height="34" rx="6" fill="#10b981"/>
      <text x="172" y="107" font-size="14" font-weight="900" fill="#fff" text-anchor="middle">8</text>
      <rect x="195" y="80" width="44" height="44" rx="8" fill="#fbbf24"/>
      <text x="217" y="107" font-size="14" font-weight="900" fill="#fff" text-anchor="middle">2048</text>
      <text x="160" y="38" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#fbbf24" letter-spacing="1.5" text-anchor="middle">CUBES 2048 IO</text>
    </svg>`;
  }

  // 67. Getaway Shootout Escape
  if (id === 'game_getaway_shootout_escape' || engine === 'GetawayShootoutEscape') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#0f172a"/>
      <!-- Platforms -->
      <rect x="30" y="145" width="100" height="30" fill="#1e293b" stroke="#00e5ff" stroke-width="2"/>
      <rect x="180" y="130" width="110" height="30" fill="#1e293b" stroke="#00e5ff" stroke-width="2"/>
      <!-- Getaway Helicopter -->
      <g transform="translate(235, 95)">
        <ellipse cx="0" cy="0" rx="28" ry="15" fill="#10b981"/>
        <line x1="-35" y1="-15" x2="35" y2="-15" stroke="#ffffff" stroke-width="3"/>
      </g>
      <!-- Leaping Racer -->
      <circle cx="110" cy="115" r="9" fill="#fed7aa"/>
      <rect x="103" y="123" width="14" height="18" fill="#0284c7"/>
      <text x="160" y="34" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#f59e0b" letter-spacing="1.5" text-anchor="middle">GETAWAY SHOOTOUT ESCAPE</text>
    </svg>`;
  }

  // 68. Smash Karts Battle Arena
  if (id === 'game_smash_karts_battle' || engine === 'SmashKartsBattle') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#0f172a"/>
      <rect x="20" y="20" width="280" height="160" rx="16" fill="#1e293b" stroke="#ef4444" stroke-width="4"/>
      <!-- Kart Chassis -->
      <g transform="translate(140, 105) rotate(20)">
        <rect x="-18" y="-12" width="36" height="24" rx="6" fill="#0284c7"/>
        <circle cx="-2" cy="0" r="7" fill="#00e5ff"/>
        <!-- Rocket -->
        <rect x="18" y="-3" width="16" height="6" fill="#ef4444"/>
      </g>
      <!-- Mystery Box -->
      <rect x="220" y="75" width="26" height="26" rx="4" fill="#fbbf24" stroke="#ffffff" stroke-width="2"/>
      <text x="233" y="94" font-size="16" font-weight="900" fill="#000" text-anchor="middle">?</text>
      <text x="160" y="38" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#ef4444" letter-spacing="1.5" text-anchor="middle">SMASH KARTS BATTLE</text>
    </svg>`;
  }

  // 69. EvoWars IO Slasher
  if (id === 'game_evowars_slasher' || engine === 'EvoWarsSlasher') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#0f172a"/>
      <!-- Grid -->
      <line x1="0" y1="100" x2="320" y2="100" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
      <!-- XP Orbs -->
      <circle cx="80" cy="60" r="5" fill="#00e5ff"/>
      <circle cx="230" cy="140" r="6" fill="#fbbf24"/>
      <circle cx="260" cy="70" r="5" fill="#ec4899"/>
      <!-- Warrior with Broadsword -->
      <g transform="translate(140, 105)">
        <circle cx="0" cy="0" r="22" fill="#0284c7" stroke="#ffffff" stroke-width="2"/>
        <rect x="15" y="-6" width="60" height="12" rx="2" fill="#cbd5e1"/>
        <rect x="65" y="-6" width="10" height="12" fill="#ffffff"/>
      </g>
      <text x="160" y="36" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#38bdf8" letter-spacing="1.5" text-anchor="middle">EVOWARS IO SLASHER</text>
    </svg>`;
  }

  // 70. Space Waves Runner
  if (id === 'game_space_waves_runner' || engine === 'SpaceWavesRunner') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#0a0a1a"/>
      <line x1="0" y1="20" x2="320" y2="20" stroke="#00e5ff" stroke-width="3"/>
      <line x1="0" y1="180" x2="320" y2="180" stroke="#00e5ff" stroke-width="3"/>
      <!-- Wave Trail ZigZag -->
      <polyline points="40,140 100,60 160,140 220,60 260,110" fill="none" stroke="#00e5ff" stroke-width="6" stroke-linecap="round"/>
      <!-- Arrow Head -->
      <polygon points="274,100 252,90 258,100 252,110" fill="#ffffff"/>
      <text x="160" y="38" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#00e5ff" letter-spacing="1.5" text-anchor="middle">SPACE WAVES RUNNER</text>
    </svg>`;
  }

  // 71. Run 3 Tunnel Gravity
  if (id === 'game_run_tunnel_gravity' || engine === 'RunTunnelGravity') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#05070e"/>
      <!-- 3D Octagonal Tunnel Rings -->
      <polygon points="160,30 230,55 260,115 230,175 160,190 90,175 60,115 90,55" fill="none" stroke="#a855f7" stroke-width="3"/>
      <polygon points="160,65 195,78 210,115 195,145 160,155 125,145 110,115 125,78" fill="#1e1035" stroke="#00e5ff" stroke-width="2"/>
      <!-- Alien Runner -->
      <circle cx="160" cy="142" r="10" fill="#a855f7"/>
      <circle cx="157" cy="140" r="2.5" fill="#00e5ff"/>
      <circle cx="163" cy="140" r="2.5" fill="#00e5ff"/>
      <text x="160" y="26" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#a855f7" letter-spacing="1.5" text-anchor="middle">RUN 3 TUNNEL GRAVITY</text>
    </svg>`;
  }

  // 72. Shell Shockers Egg Arena
  if (id === 'game_shell_shockers_arena' || engine === 'ShellShockersArena') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#0f172a"/>
      <!-- Armed Egg -->
      <g transform="translate(160, 105)">
        <ellipse cx="0" cy="0" rx="28" ry="22" fill="#ffffff" stroke="#475569" stroke-width="2"/>
        <path d="M -8,-10 L 4,0 L -2,12" stroke="#0f172a" stroke-width="2" fill="none"/>
        <!-- Gun -->
        <rect x="18" y="-6" width="28" height="12" rx="2" fill="#1e293b"/>
        <!-- Beanie Hat -->
        <path d="M -22,-14 Q 0,-34 22,-14 Z" fill="#ef4444"/>
      </g>
      <text x="160" y="38" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#fbbf24" letter-spacing="1.5" text-anchor="middle">SHELL SHOCKERS ARENA</text>
    </svg>`;
  }

  // 73. Bloxd Voxel Obby
  if (id === 'game_bloxd_voxel_obby' || engine === 'BloxdVoxelObby') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#38bdf8"/>
      <!-- Lava -->
      <rect x="0" y="165" width="320" height="35" fill="#dc2626"/>
      <rect x="0" y="165" width="320" height="6" fill="#f59e0b"/>
      <!-- Voxel Pillars -->
      <rect x="50" y="110" width="45" height="55" fill="#15803d" stroke="#166534" stroke-width="2"/>
      <rect x="135" y="90" width="45" height="75" fill="#15803d" stroke="#166534" stroke-width="2"/>
      <rect x="220" y="70" width="45" height="95" fill="#15803d" stroke="#166534" stroke-width="2"/>
      <!-- Steeve Leaping -->
      <rect x="105" y="65" width="16" height="24" fill="#0284c7"/>
      <text x="160" y="36" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#ffffff" letter-spacing="1.5" text-anchor="middle">BLOXD VOXEL OBBY</text>
    </svg>`;
  }

  // 74. House of Hazards Party
  if (id === 'game_house_of_hazards_party' || engine === 'HouseOfHazardsParty') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#fef3c7"/>
      <rect x="0" y="150" width="320" height="50" fill="#b45309"/>
      <!-- Flying Toast -->
      <rect x="120" y="90" width="22" height="22" rx="4" fill="#d97706" stroke="#92400e" stroke-width="2"/>
      <!-- Falling Chandelier -->
      <circle cx="210" cy="70" r="18" fill="#eab308"/>
      <!-- Ragdoll Knocked Over -->
      <circle cx="160" cy="130" r="9" fill="#fed7aa"/>
      <rect x="152" y="139" width="16" height="12" fill="#00e5ff"/>
      <text x="160" y="36" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#b45309" letter-spacing="1.5" text-anchor="middle">HOUSE OF HAZARDS</text>
    </svg>`;
  }

  // 75. Funny Battle Sandbox Wars
  if (id === 'game_funny_battle_sandbox' || engine === 'FunnyBattleSandbox') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#15803d"/>
      <line x1="160" y1="0" x2="160" y2="200" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
      <!-- Blue Unit -->
      <circle cx="110" cy="105" r="16" fill="#0284c7" stroke="#ffffff" stroke-width="2"/>
      <circle cx="106" cy="102" r="3" fill="#fff"/><circle cx="106" cy="102" r="1.5" fill="#000"/>
      <circle cx="114" cy="102" r="3" fill="#fff"/><circle cx="114" cy="102" r="1.5" fill="#000"/>
      <!-- Red Unit -->
      <circle cx="210" cy="105" r="16" fill="#ef4444" stroke="#ffffff" stroke-width="2"/>
      <circle cx="206" cy="102" r="3" fill="#fff"/><circle cx="206" cy="102" r="1.5" fill="#000"/>
      <circle cx="214" cy="102" r="3" fill="#fff"/><circle cx="214" cy="102" r="1.5" fill="#000"/>
      <text x="160" y="36" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#fbbf24" letter-spacing="1.5" text-anchor="middle">FUNNY BATTLE SANDBOX</text>
    </svg>`;
  }

  // 76. Kirka Voxel Strike FPS
  if (id === 'game_kirka_voxel_strike' || engine === 'KirkaVoxelStrike') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#78350f"/>
      <rect x="60" y="110" width="80" height="40" fill="#b45309" stroke="#f59e0b" stroke-width="2"/>
      <rect x="180" y="90" width="80" height="60" fill="#b45309" stroke="#f59e0b" stroke-width="2"/>
      <!-- Blue Soldier with Gun -->
      <rect x="95" y="95" width="22" height="22" fill="#0284c7"/>
      <rect x="117" y="103" width="18" height="6" fill="#0f172a"/>
      <!-- Red Soldier -->
      <rect x="205" y="75" width="22" height="22" fill="#dc2626"/>
      <text x="160" y="36" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#00e5ff" letter-spacing="1.5" text-anchor="middle">KIRKA VOXEL STRIKE</text>
    </svg>`;
  }

  // 77. Neon Laser Reflector
  if (id === 'game_neon_laser_reflector' || engine === 'NeonLaserReflector') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#0c0d12"/>
      <!-- Laser Emitter -->
      <rect x="40" y="90" width="24" height="24" fill="#ff5733"/>
      <!-- Beams -->
      <line x1="64" y1="102" x2="160" y2="102" stroke="#ff5733" stroke-width="4"/>
      <line x1="160" y1="102" x2="160" y2="150" stroke="#ff5733" stroke-width="4"/>
      <line x1="160" y1="150" x2="250" y2="150" stroke="#ff5733" stroke-width="4"/>
      <!-- Mirrors -->
      <rect x="148" y="90" width="24" height="24" fill="#1e293b" stroke="#2dd4bf" stroke-width="2"/>
      <line x1="150" y1="112" x2="170" y2="92" stroke="#ffffff" stroke-width="3"/>
      <rect x="148" y="138" width="24" height="24" fill="#1e293b" stroke="#2dd4bf" stroke-width="2"/>
      <line x1="150" y1="140" x2="170" y2="160" stroke="#ffffff" stroke-width="3"/>
      <!-- Crystal Target -->
      <circle cx="260" cy="150" r="14" fill="#10b981"/>
      <text x="160" y="36" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#ff5733" letter-spacing="1.5" text-anchor="middle">NEON LASER REFLECTOR</text>
    </svg>`;
  }

  // 78. Master Alchemist Merge
  if (id === 'game_master_alchemist_merge' || engine === 'MasterAlchemistMerge') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#0c0d12"/>
      <!-- Cauldron Circle -->
      <circle cx="160" cy="115" r="48" fill="none" stroke="#2dd4bf" stroke-width="2"/>
      <!-- Elements -->
      <circle cx="130" cy="115" r="24" fill="rgba(255,87,51,0.25)" stroke="#ff5733" stroke-width="2"/>
      <text x="130" y="123" font-size="20" text-anchor="middle">🔥</text>
      <circle cx="190" cy="115" r="24" fill="rgba(45,212,191,0.25)" stroke="#2dd4bf" stroke-width="2"/>
      <text x="190" y="123" font-size="20" text-anchor="middle">💧</text>
      <text x="160" y="38" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#2dd4bf" letter-spacing="1.5" text-anchor="middle">MASTER ALCHEMIST</text>
    </svg>`;
  }

  // 79. Micro Drift Showdown
  if (id === 'game_micro_drift_showdown' || engine === 'MicroDriftShowdown') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#1e1610"/>
      <!-- Oval Track -->
      <ellipse cx="160" cy="110" rx="120" ry="60" fill="none" stroke="#181a24" stroke-width="36"/>
      <ellipse cx="160" cy="110" rx="138" ry="78" fill="none" stroke="#ff5733" stroke-width="2"/>
      <!-- Micro Car Drifting -->
      <g transform="translate(160, 170) rotate(15)">
        <rect x="-14" y="-8" width="28" height="16" rx="4" fill="#ff5733"/>
        <rect x="0" y="-6" width="6" height="12" fill="#fff"/>
      </g>
      <text x="160" y="36" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#ff5733" letter-spacing="1.5" text-anchor="middle">MICRO DRIFT SHOWDOWN</text>
    </svg>`;
  }

  // 80. Neon Hover Circuit
  if (id === 'game_neon_hover_circuit' || engine === 'NeonHoverCircuit') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#0c0d12"/>
      <line x1="40" y1="200" x2="130" y2="80" stroke="#2dd4bf" stroke-width="3"/>
      <line x1="280" y1="200" x2="190" y2="80" stroke="#2dd4bf" stroke-width="3"/>
      <!-- Boost Gate -->
      <rect x="135" y="80" width="50" height="35" fill="none" stroke="#2dd4bf" stroke-width="3"/>
      <!-- Hovercraft -->
      <polygon points="160,135 180,165 140,165" fill="#1e293b" stroke="#ff5733" stroke-width="2"/>
      <text x="160" y="36" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#2dd4bf" letter-spacing="1.5" text-anchor="middle">NEON HOVER CIRCUIT</text>
    </svg>`;
  }

  // 81. Mountain Uphill Trial
  if (id === 'game_mountain_uphill_trial' || engine === 'MountainUphillTrial') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#0c0d12"/>
      <!-- Mountain Slope -->
      <path d="M 0,180 Q 120,130 200,90 T 320,70 L 320,200 L 0,200 Z" fill="#334155" stroke="#2dd4bf" stroke-width="3"/>
      <!-- 4x4 Jeep -->
      <g transform="translate(140, 115) rotate(-22)">
        <rect x="-18" y="-12" width="36" height="16" fill="#ff5733"/>
        <circle cx="-12" cy="8" r="8" fill="#0f172a" stroke="#fff" stroke-width="1.5"/>
        <circle cx="12" cy="8" r="8" fill="#0f172a" stroke="#fff" stroke-width="1.5"/>
      </g>
      <text x="160" y="36" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#ff5733" letter-spacing="1.5" text-anchor="middle">MOUNTAIN UPHILL TRIAL</text>
    </svg>`;
  }

  // 82. Shadow Shinobi Dash
  if (id === 'game_shadow_shinobi_dash' || engine === 'ShadowShinobiDash') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#0c0d12"/>
      <!-- Blood Moon -->
      <circle cx="230" cy="70" r="35" fill="#ef4444"/>
      <!-- Roof Platform -->
      <rect x="40" y="140" width="160" height="20" fill="#1e293b" stroke="#ff5733" stroke-width="2"/>
      <!-- Ninja Leaping -->
      <rect x="110" y="105" width="16" height="30" fill="#0f172a"/>
      <rect x="110" y="112" width="16" height="4" fill="#ff5733"/>
      <!-- Shuriken Flying -->
      <g transform="translate(160, 110)">
        <rect x="-5" y="-1.5" width="10" height="3" fill="#2dd4bf"/>
        <rect x="-1.5" y="-5" width="3" height="10" fill="#2dd4bf"/>
      </g>
      <text x="160" y="36" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#ff5733" letter-spacing="1.5" text-anchor="middle">SHADOW SHINOBI DASH</text>
    </svg>`;
  }

  // 83. Mini Kingdom Siege
  if (id === 'game_mini_kingdom_siege' || engine === 'MiniKingdomSiege') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#0c0d12"/>
      <rect x="50" y="55" width="220" height="110" fill="rgba(24,26,36,0.8)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
      <!-- Blue Knight -->
      <circle cx="100" cy="110" r="18" fill="#0284c7" stroke="#fff" stroke-width="2"/>
      <text x="100" y="116" font-size="16" text-anchor="middle">🛡️</text>
      <!-- Red Keep -->
      <circle cx="220" cy="110" r="18" fill="#dc2626" stroke="#fff" stroke-width="2"/>
      <text x="220" y="116" font-size="16" text-anchor="middle">🏰</text>
      <text x="160" y="36" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#ff5733" letter-spacing="1.5" text-anchor="middle">MINI KINGDOM SIEGE</text>
    </svg>`;
  }

  // 84. Super Basketball Dunk
  if (id === 'game_super_basketball_dunk' || engine === 'SuperBasketballDunk') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#0c0d12"/>
      <!-- Hoop & Backboard -->
      <rect x="250" y="70" width="8" height="60" fill="#fff"/>
      <rect x="220" y="105" width="30" height="6" fill="#ef4444"/>
      <!-- Dunker Soaring -->
      <g transform="translate(170, 95) rotate(-20)">
        <rect x="-10" y="-15" width="20" height="30" fill="#ff5733"/>
        <circle cx="0" cy="-24" r="8" fill="#fed7aa"/>
        <circle cx="16" cy="-28" r="10" fill="#f97316"/>
      </g>
      <text x="160" y="36" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#f97316" letter-spacing="1.5" text-anchor="middle">SUPER BASKETBALL DUNK</text>
    </svg>`;
  }

  // 85. Burger Chef Rush
  if (id === 'game_burger_chef_rush' || engine === 'BurgerChefRush') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#0c0d12"/>
      <!-- Plate -->
      <ellipse cx="160" cy="155" rx="75" ry="16" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/>
      <!-- Giant Gourmet Burger -->
      <ellipse cx="160" cy="148" rx="48" ry="10" fill="#b45309"/>
      <ellipse cx="160" cy="138" rx="45" ry="8" fill="#78350f"/>
      <rect x="118" y="126" width="84" height="6" fill="#f59e0b"/>
      <rect x="114" y="120" width="92" height="6" fill="#10b981"/>
      <ellipse cx="160" cy="110" rx="48" ry="12" fill="#b45309"/>
      <text x="160" y="36" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#f59e0b" letter-spacing="1.5" text-anchor="middle">BURGER CHEF RUSH</text>
    </svg>`;
  }

  // 86. Wobbly Delivery 3D
  if (id === 'game_wobbly_delivery_3d' || engine === 'WobblyDelivery') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#0c0d12"/>
      <path d="M 0 170 L 320 170 L 280 200 L 40 200 Z" fill="#1e293b"/>
      <!-- Wobbling Delivery Guy -->
      <circle cx="160" cy="140" r="14" fill="#0284c7"/>
      <circle cx="160" cy="122" r="10" fill="#ffdbac"/>
      <path d="M 152 118 Q 160 114 168 118 L 172 120" stroke="#0284c7" stroke-width="4" fill="none"/>
      <!-- Towering Wobbling Packages -->
      <g transform="rotate(-7 160 100)">
        <rect x="136" y="90" width="48" height="20" rx="3" fill="#d97706" stroke="#b45309" stroke-width="1.5"/>
        <line x1="160" y1="90" x2="160" y2="110" stroke="#fef08a" stroke-width="2"/>
        <rect x="140" y="68" width="40" height="18" rx="3" fill="#b45309" stroke="#92400e" stroke-width="1.5"/>
        <rect x="144" y="48" width="32" height="16" rx="3" fill="#d97706" stroke="#b45309" stroke-width="1.5"/>
        <rect x="148" y="32" width="24" height="14" rx="2" fill="#92400e" stroke="#78350f" stroke-width="1.5"/>
      </g>
      <text x="160" y="24" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#ff5733" letter-spacing="1.5" text-anchor="middle">WOBBLY DELIVERY 3D</text>
    </svg>`;
  }

  // 87. Blob Arena 3D
  if (id === 'game_blob_arena_3d' || engine === 'BlobArena') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#0c0d12"/>
      <!-- Arena Ring -->
      <ellipse cx="160" cy="120" rx="110" ry="50" fill="none" stroke="#2dd4bf" stroke-width="4" stroke-dasharray="12 6"/>
      <!-- Bouncy Green Blob -->
      <path d="M 115 125 C 115 90, 140 75, 160 75 C 180 75, 205 90, 205 125 C 205 145, 185 155, 160 155 C 135 155, 115 145, 115 125 Z" fill="#10b981"/>
      <!-- Cute Eyes -->
      <circle cx="148" cy="108" r="8" fill="#ffffff"/>
      <circle cx="149" cy="108" r="4" fill="#0f172a"/>
      <circle cx="172" cy="108" r="8" fill="#ffffff"/>
      <circle cx="173" cy="108" r="4" fill="#0f172a"/>
      <!-- Energy Spheres -->
      <circle cx="85" cy="115" r="16" fill="#38bdf8"/>
      <circle cx="235" cy="125" r="18" fill="#facc15"/>
      <text x="160" y="34" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#2dd4bf" letter-spacing="1.5" text-anchor="middle">BLOB ARENA 3D</text>
    </svg>`;
  }

  // 88. Tiny Chaos Kitchen 3D
  if (id === 'game_tiny_chaos_kitchen_3d' || engine === 'TinyChaosKitchen') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#0c0d12"/>
      <!-- Chef Hat & Face -->
      <circle cx="160" cy="125" r="22" fill="#ffdbac"/>
      <path d="M 138 105 L 182 105 L 186 78 C 186 65, 134 65, 134 78 Z" fill="#ffffff"/>
      <ellipse cx="160" cy="65" rx="26" ry="14" fill="#ffffff"/>
      <!-- Sizzling Pan with Fire -->
      <circle cx="100" cy="135" r="16" fill="#334155"/>
      <path d="M 92 135 Q 100 115 108 135 Z" fill="#ef4444"/>
      <rect x="65" y="132" width="22" height="6" rx="3" fill="#1e293b"/>
      <!-- Burger Stack on Counter -->
      <circle cx="220" cy="140" r="18" fill="#b45309"/>
      <circle cx="220" cy="132" r="16" fill="#10b981"/>
      <circle cx="220" cy="124" r="18" fill="#d97706"/>
      <text x="160" y="34" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#f59e0b" letter-spacing="1.5" text-anchor="middle">TINY CHAOS KITCHEN 3D</text>
    </svg>`;
  }

  // 89. Banana Bonk 3D
  if (id === 'game_banana_bonk_3d' || engine === 'BananaBonk') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#0c0d12"/>
      <!-- Jungle Slime -->
      <ellipse cx="160" cy="175" rx="140" ry="20" fill="#06b6d4" opacity="0.4"/>
      <!-- Giant Spinning Banana -->
      <path d="M 100 70 Q 160 50 210 95 Q 160 85 100 70 Z" fill="#facc15" stroke="#ca8a04" stroke-width="2"/>
      <!-- Monkey Mojo Flying with Stars -->
      <circle cx="160" cy="120" r="20" fill="#d97706"/>
      <circle cx="150" cy="112" r="7" fill="#ffffff"/>
      <circle cx="150" cy="112" r="3" fill="#0f172a"/>
      <circle cx="170" cy="112" r="7" fill="#ffffff"/>
      <circle cx="170" cy="112" r="3" fill="#0f172a"/>
      <!-- Comic Knockout Stars -->
      <polygon points="125,75 130,85 142,88 132,96 135,108 125,100 115,108 118,96 108,88 120,85" fill="#facc15"/>
      <polygon points="195,65 198,72 206,75 200,80 202,88 195,83 188,88 190,80 184,75 192,72" fill="#ef4444"/>
      <text x="160" y="34" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#facc15" letter-spacing="1.5" text-anchor="middle">BANANA BONK 3D</text>
    </svg>`;
  }

  // 90. Mini Golf Mayhem 3D
  if (id === 'game_mini_golf_mayhem_3d' || engine === 'MiniGolfMayhem') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#0c0d12"/>
      <!-- Green Fairway -->
      <polygon points="60,180 260,180 220,90 100,90" fill="#15803d"/>
      <!-- Aim Trajectory -->
      <line x1="160" y1="160" x2="160" y2="105" stroke="#ffffff" stroke-width="2" stroke-dasharray="6 4"/>
      <!-- Golf Ball -->
      <circle cx="160" cy="160" r="10" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
      <!-- Pin Hole & Red Flag -->
      <ellipse cx="160" cy="100" rx="14" ry="5" fill="#0f172a"/>
      <line x1="160" y1="100" x2="160" y2="60" stroke="#cbd5e1" stroke-width="2.5"/>
      <polygon points="160,60 185,70 160,80" fill="#ef4444"/>
      <!-- Pinball Bumper -->
      <circle cx="115" cy="120" r="12" fill="#f43f5e"/>
      <circle cx="205" cy="120" r="12" fill="#f43f5e"/>
      <text x="160" y="34" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#38bdf8" letter-spacing="1.5" text-anchor="middle">MINI GOLF MAYHEM 3D</text>
    </svg>`;
  }

  // 91. Wacky Parkour 3D
  if (id === 'game_wacky_parkour_3d' || engine === 'WackyParkour') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#0c0d12"/>
      <!-- Floating Obby Platforms -->
      <rect x="40" y="150" width="55" height="14" rx="4" fill="#3b82f6"/>
      <rect x="120" y="125" width="50" height="14" rx="4" fill="#10b981"/>
      <rect x="200" y="100" width="55" height="14" rx="4" fill="#ec4899"/>
      <!-- Golden Star Portal -->
      <polygon points="265,55 270,68 285,70 273,80 277,95 265,85 253,95 257,80 245,70 260,68" fill="#facc15"/>
      <!-- Dash Runner in Mid-Air Leap -->
      <circle cx="150" cy="85" r="11" fill="#ef4444"/>
      <circle cx="150" cy="70" r="8" fill="#ffdbac"/>
      <line x1="150" y1="92" x2="140" y2="105" stroke="#1e293b" stroke-width="4"/>
      <line x1="150" y1="92" x2="165" y2="102" stroke="#1e293b" stroke-width="4"/>
      <!-- Sky Gems -->
      <polygon points="80,120 86,128 80,136 74,128" fill="#38bdf8"/>
      <polygon points="175,95 181,103 175,111 169,103" fill="#38bdf8"/>
      <text x="160" y="34" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#8b5cf6" letter-spacing="1.5" text-anchor="middle">WACKY PARKOUR 3D</text>
    </svg>`;
  }

  // 92. Neon Dash Geometry
  if (id === 'game_neon_dash_geometry' || engine === 'NeonDashGeometry') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#090a0f"/>
      <line x1="0" y1="150" x2="320" y2="150" stroke="#00e5ff" stroke-width="3"/>
      <!-- Glowing Spikes -->
      <polygon points="120,150 135,115 150,150" fill="#ff0055" stroke="#ff3377" stroke-width="2"/>
      <polygon points="150,150 165,115 180,150" fill="#ff0055" stroke="#ff3377" stroke-width="2"/>
      <polygon points="230,150 245,115 260,150" fill="#ff0055" stroke="#ff3377" stroke-width="2"/>
      <!-- Neon Cube in mid air -->
      <rect x="70" y="90" width="36" height="36" rx="4" fill="#00ffcc" stroke="#ffffff" stroke-width="2" transform="rotate(25 88 108)"/>
      <text x="160" y="36" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#00e5ff" letter-spacing="1.5" text-anchor="middle">NEON DASH GEOMETRY</text>
    </svg>`;
  }

  // 93. Laser Reflex Dash
  if (id === 'game_laser_reflex_dash' || engine === 'LaserReflexDash') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#0a0518"/>
      <line x1="20" y1="50" x2="300" y2="150" stroke="#ff007f" stroke-width="4" stroke-dasharray="6,4"/>
      <line x1="20" y1="150" x2="300" y2="50" stroke="#00f5d4" stroke-width="4"/>
      <circle cx="160" cy="100" r="16" fill="#facc15" stroke="#fff" stroke-width="2"/>
      <text x="160" y="34" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#ff007f" letter-spacing="1.5" text-anchor="middle">LASER REFLEX DASH</text>
    </svg>`;
  }

  // 94. Chrono Trigger Tap
  if (id === 'game_chrono_trigger_tap' || engine === 'ChronoTriggerTap') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#080e1a"/>
      <circle cx="160" cy="105" r="55" fill="none" stroke="#38bdf8" stroke-width="4"/>
      <circle cx="160" cy="105" r="35" fill="none" stroke="#818cf8" stroke-width="3" stroke-dasharray="8,6"/>
      <line x1="160" y1="105" x2="160" y2="65" stroke="#f43f5e" stroke-width="4" stroke-linecap="round"/>
      <circle cx="160" cy="105" r="6" fill="#fff"/>
      <text x="160" y="32" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#38bdf8" letter-spacing="1.5" text-anchor="middle">CHRONO TRIGGER TAP</text>
    </svg>`;
  }

  // 95. Vortex Orbiter
  if (id === 'game_vortex_orbiter' || engine === 'VortexOrbiter') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#070714"/>
      <circle cx="160" cy="105" r="70" fill="none" stroke="#6366f1" stroke-width="2" opacity="0.4"/>
      <circle cx="160" cy="105" r="45" fill="none" stroke="#a855f7" stroke-width="3"/>
      <circle cx="160" cy="105" r="22" fill="#312e81"/>
      <circle cx="192" cy="105" r="9" fill="#00e5ff" stroke="#fff" stroke-width="2"/>
      <text x="160" y="32" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#a855f7" letter-spacing="1.5" text-anchor="middle">VORTEX ORBITER</text>
    </svg>`;
  }

  // 96. Circuit Connect Neon
  if (id === 'game_circuit_connect_neon' || engine === 'CircuitConnectNeon') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#0a1215"/>
      <path d="M 60,100 L 120,100 L 120,60 L 200,60 L 200,140 L 260,140" fill="none" stroke="#10b981" stroke-width="5" stroke-linecap="round"/>
      <circle cx="60" cy="100" r="10" fill="#10b981"/>
      <circle cx="120" cy="100" r="6" fill="#34d399"/>
      <circle cx="200" cy="60" r="6" fill="#34d399"/>
      <circle cx="260" cy="140" r="10" fill="#facc15"/>
      <text x="160" y="34" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#10b981" letter-spacing="1.5" text-anchor="middle">CIRCUIT CONNECT NEON</text>
    </svg>`;
  }

  // 97. Quantum Tile Slide
  if (id === 'game_quantum_tile_slide' || engine === 'QuantumTileSlide') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#0d1117"/>
      <rect x="85" y="55" width="45" height="45" rx="6" fill="#2563eb"/>
      <rect x="135" y="55" width="45" height="45" rx="6" fill="#7c3aed"/>
      <rect x="185" y="55" width="45" height="45" rx="6" fill="#db2777"/>
      <rect x="85" y="105" width="45" height="45" rx="6" fill="#059669"/>
      <rect x="135" y="105" width="45" height="45" rx="6" fill="#d97706"/>
      <rect x="185" y="105" width="45" height="45" rx="6" fill="#1f2937" stroke="#374151" stroke-dasharray="4"/>
      <text x="160" y="34" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#60a5fa" letter-spacing="1.5" text-anchor="middle">QUANTUM TILE SLIDE</text>
    </svg>`;
  }

  // 98. Hexa Merge Color
  if (id === 'game_hexa_merge_color' || engine === 'HexaMergeColor') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#130e24"/>
      <polygon points="160,60 190,78 190,112 160,130 130,112 130,78" fill="#f43f5e"/>
      <polygon points="110,90 140,108 140,142 110,160 80,142 80,108" fill="#8b5cf6"/>
      <polygon points="210,90 240,108 240,142 210,160 180,142 180,108" fill="#06b6d4"/>
      <text x="160" y="34" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#f43f5e" letter-spacing="1.5" text-anchor="middle">HEXA MERGE COLOR</text>
    </svg>`;
  }

  // 99. Velocity Drift Tokyo
  if (id === 'game_velocity_drift_tokyo' || engine === 'VelocityDriftTokyo') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#0b0817"/>
      <path d="M 40,180 C 120,180 140,90 280,70" stroke="#334155" stroke-width="44" fill="none"/>
      <path d="M 40,180 C 120,180 140,90 280,70" stroke="#f43f5e" stroke-width="3" fill="none" stroke-dasharray="10,8"/>
      <!-- Drift Smoke & Neon Car -->
      <circle cx="150" cy="130" r="14" fill="#ffffff" opacity="0.3"/>
      <rect x="155" y="105" width="38" height="20" rx="4" fill="#00f0ff" stroke="#fff" stroke-width="1.5" transform="rotate(-28 174 115)"/>
      <text x="160" y="32" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#00f0ff" letter-spacing="1.5" text-anchor="middle">VELOCITY DRIFT TOKYO</text>
    </svg>`;
  }

  // 100. Retro Highway Racer
  if (id === 'game_retro_highway_racer' || engine === 'RetroHighwayRacer') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#1a0b2e"/>
      <!-- Synthwave Sun -->
      <circle cx="160" cy="85" r="40" fill="#fbbf24"/>
      <polygon points="120,200 150,110 170,110 200,200" fill="#1e1b4b"/>
      <line x1="160" y1="110" x2="160" y2="200" stroke="#ec4899" stroke-width="3" stroke-dasharray="8,6"/>
      <rect x="150" y="160" width="20" height="14" rx="2" fill="#ef4444"/>
      <text x="160" y="30" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#ec4899" letter-spacing="1.5" text-anchor="middle">RETRO HIGHWAY RACER</text>
    </svg>`;
  }

  // 101. Cyber Bike Sprint
  if (id === 'game_cyber_bike_sprint' || engine === 'CyberBikeSprint') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#050a14"/>
      <line x1="0" y1="150" x2="320" y2="150" stroke="#0284c7" stroke-width="2"/>
      <circle cx="105" cy="140" r="18" fill="none" stroke="#00e5ff" stroke-width="4"/>
      <circle cx="175" cy="140" r="18" fill="none" stroke="#00e5ff" stroke-width="4"/>
      <path d="M 105,140 L 135,140 L 150,115 L 125,115 Z" fill="#38bdf8"/>
      <path d="M 135,140 L 175,140 L 160,115" stroke="#38bdf8" stroke-width="3" fill="none"/>
      <text x="160" y="34" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#00e5ff" letter-spacing="1.5" text-anchor="middle">CYBER BIKE SPRINT</text>
    </svg>`;
  }

  // 102. Pixel Dungeon Crawler
  if (id === 'game_pixel_dungeon_crawler' || engine === 'PixelDungeonCrawler') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#18181b"/>
      <rect x="60" y="55" width="200" height="110" fill="#27272a" stroke="#3f3f46" stroke-width="2"/>
      <!-- Torch glow -->
      <circle cx="80" cy="75" r="12" fill="#f59e0b" opacity="0.3"/>
      <circle cx="80" cy="75" r="5" fill="#fef08a"/>
      <!-- Knight & Chest -->
      <rect x="145" y="105" width="18" height="24" rx="2" fill="#38bdf8"/>
      <rect x="210" y="110" width="22" height="18" rx="2" fill="#d97706" stroke="#fbbf24" stroke-width="1.5"/>
      <text x="160" y="34" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#fbbf24" letter-spacing="1.5" text-anchor="middle">PIXEL DUNGEON CRAWLER</text>
    </svg>`;
  }

  // 103. Sky Island Hopper
  if (id === 'game_sky_island_hopper' || engine === 'SkyIslandHopper') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#075985"/>
      <!-- Floating islands -->
      <path d="M 40,130 Q 75,115 110,130 L 95,160 L 55,160 Z" fill="#15803d"/>
      <path d="M 140,95 Q 185,80 230,95 L 210,130 L 160,130 Z" fill="#15803d"/>
      <circle cx="100" cy="100" r="10" fill="#f97316"/>
      <text x="160" y="34" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#38bdf8" letter-spacing="1.5" text-anchor="middle">SKY ISLAND HOPPER</text>
    </svg>`;
  }

  // 104. Cyber Ninja Wall Jump
  if (id === 'game_cyber_ninja_wall_jump' || engine === 'CyberNinjaWallJump') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#09090b"/>
      <rect x="40" y="30" width="30" height="150" fill="#18181b" stroke="#ef4444" stroke-width="2"/>
      <rect x="250" y="30" width="30" height="150" fill="#18181b" stroke="#ef4444" stroke-width="2"/>
      <!-- Ninja bounding -->
      <polygon points="120,120 135,100 150,120" fill="#ffffff"/>
      <line x1="70" y1="150" x2="135" y2="105" stroke="#ef4444" stroke-dasharray="4,4" stroke-width="2"/>
      <text x="160" y="30" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#ef4444" letter-spacing="1.5" text-anchor="middle">CYBER NINJA WALL JUMP</text>
    </svg>`;
  }

  // 105. Curling Stone Pro
  if (id === 'game_curling_stone_pro' || engine === 'CurlingStonePro') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#0f172a"/>
      <!-- Curling Target Circles -->
      <circle cx="160" cy="115" r="55" fill="#ef4444"/>
      <circle cx="160" cy="115" r="38" fill="#ffffff"/>
      <circle cx="160" cy="115" r="20" fill="#3b82f6"/>
      <circle cx="160" cy="115" r="6" fill="#ffffff"/>
      <!-- Stone -->
      <circle cx="120" cy="85" r="14" fill="#64748b" stroke="#f1f5f9" stroke-width="2"/>
      <rect x="115" y="80" width="10" height="4" fill="#e11d48"/>
      <text x="160" y="32" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#38bdf8" letter-spacing="1.5" text-anchor="middle">CURLING STONE PRO</text>
    </svg>`;
  }

  // 106. Frisbee Golf Champion
  if (id === 'game_frisbee_golf_champion' || engine === 'FrisbeeGolfChampion') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#14532d"/>
      <!-- Disc golf basket -->
      <line x1="210" y1="90" x2="210" y2="155" stroke="#e2e8f0" stroke-width="3"/>
      <rect x="195" y="115" width="30" height="14" fill="#cbd5e1" stroke="#94a3b8"/>
      <!-- Flying Disc -->
      <ellipse cx="110" cy="95" rx="22" ry="7" fill="#f97316" stroke="#ffedd5" stroke-width="1.5" transform="rotate(-15 110 95)"/>
      <text x="160" y="32" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#86efac" letter-spacing="1.5" text-anchor="middle">FRISBEE GOLF CHAMPION</text>
    </svg>`;
  }

  // 107. Hex Territory Conquer
  if (id === 'game_hex_territory_conquer' || engine === 'HexTerritoryConquer') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#111827"/>
      <polygon points="120,70 145,85 145,115 120,130 95,115 95,85" fill="#3b82f6"/>
      <polygon points="165,70 190,85 190,115 165,130 140,115 140,85" fill="#ef4444"/>
      <polygon points="142,112 167,127 167,157 142,172 117,157 117,127" fill="#10b981"/>
      <text x="160" y="34" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#3b82f6" letter-spacing="1.5" text-anchor="middle">HEX TERRITORY CONQUER</text>
    </svg>`;
  }

  // 108. Auto Battler Tactics
  if (id === 'game_auto_battler_tactics' || engine === 'AutoBattlerTactics') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#180e29"/>
      <!-- Chessboard grid -->
      <rect x="70" y="60" width="180" height="95" fill="#2d1b4e" stroke="#4c1d95" stroke-width="2"/>
      <circle cx="110" cy="90" r="12" fill="#38bdf8"/>
      <circle cx="150" cy="120" r="12" fill="#38bdf8"/>
      <circle cx="210" cy="90" r="12" fill="#f43f5e"/>
      <circle cx="170" cy="80" r="12" fill="#f43f5e"/>
      <text x="160" y="32" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#c084fc" letter-spacing="1.5" text-anchor="middle">AUTO BATTLER TACTICS</text>
    </svg>`;
  }

  // 109. Zen Sand Garden
  if (id === 'game_zen_sand_garden' || engine === 'ZenSandGarden') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#292524"/>
      <!-- Sand Rake Patterns -->
      <ellipse cx="160" cy="115" rx="100" ry="45" fill="#e7e5e4"/>
      <ellipse cx="160" cy="115" rx="75" ry="32" fill="none" stroke="#d6d3d1" stroke-width="2"/>
      <ellipse cx="160" cy="115" rx="50" ry="20" fill="none" stroke="#d6d3d1" stroke-width="2"/>
      <!-- Smooth rocks -->
      <circle cx="150" cy="110" r="14" fill="#44403c"/>
      <circle cx="172" cy="118" r="9" fill="#57534e"/>
      <text x="160" y="34" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#d6d3d1" letter-spacing="1.5" text-anchor="middle">ZEN SAND GARDEN</text>
    </svg>`;
  }

  // 110. Potion Craft Brewery
  if (id === 'game_potion_craft_brewery' || engine === 'PotionCraftBrewery') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#1c102b"/>
      <!-- Cauldron -->
      <ellipse cx="160" cy="135" rx="50" ry="18" fill="#10b981"/>
      <path d="M 110,135 Q 105,175 160,175 Q 215,175 210,135 Z" fill="#334155"/>
      <!-- Rising bubbles -->
      <circle cx="145" cy="115" r="6" fill="#34d399" opacity="0.8"/>
      <circle cx="170" cy="100" r="8" fill="#6ee7b7" opacity="0.8"/>
      <circle cx="155" cy="80" r="5" fill="#a7f3d0" opacity="0.8"/>
      <text x="160" y="32" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#34d399" letter-spacing="1.5" text-anchor="middle">POTION CRAFT BREWERY</text>
    </svg>`;
  }

  // 111. Orbit Satellite Gravity
  if (id === 'game_orbit_satellite_gravity' || engine === 'OrbitSatelliteGravity') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#030712"/>
      <!-- Planet -->
      <circle cx="160" cy="110" r="32" fill="#2563eb" stroke="#38bdf8" stroke-width="2"/>
      <!-- Orbit ring -->
      <ellipse cx="160" cy="110" rx="75" ry="35" fill="none" stroke="#64748b" stroke-width="1.5" stroke-dasharray="4,4" transform="rotate(-15 160 110)"/>
      <circle cx="225" cy="95" r="7" fill="#facc15"/>
      <text x="160" y="32" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#38bdf8" letter-spacing="1.5" text-anchor="middle">ORBIT SATELLITE GRAVITY</text>
    </svg>`;
  }

  // 112. WTF?! Adventure RPG
  if (id === 'game_wtf_adventure_rpg' || engine === 'WtfAdventure') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg_wtf" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#022c22"/><stop offset="100%" stop-color="#064e3b"/></linearGradient>
      </defs>
      <rect width="320" height="200" fill="url(#bg_wtf)"/>
      <circle cx="160" cy="95" r="54" fill="#059669" opacity="0.3"/>
      <!-- Sword -->
      <path d="M 160,45 L 166,115 L 160,125 L 154,115 Z" fill="#e2e8f0" stroke="#00e5ff" stroke-width="1.5"/>
      <rect x="142" y="120" width="36" height="8" rx="2" fill="#fbbf24"/>
      <rect x="156" y="128" width="8" height="20" rx="2" fill="#78350f"/>
      <circle cx="160" cy="152" r="5" fill="#fbbf24"/>
      <!-- Floating Gems -->
      <circle cx="115" cy="85" r="9" fill="#10b981" stroke="#a7f3d0" stroke-width="2"/>
      <circle cx="205" cy="85" r="9" fill="#f59e0b" stroke="#fde68a" stroke-width="2"/>
      <text x="160" y="186" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#34d399" letter-spacing="1.5" text-anchor="middle">WTF?! ADVENTURE RPG</text>
    </svg>`;
  }

  // 113. Pits of Doom RPG
  if (id === 'game_pits_of_doom_rpg' || engine === 'PitsOfDoom') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bg_pit" cx="50%" cy="50%" r="60%"><stop offset="0%" stop-color="#450a0a"/><stop offset="100%" stop-color="#0f172a"/></radialGradient>
      </defs>
      <rect width="320" height="200" fill="url(#bg_pit)"/>
      <!-- Pit Hole -->
      <ellipse cx="160" cy="115" rx="70" ry="32" fill="#000000" stroke="#ef4444" stroke-width="3"/>
      <!-- Crypt Skull -->
      <circle cx="160" cy="75" r="18" fill="#f8fafc"/>
      <rect x="152" y="88" width="16" height="10" fill="#f8fafc"/>
      <circle cx="153" cy="73" r="4" fill="#0f172a"/>
      <circle cx="167" cy="73" r="4" fill="#0f172a"/>
      <!-- Torches -->
      <circle cx="85" cy="80" r="12" fill="#f97316" opacity="0.6"/>
      <circle cx="235" cy="80" r="12" fill="#f97316" opacity="0.6"/>
      <text x="160" y="184" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#ef4444" letter-spacing="1.5" text-anchor="middle">PITS OF DOOM RPG</text>
    </svg>`;
  }

  // 114. PLEX World Builder
  if (id === 'game_plex_world_builder' || engine === 'PlexWorldBuilder') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#090d16"/>
      <!-- Grid Blocks -->
      <rect x="80" y="60" width="36" height="36" fill="#15803d" stroke="#22c55e" stroke-width="1.5"/>
      <rect x="120" y="60" width="36" height="36" fill="#475569" stroke="#94a3b8" stroke-width="1.5"/>
      <rect x="160" y="60" width="36" height="36" fill="#0284c7" stroke="#38bdf8" stroke-width="1.5"/>
      <rect x="200" y="60" width="36" height="36" fill="#b45309" stroke="#f59e0b" stroke-width="1.5"/>
      <!-- Hero Avatar -->
      <rect x="142" y="108" width="36" height="36" fill="#a855f7" stroke="#00e5ff" stroke-width="2.5"/>
      <circle cx="160" cy="126" r="6" fill="#00e5ff"/>
      <text x="160" y="184" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#00e5ff" letter-spacing="1.5" text-anchor="middle">PLEX WORLD BUILDER</text>
    </svg>`;
  }

  // 115. Phaser Star Odyssey
  if (id === 'game_phaser_star_odyssey' || engine === 'PhaserStarOdyssey') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#030712"/>
      <!-- Starship -->
      <path d="M 190,95 L 125,72 L 140,95 L 125,118 Z" fill="#38bdf8" stroke="#00e5ff" stroke-width="2"/>
      <!-- Laser Blasts -->
      <line x1="195" y1="88" x2="250" y2="88" stroke="#00e5ff" stroke-width="3" stroke-linecap="round"/>
      <line x1="195" y1="102" x2="250" y2="102" stroke="#00e5ff" stroke-width="3" stroke-linecap="round"/>
      <!-- Asteroid -->
      <circle cx="265" cy="95" r="18" fill="#475569" stroke="#94a3b8" stroke-width="2"/>
      <text x="160" y="184" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#38bdf8" letter-spacing="1.5" text-anchor="middle">PHASER STAR ODYSSEY</text>
    </svg>`;
  }

  // 116. GallopQuest Derby
  if (id === 'game_gallop_quest_derby' || engine === 'GallopQuest') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg_gallop" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#0284c7"/><stop offset="60%" stop-color="#7dd3fc"/><stop offset="60%" stop-color="#15803d"/><stop offset="100%" stop-color="#14532d"/></linearGradient>
      </defs>
      <rect width="320" height="200" fill="url(#bg_gallop)"/>
      <!-- Hurdle -->
      <rect x="210" y="90" width="16" height="36" fill="#b45309"/>
      <rect x="206" y="96" width="24" height="6" fill="#fef08a"/>
      <!-- Leaping Stallion Silhouette -->
      <circle cx="140" cy="85" r="16" fill="#78350f"/>
      <rect x="110" y="75" width="36" height="20" rx="6" fill="#78350f"/>
      <!-- Horseshoe -->
      <circle cx="160" cy="45" r="10" fill="none" stroke="#fbbf24" stroke-width="3.5" stroke-dasharray="24,10"/>
      <text x="160" y="184" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#fef08a" letter-spacing="1.5" text-anchor="middle">GALLOPQUEST DERBY</text>
    </svg>`;
  }

  // 117. Hangman Wild West
  if (id === 'game_hangman_wild_west' || engine === 'HangmanWildWest') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#1c1917"/>
      <rect x="12" y="12" width="296" height="176" fill="none" stroke="#78350f" stroke-width="2"/>
      <!-- Gallows -->
      <path d="M 80,150 L 120,150 M 100,150 L 100,60 L 150,60 L 150,85" stroke="#b45309" stroke-width="4" fill="none"/>
      <!-- Outlaw figure -->
      <circle cx="150" cy="98" r="12" fill="none" stroke="#fef08a" stroke-width="2.5"/>
      <line x1="150" y1="110" x2="150" y2="135" stroke="#fef08a" stroke-width="2.5"/>
      <!-- Sheriff Star -->
      <polygon points="230,65 235,78 248,78 238,87 242,100 230,92 218,100 222,87 212,78 225,78" fill="#fbbf24"/>
      <text x="160" y="180" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#fbbf24" letter-spacing="1.5" text-anchor="middle">HANGMAN WILD WEST</text>
    </svg>`;
  }

  // 118. SwordBattle IO
  if (id === 'game_swordbattle_io' || engine === 'SwordBattleIO') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#030712"/>
      <!-- Clashing Broadswords -->
      <path d="M 120,140 L 195,65 L 205,75 L 130,150 Z" fill="#e2e8f0" stroke="#00e5ff" stroke-width="2"/>
      <path d="M 200,140 L 125,65 L 115,75 L 190,150 Z" fill="#e2e8f0" stroke="#ef4444" stroke-width="2"/>
      <!-- Clash spark starburst -->
      <circle cx="160" cy="108" r="12" fill="#fbbf24"/>
      <circle cx="160" cy="108" r="22" fill="none" stroke="#fef08a" stroke-width="2" stroke-dasharray="4,4"/>
      <text x="160" y="184" font-family="'Outfit', sans-serif" font-size="13" font-weight="900" fill="#00e5ff" letter-spacing="2" text-anchor="middle">SWORDBATTLE .IO</text>
    </svg>`;
  }

  // 119. Civis 4X Strategy
  if (id === 'game_civis_4x_strategy' || engine === 'Civis4XStrategy') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#0f172a"/>
      <!-- Hex Tiles -->
      <polygon points="120,60 145,45 170,60 170,90 145,105 120,90" fill="#15803d" stroke="#22c55e" stroke-width="2"/>
      <polygon points="170,60 195,45 220,60 220,90 195,105 170,90" fill="#ca8a04" stroke="#fbbf24" stroke-width="2"/>
      <polygon points="145,105 170,90 195,105 195,135 170,150 145,135" fill="#0284c7" stroke="#38bdf8" stroke-width="2"/>
      <!-- Roman Laurel & Banner -->
      <circle cx="170" cy="98" r="14" fill="#78350f" stroke="#fbbf24" stroke-width="2"/>
      <text x="170" y="103" font-size="12" text-anchor="middle">🏛️</text>
      <text x="160" y="184" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#fef08a" letter-spacing="1.5" text-anchor="middle">CIVIS 4X STRATEGY</text>
    </svg>`;
  }

  // 120. Westward Bounty RPG
  if (id === 'game_westward_bounty_rpg' || engine === 'WestwardBounty') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg_west" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#78350f"/><stop offset="100%" stop-color="#451a03"/></linearGradient>
      </defs>
      <rect width="320" height="200" fill="url(#bg_west)"/>
      <!-- Crossed Revolvers -->
      <circle cx="160" cy="95" r="42" fill="#92400e" stroke="#fbbf24" stroke-width="2"/>
      <text x="160" y="106" font-size="36" text-anchor="middle">🤠</text>
      <!-- Gold Nuggets -->
      <circle cx="105" cy="130" r="8" fill="#facc15"/>
      <circle cx="215" cy="130" r="8" fill="#facc15"/>
      <text x="160" y="182" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#fbbf24" letter-spacing="1.5" text-anchor="middle">WESTWARD BOUNTY RPG</text>
    </svg>`;
  }

  // 121. Set Match Trio
  if (id === 'game_set_match_trio' || engine === 'SetMatchTrio') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#064e3b"/>
      <!-- 3 Set Cards -->
      <rect x="65" y="55" width="55" height="85" rx="6" fill="#0f172a" stroke="#00e5ff" stroke-width="2"/>
      <rect x="132" y="55" width="55" height="85" rx="6" fill="#0f172a" stroke="#a855f7" stroke-width="2"/>
      <rect x="200" y="55" width="55" height="85" rx="6" fill="#0f172a" stroke="#fbbf24" stroke-width="2"/>
      <!-- Shapes -->
      <polygon points="92,85 102,97 92,110 82,97" fill="#00e5ff"/>
      <circle cx="160" cy="85" r="9" fill="#a855f7"/>
      <circle cx="160" cy="110" r="9" fill="#a855f7"/>
      <rect x="216" y="88" width="22" height="20" fill="#fbbf24"/>
      <text x="160" y="182" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#a7f3d0" letter-spacing="1.5" text-anchor="middle">SET MATCH TRIO</text>
    </svg>`;
  }

  // 122. Hacker Feud Cyber
  if (id === 'game_hacker_feud_cyber' || engine === 'HackerFeudCyber') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#05130b"/>
      <rect x="14" y="14" width="292" height="172" fill="none" stroke="#10b981" stroke-width="2"/>
      <!-- Terminal prompt -->
      <text x="32" y="55" font-family="monospace" font-size="12" fill="#34d399">&gt; ROOT ACCESS GRANTED</text>
      <text x="32" y="75" font-family="monospace" font-size="12" fill="#059669">&gt; DECRYPTING ICE NODES...</text>
      <!-- Cyber Lock Icon -->
      <circle cx="160" cy="115" r="24" fill="#064e3b" stroke="#10b981" stroke-width="2"/>
      <text x="160" y="123" font-size="20" text-anchor="middle">💻</text>
      <text x="160" y="172" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#34d399" letter-spacing="1.5" text-anchor="middle">HACKER FEUD CYBER</text>
    </svg>`;
  }

  // 123. PhaserQuest Fantasy Realm
  if (id === 'game_phaserquest_fantasy' || engine === 'PhaserQuestFantasy') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="pq-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1e1b4b"/>
          <stop offset="100%" stop-color="#312e81"/>
        </linearGradient>
      </defs>
      <rect width="320" height="200" fill="url(#pq-bg)"/>
      <circle cx="160" cy="95" r="46" fill="#4338ca" stroke="#818cf8" stroke-width="2"/>
      <text x="160" y="108" font-size="38" text-anchor="middle">⚔️</text>
      <path d="M120 140 L160 115 L200 140" stroke="#c7d2fe" stroke-width="2" fill="none"/>
      <text x="160" y="175" font-family="'Outfit', sans-serif" font-size="13" font-weight="900" fill="#e0e7ff" letter-spacing="1.5" text-anchor="middle">PHASERQUEST FANTASY</text>
    </svg>`;
  }

  // 124. HorsePaste Spymaster
  if (id === 'game_horsepaste_spymaster' || engine === 'HorsePasteSpymaster') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#090d16"/>
      <!-- Secret file folder -->
      <rect x="70" y="45" width="180" height="100" rx="8" fill="#1e293b" stroke="#3b82f6" stroke-width="2"/>
      <rect x="85" y="60" width="40" height="20" rx="3" fill="#3b82f6"/>
      <rect x="135" y="60" width="40" height="20" rx="3" fill="#ef4444"/>
      <rect x="185" y="60" width="50" height="20" rx="3" fill="#f59e0b"/>
      <text x="160" y="112" font-size="28" text-anchor="middle">🕵️</text>
      <text x="160" y="175" font-family="'Outfit', sans-serif" font-size="12" font-weight="800" fill="#60a5fa" letter-spacing="1.5" text-anchor="middle">HORSEPASTE SPYMASTER</text>
    </svg>`;
  }

  // 125. Gowog Cell Battle IO
  if (id === 'game_gowog_cell_battle' || engine === 'GowogCellBattle') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#042f2e"/>
      <circle cx="160" cy="95" r="42" fill="#10b981" stroke="#6ee7b7" stroke-width="4"/>
      <circle cx="160" cy="95" r="16" fill="#065f46"/>
      <circle cx="95" cy="70" r="14" fill="#06b6d4"/>
      <circle cx="230" cy="120" r="20" fill="#ec4899"/>
      <circle cx="120" cy="130" r="6" fill="#f59e0b"/>
      <circle cx="200" cy="60" r="5" fill="#f59e0b"/>
      <text x="160" y="175" font-family="'Outfit', sans-serif" font-size="13" font-weight="800" fill="#a7f3d0" letter-spacing="1.5" text-anchor="middle">GOWOG: CELL BATTLE IO</text>
    </svg>`;
  }

  // 126. CS:GO Aim Reflex & Strike
  if (id === 'game_csgo_aim_strike' || engine === 'CsgoAimStrike') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#0f172a"/>
      <!-- Crosshair Target -->
      <circle cx="160" cy="95" r="44" fill="none" stroke="#ef4444" stroke-width="3"/>
      <circle cx="160" cy="95" r="22" fill="none" stroke="#ef4444" stroke-width="2"/>
      <line x1="160" y1="35" x2="160" y2="155" stroke="#ef4444" stroke-width="2"/>
      <line x1="100" y1="95" x2="220" y2="95" stroke="#ef4444" stroke-width="2"/>
      <circle cx="160" cy="95" r="6" fill="#fbbf24"/>
      <text x="160" y="175" font-family="'Outfit', sans-serif" font-size="13" font-weight="900" fill="#fca5a5" letter-spacing="1.5" text-anchor="middle">CS:GO AIM STRIKE</text>
    </svg>`;
  }

  // 127. Racing World 3D Turbo
  if (id === 'game_racing_world_3d' || engine === 'RacingWorld3D') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#431407"/>
      <!-- 3D Perspective Road -->
      <polygon points="140,80 180,80 280,200 40,200" fill="#1e293b"/>
      <line x1="160" y1="80" x2="160" y2="200" stroke="#fbbf24" stroke-width="4" stroke-dasharray="10,10"/>
      <!-- Neon Supercar Tail -->
      <rect x="135" y="125" width="50" height="26" rx="6" fill="#ef4444"/>
      <circle cx="145" cy="138" r="4" fill="#fbbf24"/>
      <circle cx="175" cy="138" r="4" fill="#fbbf24"/>
      <text x="160" y="180" font-family="'Outfit', sans-serif" font-size="13" font-weight="900" fill="#fdba74" letter-spacing="1.5" text-anchor="middle">RACING WORLD 3D</text>
    </svg>`;
  }

  // 128. Robot Rumble Mech Arena
  if (id === 'game_robot_rumble_mech' || engine === 'RobotRumbleMech') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#1e1b4b"/>
      <rect x="120" y="65" width="80" height="65" rx="10" fill="#4338ca" stroke="#818cf8" stroke-width="3"/>
      <!-- Visor -->
      <rect x="135" y="80" width="50" height="14" rx="4" fill="#06b6d4"/>
      <!-- Mech Cannons -->
      <rect x="105" y="75" width="15" height="40" rx="3" fill="#6366f1"/>
      <rect x="200" y="75" width="15" height="40" rx="3" fill="#6366f1"/>
      <text x="160" y="175" font-family="'Outfit', sans-serif" font-size="13" font-weight="900" fill="#c7d2fe" letter-spacing="1.5" text-anchor="middle">ROBOT RUMBLE: MECH</text>
    </svg>`;
  }

  // 129. Neon Cyber Casino
  if (id === 'game_neon_cyber_casino' || engine === 'NeonCyberCasino') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#2e1065"/>
      <path d="M70 140 Q 150 140 220 70" stroke="#06b6d4" stroke-width="4" fill="none"/>
      <polygon points="225,65 205,72 215,82" fill="#ec4899"/>
      <!-- Multiplier text -->
      <text x="160" y="90" font-family="'Outfit', sans-serif" font-size="28" font-weight="900" fill="#38bdf8" text-anchor="middle">5.82x</text>
      <text x="160" y="175" font-family="'Outfit', sans-serif" font-size="13" font-weight="900" fill="#f0abfc" letter-spacing="1.5" text-anchor="middle">NEON CYBER CASINO</text>
    </svg>`;
  }

  // 130. Karaoke Beat Master
  if (id === 'game_karaoke_beat_master' || engine === 'KaraokeBeatMaster') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#4c0519"/>
      <circle cx="160" cy="85" r="35" fill="#f43f5e" stroke="#fda4af" stroke-width="3"/>
      <text x="160" y="97" font-size="32" text-anchor="middle">🎤</text>
      <!-- Soundwave bars -->
      <rect x="70" y="75" width="10" height="25" rx="3" fill="#fb7185"/>
      <rect x="90" y="60" width="10" height="55" rx="3" fill="#fb7185"/>
      <rect x="220" y="60" width="10" height="55" rx="3" fill="#fb7185"/>
      <rect x="240" y="75" width="10" height="25" rx="3" fill="#fb7185"/>
      <text x="160" y="175" font-family="'Outfit', sans-serif" font-size="13" font-weight="900" fill="#fecdd3" letter-spacing="1.5" text-anchor="middle">KARAOKE BEAT MASTER</text>
    </svg>`;
  }

  // 131. Legends of Future Past
  if (id === 'game_legends_future_past' || engine === 'LegendsFuturePast') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#082f49"/>
      <rect x="40" y="40" width="240" height="100" rx="8" fill="#0f172a" stroke="#0284c7" stroke-width="2"/>
      <text x="60" y="75" font-family="monospace" font-size="11" fill="#38bdf8">&gt; ACCESSING HELIOS AI...</text>
      <text x="60" y="95" font-family="monospace" font-size="11" fill="#10b981">&gt; COMBAT AVATAR ONLINE</text>
      <text x="60" y="115" font-family="monospace" font-size="11" fill="#f59e0b">&gt; NEURAL LINK: 100%</text>
      <text x="160" y="175" font-family="'Outfit', sans-serif" font-size="13" font-weight="900" fill="#bae6fd" letter-spacing="1.5" text-anchor="middle">LEGENDS FUTURE PAST</text>
    </svg>`;
  }

  // 132. Billiards 3D Pro
  if (id === 'game_billiards_3d_pro' || engine === 'Billiards3DPro') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#064e3b"/>
      <rect x="30" y="30" width="260" height="120" rx="14" fill="#047857" stroke="#78350f" stroke-width="8"/>
      <!-- Pockets -->
      <circle cx="45" cy="45" r="10" fill="#0f172a"/>
      <circle cx="275" cy="45" r="10" fill="#0f172a"/>
      <circle cx="160" cy="42" r="10" fill="#0f172a"/>
      <!-- Balls -->
      <circle cx="120" cy="90" r="12" fill="#ffffff"/>
      <circle cx="190" cy="90" r="12" fill="#1e293b"/>
      <circle cx="190" cy="90" r="4" fill="#ffffff"/>
      <circle cx="215" cy="78" r="12" fill="#ef4444"/>
      <circle cx="215" cy="102" r="12" fill="#eab308"/>
      <text x="160" y="180" font-family="'Outfit', sans-serif" font-size="13" font-weight="900" fill="#a7f3d0" letter-spacing="1.5" text-anchor="middle">BILLIARDS 3D PRO</text>
    </svg>`;
  }

  // 133. Water Sort Puzzle
  if (id === 'game_water_sort_puzzle' || engine === 'WaterSortPuzzle') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#082f49"/>
      <!-- Flask 1 -->
      <rect x="90" y="45" width="36" height="100" rx="14" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
      <rect x="94" y="115" width="28" height="26" rx="6" fill="#3b82f6"/>
      <rect x="94" y="88" width="28" height="26" fill="#10b981"/>
      <rect x="94" y="60" width="28" height="26" fill="#ef4444"/>
      <!-- Flask 2 -->
      <rect x="142" y="45" width="36" height="100" rx="14" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
      <rect x="146" y="115" width="28" height="26" rx="6" fill="#f59e0b"/>
      <rect x="146" y="88" width="28" height="26" fill="#ec4899"/>
      <rect x="146" y="60" width="28" height="26" fill="#3b82f6"/>
      <!-- Flask 3 (Sorted Cyan) -->
      <rect x="194" y="45" width="36" height="100" rx="14" fill="#1e293b" stroke="#00f0ff" stroke-width="3"/>
      <rect x="198" y="55" width="28" height="86" rx="8" fill="#06b6d4"/>
      <text x="160" y="178" font-family="'Outfit', sans-serif" font-size="13" font-weight="900" fill="#7dd3fc" letter-spacing="1.5" text-anchor="middle">WATER SORT PUZZLE</text>
    </svg>`;
  }

  // 134. Queens Crown Logic
  if (id === 'game_queens_crown_logic' || engine === 'QueensCrownLogic') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#451a03"/>
      <!-- Color Regions Grid -->
      <rect x="90" y="35" width="140" height="110" rx="8" fill="#1e293b" stroke="#fbbf24" stroke-width="3"/>
      <rect x="95" y="40" width="40" height="50" fill="#1e3a8a"/>
      <rect x="135" y="40" width="45" height="50" fill="#14532d"/>
      <rect x="180" y="40" width="45" height="50" fill="#701a75"/>
      <rect x="95" y="90" width="65" height="50" fill="#78350f"/>
      <rect x="160" y="90" width="65" height="50" fill="#0e7490"/>
      <!-- Crowns -->
      <text x="115" y="75" font-size="24" text-anchor="middle">👑</text>
      <text x="195" y="125" font-size="24" text-anchor="middle">👑</text>
      <text x="160" y="178" font-family="'Outfit', sans-serif" font-size="13" font-weight="900" fill="#fde68a" letter-spacing="1.5" text-anchor="middle">QUEENS CROWN LOGIC</text>
    </svg>`;
  }

  // 135. Pipe Flow Connect
  if (id === 'game_pipe_flow_connect' || engine === 'PipeFlowConnect') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#042f2e"/>
      <!-- Glowing Pipe Layout -->
      <path d="M60 100 L140 100 L140 60 L220 60 L220 120 L260 120" stroke="#06b6d4" stroke-width="18" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M60 100 L140 100 L140 60 L220 60 L220 120 L260 120" stroke="#a5f3fc" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <!-- Valve wheels -->
      <circle cx="60" cy="100" r="12" fill="#10b981"/>
      <circle cx="260" cy="120" r="12" fill="#3b82f6"/>
      <text x="160" y="178" font-family="'Outfit', sans-serif" font-size="13" font-weight="900" fill="#5eead4" letter-spacing="1.5" text-anchor="middle">PIPE FLOW CONNECT</text>
    </svg>`;
  }

  // 136. Fifteen Slide Puzzle
  if (id === 'game_fifteen_slide_puzzle' || engine === 'FifteenSlidePuzzle') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#0f172a"/>
      <!-- 4x4 Grid Board -->
      <rect x="95" y="32" width="130" height="116" rx="8" fill="#1e293b" stroke="#3b82f6" stroke-width="2"/>
      <!-- Tiles -->
      <rect x="100" y="38" width="26" height="24" rx="4" fill="#3b82f6"/><text x="113" y="55" font-family="sans-serif" font-weight="bold" font-size="12" fill="#fff" text-anchor="middle">1</text>
      <rect x="130" y="38" width="26" height="24" rx="4" fill="#3b82f6"/><text x="143" y="55" font-family="sans-serif" font-weight="bold" font-size="12" fill="#fff" text-anchor="middle">2</text>
      <rect x="160" y="38" width="26" height="24" rx="4" fill="#3b82f6"/><text x="173" y="55" font-family="sans-serif" font-weight="bold" font-size="12" fill="#fff" text-anchor="middle">3</text>
      <rect x="190" y="38" width="26" height="24" rx="4" fill="#3b82f6"/><text x="203" y="55" font-family="sans-serif" font-weight="bold" font-size="12" fill="#fff" text-anchor="middle">4</text>
      <rect x="100" y="66" width="26" height="24" rx="4" fill="#3b82f6"/><text x="113" y="83" font-family="sans-serif" font-weight="bold" font-size="12" fill="#fff" text-anchor="middle">5</text>
      <rect x="130" y="66" width="26" height="24" rx="4" fill="#3b82f6"/><text x="143" y="83" font-family="sans-serif" font-weight="bold" font-size="12" fill="#fff" text-anchor="middle">6</text>
      <rect x="160" y="66" width="26" height="24" rx="4" fill="#3b82f6"/><text x="173" y="83" font-family="sans-serif" font-weight="bold" font-size="12" fill="#fff" text-anchor="middle">7</text>
      <rect x="190" y="66" width="26" height="24" rx="4" fill="#3b82f6"/><text x="203" y="83" font-family="sans-serif" font-weight="bold" font-size="12" fill="#fff" text-anchor="middle">8</text>
      <rect x="100" y="94" width="26" height="24" rx="4" fill="#3b82f6"/><text x="113" y="111" font-family="sans-serif" font-weight="bold" font-size="12" fill="#fff" text-anchor="middle">9</text>
      <rect x="130" y="94" width="26" height="24" rx="4" fill="#3b82f6"/><text x="143" y="111" font-family="sans-serif" font-weight="bold" font-size="12" fill="#fff" text-anchor="middle">10</text>
      <rect x="160" y="94" width="26" height="24" rx="4" fill="#3b82f6"/><text x="173" y="111" font-family="sans-serif" font-weight="bold" font-size="12" fill="#fff" text-anchor="middle">11</text>
      <rect x="190" y="94" width="26" height="24" rx="4" fill="#3b82f6"/><text x="203" y="111" font-family="sans-serif" font-weight="bold" font-size="12" fill="#fff" text-anchor="middle">12</text>
      <rect x="100" y="122" width="26" height="24" rx="4" fill="#3b82f6"/><text x="113" y="139" font-family="sans-serif" font-weight="bold" font-size="12" fill="#fff" text-anchor="middle">13</text>
      <rect x="130" y="122" width="26" height="24" rx="4" fill="#3b82f6"/><text x="143" y="139" font-family="sans-serif" font-weight="bold" font-size="12" fill="#fff" text-anchor="middle">14</text>
      <rect x="160" y="122" width="26" height="24" rx="4" fill="#3b82f6"/><text x="173" y="139" font-family="sans-serif" font-weight="bold" font-size="12" fill="#fff" text-anchor="middle">15</text>
      <!-- Blank Slot at 190, 122 -->
      <text x="160" y="180" font-family="'Outfit', sans-serif" font-size="13" font-weight="900" fill="#93c5fd" letter-spacing="1.5" text-anchor="middle">FIFTEEN SLIDE PUZZLE</text>
    </svg>`;
  }

  // 137. Capybara Catch Frenzy
  if (id === 'game_capybara_catch_frenzy' || engine === 'CapybaraCatchFrenzy') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#065f46"/>
      <!-- River Hotspring -->
      <ellipse cx="160" cy="95" rx="90" ry="45" fill="#0284c7"/>
      <!-- Capybara -->
      <ellipse cx="160" cy="90" rx="36" ry="28" fill="#78350f"/>
      <rect x="142" y="85" width="36" height="20" rx="8" fill="#92400e"/>
      <circle cx="150" cy="80" r="3" fill="#000"/>
      <circle cx="170" cy="80" r="3" fill="#000"/>
      <!-- Orange on head -->
      <circle cx="160" cy="60" r="10" fill="#f97316"/>
      <rect x="160" y="47" width="3" height="5" fill="#22c55e"/>
      <text x="160" y="178" font-family="'Outfit', sans-serif" font-size="13" font-weight="900" fill="#fef08a" letter-spacing="1.5" text-anchor="middle">CAPYBARA CATCH FRENZY</text>
    </svg>`;
  }

  // 138. Speed Cube Rush
  if (id === 'game_speed_cube_rush' || engine === 'SpeedCubeRush') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#0f172a"/>
      <!-- 3D Perspective Road -->
      <polygon points="140,60 180,60 280,200 40,200" fill="#1e1b4b"/>
      <line x1="160" y1="60" x2="160" y2="200" stroke="#06b6d4" stroke-width="2" stroke-dasharray="6,6"/>
      <!-- Glowing Cube -->
      <rect x="140" y="115" width="40" height="40" rx="6" fill="#00f0ff" stroke="#ffffff" stroke-width="2"/>
      <!-- Red Obstacle Blocks -->
      <rect x="80" y="145" width="45" height="25" rx="4" fill="#ef4444"/>
      <rect x="195" y="145" width="45" height="25" rx="4" fill="#ef4444"/>
      <text x="160" y="182" font-family="'Outfit', sans-serif" font-size="13" font-weight="900" fill="#38bdf8" letter-spacing="1.5" text-anchor="middle">SPEED CUBE RUSH</text>
    </svg>`;
  }

  // 139. Missile Escape Pilot
  if (id === 'game_missile_escape_pilot' || engine === 'MissileEscapePilot') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#0369a1"/>
      <!-- Plane -->
      <ellipse cx="160" cy="85" rx="22" ry="7" fill="#fbbf24"/>
      <rect x="155" y="65" width="8" height="40" rx="3" fill="#d97706"/>
      <!-- Smoke trail -->
      <circle cx="130" cy="85" r="8" fill="rgba(255,255,255,0.4)"/>
      <circle cx="110" cy="88" r="12" fill="rgba(255,255,255,0.2)"/>
      <!-- Homing Missile -->
      <polygon points="230,110 210,105 210,115" fill="#ef4444"/>
      <line x1="210" y1="110" x2="245" y2="110" stroke="#ef4444" stroke-width="3"/>
      <!-- Star -->
      <text x="195" y="65" font-size="20">⭐</text>
      <text x="160" y="178" font-family="'Outfit', sans-serif" font-size="13" font-weight="900" fill="#fed7aa" letter-spacing="1.5" text-anchor="middle">MISSILE ESCAPE PILOT</text>
    </svg>`;
  }

  // 140. Tiny Crate Box Toss
  if (id === 'game_tiny_crate_platformer' || engine === 'TinyCratePlatformer') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#0f172a"/>
      <!-- Ledges -->
      <rect x="30" y="140" width="260" height="30" fill="#334155"/>
      <rect x="180" y="95" width="100" height="15" fill="#334155"/>
      <!-- Wooden Crate -->
      <rect x="110" y="112" width="28" height="28" fill="#d97706" stroke="#78350f" stroke-width="2"/>
      <line x1="110" y1="112" x2="138" y2="140" stroke="#78350f" stroke-width="2"/>
      <line x1="138" y1="112" x2="110" y2="140" stroke="#78350f" stroke-width="2"/>
      <!-- Hero -->
      <rect x="70" y="112" width="20" height="28" rx="4" fill="#38bdf8"/>
      <!-- Exit Door -->
      <rect x="240" y="55" width="24" height="40" fill="#10b981"/>
      <text x="160" y="182" font-family="'Outfit', sans-serif" font-size="13" font-weight="900" fill="#fed7aa" letter-spacing="1.5" text-anchor="middle">TINY CRATE: BOX TOSS</text>
    </svg>`;
  }

  // 141. Sunset Cyberspace
  if (id === 'game_sunset_cyberspace' || engine === 'SunsetCyberspace') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#3b0764"/>
      <!-- Striped Sun -->
      <circle cx="160" cy="80" r="42" fill="#f43f5e"/>
      <line x1="118" y1="70" x2="202" y2="70" stroke="#3b0764" stroke-width="3"/>
      <line x1="118" y1="80" x2="202" y2="80" stroke="#3b0764" stroke-width="3"/>
      <line x1="118" y1="90" x2="202" y2="90" stroke="#3b0764" stroke-width="3"/>
      <!-- Cyber Grid Floor -->
      <polygon points="120,110 200,110 320,200 0,200" fill="#090014"/>
      <line x1="160" y1="110" x2="160" y2="200" stroke="#ec4899" stroke-width="2"/>
      <line x1="140" y1="110" x2="80" y2="200" stroke="#ec4899" stroke-width="1.5"/>
      <line x1="180" y1="110" x2="240" y2="200" stroke="#ec4899" stroke-width="1.5"/>
      <!-- Cyber Ship -->
      <polygon points="160,135 145,155 175,155" fill="#06b6d4"/>
      <text x="160" y="185" font-family="'Outfit', sans-serif" font-size="13" font-weight="900" fill="#f0abfc" letter-spacing="1.5" text-anchor="middle">SUNSET CYBERSPACE</text>
    </svg>`;
  }

  // 142. Astro Loop Orbital
  if (id === 'game_astro_loop_orbital' || engine === 'AstroLoopOrbital') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#030712"/>
      <!-- Core Planet -->
      <circle cx="160" cy="95" r="26" fill="#0284c7" stroke="#38bdf8" stroke-width="3"/>
      <!-- Orbital Ring -->
      <circle cx="160" cy="95" r="62" fill="none" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="6,6"/>
      <!-- Player Starfighter -->
      <polygon points="222,95 210,88 210,102" fill="#10b981"/>
      <!-- Laser Blast Outward -->
      <line x1="224" y1="95" x2="255" y2="95" stroke="#00f0ff" stroke-width="3"/>
      <!-- Asteroid Hostile -->
      <circle cx="270" cy="95" r="8" fill="#ef4444"/>
      <text x="160" y="180" font-family="'Outfit', sans-serif" font-size="13" font-weight="900" fill="#bae6fd" letter-spacing="1.5" text-anchor="middle">ASTRO LOOP ORBITAL</text>
    </svg>`;
  }

  // 143. Star Fighter: Deep Space Ace
  if (id === 'game_star_fighter_ace' || engine === 'StarFighterAce') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#030712"/>
      <circle cx="160" cy="100" r="1" fill="#fff" opacity="0.8"/>
      <circle cx="80" cy="40" r="1.5" fill="#38bdf8" opacity="0.6"/>
      <circle cx="240" cy="160" r="1.5" fill="#38bdf8" opacity="0.6"/>
      <!-- Starfighter Ship -->
      <polygon points="160,50 140,130 155,120 160,115 165,120 180,130" fill="#0284c7" stroke="#38bdf8" stroke-width="2"/>
      <!-- Twin Plasma Lasers -->
      <line x1="135" y1="90" x2="135" y2="40" stroke="#00f0ff" stroke-width="3"/>
      <line x1="185" y1="90" x2="185" y2="40" stroke="#00f0ff" stroke-width="3"/>
      <!-- Enemy Drone Exploding -->
      <circle cx="210" cy="50" r="14" fill="#ef4444" opacity="0.8"/>
      <text x="160" y="180" font-family="'Outfit', sans-serif" font-size="13" font-weight="900" fill="#7dd3fc" letter-spacing="1.5" text-anchor="middle">STAR FIGHTER ACE</text>
    </svg>`;
  }

  // 144. Terminal Breach: Fallout Decryptor
  if (id === 'game_terminal_breach' || engine === 'TerminalBreach') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#052e16"/>
      <!-- CRT scanline overlay -->
      <rect x="20" y="20" width="280" height="140" rx="8" fill="#022c22" stroke="#22c55e" stroke-width="2"/>
      <text x="40" y="55" font-family="'Courier New', monospace" font-size="14" font-weight="700" fill="#4ade80">> ROBOCO TERMINAL</text>
      <text x="40" y="80" font-family="'Courier New', monospace" font-size="12" fill="#22c55e">0xF240 [REACTOR] 3/7</text>
      <text x="40" y="105" font-family="'Courier New', monospace" font-size="12" fill="#22c55e">0xF25C [OVERRIDE] 7/7</text>
      <text x="40" y="130" font-family="'Courier New', monospace" font-size="13" font-weight="900" fill="#a7f3d0">ACCESS GRANTED ***</text>
      <text x="160" y="184" font-family="'Outfit', sans-serif" font-size="13" font-weight="900" fill="#86efac" letter-spacing="1.5" text-anchor="middle">TERMINAL BREACH</text>
    </svg>`;
  }

  // 145. Buses From Hell: Dodging Mayhem
  if (id === 'game_buses_from_hell' || engine === 'BusesFromHell') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#18181b"/>
      <!-- Highway Lanes -->
      <rect x="40" y="0" width="240" height="200" fill="#27272a"/>
      <line x1="120" y1="0" x2="120" y2="200" stroke="#facc15" stroke-width="2" stroke-dasharray="12,12"/>
      <line x1="200" y1="0" x2="200" y2="200" stroke="#facc15" stroke-width="2" stroke-dasharray="12,12"/>
      <!-- Fiery Bus -->
      <rect x="135" y="25" width="50" height="85" rx="6" fill="#dc2626" stroke="#f87171" stroke-width="2"/>
      <rect x="142" y="30" width="36" height="15" rx="2" fill="#fef08a"/>
      <!-- Player Car dodging -->
      <rect x="65" y="120" width="35" height="55" rx="5" fill="#3b82f6" stroke="#93c5fd" stroke-width="2"/>
      <text x="160" y="185" font-family="'Outfit', sans-serif" font-size="13" font-weight="900" fill="#fca5a5" letter-spacing="1.5" text-anchor="middle">BUSES FROM HELL</text>
    </svg>`;
  }

  // 146. Smash Copter: Falling Hazard
  if (id === 'game_smash_copter' || engine === 'SmashCopter') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#1e1b4b"/>
      <!-- Attack Helicopter -->
      <line x1="120" y1="35" x2="200" y2="35" stroke="#94a3b8" stroke-width="3"/>
      <ellipse cx="160" cy="50" rx="30" ry="16" fill="#475569" stroke="#94a3b8" stroke-width="2"/>
      <!-- Falling Crate Hazard -->
      <rect x="145" y="85" width="26" height="26" fill="#ea580c" stroke="#fed7aa" stroke-width="2"/>
      <!-- Rooftop & Running Hero -->
      <rect x="20" y="150" width="280" height="50" fill="#0f172a"/>
      <rect x="90" y="125" width="16" height="25" rx="4" fill="#38bdf8"/>
      <text x="160" y="185" font-family="'Outfit', sans-serif" font-size="13" font-weight="900" fill="#fdba74" letter-spacing="1.5" text-anchor="middle">SMASH COPTER</text>
    </svg>`;
  }

  // 147. Dude Adventure: Forest Quest
  if (id === 'game_dude_adventure' || engine === 'DudeAdventure') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#064e3b"/>
      <!-- Grass Platform -->
      <rect x="0" y="145" width="320" height="55" fill="#166534"/>
      <rect x="0" y="145" width="320" height="8" fill="#4ade80"/>
      <!-- Dude Character -->
      <circle cx="100" cy="115" r="14" fill="#facc15"/>
      <rect x="92" y="128" width="16" height="18" rx="3" fill="#2563eb"/>
      <!-- Cute Forest Slime Monster -->
      <ellipse cx="210" cy="138" rx="16" ry="10" fill="#ec4899"/>
      <!-- Gold Gem -->
      <polygon points="150,90 160,80 170,90 160,105" fill="#fbbf24"/>
      <text x="160" y="180" font-family="'Outfit', sans-serif" font-size="13" font-weight="900" fill="#bbf7d0" letter-spacing="1.5" text-anchor="middle">DUDE ADVENTURE</text>
    </svg>`;
  }

  // 148. Feed The Flames: Idle Bonfire
  if (id === 'game_feed_the_flames' || engine === 'FeedTheFlames') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#0f172a"/>
      <!-- Glowing Campfire Stone Ring -->
      <ellipse cx="160" cy="140" rx="55" ry="18" fill="#334155"/>
      <!-- Wood Logs -->
      <line x1="130" y1="145" x2="190" y2="135" stroke="#78350f" stroke-width="8" stroke-linecap="round"/>
      <line x1="135" y1="135" x2="185" y2="145" stroke="#92400e" stroke-width="8" stroke-linecap="round"/>
      <!-- Blazing Flame Core -->
      <path d="M 160 50 Q 185 95 180 135 Q 160 145 140 135 Q 135 95 160 50 Z" fill="#f97316"/>
      <path d="M 160 75 Q 175 105 170 135 Q 160 140 150 135 Q 145 105 160 75 Z" fill="#facc15"/>
      <text x="160" y="182" font-family="'Outfit', sans-serif" font-size="13" font-weight="900" fill="#fed7aa" letter-spacing="1.5" text-anchor="middle">FEED THE FLAMES</text>
    </svg>`;
  }

  // 149. Factory Defense RTS: Automata
  if (id === 'game_factory_defense_rts' || engine === 'FactoryDefenseRTS') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#134e4a"/>
      <!-- Grid Base Plate -->
      <rect x="30" y="30" width="260" height="130" rx="6" fill="#115e59" stroke="#2dd4bf" stroke-width="1.5"/>
      <!-- Core Base Reactor -->
      <rect x="70" y="75" width="40" height="40" rx="4" fill="#0f766e" stroke="#5eead4" stroke-width="2"/>
      <circle cx="90" cy="95" r="10" fill="#2dd4bf"/>
      <!-- Conveyor Track -->
      <line x1="110" y1="95" x2="190" y2="95" stroke="#facc15" stroke-width="6" stroke-dasharray="6,4"/>
      <!-- Defense Turret -->
      <circle cx="210" cy="95" r="18" fill="#1e293b" stroke="#f43f5e" stroke-width="2"/>
      <line x1="210" y1="95" x2="245" y2="85" stroke="#f43f5e" stroke-width="4"/>
      <text x="160" y="182" font-family="'Outfit', sans-serif" font-size="13" font-weight="900" fill="#99f6e4" letter-spacing="1.5" text-anchor="middle">FACTORY DEFENSE RTS</text>
    </svg>`;
  }

  // 150. Rota: Gravity Bend Platformer
  if (id === 'game_rota_gravity_bend' || engine === 'RotaGravityBend') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#2e1065"/>
      <!-- Circular Room Arena -->
      <circle cx="160" cy="95" r="60" fill="#3b0764" stroke="#a855f7" stroke-width="3"/>
      <!-- Gravity Rotation Arrows -->
      <path d="M 140 45 A 55 55 0 0 1 180 45" fill="none" stroke="#e9d5ff" stroke-width="2"/>
      <!-- Pushable Block -->
      <rect x="145" y="80" width="24" height="24" rx="3" fill="#ec4899" stroke="#fbcfe8" stroke-width="2"/>
      <!-- Hero on wall -->
      <circle cx="115" cy="95" r="10" fill="#38bdf8"/>
      <text x="160" y="182" font-family="'Outfit', sans-serif" font-size="13" font-weight="900" fill="#f5d0fe" letter-spacing="1.5" text-anchor="middle">ROTA: GRAVITY BEND</text>
    </svg>`;
  }

  // 151. Legend Wings: Sky Striker
  if (id === 'game_legend_wings' || engine === 'LegendWings') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#1e3a8a"/>
      <!-- Ocean water texture -->
      <rect x="0" y="0" width="320" height="200" fill="#172554"/>
      <!-- Island Outpost -->
      <ellipse cx="230" cy="70" rx="35" ry="25" fill="#15803d"/>
      <!-- WWII Strike Fighter -->
      <polygon points="160,80 145,135 160,125 175,135" fill="#2563eb" stroke="#60a5fa" stroke-width="2"/>
      <line x1="120" y1="110" x2="200" y2="110" stroke="#3b82f6" stroke-width="6"/>
      <!-- Triple Laser Shot -->
      <line x1="145" y1="75" x2="145" y2="35" stroke="#facc15" stroke-width="3"/>
      <line x1="160" y1="70" x2="160" y2="30" stroke="#facc15" stroke-width="3"/>
      <line x1="175" y1="75" x2="175" y2="35" stroke="#facc15" stroke-width="3"/>
      <text x="160" y="180" font-family="'Outfit', sans-serif" font-size="13" font-weight="900" fill="#bfdbfe" letter-spacing="1.5" text-anchor="middle">LEGEND WINGS</text>
    </svg>`;
  }

  // 152. Binary Tetris: Bit Matrix
  if (id === 'game_binary_tetris' || engine === 'BinaryTetris') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#022c22"/>
      <!-- Matrix grid columns -->
      <rect x="90" y="20" width="140" height="140" rx="4" fill="#064e3b" stroke="#10b981" stroke-width="2"/>
      <text x="110" y="65" font-family="'Courier New', monospace" font-size="18" font-weight="900" fill="#34d399">1</text>
      <text x="135" y="65" font-family="'Courier New', monospace" font-size="18" font-weight="900" fill="#34d399">0</text>
      <text x="160" y="65" font-family="'Courier New', monospace" font-size="18" font-weight="900" fill="#34d399">1</text>
      <text x="185" y="65" font-family="'Courier New', monospace" font-size="18" font-weight="900" fill="#34d399">1</text>
      <rect x="130" y="90" width="55" height="25" rx="3" fill="#059669" stroke="#6ee7b7" stroke-width="2"/>
      <text x="160" y="182" font-family="'Outfit', sans-serif" font-size="13" font-weight="900" fill="#a7f3d0" letter-spacing="1.5" text-anchor="middle">BINARY TETRIS</text>
    </svg>`;
  }

  // 153. Armored Tanks Blitz: Steel War
  if (id === 'game_armored_tanks_blitz' || engine === 'ArmoredTanksBlitz') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#1e293b"/>
      <!-- Destructible Bunker Wall -->
      <rect x="40" y="50" width="30" height="90" fill="#475569" stroke="#64748b" stroke-width="2"/>
      <!-- Tank Hull -->
      <rect x="135" y="80" width="50" height="40" rx="4" fill="#15803d" stroke="#22c55e" stroke-width="2"/>
      <rect x="130" y="74" width="60" height="10" rx="2" fill="#334155"/>
      <rect x="130" y="116" width="60" height="10" rx="2" fill="#334155"/>
      <!-- Turret & Cannon -->
      <circle cx="160" cy="100" r="14" fill="#166534" stroke="#4ade80" stroke-width="2"/>
      <line x1="160" y1="100" x2="205" y2="100" stroke="#22c55e" stroke-width="5"/>
      <!-- Cannon Blast -->
      <polygon points="208,95 224,100 208,105" fill="#facc15"/>
      <text x="160" y="180" font-family="'Outfit', sans-serif" font-size="13" font-weight="900" fill="#86efac" letter-spacing="1.5" text-anchor="middle">ARMORED TANKS BLITZ</text>
    </svg>`;
  }

  // 154. Fly Plane Fly: Sky Obstacles
  if (id === 'game_fly_plane_sky' || engine === 'FlyPlaneSky') {
    return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="200" fill="#0284c7"/>
      <!-- Distant Mountains -->
      <polygon points="0,170 80,100 160,150 240,90 320,170 320,200 0,200" fill="#0369a1"/>
      <!-- Spire Obstacles -->
      <polygon points="210,0 240,0 230,65 215,65" fill="#334155"/>
      <polygon points="215,130 230,130 240,200 210,200" fill="#334155"/>
      <!-- Glowing Aero Ring -->
      <ellipse cx="170" cy="98" rx="8" ry="22" fill="none" stroke="#facc15" stroke-width="4"/>
      <!-- Monoplane -->
      <ellipse cx="105" cy="98" rx="20" ry="8" fill="#ef4444"/>
      <polygon points="98,98 108,82 118,82 108,98" fill="#dc2626"/>
      <text x="160" y="185" font-family="'Outfit', sans-serif" font-size="13" font-weight="900" fill="#bae6fd" letter-spacing="1.5" text-anchor="middle">FLY PLANE FLY</text>
    </svg>`;
  }

  // Graceful Fallback (Genre-Specific & Polished)
  const colors = {
    cricket: ['#065f46', '#10b981'],
    racing: ['#1e1b4b', '#00e5ff'],
    sports: ['#14532d', '#22c55e'],
    action: ['#450a0a', '#ef4444'],
    arcade: ['#312e81', '#6366f1'],
    puzzle: ['#581c87', '#a855f7'],
    '2player': ['#0c4a6e', '#38bdf8']
  };
  const theme = colors[game.category] || ['#1e293b', '#00e5ff'];

  return `<svg class="game-thumb-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
    <rect width="320" height="200" fill="${theme[0]}"/>
    <circle cx="160" cy="95" r="42" fill="${theme[1]}" opacity="0.2"/>
    <text x="160" y="105" font-size="36" text-anchor="middle">${game.icon || '🎮'}</text>
    <text x="160" y="165" font-family="'Outfit', sans-serif" font-size="11" font-weight="800" fill="#ffffff" letter-spacing="1.5" text-anchor="middle">${title.slice(0, 20)}</text>
  </svg>`;
}
