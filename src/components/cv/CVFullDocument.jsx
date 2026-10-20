import React, { forwardRef } from 'react';
import { useContent } from '../../data/ContentContext.jsx';
import { CVHeader, CommitStats, MoreProjects, bare, educationTitle } from './CVDocument';

// The in-depth CV: the resume's header, then one column that runs on over as many
// pages as it needs, with everything the resume leaves out.

// A labelled row of pills: plain names, or rated skills ({ name, level }) with the level word
// when `levels` is on. No bars or percentages: they read as guesses on paper.
function Tags({ label, items, levels = false }) {
  if (!items.length) return null;
  return (
    <>
      <dt>{label}</dt>
      <dd className="cv-pills">
        {items.map(t => (
          <span key={t.name ?? t} className="cv-pill">
            {t.name ?? t}
            {levels && t.level && <small className="cv-pill__level">{t.level}</small>}
          </span>
        ))}
      </dd>
    </>
  );
}

function Section({ title, children }) {
  return (
    <section className="cvf-section">
      <h2 className="cvf-title">{title}</h2>
      {children}
    </section>
  );
}

// One dated row: the date in the gutter, the details beside it.
function Entry({ when, title, aside, sub, className = '', children }) {
  return (
    <div className={`cvf-entry ${className}`}>
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

// A project's description (the private one when there is one, never for confidential projects,
// else the blurb), then its tags and links.
function ProjectDetails({ p, description }) {
  return (
    <>
      {(description ?? p.blurb).split(/\n\s*\n/).map((para, i) => (
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
    </>
  );
}

// Under a job: each project made there, written up in full.
function JobProjects({ items, projectDescriptions }) {
  if (!items.length) return null;
  return (
    <div className="cvf-job-projects">
      <div className="cvf-job-projects__label">Key projects</div>
      {items.map(p => (
        <div key={p.title} className="cvf-job-project">
          <div className="cvf-entry__head">
            <span className="cvf-job-project__title">{p.title}</span>
            <span className="cvf-entry__aside">{p.year}</span>
          </div>
          <ProjectDetails p={p} description={projectDescriptions[p.title]} />
        </div>
      ))}
    </div>
  );
}


const CVFullDocument = forwardRef(function CVFullDocument({
  show, contacts, experience, education, activities, projects, projectDescriptions, profile: profileText, photoSrc, photoY,
  name, echo, commits, levels = false,
}, ref) {
  const { personal, skills, languages, hobbies, allProjects } = useContent();
  // The CV profile (or the site's long bio), a paragraph per blank-line-separated block.
  const profile = profileText.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  const details = [['Date of birth', personal.dob], ['Nationality', personal.nationality]].filter(([, value]) => value);
  const showCommits = show('commits') && Boolean(commits);
  // Projects written up under their job aren't repeated under Projects, which then holds the personal ones.
  const byTitle = new Map(allProjects.map(p => [p.title, p]));
  const jobProjects = e => e.projects.map(t => byTitle.get(t)).filter(Boolean);
  const showExperience = show('experience') && experience.length > 0;
  const atJobs = new Set(showExperience ? experience.flatMap(e => e.projects) : []);
  const ownProjects = projects.filter(p => !atJobs.has(p.title));
  const traits = show('traits') ? skills.traits : [];
  const hasSkills = show('skills') && [skills.coding, skills.frameworks, skills.software, skills.tools, skills.design].some(l => l.length);
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

      {/* The black strip stays as a slim band when code activity is off */}
      <div className={`cv-strip${showCommits ? '' : ' cv-strip--bare'}`}>
        {showCommits && (
          <>
            <p className="cv-strip__profile">
              <b className="cvf-strip__label">Code activity</b>
              {sources.length > 0 && <> across {sources.join(' and ')}</>}
            </p>
            <CommitStats commits={commits} />
          </>
        )}
      </div>

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

        {showExperience && (
          <Section title="Experience">
            {experience.map((e, i) => (
              // A job with projects may run across a page break; each project holds together.
              <Entry
                key={i}
                when={e.year}
                title={e.role}
                sub={e.employer ?? e.company?.replace(/^at\s+/i, '')}
                className={e.projects.length ? 'cvf-entry--long' : ''}
              >
                {e.desc && <p className="cvf-para">{e.desc}</p>}
                <Points items={e.points} />
                <JobProjects items={jobProjects(e)} projectDescriptions={projectDescriptions} />
              </Entry>
            ))}
          </Section>
        )}

        {show('education') && education.length > 0 && (
          <Section title={educationTitle(education)}>
            {education.map((e, i) => (
              <Entry key={i} when={e.years} title={e.degree} sub={e.org}>
                <Points items={e.points} />
              </Entry>
            ))}
          </Section>
        )}

        {show('projects') && ownProjects.length > 0 && (
          <Section title={atJobs.size ? 'Personal Projects' : 'Projects'}>
            {ownProjects.map(p => (
              <Entry key={p.title} when={p.year} title={p.title}>
                <ProjectDetails p={p} description={projectDescriptions[p.title]} />
              </Entry>
            ))}
            {show('projects-link') && <MoreProjects />}
          </Section>
        )}

        {(hasSkills || traits.length > 0) && (
          <Section title="Skills">
            <dl className="cvf-skills">
              {hasSkills && (
                <>
                  <Tags label="Programming Languages" items={skills.coding} levels={levels} />
                  <Tags label="Frameworks" items={skills.frameworks} levels={levels} />
                  <Tags label="Software" items={skills.software} />
                  <Tags label="Tools" items={skills.tools} />
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
