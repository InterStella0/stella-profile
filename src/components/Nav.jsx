import React from 'react';

function handleContactClick(e) {
  e.preventDefault();
  const card = document.getElementById('contact');
  if (!card) return;

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

export default function Nav({ scrolled }) {
  return (
    <nav className={`nav${scrolled ? ' nav--scrolled' : ''}`}>
      <a href="#" className="nav__logo">
        <span className="nav__sparkle">✦</span>
        queeniemella
      </a>

      <ul className="nav__links">
        <li><a href="#about">About me</a></li>
        <li><a href="#resume">Resume</a></li>
        <li><a href="#work">Work</a></li>
        <li>
          <a href="#contact" className="nav__cta" onClick={handleContactClick}>
            Get in touch!
          </a>
        </li>
      </ul>
    </nav>
  );
}
