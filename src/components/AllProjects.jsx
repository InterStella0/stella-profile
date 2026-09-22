import React, { useEffect, useMemo, useState } from 'react';
import { useContent } from '../data/ContentContext.jsx';
import Lightbox from './Lightbox';
import WorkCard from './WorkCard';

// Everything is fetched with /api/content and filtered here; there are only a
// few dozen projects, so no server-side search/paging.

const STATUSES = ['all', 'active', 'archived', 'experiment'];
const PAGE = 9;
const TOP_TAGS = 6;

const SORTS = {
  new: (a, b) => b.year - a.year || a.title.localeCompare(b.title),
  old: (a, b) => a.year - b.year || a.title.localeCompare(b.title),
  az: (a, b) => a.title.localeCompare(b.title),
};

export default function AllProjects() {
  const { allProjects: projects } = useContent();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [tags, setTags] = useState([]);
  const [sort, setSort] = useState('new');
  const [limit, setLimit] = useState(PAGE);
  const [showAllTags, setShowAllTags] = useState(false);
  const [gallery, setGallery] = useState(null);

  useEffect(() => {
    const prev = document.title;
    document.title = 'all projects ✦ queeniemella';
    return () => { document.title = prev; };
  }, []);

  // Any filter change starts the list from the top again.
  const filtered = (setter) => (value) => { setter(value); setLimit(PAGE); };
  const toggleTag = (tag) => {
    setTags(ts => (ts.includes(tag) ? ts.filter(t => t !== tag) : [...ts, tag]));
    setLimit(PAGE);
  };
  const reset = () => { setQuery(''); setStatus('all'); setTags([]); setLimit(PAGE); };

  // Tags ranked by how many projects use them; one-offs hide behind "+N more".
  const { ranked, primary } = useMemo(() => {
    const counts = {};
    projects.forEach(p => (p.tags || []).forEach(t => { counts[t] = (counts[t] || 0) + 1; }));
    const ranked = Object.keys(counts).sort((a, b) => counts[b] - counts[a] || a.localeCompare(b));
    return { ranked, primary: ranked.filter(t => counts[t] > 1).slice(0, TOP_TAGS) };
  }, [projects]);

  const q = query.trim().toLowerCase();
  const results = projects
    .filter(p => {
      if (status !== 'all' && (p.status || 'active') !== status) return false;
      if (tags.length && !tags.every(t => (p.tags || []).includes(t))) return false;
      if (!q) return true;
      return [p.title, p.blurb, ...(p.tags || [])].join(' ').toLowerCase().includes(q);
    })
    .sort(SORTS[sort]);

  const visibleTags = showAllTags ? ranked : [...primary, ...tags.filter(t => !primary.includes(t))];
  const restCount = ranked.length - primary.length;
  const years = projects.map(p => p.year);
  const isFiltered = !!q || status !== 'all' || tags.length > 0;

  return (
    <>
      <header className="projects-hero">
        <em className="projects-hero__sparkle projects-hero__sparkle--a">✦</em>
        <em className="projects-hero__sparkle projects-hero__sparkle--b">✦</em>
        <em className="projects-hero__sparkle projects-hero__sparkle--c">✦</em>

        <div className="projects-hero__inner">
          <div className="projects-hero__title-col">
            <div className="projects-hero__title">everything</div>
            <span className="projects-hero__outline">i've made</span>
          </div>

          <div className="projects-hero__side">
            <p className="projects-hero__blurb">
              The highlights page only has room for a handful. This is the whole shelf — bots, libraries,
              tooling, and the half-finished things I still like.
            </p>
            <div className="projects-hero__badges">
              <span className="projects-hero__badge projects-hero__badge--count">
                {projects.length} project{projects.length === 1 ? '' : 's'}
              </span>
              {years.length > 0 && (
                <span className="projects-hero__badge">{Math.min(...years)} → {Math.max(...years)}</span>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="projects-filters">
        <div className="projects-filters__row">
          <label className="projects-filters__search">
            <span className="projects-filters__search-icon">✦</span>
            <input
              type="text"
              value={query}
              onChange={e => filtered(setQuery)(e.target.value)}
              placeholder="search projects, tags, anything…"
            />
          </label>

          <div className="projects-filters__chips">
            {STATUSES.map(s => (
              <button
                key={s}
                className={`projects-chip${status === s ? ' projects-chip--on' : ''}`}
                onClick={() => filtered(setStatus)(s)}
              >
                {s === 'all' ? 'everything' : s}
              </button>
            ))}
          </div>

          <label className="projects-filters__sort">
            <span>sort</span>
            <select value={sort} onChange={e => setSort(e.target.value)}>
              <option value="new">Newest first</option>
              <option value="old">Oldest first</option>
              <option value="az">A – Z</option>
            </select>
          </label>
        </div>

        {ranked.length > 0 && (
          <div className="projects-filters__tags">
            <span className="projects-filters__label">built with</span>
            {visibleTags.map(t => (
              <button
                key={t}
                className={`projects-tag${tags.includes(t) ? ' projects-tag--on' : ''}`}
                onClick={() => toggleTag(t)}
              >
                {t}
              </button>
            ))}
            {restCount > 0 && (
              <button className="projects-filters__tail" onClick={() => setShowAllTags(v => !v)}>
                {showAllTags ? 'fewer tags' : `+${restCount} more`}
              </button>
            )}
          </div>
        )}
      </div>

      <main className="work projects-list">
        <em className="work__sparkle work__sparkle--a">✦</em>
        <em className="work__sparkle work__sparkle--c">✦</em>
        <em className="work__sparkle work__sparkle--d">✦</em>

        <div className="projects-list__head">
          <h2 className="projects-list__heading">
            {isFiltered
              ? `${results.length} ${results.length === 1 ? 'match' : 'matches'}`
              : 'All of my projects'}
          </h2>
          {isFiltered && (
            <button className="work-card__btn" onClick={reset}>clear filters</button>
          )}
        </div>

        <div className="work__grid projects-list__grid">
          {results.slice(0, limit).map((p, i) => (
            <WorkCard key={`${p.title}-${i}`} project={p} onGallery={setGallery} showStatus />
          ))}
        </div>

        {results.length === 0 && (
          <div className="projects-list__empty">
            <div className="projects-list__empty-star">✦</div>
            <p className="projects-list__empty-title">nothing matches that yet~</p>
            <p className="projects-list__empty-hint">try a looser search, or clear the filters.</p>
          </div>
        )}

        {results.length > limit && (
          <div className="work__more">
            <button className="work__more-btn" onClick={() => setLimit(l => l + PAGE)}>
              show {Math.min(PAGE, results.length - limit)} more ✦
            </button>
          </div>
        )}
      </main>

      {gallery && (
        <Lightbox
          images={gallery.images}
          title={gallery.title}
          startIndex={gallery.index}
          onClose={() => setGallery(null)}
        />
      )}
    </>
  );
}
