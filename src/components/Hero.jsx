import React from 'react';
import { SiGithub, SiDiscord, SiKofi } from 'react-icons/si';
import { personal } from '../data/content';

const socialIcons = { github: SiGithub, discord: SiDiscord, kofi: SiKofi };

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero__body">
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
          <h1 className="hero__title">QUEENIEMELLA</h1>
          <div className="hero__outline-stack">
            <span className="hero__outline-line hero__outline-line--1">QUEENIE</span>
            <span className="hero__outline-line hero__outline-line--2">MELLA</span>
            <span className="hero__outline-line hero__outline-line--3">MEL</span>
          </div>
          <div className="hero__social">
            {personal.socialLinks.map(({ key, href, label }) => {
              const Icon = socialIcons[key];
              return (
                <a key={key} href={href} target="_blank" rel="noopener noreferrer" className="hero__social-link">
                  <Icon size={14} /> {label}
                </a>
              );
            })}
          </div>
        </div>

        {/* Decorative sparkles */}
        <em className="hero__sparkle hero__sparkle--a">✦</em>
        <em className="hero__sparkle hero__sparkle--b">✦</em>
        <em className="hero__sparkle hero__sparkle--c">✦</em>
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
