import React from 'react';
import { LuLock } from 'react-icons/lu';

const LICENSE_URL = 'https://github.com/InterStella0/stella-profile/blob/main/LICENSE';

export default function Footer() {
  return (
    <footer className="footer">
      <a href={LICENSE_URL} className="footer__link" target="_blank" rel="noopener noreferrer">
        MIT License
      </a>
      <a href="/admin/" className="footer__link footer__link--login">
        <LuLock size={12} strokeWidth={1.8} /> login
      </a>
    </footer>
  );
}
