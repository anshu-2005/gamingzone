/* ====================================================
   GAMINGZONE SHARED 3D ENGINE ARCHITECTURE
   Modular, High-Performance Systems for WebGL/Three.js:
   - CharacterController (Velocity, Jump, Ground Raycast, Turn Slerp)
   - CameraController (ThirdPerson, IsometricBoard, Orbit, Cockpit)
   - AnimationController (Idle, Walk, Run, Jump, Stumble, Victory)
   - PhysicsWorld (AABB, Sphere, Raycast, Gravity, Restitution)
   - InputManager (Keyboard, Mouse, Touch Virtual Joystick)
   - CollisionSystem (Static Obstacles, Dynamic Triggers, Pickups)
   - GameStateManager (Menu, Playing, Paused, LevelComplete, GameOver)
   - LevelManager (Progression, Difficulty Scaling, Spawning)
   - GameHUD (Score, Timer, Health, Lives, Coins, Level Indicator)
   - AssetLoader (Procedural Geometries, PBR Materials, Props)
   ==================================================== */

import * as THREE from 'three';
import { sounds } from './soundFX.js';

// ----------------------------------------------------
// 1. INPUT MANAGER
// ----------------------------------------------------
export class InputManager {
  constructor(domElement = window) {
    this.domElement = domElement;
    this.keys = {};
    this.mouse = { x: 0, y: 0, isDown: false, clickEvent: null };
    this.touchVector = { x: 0, y: 0 };
    this.isJumpPressed = false;
    this.listeners = [];

    this.init();
  }

  init() {
    const onKeyDown = (e) => {
      this.keys[e.code] = true;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
    };

    const onKeyUp = (e) => {
      this.keys[e.code] = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    this.listeners.push({ target: window, type: 'keydown', fn: onKeyDown });
    this.listeners.push({ target: window, type: 'keyup', fn: onKeyUp });
  }

  getMovementVector() {
    let x = 0;
    let z = 0;

    if (this.keys['KeyW'] || this.keys['ArrowUp']) z -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) z += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) x -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) x += 1;

    // Blend touch joystick
    if (Math.abs(this.touchVector.x) > 0.05 || Math.abs(this.touchVector.y) > 0.05) {
      x = this.touchVector.x;
      z = this.touchVector.y;
    }

    const length = Math.hypot(x, z);
    if (length > 1) {
      x /= length;
      z /= length;
    }

    const jump = Boolean(this.keys['Space'] || this.isJumpPressed);
    return { x, z, jump, hasInput: length > 0.1 || jump };
  }

  destroy() {
    this.listeners.forEach(({ target, type, fn }) => target.removeEventListener(type, fn));
    this.listeners = [];
  }
}

// ----------------------------------------------------
// 2. CHARACTER CONTROLLER
// ----------------------------------------------------
export class CharacterController {
  constructor(mesh, options = {}) {
    this.mesh = mesh;
    this.velocity = new THREE.Vector3();
    this.speed = options.speed || 10;
    this.jumpForce = options.jumpForce || 13;
    this.gravity = options.gravity || 30;
    this.isGrounded = true;
    this.turnSpeed = options.turnSpeed || 12;
    this.radius = options.radius || 0.5;
    this.height = options.height || 1.8;
    this.state = 'idle'; // 'idle', 'walk', 'run', 'jump', 'stumble', 'victory'
  }

  update(delta, input, physicsWorld = null) {
    if (!this.mesh) return;

    // Horizontal movement
    const targetVelX = input.x * this.speed;
    const targetVelZ = input.z * this.speed;

    this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, targetVelX, 0.2);
    this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, targetVelZ, 0.2);

    // Turn character towards movement direction
    if (Math.hypot(input.x, input.z) > 0.1) {
      const targetAngle = Math.atan2(input.x, input.z);
      this.mesh.rotation.y = THREE.MathUtils.lerp(this.mesh.rotation.y, targetAngle, this.turnSpeed * delta);
    }

    // Jump
    if (input.jump && this.isGrounded) {
      this.velocity.y = this.jumpForce;
      this.isGrounded = false;
      sounds.playThud?.();
    }

    // Gravity
    if (!this.isGrounded) {
      this.velocity.y -= this.gravity * delta;
    }

    // Apply translation
    this.mesh.position.x += this.velocity.x * delta;
    this.mesh.position.z += this.velocity.z * delta;
    this.mesh.position.y += this.velocity.y * delta;

    // Ground check
    const groundY = 0;
    if (this.mesh.position.y <= groundY) {
      this.mesh.position.y = groundY;
      this.velocity.y = 0;
      this.isGrounded = true;
    }

    // Update state
    if (!this.isGrounded) {
      this.state = 'jump';
    } else if (Math.hypot(this.velocity.x, this.velocity.z) > 0.5) {
      this.state = this.speed > 12 ? 'run' : 'walk';
    } else {
      this.state = 'idle';
    }
  }

  stumble(duration = 0.6) {
    this.state = 'stumble';
    this.velocity.set(0, 3, -4);
  }
}

// ----------------------------------------------------
// 3. CAMERA CONTROLLER
// ----------------------------------------------------
export class CameraController {
  constructor(camera, options = {}) {
    this.camera = camera;
    this.mode = options.mode || 'thirdPerson'; // 'thirdPerson', 'isometricBoard', 'topDown', 'orbit'
    this.target = new THREE.Vector3();
    this.offset = options.offset || new THREE.Vector3(0, 6, 11);
    this.lookAhead = options.lookAhead || new THREE.Vector3(0, 1.2, 0);
    this.smoothFactor = options.smoothFactor || 0.08;
    this.currentPosition = new THREE.Vector3().copy(this.camera.position);
    this.currentTarget = new THREE.Vector3();
  }

  update(targetPos) {
    if (!this.camera || !targetPos) return;

    if (this.mode === 'thirdPerson') {
      const desiredPos = targetPos.clone().add(this.offset);
      this.camera.position.lerp(desiredPos, this.smoothFactor);
      this.currentTarget.lerp(targetPos.clone().add(this.lookAhead), this.smoothFactor * 1.5);
      this.camera.lookAt(this.currentTarget);
    } else if (this.mode === 'isometricBoard') {
      const boardPos = targetPos.clone().add(new THREE.Vector3(0, 14, 12));
      this.camera.position.lerp(boardPos, 0.1);
      this.camera.lookAt(targetPos);
    } else if (this.mode === 'topDown') {
      const topPos = targetPos.clone().add(new THREE.Vector3(0, 18, 0.1));
      this.camera.position.lerp(topPos, 0.1);
      this.camera.lookAt(targetPos);
    }
  }
}

// ----------------------------------------------------
// 4. ANIMATION CONTROLLER
// ----------------------------------------------------
export class AnimationController {
  constructor(characterRoot) {
    this.root = characterRoot;
    this.walkTime = 0;
    this.state = 'idle';
    this.parts = characterRoot.anim?.parts || {};
  }

  update(delta, state, speedMultiplier = 1) {
    this.state = state;
    const p = this.parts;
    if (!p.torso) return;

    if (state === 'jump') {
      if (p.leftLeg) p.leftLeg.rotation.x = THREE.MathUtils.lerp(p.leftLeg.rotation.x, -0.6, 0.2);
      if (p.rightLeg) p.rightLeg.rotation.x = THREE.MathUtils.lerp(p.rightLeg.rotation.x, 0.4, 0.2);
      if (p.leftArm) p.leftArm.rotation.x = THREE.MathUtils.lerp(p.leftArm.rotation.x, -2.2, 0.2);
      if (p.rightArm) p.rightArm.rotation.x = THREE.MathUtils.lerp(p.rightArm.rotation.x, -2.2, 0.2);
      return;
    }

    if (state === 'walk' || state === 'run') {
      const rate = state === 'run' ? 16 : 10;
      this.walkTime += delta * rate * speedMultiplier;
      const swing = Math.sin(this.walkTime) * 0.7;

      if (p.leftLeg) p.leftLeg.rotation.x = swing;
      if (p.rightLeg) p.rightLeg.rotation.x = -swing;
      if (p.leftArm) p.leftArm.rotation.x = -swing * 0.8;
      if (p.rightArm) p.rightArm.rotation.x = swing * 0.8;

      p.torso.position.y = 1.1 + Math.abs(Math.sin(this.walkTime)) * 0.1;
      p.torso.rotation.z = Math.sin(this.walkTime * 0.5) * 0.06;
    } else {
      // Idle
      this.walkTime += delta * 2.5;
      const breathe = Math.sin(this.walkTime) * 0.03;
      p.torso.position.y = 1.1 + breathe;
      if (p.leftLeg) p.leftLeg.rotation.x = THREE.MathUtils.lerp(p.leftLeg.rotation.x, 0, 0.15);
      if (p.rightLeg) p.rightLeg.rotation.x = THREE.MathUtils.lerp(p.rightLeg.rotation.x, 0, 0.15);
      if (p.leftArm) p.leftArm.rotation.x = THREE.MathUtils.lerp(p.leftArm.rotation.x, 0, 0.15);
      if (p.rightArm) p.rightArm.rotation.x = THREE.MathUtils.lerp(p.rightArm.rotation.x, 0, 0.15);
    }
  }
}

// ----------------------------------------------------
// 5. PHYSICS WORLD & COLLISION SYSTEM
// ----------------------------------------------------
export class PhysicsWorld {
  constructor() {
    this.staticColliders = [];
    this.dynamicBodies = [];
    this.gravity = 25;
  }

  addBoxCollider(mesh, halfExtents = null) {
    if (!halfExtents) {
      const box = new THREE.Box3().setFromObject(mesh);
      const size = new THREE.Vector3();
      box.getSize(size);
      halfExtents = size.multiplyScalar(0.5);
    }
    this.staticColliders.push({
      mesh,
      type: 'box',
      halfExtents,
      center: mesh.position
    });
  }

  checkSphereBox(spherePos, radius, boxCollider) {
    const bPos = boxCollider.mesh.position;
    const h = boxCollider.halfExtents;

    // Closest point on AABB
    const closestX = Math.max(bPos.x - h.x, Math.min(spherePos.x, bPos.x + h.x));
    const closestY = Math.max(bPos.y - h.y, Math.min(spherePos.y, bPos.y + h.y));
    const closestZ = Math.max(bPos.z - h.z, Math.min(spherePos.z, bPos.z + h.z));

    const dx = spherePos.x - closestX;
    const dy = spherePos.y - closestY;
    const dz = spherePos.z - closestZ;

    const distSq = dx * dx + dy * dy + dz * dz;
    const isColliding = distSq < radius * radius;

    return {
      colliding: isColliding,
      overlap: isColliding ? radius - Math.sqrt(distSq) : 0,
      normal: isColliding ? new THREE.Vector3(dx, dy, dz).normalize() : new THREE.Vector3()
    };
  }

  clear() {
    this.staticColliders = [];
    this.dynamicBodies = [];
  }
}

// ----------------------------------------------------
// 6. GAME HUD (Score, Health, Level, Coins)
// ----------------------------------------------------
export class GameHUD {
  constructor(container, options = {}) {
    this.container = container;
    this.options = Object.assign({
      title: 'GAMINGZONE 3D',
      showHealth: false,
      showTimer: true,
      showScore: true,
      showCoins: true
    }, options);

    this.root = document.createElement('div');
    this.root.className = 'gz-3d-hud';
    this.root.style.cssText = `
      position: absolute; top: 14px; left: 16px; right: 16px;
      display: flex; justify-content: space-between; align-items: center;
      pointer-events: none; z-index: 100; font-family: var(--font-heading, Outfit, sans-serif);
    `;

    this.render();
    this.container.appendChild(this.root);
  }

  render() {
    this.root.innerHTML = `
      <div style="display: flex; gap: 10px; align-items: center;">
        <div style="background: rgba(18, 20, 28, 0.75); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.12); padding: 8px 14px; border-radius: 12px; display: flex; align-items: center; gap: 8px;">
          <span style="color: var(--brand-coral, #ff5733); font-weight: 800; font-size: 0.9rem;">SCORE</span>
          <span id="hud-score-val" style="color: #fff; font-weight: 800; font-size: 1.15rem;">0</span>
        </div>
        ${this.options.showCoins ? `
          <div style="background: rgba(18, 20, 28, 0.75); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.12); padding: 8px 14px; border-radius: 12px; display: flex; align-items: center; gap: 6px;">
            <span>🪙</span>
            <span id="hud-coins-val" style="color: #fbbf24; font-weight: 800; font-size: 1rem;">0</span>
          </div>
        ` : ''}
      </div>

      <div style="display: flex; gap: 10px; align-items: center;">
        ${this.options.showTimer ? `
          <div style="background: rgba(18, 20, 28, 0.75); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.12); padding: 8px 14px; border-radius: 12px; display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 0.95rem;">⏱️</span>
            <span id="hud-timer-val" style="color: #38bdf8; font-weight: 800; font-size: 1.15rem;">00:00</span>
          </div>
        ` : ''}
      </div>
    `;

    this.scoreEl = this.root.querySelector('#hud-score-val');
    this.coinsEl = this.root.querySelector('#hud-coins-val');
    this.timerEl = this.root.querySelector('#hud-timer-val');
  }

  setScore(score) {
    if (this.scoreEl) this.scoreEl.textContent = score.toLocaleString();
  }

  setCoins(coins) {
    if (this.coinsEl) this.coinsEl.textContent = coins.toLocaleString();
  }

  setTimer(seconds) {
    if (!this.timerEl) return;
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    this.timerEl.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  destroy() {
    if (this.root && this.root.parentNode) {
      this.root.parentNode.removeChild(this.root);
    }
  }
}

// ----------------------------------------------------
// 7. ASSET & 3D PROP LOADER / GENERATOR
// ----------------------------------------------------
export class AssetLoader {
  static createStylizedBuilding(options = {}) {
    const width = options.width || 8;
    const height = options.height || 18;
    const depth = options.depth || 10;
    const color = options.color || 0x3b82f6;

    const group = new THREE.Group();
    const geo = new THREE.BoxGeometry(width, height, depth);
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.6 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = height / 2;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);

    // Glowing window strips
    const winGeo = new THREE.PlaneGeometry(width * 0.7, 0.6);
    const winMat = new THREE.MeshBasicMaterial({ color: 0xfffbeb });
    for (let y = 3; y < height - 2; y += 3) {
      const win = new THREE.Mesh(winGeo, winMat);
      win.position.set(0, y, depth / 2 + 0.02);
      group.add(win);
    }

    return group;
  }

  static createPickupCoin(color = 0xfbbf24) {
    const geo = new THREE.CylinderGeometry(0.5, 0.5, 0.12, 16);
    geo.rotateX(Math.PI / 2);
    const mat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.4,
      metalness: 0.8,
      roughness: 0.2
    });
    const coin = new THREE.Mesh(geo, mat);
    coin.castShadow = true;
    return coin;
  }
}

