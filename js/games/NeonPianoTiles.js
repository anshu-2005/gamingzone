/* ====================================================
   NEON PIANO TILES — GAMINGZONE
   High-Octane 4-Lane Rhythm Arcade:
   Descending Neon Melodic Tiles, Real Synthesized Chords,
   Accuracy Ratings (PERFECT/GREAT/MISS), Acceleration & Touch
   ==================================================== */

import { GameEngineBase, GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class NeonPianoTilesGame extends GameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, {
      title: 'Neon Piano Tiles',
      targetScore: 200,
      ...config
    });

    this.laneWidth = 110;
    this.lanesCount = 4;
    this.startX = 20;
    this.tiles = [];
    this.ratings = [];
    this.particles = [];

    this.hitLineY = 530;
    this.tileHeight = 110;
    this.speed = 320;
    this.combo = 0;

    // Musical scale notes (Hz)
    this.scale = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];
    this.noteIndex = 0;

    this.createCanvas(480, 640);
    this.initAudioContext();
    this.initSong();
    this.initControls();

    this.showStartCard({
      title: 'NEON PIANO TILES',
      icon: '🎹',
      objective: 'Tap the falling neon tiles as they cross the white baseline to play the melody! Don\'t tap empty spaces or let tiles escape!',
      controls: 'Lanes D, F, J, K or Tap lanes directly on screen.',
      onStart: () => this.start()
    });
  }

  initAudioContext() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.audioCtx = new AudioCtx();
    } catch (e) {
      this.audioCtx = null;
    }
  }

  playPianoNote(freq) {
    if (!this.audioCtx) {
      sounds.playCoin();
      return;
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

    gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.45);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.5);
  }

  initSong() {
    this.tiles = [];
    this.ratings = [];
    this.particles = [];
    this.score = 0;
    this.combo = 0;
    this.speed = 320;
    this.noteIndex = 0;

    // Generate continuous music stream
    let curY = -100;
    for (let i = 0; i < 80; i++) {
      const lane = Math.floor(Math.random() * this.lanesCount);
      const freq = this.scale[i % this.scale.length];
      this.tiles.push({
        lane,
        y: curY,
        freq,
        color: ['#00f2fe', '#a855f7', '#ec4899', '#10b981'][lane],
        hit: false,
        missed: false
      });
      curY -= 150 + Math.random() * 20;
    }
  }

  initControls() {
    const handleLanePress = (laneIndex) => {
      if (this.state !== GameState.PLAYING) return;
      this.checkLaneHit(laneIndex);
    };

    // Keyboard controls: D, F, J, K (or 1, 2, 3, 4)
    this.addListener(window, 'keydown', (e) => {
      if (this.state !== GameState.PLAYING) return;
      const k = e.key.toLowerCase();
      if (k === 'd' || k === '1') handleLanePress(0);
      else if (k === 'f' || k === '2') handleLanePress(1);
      else if (k === 'j' || k === '3') handleLanePress(2);
      else if (k === 'k' || k === '4') handleLanePress(3);
    });

    // Touch / Pointer controls on canvas lanes
    this.addListener(this.canvas, 'pointerdown', (e) => {
      e.preventDefault();
      if (this.state !== GameState.PLAYING) return;

      const rect = this.canvas.getBoundingClientRect();
      const clickX = ((e.clientX - rect.left) / rect.width) * this.baseWidth;
      const lane = Math.floor((clickX - this.startX) / this.laneWidth);

      if (lane >= 0 && lane < this.lanesCount) {
        handleLanePress(lane);
      }
    });
  }

  checkLaneHit(lane) {
    // Find the lowest active tile in this lane
    let targetTile = null;
    let minDist = Infinity;

    for (const t of this.tiles) {
      if (t.hit || t.missed || t.lane !== lane) continue;
      const dist = Math.abs((t.y + this.tileHeight) - this.hitLineY);
      if (dist < minDist) {
        minDist = dist;
        targetTile = t;
      }
    }

    if (!targetTile || minDist > 120) {
      // Missed tap on empty space!
      this.onMiss('Misclick on empty lane!');
      return;
    }

    // Success hit!
    targetTile.hit = true;
    this.playPianoNote(targetTile.freq);

    let ratingText = 'GOOD';
    let pts = 2;
    if (minDist < 25) {
      ratingText = 'PERFECT!';
      pts = 10;
    } else if (minDist < 60) {
      ratingText = 'GREAT!';
      pts = 5;
    }

    this.combo++;
    this.score += pts * Math.min(4, Math.floor(this.combo / 10) + 1);
    this.speed = Math.min(650, 320 + this.score * 1.5);

    // Rating text popup
    const laneCenterX = this.startX + lane * this.laneWidth + this.laneWidth / 2;
    this.ratings.push({
      text: ratingText,
      x: laneCenterX,
      y: this.hitLineY - 40,
      alpha: 1,
      color: ratingText === 'PERFECT!' ? '#ffd166' : '#00f2fe'
    });

    // Spark burst
    for (let i = 0; i < 14; i++) {
      this.particles.push({
        x: laneCenterX,
        y: this.hitLineY,
        vx: (Math.random() - 0.5) * 160,
        vy: -40 - Math.random() * 80,
        color: targetTile.color,
        radius: 3,
        alpha: 1,
        life: 0.4
      });
    }
  }

  onMiss(reason) {
    this.state = GameState.GAME_OVER;
    sounds.playHit();

    this.setTimeout(() => this.gameOver(this.score), 800);
  }

  update(dt) {
    if (this.state !== GameState.PLAYING) return;

    // Move tiles down
    for (const t of this.tiles) {
      t.y += this.speed * dt;

      // Check if tile slipped past hit line without being hit
      if (!t.hit && !t.missed && t.y > this.hitLineY + 20) {
        t.missed = true;
        this.onMiss('Tile escaped!');
        return;
      }
    }

    // Spawn more tiles continuously if reaching end
    const lastTile = this.tiles[this.tiles.length - 1];
    if (lastTile && lastTile.y > -200) {
      let curY = lastTile.y - 150;
      for (let i = 0; i < 30; i++) {
        const lane = Math.floor(Math.random() * this.lanesCount);
        this.tiles.push({
          lane,
          y: curY,
          freq: this.scale[i % this.scale.length],
          color: ['#00f2fe', '#a855f7', '#ec4899', '#10b981'][lane],
          hit: false,
          missed: false
        });
        curY -= 150 + Math.random() * 20;
      }
    }

    // Ratings update
    for (let i = this.ratings.length - 1; i >= 0; i--) {
      const r = this.ratings[i];
      r.y -= 25 * dt;
      r.alpha -= dt * 2;
      if (r.alpha <= 0) this.ratings.splice(i, 1);
    }

    // Particles update
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.alpha -= dt / pt.life;
      if (pt.alpha <= 0) this.particles.splice(i, 1);
    }
  }

  render() {
    this.ctx.clearRect(0, 0, this.baseWidth, this.baseHeight);

    // Deep Stage Backdrop
    this.ctx.fillStyle = '#060714';
    this.ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);

    // Render 4 Lanes
    for (let l = 0; l < this.lanesCount; l++) {
      const x = this.startX + l * this.laneWidth;
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(x, 0, this.laneWidth, this.baseHeight);

      // Key label indicator at bottom
      const keys = ['D', 'F', 'J', 'K'];
      this.ctx.font = 'bold 16px "Outfit", sans-serif';
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(keys[l], x + this.laneWidth / 2, this.baseHeight - 20);
    }

    // Hit Baseline
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 3;
    this.ctx.shadowColor = '#ffffff';
    this.ctx.shadowBlur = 8;
    this.ctx.beginPath();
    this.ctx.moveTo(this.startX, this.hitLineY);
    this.ctx.lineTo(this.startX + this.lanesCount * this.laneWidth, this.hitLineY);
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;

    // Render Tiles
    for (const t of this.tiles) {
      if (t.y < -120 || t.y > this.baseHeight + 50) continue;
      const x = this.startX + t.lane * this.laneWidth + 6;
      const w = this.laneWidth - 12;

      if (!t.hit) {
        this.ctx.fillStyle = t.color;
        this.ctx.shadowColor = t.color;
        this.ctx.shadowBlur = 12;
        this.ctx.beginPath();
        if (this.ctx.roundRect) {
          this.ctx.roundRect(x, t.y, w, this.tileHeight, 8);
        } else {
          this.ctx.rect(x, t.y, w, this.tileHeight);
        }
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        // Top glossy strip
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillRect(x, t.y, w, 4);
      }
    }

    // Render Particles
    for (const pt of this.particles) {
      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, pt.alpha);
      this.ctx.fillStyle = pt.color;
      this.ctx.beginPath();
      this.ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }

    // Render Accuracy Ratings
    for (const r of this.ratings) {
      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, r.alpha);
      this.ctx.font = 'bold 22px "Outfit", sans-serif';
      this.ctx.fillStyle = r.color;
      this.ctx.textAlign = 'center';
      this.ctx.fillText(r.text, r.x, r.y);
      this.ctx.restore();
    }

    // Top HUD
    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    this.ctx.fillRect(16, 16, 160, 48);

    this.ctx.font = '900 24px "Outfit", sans-serif';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`${this.score}`, 32, 48);

    if (this.combo > 5) {
      this.ctx.font = 'bold 16px "Outfit", sans-serif';
      this.ctx.fillStyle = '#ffd166';
      this.ctx.fillText(`x${this.combo}`, 120, 48);
    }
  }
}
