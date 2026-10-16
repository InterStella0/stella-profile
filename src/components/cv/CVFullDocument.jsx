import React, { forwardRef } from 'react';
import { useContent } from '../../data/ContentContext.jsx';
import { formatCount } from '../../data/useCommits';
import { CVHeader, CommitStats, bare } from './CVDocument';

// The in-depth CV: the resume's header, then one column that runs on over as many
// A4 pages as it needs, with everything the resume leaves out.

function Section({ title, children }) {
  return (
    <section className="cvf-section">
      <h2 className="cvf-title">{title}</h2>
      {children}
    </section>
  );
}

// One dated row: the date in the gutter, the details beside it.
function Entry({ when, title, aside, sub, children }) {
  return (
    <div className="cvf-entry">
      <div className="cvf-entry__when">{when}</div>
      <div className="cvf-entry__body">
        <div className="cvf-entry__head">
          <span className="cvf-entry__title">{title}</span>
          {aside && <span className="cvf-entry__aside">{aside}</span>}
        </div>
        {sub && <div className="cvf-entry__sub">{sub}</div>}
        {children}
      </div>
    </div>
  );
}

function Points({ items }) {
  if (!items?.length) return null;
  return <ul className="cv-points cvf-points">{items.map((point, i) => <li key={i}>{point}</li>)}</ul>;
}

function Rated({ label, items }) {
  if (!items.length) return null;
  return (
    <>
      <dt>{label}</dt>
      <dd className="cvf-rated">
        {items.map(s => (
          <div key={s.name}>
            <div className="cvf-rated__head">
              <span className="cvf-rated__name">{s.name}</span>
              <span className="cvf-rated__level">{s.level}</span>
            </div>
            <div className="cvf-rated__track"><div className="cvf-rated__fill" style={{ width: `${s.percent}%` }} /></div>
          </div>
        ))}
      </dd>
    </>
  );
}

function Tags({ label, items }) {
  if (!items.length) return null;
  return (
    <>
      <dt>{label}</dt>
      <dd className="cv-pills">{items.map(t => <span key={t} className="cv-pill">{t}</span>)}</dd>
    </>
  );
}

const CVFullDocument = forwardRef(function CVFullDocument({
  show, contacts, experience, education, activities, projects, projectDescriptions, photoSrc, photoY, name, echo, commits,
}, ref) {
  const { personal, skills, languages, hobbies } = useContent();
  const profile = personal.longBio.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  const details = [['Date of birth', personal.dob], ['Nationality', personal.nationality]].filter(([, value]) => value);
  const showCommits = show('commits') && Boolean(commits);
  const schooling = education.filter(e => !e.certification);
  const certifications = education.filter(e => e.certification);
  const traits = show('traits') ? skills.traits : [];
  const hasSkills = show('skills') && [skills.coding, skills.frameworks, skills.software, skills.design].some(l => l.length);
  const sources = commits && [commits.github != null && 'GitHub', commits.gitlab != null && 'GitLab'].filter(Boolean);

  return (
    <article className="cv-sheet cv-sheet--full" ref={ref}>
      <CVHeader
        contacts={contacts}
        photoSrc={photoSrc}
        photoY={photoY}
        name={name}
        echo={echo}
        commits={showCommits ? commits : null}
      />

      {showCommits && (
        <div className="cv-strip">
          <p className="cv-strip__profile">
            <b className="cvf-strip__label">Code activity</b>
            {sources.length > 0 && <> across {sources.join(' and ')}</>}
          </p>
          <CommitStats commits={commits} />
        </div>
      )}

      <div className="cvf-body">
        {show('profile') && profile.length > 0 && (
          <Section title="Profile">
            {profile.map((p, i) => <p key={i} className="cvf-para">{p}</p>)}
          </Section>
        )}

        {show('personal') && details.length > 0 && (
          <Section title="Personal Details">
            <dl className="cvf-details">
              {details.map(([label, value]) => (
                <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
              ))}
            </dl>
          </Section>
        )}

        {show('experience') && experience.length > 0 && (
          <Section title="Experience">
            {experience.map((e, i) => (
              <Entry key={i} when={e.year} title={e.role} sub={e.employer ?? e.company?.replace(/^at\s+/i, '')}>
                {e.desc && <p className="cvf-para">{e.desc}</p>}
                <Points items={e.points} />
              </Entry>
            ))}
          </Section>
        )}

        {show('education') && schooling.length > 0 && (
          <Section title="Education">
            {schooling.map((e, i) => (
              <Entry key={i} when={e.years} title={e.degree} sub={e.org}>
                <Points items={e.points} />
              </Entry>
            ))}
          </Section>
        )}

        {show('certifications') && certifications.length > 0 && (
          <Section title="Certifications">
            {certifications.map((e, i) => (
              <Entry key={i} when={e.years} title={e.degree} sub={e.org}>
                <Points items={e.points} />
              </Entry>
            ))}
          </Section>
        )}

        {show('projects') && projects.length > 0 && (
          <Section title="Projects">
            {projects.map(p => (
              <Entry
                key={p.title}
                when={p.year}
                title={p.title}
                aside={(p.stars || p.status !== 'active') && (
                  <>
                    {p.stars ? <><em aria-hidden="true">✦</em>{formatCount(p.stars)} star{p.stars === 1 ? '' : 's'}</> : null}
                    {p.stars && p.status !== 'active' ? ' · ' : null}
                    {p.status !== 'active' ? p.status : null}
                  </>
                )}
              >
                {/* The private description when there is one (never for confidential projects), else the blurb */}
                {(projectDescriptions[p.title] ?? p.blurb).split(/\n\s*\n/).map((para, i) => (
                  <p key={i} className="cvf-para">{para}</p>
                ))}
                {(p.tags.length > 0 || p.link || p.github) && (
                  <div className="cv-project__meta">
                    {p.tags.map(t => <span key={t} className="cv-pill">{t}</span>)}
                    {[p.link, p.github].filter(Boolean).map(href => (
                      <a key={href} className="cv-project__link" href={href}>{bare(href)}</a>
                    ))}
                  </div>
                )}
              </Entry>
            ))}
          </Section>
        )}

        {(hasSkills || traits.length > 0) && (
          <Section title="Skills">
            <dl className="cvf-skills">
              {hasSkills && (
                <>
                  <Rated label="Programming Languages" items={skills.coding} />
                  <Rated label="Frameworks" items={skills.frameworks} />
                  <Tags label="Software & Tools" items={skills.software} />
                  <Tags label="Design" items={skills.design} />
                </>
              )}
              <Tags label="Traits" items={traits} />
            </dl>
          </Section>
        )}

        {show('languages') && languages.length > 0 && (
          <Section title="Languages">
            <dl className="cvf-details">
              {languages.map(l => (
                <div key={l.name}><dt>{l.name}</dt><dd>{l.level}</dd></div>
              ))}
            </dl>
          </Section>
        )}

        {show('activities') && activities.length > 0 && (
          <Section title="Activities">
            {activities.map((a, i) => <Entry key={i} when={a.year} title={a.event} sub={a.role} />)}
          </Section>
        )}

        {show('hobbies') && hobbies.length > 0 && (
          <Section title="Hobbies & Interests">
            <p className="cvf-para cvf-inline">
              {hobbies.map(h => <span key={h.label}>{h.label}</span>)}
            </p>
          </Section>
        )}

        {show('references') && (
          <Section title="References">
            <p className="cvf-para">Available upon request.</p>
          </Section>
        )}
      </div>
    </article>
  );
});

export default CVFullDocument;
