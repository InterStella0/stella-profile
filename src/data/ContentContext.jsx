import React, { createContext, useContext, useEffect, useState } from 'react';

// ─── Site content comes from the backend (edit it at /admin) ─────────────────

const ContentContext = createContext(null);

// Values computed from the raw data (these used to live in content.js).
function derive(raw) {
  const { personal } = raw;
  const allProjects = [...raw.allProjects].sort((a, b) => b.year - a.year);

  return {
    ...raw,
    allProjects,
    featuredProjects: allProjects.filter(p => !p.secret),
    profile: {
      nicknames: [personal.name, ...personal.socialLinks.map(s => s.label)],
      bornYear: parseInt(personal.dob.split(' ').pop()),
      feelings: personal.longBio,
    },
    selfie: {
      src: personal.photoAbout,
      caption: personal.tagline,
    },
    contacts: [
      { kind: 'email', label: 'email', value: personal.contact.email, href: `mailto:${personal.contact.email}` },
      ...personal.socialLinks.map(s => ({ kind: s.key, label: s.key, value: s.label, href: s.href })),
    ],
  };
}

export function ContentProvider({ children }) {
  const [content, setContent] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/content')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(raw => !cancelled && setContent(derive(raw)))
      .catch(err => !cancelled && setError(err));
    return () => { cancelled = true; };
  }, []);

  if (error) {
    return <div className="content-status">couldn't load this page right now — please try again later ♡</div>;
  }
  if (!content) {
    return <div className="content-status">loading…</div>;
  }
  return <ContentContext.Provider value={content}>{children}</ContentContext.Provider>;
}

export function useContent() {
  const content = useContext(ContentContext);
  if (!content) throw new Error('useContent() must be used inside <ContentProvider>');
  return content;
}
