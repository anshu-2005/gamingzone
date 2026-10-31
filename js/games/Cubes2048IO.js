/* ====================================================
   CUBES 2048 IO — GAMINGZONE
   Multiplayer Slither-Snake 2048 Merge Arena
   - Steer your Numbered Snake across a Massive Infinite Arena
   - Eat Floating Cubes (2, 4, 8) & Merge Adjacent Matches (2+2=4, 4+4=8... 2048!)
   - Devour Smaller Opponents & Beware of Giant AI Snakes
   - Sprint Speed-Boost (Spacebar / Click / Touch Hold)
   - Real-Time Dynamic Leaderboard & Minimap Radar
   - Touch Virtual Joystick & Mouse/Keyboard Navigation
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class Cubes2048IOGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Cubes 2048 IO',
      targetScore: 20480,
      lives: 1,
      ...config
    });

    this.createCanvas(860, 540);

    // Arena Dimensions
    this.worldWidth = 3200;
    this.worldHeight = 3200;

    // Camera
    this.cameraX = 0;
    this.cameraY = 0;

    // Palette for 2048 Powers
    this.cubeColors = {
      2: '#3b82f6',
      4: '#06b6d4',
      8: '#10b981',
      16: '#84cc16',
      32: '#eab308',
      64: '#f97316',
      128: '#ef4444',
      256: '#ec4899',
      512: '#a855f7',
      1024: '#8b5cf6',
      2048: '#fbbf24',
      4096: '#f43f5e'
    };

    // Player Snake
    this.player = {
      name: 'You',
      cubes: [2, 2, 4],
      x: 1600,
      y: 1600,
      vx: 0,
      vy: 0,
      angle: 0,
      speed: 4.2,
      isBoosting: false,
      history: []
    };

    this.bots = [];
    this.freeCubes = [];
    this.particles = [];
    this.mouse = { x: 430, y: 270, active: false };

    this.initControls();
    this.initWorld();

    this.attachTouchControls({
      showDpad: true,
      onDirection: (dir, pressed) => {
        if (!pressed) return;
        const angleMap = { UP: -Math.PI / 2, DOWN: Math.PI / 2, LEFT: Math.PI, RIGHT: 0 };
        if (angleMap[dir] !== undefined) {
          this.player.angle = angleMap[dir];
        }
      },
      onAction: () => {
        this.player.isBoosting = true;
        setTimeout(() => { this.player.isBoosting = false; }, 400);
      }
    });

    this.showStartCard({
      title: 'CUBES 2048 IO',
      icon: '🧊',
      objective: 'Slither and absorb cubes to grow! Merge identical adjacent numbers into 2048. Eat smaller snakes and conquer the leaderboard.',
      controls: 'Mouse / Arrow Keys / WASD to Steer • Hold Spacebar / Click to Sprint.',
      onStart: () => {
        this.initWorld();
        this.start();
      }
    });
  }

  initControls() {
    this.addEventListenerTracked(window, 'mousemove', (e) => {
      if (!this.canvas) return;
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
      this.mouse.active = true;
    });

    this.addEventListenerTracked(window, 'mousedown', () => {
      this.player.isBoosting = true;
    });

    this.addEventListenerTracked(window, 'mouseup', () => {
      this.player.isBoosting = false;
    });

    this.addEventListenerTracked(window, 'keydown', (e) => {
      if (e.code === 'Space') this.player.isBoosting = true;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') this.player.angle = -Math.PI / 2;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') this.player.angle = Math.PI / 2;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.player.angle = Math.PI;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.player.angle = 0;
    });

    this.addEventListenerTracked(window, 'keyup', (e) => {
      if (e.code === 'Space') this.player.isBoosting = false;
    });
  }

  initWorld() {
    this.player.x = 1600;
    this.player.y = 1600;
    this.player.cubes = [4, 2, 2];
    this.player.history = [];
    this.score = 8;

    // Spawn 140 Free Floating Cubes across Arena
    this.freeCubes = [];
    const values = [2, 2, 2, 4, 4, 8, 16];
    for (let i = 0; i < 140; i++) {
      this.freeCubes.push({
        x: Math.random() * (this.worldWidth - 200) + 100,
        y: Math.random() * (this.worldHeight - 200) + 100,
        val: values[Math.floor(Math.random() * values.length)],
        radius: 16
      });
    }

    // Spawn 8 AI Bot Snakes
    this.bots = [];
    const botNames = ['ApexCube', 'NeonViper', 'BlockMaster', 'CyberSnake', 'Shadow2048', 'NovaByte', 'VoxelBeast', 'TitanMerge'];
    for (let i = 0; i < botNames.length; i++) {
      this.bots.push({
        name: botNames[i],
        cubes: [Math.pow(2, Math.floor(Math.random() * 4) + 2), 4, 2],
        x: Math.random() * (this.worldWidth - 400) + 200,
        y: Math.random() * (this.worldHeight - 400) + 200,
        angle: Math.random() * Math.PI * 2,
        speed: 3.6,
        history: [],
        aiTurnTimer: 0
      });
    }
  }

  update() {
    if (this.state !== GameState.PLAYING) return;

    // 1. Update Player Movement
    if (this.mouse.active) {
      const centerX = this.width / 2;
      const centerY = this.height / 2;
      const dx = this.mouse.x - centerX;
      const dy = this.mouse.y - centerY;
      if (Math.hypot(dx, dy) > 20) {
        this.player.angle = Math.atan2(dy, dx);
      }
    }

    const currentSpeed = this.player.isBoosting ? 6.8 : this.player.speed;
    this.player.x += Math.cos(this.player.angle) * currentSpeed;
    this.player.y += Math.sin(this.player.angle) * currentSpeed;

    // World Boundary Clamping
    this.player.x = Math.max(50, Math.min(this.worldWidth - 50, this.player.x));
    this.player.y = Math.max(50, Math.min(this.worldHeight - 50, this.player.y));

    // Save Position History for Snake Body Slithering
    this.player.history.unshift({ x: this.player.x, y: this.player.y });
    const maxHistory = (this.player.cubes.length + 1) * 8;
    if (this.player.history.length > maxHistory) this.player.history.pop();

    // Camera follow player
    this.cameraX = this.player.x - this.width / 2;
    this.cameraY = this.player.y - this.height / 2;

    // 2. Player Eats Free Cubes
    for (let i = this.freeCubes.length - 1; i >= 0; i--) {
      const fc = this.freeCubes[i];
      if (Math.hypot(this.player.x - fc.x, this.player.y - fc.y) < 32) {
        sounds.playSuccess();
        this.player.cubes.push(fc.val);
        this.score += fc.val;
        this.mergeSnakeCubes(this.player);

        // Respawn free cube elsewhere
        fc.x = Math.random() * (this.worldWidth - 200) + 100;
        fc.y = Math.random() * (this.worldHeight - 200) + 100;
      }
    }

    // 3. Update AI Bots
    this.bots.forEach((bot) => {
      bot.aiTurnTimer++;
      if (bot.aiTurnTimer > 40) {
        bot.aiTurnTimer = 0;
        // Turn towards nearest free cube
        let nearest = null;
        let minDist = 300;
        for (const fc of this.freeCubes) {
          const d = Math.hypot(bot.x - fc.x, bot.y - fc.y);
          if (d < minDist) {
            minDist = d;
            nearest = fc;
          }
        }
        if (nearest) {
          bot.angle = Math.atan2(nearest.y - bot.y, nearest.x - bot.x);
        } else {
          bot.angle += (Math.random() - 0.5) * 1.2;
        }
      }

      bot.x += Math.cos(bot.angle) * bot.speed;
      bot.y += Math.sin(bot.angle) * bot.speed;
      bot.x = Math.max(50, Math.min(this.worldWidth - 50, bot.x));
      bot.y = Math.max(50, Math.min(this.worldHeight - 50, bot.y));

      bot.history.unshift({ x: bot.x, y: bot.y });
      if (bot.history.length > (bot.cubes.length + 1) * 8) bot.history.pop();

      // Bot eats free cubes
      for (const fc of this.freeCubes) {
        if (Math.hypot(bot.x - fc.x, bot.y - fc.y) < 28) {
          bot.cubes.push(fc.val);
          this.mergeSnakeCubes(bot);
          fc.x = Math.random() * (this.worldWidth - 200) + 100;
          fc.y = Math.random() * (this.worldHeight - 200) + 100;
        }
      }
    });

    // 4. Snake vs Snake Devour Battles
    for (let i = this.bots.length - 1; i >= 0; i--) {
      const bot = this.bots[i];
      const dist = Math.hypot(this.player.x - bot.x, this.player.y - bot.y);

      if (dist < 40) {
        const playerMax = Math.max(...this.player.cubes);
        const botMax = Math.max(...bot.cubes);

        if (playerMax >= botMax) {
          // Player Devours Bot!
          sounds.playWin();
          this.score += botMax * 2;
          this.player.cubes.push(...bot.cubes.slice(0, 3));
          this.mergeSnakeCubes(this.player);

          // Explode particles
          for (let p = 0; p < 25; p++) {
            this.particles.push({
              x: bot.x,
              y: bot.y,
              vx: (Math.random() - 0.5) * 10,
              vy: (Math.random() - 0.5) * 10,
              radius: Math.random() * 5 + 3,
              color: '#3b82f6',
              life: 30
            });
          }

          // Respawn Bot
          bot.x = Math.random() * (this.worldWidth - 400) + 200;
          bot.y = Math.random() * (this.worldHeight - 400) + 200;
          bot.cubes = [4, 2, 2];
        } else {
          // Bot Devours Player -> Game Over!
          sounds.playExplosion();
          this.gameOver(this.score, { highestCube: playerMax });
          return;
        }
      }
    }

    // 5. Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  mergeSnakeCubes(snake) {
    // 2048 Adjacent Merger
    let merged = true;
    while (merged) {
      merged = false;
      for (let i = 0; i < snake.cubes.length - 1; i++) {
        if (snake.cubes[i] === snake.cubes[i + 1]) {
          sounds.playLaser();
          snake.cubes[i] *= 2;
          snake.cubes.splice(i + 1, 1);
          merged = true;
          break;
        }
      }
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    ctx.save();
    ctx.translate(-this.cameraX, -this.cameraY);

    // 1. Futuristic Grid Floor
    ctx.fillStyle = '#0a0f1d';
    ctx.fillRect(0, 0, this.worldWidth, this.worldHeight);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    const gridSize = 80;
    const startX = Math.floor(Math.max(0, this.cameraX) / gridSize) * gridSize;
    const endX = Math.min(this.worldWidth, startX + this.width + gridSize * 2);
    const startY = Math.floor(Math.max(0, this.cameraY) / gridSize) * gridSize;
    const endY = Math.min(this.worldHeight, startY + this.height + gridSize * 2);

    for (let x = startX; x <= endX; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }
    for (let y = startY; y <= endY; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }

    // Arena Perimeter Glow
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 6;
    ctx.strokeRect(0, 0, this.worldWidth, this.worldHeight);

    // 2. Render Free Floating Cubes
    this.freeCubes.forEach((fc) => {
      if (fc.x < this.cameraX - 50 || fc.x > this.cameraX + this.width + 50 ||
          fc.y < this.cameraY - 50 || fc.y > this.cameraY + this.height + 50) return;
      this.draw3DCube(ctx, fc.x, fc.y, fc.val, 16);
    });

    // 3. Render AI Bots
    this.bots.forEach((bot) => {
      this.drawSnake(ctx, bot, '#94a3b8');
    });

    // 4. Render Player Snake
    this.drawSnake(ctx, this.player, '#00e5ff');

    // 5. Render Particles
    this.particles.forEach((p) => {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();

    // 6. HUD, Leaderboard & Radar
    this.renderHUD(ctx);
  }

  drawSnake(ctx, snake, nameColor) {
    const spacing = 8;
    for (let i = snake.cubes.length - 1; i >= 0; i--) {
      const histIdx = i * spacing;
      const pos = snake.history[histIdx] || { x: snake.x, y: snake.y };
      const val = snake.cubes[i];
      this.draw3DCube(ctx, pos.x, pos.y, val, 22);
    }

    // Snake Gamer Name
    ctx.fillStyle = nameColor;
    ctx.font = 'bold 13px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(snake.name, snake.x, snake.y - 32);
  }

  draw3DCube(ctx, x, y, val, size) {
    const color = this.cubeColors[val] || '#f43f5e';

    ctx.save();
    ctx.translate(x, y);

    // 3D Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(-size + 3, -size + 5, size * 2, size * 2);

    // Cube Front Face
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(-size, -size, size * 2, size * 2, 6);
    ctx.fill();

    // 3D Bevel Top Glare
    ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.fillRect(-size + 2, -size + 2, size * 2 - 4, size * 0.7);

    // Number
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${size > 18 ? 16 : 11}px Outfit, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(val.toString(), 0, 0);

    ctx.restore();
  }

  renderHUD(ctx) {
    // Top Score & Highest Cube
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.fillRect(20, 20, 260, 56);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.strokeRect(20, 20, 260, 56);

    const maxCube = Math.max(...this.player.cubes);
    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 22px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${this.score.toLocaleString()}`, 34, 48);
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 12px Outfit, sans-serif';
    ctx.fillText(`TOP CUBE: [${maxCube}] • CUBES: ${this.player.cubes.length}`, 34, 66);

    // Leaderboard (Top Right)
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.fillRect(this.width - 210, 20, 190, 150);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.strokeRect(this.width - 210, 20, 190, 150);

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 13px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('👑 ARENA LEADERBOARD', this.width - 198, 42);

    const allSnakes = [this.player, ...this.bots]
      .map(s => ({ name: s.name, max: Math.max(...s.cubes) }))
      .sort((a, b) => b.max - a.max)
      .slice(0, 5);

    allSnakes.forEach((s, idx) => {
      ctx.fillStyle = s.name === 'You' ? '#00e5ff' : '#cbd5e1';
      ctx.font = `${s.name === 'You' ? 'bold' : 'normal'} 12px Outfit, sans-serif`;
      ctx.fillText(`${idx + 1}. ${s.name}`, this.width - 198, 68 + idx * 20);
      ctx.textAlign = 'right';
      ctx.fillText(`${s.max}`, this.width - 32, 68 + idx * 20);
      ctx.textAlign = 'left';
    });

    // Minimap Radar (Bottom Right)
    const mapSize = 90;
    const mapX = this.width - mapSize - 20;
    const mapY = this.height - mapSize - 20;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(mapX, mapY, mapSize, mapSize);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.strokeRect(mapX, mapY, mapSize, mapSize);

    // Player blip
    const pBlipX = mapX + (this.player.x / this.worldWidth) * mapSize;
    const pBlipY = mapY + (this.player.y / this.worldHeight) * mapSize;
    ctx.fillStyle = '#00e5ff';
    ctx.beginPath();
    ctx.arc(pBlipX, pBlipY, 3, 0, Math.PI * 2);
    ctx.fill();

    // Bots blips
    ctx.fillStyle = '#f43f5e';
    this.bots.forEach(b => {
      const bx = mapX + (b.x / this.worldWidth) * mapSize;
      const by = mapY + (b.y / this.worldHeight) * mapSize;
      ctx.fillRect(bx - 1, by - 1, 2, 2);
    });
  }
}

