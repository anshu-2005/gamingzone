/* ====================================================
   GAMINGZONE 3D THREE.JS GAME ENGINE BASE & ARCHITECTURE
   High-Performance WebGL2 Engine with Soft Shadows,
   Stylized 3D Lighting, Smooth Follow Cameras,
   Procedural Character Animations & Physics Integration
   ==================================================== */

import * as THREE from 'three';
import { GameEngineBase, GameState } from './GameEngineBase.js';
import { sounds } from './soundFX.js';
export * from './ThreeGameArchitecture.js';

export class ThreeGameEngineBase extends GameEngineBase {
  constructor(container, onGameOver, config = {}) {
    super(container, onGameOver, Object.assign({
      fov: 60,
      near: 0.1,
      far: 1000,
      shadows: true,
      fogColor: 0x0c0e14,
      fogNear: 25,
      fogFar: 140,
      clearColor: 0x0c0e14
    }, config));

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.startTime = performance.now();
    this.lastTime = performance.now();

    // Lighting & Shadows
    this.sunLight = null;
    this.ambientLight = null;
    this.hemiLight = null;

    // Camera follow configuration
    this.cameraTarget = new THREE.Vector3(0, 0, 0);
    this.cameraOffset = new THREE.Vector3(0, 7, 13);
    this.cameraSmoothFactor = 0.08;
    this.cameraLookAhead = new THREE.Vector3(0, 1.2, 0);

    // Character & Entity Registry
    this.animatables = [];
    this.updatables = [];
    this.physicsBodies = [];
    this.particleEmitters = [];

    // Input State
    this.keys = {};
    this.touchVector = { x: 0, y: 0 };
    this.isTouchJump = false;

    // Resize Observer
    this.resizeObserver = null;
    this.isWebGLAvailable = this.checkWebGLSupport();

    if (!this.isWebGLAvailable) {
      this.showWebGLFallback();
      return;
    }

    this.initThree();
    this.initDefaultLights();
    this.initInputListeners();
  }

  // 1. WebGL Support Verification
  checkWebGLSupport() {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }

  showWebGLFallback() {
    this.state = GameState.ERROR;
    const fallback = document.createElement('div');
    fallback.style.cssText = `
      position: absolute; inset: 0; display: flex; flex-direction: column;
      align-items: center; justify-content: center; background: #0c0d12;
      color: #fff; font-family: sans-serif; text-align: center; padding: 20px;
    `;
    fallback.innerHTML = `
      <div style="font-size: 3rem; margin-bottom: 12px;">⚠️</div>
      <h3 style="margin-bottom: 8px;">WebGL Not Supported</h3>
      <p style="color: #94a3b8; max-width: 400px; font-size: 0.9rem;">
        Your browser or graphics driver does not currently support WebGL hardware acceleration required for 3D games.
      </p>
    `;
    this.container.appendChild(fallback);
  }

  // 2. Initialize Three.js Viewport
  initThree() {
    this.container.style.position = 'relative';
    this.container.style.overflow = 'hidden';
    this.container.style.background = '#0c0e14';

    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 540;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.config.clearColor);
    if (this.config.fogFar > 0) {
      this.scene.fog = new THREE.Fog(this.config.fogColor, this.config.fogNear, this.config.fogFar);
    }

    // Camera
    this.camera = new THREE.PerspectiveCamera(this.config.fov, width / height, this.config.near, this.config.far);
    this.camera.position.set(0, 10, 15);
    this.camera.lookAt(0, 0, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: window.devicePixelRatio <= 1.5,
      powerPreference: 'high-performance',
      alpha: false
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    if (this.config.shadows) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    this.canvas = this.renderer.domElement;
    this.canvas.style.display = 'block';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.container.appendChild(this.canvas);

    // Responsive Auto-Resize
    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(this.container);
  }

  handleResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (width === 0 || height === 0) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  // 3. Default Studio & Environmental Lighting
  initDefaultLights() {
    // Ambient Soft Fill
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    this.scene.add(this.ambientLight);

    // Warm Hemisphere (Sky vs Ground)
    this.hemiLight = new THREE.HemisphereLight(0xffeeb1, 0x080820, 0.65);
    this.hemiLight.position.set(0, 50, 0);
    this.scene.add(this.hemiLight);

    // Main Directional Sun with Soft Shadows
    this.sunLight = new THREE.DirectionalLight(0xfff7ed, 1.4);
    this.sunLight.position.set(25, 45, 30);
    this.sunLight.castShadow = this.config.shadows;

    if (this.sunLight.castShadow) {
      this.sunLight.shadow.mapSize.width = 1024;
      this.sunLight.shadow.mapSize.height = 1024;
      this.sunLight.shadow.camera.near = 0.5;
      this.sunLight.shadow.camera.far = 120;
      const d = 35;
      this.sunLight.shadow.camera.left = -d;
      this.sunLight.shadow.camera.right = d;
      this.sunLight.shadow.camera.top = d;
      this.sunLight.shadow.camera.bottom = -d;
      this.sunLight.shadow.bias = -0.0005;
    }

    this.scene.add(this.sunLight);
  }

  // 4. Input Listener Management
  initInputListeners() {
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

    this.trackedListeners.push(
      { target: window, type: 'keydown', listener: onKeyDown },
      { target: window, type: 'keyup', listener: onKeyUp }
    );
  }

  // Check movement vector from keyboard or touch
  getMovementInput() {
    let x = 0;
    let z = 0;

    // Keyboard
    if (this.keys['KeyW'] || this.keys['ArrowUp']) z -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) z += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) x -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) x += 1;

    // Touch overlay blend
    if (Math.abs(this.touchVector.x) > 0.05 || Math.abs(this.touchVector.y) > 0.05) {
      x = this.touchVector.x;
      z = this.touchVector.y;
    }

    // Normalize diagonal
    const len = Math.hypot(x, z);
    if (len > 1) {
      x /= len;
      z /= len;
    }

    const isJump = Boolean(this.keys['Space'] || this.isTouchJump);

    return { x, z, isJump, hasInput: len > 0.1 || isJump };
  }

  // 5. Stylized 3D Character Factory (Low-poly, Expressive & High FPS)
  createStylizedCharacter(options = {}) {
    const config = Object.assign({
      bodyColor: 0xff5733,
      skinColor: 0xffdbac,
      pantsColor: 0x2563eb,
      hatColor: 0xffd166,
      characterType: 'guy', // 'guy' | 'blob' | 'chef' | 'monkey'
      scale: 1
    }, options);

    const root = new THREE.Group();
    root.name = 'StylizedCharacter';

    // Materials
    const skinMat = new THREE.MeshStandardMaterial({ color: config.skinColor, roughness: 0.6 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: config.bodyColor, roughness: 0.5 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: config.pantsColor, roughness: 0.7 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
    const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });

    // Torso / Body
    const torsoGeo = new THREE.CylinderGeometry(0.45, 0.4, 0.9, 12);
    const torso = new THREE.Mesh(torsoGeo, shirtMat);
    torso.position.y = 1.1;
    torso.castShadow = true;
    root.add(torso);

    // Head
    const headGeo = new THREE.SphereGeometry(0.45, 16, 14);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 1.85;
    head.castShadow = true;
    root.add(head);

    // Expressive Eyes (Big cartoon eyes)
    const eyeGeo = new THREE.SphereGeometry(0.12, 10, 10);
    const pupilGeo = new THREE.SphereGeometry(0.06, 8, 8);

    const leftEye = new THREE.Mesh(eyeGeo, eyeWhiteMat);
    leftEye.position.set(-0.16, 0.05, 0.38);
    const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
    leftPupil.position.set(0, 0, 0.08);
    leftEye.add(leftPupil);
    head.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, eyeWhiteMat);
    rightEye.position.set(0.16, 0.05, 0.38);
    const rightPupil = new THREE.Mesh(pupilGeo, pupilMat);
    rightPupil.position.set(0, 0, 0.08);
    rightEye.add(rightPupil);
    head.add(rightEye);

    // Limbs Hierarchy
    const limbMat = config.characterType === 'chef' ? shirtMat : skinMat;
    const armGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.6, 8);
    armGeo.translate(0, -0.3, 0);

    const leftArm = new THREE.Mesh(armGeo, limbMat);
    leftArm.position.set(-0.55, 1.45, 0);
    leftArm.castShadow = true;
    root.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, limbMat);
    rightArm.position.set(0.55, 1.45, 0);
    rightArm.castShadow = true;
    root.add(rightArm);

    const legGeo = new THREE.CylinderGeometry(0.15, 0.13, 0.7, 8);
    legGeo.translate(0, -0.35, 0);

    const leftLeg = new THREE.Mesh(legGeo, pantsMat);
    leftLeg.position.set(-0.24, 0.7, 0);
    leftLeg.castShadow = true;
    root.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, pantsMat);
    rightLeg.position.set(0.24, 0.7, 0);
    rightLeg.castShadow = true;
    root.add(rightLeg);

    // Character Special Accessories
    if (config.characterType === 'chef') {
      // Tall Chef Hat
      const hatBase = new THREE.CylinderGeometry(0.42, 0.42, 0.2, 12);
      const hatTop = new THREE.SphereGeometry(0.55, 12, 10);
      const hatMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
      const hatGroup = new THREE.Group();
      const bMesh = new THREE.Mesh(hatBase, hatMat);
      bMesh.position.y = 0.4;
      const tMesh = new THREE.Mesh(hatTop, hatMat);
      tMesh.position.y = 0.75;
      tMesh.scale.set(1, 0.8, 1);
      hatGroup.add(bMesh, tMesh);
      head.add(hatGroup);
    } else if (config.characterType === 'guy') {
      // Baseball Cap / Beanie
      const capGeo = new THREE.SphereGeometry(0.48, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5);
      const capMat = new THREE.MeshStandardMaterial({ color: config.hatColor, roughness: 0.4 });
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.y = 0.1;
      const brimGeo = new THREE.BoxGeometry(0.4, 0.05, 0.35);
      const brim = new THREE.Mesh(brimGeo, capMat);
      brim.position.set(0, 0.1, 0.45);
      cap.add(brim);
      head.add(cap);
    }

    root.scale.setScalar(config.scale);

    // Procedural Animation State Holder
    root.anim = {
      walkTime: 0,
      state: 'idle', // 'idle' | 'walk' | 'run' | 'jump' | 'stumble' | 'victory' | 'fail'
      wobbleAngle: 0,
      squash: 1,
      blinkTimer: 0,
      parts: { head, torso, leftArm, rightArm, leftLeg, rightLeg, leftEye, rightEye }
    };

    return root;
  }

  // 6. Update Procedural Animation for Character
  updateCharacterAnimation(character, delta, isMoving, isGrounded, speed = 1) {
    if (!character || !character.anim) return;
    const a = character.anim;
    const p = a.parts;

    // Blinking logic
    a.blinkTimer += delta;
    if (a.blinkTimer > 3.5) {
      p.leftEye.scale.y = 0.1;
      p.rightEye.scale.y = 0.1;
      if (a.blinkTimer > 3.65) {
        p.leftEye.scale.y = 1;
        p.rightEye.scale.y = 1;
        a.blinkTimer = Math.random() * 0.5;
      }
    }

    if (!isGrounded) {
      // Airborne / Jump Pose
      p.leftLeg.rotation.x = THREE.MathUtils.lerp(p.leftLeg.rotation.x, -0.6, 0.2);
      p.rightLeg.rotation.x = THREE.MathUtils.lerp(p.rightLeg.rotation.x, 0.4, 0.2);
      p.leftArm.rotation.x = THREE.MathUtils.lerp(p.leftArm.rotation.x, -2.4, 0.2);
      p.rightArm.rotation.x = THREE.MathUtils.lerp(p.rightArm.rotation.x, -2.4, 0.2);
      p.torso.rotation.x = THREE.MathUtils.lerp(p.torso.rotation.x, -0.2, 0.1);
      return;
    }

    if (isMoving) {
      // Walking / Running oscillation
      a.walkTime += delta * 12 * Math.max(0.5, speed);
      const swing = Math.sin(a.walkTime) * 0.75;

      p.leftLeg.rotation.x = swing;
      p.rightLeg.rotation.x = -swing;
      p.leftArm.rotation.x = -swing * 0.8;
      p.rightArm.rotation.x = swing * 0.8;

      // Vertical bounce bob
      p.torso.position.y = 1.1 + Math.abs(Math.sin(a.walkTime)) * 0.12;
      p.head.position.y = 1.85 + Math.abs(Math.sin(a.walkTime)) * 0.1;

      // Slight natural side-to-side torso sway
      p.torso.rotation.z = Math.sin(a.walkTime * 0.5) * 0.08;
    } else {
      // Idle breathing
      a.walkTime += delta * 2.5;
      const breathe = Math.sin(a.walkTime) * 0.03;

      p.leftLeg.rotation.x = THREE.MathUtils.lerp(p.leftLeg.rotation.x, 0, 0.15);
      p.rightLeg.rotation.x = THREE.MathUtils.lerp(p.rightLeg.rotation.x, 0, 0.15);
      p.leftArm.rotation.x = THREE.MathUtils.lerp(p.leftArm.rotation.x, 0, 0.15);
      p.rightArm.rotation.x = THREE.MathUtils.lerp(p.rightArm.rotation.x, 0, 0.15);
      p.torso.rotation.z = THREE.MathUtils.lerp(p.torso.rotation.z, 0, 0.15);

      p.torso.position.y = 1.1 + breathe;
      p.head.position.y = 1.85 + breathe * 1.5;
    }
  }

  // 7. Smooth Third-Person Camera Follow
  updateCameraFollow(targetMesh) {
    if (!targetMesh || !this.camera) return;

    // Desired camera target position (player position + look ahead offset)
    const targetPos = targetMesh.position;
    this.cameraTarget.lerp(targetPos, this.cameraSmoothFactor * 1.5);

    // Compute ideal camera position behind the player
    const idealPos = targetPos.clone().add(this.cameraOffset);
    this.camera.position.lerp(idealPos, this.cameraSmoothFactor);

    // Look at player chest/head
    const lookPoint = this.cameraTarget.clone().add(this.cameraLookAhead);
    this.camera.lookAt(lookPoint);
  }

  // 8. 3D Particle Burst Factory (Stars, Coins, Splashes, Dust)
  createParticleBurst(position, count = 15, color = 0xffd166, scale = 0.25) {
    const geo = new THREE.DodecahedronGeometry(scale, 0);
    const mat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.6,
      roughness: 0.2
    });

    const particles = [];
    for (let i = 0; i < count; i++) {
      const p = new THREE.Mesh(geo, mat);
      p.position.copy(position);
      p.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 12,
        Math.random() * 10 + 4,
        (Math.random() - 0.5) * 12
      );
      p.rotSpeed = new THREE.Vector3(
        Math.random() * 10,
        Math.random() * 10,
        Math.random() * 10
      );
      p.life = 1.0;
      this.scene.add(p);
      particles.push(p);
    }

    this.particleEmitters.push({
      particles,
      update: (delta) => {
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.position.addScaledVector(p.velocity, delta);
          p.velocity.y -= 24 * delta; // gravity
          p.rotation.x += p.rotSpeed.x * delta;
          p.rotation.y += p.rotSpeed.y * delta;
          p.life -= delta * 1.4;
          p.scale.setScalar(Math.max(0, p.life * scale));

          if (p.life <= 0) {
            this.scene.remove(p);
            p.geometry.dispose();
            p.material.dispose();
            particles.splice(i, 1);
          }
        }
        return particles.length > 0;
      }
    });
  }

  // 9. Mobile Touch Virtual Joystick
  attach3DTouchControls() {
    if (this.virtualControlsContainer) return;

    const div = document.createElement('div');
    div.className = 'gz-3d-touch-controls';
    div.style.cssText = `
      position: absolute; bottom: 16px; left: 16px; right: 16px;
      height: 140px; pointer-events: none; display: flex;
      justify-content: space-between; align-items: flex-end; z-index: 100;
    `;

    // Joystick Base
    const joyBase = document.createElement('div');
    joyBase.style.cssText = `
      width: 100px; height: 100px; border-radius: 50%;
      background: rgba(255, 255, 255, 0.12); border: 2px solid rgba(255, 255, 255, 0.25);
      position: relative; pointer-events: auto; touch-action: none;
    `;

    const joyThumb = document.createElement('div');
    joyThumb.style.cssText = `
      width: 44px; height: 44px; border-radius: 50%;
      background: var(--brand-coral, #ff5733); position: absolute;
      top: 28px; left: 28px; pointer-events: none;
      box-shadow: 0 4px 12px rgba(255, 87, 51, 0.5);
    `;
    joyBase.appendChild(joyThumb);

    let activeTouchId = null;
    const center = { x: 50, y: 50 };

    const handleTouch = (touch) => {
      const rect = joyBase.getBoundingClientRect();
      const rawX = touch.clientX - rect.left - center.x;
      const rawY = touch.clientY - rect.top - center.y;
      const dist = Math.hypot(rawX, rawY);
      const maxDist = 36;

      let normX = rawX;
      let normY = rawY;
      if (dist > maxDist) {
        normX = (rawX / dist) * maxDist;
        normY = (rawY / dist) * maxDist;
      }

      joyThumb.style.transform = `translate(${normX}px, ${normY}px)`;
      this.touchVector = { x: normX / maxDist, y: normY / maxDist };
    };

    joyBase.addEventListener('touchstart', (e) => {
      if (activeTouchId === null && e.changedTouches[0]) {
        activeTouchId = e.changedTouches[0].identifier;
        handleTouch(e.changedTouches[0]);
      }
    });

    window.addEventListener('touchmove', (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === activeTouchId) {
          handleTouch(e.changedTouches[i]);
          break;
        }
      }
    });

    const resetJoy = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === activeTouchId) {
          activeTouchId = null;
          joyThumb.style.transform = 'translate(0px, 0px)';
          this.touchVector = { x: 0, y: 0 };
          break;
        }
      }
    };

    window.addEventListener('touchend', resetJoy);
    window.addEventListener('touchcancel', resetJoy);

    // Jump Action Button
    const jumpBtn = document.createElement('button');
    jumpBtn.style.cssText = `
      width: 76px; height: 76px; border-radius: 50%;
      background: rgba(45, 212, 191, 0.25); border: 2px solid var(--brand-mint, #2dd4bf);
      color: #fff; font-size: 1.1rem; font-weight: 800; pointer-events: auto;
      touch-action: none; cursor: pointer; display: flex; align-items: center;
      justify-content: center; box-shadow: 0 4px 16px rgba(45, 212, 191, 0.35);
    `;
    jumpBtn.innerHTML = 'JUMP';

    jumpBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.isTouchJump = true;
    });

    const resetJump = () => {
      this.isTouchJump = false;
    };
    jumpBtn.addEventListener('touchend', resetJump);
    jumpBtn.addEventListener('touchcancel', resetJump);

    div.appendChild(joyBase);
    div.appendChild(jumpBtn);
    this.container.appendChild(div);
    this.virtualControlsContainer = div;
  }

  getElapsedTime() {
    return (performance.now() - this.startTime) / 1000;
  }

  // 10. Master Animation Loop
  startLoop() {
    if (this.animId) cancelAnimationFrame(this.animId);

    const animate = () => {
      if (this.isDestroyed) return;

      this.animId = requestAnimationFrame(animate);

      if (this.state !== GameState.PLAYING) return;

      const now = performance.now();
      const delta = Math.min((now - this.lastTime) / 1000, 0.05);
      this.lastTime = now;

      // Update active game logic
      if (typeof this.updateGame === 'function') {
        this.updateGame(delta);
      }

      // Update registered particle bursts
      for (let i = this.particleEmitters.length - 1; i >= 0; i--) {
        const active = this.particleEmitters[i].update(delta);
        if (!active) {
          this.particleEmitters.splice(i, 1);
        }
      }

      // Render Three.js Scene
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    };

    this.animId = requestAnimationFrame(animate);
  }

  // 11. Clean Resource Disposal (Zero Leaks)
  destroy() {
    this.isDestroyed = true;

    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    // Traverse and clean geometries, textures, materials
    if (this.scene) {
      this.scene.traverse((obj) => {
        if (obj.geometry) {
          obj.geometry.dispose();
        }
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => {
              if (m.map) m.map.dispose();
              m.dispose();
            });
          } else {
            if (obj.material.map) obj.material.map.dispose();
            obj.material.dispose();
          }
        }
      });
    }

    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.forceContextLoss();
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
      this.renderer = null;
    }

    if (this.virtualControlsContainer && this.virtualControlsContainer.parentNode) {
      this.virtualControlsContainer.parentNode.removeChild(this.virtualControlsContainer);
      this.virtualControlsContainer = null;
    }

    super.destroy();
  }
}
