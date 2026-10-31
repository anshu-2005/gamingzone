/* ====================================================
   TINY CHAOS KITCHEN — GAMINGZONE 3D
   Fast-Paced 3D Cartoon Restaurant Rush Simulator!
   Grill patties, chop veggies, plate orders & dodge kitchen chaos!
   ==================================================== */

import * as THREE from 'three';
import { ThreeGameEngineBase } from '../core/ThreeGameEngineBase.js';
import { GameState } from '../core/GameEngineBase.js';
import { sounds } from '../core/soundFX.js';

export class TinyChaosKitchenGame extends ThreeGameEngineBase {
  constructor(container, onGameOver, config = null) {
    super(container, onGameOver, Object.assign({
      title: 'Tiny Chaos Kitchen',
      timeLimit: 85,
      clearColor: 0x1e1b4b,
      fogColor: 0x1e1b4b,
      fogNear: 25,
      fogFar: 85,
      cameraOffset: new THREE.Vector3(0, 13, 13)
    }, config));

    this.chef = null;
    this.velocity = new THREE.Vector3();
    this.moveSpeed = 13.5;
    this.carriedItem = null; // null | 'raw_patty' | 'cooked_patty' | 'lettuce' | 'chopped_lettuce' | 'bun' | 'burger'
    this.carriedMesh = null;

    // Kitchen Stations & Cooking State
    this.stations = {};
    this.grillTimer = 0;
    this.grillState = 'empty'; // 'empty' | 'cooking' | 'done' | 'burnt'
    this.orders = [];
    this.ordersCompleted = 0;
    this.targetOrders = 4;

    // Moving Hazards (Robotic Roombas & Slippery Slicks)
    this.hazards = [];
    this.isSliding = false;
    this.slideTimer = 0;

    // HUD
    this.hudElement = null;

    if (this.isWebGLAvailable) {
      this.initKitchen();
      this.initChef();
      this.initOrders();
      this.createHUD();
      this.attach3DTouchControls();
      this.showStartCard({
        title: 'TINY CHAOS KITCHEN 3D',
        icon: '👨‍🍳',
        objective: 'Prepare 4 Deluxe Burgers! Grab ingredients -> Grill patties -> Chop lettuce -> Plate -> Serve at the counter before time runs out!',
        controls: 'WASD / Arrows to move • SPACE or Enter to Interact/Pick up/Cook • Avoid slick puddles!'
      });
      this.startLoop();
    }
  }

  // 1. Build Colorful 3D Restaurant Kitchen
  initKitchen() {
    // Checkerboard Tile Floor
    const floorGeo = new THREE.BoxGeometry(24, 0.8, 18);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x312e81, roughness: 0.3 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -0.4;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Kitchen Perimeter Walls
    const wallGeo = new THREE.BoxGeometry(24, 6, 0.8);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x4338ca, roughness: 0.6 });
    const backWall = new THREE.Mesh(wallGeo, wallMat);
    backWall.position.set(0, 3, -9);
    backWall.receiveShadow = true;
    this.scene.add(backWall);

    // 1. Patty Crate (Left-Back)
    this.createCounterStation('patty_crate', -8, -6, 0xf97316, 'RAW PATTIES', '🥩');

    // 2. Veggie Basket (Left-Front)
    this.createCounterStation('veggie_basket', -8, 2, 0x10b981, 'FRESH LETTUCE', '🥬');

    // 3. Bun Station (Center-Back)
    this.createCounterStation('bun_crate', -2, -6, 0xfbbf24, 'BURGER BUNS', '🍞');

    // 4. Sizzling Grill (Center-Right Back)
    this.createCounterStation('grill', 4, -6, 0xef4444, 'GRILL STOVE', '🔥');

    // 5. Chopping Board (Right-Front)
    this.createCounterStation('cutting_board', 8, 2, 0x8b5cf6, 'CHOPPING BOARD', '🔪');

    // 6. Assembly & Serving Delivery Window (Right-Center)
    this.createCounterStation('delivery_counter', 8, -4, 0x06b6d4, 'SERVING WINDOW', '🛎️');

    // Slippery Butter Slicks
    const slickGeo = new THREE.CylinderGeometry(1.8, 1.8, 0.05, 16);
    const slickMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      roughness: 0.05,
      metalness: 0.1,
      transparent: true,
      opacity: 0.85
    });
    [-3, 2].forEach((x, idx) => {
      const slick = new THREE.Mesh(slickGeo, slickMat);
      slick.position.set(x, 0.02, idx === 0 ? 0 : 3);
      this.scene.add(slick);
      this.hazards.push({ mesh: slick, radius: 1.8, type: 'slick' });
    });

    // Runaway Roombas Patrolling Aisles
    const roombaGeo = new THREE.CylinderGeometry(1.1, 1.1, 0.4, 20);
    const roombaMat = new THREE.MeshStandardMaterial({ color: 0xe11d48, metalness: 0.5, roughness: 0.2 });
    const r1 = new THREE.Mesh(roombaGeo, roombaMat);
    r1.position.set(0, 0.2, 0);
    r1.castShadow = true;
    this.scene.add(r1);
    this.hazards.push({ mesh: r1, radius: 1.2, speed: 4, dir: 1, minX: -6, maxX: 6, type: 'roomba' });
  }

  createCounterStation(id, x, z, color, labelText, iconEmoji) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const baseGeo = new THREE.BoxGeometry(3.2, 1.8, 2.4);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.4 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.9;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    const topGeo = new THREE.BoxGeometry(3.4, 0.25, 2.6);
    const topMat = new THREE.MeshStandardMaterial({ color, roughness: 0.2, metalness: 0.2 });
    const top = new THREE.Mesh(topGeo, topMat);
    top.position.y = 1.85;
    top.castShadow = true;
    group.add(top);

    // Glowing Station Icon floating above
    const iconGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    const iconMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.6 });
    const iconMesh = new THREE.Mesh(iconGeo, iconMat);
    iconMesh.position.y = 3.2;
    group.add(iconMesh);

    this.scene.add(group);
    this.stations[id] = { id, group, position: new THREE.Vector3(x, 1, z), radius: 2.5, state: null };
  }

  // 2. Initialize Cartoon Chef Pierre
  initChef() {
    this.chef = this.createStylizedCharacter({
      bodyColor: 0xffffff, // White chef coat
      skinColor: 0xffdbac,
      pantsColor: 0x1e293b,
      characterType: 'chef'
    });
    this.chef.position.set(0, 0, 2);
    this.scene.add(this.chef);

    // Hands attachment slot for carried food
    this.handsSlot = new THREE.Group();
    this.handsSlot.position.set(0, 1.3, 0.65);
    this.chef.add(this.handsSlot);
  }

  initOrders() {
    this.orders = [
      { id: 1, name: 'Classic Burger', reqs: ['cooked_patty', 'bun'] },
      { id: 2, name: 'Deluxe Burger', reqs: ['cooked_patty', 'chopped_lettuce', 'bun'] },
      { id: 3, name: 'Salad Wrap', reqs: ['chopped_lettuce', 'bun'] },
      { id: 4, name: 'Double Deluxe', reqs: ['cooked_patty', 'chopped_lettuce', 'bun'] }
    ];
  }

  // 3. Create Kitchen HUD
  createHUD() {
    this.hudElement = document.createElement('div');
    this.hudElement.style.cssText = `
      position: absolute; top: 14px; left: 16px; right: 16px;
      display: flex; justify-content: space-between; align-items: center;
      pointer-events: none; z-index: 50; font-family: var(--font-heading, sans-serif);
    `;
    this.hudElement.innerHTML = `
      <div style="background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(8px); padding: 8px 16px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); color: #fff;">
        <span style="color: #ff5733; font-weight: 800;">📋 CURRENT ORDER:</span>
        <span id="kitchen-order-name" style="font-weight: 800; font-size: 1rem; color: #facc15; margin-left: 6px;">Classic Burger</span>
      </div>
      <div style="background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(8px); padding: 8px 16px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); color: #fff;">
        <span style="color: #38bdf8; font-weight: 800;">⏱️ TIME:</span>
        <span id="kitchen-timer" style="font-weight: 800; font-size: 1.1rem; margin-left: 6px;">85s</span>
      </div>
      <div style="background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(8px); padding: 8px 16px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); color: #fff;">
        <span style="color: #34d399; font-weight: 800;">⭐ ORDERS:</span>
        <span id="kitchen-score" style="font-weight: 800; font-size: 1.1rem; margin-left: 6px;">0 / 4</span>
      </div>
    `;
    this.container.appendChild(this.hudElement);
  }

  // 4. Update Kitchen Loop
  updateGame(delta) {
    if (this.state !== GameState.PLAYING) return;

    this.timeLeft -= delta;
    const timerElem = document.getElementById('kitchen-timer');
    if (timerElem) timerElem.textContent = `${Math.max(0, Math.ceil(this.timeLeft))}s`;

    if (this.timeLeft <= 0) {
      this.state = GameState.GAME_OVER;
      sounds.playGameOver();
      this.showGameOverCard({
        title: 'KITCHEN SHIFT OVER!',
        score: this.score,
        reason: 'Orders piled up and dinner rush ended! Try again to finish the shift!'
      });
      return;
    }

    // Grill Cooking State Simulation
    if (this.grillState === 'cooking') {
      this.grillTimer += delta;
      if (this.grillTimer > 3.0) {
        this.grillState = 'done';
        sounds.playDrop();
        this.createParticleBurst(this.stations.grill.position, 12, 0x10b981, 0.25);
      }
    }

    // Update Roomba Patrols
    for (const h of this.hazards) {
      if (h.type === 'roomba') {
        h.mesh.position.x += h.speed * h.dir * delta;
        if (h.mesh.position.x > h.maxX) h.dir = -1;
        if (h.mesh.position.x < h.minX) h.dir = 1;

        if (h.mesh.position.distanceTo(this.chef.position) < h.radius + 0.8) {
          this.triggerKitchenKnockback(h.mesh.position);
        }
      } else if (h.type === 'slick') {
        if (h.mesh.position.distanceTo(this.chef.position) < h.radius) {
          this.isSliding = true;
          this.slideTimer = 0.6;
        }
      }
    }

    // Chef Movement Input
    const input = this.getMovementInput();
    const isMoving = input.hasInput;

    if (this.isSliding) {
      this.slideTimer -= delta;
      if (this.slideTimer <= 0) this.isSliding = false;
      // Sliding inertia
      this.velocity.x *= 0.98;
      this.velocity.z *= 0.98;
    } else {
      const targetVelX = input.x * this.moveSpeed;
      const targetVelZ = (input.z || 0) * this.moveSpeed;
      this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, targetVelX, 0.18);
      this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, targetVelZ, 0.18);

      if (Math.hypot(this.velocity.x, this.velocity.z) > 0.4) {
        const targetAngle = Math.atan2(this.velocity.x, this.velocity.z);
        this.chef.rotation.y = THREE.MathUtils.lerp(this.chef.rotation.y, targetAngle, 0.2);
      }
    }

    this.chef.position.addScaledVector(this.velocity, delta);

    // Keep Chef inside room bounds
    this.chef.position.x = THREE.MathUtils.clamp(this.chef.position.x, -10.5, 10.5);
    this.chef.position.z = THREE.MathUtils.clamp(this.chef.position.z, -7.5, 7.5);

    // Check Station Interactions when Action / Jump Key is pressed
    if (input.isJump) {
      this.checkStationInteraction();
    }

    // Procedural Character Animation
    const speedMagnitude = Math.hypot(this.velocity.x, this.velocity.z);
    this.updateCharacterAnimation(this.chef, delta, isMoving, true, speedMagnitude / this.moveSpeed);

    // Smooth Camera Follow
    this.updateCameraFollow(this.chef);
  }

  // 5. Station Interaction Mechanics
  checkStationInteraction() {
    let nearestStation = null;
    let minDist = 999;

    for (const key in this.stations) {
      const s = this.stations[key];
      const dist = s.position.distanceTo(this.chef.position);
      if (dist < s.radius && dist < minDist) {
        minDist = dist;
        nearestStation = s;
      }
    }

    if (!nearestStation) return;

    sounds.playClick();

    // 1. Patty Crate -> Grab raw patty
    if (nearestStation.id === 'patty_crate' && !this.carriedItem) {
      this.setCarriedItem('raw_patty', 0x991b1b, 'Beef Patty');
      sounds.playDrop();
    }
    // 2. Veggie Basket -> Grab lettuce
    else if (nearestStation.id === 'veggie_basket' && !this.carriedItem) {
      this.setCarriedItem('lettuce', 0x22c55e, 'Crisp Lettuce');
      sounds.playDrop();
    }
    // 3. Bun Crate -> Grab bun
    else if (nearestStation.id === 'bun_crate' && !this.carriedItem) {
      this.setCarriedItem('bun', 0xd97706, 'Burger Bun');
      sounds.playDrop();
    }
    // 4. Chopping Board -> Chop lettuce into salad
    else if (nearestStation.id === 'cutting_board') {
      if (this.carriedItem === 'lettuce') {
        sounds.playHit();
        this.createParticleBurst(nearestStation.position, 12, 0x22c55e, 0.2);
        this.setCarriedItem('chopped_lettuce', 0x4ade80, 'Chopped Salad');
      }
    }
    // 5. Sizzling Grill -> Cook raw patty
    else if (nearestStation.id === 'grill') {
      if (this.carriedItem === 'raw_patty' && this.grillState === 'empty') {
        this.clearCarriedItem();
        this.grillState = 'cooking';
        this.grillTimer = 0;
        sounds.playDrop();
        this.createParticleBurst(nearestStation.position, 10, 0xf97316, 0.25);
      } else if (this.grillState === 'done' && !this.carriedItem) {
        this.grillState = 'empty';
        this.setCarriedItem('cooked_patty', 0x78350f, 'Sizzling Patty');
        sounds.playMatch();
        this.createParticleBurst(nearestStation.position, 10, 0x10b981, 0.2);
      }
    }
    // 6. Delivery Window -> Serve Completed Dish!
    else if (nearestStation.id === 'delivery_counter') {
      if (this.carriedItem) {
        this.handleServeItem();
      }
    }
  }

  setCarriedItem(type, color, label) {
    this.clearCarriedItem();
    this.carriedItem = type;

    const geo = new THREE.CylinderGeometry(0.5, 0.5, 0.25, 12);
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.3 });
    this.carriedMesh = new THREE.Mesh(geo, mat);
    this.handsSlot.add(this.carriedMesh);
  }

  clearCarriedItem() {
    this.carriedItem = null;
    if (this.carriedMesh) {
      this.handsSlot.remove(this.carriedMesh);
      this.carriedMesh.geometry.dispose();
      this.carriedMesh.material.dispose();
      this.carriedMesh = null;
    }
  }

  handleServeItem() {
    const currentOrder = this.orders[this.ordersCompleted];
    if (!currentOrder) return;

    sounds.playVictory();
    this.createParticleBurst(this.stations.delivery_counter.position, 25, 0x10b981, 0.35);
    this.clearCarriedItem();

    this.ordersCompleted++;
    this.score += 1200;

    const sElem = document.getElementById('kitchen-score');
    if (sElem) sElem.textContent = `${this.ordersCompleted} / ${this.targetOrders}`;

    if (this.ordersCompleted < this.orders.length) {
      const nextOrder = this.orders[this.ordersCompleted];
      const oElem = document.getElementById('kitchen-order-name');
      if (oElem) oElem.textContent = nextOrder.name;
    } else {
      this.triggerVictory();
    }
  }

  triggerKitchenKnockback(impactPoint) {
    sounds.playHit();
    this.createParticleBurst(this.chef.position, 12, 0xef4444, 0.25);
    const dir = this.chef.position.clone().sub(impactPoint).normalize();
    this.velocity.x = dir.x * 14;
    this.velocity.z = dir.z * 14;

    // Drop item if carrying
    if (this.carriedItem) {
      sounds.playDrop();
      this.clearCarriedItem();
    }
  }

  triggerVictory() {
    this.state = GameState.COMPLETED;
    sounds.playVictory();

    const timeBonus = Math.max(0, Math.round(this.timeLeft * 40));
    const finalScore = this.score + timeBonus;

    this.createParticleBurst(this.chef.position, 40, 0x10b981, 0.45);

    this.showVictoryCard({
      title: 'KITCHEN RUSH MASTERED!',
      score: finalScore,
      stats: [
        { label: 'Orders Delivered', value: `${this.ordersCompleted} / ${this.targetOrders}` },
        { label: 'Time Remaining', value: `${Math.ceil(this.timeLeft)}s` },
        { label: 'Chef Tips Bonus', value: `+${timeBonus}` }
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
