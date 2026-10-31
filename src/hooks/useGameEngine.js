import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Custom React Hook to instantiate, run, and cleanly destroy any of the 64+
 * GAMINGZONE HTML5 Canvas game engines inside a React component.
 */
export function useGameEngine(engineName, onGameOver, config = null) {
  const mountRef = useRef(null);
  const instanceRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!engineName || !mountRef.current) return;

    let isCancelled = false;
    setLoading(true);
    setError(null);

    // Clean previous instance if any
    if (instanceRef.current && typeof instanceRef.current.destroy === 'function') {
      try {
        instanceRef.current.destroy();
      } catch (e) {
        console.warn('Error destroying game instance:', e);
      }
      instanceRef.current = null;
    }

    // Clear mount container
    if (mountRef.current) {
      mountRef.current.innerHTML = '';
    }

    // Dynamic import from js/games/<engineName>.js
    import(`../../js/games/${engineName}.js`)
      .then((module) => {
        if (isCancelled) return;
        const EngineClass = module[`${engineName}Game`] || Object.values(module)[0];

        if (!EngineClass) {
          throw new Error(`Engine class "${engineName}" not found in module`);
        }

        const instance = new EngineClass(
          mountRef.current,
          (score, extra) => {
            if (typeof onGameOver === 'function') {
              onGameOver(score, extra);
            }
          },
          config
        );

        instanceRef.current = instance;
        setLoading(false);
      })
      .catch((err) => {
        if (isCancelled) return;
        console.error('Failed to load game engine:', engineName, err);
        setError(err);
        setLoading(false);
      });

    return () => {
      isCancelled = true;
      if (instanceRef.current && typeof instanceRef.current.destroy === 'function') {
        try {
          instanceRef.current.destroy();
        } catch (e) {}
        instanceRef.current = null;
      }
      if (mountRef.current) {
        mountRef.current.innerHTML = '';
      }
    };
  }, [engineName]);

  const pause = useCallback(() => {
    if (instanceRef.current && typeof instanceRef.current.pause === 'function') {
      instanceRef.current.pause();
    }
  }, []);

  const resume = useCallback(() => {
    if (instanceRef.current && typeof instanceRef.current.resume === 'function') {
      instanceRef.current.resume();
    }
  }, []);

  const restart = useCallback(() => {
    if (instanceRef.current && typeof instanceRef.current.restart === 'function') {
      instanceRef.current.restart();
    }
  }, []);

  return {
    mountRef,
    loading,
    error,
    pause,
    resume,
    restart,
    instance: instanceRef.current
  };
}

