import React, { forwardRef, useMemo } from 'react';
import { LuGlobe, LuMail, LuMapPin, LuPhone } from 'react-icons/lu';
import { useContent } from '../../data/ContentContext.jsx';
import { commitCurve, formatCount } from '../../data/useCommits';
import { hobbyIcons } from '../Resume';
import { socialIcons } from '../Hero';

// A static handful of the hero's starfield: [left, top, size(pt), kind].
const STARS = [
  ['3%', '10%', 11, 'glyph'],
  ['14%', '82%', 2.5, 'dot'],
  ['27%', '8%', 2, 'dot'],
  ['36%', '74%', 9, 'glyph gold'],
  ['48%', '14%', 2.5, 'dot'],
  ['58%', '86%', 2, 'dot'],
  ['66%', '6%', 8, 'glyph cream'],
  ['79%', '88%', 10, 'glyph'],
  ['88%', '9%', 2.5, 'dot'],
  ['96%', '52%', 9, 'glyph gold'],
];

// Header name size in pt: one line fills the text column; past ~14 letters it
// wraps onto two balanced lines and is sized for the longer one.
const nameSize = (text, max) => {
  const longestWord = Math.max(...text.split(/\s+/).map(w => w.length), 1);
  const perLine = text.length > 14 ? Math.max(longestWord, Math.ceil(text.length / 2)) : text.length;
  return Math.min(max, 480 / Math.max(perLine, 1));
};

// Links read as text on paper, so drop the scheme and trailing slash.
export const bare = href => href.replace(/^[a-z]+:(\/\/)?/i, '').replace(/\/$/, '');

// A link that names the handle (github.com/me) prints in full; an opaque one
// (discord.com/users/123…) prints just the handle, still linked in the PDF.
const linkText = (href, label) => (bare(href).toLowerCase().includes(label.toLowerCase()) ? bare(href) : label);

// The portfolio itself: the canonical URL from index.html, not wherever /cv is served from.
export const siteUrl = () => document.querySelector('meta[property="og:url"]')?.content || window.location.origin;

const SOCIAL_NAMES = { github: 'GitHub', discord: 'Discord', kofi: 'Ko-fi' };

// Everything the header's contact row can show; `key` lets the panel turn each one off.
export function cvContacts(personal) {
  const { contact } = personal;
  return [
    contact.email && { key: 'email', name: 'Email', Icon: LuMail, text: contact.email, href: `mailto:${contact.email}` },
    contact.phone && { key: 'phone', name: 'Phone', Icon: LuPhone, text: contact.phone, href: `tel:${contact.phone.replace(/\s+/g, '')}` },
    contact.location && { key: 'location', name: 'Location', Icon: LuMapPin, text: contact.location },
    { key: 'website', name: 'Portfolio', Icon: LuGlobe, text: bare(siteUrl()), href: siteUrl() },
    ...personal.socialLinks.map(({ key, href, label }) => ({
      key, name: SOCIAL_NAMES[key] ?? key, Icon: socialIcons[key], text: linkText(href, label), href,
    })),
  ].filter(Boolean);
}

// Under the projects: the rest are on the portfolio's /projects page.
export function MoreProjects() {
  const href = `${siteUrl().replace(/\/$/, '')}/projects`;
  return (
    <p className="cv-more">
      <em aria-hidden="true">✦</em> More projects at <a href={href}>{bare(href)}</a>
    </p>
  );
}

function Timeline({ items }) {
  return (
    <ul className="cv-timeline">
      {items.map(({ when, title, desc }, i) => (
        <li key={i} className="cv-timeline__item">
          <div className="cv-timeline__head">
            <span className="cv-timeline__title">{title}</span>
            <span className="cv-timeline__when">{when}</span>
          </div>
          {desc && <div className="cv-timeline__desc">{desc}</div>}
        </li>
      ))}
    </ul>
  );
}

function SkillBars({ label, items }) {
  if (!items.length) return null;
  return (
    <div>
      <div className="cv-label">{label}</div>
      <div className="cv-bars">
        {items.map(s => (
          <div key={s.name}>
            <div className="cv-bar__head">
              <span className="cv-bar__name">{s.name}</span>
              <span className="cv-bar__meta">{s.level} · {s.percent}%</span>
            </div>
            <div className="cv-bar__track"><div className="cv-bar__fill" style={{ width: `${s.percent}%` }} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Weekly commits as a line along the bottom of the header, as in the hero.
function CommitLine({ weekly }) {
  const { line, area, pts, peak } = useMemo(() => commitCurve(weekly, { W: 600, H: 60, TOP: 8, BASE: 58 }), [weekly]);
  return (
    <div className="cv-commits__graph" aria-hidden="true">
      <svg viewBox="0 0 600 60" preserveAspectRatio="none">
        <defs>
          <linearGradient id="cv-commits-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--orange)" stopOpacity=".28" />
            <stop offset="1" stopColor="var(--orange)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#cv-commits-fill)" />
        <path d={line} className="cv-commits__line" vectorEffect="non-scaling-stroke" />
      </svg>
      <em className="cv-commits__peak" style={{ left: `${pts[peak][0] / 6}%`, top: `${(pts[peak][1] / 60) * 100}%` }}>✦</em>
    </div>
  );
}

export function CommitStats({ commits }) {
  const { year, yearTotal, allTotal, stars, streak } = commits;
  return (
    <div className="cv-commits__stats">
      <div><b>{formatCount(yearTotal)}</b><span>commits in {year}</span></div>
      <div><b>{formatCount(allTotal)}</b><span>commits all time</span></div>
      {stars != null && <div><b><em aria-hidden="true">✦</em>{formatCount(stars)}</b><span>stars received</span></div>}
      <div><b>{streak}</b><span>day longest streak</span></div>
    </div>
  );
}

// The plum band both formats open with: photo, name, tagline and contact links,
// with the weekly commit line along its bottom when `commits` is given.
export function CVHeader({ contacts, photoSrc, photoY, name, echo, commits }) {
  const { personal } = useContent();
  const title = name.toUpperCase();
  // The site name, outlined under the name like the hero's echo lines.
  const outline = echo?.toUpperCase();
  const titleSize = nameSize(title, title.length > 14 ? 30 : 44);

  return (
    <header className="cv-header">
      {STARS.map(([left, top, size, kind], i) => (
        <em
          key={i}
          className={`cv-star ${kind.split(' ').map(k => `cv-star--${k}`).join(' ')}`}
          style={{ left, top, '--size': `${size}pt` }}
          aria-hidden="true"
        >
          {kind.startsWith('glyph') ? '✦' : null}
        </em>
      ))}

      {commits && <CommitLine weekly={commits.weekly} />}

      {photoSrc && (
        <div className="cv-photo">
          <div className="cv-photo__bg" />
          <img className="cv-photo__img" src={photoSrc} alt="" style={{ objectPosition: `50% ${photoY}%` }} />
        </div>
      )}

      <div className="cv-header__text">
        <h1 className="cv-name" style={{ '--name-size': `${titleSize}pt` }}>{title}</h1>
        {outline && (
          <div className="cv-name cv-name--outline" style={{ '--name-size': `${nameSize(outline, titleSize)}pt` }} aria-hidden="true">
            {outline}
          </div>
        )}
        <p className="cv-tagline">{personal.tagline}</p>
        <ul className="cv-contacts">
          {contacts.map(({ Icon, text, href }) => (
            <li key={text}>
              <Icon className="cv-contacts__icon" aria-hidden="true" />
              {href ? <a href={href}>{text}</a> : text}
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}

// The one-page resume: a compact two-column A4 sheet. `show(key)` says whether a section is turned on.
const CVDocument = forwardRef(function CVDocument({
  show, contacts, experience, activities, projects, photoSrc, photoY, name, echo, commits,
}, ref) {
  const { personal, education, skills, languages, hobbies } = useContent();
  const profile = personal.longBio.split(/\n\s*\n/)[0];

  // Traits sit under the experience timeline, as on the site (or alone if Experience is off).
  const traits = show('traits') && skills.traits.length > 0 && (
    <div className="cv-pills cv-traits">
      {skills.traits.map(t => <span key={t} className="cv-pill">{t}</span>)}
    </div>
  );
  const hasExperience = show('experience') && experience.length > 0;
  const showProfile = show('profile') && Boolean(profile);
  const showCommits = show('commits') && Boolean(commits);
  const schooling = education.filter(e => !e.certification);
  const certifications = education.filter(e => e.certification);

  const hasSkills = [skills.software, skills.coding, skills.frameworks, skills.design].some(list => list.length);

  return (
    <article className="cv-sheet" ref={ref}>
      <CVHeader
        contacts={contacts}
        photoSrc={photoSrc}
        photoY={photoY}
        name={name}
        echo={echo}
        commits={showCommits ? commits : null}
      />

      {/* The hero's black strip, holding the (more formal) profile paragraph and commit stats */}
      {(showProfile || showCommits) && (
        <div className="cv-strip">
          {showProfile && <p className="cv-strip__profile">{profile}</p>}
          {showCommits && <CommitStats commits={commits} />}
        </div>
      )}

      <div className="cv-body">
        <div className="cv-left">
          {hasExperience && (
            <section className="cv-block cv-exp">
              <h2 className="cv-title">Experience</h2>
              <Timeline items={experience.map(e => ({
                when: e.year,
                // The site's company reads "at [Redacted]"; the CV's employer is just the name.
                title: e.employer ? `${e.role} at ${e.employer}` : e.company ? `${e.role} ${e.company}` : e.role,
                desc: e.points.length > 0
                  ? <ul className="cv-points">{e.points.map((point, i) => <li key={i}>{point}</li>)}</ul>
                  : e.desc,
              }))} />
              {traits}
            </section>
          )}
          {!hasExperience && traits && <section className="cv-block">{traits}</section>}

          {show('education') && schooling.length > 0 && (
            <section className="cv-block">
              <h2 className="cv-title">Education</h2>
              <Timeline items={schooling.map(e => ({ when: e.years, title: e.org, desc: e.degree }))} />
            </section>
          )}

          {show('certifications') && certifications.length > 0 && (
            <section className="cv-block">
              <h2 className="cv-title">Certifications</h2>
              <Timeline items={certifications.map(e => ({ when: e.years, title: e.degree, desc: e.org }))} />
            </section>
          )}

          {show('projects') && projects.length > 0 && (
            <section className="cv-block">
              <h2 className="cv-title">Projects</h2>
              <ul className="cv-projects">
                {projects.map(p => (
                  <li key={p.title} className="cv-project">
                    <div className="cv-project__head">
                      <span className="cv-project__title">{p.title}</span>
                      <span className="cv-project__year">
                        {p.stars ? <><em aria-hidden="true">✦</em>{formatCount(p.stars)} · </> : null}{p.year}
                      </span>
                    </div>
                    <p className="cv-project__blurb">{p.blurb}</p>
                    {(p.tags.length > 0 || p.link || p.github) && (
                      <div className="cv-project__meta">
                        {p.tags.map(t => <span key={t} className="cv-pill">{t}</span>)}
                        {[p.link, p.github].filter(Boolean).map(href => (
                          <a key={href} className="cv-project__link" href={href}>{bare(href)}</a>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
              {show('projects-link') && <MoreProjects />}
            </section>
          )}
        </div>

        <div className="cv-right">
          <div className="cv-watermark" aria-hidden="true">SKILLS<br />SKILLS</div>

          {show('skills') && hasSkills && (
            <section className="cv-block">
              <h2 className="cv-title">Skills</h2>
              {skills.software.length > 0 && (
                <div className="cv-software">
                  <div className="cv-label">Software Skills</div>
                  {skills.software.map(s => <span key={s} className="cv-software__item">{s}</span>)}
                </div>
              )}
              <div className="cv-bars-grid">
                <SkillBars label="Programming Languages" items={skills.coding} />
                <SkillBars label="Frameworks" items={skills.frameworks} />
              </div>
              {skills.design.length > 0 && (
                <div className="cv-pills">
                  {skills.design.map(d => <span key={d} className="cv-pill cv-pill--cream">{d}</span>)}
                </div>
              )}
            </section>
          )}

          {show('languages') && languages.length > 0 && (
            <section className="cv-block">
              <h3 className="cv-subtitle">Language</h3>
              <div className="cv-langs">
                {languages.map(l => (
                  <div key={l.name}>
                    <div className="cv-langs__name">{l.name}</div>
                    <div className="cv-langs__level">{l.level}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {show('hobbies') && hobbies.length > 0 && (
            <section className="cv-block">
              <h3 className="cv-subtitle">Hobbies &amp; Interests</h3>
              <div className="cv-hobbies">
                {hobbies.map(h => {
                  const Icon = hobbyIcons[h.icon];
                  return (
                    <div key={h.label} className="cv-hobby">
                      <div className="cv-hobby__icon">{Icon && <Icon size={14} strokeWidth={1.5} />}</div>
                      <div className="cv-hobby__label">{h.label}</div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {show('activities') && activities.length > 0 && (
            <section className="cv-block">
              <h3 className="cv-subtitle">Activities</h3>
              <Timeline items={activities.map(a => ({ when: a.year, title: a.event, desc: a.role }))} />
            </section>
          )}

        </div>
      </div>
    </article>
  );
});

export default CVDocument;
