import React, { useEffect, useMemo, useRef, useState } from 'react';
import { formatCount, shortDate } from '../data/useCommits';
import { observeReveals } from '../reveal';

const IDLE = 'hover a day ✦';

// Level 0 is "no commits"; 1–4 split the active days into quartiles, like GitHub's graph.
function levels(weeks) {
  const counts = weeks.flat().filter(d => d?.count).map(d => d.count).sort((a, b) => a - b);
  const q = p => counts[Math.floor((counts.length - 1) * p)] ?? 0;
  const cuts = [q(0.25), q(0.5), q(0.75)];
  return n => (n === 0 ? 0 : 1 + cuts.filter(c => n > c).length);
}

// Commit graph for the Skills panel, under Hobbies & Interests.
export default function CommitActivity({ commits }) {
  const { weeks, year, yearTotal, allTotal, github, gitlab, streak } = commits;
  const [label, setLabel] = useState(IDLE);
  const ref = useRef(null);

  // Mounts after /api/commits loads, so App's one-time reveal pass missed it.
  useEffect(() => observeReveals(ref.current.parentElement), []);

  const level = useMemo(() => levels(weeks), [weeks]);
  // Label each month above the week its 1st falls in (none crammed against the end).
  const months = useMemo(() => weeks.flatMap((w, i) => {
    const first = w.find(d => d?.date.getDate() === 1);
    return first && i < weeks.length - 2
      ? [{ col: i + 1, name: first.date.toLocaleDateString('en-US', { month: 'short' }) }]
      : [];
  }), [weeks]);

  const stats = [
    [formatCount(yearTotal), `in ${year}`],
    [formatCount(allTotal), 'all time'],
    github != null && [formatCount(github), 'GitHub'],
    gitlab != null && [formatCount(gitlab), 'GitLab'],
    [`${streak} day${streak === 1 ? '' : 's'}`, 'longest streak'],
  ].filter(Boolean);

  return (
    <div className="commits-section reveal" ref={ref}>
      <div className="commits-section__head">
        <h3 className="hobbies__title">Commit Activity</h3>
        <span className="commits-section__hover" aria-live="polite">{label}</span>
      </div>

      <div className="lang-grid commits-section__stats">
        {stats.map(([value, name], i) => (
          <div key={name} style={{ '--i': i }}>
            <div className="lang-item__name">{value}</div>
            <div className="lang-item__level">{name}</div>
          </div>
        ))}
      </div>

      <div className="commit-graph" style={{ '--weeks': weeks.length }} onPointerLeave={() => setLabel(IDLE)}>
        <div className="commit-graph__months" aria-hidden="true">
          {months.map(m => <span key={m.col} style={{ gridColumn: `${m.col} / span 3` }}>{m.name}</span>)}
        </div>
        <div className="commit-graph__cells" role="img" aria-label={`${formatCount(yearTotal)} commits in ${year}`}>
          {weeks.map((w, i) => w.map((d, j) => (
            <i
              key={`${i}-${j}`}
              className={d ? `commit-graph__cell commit-graph__cell--${level(d.count)}` : 'commit-graph__cell commit-graph__cell--future'}
              style={{ gridColumn: i + 1, gridRow: j + 1, '--col': i }}
              onPointerEnter={d ? () => setLabel(`${shortDate(d.date)} — ${d.count} commit${d.count === 1 ? '' : 's'}`) : undefined}
            />
          )))}
        </div>
        <div className="commit-graph__legend" aria-hidden="true">
          <span>less</span>
          {[0, 1, 2, 3, 4].map(l => <i key={l} className={`commit-graph__cell commit-graph__cell--${l}`} />)}
          <span>more</span>
        </div>
      </div>
    </div>
  );
}
