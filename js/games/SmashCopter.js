import { GameEngineBase } from '../core/GameEngineBase.js';

export class SmashCopter extends GameEngineBase {
  constructor(container, options = {}) {
    super(container, {
      ...options,
      aspectRatio: 16 / 9,
      baseWidth: 1000,
      baseHeight: 562
    });

    this.title = 'Smash Copter: Falling Hazard';
    this.score = 0;
    this.timeSurvived = 0;
    this.gameOver = false;

    this.player = {
      x: 500,
      y: 470,
      vx: 0,
      vy: 0,
      speed: 260,
      w: 22,
      h: 30,
      isGrounded: true
    };

    this.keys = { left: false, right: false, jump: false };
    this.fallingObjects = [];
    this.copter = { x: 500, bladeAngle: 0, vx: 180 };
    this.spawnTimer = 0.8;
  }

  onInit() {
    this.createCanvas();

    this.addEventListenerTracked(window, 'keydown', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = true;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = true;
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        if (this.player.isGrounded) {
          this.player.vy = -360;
          this.player.isGrounded = false;
        }
      }
    });

    this.addEventListenerTracked(window, 'keyup', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = false;
    });

    this.addEventListenerTracked(this.canvas, 'click', () => {
      if (this.gameOver) this.restart();
    });

    this.showStartCard(
      'SMASH COPTER HAZARD',
      'The viral Counter-Strike Smash Copter survival challenge! A giant attack helicopter hovers overhead dropping crates, wrecking balls, and missile debris. Dodge with [A/D or Arrows] and jump with [Space]!',
      'SURVIVE THE COPTER'
    );
  }

  restart() {
    this.score = 0;
    this.timeSurvived = 0;
    this.gameOver = false;
    this.player.x = 500;
    this.player.y = 470;
    this.player.vx = 0;
    this.player.vy = 0;
    this.fallingObjects = [];
    this.spawnTimer = 0.8;
  }

  onUpdate(dt) {
    if (this.gameOver) return;

    this.timeSurvived += dt;
    this.score += Math.round(dt * 25);

    // Copter patrol
    this.copter.x += this.copter.vx * dt;
    if (this.copter.x < 150 || this.copter.x > 850) this.copter.vx *= -1;
    this.copter.bladeAngle += dt * 25;

    // Player horizontal
    if (this.keys.left) this.player.vx = -this.player.speed;
    else if (this.keys.right) this.player.vx = this.player.speed;
    else this.player.vx = 0;

    // Gravity
    this.player.vy += 850 * dt;
    this.player.x += this.player.vx * dt;
    this.player.y += this.player.vy * dt;

    // Floor collision
    const floorY = 480;
    if (this.player.y >= floorY) {
      this.player.y = floorY;
      this.player.vy = 0;
      this.player.isGrounded = true;
    }

    this.player.x = Math.max(50, Math.min(950, this.player.x));

    // Drop hazard objects
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = Math.max(0.4, 1.4 - this.timeSurvived * 0.02);
      const isBall = Math.random() < 0.4;
      this.fallingObjects.push({
        x: this.copter.x + (Math.random() - 0.5) * 60,
        y: 110,
        vy: 240 + Math.random() * 180,
        radius: isBall ? 22 : 16,
        isBall,
        color: isBall ? '#3b82f6' : '#ef4444'
      });
    }

    // Update falling objects
    for (let i = this.fallingObjects.length - 1; i >= 0; i--) {
      const obj = this.fallingObjects[i];
      obj.y += obj.vy * dt;

      // Hit player
      if (Math.hypot(this.player.x - obj.x, this.player.y - obj.y) < (obj.radius + 14)) {
        this.gameOver = true;
        break;
      }

      if (obj.y > 520) {
        this.fallingObjects.splice(i, 1);
      }
    }
  }

  onRender(ctx) {
    // Sky Rooftop Background
    const sky = ctx.createLinearGradient(0, 0, 0, 562);
    sky.addColorStop(0, '#0c4a6e');
    sky.addColorStop(1, '#082f49');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 1000, 562);

    // City Skyline silhouettes
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(40, 360, 80, 140);
    ctx.fillRect(160, 310, 120, 190);
    ctx.fillRect(320, 380, 90, 120);
    ctx.fillRect(450, 290, 110, 210);
    ctx.fillRect(600, 340, 130, 160);
    ctx.fillRect(780, 320, 140, 180);

    // Rooftop Arena Floor
    ctx.fillStyle = '#334155';
    ctx.fillRect(30, 495, 940, 67);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 4;
    ctx.strokeRect(30, 495, 940, 67);

    // Top Hovering Smash Copter
    ctx.save();
    ctx.translate(this.copter.x, 90);

    // Copter Body
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.ellipse(0, 0, 45, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cockpit
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.ellipse(25, -2, 16, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Tail boom
    ctx.fillStyle = '#334155';
    ctx.fillRect(-65, -4, 40, 8);
    // Tail rotor
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-68, -12, 4, 24);

    // Main Rotor Blades
    ctx.save();
    ctx.translate(0, -22);
    ctx.rotate(this.copter.bladeAngle);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(-75, -3, 150, 6);
    ctx.restore();

    ctx.restore();

    // Falling Objects
    for (const obj of this.fallingObjects) {
      ctx.fillStyle = obj.color;
      ctx.beginPath();
      ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Player Hero
    if (!this.gameOver) {
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.roundRect(this.player.x - this.player.w / 2, this.player.y - this.player.h, this.player.w, this.player.h, 4);
      ctx.fill();
      // Eyes
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(this.player.x + (this.player.vx >= 0 ? 2 : -4), this.player.y - this.player.h + 6, 4, 4);
    }

    // Top Header
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 1000, 58);
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🚁 SMASH COPTER HAZARD', 30, 38);

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`SCORE: ${this.score}  |  SURVIVED: ${Math.floor(this.timeSurvived)}s`, 970, 38);

    // Game Over
    if (this.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, 1000, 562);

      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 44px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SMASHED!', 500, 240);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px monospace';
      ctx.fillText(`SURVIVAL TIME: ${this.timeSurvived.toFixed(1)}s`, 500, 290);

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.roundRect(400, 330, 200, 50, 8);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('SURVIVE AGAIN', 500, 362);
    }
  }
}

