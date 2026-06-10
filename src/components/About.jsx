import React from 'react';
import { LuMapPin, LuMail, LuPhone } from 'react-icons/lu';
import { SiGithub, SiDiscord, SiKofi } from 'react-icons/si';
import { personal } from '../data/content';

const socialIcons = { github: SiGithub, discord: SiDiscord, kofi: SiKofi };

export default function About() {
  return (
    <section className="about" id="about">
      <div className="about__inner">
        {/* Left */}
        <div>
          <h2 className="about__heading">
            Hello,<br />
            I'm {personal.name}!
          </h2>
          <p className="about__bio">{personal.longBio}</p>
          <div className="about__social-links">
            {personal.socialLinks.map(({ key, href, label }) => {
              const Icon = socialIcons[key];
              return (
                <a key={key} href={href} className="about__link" target="_blank" rel="noopener noreferrer">
                  <Icon size={14} /> {label}
                </a>
              );
            })}
          </div>
        </div>

        {/* Right – photo + badges + contact */}
        <div className="about__photo-area">
          <div className="about__photo-circle" />
          <div className="about__photo-bg" />
          <img
            className="about__photo"
            src={personal.photoAbout}
            alt="portrait"
          />
          <span className="about__badge about__badge--dob">{personal.dob}</span>
          <span className="about__badge about__badge--nat">{personal.nationality}</span>

          <div className="about__contact" id="contact">
            <h3>Contact</h3>
            {personal.contact.location && (
              <div className="about__contact-item">
                <LuMapPin size={14} strokeWidth={1.5} /> {personal.contact.location}
              </div>
            )}
            {personal.contact.email && (
              <div className="about__contact-item">
                <LuMail size={14} strokeWidth={1.5} /> {personal.contact.email}
              </div>
            )}
            {personal.contact.phone && (
              <div className="about__contact-item">
                <LuPhone size={14} strokeWidth={1.5} /> {personal.contact.phone}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
