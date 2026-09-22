import React from 'react';
import { useContent } from '../data/ContentContext.jsx';

// Each pill bobs on its own 4–6s loop so the cloud never moves in step.
const bobTiming = (i) => ({
  '--bob-dur': `${(4.2 + ((i * 7) % 11) * 0.18).toFixed(2)}s`,
  '--bob-delay': `${((i * 4) % 12) / 10}s`,
});

export default function Supporters() {
  const { supporters } = useContent();
  return (
    <section className="supporters reveal" id="supporters">
      {/* Decorative sparkles */}
      <em className="supporters__sparkle supporters__sparkle--a">✦</em>
      <em className="supporters__sparkle supporters__sparkle--b">✦</em>
      <em className="supporters__sparkle supporters__sparkle--c">✦</em>

      <h2 className="supporters__heading">Thank you to my supporters! ✦</h2>
      <div className="supporters__cloud">
        {supporters.map((name, i) => (
          <span key={i} className={`supporters__pill supporters__pill--${i % 3}`} style={bobTiming(i)}>
            {name}
          </span>
        ))}
      </div>
    </section>
  );
}
