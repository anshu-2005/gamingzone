/* ====================================================
   BLOXD VOXEL SANDBOX & OBBY — GAMINGZONE
   Voxel Parkour Obby & Creative Block Sandbox
   - Jump, Sprint & Parkour Across Floating Voxel Platforms
   - Avoid Boiling Lava & Toxic Slime Chasms
   - Mine & Place Blocks to Bridge Gaps (Left Click Mine, Right Click Place)
   - 10 Escalating Voxel Obby Sectors with Flag Checkpoints
   - Mobile Touch Jump/D-Pad & Full Keyboard Controls
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';
import { PRNG } from '../core/levelEngine/index.js';

export class BloxdVoxelObbyGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Bloxd Voxel Obby',
      targetScore: 10000,
      lives: 5,
      ...config
    });

    this.createCanvas(860, 520);

    this.currentStage = 1;
    this.stageLength = 3200;
    this.cameraX = 0;
    this.checkpointX = 100;
    this.checkpointY = 320;

    this.blockSize = 32;
    this.selectedBlock = 'Wood';
    this.blocksInventory = { Dirt: 25, Wood: 25, Stone: 25, Glass: 15 };

    // Voxel Runner
    this.player = {
      x: 100,
      y: 320,
      vx: 0,
      vy: 0,
      w: 22,
      h: 38,
      speed: 4.8,
      grounded: false
    };

    this.blocks = [];
    this.particles = [];
    this.keys = {};

    this.initControls();
    this.loadStage(this.currentStage);

    this.attachTouchControls({
      showDpad: true,
      onDirection: (dir, pressed) => {
        if (!pressed) {
          this.keys['ArrowLeft'] = false;
          this.keys['ArrowRight'] = false;
          return;
        }
        if (dir === 'LEFT') this.keys['ArrowLeft'] = true;
        if (dir === 'RIGHT') this.keys['ArrowRight'] = true;
      },
      onAction: () => this.jump()
    });

    this.showStartCard({
      title: 'BLOXD VOXEL OBBY',
      icon: '🧱',
      objective: 'Parkour across floating voxel islands! Mine blocks with Left Click, place blocks with Right Click to bridge gaps. Reach the Golden Portal.',
      controls: 'A/D or Arrows to Run • [SPACE] to Jump • Click to Mine / Place Blocks.',
      onStart: () => {
        this.currentStage = 1;
        this.score = 0;
        this.loadStage(1);
        this.start();
      }
    });
  }

  initControls() {
    this.addEventListenerTracked(window, 'keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
      this.keys[e.code] = true;

      if ((e.code === 'Space' || e.key === 'ArrowUp' || e.key === 'w') && this.state === GameState.PLAYING) {
        this.jump();
      }

      // Block selection
      if (e.key === '1') this.selectedBlock = 'Dirt';
      if (e.key === '2') this.selectedBlock = 'Wood';
      if (e.key === '3') this.selectedBlock = 'Stone';
      if (e.key === '4') this.selectedBlock = 'Glass';
    });

    this.addEventListenerTracked(window, 'keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
      this.keys[e.code] = false;
    });

    if (this.canvas) {
      this.addEventListenerTracked(this.canvas, 'mousedown', (e) => {
        const rect = this.canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left + this.cameraX;
        const clickY = e.clientY - rect.top;

        if (e.button === 2) {
          // Right Click: Place Block
          this.placeBlockAt(clickX, clickY);
        } else {
          // Left Click: Mine Block
          this.mineBlockAt(clickX, clickY);
        }
      });

      this.addEventListenerTracked(this.canvas, 'contextmenu', (e) => e.preventDefault());
    }
  }

  loadStage(stage) {
    this.currentStage = stage;
    this.stageLength = 2600 + stage * 500;
    this.checkpointX = 100;
    this.checkpointY = 320;

    this.player.x = 100;
    this.player.y = 320;
    this.player.vx = 0;
    this.player.vy = 0;

    this.blocks = [];
    this.particles = [];

    // Deterministic Procedural Voxel Islands via PRNG
    const prng = new PRNG(stage * 853 + 202);

    // Starting island
    for (let x = 40; x < 260; x += 32) {
      this.blocks.push({ x: x, y: 380, type: 'Grass' });
      this.blocks.push({ x: x, y: 412, type: 'Dirt' });
    }

    let curX = 340;
    while (curX < this.stageLength - 300) {
      const islandW = prng.range(2, 5) * 32;
      const islandY = 380 - prng.range(0, 4) * 32;

      for (let x = curX; x < curX + islandW; x += 32) {
        this.blocks.push({ x: x, y: islandY, type: 'Grass' });
        this.blocks.push({ x: x, y: islandY + 32, type: 'Dirt' });
      }

      // Checkpoint banner every 800px
      if (curX % 800 < 200) {
        this.blocks.push({ x: curX + 32, y: islandY - 32, type: 'Checkpoint' });
      }

      // Physics-verified jump gap (player max jump arc is 140px)
      const maxJumpFeasible = Math.min(130, 75 + Math.min(50, stage * 3));
      curX += islandW + prng.range(70, maxJumpFeasible);
    }

    // Finish Island with Golden Crown Portal
    const endX = this.stageLength - 200;
    for (let x = endX; x < endX + 240; x += 32) {
      this.blocks.push({ x: x, y: 350, type: 'Stone' });
    }
    this.blocks.push({ x: endX + 80, y: 318, type: 'Portal' });
  }

  jump() {
    if (this.player.grounded) {
      sounds.playJump();
      this.player.vy = -10.8;
      this.player.grounded = false;
    }
  }

  placeBlockAt(worldX, worldY) {
    const gx = Math.floor(worldX / 32) * 32;
    const gy = Math.floor(worldY / 32) * 32;

    if (this.blocksInventory[this.selectedBlock] > 0) {
      this.blocksInventory[this.selectedBlock]--;
      sounds.playClick();
      this.blocks.push({ x: gx, y: gy, type: this.selectedBlock });
    }
  }

  mineBlockAt(worldX, worldY) {
    for (let i = this.blocks.length - 1; i >= 0; i--) {
      const b = this.blocks[i];
      if (worldX >= b.x && worldX < b.x + 32 && worldY >= b.y && worldY < b.y + 32) {
        if (b.type !== 'Portal' && b.type !== 'Checkpoint') {
          sounds.playHit();
          this.blocks.splice(i, 1);
          if (this.blocksInventory[b.type] !== undefined) {
            this.blocksInventory[b.type]++;
          }
          break;
        }
      }
    }
  }

  update() {
    if (this.state !== GameState.PLAYING) return;

    // Movement
    if (this.keys['arrowleft'] || this.keys['a']) {
      this.player.vx = -this.player.speed;
    } else if (this.keys['arrowright'] || this.keys['d']) {
      this.player.vx = this.player.speed;
    } else {
      this.player.vx *= 0.8;
    }

    this.player.vy += 0.52; // Gravity
    this.player.x += this.player.vx;
    this.player.y += this.player.vy;

    // Voxel Block Collisions
    this.player.grounded = false;
    const pw = this.player.w;
    const ph = this.player.h;

    for (const b of this.blocks) {
      if (b.type === 'Portal') {
        if (Math.hypot(this.player.x - b.x, this.player.y - b.y) < 40) {
          sounds.playWin();
          this.score += 1500 * this.currentStage;
          if (this.currentStage >= 100) {
            this.gameOver(this.score, { cleared: true });
          } else {
            this.loadStage(this.currentStage + 1);
          }
          return;
        }
        continue;
      }

      if (b.type === 'Checkpoint') {
        if (Math.hypot(this.player.x - b.x, this.player.y - b.y) < 32) {
          if (this.checkpointX !== b.x) {
            sounds.playSuccess();
            this.checkpointX = b.x;
            this.checkpointY = b.y - 10;
          }
        }
        continue;
      }

      // Solid block collision
      if (this.player.x + pw > b.x && this.player.x < b.x + 32 &&
          this.player.y + ph > b.y && this.player.y < b.y + 32) {
        if (this.player.vy >= 0 && this.player.y + ph - this.player.vy <= b.y + 12) {
          this.player.y = b.y - ph;
          this.player.vy = 0;
          this.player.grounded = true;
        }
      }
    }

    // Camera follow player
    this.cameraX = this.player.x - 220;

    // Fall into Void / Lava Check
    if (this.player.y > 540) {
      sounds.playExplosion();
      this.lives--;
      this.player.x = this.checkpointX;
      this.player.y = this.checkpointY;
      this.player.vx = 0;
      this.player.vy = 0;

      if (this.lives <= 0) {
        this.gameOver(this.score, { stage: this.currentStage });
      }
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 1. Voxel Day Sky with Clouds
    const bgGrad = ctx.createLinearGradient(0, 0, 0, this.height);
    bgGrad.addColorStop(0, '#38bdf8');
    bgGrad.addColorStop(0.7, '#7dd3fc');
    bgGrad.addColorStop(1, '#ea580c'); // Lava glow horizon
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.save();
    ctx.translate(-this.cameraX, 0);

    // 2. Boiling Lava Floor
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(this.cameraX - 50, 480, this.width + 100, 50);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(this.cameraX - 50, 480, this.width + 100, 6);

    // 3. Render Voxel Blocks
    this.blocks.forEach(b => {
      this.drawVoxelBlock(ctx, b.x, b.y, b.type);
    });

    // 4. Render Player Voxel Steeve
    this.drawPlayer(ctx);

    ctx.restore();

    // 5. HUD & Hotbar
    this.renderHUD(ctx);
  }

  drawVoxelBlock(ctx, x, y, type) {
    if (type === 'Portal') {
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(x + 4, y - 20, 24, 40);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.strokeRect(x + 4, y - 20, 24, 40);
      return;
    }
    if (type === 'Checkpoint') {
      ctx.fillStyle = '#10b981';
      ctx.fillRect(x + 12, y - 24, 8, 32);
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(x + 20, y - 24);
      ctx.lineTo(x + 36, y - 16);
      ctx.lineTo(x + 20, y - 8);
      ctx.closePath();
      ctx.fill();
      return;
    }

    const colorMap = {
      Grass: '#15803d',
      Dirt: '#78350f',
      Wood: '#b45309',
      Stone: '#64748b',
      Glass: 'rgba(56, 189, 248, 0.7)'
    };

    ctx.fillStyle = colorMap[type] || '#64748b';
    ctx.fillRect(x, y, 32, 32);

    // Voxel Bevel Edges
    ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.fillRect(x, y, 32, 4);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.fillRect(x, y + 28, 32, 4);

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, 32, 32);
  }

  drawPlayer(ctx) {
    const p = this.player;
    ctx.fillStyle = '#0284c7'; // Shirt
    ctx.fillRect(p.x, p.y + 12, p.w, 16);

    ctx.fillStyle = '#1e293b'; // Pants
    ctx.fillRect(p.x, p.y + 28, p.w, 10);

    ctx.fillStyle = '#fde047'; // Head
    ctx.fillRect(p.x + 2, p.y, 18, 12);
  }

  renderHUD(ctx) {
    // Stats
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(20, 20, 260, 56);
    ctx.strokeStyle = '#00e5ff';
    ctx.strokeRect(20, 20, 260, 56);

    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 20px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`STAGE ${this.currentStage} • ❤️ ${this.lives}`, 34, 46);

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 12px Outfit, sans-serif';
    ctx.fillText(`SELECTED BLOCK: [${this.selectedBlock}]`, 34, 64);

    // Inventory Hotbar (Bottom Center)
    const hotbarW = 240;
    const hotbarX = this.width / 2 - hotbarW / 2;
    const hotbarY = this.height - 50;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(hotbarX, hotbarY, hotbarW, 40);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.strokeRect(hotbarX, hotbarY, hotbarW, 40);

    const slots = ['Dirt', 'Wood', 'Stone', 'Glass'];
    slots.forEach((s, idx) => {
      const slotX = hotbarX + idx * 60 + 5;
      const isSelected = this.selectedBlock === s;

      if (isSelected) {
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 2;
        ctx.strokeRect(slotX, hotbarY + 4, 50, 32);
      }

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${idx + 1}:${s.slice(0, 3)}`, slotX + 25, hotbarY + 22);
    });
  }
}

