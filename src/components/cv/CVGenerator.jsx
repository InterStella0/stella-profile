import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useContent } from '../../data/ContentContext.jsx';
import { useCommits } from '../../data/useCommits';
import CVDocument, { cvContacts } from './CVDocument';
import CVFullDocument from './CVFullDocument';
import CVPanel from './CVPanel';

// One A4 page in CSS px (297mm at 96px per inch).
const A4_HEIGHT = (297 / 25.4) * 96;
const PRINT_MARGIN = (4 / 25.4) * 96;

// Firefox takes the paper and margins (and so how far it shrinks the sheet) from the default
// page, not the sheet's named `cv` page; cv.css loads site-wide, so this is only set on /cv.
const PRINT_PAGE = '@page { size: A4; margin: 0; }';

// ─── Options live in the URL query, so a setup survives reloads and can be bookmarked; ─
// the backend keeps the latest one too, and /cv opened without a query starts from it
// format=cv              the in-depth CV instead of the one-page resume
// hide=profile&hide=contact:discord&hide=activity:Beach clean-up&hide=employer:3
//                        sections, contact links, activities and real employers (by experience id) turned off
// project=A&project=B    chosen projects, in sheet order (a lone empty `project=` means none)
// cvhide=… cvproject=…   the same two for the CV, so tuning one format leaves the other alone
// photo=cv|site|none     a one-off upload isn't kept, so it falls back to the default
// photoY=0..100          vertical framing of the photo
// name=legal|site        the name in the header; a typed-in name is never put in the URL
// echo=0                 hide the outlined site name under it

function readOptions(search) {
  const q = new URLSearchParams(search);
  return {
    format: q.get('format') === 'cv' ? 'cv' : 'resume',
    hide: new Set(q.getAll('hide').filter(Boolean)),
    projects: q.has('project') ? q.getAll('project').filter(Boolean) : null,
    cvHide: new Set(q.getAll('cvhide').filter(Boolean)),
    cvProjects: q.has('cvproject') ? q.getAll('cvproject').filter(Boolean) : null,
    photo: ['cv', 'site', 'none'].includes(q.get('photo')) ? q.get('photo') : null,
    photoY: q.has('photoY') ? Math.min(100, Math.max(0, Number(q.get('photoY')) || 0)) : 50,
    name: ['legal', 'site'].includes(q.get('name')) ? q.get('name') : null,
    echo: q.get('echo') !== '0',
  };
}

// The settings both formats share.
const DEFAULT_OPTIONS = { photo: null, photoY: 50, name: null, echo: true };

function optionsQuery({ format, hide, projects, cvHide, cvProjects, photo, photoY, name, echo }) {
  const q = new URLSearchParams();
  if (format === 'cv') q.set('format', 'cv');
  hide.forEach(key => q.append('hide', key));
  if (projects) (projects.length ? projects : ['']).forEach(t => q.append('project', t));
  cvHide.forEach(key => q.append('cvhide', key));
  if (cvProjects) (cvProjects.length ? cvProjects : ['']).forEach(t => q.append('cvproject', t));
  if (photo && photo !== 'upload') q.set('photo', photo);
  if (photoY !== 50) q.set('photoY', photoY);
  if (name && name !== 'custom') q.set('name', name);
  if (!echo) q.set('echo', '0');
  return q.toString();
}

function saveOptions(query, keepalive = false) {
  return fetch('/api/cv/options', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
    keepalive,
  }).then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); });
}

// Saves the settings a moment after the last change (or straight away if the tab closes first).
// Returns 'saved', 'saving' or 'error'.
function useSavedOptions(query, saved) {
  const [state, setState] = useState('saved');
  const sent = useRef(saved ?? ''); // the query last sent (cleared when sending fails)
  const pending = useRef(null); // a query waiting to be sent

  useEffect(() => {
    if (query === sent.current) {
      pending.current = null;
      setState('saved');
      return undefined;
    }
    pending.current = query;
    setState('saving');
    const timer = setTimeout(() => {
      pending.current = null;
      sent.current = query;
      saveOptions(query)
        .then(() => pending.current === null && sent.current === query && setState('saved'))
        .catch(() => {
          sent.current = null;
          setState('error');
        });
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const flush = () => pending.current !== null && saveOptions(pending.current, true).catch(() => {});
    window.addEventListener('pagehide', flush);
    return () => window.removeEventListener('pagehide', flush);
  }, []);

  return state;
}

// Admin-only: the backend answers 200 (with the private CV fields, the experience list
// with real employers, and the CV-only bullet points) for a logged-in admin, 401 otherwise.
function useAdminSession() {
  const [session, setSession] = useState({ status: 'checking' });
  useEffect(() => {
    let cancelled = false;
    fetch('/api/cv/session')
      .then(res => {
        if (res.status === 401) return { status: 'denied' };
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json().then(data => ({ status: 'ok', ...data }));
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
  return <Generator {...session} />;
}

function Generator({ photoCv, legalName, profile, experience, education, projectDescriptions, savedOptions }) {
  const { personal, activities, allProjects } = useContent();
  const commits = useCommits();
  // A query in the URL (a bookmark) wins over the saved settings.
  const [options, setOptions] = useState(() => readOptions(window.location.search || savedOptions || ''));
  const [upload, setUpload] = useState(null); // { name, url } of a one-off photo
  const [customName, setCustomName] = useState(''); // typed in the panel, kept only in this tab
  const [pages, setPages] = useState(1);
  const [overflow, setOverflow] = useState(false); // the resume's first page itself runs over
  const [split, setSplit] = useState(null); // projects kept on the resume's first page (null: all)
  const sheetRef = useRef(null);

  // The panel edits the shown format's sections and projects; name and photo are shared.
  const isCV = options.format === 'cv';
  const hide = isCV ? options.cvHide : options.hide;
  const chosenProjects = isCV ? options.cvProjects : options.projects;

  // The resume defaults to the newest few highlights (or featured projects), so it fits one page;
  // the CV to every project.
  const highlights = allProjects.filter(p => p.highlight);
  const defaultProjects = isCV
    ? allProjects.map(p => p.title)
    : (highlights.length ? highlights : allProjects.filter(p => !p.secret)).slice(0, 3).map(p => p.title);

  // The photo the sheet shows: a stale choice (no CV photo set, upload gone) falls back.
  const photo = options.photo === 'upload' && !upload ? null
    : options.photo === 'cv' && !photoCv ? null
      : options.photo;
  const effectivePhoto = photo ?? (photoCv ? 'cv' : 'site');
  const photoSrc = { cv: photoCv, site: personal.photoHero, upload: upload?.url, none: null }[effectivePhoto];

  // Same idea for the name: a choice that has nothing to show falls back to the default.
  const nameChoice = options.name === 'custom' && !customName.trim() ? null
    : options.name === 'legal' && !legalName ? null
      : options.name;
  const effectiveName = nameChoice ?? (legalName ? 'legal' : 'site');
  const name = { legal: legalName, site: personal.name, custom: customName.trim() }[effectiveName];

  const query = optionsQuery(options);
  useEffect(() => {
    window.history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
  }, [query]);
  const saveState = useSavedOptions(query, savedOptions);

  // Revoke the uploaded photo's object URL when it's replaced or the page goes away.
  useEffect(() => () => upload && URL.revokeObjectURL(upload.url), [upload]);

  // The sheet never shrinks below one page, so measure where each column's content
  // actually ends. The margin covers text wrapping a little differently in print.
  const measure = () => {
    const sheet = sheetRef.current;
    const top = sheet.getBoundingClientRect().top;
    const end = col => {
      const last = col.lastElementChild;
      return (last ? last.getBoundingClientRect().bottom : col.getBoundingClientRect().top) - top + PRINT_MARGIN;
    };
    const flow = sheet.querySelector('.cvf-body');
    if (flow) {
      // The CV's column runs on, repeating its top and bottom padding on every page after the
      // first; headings kept with their entries add a little more, so this is an estimate.
      const style = getComputedStyle(flow);
      const padTop = parseFloat(style.paddingTop);
      const padBottom = parseFloat(style.paddingBottom);
      const over = end(flow) + padBottom - A4_HEIGHT;
      setPages(over <= 0 ? 1 : 1 + Math.ceil(over / (A4_HEIGHT - padTop - padBottom)));
      return;
    }
    // The resume keeps as many projects on page one as fit (measured in the hidden full-length
    // copy of the left column); the rest move to a "More Projects" page.
    const fits = (el, col) => el.getBoundingClientRect().bottom - top + PRINT_MARGIN
      + parseFloat(getComputedStyle(col).paddingBottom) <= A4_HEIGHT;
    const ghost = sheet.querySelector('.cv-left--ghost');
    if (ghost) {
      const kept = [...ghost.querySelectorAll('.cv-project')].findIndex(item => !fits(item, ghost));
      setSplit(ghost.lastElementChild && fits(ghost.lastElementChild, ghost) ? null : kept === -1 ? null : kept);
    }
    const ends = [...sheet.querySelectorAll('.cv-page:first-child :is(.cv-left:not(.cv-left--ghost), .cv-right)')]
      .map(col => end(col) + parseFloat(getComputedStyle(col).paddingBottom));
    const first = Math.max(1, Math.ceil(Math.max(...ends) / A4_HEIGHT));
    const more = sheet.querySelector('.cv-more-body');
    const page = more?.parentElement.getBoundingClientRect().top - top;
    const rest = more ? Math.max(1, Math.ceil((end(more) - page + parseFloat(getComputedStyle(more).paddingBottom)) / A4_HEIGHT)) : 0;
    setPages(first + rest);
    setOverflow(first > 1);
  };

  // Re-measure after every render (options changed) and whenever the photo or fonts load.
  useLayoutEffect(measure);
  useEffect(() => {
    const ro = new ResizeObserver(measure);
    sheetRef.current.querySelectorAll('.cv-header, .cv-body, .cvf-body').forEach(el => ro.observe(el));
    document.fonts.ready.then(measure);
    return () => ro.disconnect();
  }, [options.format]);

  const update = changes => setOptions(o => ({ ...o, ...changes }));

  // What the panel sets as `hide` and `projects` lands on the shown format's own lists.
  const updateShown = ({ hide: nextHide, projects: nextProjects, ...shared }) => update({
    ...shared,
    ...(nextHide !== undefined && { [isCV ? 'cvHide' : 'hide']: nextHide }),
    ...(nextProjects !== undefined && { [isCV ? 'cvProjects' : 'projects']: nextProjects }),
  });

  const onUpload = file => {
    if (!file) return;
    setUpload({ name: file.name, url: URL.createObjectURL(file) });
    update({ photo: 'upload' });
  };

  const onCustomName = value => {
    setCustomName(value);
    update({ name: 'custom' });
  };

  // Resets the shown format's sections and projects (and the shared name and photo), not the other format's.
  const onReset = () => {
    setUpload(null);
    setCustomName('');
    setOptions(o => ({
      ...o,
      ...DEFAULT_OPTIONS,
      ...(isCV ? { cvHide: new Set(), cvProjects: null } : { hide: new Set(), projects: null }),
    }));
  };

  // Browsers name the saved PDF after the document title.
  const onDownload = () => {
    const title = document.title;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    document.title = `${slug || 'my'}-${isCV ? 'cv' : 'resume'}`;
    window.addEventListener('afterprint', () => { document.title = title; }, { once: true });
    window.print();
  };

  const byTitle = new Map(allProjects.map(p => [p.title, p]));
  const show = key => !hide.has(key);
  const contacts = cvContacts(personal);
  // A job turned off in the panel keeps its public (redacted) company instead of the real employer.
  const jobs = experience.map(e => (show(`employer:${e.id}`) ? e : { ...e, employer: null }));
  const Document = isCV ? CVFullDocument : CVDocument;
  const sheetProjects = (chosenProjects ?? defaultProjects).map(t => byTitle.get(t)).filter(Boolean);
  // Projects the resume moves onto its own "More Projects" page.
  const moved = !isCV && show('projects') && split != null ? Math.max(0, sheetProjects.length - split) : 0;

  return (
    <div className="cv-app">
      <style>{PRINT_PAGE}</style>
      {/* Printed on every page behind the sheet, so a last page's empty end stays cream (Firefox) */}
      <div className="cv-print-bg" aria-hidden="true" />
      <CVPanel
        options={{ ...options, hide, projects: chosenProjects, photo: effectivePhoto, name: effectiveName }}
        update={updateShown}
        photoCv={photoCv}
        upload={upload}
        onUpload={onUpload}
        names={{ legal: legalName, site: personal.name, custom: customName }}
        onCustomName={onCustomName}
        projects={allProjects}
        defaultProjects={defaultProjects}
        highlights={highlights.map(p => p.title)}
        contacts={contacts}
        experience={experience}
        activities={activities}
        hasCommits={Boolean(commits)}
        hasCertifications={education.some(e => e.certification)}
        pages={pages}
        overflow={overflow}
        saveState={saveState}
        moved={moved}
        onDownload={onDownload}
        onReset={onReset}
      />
      <main className="cv-stage">
        <Document
          ref={sheetRef}
          show={show}
          contacts={contacts.filter(c => show(`contact:${c.key}`))}
          experience={jobs}
          education={education}
          activities={activities.filter(a => show(`activity:${a.event}`))}
          projects={sheetProjects}
          split={split}
          projectDescriptions={projectDescriptions}
          profile={profile ?? personal.longBio}
          photoSrc={photoSrc}
          photoY={options.photoY}
          name={name}
          echo={options.echo ? personal.name : null}
          commits={commits}
        />
      </main>
    </div>
  );
}
