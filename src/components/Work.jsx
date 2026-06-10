import React from 'react';
import { LuLock } from 'react-icons/lu';
import { allProjects } from '../data/content';

export default function Work() {
  return (
    <section className="work" id="work">
      <h2 className="work__heading">Work</h2>
      <div className="work__grid">
        {allProjects.map((p, i) =>
          p.secret ? (
            <div key={i} className="work-card work-card--secret">
              <div className="work-card__secret-overlay">
                <LuLock size={22} strokeWidth={1.5} />
                <span>Confidential</span>
              </div>
              <img className="work-card__thumb" src={p.images?.[0] ?? p.image} alt={p.title} />
              <div className="work-card__body">
                <div className="work-card__title">{p.title}</div>
                <div className="work-card__blurb">{p.blurb}</div>
                {p.tags?.length > 0 && (
                  <div className="work-card__tags">
                    {p.tags.map((t, j) => <span key={j} className="work-card__tag">{t}</span>)}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <a
              key={i}
              href={p.link}
              className="work-card"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img className="work-card__thumb" src={p.images?.[0] ?? p.image} alt={p.title} />
              <div className="work-card__body">
                <div className="work-card__title">{p.title}</div>
                <div className="work-card__blurb">{p.blurb}</div>
                {p.tags?.length > 0 && (
                  <div className="work-card__tags">
                    {p.tags.map((t, j) => <span key={j} className="work-card__tag">{t}</span>)}
                  </div>
                )}
              </div>
            </a>
          )
        )}
      </div>
    </section>
  );
}
