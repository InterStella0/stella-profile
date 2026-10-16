import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useContent } from '../../data/ContentContext.jsx';
import { useCommits } from '../../data/useCommits';
import CVDocument from './CVDocument';
import CVPanel from './CVPanel';

// One A4 page in CSS px (297mm at 96px per inch).
const A4_HEIGHT = (297 / 25.4) * 96;
const PRINT_MARGIN = (4 / 25.4) * 96;

// ─── Options live in the URL query, so a setup survives reloads and can be bookmarked ─
// hide=profile,hobbies   sections turned off
// project=A&project=B    chosen projects (a lone empty `project=` means none)
// photo=cv|site|none     a one-off upload isn't kept, so it falls back to the default
// photoY=0..100          vertical framing of the photo

function readOptions() {
  const q = new URLSearchParams(window.location.search);
  return {
    hide: new Set((q.get('hide') ?? '').split(',').filter(Boolean)),
    projects: q.has('project') ? q.getAll('project').filter(Boolean) : null,
    photo: ['cv', 'site', 'none'].includes(q.get('photo')) ? q.get('photo') : null,
    photoY: q.has('photoY') ? Math.min(100, Math.max(0, Number(q.get('photoY')) || 0)) : 50,
  };
}

function writeOptions({ hide, projects, photo, photoY }) {
  const q = new URLSearchParams();
  if (hide.size) q.set('hide', [...hide].join(','));
  if (projects) (projects.length ? projects : ['']).forEach(t => q.append('project', t));
  if (photo && photo !== 'upload') q.set('photo', photo);
  if (photoY !== 50) q.set('photoY', photoY);
  const search = q.toString();
  window.history.replaceState(null, '', `${window.location.pathname}${search ? `?${search}` : ''}`);
}

// Admin-only: the backend answers 200 (with the CV photo) for a logged-in admin, 401 otherwise.
function useAdminSession() {
  const [session, setSession] = useState({ status: 'checking' });
  useEffect(() => {
    let cancelled = false;
    fetch('/api/cv/session')
      .then(res => {
        if (res.status === 401) return { status: 'denied' };
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json().then(({ photoCv }) => ({ status: 'ok', photoCv }));
      })
      .catch(() => ({ status: 'error' }))
      .then(s => !cancelled && setSession(s));
    return () => { cancelled = true; };
  }, []);
  return session;
}

export default function CVGenerator() {
  const session = useAdminSession();

  if (session.status === 'checking') {
    return <div className="content-status">checking…</div>;
  }
  if (session.status !== 'ok') {
    return (
      <div className="cv-gate">
        <div className="cv-gate__card">
          <h1 className="cv-gate__title">✦ CV generator</h1>
          {session.status === 'denied' ? (
            <>
              <p>This page is only for the site admin.</p>
              <p>Log in, then open <b>CV generator</b> from the admin sidebar.</p>
              <a className="cv-gate__button" href="/admin/login">Log in to admin</a>
            </>
          ) : (
            <p>Couldn't reach the backend right now. Please try again later ♡</p>
          )}
        </div>
      </div>
    );
  }
  return <Generator photoCv={session.photoCv} />;
}

function Generator({ photoCv }) {
  const { personal, allProjects } = useContent();
  const commits = useCommits();
  const [options, setOptions] = useState(readOptions);
  const [upload, setUpload] = useState(null); // { name, url } of a one-off photo
  const [pages, setPages] = useState(1);
  const sheetRef = useRef(null);

  // The newest few highlights (or featured projects), so the default fits one page.
  const highlights = allProjects.filter(p => p.highlight);
  const defaultProjects = (highlights.length ? highlights : allProjects.filter(p => !p.secret))
    .slice(0, 3)
    .map(p => p.title);

  // The photo the sheet shows: a stale choice (no CV photo set, upload gone) falls back.
  const photo = options.photo === 'upload' && !upload ? null
    : options.photo === 'cv' && !photoCv ? null
      : options.photo;
  const effectivePhoto = photo ?? (photoCv ? 'cv' : 'site');
  const photoSrc = { cv: photoCv, site: personal.photoHero, upload: upload?.url, none: null }[effectivePhoto];

  useEffect(() => writeOptions(options), [options]);

  // Revoke the uploaded photo's object URL when it's replaced or the page goes away.
  useEffect(() => () => upload && URL.revokeObjectURL(upload.url), [upload]);

  // The sheet never shrinks below one page, so measure where each column's content
  // actually ends. The margin covers text wrapping a little differently in print.
  const measure = () => {
    const sheet = sheetRef.current;
    const top = sheet.getBoundingClientRect().top;
    const ends = [...sheet.querySelectorAll('.cv-left, .cv-right')].map(col => {
      const last = col.lastElementChild;
      return (last ? last.getBoundingClientRect().bottom : col.getBoundingClientRect().top)
        + parseFloat(getComputedStyle(col).paddingBottom) - top;
    });
    setPages(Math.max(1, Math.ceil((Math.max(...ends) + PRINT_MARGIN) / A4_HEIGHT)));
  };

  // Re-measure after every render (options changed) and whenever the photo or fonts load.
  useLayoutEffect(measure);
  useEffect(() => {
    const ro = new ResizeObserver(measure);
    sheetRef.current.querySelectorAll('.cv-header, .cv-body').forEach(el => ro.observe(el));
    document.fonts.ready.then(measure);
    return () => ro.disconnect();
  }, []);

  const update = changes => setOptions(o => ({ ...o, ...changes }));

  const onUpload = file => {
    if (!file) return;
    setUpload({ name: file.name, url: URL.createObjectURL(file) });
    update({ photo: 'upload' });
  };

  const onReset = () => {
    setUpload(null);
    setOptions({ hide: new Set(), projects: null, photo: null, photoY: 50 });
  };

  // Browsers name the saved PDF after the document title.
  const onDownload = () => {
    const title = document.title;
    const slug = personal.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    document.title = `${slug || 'my'}-cv`;
    window.addEventListener('afterprint', () => { document.title = title; }, { once: true });
    window.print();
  };

  const selected = new Set(options.projects ?? defaultProjects);

  return (
    <div className="cv-app">
      <CVPanel
        options={{ ...options, photo: effectivePhoto }}
        update={update}
        photoCv={photoCv}
        upload={upload}
        onUpload={onUpload}
        projects={allProjects}
        defaultProjects={defaultProjects}
        hasCommits={Boolean(commits)}
        pages={pages}
        onDownload={onDownload}
        onReset={onReset}
      />
      <main className="cv-stage">
        <CVDocument
          ref={sheetRef}
          show={key => !options.hide.has(key)}
          projects={allProjects.filter(p => selected.has(p.title))}
          photoSrc={photoSrc}
          photoY={options.photoY}
          commits={commits}
        />
      </main>
    </div>
  );
}
