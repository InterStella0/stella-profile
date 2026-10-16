import { useEffect, useState } from 'react';

// ─── Commit graph data from /api/commits (GitHub + GitLab, cached server-side) ─
// The hero and Skills panel share one request. Resolves to null when the
// backend has no data (sources not configured / still loading), so both
// sections just stay hidden instead of showing an error.

let request = null;

function load() {
  request ??= fetch('/api/commits')
    .then(res => (res.ok ? res.json() : null))
    .then(raw => (raw ? derive(raw) : null))
    .catch(() => null);
  return request;
}

const parse = iso => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};

function derive({ days, totals, stars, today }) {
  const year = parse(today).getFullYear();
  const list = days.map(({ date, count }) => ({ date: parse(date), count }));

  // Sunday-first weeks; the last one is padded with future (null) days.
  const weeks = [];
  for (let i = 0; i < list.length; i += 7) {
    const week = list.slice(i, i + 7);
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  let streak = 0, run = 0;
  for (const d of list) {
    run = d.count ? run + 1 : 0;
    streak = Math.max(streak, run);
  }

  return {
    year,
    weeks,
    weekly: weeks.map(w => w.reduce((sum, d) => sum + (d?.count ?? 0), 0)),
    yearTotal: list.reduce((sum, d) => sum + (d.date.getFullYear() === year ? d.count : 0), 0),
    github: totals.github ?? null,
    gitlab: totals.gitlab ?? null,
    allTotal: Object.values(totals).reduce((a, b) => a + b, 0),
    streak,
    stars: stars ?? null,
  };
}

export function useCommits() {
  const [data, setData] = useState(null);
  useEffect(() => {
    let cancelled = false;
    load().then(d => !cancelled && setData(d));
    return () => { cancelled = true; };
  }, []);
  return data;
}

// Smooth weekly-commit curve in a W×H SVG user space, the line running between
// TOP (busiest week) and BASE (no commits). Shared by the hero and the CV.
export function commitCurve(weekly, { W, H, TOP, BASE }) {
  // Light smoothing so single busy weeks read as a ridge, not a spike.
  const sm = weekly.map((v, i) => (weekly[i - 1] ?? v) * 0.25 + v * 0.5 + (weekly[i + 1] ?? v) * 0.25);
  const max = Math.max(...sm) || 1;
  const last = sm.length - 1;
  const pts = sm.map((v, i) => [(i / last) * W, BASE - (v / max) * (BASE - TOP)]);
  // Catmull-Rom through every point, as cubic Béziers
  let line = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < last; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    line += ` C${p1[0] + (p2[0] - p0[0]) / 6},${p1[1] + (p2[1] - p0[1]) / 6}`
      + ` ${p2[0] - (p3[0] - p1[0]) / 6},${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]},${p2[1]}`;
  }
  return { line, area: `${line} L${W},${H} L0,${H} Z`, pts, peak: sm.indexOf(Math.max(...sm)) };
}

export const formatCount = n => n.toLocaleString('en-US');

export const shortDate = d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
