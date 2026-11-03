import { GameEngineBase } from '../core/GameEngineBase.js';

export class KaraokeBeatMaster extends GameEngineBase {
  constructor(container, options = {}) {
    super(container, {
      ...options,
      aspectRatio: 16 / 9,
      baseWidth: 960,
      baseHeight: 540
    });

    this.title = 'Karaoke Beat Master';
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.crowdMeter = 50; // 0-100%

    // Player pitch (5 pitch levels: 0 to 4, bottom to top)
    this.playerPitch = 2; // middle
    this.targetPitch = 2;
    this.pitchSmoothY = 300;

    this.noteTracks = [];
    this.currentSongIndex = 0;
    this.songs = [
      { title: 'SYNTHWAVE ANTHEM', bpm: 120, artist: 'Cyber DJ' },
      { title: 'NEON NIGHTS MEMORY', bpm: 135, artist: 'Vocaloid X' },
      { title: 'COSMIC DISCO RUN', bpm: 110, artist: 'Starline' }
    ];

    this.songProgress = 0;
    this.songDuration = 60; // seconds
    this.hitJudgments = [];
    this.audioCtx = null;
  }

  onInit() {
    this.createCanvas();
    this.generateNotes();

    this.addEventListenerTracked(window, 'keydown', (e) => {
      if (['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5'].includes(e.code)) {
        const val = parseInt(e.code.replace('Digit', '')) - 1;
        this.setPitch(val);
      } else if (e.code === 'ArrowUp' || e.code === 'KeyW') {
        this.setPitch(Math.min(4, this.playerPitch + 1));
      } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        this.setPitch(Math.max(0, this.playerPitch - 1));
      }
    });

    this.addEventListenerTracked(this.canvas, 'mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const my = ((e.clientY - rect.top) / rect.height) * 540;
      if (my >= 160 && my <= 440) {
        const p = 4 - Math.floor((my - 160) / 56);
        this.setPitch(Math.max(0, Math.min(4, p)));
      }
    });

    this.addEventListenerTracked(this.canvas, 'click', () => {
      this.initAudio();
    });

    this.showStartCard(
      'KARAOKE BEAT MASTER',
      'Match the vocal pitch notes flowing across the staff! Use [1-5] keys, [W/S] or Mouse to adjust your vocal pitch in real time. Keep the crowd cheering with continuous rhythm combos!',
      'START SINGING'
    );
  }

  initAudio() {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.audioCtx = new AudioCtx();
    }
  }

  playBeep(freq) {
    if (!this.audioCtx) return;
    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.15);
    } catch (_) {}
  }

  setPitch(p) {
    if (this.playerPitch !== p) {
      this.playerPitch = p;
      const pitches = [261.6, 293.7, 329.6, 392.0, 440.0]; // C4, D4, E4, G4, A4
      this.playBeep(pitches[p]);
    }
  }

  generateNotes() {
    this.noteTracks = [];
    const lyrics = ['YEAH', 'OH', 'BABY', 'FEEL', 'THE', 'LIGHT', 'DANCE', 'TONIGHT', 'FLY', 'HIGH', 'NEON', 'DREAM', 'SHINE'];
    let curX = 600;
    for (let i = 0; i < 90; i++) {
      const pitch = Math.floor(Math.random() * 5);
      const width = 60 + Math.random() * 80;
      const text = lyrics[i % lyrics.length];
      this.noteTracks.push({
        x: curX,
        pitch,
        width,
        text,
        hit: false,
        active: true
      });
      curX += width + 40 + Math.random() * 60;
    }
  }

  onUpdate(dt) {
    this.songProgress += dt;

    // Pitch target Y
    // Staff lines: pitch 0 is bottom (400), pitch 4 is top (180)
    const targetY = 400 - this.playerPitch * 55;
    this.pitchSmoothY += (targetY - this.pitchSmoothY) * 12 * dt;

    const hitLineX = 220;
    const scrollSpeed = 220; // px/sec

    // Move notes
    for (const note of this.noteTracks) {
      note.x -= scrollSpeed * dt;

      // Check collision with player pitch at hitLineX
      if (note.x <= hitLineX + 15 && note.x + note.width >= hitLineX - 15) {
        if (!note.hit && this.playerPitch === note.pitch) {
          note.hit = true;
          this.score += 150 * (1 + Math.floor(this.combo / 10) * 0.5);
          this.combo++;
          if (this.combo > this.maxCombo) this.maxCombo = this.combo;
          this.crowdMeter = Math.min(100, this.crowdMeter + 4);

          this.hitJudgments.push({
            text: 'PERFECT! 🌟',
            col: '#38bdf8',
            x: hitLineX,
            y: this.pitchSmoothY - 20,
            life: 0.8
          });
        }
      } else if (note.x + note.width < hitLineX - 20 && !note.hit && note.active) {
        note.active = false;
        // Missed note
        if (this.combo > 0) {
          this.hitJudgments.push({
            text: 'MISS',
            col: '#ef4444',
            x: hitLineX,
            y: 400 - note.pitch * 55,
            life: 0.6
          });
        }
        this.combo = 0;
        this.crowdMeter = Math.max(0, this.crowdMeter - 3);
      }
    }

    // Update judgments
    for (let i = this.hitJudgments.length - 1; i >= 0; i--) {
      const j = this.hitJudgments[i];
      j.y -= 25 * dt;
      j.life -= dt;
      if (j.life <= 0) this.hitJudgments.splice(i, 1);
    }
  }

  onRender(ctx) {
    // Stage background
    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(0, 0, 960, 540);

    // Stage spotlights
    const time = performance.now() * 0.002;
    ctx.save();
    ctx.globalAlpha = 0.15;
    const g1 = ctx.createRadialGradient(250 + Math.sin(time) * 100, 50, 20, 250, 400, 350);
    g1.addColorStop(0, '#a855f7');
    g1.addColorStop(1, 'transparent');
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, 960, 540);

    const g2 = ctx.createRadialGradient(700 + Math.cos(time) * 100, 50, 20, 700, 400, 350);
    g2.addColorStop(0, '#06b6d4');
    g2.addColorStop(1, 'transparent');
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, 960, 540);
    ctx.restore();

    // Top Header
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, 960, 80);
    ctx.fillStyle = '#f43f5e';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🎤 KARAOKE BEAT MASTER', 30, 48);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px sans-serif';
    ctx.fillText(`SONG: ${this.songs[this.currentSongIndex].title}`, 320, 48);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`SCORE: ${Math.round(this.score)}`, 930, 38);

    ctx.fillStyle = '#eab308';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(`COMBO: ${this.combo}x (MAX: ${this.maxCombo}x)`, 930, 62);

    // Crowd Excitement Bar
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(30, 95, 200, 16);
    ctx.fillStyle = this.crowdMeter > 50 ? '#10b981' : (this.crowdMeter > 25 ? '#f59e0b' : '#ef4444');
    ctx.fillRect(30, 95, (this.crowdMeter / 100) * 200, 16);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`CROWD HYPE: ${Math.round(this.crowdMeter)}%`, 35, 107);

    // Musical Staff Lines
    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.fillRect(40, 140, 880, 290);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;

    const pitchesNames = ['LOW C', 'D', 'E', 'G', 'HIGH A'];
    for (let p = 0; p < 5; p++) {
      const y = 400 - p * 55;
      ctx.beginPath();
      ctx.moveTo(80, y);
      ctx.lineTo(920, y);
      ctx.stroke();

      // Pitch label
      ctx.fillStyle = this.playerPitch === p ? '#38bdf8' : '#64748b';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`[${p + 1}] ${pitchesNames[p]}`, 70, y + 4);
    }

    // Hit Guide Line (Mic receiver)
    const hitX = 220;
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.8)';
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(hitX, 140);
    ctx.lineTo(hitX, 430);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Rolling Note Blocks
    for (const note of this.noteTracks) {
      if (note.x + note.width < 0 || note.x > 960) continue;
      const y = 400 - note.pitch * 55 - 16;
      ctx.fillStyle = note.hit ? '#10b981' : '#a855f7';
      ctx.beginPath();
      ctx.roundRect(note.x, y, note.width, 32, 6);
      ctx.fill();
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Note lyric
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(note.text, note.x + note.width / 2, y + 20);
    }

    // Player Pitch Cursor (Microphone Beam)
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#0284c7';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(hitX, this.pitchSmoothY, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Pitch Spark Trail
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(hitX - 40, this.pitchSmoothY);
    ctx.lineTo(hitX + 15, this.pitchSmoothY);
    ctx.stroke();

    // Judgments overlay
    for (const j of this.hitJudgments) {
      ctx.fillStyle = j.col;
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(j.text, j.x, j.y);
    }

    // Bottom controls helper
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 470, 960, 70);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🎮 CONTROLS: Use Keys [1 - 5] or [W / S / Up / Down] or Move Mouse over staff to change vocal pitch!', 480, 510);
  }
}
