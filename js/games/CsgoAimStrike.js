/* ====================================================
   CS:GO AIM REFLEX & CASE STRIKE
   Inspired by shnlfriberg/csgofriberg (CSGO Aim Training & Skins)
   Tactical shooting range, target flicking, headshots, AK-47 recoil,
   and animated weapon skin case unboxing simulator!
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class CsgoAimStrikeGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'CS:GO Aim Reflex & Case Strike',
      targetScore: 4000,
      lives: 1,
      ...config
    });

    this.createCanvas(860, 520);

    this.mode = 'RANGE'; // 'RANGE' or 'CASE'
    this.ammo = 30;
    this.maxAmmo = 30;
    this.shotsFired = 0;
    this.targetsHit = 0;
    this.headshots = 0;
    this.timer = 60; // 60 seconds speed round
    this.targets = [];
    this.particles = [];
    this.floatingTexts = [];
    this.mouse = { x: 430, y: 260 };

    this.unboxedSkins = [];
    this.isUnboxing = false;

    this.spawnTarget();
    this.spawnTarget();
    this.initControls();

    this.attachTouchControls({
      onDirection: () => {},
      onAction: (pressed) => {
        if (pressed) this.fireShot();
      },
      actionLabel: '🎯 FIRE',
      showDpad: false
    });

    this.showStartCard({
      title: 'CS:GO AIM & CASE STRIKE',
      icon: '🎯',
      objective: 'Flick crosshairs to headshot spawn targets before they vanish, or spend bounty to unbox Covert Knife skins!',
      controls: 'Mouse to Aim • Left Click to Fire • R to Reload • C to Unbox Cases'
    });
  }

  spawnTarget() {
    this.targets.push({
      x: 100 + Math.random() * (this.baseWidth - 200),
      y: 100 + Math.random() * (this.baseHeight - 200),
      r: 24,
      life: 2.2 + Math.random() * 1.5,
      maxLife: 3.5
    });
  }

  initControls() {
    this.addEventListenerTracked(window, 'mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
    });

    this.addEventListenerTracked(window, 'keydown', (e) => {
      if (this.state !== GameState.PLAYING) return;
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        this.reload();
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        this.openCase();
      }
    });

    this.addEventListenerTracked(this.canvas, 'pointerdown', (e) => {
      if (this.state !== GameState.PLAYING) return;
      this.fireShot();
    });
  }

  fireShot() {
    if (this.ammo <= 0) {
      this.reload();
      return;
    }

    this.ammo--;
    this.shotsFired++;
    sounds.playHit?.();

    // Check hit target
    let hit = false;
    for (let i = this.targets.length - 1; i >= 0; i--) {
      const t = this.targets[i];
      const dist = Math.hypot(this.mouse.x - t.x, this.mouse.y - t.y);

      if (dist < t.r) {
        hit = true;
        this.targetsHit++;
        const isHeadshot = dist < t.r * 0.45;

        if (isHeadshot) {
          this.headshots++;
          this.score += 250;
          this.addFloatingText(t.x, t.y - 20, '💥 HEADSHOT! +250', '#fbbf24');
          sounds.playLevelUp?.();
        } else {
          this.score += 100;
          this.addFloatingText(t.x, t.y - 20, 'HIT +100', '#00e5ff');
          sounds.playScore?.();
        }

        // Sparks
        for (let p = 0; p < 8; p++) {
          this.particles.push({
            x: t.x,
            y: t.y,
            vx: (Math.random() - 0.5) * 160,
            vy: (Math.random() - 0.5) * 160,
            life: 0.3,
            maxLife: 0.3,
            color: isHeadshot ? '#fbbf24' : '#00e5ff',
            r: 3
          });
        }

        this.targets.splice(i, 1);
        this.spawnTarget();
        break;
      }
    }

    if (!hit) {
      // Miss bullet hole
      this.particles.push({
        x: this.mouse.x,
        y: this.mouse.y,
        vx: 0,
        vy: 0,
        life: 0.6,
        maxLife: 0.6,
        color: '#475569',
        r: 3
      });
    }
  }

  reload() {
    this.ammo = this.maxAmmo;
    sounds.playClick?.();
    this.addFloatingText(this.baseWidth / 2, this.baseHeight / 2, 'RELOADED (30/30)', '#fbbf24');
  }

  openCase() {
    if (this.score < 500) {
      this.addFloatingText(this.mouse.x, this.mouse.y - 20, 'NEED 500 SCORE TO UNBOX!', '#ef4444');
      sounds.playCrash?.();
      return;
    }

    this.score -= 500;
    sounds.playLevelUp?.();

    const skinTiers = [
      { name: 'AWP | Dragon Lore', rarity: 'Covert Gold ★', color: '#fbbf24' },
      { name: 'Karambit | Fade', rarity: 'Covert Knife ★', color: '#ec4899' },
      { name: 'AK-47 | Vulcan', rarity: 'Classified', color: '#ec4899' },
      { name: 'M4A4 | Howl', rarity: 'Contraband Red', color: '#ef4444' },
      { name: 'USP-S | Kill Confirmed', rarity: 'Covert', color: '#ef4444' },
      { name: 'Glock-18 | Water Elemental', rarity: 'Restricted', color: '#a855f7' }
    ];

    const skin = skinTiers[Math.floor(Math.random() * skinTiers.length)];
    this.unboxedSkins.unshift(skin);
    this.addFloatingText(this.baseWidth / 2, 220, `🎁 UNBOXED: ${skin.name} (${skin.rarity})!`, skin.color);
  }

  addFloatingText(x, y, text, color = '#fff') {
    this.floatingTexts.push({ x, y, text, color, life: 1.0, maxLife: 1.0 });
  }

  update(dt) {
    if (this.state !== GameState.PLAYING) return;

    this.timer -= dt;
    if (this.timer <= 0) {
      const acc = this.shotsFired > 0 ? Math.round((this.targetsHit / this.shotsFired) * 100) : 0;
      this.finishGame(this.score, { reason: `Session Complete! Accuracy: ${acc}%, Headshots: ${this.headshots}` });
      return;
    }

    // Update Targets
    for (let i = this.targets.length - 1; i >= 0; i--) {
      const t = this.targets[i];
      t.life -= dt;
      if (t.life <= 0) {
        this.targets.splice(i, 1);
        this.spawnTarget();
      }
    }

    // Particles & Text
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= 25 * dt;
      ft.life -= dt;
      if (ft.life <= 0) this.floatingTexts.splice(i, 1);
    }
  }

  render(ctx) {
    const w = this.baseWidth;
    const h = this.baseHeight;

    // Tactical Concrete Shooting Range
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, w, h);

    // Range Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.7);
    ctx.lineTo(w, h * 0.7);
    ctx.stroke();

    // Render Targets (Concentric Circles)
    for (const t of this.targets) {
      ctx.save();
      // Outer ring
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
      ctx.fill();

      // Middle ring
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.r * 0.7, 0, Math.PI * 2);
      ctx.fill();

      // Bullseye / Headshot core
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.r * 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Particles
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Floating text
    for (const ft of this.floatingTexts) {
      ctx.save();
      ctx.fillStyle = ft.color;
      ctx.font = 'bold 15px Outfit, sans-serif';
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 4;
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }

    // Crosshair at mouse
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.mouse.x, this.mouse.y, 14, 0, Math.PI * 2);
    ctx.moveTo(this.mouse.x - 22, this.mouse.y);
    ctx.lineTo(this.mouse.x + 22, this.mouse.y);
    ctx.moveTo(this.mouse.x, this.mouse.y - 22);
    ctx.lineTo(this.mouse.x, this.mouse.y + 22);
    ctx.stroke();

    // Top HUD
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(0, 0, w, 52);

    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 16px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`AMMO: 💥 ${this.ammo}/${this.maxAmmo}`, 24, 32);

    const acc = this.shotsFired > 0 ? Math.round((this.targetsHit / this.shotsFired) * 100) : 100;
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`ACCURACY: ${acc}%  •  HEADSHOTS: ${this.headshots}`, 200, 32);

    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`SCORE: ${this.score}`, 540, 32);

    ctx.fillStyle = '#ef4444';
    ctx.fillText(`TIME: ${Math.ceil(this.timer)}s`, w - 120, 32);

    // Bottom Unbox CTA
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(0, h - 40, w, 40);
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 13px Outfit, sans-serif';
    ctx.fillText('🎁 PRESS [C] TO UNBOX WEAPON CASE (COST 500 SCORE)', 24, h - 16);
    if (this.unboxedSkins.length > 0) {
      ctx.fillStyle = this.unboxedSkins[0].color;
      ctx.fillText(`LAST SKIN: ${this.unboxedSkins[0].name}`, w - 300, h - 16);
    }
  }
}

export default CsgoAimStrikeGame;

