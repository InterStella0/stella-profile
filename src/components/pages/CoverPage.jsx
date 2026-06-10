import { forwardRef } from 'react';
import Page from '../Page.jsx';
import { profile } from '../../data/content.js';

const CoverPage = forwardRef(function CoverPage(props, ref) {
  return (
    <Page ref={ref} pageId="cover" variant="cover">
      <div className="cover">
        <p className="cover__kicker">a little notebook by</p>
        <h1 className="cover__title">{profile.nicknames[0]}</h1>
        <p className="cover__nicks">
          {profile.nicknames.slice(1).join(' ✦ ')}
        </p>
        <div className="doodle-line" />
        <p className="cover__hint">flip the corner to open me →</p>
      </div>
    </Page>
  );
});

export default CoverPage;
