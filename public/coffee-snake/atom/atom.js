/**
 * Atom HTML5 Game Engine Polyfill for Coffee-Snake
 */
(function() {
  window.atom = {
    canvas: null,
    context: null,
    key: {
      LEFT_ARROW: 37,
      UP_ARROW: 38,
      RIGHT_ARROW: 39,
      DOWN_ARROW: 40,
      SPACE: 32
    },
    input: {
      _bindings: {},
      _down: {},
      _pressed: {},
      bind: function(key, action) {
        this._bindings[key] = action;
      },
      pressed: function(action) {
        if (this._pressed[action]) {
          this._pressed[action] = false;
          return true;
        }
        return false;
      },
      state: function(action) {
        return Boolean(this._down[action]);
      }
    },
    Game: function() {
      var self = this;
      atom.canvas = document.querySelector('#canvas_container canvas') || document.querySelector('canvas');
      if (!atom.canvas) {
        atom.canvas = document.createElement('canvas');
        var container = document.getElementById('canvas_container') || document.body;
        container.appendChild(atom.canvas);
      }
      atom.context = atom.canvas.getContext('2d');

      // Setup Keyboard input
      window.addEventListener('keydown', function(e) {
        var action = atom.input._bindings[e.keyCode];
        if (action) {
          e.preventDefault();
          if (!atom.input._down[action]) {
            atom.input._pressed[action] = true;
          }
          atom.input._down[action] = true;
        }
      });

      window.addEventListener('keyup', function(e) {
        var action = atom.input._bindings[e.keyCode];
        if (action) {
          e.preventDefault();
          atom.input._down[action] = false;
        }
      });

      // Touch / Virtual Click Support
      var addVirtualButton = function(label, action, x, y) {
        // Will be rendered or handled via screen tap
      };

      atom.canvas.addEventListener('pointerdown', function(e) {
        // If not started, tapping canvas acts as Space to start
        atom.input._pressed['toggle_pause'] = true;
      });

      // Mobile Swipe navigation
      var touchStartX = 0;
      var touchStartY = 0;
      window.addEventListener('touchstart', function(e) {
        if (e.touches && e.touches[0]) {
          touchStartX = e.touches[0].clientX;
          touchStartY = e.touches[0].clientY;
        }
      }, { passive: true });

      window.addEventListener('touchend', function(e) {
        if (!e.changedTouches || !e.changedTouches[0]) return;
        var dx = e.changedTouches[0].clientX - touchStartX;
        var dy = e.changedTouches[0].clientY - touchStartY;
        if (Math.abs(dx) > Math.abs(dy)) {
          if (dx > 30) atom.input._pressed['move_right'] = true;
          else if (dx < -30) atom.input._pressed['move_left'] = true;
        } else {
          if (dy > 30) atom.input._pressed['move_down'] = true;
          else if (dy < -30) atom.input._pressed['move_up'] = true;
        }
      }, { passive: true });
    }
  };

  atom.Game.prototype.run = function() {
    var self = this;
    var last = performance.now();
    function loop(now) {
      var dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (typeof self.update === 'function') self.update(dt);
      if (typeof self.draw === 'function') self.draw();
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  };
})();

