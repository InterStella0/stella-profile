import React from 'react';

function handleContactClick(e) {
  const card = document.getElementById('contact');
  if (!card) return; // on /projects: let the /#contact link load the front page
  e.preventDefault();

  const rect = card.getBoundingClientRect();
  window.scrollTo({
    top: window.scrollY + rect.top - window.innerHeight / 2 + rect.height / 2,
    behavior: 'smooth',
  });

  card.classList.add('contact--active');

  const dismiss = (evt) => {
    if (!card.contains(evt.target)) {
      card.classList.remove('contact--active');
      document.removeEventListener('click', dismiss);
    }
  };
  setTimeout(() => document.addEventListener('click', dismiss), 50);
}

export default function Nav({ scrolled, page = 'home' }) {
  // Section links point back at the front page when we're on /projects.
  const home = page === 'home' ? '' : '/';

  return (
    <nav className={`nav${scrolled ? ' nav--scrolled' : ''}`}>
      <a href={home || '#'} className="nav__logo">
        <span className="nav__sparkle">✦</span>
        queeniemella
      </a>

      <ul className="nav__links">
        <li><a href={`${home}#about`}>About me</a></li>
        <li><a href={`${home}#skills`}>Skills</a></li>
        <li><a href={`${home}#work`}>Work</a></li>
        <li className="nav__item--page">
          <a
            href="/projects"
            className={page === 'projects' ? 'nav__link--current' : undefined}
            aria-current={page === 'projects' ? 'page' : undefined}
          >
            Projects
          </a>
        </li>
        <li><a href={`${home}#supporters`}>Supporters</a></li>
        <li>
          <a href={`${home}#contact`} className="nav__cta" onClick={handleContactClick}>
            Get in touch!
          </a>
        </li>
      </ul>
    </nav>
  );
}
