/* ====================================================
   BANANA BONK — GAMINGZONE 3D
   Silly Cartoon Obstacle Wipeout with Comic Knockback!
   Spinning bananas, bouncy mushroom pads & hilarious ragdoll bounces!
   ==================================================== */

import * as THREE from 'three';
import { ThreeGameEngineBase } from '../core/ThreeGameEngineBase.js';
import { GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class BananaBonkGame extends ThreeGameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, Object.assign({
      title: 'Banana Bonk',
      timeLimit: 80,
      clearColor: 0x0284c7,
      fogColor: 0x0284c7,
      fogNear: 35,
      fogFar: 140,
      cameraOffset: new THREE.Vector3(0, 6, 11)
    }, config));

    this.player = null;
    this.velocity = new THREE.Vector3();
    this.moveSpeed = 14;
    this.jumpForce = 15;
    this.gravity = 34;
    this.isGrounded = true;

    // Wipeout Obstacles
    this.spinningHazards = [];
    this.bouncePads = [];
    this.checkpoints = [];
    this.lastCheckpointPos = new THREE.Vector3(0, 1, 4);
    this.bananas = [];
    this.bananasCollected = 0;

    // Comic Knockback State
    this.isKnockedBack = false;
    this.knockTimer = 0;

    // HUD
    this.hudElement = null;

    if (this.isWebGLAvailable) {
      this.initCourse();
      this.initPlayer();
      this.createHUD();
      this.attach3DTouchControls();
      this.showStartCard({
        title: 'BANANA BONK 3D',
        icon: '🍌',
        objective: 'Survive the wildest jungle obstacle wipeout! Dodge giant spinning bananas, bounce on mushroom pads, and reach the finish podium!',
        controls: 'WASD / Arrows to run • SPACE to jump • Use mushroom pads for super air!'
      });
      this.startLoop();
    }
  }

  // 1. Build Wacky Floating Jungle Obstacle Course
  initCourse() {
    // Water Slime Below
    const waterGeo = new THREE.PlaneGeometry(80, 350);
    const waterMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.1, metalness: 0.5 });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.set(0, -6, 130);
    this.scene.add(water);

    // Track Segments (Floating colorful platforms with gaps)
    const platformColors = [0x10b981, 0x059669, 0x10b981, 0x047857];
    for (let z = 0; z < 260; z += 16) {
      const pGeo = new THREE.BoxGeometry(8, 1, 12);
      const pMat = new THREE.MeshStandardMaterial({
        color: platformColors[(z / 16) % platformColors.length],
        roughness: 0.4
      });
      const p = new THREE.Mesh(pGeo, pMat);
      p.position.set(0, 0, z);
      p.receiveShadow = true;
      this.scene.add(p);
    }

    // 1. Giant Spinning Banana Hazards (Z = 35, 85, 145, 195)
    [35, 85, 145, 195].forEach((z, idx) => {
      const hazardGroup = new THREE.Group();
      hazardGroup.position.set(0, 1.8, z);

      // Central Pillar
      const postGeo = new THREE.CylinderGeometry(0.5, 0.5, 3.6, 12);
      const postMat = new THREE.MeshStandardMaterial({ color: 0x78350f });
      const post = new THREE.Mesh(postGeo, postMat);
      hazardGroup.add(post);

      // 2 Giant Curved Banana Arms
      const armGroup = new THREE.Group();
      [-1, 1].forEach((dir) => {
        const bGeo = new THREE.CylinderGeometry(0.4, 0.7, 4.2, 10);
        bGeo.rotateZ(Math.PI / 2);
        const bMat = new THREE.MeshStandardMaterial({
          color: 0xfacc15,
          emissive: 0xca8a04,
          emissiveIntensity: 0.3,
          roughness: 0.3
        });
        const banana = new THREE.Mesh(bGeo, bMat);
        banana.position.set(dir * 2.8, 1.2, 0);
        banana.castShadow = true;
        armGroup.add(banana);
      });

      hazardGroup.add(armGroup);
      this.scene.add(hazardGroup);

      this.spinningHazards.push({
        group: hazardGroup,
        arm: armGroup,
        speed: (idx % 2 === 0 ? 1 : -1) * (2.8 + idx * 0.3),
        z
      });
    });

    // 2. Bouncy Mushroom Super Jump Pads (Z = 60, 120, 175)
    [60, 120, 175].forEach((z) => {
      const mushGroup = new THREE.Group();
      mushGroup.position.set(0, 0.5, z);

      const capGeo = new THREE.SphereGeometry(1.4, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5);
      const capMat = new THREE.MeshStandardMaterial({
        color: 0xf43f5e,
        emissive: 0xbe123c,
        emissiveIntensity: 0.4,
        roughness: 0.2
      });
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.y = 0.2;
      mushGroup.add(cap);

      this.scene.add(mushGroup);
      this.bouncePads.push({ position: new THREE.Vector3(0, 0.5, z), radius: 1.8 });
    });

    // 3. Collectible Golden Bananas
    const bGeo = new THREE.TorusGeometry(0.6, 0.2, 8, 16, Math.PI * 0.8);
    const bMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xeab308,
      emissiveIntensity: 0.6,
      metalness: 0.4
    });

    for (let z = 15; z < 240; z += 14) {
      const b = new THREE.Mesh(bGeo, bMat);
      b.position.set((Math.sin(z) * 2.8), 1.5, z);
      this.scene.add(b);
      this.bananas.push(b);
    }

    // 4. Checkpoints (Z = 75, 160)
    [75, 160].forEach((z, idx) => {
      const arch = new THREE.Group();
      arch.position.set(0, 0, z);
      const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 5, 8), new THREE.MeshStandardMaterial({ color: 0x3b82f6 }));
      p1.position.set(-3.5, 2.5, 0);
      const p2 = p1.clone();
      p2.position.set(3.5, 2.5, 0);
      arch.add(p1, p2);
      this.scene.add(arch);
      this.checkpoints.push({ z, passed: false });
    });

    // 5. Victory Podium at Z = 250
    const podGeo = new THREE.CylinderGeometry(4.5, 5, 1.2, 24);
    const podMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.5 });
    const podium = new THREE.Mesh(podGeo, podMat);
    podium.position.set(0, 0.6, 250);
    podium.receiveShadow = true;
    this.scene.add(podium);
  }

  // 2. Initialize Monkey Mojo Character
  initPlayer() {
    this.player = this.createStylizedCharacter({
      bodyColor: 0xd97706, // Orange/amber fur
      skinColor: 0xfde047,
      pantsColor: 0x059669,
      hatColor: 0xfacc15,
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
        <span style="color: #facc15; font-weight: 800;">🍌 BANANAS:</span>
        <span id="bonk-banana-count" style="font-weight: 800; font-size: 1.1rem; margin-left: 6px;">0</span>
      </div>
      <div style="background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(8px); padding: 8px 16px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); color: #fff;">
        <span style="color: #38bdf8; font-weight: 800;">⏱️ TIME:</span>
        <span id="bonk-timer" style="font-weight: 800; font-size: 1.1rem; margin-left: 6px;">80s</span>
      </div>
      <div style="background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(8px); padding: 8px 16px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); color: #fff;">
        <span style="color: #34d399; font-weight: 800;">⭐ SCORE:</span>
        <span id="bonk-score" style="font-weight: 800; font-size: 1.1rem; margin-left: 6px;">0</span>
      </div>
    `;
    this.container.appendChild(this.hudElement);
  }

  // 4. Update Game Loop
  updateGame(delta) {
    if (this.state !== GameState.PLAYING) return;

    this.timeLeft -= delta;
    const timerElem = document.getElementById('bonk-timer');
    if (timerElem) timerElem.textContent = `${Math.max(0, Math.ceil(this.timeLeft))}s`;

    if (this.timeLeft <= 0) {
      this.state = GameState.GAME_OVER;
      sounds.playGameOver();
      this.showGameOverCard({
        title: 'OUT OF TIME!',
        score: this.score,
        reason: 'You got bonked too many times! Try again to conquer the course!'
      });
      return;
    }

    // Rotate Spinning Banana Hazards
    for (const h of this.spinningHazards) {
      h.arm.rotation.y += h.speed * delta;

      // Check collision with player
      const dist = h.group.position.distanceTo(this.player.position);
      if (dist < 4.8 && Math.abs(this.player.position.y - h.group.position.y) < 2.0) {
        this.triggerBonkKnockback(h.group.position);
      }
    }

    // Input Movement
    const input = this.getMovementInput();
    const isMoving = input.hasInput;

    if (this.isKnockedBack) {
      this.knockTimer -= delta;
      if (this.knockTimer <= 0) this.isKnockedBack = false;
      this.velocity.x *= 0.94;
      this.velocity.z *= 0.94;
    } else {
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
    }

    // Gravity
    this.velocity.y -= this.gravity * delta;
    this.player.position.addScaledVector(this.velocity, delta);

    // Floor Detection
    if (this.player.position.y <= 0.5) {
      // Check if above valid platform
      if (Math.abs(this.player.position.x) <= 4.2) {
        this.player.position.y = 0.5;
        this.velocity.y = 0;
        this.isGrounded = true;
      }
    }

    // Fall Recovery (Fell off into slime)
    if (this.player.position.y < -4) {
      sounds.playDrop();
      this.createParticleBurst(this.player.position, 20, 0x06b6d4, 0.3);
      this.respawnAtLastCheckpoint();
    }

    // Bouncy Mushroom Pads Trigger
    for (const pad of this.bouncePads) {
      if (pad.position.distanceTo(this.player.position) < pad.radius && this.player.position.y < 1.6) {
        this.velocity.y = 24; // Super launch!
        this.isGrounded = false;
        sounds.playJump();
        this.createParticleBurst(pad.position, 25, 0xf43f5e, 0.35);
      }
    }

    // Golden Banana Pickups
    for (let i = this.bananas.length - 1; i >= 0; i--) {
      const b = this.bananas[i];
      b.rotation.z += delta * 3.5;
      if (b.position.distanceTo(this.player.position) < 1.8) {
        this.bananasCollected++;
        this.score += 250;
        sounds.playCoin();
        this.createParticleBurst(b.position, 12, 0xfacc15, 0.22);
        this.scene.remove(b);
        b.geometry.dispose();
        b.material.dispose();
        this.bananas.splice(i, 1);

        const bElem = document.getElementById('bonk-banana-count');
        if (bElem) bElem.textContent = this.bananasCollected;
        const sElem = document.getElementById('bonk-score');
        if (sElem) sElem.textContent = this.score;
      }
    }

    // Checkpoint Trigger
    for (const cp of this.checkpoints) {
      if (!cp.passed && this.player.position.z >= cp.z) {
        cp.passed = true;
        this.lastCheckpointPos.set(0, 0.5, cp.z + 1);
        sounds.playMatch();
        this.createParticleBurst(this.player.position, 25, 0x3b82f6, 0.35);
        this.score += 400;
        const sElem = document.getElementById('bonk-score');
        if (sElem) sElem.textContent = this.score;
      }
    }

    // Victory Check at Podium (Z >= 248)
    if (this.player.position.z >= 248) {
      this.triggerVictory();
      return;
    }

    // Procedural Character Animation
    const speedMagnitude = Math.hypot(this.velocity.x, this.velocity.z);
    this.updateCharacterAnimation(this.player, delta, isMoving, this.isGrounded, speedMagnitude / this.moveSpeed);

    // Smooth Camera Follow
    this.updateCameraFollow(this.player);
  }

  triggerBonkKnockback(hazardPos) {
    if (this.isKnockedBack) return;
    this.isKnockedBack = true;
    this.knockTimer = 0.8;

    sounds.playHit();
    this.createParticleBurst(this.player.position, 22, 0xfacc15, 0.35);

    const dir = this.player.position.clone().sub(hazardPos).normalize();
    this.velocity.x = dir.x * 20;
    this.velocity.z = dir.z * 16;
    this.velocity.y = 10;
    this.isGrounded = false;
  }

  respawnAtLastCheckpoint() {
    this.player.position.copy(this.lastCheckpointPos);
    this.velocity.set(0, 0, 0);
    this.isKnockedBack = false;
    this.isGrounded = true;
  }

  triggerVictory() {
    this.state = GameState.COMPLETED;
    sounds.playVictory();

    const bananaBonus = this.bananasCollected * 200;
    const timeBonus = Math.max(0, Math.round(this.timeLeft * 40));
    const finalScore = this.score + bananaBonus + timeBonus;

    this.createParticleBurst(this.player.position, 50, 0xfacc15, 0.5);

    this.showVictoryCard({
      title: 'BANANA BONK CHAMPION!',
      score: finalScore,
      stats: [
        { label: 'Bananas Grabbed', value: this.bananasCollected },
        { label: 'Time Remaining', value: `${Math.ceil(this.timeLeft)}s` },
        { label: 'Banana Bonus', value: `+${bananaBonus}` },
        { label: 'Speed Bonus', value: `+${timeBonus}` }
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
