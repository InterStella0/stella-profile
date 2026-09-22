import React, { useState } from 'react';
import { useContent } from '../data/ContentContext.jsx';
import Lightbox from './Lightbox';
import WorkCard from './WorkCard';

export default function Work() {
  const { allProjects } = useContent();
  const [gallery, setGallery] = useState(null);
  const highlights = allProjects.filter(p => p.highlight);

  return (
    <section className="work reveal" id="work">
      {/* Decorative sparkles */}
      <em className="work__sparkle work__sparkle--a">✦</em>
      <em className="work__sparkle work__sparkle--b">✦</em>
      <em className="work__sparkle work__sparkle--c">✦</em>
      <em className="work__sparkle work__sparkle--d">✦</em>
      <em className="work__sparkle work__sparkle--e">✦</em>

      <h2 className="work__heading">Highlight of my work~</h2>
      <div className="work__grid">
        {highlights.map((p, i) => <WorkCard key={i} project={p} onGallery={setGallery} />)}
      </div>

      <div className="work__more">
        <a href="/projects" className="work__more-btn">see everything i've made ✦</a>
      </div>

      {gallery && (
        <Lightbox
          images={gallery.images}
          title={gallery.title}
          startIndex={gallery.index}
          onClose={() => setGallery(null)}
        />
      )}
    </section>
  );
}
