import React, { useRef } from 'react';
import { SiGithub, SiDiscord, SiKofi } from 'react-icons/si';
import { useContent } from '../data/ContentContext.jsx';
import { prefersReducedMotion } from '../reveal';

const socialIcons = { github: SiGithub, discord: SiDiscord, kofi: SiKofi };

// Background starfield: [left, top, size(px), kind, parallax depth, twinkle secs, delay secs].
// Positions are % of the banner so they spread with the viewport; `wide` ones hide on phones.
const STARS = [
  ['4%', '8%', 17, 'glyph', 14, 3.4, 0.2],
  ['17%', '5%', 4, 'dot', 6, 2.8, 1.1],
  ['29%', '11%', 3, 'dot', 6, 3.6, 0.5],
  ['38%', '6%', 20, 'glyph gold', 14, 4.2, 1.6, 'wide'],
  ['52%', '14%', 4, 'dot', 6, 3.1, 0.9, 'wide'],
  ['47%', '34%', 26, 'glyph', 22, 4.6, 0.3, 'wide'],
  ['34%', '48%', 3, 'dot', 6, 2.6, 2.1, 'wide'],
  ['41%', '62%', 14, 'glyph cream', 14, 3.8, 1.3, 'wide'],
  ['6%', '66%', 22, 'glyph gold', 22, 4.4, 0.7],
  ['15%', '78%', 3, 'dot', 6, 3.2, 1.8],
  ['3%', '90%', 4, 'dot', 6, 2.9, 0.4],
  ['24%', '88%', 17, 'glyph', 14, 3.6, 2.4],
  ['33%', '76%', 4, 'dot', 6, 3.9, 1.0, 'wide'],
  ['56%', '86%', 20, 'glyph cream', 14, 4.1, 1.9, 'wide'],
  ['64%', '94%', 3, 'dot', 6, 2.7, 0.6],
  ['74%', '4%', 3, 'dot', 6, 3.3, 1.4],
  ['88%', '7%', 16, 'glyph gold', 14, 3.7, 0.1],
  ['96%', '46%', 4, 'dot', 6, 3.0, 2.3],
  ['19%', '62%', 22, 'glyph', 22, 4.8, 1.2, 'wide'],
  ['62%', '72%', 15, 'glyph gold', 14, 3.5, 2.6, 'wide'],
  ['12%', '96%', 13, 'glyph cream', 14, 3.9, 0.8],
  ['45%', '92%', 4, 'dot', 6, 3.4, 1.5, 'wide'],
];

const starLayers = [22, 14, 6].map(depth => STARS.filter(s => s[4] === depth));

export default function Hero() {
  const { personal } = useContent();
  const bodyRef = useRef(null);

  // Sparkle layers drift against the cursor; mouse only, and off for reduced motion.
  const onPointerMove = (e) => {
    if (e.pointerType !== 'mouse' || prefersReducedMotion()) return;
    const r = bodyRef.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    bodyRef.current.querySelectorAll('.hero__sparkle-layer').forEach(l => {
      const d = Number(l.dataset.depth);
      l.style.transform = `translate(${(-x * d).toFixed(1)}px, ${(-y * d).toFixed(1)}px)`;
    });
  };
  const onPointerLeave = () => {
    bodyRef.current.querySelectorAll('.hero__sparkle-layer').forEach(l => { l.style.transform = ''; });
  };

  return (
    <section className="hero">
      <div className="hero__body" ref={bodyRef} onPointerMove={onPointerMove} onPointerLeave={onPointerLeave}>
        {/* Twinkling starfield behind everything, sharing the sparkle parallax */}
        {starLayers.map(stars => (
          <div key={stars[0][4]} className="hero__sparkle-layer" data-depth={stars[0][4]} aria-hidden="true">
            {stars.map(([left, top, size, kind, , dur, delay, wide], i) => (
              <em
                key={i}
                className={`hero__star ${kind.split(' ').map(k => `hero__star--${k}`).join(' ')}${wide ? ' hero__star--wide' : ''}`}
                style={{ left, top, '--size': `${size}px`, '--dur': `${dur}s`, '--delay': `${delay}s` }}
              >
                {kind.startsWith('glyph') ? '✦' : null}
              </em>
            ))}
          </div>
        ))}
        <div className="hero__sparkle-layer" data-depth="10" aria-hidden="true">
          <i className="hero__shooting hero__shooting--a" />
          <i className="hero__shooting hero__shooting--b" />
        </div>

        {/* Photo */}
        <div className="hero__photo-col">
          <div className="hero__photo-bg" />
          <img
            className="hero__photo"
            src={personal.photoHero}
            alt="profile"
          />
        </div>

        {/* Stacked title + social */}
        <div className="hero__text-col">
          <div className="hero__title-mask">
            <h1 className="hero__title">QUEENIEMELLA</h1>
          </div>
          <div className="hero__outline-stack">
            <span className="hero__outline-line hero__outline-line--1">QUEENIE</span>
            <span className="hero__outline-line hero__outline-line--2">MELLA</span>
            <span className="hero__outline-line hero__outline-line--3">MEL</span>
          </div>
          <div className="hero__social">
            {personal.socialLinks.map(({ key, href, label }, i) => {
              const Icon = socialIcons[key];
              return (
                <a key={key} href={href} style={{ '--i': i }} target="_blank" rel="noopener noreferrer" className="hero__social-link">
                  <Icon size={14} /> {label}
                </a>
              );
            })}
          </div>
        </div>

        {/* Decorative sparkles, each on a parallax layer */}
        <div className="hero__sparkle-layer" data-depth="34"><em className="hero__sparkle hero__sparkle--a">✦</em></div>
        <div className="hero__sparkle-layer" data-depth="18"><em className="hero__sparkle hero__sparkle--b">✦</em></div>
        <div className="hero__sparkle-layer" data-depth="8"><em className="hero__sparkle hero__sparkle--c">✦</em></div>
      </div>

      {/* Black footer strip */}
      <div className="hero__footer">
        <p className="hero__bio">{personal.bio}</p>
        <a href="#about" className="hero__scroll">
          Scroll<br />down
        </a>
      </div>
    </section>
  );
}
