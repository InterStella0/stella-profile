import { forwardRef } from 'react';
import Page from '../Page.jsx';

const BackCoverPage = forwardRef(function BackCoverPage(props, ref) {
  return (
    <Page ref={ref} variant="cover">
      <div className="cover">
        <h1 className="cover__title">the end ♡</h1>
        <div className="doodle-line" />
        <p className="cover__hint">thanks for flipping through!</p>
      </div>
    </Page>
  );
});

export default BackCoverPage;
