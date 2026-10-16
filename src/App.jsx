import React, { useState, useEffect } from 'react';
import Nav from './components/Nav';
import Hero from './components/Hero';
import About from './components/About';
import Resume from './components/Resume';
import Work from './components/Work';
import Supporters from './components/Supporters';
import Footer from './components/Footer';
import Book from './components/Book';
import AllProjects from './components/AllProjects';
import CVGenerator from './components/cv/CVGenerator';
import { observeReveals } from './reveal';

// Only three pages, so the path is checked directly instead of pulling in a router.
const page = { '/projects': 'projects', '/cv': 'cv' }[window.location.pathname.replace(/\/+$/, '')] ?? 'home';

export default function App() {
  // The CV generator is its own screen: no nav, footer or scroll effects.
  if (page === 'cv') return <CVGenerator />;
  return <Site />;
}

function Site() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // /projects has a short header, so the nav turns solid much sooner there.
    const threshold = () => (page === 'projects' ? 380 : window.innerHeight * 0.75);
    const onScroll = () => setScrolled(window.scrollY > threshold());
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Content renders after /api/content loads, so the browser's own jump to
  // e.g. /#work (from the /projects nav) has already missed; redo it.
  useEffect(() => {
    if (page === 'home' && window.location.hash.length > 1) {
      document.getElementById(window.location.hash.slice(1))?.scrollIntoView();
    }
  }, []);

  // Scroll-in entrance animations (see styles/motion.css).
  useEffect(() => observeReveals(), []);

  return (
    <>
      <Nav scrolled={scrolled} page={page} />
      {page === 'projects' ? (
        <AllProjects />
      ) : (
        <>
          <Hero />
          <About />
          <Resume />
          <Work />
          <Supporters />
        </>
      )}
      <Footer />
    </>
  );
}
