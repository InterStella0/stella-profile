import { forwardRef } from 'react';
import Page from '../Page.jsx';
import { profile, selfie } from '../../data/content.js';

const AboutPage = forwardRef(function AboutPage({ pageNumber }, ref) {
  const age = new Date().getFullYear() - profile.bornYear;

  return (
    <Page ref={ref} pageId="about" pageNumber={pageNumber}>
      <h2 className="heading">
        <span className="bracket">[</span> about me{' '}
        <span className="bracket">]</span>
      </h2>
      <div className="doodle-line" />

      <figure className="taped taped--selfie">
        <img src={selfie.src} alt={selfie.caption} />
        {selfie.caption && (
          <figcaption className="taped__caption">{selfie.caption}</figcaption>
        )}
      </figure>

      <p className="scribble">
        hello! you can call me{' '}
        {profile.nicknames.map((n, i) => (
          <span key={n}>
            <span className="nick">{n}</span>
            {i < profile.nicknames.length - 1 ? ' / ' : ' '}
          </span>
        ))}
        ✿
      </p>
      <p className="scribble">
        i was born in {profile.bornYear} — that makes me {age} this year :)
      </p>

      <h3 className="subheading">how i feel</h3>
      <p className="scribble">{profile.feelings}</p>
    </Page>
  );
});

export default AboutPage;
