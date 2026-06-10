import { forwardRef } from 'react';
import Page from '../Page.jsx';
import ProjectCard from '../ProjectCard.jsx';
import ContactNote from '../ContactNote.jsx';
import { allProjects, contacts } from '../../data/content.js';

const WorkContactPage = forwardRef(function WorkContactPage({ pageNumber }, ref) {
  return (
    <Page ref={ref} pageId="work" pageNumber={pageNumber}>
      <h2 className="heading">
        <span className="bracket">[</span> all my work{' '}
        <span className="bracket">]</span>
      </h2>
      <div className="doodle-line" />

      <div className="project-grid project-grid--mini">
        {allProjects.map((p, i) => (
          <ProjectCard key={i} {...p} mini rotate={i % 2 ? 2 : -2.5} />
        ))}
      </div>

      <h3 className="subheading">say hi / support me</h3>
      <div className="contact-row">
        {contacts.map((c, i) => (
          <ContactNote key={c.kind} {...c} rotate={i % 2 ? 2.5 : -3} />
        ))}
      </div>
    </Page>
  );
});

export default WorkContactPage;
