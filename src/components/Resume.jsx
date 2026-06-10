import React from 'react';
import { LuCode, LuPalette, LuCat, LuScissors, LuYoutube, LuGamepad2 } from 'react-icons/lu';
import {
  education,
  experience,
  activities,
  skills,
  languages,
  hobbies,
} from '../data/content';

const hobbyIcons = { Code: LuCode, Palette: LuPalette, Cat: LuCat, Scissors: LuScissors, Youtube: LuYoutube, Gamepad2: LuGamepad2 };

export default function Resume() {
  return (
    <section className="resume" id="resume">
      <div className="resume__left">
        <h2 className="resume__section-title">Education</h2>
        <ul className="timeline">
          {education.map((item, i) => (
            <li key={i} className="timeline__item">
              <div className="timeline__years">{item.years}</div>
              <div className="timeline__org">{item.org}</div>
              <div className="timeline__desc">{item.degree}</div>
            </li>
          ))}
        </ul>

        <div className="exp-box">
          <h2 className="resume__section-title">Experience</h2>
          <ul className="timeline">
            {experience.map((item, i) => (
              <li key={i} className="timeline__item">
                <div className="timeline__years">{item.year}</div>
                <div className="timeline__org">{item.role}</div>
                <div className="timeline__desc">
                  {item.desc}
                  {item.company && <><br />{item.company}</>}
                </div>
              </li>
            ))}
          </ul>
          <div className="tags">
            {skills.traits.map((t, i) => (
              <span key={i} className="tag">{t}</span>
            ))}
          </div>
        </div>

        <div className="activities">
          <h2 className="resume__section-title">Activities</h2>
          <ul className="timeline">
            {activities.map((item, i) => (
              <li key={i} className="timeline__item">
                <div className="timeline__years">{item.year}</div>
                <div className="timeline__org">{item.event}</div>
                <div className="timeline__desc">{item.role}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Right column ── */}
      <div className="resume__right">
        <div className="resume__watermark" aria-hidden="true">
          RESUME<br />RESUME
        </div>

        <h2 className="resume__section-title" style={{ position: 'relative', zIndex: 1 }}>
          Technical skills
        </h2>

        <div className="skills-grid">
          <div>
            <div className="skills__label">Software Skills</div>
            <div className="skill-icons">
              {skills.software.map((s, i) => (
                <div key={i} className="skill-icon">{s}</div>
              ))}
            </div>
          </div>
          <div>
            <div className="skills__label">Programming Languages</div>
            <div className="skill-bars">
              {skills.coding.map((c, i) => (
                <div key={i} className="skill-bar-item">
                  <div className="skill-bar-header">
                    <span className="skill-bar-name">{c.name}</span>
                    <span className="skill-bar-meta">{c.level} · {c.percent}%</span>
                  </div>
                  <div className="skill-bar-track">
                    <div className="skill-bar-fill" style={{ width: `${c.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="frameworks-section">
          <div className="skills__label">Frameworks</div>
          <div className="skill-bars">
            {skills.frameworks.map((f, i) => (
              <div key={i} className="skill-bar-item">
                <div className="skill-bar-header">
                  <span className="skill-bar-name">{f.name}</span>
                  <span className="skill-bar-meta">{f.level} · {f.percent}%</span>
                </div>
                <div className="skill-bar-track">
                  <div className="skill-bar-fill" style={{ width: `${f.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="design-tags">
          {skills.design.map((d, i) => (
            <span key={i} className="design-tag">{d}</span>
          ))}
        </div>

        <div className="lang-section">
          <h3 className="lang-section__title">Language</h3>
          <div className="lang-grid">
            {languages.map((l, i) => (
              <div key={i}>
                <div className="lang-item__name">{l.name}</div>
                <div className="lang-item__level">{l.level}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="hobbies-section">
          <h3 className="hobbies__title">Hobbies &amp; Interests</h3>
          <div className="hobbies-grid">
            {hobbies.map((h, i) => (
              <div key={i} className="hobby-item">
                <div className="hobby-icon">{React.createElement(hobbyIcons[h.icon], { size: 20, strokeWidth: 1.5 })}</div>
                <div className="hobby-label">{h.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
