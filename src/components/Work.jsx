import React, { useState } from 'react';
import { LuLock, LuExternalLink, LuImages } from 'react-icons/lu';
import { allProjects } from '../data/content';
import Lightbox from './Lightbox';

export default function Work() {
  const [gallery, setGallery] = useState(null);

  return (
    <section className="work" id="work">
      {/* Decorative sparkles */}
      <em className="work__sparkle work__sparkle--a">✦</em>
      <em className="work__sparkle work__sparkle--b">✦</em>
      <em className="work__sparkle work__sparkle--c">✦</em>
      <em className="work__sparkle work__sparkle--d">✦</em>
      <em className="work__sparkle work__sparkle--e">✦</em>

      <h2 className="work__heading">Highlight of my work~</h2>
      <div className="work__grid">
        {allProjects.map((p, i) => {
          const images = p.images ?? (p.image ? [p.image] : []);
          const hasGallery = images.length > 1;

          return (
            <div key={i} className={`work-card${p.secret ? ' work-card--secret' : ''}`}>
              <div className="work-card__media">
                <img className="work-card__thumb" src={images[0]} alt={p.title} />
                {p.secret && (
                  <span className="work-card__confidential">
                    <LuLock size={12} strokeWidth={2} />
                    Confidential
                  </span>
                )}
              </div>
              <div className="work-card__body">
                <div className="work-card__title">{p.title}</div>
                <div className="work-card__blurb">{p.blurb}</div>
                {p.tags?.length > 0 && (
                  <div className="work-card__tags">
                    {p.tags.map((t, j) => <span key={j} className="work-card__tag">{t}</span>)}
                  </div>
                )}
                {(( p.link && !p.secret) || hasGallery) && (
                  <div className="work-card__actions">
                    {p.link && !p.secret && (
                      <a
                        className="work-card__btn"
                        href={p.link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <LuExternalLink size={15} strokeWidth={1.8} />
                        Visit
                      </a>
                    )}
                    {hasGallery && (
                      <button
                        className="work-card__btn"
                        onClick={() => setGallery({ images, title: p.title, index: 0 })}
                      >
                        <LuImages size={15} strokeWidth={1.8} />
                        Gallery
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
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
