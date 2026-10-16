import React, { useMemo, useState } from 'react';
import { commitCurve, formatCount, shortDate } from '../data/useCommits';

// SVG user space; the svg stretches to the hero's width (stroke stays 2.5px).
const W = 1440, H = 260, TOP = 40, BASE = 230;

const plural = n => `${formatCount(n)} commit${n === 1 ? '' : 's'}`;

// Smooth weekly-commit line across the bottom of the hero starfield.
export default function HeroCommits({ commits }) {
  const { weeks, weekly, year, yearTotal, allTotal, github, gitlab, stars } = commits;
  const [hover, setHover] = useState(null);

  const { line, area, pts, peak } = useMemo(() => commitCurve(weekly, { W, H, TOP, BASE }), [weekly]);

  const at = i => ({ left: `${(pts[i][0] / W) * 100}%`, top: `${(pts[i][1] / H) * 100}%` });

  const onPointerMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const i = Math.round(((e.clientX - r.left) / r.width) * (pts.length - 1));
    setHover(Math.max(0, Math.min(pts.length - 1, i)));
  };

  const sources = [github != null && 'GitHub', gitlab != null && 'GitLab'].filter(Boolean).join(' + ');
  // Keep the tooltip inside the hero near either edge.
  const edge = hover == null ? 0 : hover / (pts.length - 1);
  const tipX = edge < 0.06 ? '-12%' : edge > 0.94 ? '-88%' : '-50%';

  return (
    <>
      <div className="hero-commits__stats">
        <div className="hero-commits__stat">
          <span className="hero-commits__label">commits in {year}</span>
          <span className="hero-commits__total">{formatCount(yearTotal)}</span>
          <span className="hero-commits__label">{formatCount(allTotal)} all time · {sources}</span>
        </div>
        {stars != null && (
          <div className="hero-commits__stat">
            <span className="hero-commits__label">stars received</span>
            <span className="hero-commits__total"><em className="hero-commits__star" aria-hidden="true">✦</em>{formatCount(stars)}</span>
            <span className="hero-commits__label">across all repos, all time</span>
          </div>
        )}
      </div>

      <div
        className="hero-commits__graph"
        onPointerMove={onPointerMove}
        onPointerLeave={() => setHover(null)}
        role="img"
        aria-label={`Weekly commits over the past year: ${plural(weekly.reduce((a, b) => a + b, 0))}`}
      >
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="hero-commits-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--orange)" stopOpacity=".28" />
              <stop offset="1" stopColor="var(--orange)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path className="hero-commits__area" d={area} fill="url(#hero-commits-fill)" />
          <path className="hero-commits__line" d={line} vectorEffect="non-scaling-stroke" />
        </svg>
        <em className="hero-commits__peak" style={at(peak)} aria-hidden="true">✦</em>
        {hover != null && (
          <>
            <div className="hero-commits__rule" style={{ left: at(hover).left }} />
            <div className="hero-commits__dot" style={at(hover)} />
            <div className="hero-commits__tip" style={{ ...at(hover), '--tip-x': tipX }}>
              week of {shortDate(weeks[hover][0].date)} · {plural(weekly[hover])}
            </div>
          </>
        )}
      </div>
    </>
  );
}
