// ============================================================
// useInView — Single shared IntersectionObserver hook
// Used by ALL components — zero duplication
// ============================================================
import { useRef, useState, useEffect } from 'react';

/**
 * Returns a ref and a `visible` boolean.
 * `visible` flips true once the element scrolls into view
 * and stays true (one-shot, no re-triggering).
 *
 * @param threshold  0–1 fraction of element visible before trigger (default 0.12)
 * @param rootMargin CSS margin around the viewport (default '0px')
 */
export function useInView(threshold = 0.12, rootMargin = '0px') {
  const ref     = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect(); // one-shot
        }
      },
      { threshold, rootMargin }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold, rootMargin]);

  return { ref, visible };
}
