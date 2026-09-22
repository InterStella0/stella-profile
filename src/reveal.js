import { useEffect, useState } from 'react';

const OPTIONS = { rootMargin: '0px 0px -12% 0px' };

// Adds .is-revealed to each .reveal element the first time it scrolls into
// view. The entrance animations in motion.css stay paused until then.
export function observeReveals(root = document) {
  const els = root.querySelectorAll('.reveal:not(.is-revealed)');
  if (!('IntersectionObserver' in window)) {
    els.forEach(el => el.classList.add('is-revealed'));
    return () => {};
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('is-revealed');
        io.unobserve(e.target);
      }
    });
  }, OPTIONS);
  els.forEach(el => io.observe(el));
  return () => io.disconnect();
}

// Same trigger as a hook, for things that need to react in JS (count-ups).
export function useInView(ref) {
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    if (!('IntersectionObserver' in window)) { setSeen(true); return; }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setSeen(true); io.disconnect(); }
    }, OPTIONS);
    io.observe(el);
    return () => io.disconnect();
  }, [ref, seen]);
  return seen;
}

export const prefersReducedMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
