import React from 'react';
import { LuLock, LuExternalLink, LuGithub, LuImages, LuStar, LuZoomIn } from 'react-icons/lu';

const DEFAULT_PROJECT_IMAGE = '/placeholder/github.svg';

export function projectImages(p) {
  if (p.images?.length) return p.images;
  return [p.image || DEFAULT_PROJECT_IMAGE];
}

// One project card, shared by the front page highlights and /projects.
export default function WorkCard({ project: p, onGallery, showStatus = false }) {
  const images = projectImages(p);
  const hasGallery = images.length > 1;
  const hasLink = p.link && !p.secret;
  const hasGithub = p.github && !p.secret;
  const status = p.status || 'active';

  return (
    <div className={`work-card${p.secret ? ' work-card--secret' : ''}`}>
      <div className="work-card__media">
        <button
          className="work-card__thumb-btn"
          onClick={() => onGallery({ images, title: p.title, index: 0 })}
          aria-label={`View ${p.title} full size`}
        >
          <img className="work-card__thumb" src={images[0]} alt={p.title} loading="lazy" />
          <span className="work-card__zoom"><LuZoomIn size={18} strokeWidth={1.8} /></span>
        </button>
        {p.secret && (
          <span className="work-card__confidential">
            <LuLock size={12} strokeWidth={2} />
            Confidential
          </span>
        )}
        {showStatus && (
          <span className={`work-card__status work-card__status--${status}`}>{status}</span>
        )}
      </div>
      <div className="work-card__body">
        <div className="work-card__title-row">
          <span className="work-card__title">{p.title}</span>
          {p.year && <span className="work-card__year">{p.year}</span>}
        </div>
        <div className="work-card__blurb">{p.blurb}</div>
        {p.tags?.length > 0 && (
          <div className="work-card__tags">
            {p.tags.map((t, j) => <span key={j} className="work-card__tag">{t}</span>)}
          </div>
        )}
        {(hasLink || hasGithub || hasGallery) && (
          <div className="work-card__actions">
            {hasLink && (
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
            {hasGithub && (
              <a
                className="work-card__btn"
                href={p.github}
                target="_blank"
                rel="noopener noreferrer"
                title={p.stars != null ? `${p.stars} GitHub stars` : undefined}
              >
                <LuGithub size={15} strokeWidth={1.8} />
                GitHub
                {p.stars != null && (
                  <span className="work-card__stars">
                    <LuStar size={13} strokeWidth={1.8} />
                    {p.stars}
                  </span>
                )}
              </a>
            )}
            {hasGallery && (
              <button
                className="work-card__btn"
                onClick={() => onGallery({ images, title: p.title, index: 0 })}
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
}
