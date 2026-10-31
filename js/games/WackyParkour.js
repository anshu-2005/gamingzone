/* ====================================================
   WACKY PARKOUR — GAMINGZONE 3D
   Dynamic Third-Person 3D Neon Parkour Obby!
   Moving platforms, rotating sweeper bars, trampolines & sky obby!
   ==================================================== */

import * as THREE from 'three';
import { ThreeGameEngineBase } from '../core/ThreeGameEngineBase.js';
import { GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class WackyParkourGame extends ThreeGameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, Object.assign({
      title: 'Wacky Parkour',
      timeLimit: 90,
      clearColor: 0x0f172a,
      fogColor: 0x0f172a,
      fogNear: 40,
      fogFar: 160,
      cameraOffset: new THREE.Vector3(0, 6, 11)
    }, config));

    this.player = null;
    this.velocity = new THREE.Vector3();
    this.moveSpeed = 15;
    this.jumpForce = 15.5;
    this.gravity = 35;
    this.isGrounded = true;

    // Moving & Interactive Parkour Platforms
    this.platforms = [];
    this.movingPlatforms = [];
    this.sweeperBars = [];
    this.trampolines = [];
    this.checkpoints = [];
    this.lastCheckpointPos = new THREE.Vector3(0, 1, 0);
    this.gems = [];
    this.gemsCollected = 0;

    // HUD
    this.hudElement = null;

    if (this.isWebGLAvailable) {
      this.initCourse();
      this.initPlayer();
      this.createHUD();
      this.attach3DTouchControls();
      this.showStartCard({
        title: 'WACKY PARKOUR 3D',
        icon: '🏃',
        objective: 'Conquer the ultimate sky parkour obstacle course! Leap across moving floating pads, dodge rotating sweepers, and reach the golden star portal!',
        controls: 'WASD / Arrows to run • SPACE to jump • Use jump pads for massive height!'
      });
      this.startLoop();
    }
  }

  // 1. Build Neon Sky Parkour Obby
  initCourse() {
    // Starting Platform at Z = 0
    this.addPlatform(0, 0, 0, 8, 1, 8, 0x3b82f6);

    // Section 1: Stepping Stones (Z = 8 to 40)
    this.addPlatform(-2, 1, 12, 3.5, 0.8, 3.5, 0x10b981);
    this.addPlatform(2.5, 2.2, 20, 3.5, 0.8, 3.5, 0x10b981);
    this.addPlatform(-1.5, 3.4, 28, 3.5, 0.8, 3.5, 0x10b981);

    // Platform with Checkpoint 1 (Z = 38)
    this.addPlatform(0, 4, 38, 8, 1, 8, 0x8b5cf6);
    this.addCheckpoint(0, 4.5, 38, 1);

    // Section 2: Moving Platforms (Z = 48 to 90)
    this.addMovingPlatform(0, 4.5, 50, 4.5, 0.8, 4.5, 0xec4899, 'horizontal', 5, 2.0);
    this.addMovingPlatform(0, 6, 68, 4.5, 0.8, 4.5, 0xec4899, 'vertical', 3.5, 1.8);
    this.addMovingPlatform(0, 8, 84, 4.5, 0.8, 4.5, 0xec4899, 'horizontal', 5, 2.2);

    // Platform with Checkpoint 2 (Z = 100)
    this.addPlatform(0, 9, 102, 9, 1, 9, 0x8b5cf6);
    this.addCheckpoint(0, 9.5, 102, 2);

    // Section 3: Sweeper Obstacle & Trampolines (Z = 115 to 175)
    this.addSweeperPlatform(0, 9.5, 120, 10, 10);
    this.addTrampoline(0, 9.5, 138);

    this.addPlatform(0, 14, 160, 6, 1, 6, 0x10b981);
    this.addSweeperPlatform(0, 14.5, 178, 11, 11);

    // Platform with Checkpoint 3 (Z = 195)
    this.addPlatform(0, 15, 198, 9, 1, 9, 0x8b5cf6);
    this.addCheckpoint(0, 15.5, 198, 3);

    // Section 4: Final Sprint to Star Portal (Z = 210 to 240)
    this.addPlatform(-3, 16, 212, 3.5, 0.8, 3.5, 0xf59e0b);
    this.addPlatform(3, 17.5, 224, 3.5, 0.8, 3.5, 0xf59e0b);
    this.addPlatform(0, 19, 236, 10, 1.2, 10, 0xfacc15);

    // Victory Star Portal at Z = 238
    this.createVictoryStar(0, 21, 238);

    // Sparkling Parkour Gems
    this.spawnGems();
  }

  addPlatform(x, y, z, w, h, d, color) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.35,
      metalness: 0.2
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    this.scene.add(mesh);

    this.platforms.push({
      mesh,
      box: new THREE.Box3().setFromObject(mesh),
      topY: y + h / 2,
      w, d
    });
  }

  addMovingPlatform(x, y, z, w, h, d, color, axis, range, speed) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.3,
      roughness: 0.2
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.scene.add(mesh);

    this.movingPlatforms.push({
      mesh,
      basePos: new THREE.Vector3(x, y, z),
      axis,
      range,
      speed,
      w, h, d
    });
  }

  addSweeperPlatform(x, y, z, w, d) {
    // Base platform
    this.addPlatform(x, y, z, w, 1, d, 0x1e293b);

    // Sweeper Bar rotating on platform center
    const barGroup = new THREE.Group();
    barGroup.position.set(x, y + 1.1, z);

    const armGeo = new THREE.BoxGeometry(w - 0.8, 0.6, 0.6);
    const armMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0x991b1b,
      emissiveIntensity: 0.6
    });
    const arm = new THREE.Mesh(armGeo, armMat);
    arm.castShadow = true;
    barGroup.add(arm);

    this.scene.add(barGroup);
    this.sweeperBars.push({ group: barGroup, rotSpeed: 2.2, radius: (w - 0.8) / 2 });
  }

  addTrampoline(x, y, z) {
    const padGeo = new THREE.CylinderGeometry(1.6, 1.8, 0.6, 16);
    const padMat = new THREE.MeshStandardMaterial({
      color: 0x2dd4bf,
      emissive: 0x0f766e,
      emissiveIntensity: 0.7,
      roughness: 0.2
    });
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.position.set(x, y + 0.3, z);
    pad.castShadow = true;
    this.scene.add(pad);

    this.trampolines.push({ position: new THREE.Vector3(x, y + 0.3, z), radius: 1.8 });
  }

  addCheckpoint(x, y, z, index) {
    const flagGeo = new THREE.ConeGeometry(0.8, 2, 8);
    const flagMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, emissive: 0x1d4ed8, emissiveIntensity: 0.5 });
    const flag = new THREE.Mesh(flagGeo, flagMat);
    flag.position.set(x + 3.2, y + 1, z);
    this.scene.add(flag);
    this.checkpoints.push({ pos: new THREE.Vector3(x, y + 1, z), passed: false, flag });
  }

  createVictoryStar(x, y, z) {
    const starGeo = new THREE.OctahedronGeometry(2.0, 0);
    const starMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xeab308,
      emissiveIntensity: 0.8,
      metalness: 0.6
    });
    this.victoryStar = new THREE.Mesh(starGeo, starMat);
    this.victoryStar.position.set(x, y, z);
    this.scene.add(this.victoryStar);
  }

  spawnGems() {
    const gemGeo = new THREE.DodecahedronGeometry(0.5, 0);
    const gemMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.6,
      metalness: 0.7
    });

    [12, 20, 28, 55, 75, 120, 160, 212, 224].forEach((z, idx) => {
      const gem = new THREE.Mesh(gemGeo, gemMat);
      gem.position.set((idx % 2 === 0 ? 1 : -1) * 1.5, (z / 12) + 2.5, z);
      this.scene.add(gem);
      this.gems.push(gem);
    });
  }

  // 2. Initialize Dash Dynamo Character
  initPlayer() {
    this.player = this.createStylizedCharacter({
      bodyColor: 0xef4444, // Red runner suit
      pantsColor: 0x1e293b,
      hatColor: 0x2dd4bf,
      characterType: 'guy'
    });
    this.player.position.copy(this.lastCheckpointPos);
    this.scene.add(this.player);
  }

  // 3. Create HUD
  createHUD() {
    this.hudElement = document.createElement('div');
    this.hudElement.style.cssText = `
      position: absolute; top: 14px; left: 16px; right: 16px;
      display: flex; justify-content: space-between; align-items: center;
      pointer-events: none; z-index: 50; font-family: var(--font-heading, sans-serif);
    `;
    this.hudElement.innerHTML = `
      <div style="background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(8px); padding: 8px 16px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); color: #fff;">
        <span style="color: #38bdf8; font-weight: 800;">💎 GEMS:</span>
        <span id="parkour-gems-count" style="font-weight: 800; font-size: 1.1rem; margin-left: 6px;">0</span>
      </div>
      <div style="background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(8px); padding: 8px 16px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); color: #fff;">
        <span style="color: #facc15; font-weight: 800;">⏱️ TIME:</span>
        <span id="parkour-timer" style="font-weight: 800; font-size: 1.1rem; margin-left: 6px;">90s</span>
      </div>
      <div style="background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(8px); padding: 8px 16px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); color: #fff;">
        <span style="color: #34d399; font-weight: 800;">⭐ SCORE:</span>
        <span id="parkour-score" style="font-weight: 800; font-size: 1.1rem; margin-left: 6px;">0</span>
      </div>
    `;
    this.container.appendChild(this.hudElement);
  }

  // 4. Update Game Loop
  updateGame(delta) {
    if (this.state !== GameState.PLAYING) return;

    this.timeLeft -= delta;
    const timerElem = document.getElementById('parkour-timer');
    if (timerElem) timerElem.textContent = `${Math.max(0, Math.ceil(this.timeLeft))}s`;

    if (this.timeLeft <= 0) {
      this.state = GameState.GAME_OVER;
      sounds.playGameOver();
      this.showGameOverCard({
        title: 'OUT OF TIME!',
        score: this.score,
        reason: 'The parkour timer expired! Try again to beat the clock!'
      });
      return;
    }

    // Victory Star rotation
    if (this.victoryStar) {
      this.victoryStar.rotation.y += delta * 2;
      this.victoryStar.rotation.x += delta * 1.5;
    }

    // Moving Platforms update
    const time = this.getElapsedTime();
    for (const mp of this.movingPlatforms) {
      if (mp.axis === 'horizontal') {
        mp.mesh.position.x = mp.basePos.x + Math.sin(time * mp.speed) * mp.range;
      } else {
        mp.mesh.position.y = mp.basePos.y + Math.sin(time * mp.speed) * mp.range;
      }
    }

    // Sweeper Bars rotation
    for (const sb of this.sweeperBars) {
      sb.group.rotation.y += sb.rotSpeed * delta;

      // Check collision with player
      const dist = sb.group.position.distanceTo(this.player.position);
      if (dist < sb.radius + 0.6 && Math.abs(this.player.position.y - sb.group.position.y) < 1.2) {
        this.triggerSweeperKnockback(sb.group.position);
      }
    }

    // Input Movement
    const input = this.getMovementInput();
    const isMoving = input.hasInput;

    const targetVelX = input.x * this.moveSpeed;
    const targetVelZ = (input.z || 0) * this.moveSpeed;
    this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, targetVelX, 0.18);
    this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, targetVelZ, 0.18);

    if (Math.hypot(this.velocity.x, this.velocity.z) > 0.4) {
      const targetAngle = Math.atan2(this.velocity.x, this.velocity.z);
      this.player.rotation.y = THREE.MathUtils.lerp(this.player.rotation.y, targetAngle, 0.2);
    }

    if (input.isJump && this.isGrounded) {
      this.velocity.y = this.jumpForce;
      this.isGrounded = false;
      sounds.playJump();
      this.createParticleBurst(this.player.position, 8, 0xffffff, 0.15);
    }

    // Gravity
    this.velocity.y -= this.gravity * delta;
    this.player.position.addScaledVector(this.velocity, delta);

    // Platform Ground Collision Check
    this.isGrounded = false;
    const playerFeetY = this.player.position.y;
    const px = this.player.position.x;
    const pz = this.player.position.z;

    // 1. Static Platforms
    for (const p of this.platforms) {
      if (
        px >= p.mesh.position.x - p.w / 2 &&
        px <= p.mesh.position.x + p.w / 2 &&
        pz >= p.mesh.position.z - p.d / 2 &&
        pz <= p.mesh.position.z + p.d / 2
      ) {
        if (playerFeetY <= p.topY && playerFeetY >= p.topY - 1.2 && this.velocity.y <= 0) {
          this.player.position.y = p.topY;
          this.velocity.y = 0;
          this.isGrounded = true;
          break;
        }
      }
    }

    // 2. Moving Platforms
    if (!this.isGrounded) {
      for (const mp of this.movingPlatforms) {
        const topY = mp.mesh.position.y + mp.h / 2;
        if (
          px >= mp.mesh.position.x - mp.w / 2 &&
          px <= mp.mesh.position.x + mp.w / 2 &&
          pz >= mp.mesh.position.z - mp.d / 2 &&
          pz <= mp.mesh.position.z + mp.d / 2
        ) {
          if (playerFeetY <= topY && playerFeetY >= topY - 1.2 && this.velocity.y <= 0) {
            this.player.position.y = topY;
            this.velocity.y = 0;
            this.isGrounded = true;
            break;
          }
        }
      }
    }

    // Trampolines Super Launch
    for (const tramp of this.trampolines) {
      if (tramp.position.distanceTo(this.player.position) < tramp.radius && this.player.position.y < tramp.position.y + 1.2) {
        this.velocity.y = 26; // Massive super jump!
        this.velocity.z += 6;
        this.isGrounded = false;
        sounds.playJump();
        this.createParticleBurst(tramp.position, 25, 0x2dd4bf, 0.35);
      }
    }

    // Fall Void Check (Fell below y = -6)
    if (this.player.position.y < -6) {
      sounds.playDrop();
      this.createParticleBurst(this.player.position, 20, 0xef4444, 0.3);
      this.respawnAtLastCheckpoint();
    }

    // Collectible Gems
    for (let i = this.gems.length - 1; i >= 0; i--) {
      const gem = this.gems[i];
      gem.rotation.y += delta * 3;
      if (gem.position.distanceTo(this.player.position) < 1.8) {
        this.gemsCollected++;
        this.score += 300;
        sounds.playCoin();
        this.createParticleBurst(gem.position, 14, 0x38bdf8, 0.25);
        this.scene.remove(gem);
        gem.geometry.dispose();
        gem.material.dispose();
        this.gems.splice(i, 1);

        const gElem = document.getElementById('parkour-gems-count');
        if (gElem) gElem.textContent = this.gemsCollected;
        const sElem = document.getElementById('parkour-score');
        if (sElem) sElem.textContent = this.score;
      }
    }

    // Checkpoints Check
    for (const cp of this.checkpoints) {
      if (!cp.passed && this.player.position.distanceTo(cp.pos) < 3.2) {
        cp.passed = true;
        this.lastCheckpointPos.copy(cp.pos);
        sounds.playMatch();
        this.createParticleBurst(cp.pos, 25, 0x8b5cf6, 0.35);
        this.score += 500;
        const sElem = document.getElementById('parkour-score');
        if (sElem) sElem.textContent = this.score;
      }
    }

    // Victory Check at Star Portal (Z >= 235)
    if (this.player.position.z >= 235) {
      this.triggerVictory();
      return;
    }

    // Procedural Character Animation
    const speedMagnitude = Math.hypot(this.velocity.x, this.velocity.z);
    this.updateCharacterAnimation(this.player, delta, isMoving, this.isGrounded, speedMagnitude / this.moveSpeed);

    // Smooth Camera Follow
    this.updateCameraFollow(this.player);
  }

  triggerSweeperKnockback(sweeperPos) {
    sounds.playHit();
    this.createParticleBurst(this.player.position, 18, 0xef4444, 0.3);
    const dir = this.player.position.clone().sub(sweeperPos).normalize();
    this.velocity.x = dir.x * 22;
    this.velocity.z = dir.z * 16;
    this.velocity.y = 12;
    this.isGrounded = false;
  }

  respawnAtLastCheckpoint() {
    this.player.position.copy(this.lastCheckpointPos);
    this.velocity.set(0, 0, 0);
    this.isGrounded = true;
  }

  triggerVictory() {
    this.state = GameState.COMPLETED;
    sounds.playVictory();

    const gemBonus = this.gemsCollected * 300;
    const timeBonus = Math.max(0, Math.round(this.timeLeft * 50));
    const finalScore = this.score + gemBonus + timeBonus;

    this.createParticleBurst(this.player.position, 55, 0xfacc15, 0.5);

    this.showVictoryCard({
      title: 'PARKOUR OBBY MASTER!',
      score: finalScore,
      stats: [
        { label: 'Gems Gathered', value: this.gemsCollected },
        { label: 'Clear Time', value: `${Math.ceil(90 - this.timeLeft)}s` },
        { label: 'Time Bonus', value: `+${timeBonus}` },
        { label: 'Rank', value: 'Speedrun Legend 🏆' }
      ]
    });
  }

  destroy() {
    if (this.hudElement && this.hudElement.parentNode) {
      this.hudElement.parentNode.removeChild(this.hudElement);
    }
    super.destroy();
  }
}
