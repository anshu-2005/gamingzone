import { GameEngineBase } from '../core/GameEngineBase.js';

export class LegendsFuturePast extends GameEngineBase {
  constructor(container, options = {}) {
    super(container, {
      ...options,
      aspectRatio: 16 / 9,
      baseWidth: 1000,
      baseHeight: 562
    });

    this.title = 'Legends of Future Past: Cyber MUD';
    this.player = {
      name: 'NetRunner-09',
      hp: 100,
      maxHp: 100,
      energy: 80,
      maxEnergy: 80,
      credits: 250,
      nanites: 3,
      level: 1,
      xp: 0
    };

    this.currentRoom = 'cyber_alley';
    this.log = [
      'SYSTEM BOOT: LOFP Neural Jack v4.12 initialized.',
      'CONNECTED: Neo-Babylon Sector 7 Sector Grid.',
      'Welcome Operative. Explore, hack corp nodes, and dismantle the rogue AI.'
    ];

    this.rooms = {
      cyber_alley: {
        name: 'Cyber Alley (Lower District)',
        desc: 'Acid rain trickles off flickering neon signs. Steam vents hiss in dark shadows.',
        dirs: { north: 'corp_lobby', east: 'black_market' },
        enemy: null,
        hackable: true,
        hacked: false
      },
      corp_lobby: {
        name: 'OmniCorp Apex Plaza',
        desc: 'Towering chrome arches and security laser grids hum with defensive energy.',
        dirs: { south: 'cyber_alley', north: 'server_core', west: 'docking_bay' },
        enemy: { name: 'Security Drone Mk-II', hp: 45, maxHp: 45, attack: 12, exp: 50 },
        hackable: true,
        hacked: false
      },
      black_market: {
        name: 'Sub-Grid Black Market',
        desc: 'Underground cybernetic docs and shadow merchants whisper encrypted trade offers.',
        dirs: { west: 'cyber_alley' },
        enemy: null,
        hackable: false,
        hacked: false,
        canHeal: true
      },
      docking_bay: {
        name: 'Sub-Orbital Shuttle Bay',
        desc: 'Massive blast doors frame heavy atmospheric drop-ships waiting for launch clearance.',
        dirs: { east: 'corp_lobby' },
        enemy: { name: 'Cyber Mercenary', hp: 60, maxHp: 60, attack: 16, exp: 75 },
        hackable: true,
        hacked: false
      },
      server_core: {
        name: 'AI Mainframe: Project HELIOS',
        desc: 'Pulsing cyan crystalline data towers encircle a glowing neural hivemind intelligence.',
        dirs: { south: 'corp_lobby' },
        enemy: { name: 'HELIOS Rogue AI Avatar', hp: 120, maxHp: 120, attack: 22, exp: 200, isBoss: true },
        hackable: true,
        hacked: false
      }
    };
  }

  onInit() {
    this.createCanvas();

    this.addEventListenerTracked(this.canvas, 'click', (e) => this.handleClick(e));
    this.addEventListenerTracked(window, 'keydown', (e) => this.handleKeyDown(e));

    this.showStartCard(
      'LEGENDS OF FUTURE PAST',
      'The legendary cyberpunk online MUD rebuilt! Explore Neo-Babylon, battle rogue drones, hack security terminals, and overthrow Project HELIOS. Use on-screen action pads or type terminal commands.',
      'JACK IN TO NEURAL NET'
    );
  }

  addLog(msg) {
    this.log.push(msg);
    if (this.log.length > 20) this.log.shift();
  }

  handleKeyDown(e) {
    if (e.code === 'KeyN' || e.code === 'ArrowUp') this.move('north');
    else if (e.code === 'KeyS' || e.code === 'ArrowDown') this.move('south');
    else if (e.code === 'KeyE' || e.code === 'ArrowRight') this.move('east');
    else if (e.code === 'KeyW' || e.code === 'ArrowLeft') this.move('west');
    else if (e.code === 'KeyA' || e.code === 'Space') this.attack();
    else if (e.code === 'KeyH') this.hack();
    else if (e.code === 'KeyR') this.heal();
  }

  handleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    // Movement & action buttons on right side
    // Action grid in [700..960, 320..530]
    if (mx >= 780 && mx <= 880 && my >= 330 && my <= 375) this.move('north');
    if (mx >= 780 && mx <= 880 && my >= 435 && my <= 480) this.move('south');
    if (mx >= 720 && mx <= 800 && my >= 385 && my <= 430) this.move('west');
    if (mx >= 860 && mx <= 940 && my >= 385 && my <= 430) this.move('east');

    // Action commands
    if (mx >= 710 && mx <= 820 && my >= 490 && my <= 535) this.attack();
    if (mx >= 835 && mx <= 950 && my >= 490 && my <= 535) this.hack();

    // Fast heal / stim
    if (mx >= 520 && mx <= 670 && my >= 490 && my <= 535) this.heal();
  }

  move(dir) {
    const room = this.rooms[this.currentRoom];
    if (room.dirs && room.dirs[dir]) {
      this.currentRoom = room.dirs[dir];
      const nextRoom = this.rooms[this.currentRoom];
      this.addLog(`>> NAVIGATE: Moving ${dir.toUpperCase()} into ${nextRoom.name}.`);
    } else {
      this.addLog(`>> BLOCKED: No pathway towards the ${dir}.`);
    }
  }

  attack() {
    const room = this.rooms[this.currentRoom];
    if (!room.enemy || room.enemy.hp <= 0) {
      this.addLog('>> COMBAT: Area secure. No hostile combatants in range.');
      return;
    }

    const enemy = room.enemy;
    const dmg = 20 + Math.floor(Math.random() * 15);
    enemy.hp = Math.max(0, enemy.hp - dmg);
    this.addLog(`>> ATTACK: You fired plasma burst at ${enemy.name} for ${dmg} DMG!`);

    if (enemy.hp <= 0) {
      this.addLog(`>> VICTORY: ${enemy.name} destroyed! Gained +${enemy.exp} XP, +$60.`);
      this.player.xp += enemy.exp;
      this.player.credits += 60;
      if (this.player.xp >= 150 * this.player.level) {
        this.player.level++;
        this.player.maxHp += 20;
        this.player.hp = this.player.maxHp;
        this.addLog(`>> LEVEL UP! Reached Operative Rank ${this.player.level}!`);
      }
      room.enemy = null;
    } else {
      // Enemy counter attacks
      const eDmg = Math.floor(enemy.attack * (0.7 + Math.random() * 0.6));
      this.player.hp = Math.max(0, this.player.hp - eDmg);
      this.addLog(`>> HIT: ${enemy.name} retaliated for ${eDmg} DMG!`);
      if (this.player.hp <= 0) {
        this.addLog(`>> CRITICAL: Systems crashed! Nanites revived you at Cyber Alley.`);
        this.player.hp = 50;
        this.currentRoom = 'cyber_alley';
      }
    }
  }

  hack() {
    const room = this.rooms[this.currentRoom];
    if (!room.hackable) {
      this.addLog('>> HACK: No cyber terminal detected in this node.');
      return;
    }
    if (room.hacked) {
      this.addLog('>> HACK: Terminal node already breached and bypassed.');
      return;
    }
    if (this.player.energy < 20) {
      this.addLog('>> ENERGY LOW: Need 20 Cyber-Energy to breach ice.');
      return;
    }

    this.player.energy -= 20;
    room.hacked = true;
    const creds = 50 + Math.floor(Math.random() * 50);
    this.player.credits += creds;
    this.addLog(`>> BREACH SUCCESS: Security protocols disabled! Extracted +$${creds} credits!`);
  }

  heal() {
    if (this.player.nanites > 0) {
      this.player.nanites--;
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 45);
      this.player.energy = Math.min(this.player.maxEnergy, this.player.energy + 30);
      this.addLog('>> MED-KIT: Injected Nanite stim! Restored +45 HP, +30 Energy.');
    } else if (this.player.credits >= 40) {
      this.player.credits -= 40;
      this.player.nanites++;
      this.addLog('>> PURCHASE: Bought 1x Nanite Stim Injector for $40.');
    } else {
      this.addLog('>> INVENTORY: Out of Nanite stims and insufficient credits.');
    }
  }

  onUpdate(dt) {
    // Energy regen
    this.player.energy = Math.min(this.player.maxEnergy, this.player.energy + dt * 2);
  }

  onRender(ctx) {
    ctx.fillStyle = '#050811';
    ctx.fillRect(0, 0, 1000, 562);

    // Terminal scanline effect
    ctx.fillStyle = 'rgba(6, 182, 212, 0.03)';
    for (let y = 0; y < 562; y += 4) {
      ctx.fillRect(0, y, 1000, 2);
    }

    // Top Header Banner
    ctx.fillStyle = '#0b1329';
    ctx.fillRect(0, 0, 1000, 65);
    ctx.strokeStyle = '#1e293b';
    ctx.strokeRect(0, 0, 1000, 65);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 20px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('💻 LEGENDS OF FUTURE PAST [NEO-MUD v4.1]', 30, 38);

    // Player Status bar (top right)
    ctx.fillStyle = '#10b981';
    ctx.font = '13px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`LVL: ${this.player.level}  XP: ${this.player.xp}  CREDITS: $${this.player.credits}`, 970, 38);

    // Left Panel: Terminal & Story Logs
    ctx.fillStyle = '#0a101f';
    ctx.fillRect(25, 80, 660, 395);
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(25, 80, 660, 395);

    // Current room details
    const room = this.rooms[this.currentRoom];
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 16px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`LOCATION: ${room.name}`, 40, 110);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '13px "Courier New", monospace';
    ctx.fillText(room.desc, 40, 135);

    // Active threat or terminal
    if (room.enemy) {
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 14px "Courier New", monospace';
      ctx.fillText(`[HOSTILE DETECTED] ${room.enemy.name} (HP: ${room.enemy.hp}/${room.enemy.maxHp})`, 40, 165);
    } else if (room.hackable) {
      ctx.fillStyle = room.hacked ? '#10b981' : '#06b6d4';
      ctx.font = '13px "Courier New", monospace';
      ctx.fillText(`[DATA-PORT] Security Terminal ${room.hacked ? 'ALREADY BREACHED' : 'ONLINE - PRESS HACK'}`, 40, 165);
    }

    // Story Output Log
    ctx.fillStyle = '#334155';
    ctx.fillRect(40, 185, 630, 2);

    const logStartY = 210;
    const recentLogs = this.log.slice(-10);
    recentLogs.forEach((line, i) => {
      ctx.fillStyle = line.startsWith('>>') ? '#38bdf8' : (line.includes('VICTORY') ? '#10b981' : (line.includes('HIT') || line.includes('CRITICAL') ? '#f43f5e' : '#94a3b8'));
      ctx.font = '12px "Courier New", monospace';
      ctx.fillText(line, 45, logStartY + i * 25);
    });

    // Right Panel: Radar Map & Navigation Controls
    ctx.fillStyle = '#0a101f';
    ctx.fillRect(700, 80, 275, 395);
    ctx.strokeStyle = '#1e3a8a';
    ctx.strokeRect(700, 80, 275, 395);

    // Vitals
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('OPERATIVE VITALS', 715, 105);

    // HP Bar
    ctx.fillStyle = '#334155';
    ctx.fillRect(715, 120, 245, 14);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(715, 120, (this.player.hp / this.player.maxHp) * 245, 14);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px monospace';
    ctx.fillText(`HP: ${this.player.hp}/${this.player.maxHp}`, 720, 131);

    // Energy Bar
    ctx.fillStyle = '#334155';
    ctx.fillRect(715, 142, 245, 14);
    ctx.fillStyle = '#06b6d4';
    ctx.fillRect(715, 142, (this.player.energy / this.player.maxEnergy) * 245, 14);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`ENERGY: ${Math.round(this.player.energy)}/${this.player.maxEnergy}`, 720, 153);

    // Nanites
    ctx.fillStyle = '#a855f7';
    ctx.font = '12px monospace';
    ctx.fillText(`NANITE STIMS: ${this.player.nanites} remaining`, 715, 180);

    // Direction pad
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('NAVIGATION MATRIX', 837, 315);

    // North
    ctx.fillStyle = room.dirs && room.dirs.north ? '#3b82f6' : '#1e293b';
    ctx.fillRect(785, 330, 105, 42);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 12px monospace'; ctx.fillText('▲ NORTH', 837, 356);

    // South
    ctx.fillStyle = room.dirs && room.dirs.south ? '#3b82f6' : '#1e293b';
    ctx.fillRect(785, 435, 105, 42);
    ctx.fillStyle = '#ffffff'; ctx.fillText('▼ SOUTH', 837, 461);

    // West
    ctx.fillStyle = room.dirs && room.dirs.west ? '#3b82f6' : '#1e293b';
    ctx.fillRect(710, 385, 80, 42);
    ctx.fillStyle = '#ffffff'; ctx.fillText('◄ WEST', 750, 411);

    // East
    ctx.fillStyle = room.dirs && room.dirs.east ? '#3b82f6' : '#1e293b';
    ctx.fillRect(875, 385, 80, 42);
    ctx.fillStyle = '#ffffff'; ctx.fillText('EAST ►', 915, 411);

    // Bottom Action Command Buttons
    // Med / Stim
    ctx.fillStyle = '#10b981';
    ctx.fillRect(520, 490, 150, 45);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('💉 STIM HEAL (R)', 595, 518);

    // Attack
    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(710, 490, 115, 45);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('⚔️ ATTACK (A)', 767, 518);

    // Hack
    ctx.fillStyle = '#06b6d4';
    ctx.fillRect(840, 490, 115, 45);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('⚡ HACK (H)', 897, 518);

    // Key hint on bottom left
    ctx.fillStyle = '#64748b';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('KEYS: Arrow keys/WASD to Move | [A] Attack | [H] Hack Node | [R] Inject Stim', 30, 520);
  }
}
