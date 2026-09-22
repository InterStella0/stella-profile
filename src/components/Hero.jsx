import React, { useRef } from 'react';
import { SiGithub, SiDiscord, SiKofi } from 'react-icons/si';
import { useContent } from '../data/ContentContext.jsx';
import { prefersReducedMotion } from '../reveal';

const socialIcons = { github: SiGithub, discord: SiDiscord, kofi: SiKofi };

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
