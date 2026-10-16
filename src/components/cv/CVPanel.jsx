import React from 'react';

// In sheet order: the left column, then the plum one.
export const SECTIONS = [
  ['profile', 'Profile'],
  ['experience', 'Experience'],
  ['traits', 'Traits'],
  ['education', 'Education'],
  ['projects', 'Projects'],
  ['skills', 'Skills'],
  ['languages', 'Languages'],
  ['hobbies', 'Hobbies'],
  ['activities', 'Activities'],
  ['commits', 'Code activity'],
];

// Controls beside the sheet; hidden when printing.
export default function CVPanel({
  options, update, photoCv, upload, onUpload, projects, defaultProjects, hasCommits, pages, onDownload, onReset,
}) {
  const toggleSection = key => {
    const hide = new Set(options.hide);
    hide.has(key) ? hide.delete(key) : hide.add(key);
    update({ hide });
  };

  const selected = new Set(options.projects ?? defaultProjects);
  const toggleProject = title => {
    const next = new Set(selected);
    next.has(title) ? next.delete(title) : next.add(title);
    // Keep the sheet's order (newest first), not click order.
    update({ projects: projects.map(p => p.title).filter(t => next.has(t)) });
  };

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

      <button type="button" className="cv-panel__download" onClick={onDownload}>Download PDF</button>
      <p className={`cv-panel__pages${pages > 1 ? ' cv-panel__pages--over' : ''}`}>
        {pages > 1
          ? `Spills onto ${pages} pages: hide a section or a few projects to fit one.`
          : '✦ Fits on one A4 page.'}
      </p>

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
        <legend>Sections</legend>
        {SECTIONS.filter(([key]) => key !== 'commits' || hasCommits).map(([key, label]) => (
          <label key={key} className="cv-panel__option">
            <input type="checkbox" checked={!options.hide.has(key)} onChange={() => toggleSection(key)} />
            <span>{label}</span>
          </label>
        ))}
      </fieldset>

      <fieldset className="cv-panel__group" disabled={options.hide.has('projects')}>
        <legend>Projects</legend>
        <div className="cv-panel__quick">
          <button type="button" onClick={() => update({ projects: null })}>highlights</button>
          <button type="button" onClick={() => update({ projects: projects.map(p => p.title) })}>all</button>
          <button type="button" onClick={() => update({ projects: [] })}>none</button>
        </div>
        {projects.map(p => (
          <label key={p.title} className="cv-panel__option">
            <input type="checkbox" checked={selected.has(p.title)} onChange={() => toggleProject(p.title)} />
            <span>{p.title} <small>{p.year} · {p.status}</small></span>
          </label>
        ))}
      </fieldset>

      <button type="button" className="cv-panel__reset" onClick={onReset}>Reset to defaults</button>
    </aside>
  );
}
