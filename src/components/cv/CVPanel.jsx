import React from 'react';

const FORMATS = [
  ['resume', 'Resume', 'one page of highlights'],
  ['cv', 'CV', 'in depth, runs on'],
];

// In sheet order: the resume's left column, then the plum one.
export const SECTIONS = [
  ['profile', 'Profile'],
  ['experience', 'Experience'],
  ['traits', 'Traits'],
  ['education', 'Education'],
  ['certifications', 'Certifications'],
  ['projects', 'Projects'],
  ['skills', 'Skills'],
  ['languages', 'Languages'],
  ['hobbies', 'Hobbies'],
  ['activities', 'Activities'],
  ['commits', 'Code activity'],
];

// In sheet order, for the in-depth CV.
export const CV_SECTIONS = [
  ['commits', 'Code activity'],
  ['profile', 'Profile'],
  ['personal', 'Personal details'],
  ['experience', 'Experience'],
  ['education', 'Education'],
  ['certifications', 'Certifications'],
  ['projects', 'Projects'],
  ['skills', 'Skills'],
  ['traits', 'Traits'],
  ['languages', 'Languages'],
  ['activities', 'Activities'],
  ['hobbies', 'Hobbies'],
  ['references', 'References'],
];

// Controls beside the sheet; hidden when printing.
export default function CVPanel({
  options, update, photoCv, upload, onUpload, names, onCustomName, contacts, experience, activities, projects, defaultProjects,
  highlights, hasCommits, hasCertifications, pages, onDownload, onReset,
}) {
  const isCV = options.format === 'cv';
  // Sections, contact links (`contact:<key>`), activities (`activity:<event>`) and real employers
  // (`employer:<id>`) share one hide list.
  const toggle = key => {
    const hide = new Set(options.hide);
    hide.has(key) ? hide.delete(key) : hide.add(key);
    update({ hide });
  };

  // Chosen projects in sheet order (titles that no longer exist are dropped); the rest follow, newest first.
  const byTitle = new Map(projects.map(p => [p.title, p]));
  const chosen = (options.projects ?? defaultProjects).filter(t => byTitle.has(t));
  const isChosen = new Set(chosen);
  const rest = projects.filter(p => !isChosen.has(p.title));

  // A newly ticked project goes to the end of the sheet.
  const toggleProject = title => update({
    projects: isChosen.has(title) ? chosen.filter(t => t !== title) : [...chosen, title],
  });
  const moveProject = (i, by) => {
    const next = [...chosen];
    [next[i], next[i + by]] = [next[i + by], next[i]];
    update({ projects: next });
  };

  const sections = (isCV ? CV_SECTIONS : SECTIONS).filter(([key]) => (key !== 'commits' || hasCommits) && (key !== 'certifications' || hasCertifications));

  const nameChoices = [
    ['legal', 'Legal name', names.legal || null, !names.legal && 'set it in admin → Personal'],
    ['site', 'Site name', names.site],
  ];

  const photoChoices = [
    ['cv', 'CV photo', !photoCv && 'set it in admin → Personal'],
    ['site', 'Site photo'],
    ['upload', upload ? upload.name : 'Uploaded photo', !upload && 'choose a file below'],
    ['none', 'No photo'],
  ];

  return (
    <aside className="cv-panel">
      <div className="cv-panel__head">
        <h1 className="cv-panel__title">CV generator</h1>
        <a className="cv-panel__back" href="/admin">← admin</a>
      </div>

      <div className="cv-panel__formats" role="radiogroup" aria-label="Format">
        {FORMATS.map(([value, label, note]) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={options.format === value}
            className={`cv-panel__format${options.format === value ? ' cv-panel__format--on' : ''}`}
            onClick={() => update({ format: value })}
          >
            <b>{label}</b>
            <small>{note}</small>
          </button>
        ))}
      </div>

      <button type="button" className="cv-panel__download" onClick={onDownload}>Download PDF</button>
      {isCV ? (
        <p className="cv-panel__pages">✦ About {pages} A4 page{pages > 1 ? 's' : ''}.</p>
      ) : (
        <p className={`cv-panel__pages${pages > 1 ? ' cv-panel__pages--over' : ''}`}>
          {pages > 1
            ? `Spills onto ${pages} pages: hide a section or a few projects to fit one.`
            : '✦ Fits on one A4 page.'}
        </p>
      )}

      <fieldset className="cv-panel__group">
        <legend>Name</legend>
        {nameChoices.map(([value, label, current, hint]) => (
          <label key={value} className={`cv-panel__option${hint ? ' cv-panel__option--off' : ''}`}>
            <input
              type="radio"
              name="cv-name"
              checked={options.name === value}
              disabled={Boolean(hint)}
              onChange={() => update({ name: value })}
            />
            <span>{label}{current && <small> ({current})</small>}{hint && <small> ({hint})</small>}</span>
          </label>
        ))}
        <label className={`cv-panel__option${names.custom.trim() ? '' : ' cv-panel__option--off'}`}>
          <input
            type="radio"
            name="cv-name"
            checked={options.name === 'custom'}
            disabled={!names.custom.trim()}
            onChange={() => update({ name: 'custom' })}
          />
          <span>Custom</span>
        </label>
        <input
          type="text"
          className="cv-panel__text"
          placeholder="Type a name…"
          value={names.custom}
          onChange={e => onCustomName(e.target.value)}
        />
        <small className="cv-panel__note">A typed name is only used in this tab; it isn't saved anywhere.</small>
        <label className="cv-panel__option">
          <input type="checkbox" checked={options.echo} onChange={() => update({ echo: !options.echo })} />
          <span>Outline the site name underneath <small>({names.site})</small></span>
        </label>
      </fieldset>

      <fieldset className="cv-panel__group">
        <legend>Photo</legend>
        {photoChoices.map(([value, label, hint]) => (
          <label key={value} className={`cv-panel__option${hint ? ' cv-panel__option--off' : ''}`}>
            <input
              type="radio"
              name="cv-photo"
              checked={options.photo === value}
              disabled={Boolean(hint)}
              onChange={() => update({ photo: value })}
            />
            <span>{label}{hint && <small> ({hint})</small>}</span>
          </label>
        ))}
        <label className="cv-panel__file">
          Upload a photo…
          <input
            type="file"
            accept="image/*"
            onChange={e => { onUpload(e.target.files[0]); e.target.value = ''; }}
          />
        </label>
        <small className="cv-panel__note">Only used in this tab; it isn't saved anywhere.</small>
        <label className="cv-panel__range">
          <span>Position</span>
          <input
            type="range"
            min="0"
            max="100"
            value={options.photoY}
            disabled={options.photo === 'none'}
            onChange={e => update({ photoY: Number(e.target.value) })}
          />
        </label>
      </fieldset>

      <fieldset className="cv-panel__group">
        <legend>Contact</legend>
        {contacts.map(({ key, name, text }) => (
          <label key={key} className="cv-panel__option">
            <input type="checkbox" checked={!options.hide.has(`contact:${key}`)} onChange={() => toggle(`contact:${key}`)} />
            <span>{name} <small>{text}</small></span>
          </label>
        ))}
      </fieldset>

      <fieldset className="cv-panel__group">
        <legend>Sections</legend>
        {sections.map(([key, label]) => (
          <label key={key} className="cv-panel__option">
            <input type="checkbox" checked={!options.hide.has(key)} onChange={() => toggle(key)} />
            <span>{label}</span>
          </label>
        ))}
      </fieldset>

      {experience.length > 0 && (
        <fieldset className="cv-panel__group" disabled={options.hide.has('experience')}>
          <legend>Employers</legend>
          {experience.map(e => (
            <label key={e.id} className={`cv-panel__option${e.employer ? '' : ' cv-panel__option--off'}`}>
              <input
                type="checkbox"
                checked={Boolean(e.employer) && !options.hide.has(`employer:${e.id}`)}
                disabled={!e.employer}
                onChange={() => toggle(`employer:${e.id}`)}
              />
              <span>
                {e.role} <small>{e.year}</small>
                <br />
                <small>
                  {e.employer
                    ? <>{e.employer} · untick for “{e.company || 'no company'}”</>
                    : <>{e.company || 'no company'} (set a CV employer in admin → Experience)</>}
                </small>
              </span>
            </label>
          ))}
        </fieldset>
      )}

      <fieldset className="cv-panel__group" disabled={options.hide.has('projects')}>
        <legend>Projects</legend>
        {/* `null` is the format's default: the newest few highlights on the resume, everything on the CV */}
        <div className="cv-panel__quick">
          <button type="button" onClick={() => update({ projects: isCV ? highlights : null })}>highlights</button>
          <button type="button" onClick={() => update({ projects: isCV ? null : projects.map(p => p.title) })}>all</button>
          <button type="button" onClick={() => update({ projects: [] })}>none</button>
          <button
            type="button"
            onClick={() => update({ projects: projects.map(p => p.title).filter(t => isChosen.has(t)) })}
          >
            newest first
          </button>
        </div>
        {chosen.map((title, i) => {
          const p = byTitle.get(title);
          return (
            <div key={title} className="cv-panel__project">
              <label className="cv-panel__option">
                <input type="checkbox" checked onChange={() => toggleProject(title)} />
                <span>{title} <small>{p.year} · {p.status}</small></span>
              </label>
              <button
                type="button"
                className="cv-panel__move"
                disabled={i === 0}
                onClick={() => moveProject(i, -1)}
                aria-label={`Move ${title} up`}
              >
                ↑
              </button>
              <button
                type="button"
                className="cv-panel__move"
                disabled={i === chosen.length - 1}
                onClick={() => moveProject(i, 1)}
                aria-label={`Move ${title} down`}
              >
                ↓
              </button>
            </div>
          );
        })}
        {chosen.length > 0 && rest.length > 0 && <hr className="cv-panel__divider" />}
        {rest.map(p => (
          <label key={p.title} className="cv-panel__option">
            <input type="checkbox" checked={false} onChange={() => toggleProject(p.title)} />
            <span>{p.title} <small>{p.year} · {p.status}</small></span>
          </label>
        ))}
      </fieldset>

      {activities.length > 0 && (
        <fieldset className="cv-panel__group" disabled={options.hide.has('activities')}>
          <legend>Activities</legend>
          {activities.map(a => (
            <label key={a.event} className="cv-panel__option">
              <input
                type="checkbox"
                checked={!options.hide.has(`activity:${a.event}`)}
                onChange={() => toggle(`activity:${a.event}`)}
              />
              <span>{a.event} <small>{a.year}</small></span>
            </label>
          ))}
        </fieldset>
      )}

      <button type="button" className="cv-panel__reset" onClick={onReset}>Reset {isCV ? 'CV' : 'resume'} to defaults</button>
    </aside>
  );
}
