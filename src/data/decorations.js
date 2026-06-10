// ─── Decorate your pages here, like a real notebook ─────────────────────────
//
// Each page has a list of stickers. For every sticker:
//   src    — image path (try the ones in /public/placeholder/stickers/)
//   x, y   — position as a PERCENT of the page (0 = top/left, 100 = bottom/right)
//   rotate — tilt in degrees (negative = counter-clockwise)
//   scale  — size multiplier (1 = normal, 1.5 = bigger, 0.7 = smaller)
//
// Add, remove, or move stickers freely — go wild ♡

const S = '/placeholder/stickers';

export const decorations = {
  cover: [
    { src: `${S}/star.svg`, x: 14, y: 16, rotate: -18, scale: 1.1 },
    { src: `${S}/heart.svg`, x: 78, y: 22, rotate: 14, scale: 1 },
    { src: `${S}/butterfly.svg`, x: 70, y: 70, rotate: -10, scale: 1.2 },
    { src: `${S}/flower.svg`, x: 16, y: 74, rotate: 8, scale: 1 },
    { src: `${S}/washi.svg`, x: 50, y: 6, rotate: -4, scale: 1.3 },
  ],
  about: [
    { src: `${S}/heart.svg`, x: 6, y: 10, rotate: -20, scale: 0.8 },
    { src: `${S}/smiley.svg`, x: 84, y: 14, rotate: 12, scale: 0.9 },
    { src: `${S}/flower.svg`, x: 8, y: 80, rotate: -12, scale: 0.85 },
    { src: `${S}/star.svg`, x: 88, y: 78, rotate: 18, scale: 0.8 },
    { src: `${S}/arrow.svg`, x: 60, y: 40, rotate: 20, scale: 0.9 },
  ],
  projects: [
    { src: `${S}/star.svg`, x: 8, y: 12, rotate: -14, scale: 0.85 },
    { src: `${S}/butterfly.svg`, x: 86, y: 16, rotate: 16, scale: 0.9 },
    { src: `${S}/heart.svg`, x: 90, y: 84, rotate: -10, scale: 0.8 },
    { src: `${S}/washi.svg`, x: 20, y: 92, rotate: 6, scale: 1 },
  ],
  work: [
    { src: `${S}/flower.svg`, x: 7, y: 14, rotate: 14, scale: 0.8 },
    { src: `${S}/smiley.svg`, x: 88, y: 12, rotate: -16, scale: 0.85 },
    { src: `${S}/heart.svg`, x: 10, y: 86, rotate: -8, scale: 0.85 },
    { src: `${S}/star.svg`, x: 86, y: 88, rotate: 20, scale: 0.8 },
  ],
};
