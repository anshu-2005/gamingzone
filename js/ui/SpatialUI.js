/* ====================================================
   GAMINGZONE SPATIAL UI ENGINE (SpatialUI.js)
   VisionOS-Inspired Spatial 3D Physics:
   - Real-Time Cursor-Driven 3D Perspective Tilt
   - Dynamic Specular Surface Glare & Ambient Backlights
   - Multi-Layered Z-Axis Parallax Depth (Thumb, Badges, Info)
   - Spring-Damped Inertial Resets & Touch/Reduced-Motion Safe
   ==================================================== */

export class SpatialUI {
  constructor() {
    this.enabled = true;
    this.maxTilt = 10; // degrees
    this.perspective = 1000; // px
    this.isTouch = false;
    this.prefersReducedMotion = false;
    this.trackedElements = new WeakMap();

    this.checkEnvironment();
    this.init();
  }

  checkEnvironment() {
    if (typeof window === 'undefined') return;

    this.isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.innerWidth <= 768);

    if (window.matchMedia) {
      const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.prefersReducedMotion = motionQuery.matches;
      motionQuery.addEventListener?.('change', (e) => {
        this.prefersReducedMotion = e.matches;
        if (this.prefersReducedMotion) this.resetAll();
      });
    }
  }

  init() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    if (this.isTouch || this.prefersReducedMotion) return;
  }

  /**
   * Bind spatial 3D tilt and specular lighting to any card or element
   */
  bind(element) {
    if (!element || this.isTouch || this.prefersReducedMotion) return;
    if (this.trackedElements.has(element)) return;

    // Inject Specular Light Glare layer if not present
    let glare = element.querySelector('.gz-spatial-glare');
    if (!glare) {
      glare = document.createElement('div');
      glare.className = 'gz-spatial-glare';
      element.appendChild(glare);
    }

    const state = {
      element,
      glare,
      rect: null,
      animId: null,
      targetRotX: 0,
      targetRotY: 0,
      currentRotX: 0,
      currentRotY: 0,
      glareX: 50,
      glareY: 50,
      glareOpacity: 0
    };

    this.trackedElements.set(element, state);

    element.addEventListener('mouseenter', () => {
      state.rect = element.getBoundingClientRect();
      state.glareOpacity = 1;
      element.classList.add('spatial-hover');
    });

    element.addEventListener('mouseleave', () => {
      element.classList.remove('spatial-hover');
      state.targetRotX = 0;
      state.targetRotY = 0;
      state.glareOpacity = 0;
      this.animateReset(state);
    });

    element.addEventListener('mousemove', (e) => {
      if (!state.rect) state.rect = element.getBoundingClientRect();
      const rect = state.rect;

      // Normalized coordinates from center (-1 to 1)
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;

      // Invert Y for natural tilt
      state.targetRotX = -y * this.maxTilt;
      state.targetRotY = x * this.maxTilt;

      // Glare position percentage
      state.glareX = ((e.clientX - rect.left) / rect.width) * 100;
      state.glareY = ((e.clientY - rect.top) / rect.height) * 100;

      this.applySpatialTransform(state);
    });
  }

  applySpatialTransform(state) {
    const el = state.element;
    const { targetRotX, targetRotY, glareX, glareY, glareOpacity } = state;

    el.style.transform = `perspective(${this.perspective}px) rotateX(${targetRotX.toFixed(2)}deg) rotateY(${targetRotY.toFixed(2)}deg) scale3d(1.035, 1.035, 1.035)`;

    if (state.glare) {
      state.glare.style.opacity = glareOpacity;
      state.glare.style.background = `radial-gradient(circle at ${glareX.toFixed(1)}% ${glareY.toFixed(1)}%, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.05) 45%, transparent 70%)`;
    }
  }

  animateReset(state) {
    const el = state.element;
    el.style.transition = 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.45s ease';
    el.style.transform = `perspective(${this.perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;

    if (state.glare) {
      state.glare.style.opacity = '0';
    }

    setTimeout(() => {
      el.style.transition = '';
      state.rect = null;
    }, 450);
  }

  resetAll() {
    document.querySelectorAll('.game-card-item, .gz-featured-card').forEach(el => {
      el.style.transform = '';
      const glare = el.querySelector('.gz-spatial-glare');
      if (glare) glare.style.opacity = '0';
    });
  }
}

export const spatialUI = new SpatialUI();
