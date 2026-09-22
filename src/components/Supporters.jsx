import React from 'react';
import { useContent } from '../data/ContentContext.jsx';

export default function Supporters() {
  const { supporters } = useContent();
  return (
    <section className="supporters" id="supporters">
      {/* Decorative sparkles */}
      <em className="supporters__sparkle supporters__sparkle--a">✦</em>
      <em className="supporters__sparkle supporters__sparkle--b">✦</em>
      <em className="supporters__sparkle supporters__sparkle--c">✦</em>

      <h2 className="supporters__heading">Thank you to my supporters! ✦</h2>
      <div className="supporters__cloud">
        {supporters.map((name, i) => (
          <span key={i} className={`supporters__pill supporters__pill--${i % 3}`}>
            {name}
          </span>
        ))}
      </div>
    </section>
  );
}
