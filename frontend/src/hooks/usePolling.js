import { useEffect, useRef } from 'react';

/**
 * Poll a function at a given interval.
 * @param {Function} callback - The function to call on each interval
 * @param {number} interval - Interval in milliseconds
 * @param {boolean} enabled - Whether polling is active (default true)
 */
const usePolling = (callback, interval = 5000, enabled = true) => {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    const tick = () => savedCallback.current();

    const id = setInterval(tick, interval);
    return () => clearInterval(id);
  }, [interval, enabled]);
};

export default usePolling;
