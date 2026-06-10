import { forwardRef } from 'react';
import Page from '../Page.jsx';
import ProjectCard from '../ProjectCard.jsx';
import { featuredProjects } from '../../data/content.js';

const ProjectsPage = forwardRef(function ProjectsPage({ pageNumber }, ref) {
  return (
    <Page ref={ref} pageId="projects" pageNumber={pageNumber}>
      <h2 className="heading">
        <span className="bracket">[</span> things i made{' '}
        <span className="bracket">]</span>
      </h2>
      <div className="doodle-line" />
      <p className="scribble">a few favourites — turn the page for everything!</p>

      <div className="project-grid">
        {featuredProjects.map((p, i) => (
          <ProjectCard key={i} {...p} rotate={i % 2 ? 2.5 : -3} />
        ))}
      </div>
    </Page>
  );
});

export default ProjectsPage;
