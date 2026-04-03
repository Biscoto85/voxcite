import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook pour gérer une boucle requestAnimationFrame.
 * Retourne le temps écoulé depuis le démarrage.
 */
export function useAnimation(
  callback: (elapsed: number) => void,
  running: boolean,
) {
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  const loop = useCallback(
    (timestamp: number) => {
      if (startRef.current === null) startRef.current = timestamp;
      const elapsed = (timestamp - startRef.current) / 1000;
      callback(elapsed);
      rafRef.current = requestAnimationFrame(loop);
    },
    [callback],
  );

  useEffect(() => {
    if (running) {
      startRef.current = null;
      rafRef.current = requestAnimationFrame(loop);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [running, loop]);
}
