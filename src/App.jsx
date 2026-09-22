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
import { observeReveals } from './reveal';

// Only two pages, so the path is checked directly instead of pulling in a router.
const page = window.location.pathname.replace(/\/+$/, '') === '/projects' ? 'projects' : 'home';

export default function App() {
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
