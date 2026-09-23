import React, { useEffect, useRef, useState } from 'react';

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
  // Mobile only: the links collapse into a dropdown behind the menu button.
  const [open, setOpen] = useState(false);
  const navRef = useRef(null);
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && close();
    const onClick = (e) => !navRef.current.contains(e.target) && close();
    document.addEventListener('keydown', onKey);
    document.addEventListener('click', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('click', onClick);
    };
  }, [open]);

  return (
    <nav
      ref={navRef}
      className={`nav${scrolled ? ' nav--scrolled' : ''}${open ? ' nav--open' : ''}`}
    >
      <a href={home || '#'} className="nav__logo" onClick={close}>
        <span className="nav__sparkle">✦</span>
        queeniemella
      </a>

      <button
        type="button"
        className="nav__toggle"
        aria-expanded={open}
        aria-controls="nav-links"
        aria-label={open ? 'Close menu' : 'Open menu'}
        onClick={() => setOpen(o => !o)}
      >
        <span />
        <span />
        <span />
      </button>

      <ul className="nav__links" id="nav-links" onClick={e => e.target.closest('a') && close()}>
        <li><a href={`${home}#about`}>About me</a></li>
        <li><a href={`${home}#skills`}>Skills</a></li>
        <li><a href={`${home}#work`}>Work</a></li>
        <li>
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
