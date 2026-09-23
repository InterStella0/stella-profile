import React from 'react';
import { LuLock } from 'react-icons/lu';
import { SiGithub } from 'react-icons/si';

const REPOSITORY_URL = 'https://github.com/InterStella0/stella-profile';
const LICENSE_URL = 'https://github.com/InterStella0/stella-profile/blob/main/LICENSE';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__links">
        <a
          href={REPOSITORY_URL}
          className="footer__link footer__link--source"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View this site's source code on GitHub"
        >
          <SiGithub size={18} aria-hidden="true" />
          Open source on GitHub
        </a>
        <a href={LICENSE_URL} className="footer__link" target="_blank" rel="noopener noreferrer">
          MIT License
        </a>
      </div>
      <a href="/admin/" className="footer__link footer__link--login">
        <LuLock size={12} strokeWidth={1.8} /> login
      </a>
    </footer>
  );
}
