// ─── Edit everything about you here ──────────────────────────────────────────

export const personal = {
  name: 'mella',
  tagline: 'fullstack & creative developer',
  photoHero:  '/selfies/real_selfie.png',
  photoAbout: '/selfies/art_writing.png',
  bio: 'Unironically spread love and being really nice should be our priority! If you buy more bed room, you will have less bedroom!',
  longBio:
    'I am a Software Designer and Developer. I have a passion in software engineering as a whole along with Internet of Things (IoT), and Machine Learning fields. I have built software for Web, Mobile, and Geospatial applications. \n\nI started from self-taught programming at the age of 16 all the way until I went to university and started working. Now I want to reach for the stars~',
  dob: '26th June 2000',
  nationality: 'Malaysian',
  socialLinks: [
    { key: 'github',  href: 'https://github.com/InterStella0',               label: 'InterStella0'  },
    { key: 'discord', href: 'https://discord.com/users/718854043899920395',   label: 'flowerpad'  },
    { key: 'kofi',    href: 'https://ko-fi.com/interstella0',                 label: 'interstella0'  },
  ],
  contact: {
    location: 'Kuala Lumpur, Malaysia',
    email: 'contact@queeniemella.cc',
  },
};

export const education = [
  {
    years: '2018 – 2020',
    org: 'University Technology MARA (UiTM)',
    degree: 'Diploma in Computer Science',
  },
  {
    years: '2021 – 2023',
    org: 'University Technology MARA (UiTM)',
    degree: 'Bachelors in Computer Science',
  },
  {
    years: '2025',
    org: 'Python Institute',
    degree: 'Certified Associate in Python Programming',
  },
];

export const experience = [
  {
    year: '2020-2021',
    role: 'Software Designer',
    company: 'at [Redacted]',
    desc: 'Internship and Part-time as a software designer.',
  },
  {
    year: '2023-today',
    role: 'System Developer',
    company: 'at [Redacted]',
    desc: 'Full-time software developer.',
  },
];

export const activities = [
  {
    year: '2016',
    event: "Donating to the homeless",
    role: 'Volunteer in distributing items.',
  },
  {
    year: '2017',
    event: "National High school Day Parade",
    role: 'Ceremonial Performer.',
  },
  {
    year: '2019',
    event: 'Beach clean-up',
    role: 'Volunteer in cleaning up the local beach.',
  },
];

export const skills = {
  software: ['PS', 'AI', 'Xd', 'QGIS'],
  coding: [
    { name: 'Python',     level: 'Mastered',     percent: 100 },
    { name: 'HTML/CSS',   level: 'Mastered',     percent: 95  },
    { name: 'Rust',       level: 'Advanced',     percent: 70  },
    { name: 'JavaScript/TypeScript', level: 'Advanced', percent: 60  },
    { name: 'Java',        level: 'Intermediate', percent: 55  },
    { name: 'C#',        level: 'Intermediate', percent: 50  },
    { name: 'C',        level: 'Intermediate', percent: 40  },
    { name: 'PHP',        level: 'Beginner', percent: 30  },
  ],
  frameworks: [
    { name: 'React.js',      level: 'Mastered',     percent: 90  },
    { name: 'Poem',      level: 'Mastered',     percent:  87 },
    { name: 'FastAPI',      level: 'Advanced',     percent:  80 },
    { name: 'Django',     level: 'Advanced', percent: 80  },
    { name: 'Next.js',      level: 'Advanced',     percent:  65 },
    { name: 'Android Java',      level: 'Intermediate',     percent:  55 },
    { name: 'arcpy',      level: 'Intermediate',     percent:  50 },
    { name: 'Arduino',      level: 'Beginner',     percent:  20 },
  ],
  design: ['Thinking', 'UI/UX design', 'User Research', 'Clarity'],
  traits: ['Creativity', 'Communication', 'Detail-oriented', 'Adaptability'],
};

export const languages = [
  { name: 'Malay', level: 'Native' },
  { name: 'English', level: 'Fluent' },
  { name: 'Korean', level: 'Intermediate' },
  { name: 'Chinese', level: 'Beginner' },
];

export const hobbies = [
  { icon: 'Code',    label: 'Programming' },
  { icon: 'Youtube', label: 'YouTube' },
  { icon: 'Palette', label: 'Digital Art' },
  { icon: 'Gamepad2', label: 'Gaming' },
  { icon: 'Cat',     label: 'Cat, cat & cat' },
  { icon: 'Scissors',  label: 'Knitting' },
];

export const allProjects = [
  {
    title: 'Stel Time',
    year: 2026,
    image: '/projects/stel-time.gif',
    blurb: 'A discord bot to show the current time of your friends!',
    link: 'https://github.com/InterStella0/stel-time',
    tags: ['Python'],
  },
  {
    title: 'ZEGraph',
    year: 2025,
    images: [
    '/projects/zegraph.png',
    '/projects/zegraph-maps.png',
    '/projects/zegraph-radar.png',
    '/projects/zegraph-3d.png',
    '/projects/zegraph-players.png',
    ],
    blurb: 'Zombie escape player statistics!',
    link: 'https://zegraph.xyz',
    tags: ['Rust', 'Next.js', 'Poem', 'TypeScript'],
  },
  {
    title: 'Stemoji',
    year: 2025,
    image: 'https://storage.ko-fi.com/cdn/useruploads/display/1b69b8fc-f613-4eee-910a-16b92d783bf9_steal_emoji.gif',
    blurb: 'Discord emoji bot that can be self-hosted.',
    link: 'https://github.com/InterStella0/stemoji',
    tags: ['Python'],
  },
  {
    title: 'Discord Video Downloader',
    year: 2025,
    image: 'https://storage.ko-fi.com/cdn/useruploads/display/de7bfb0a-0cda-42b3-a753-9e78a731d95a_demo-downlo-yt-ezgif.com-video-to-gif-converter.gif',
    blurb: 'Self hosted discord bot that allows for video link downloads, such as YouTube, Twitch Clips, and other platforms.',
    link: 'https://github.com/InterStella0/discord-video-downloader',
    tags: ['Python'],
  },
  {
    title: 'Flash flood prediction through Machine Learning',
    year: 2025,
    image: '/placeholder/github.svg',
    blurb: 'A data-driven machine learning model for predicting flash flood occurrence for the entire Malaysia.',
    secret: true,
    tags: ['Python', 'QGIS'],
  },
  {
    title: 'CS2 Console HUD',
    year: 2024,
    image: 'https://raw.githubusercontent.com/InterStella0/cs2_console_hud/main/asset/showcase.gif',
    blurb: 'Mangohud addon program for CS2.',
    link: 'https://github.com/InterStella0/cs2_console_hud',
    tags: ['Rust'],
  },
  {
    title: 'starlight',
    year: 2022,
    image: '/placeholder/github.svg',
    blurb: 'Discord.py utility library for discord developers.',
    link: 'https://github.com/InterStella0/starlight-dpy',
    tags: ['Python'],
  },
  {
    title: 'RTU Monitoring System',
    year: 2024,
    images: [
        '/projects/RTU1.png',
        '/projects/RTU2.png',
        '/projects/RTU3.png',
    ],
    blurb: 'Proprietary website made for monitoring RTU Stations for the entire Malaysia.',
    secret: true,
    tags: ['React.js', 'Poem', 'Rust', 'TypeScript'],
  },
  {
    title: 'Geospatial database search',
    year: 2023,
    images: [
        '/projects/search-db.png',
        '/projects/search-db-2.png',
    ],
    blurb: 'A system that can view geospatial data and can be searched by attributes.',
    secret: true,
    tags: ['Python', 'arcpy', 'Django', 'React.js', 'JavaScript', 'ArcMap'],
  },
  {
    title: 'AI Lip reading video platform',
    year: 2023,
    image: '/placeholder/github.svg',
    blurb: 'Integration of lip reading machine learning model with a YouTube like platform.',
    secret: true,
    tags: ['Python', 'JavaScript'],
  },
  {
    title: 'discord iot bot',
    year: 2022,
    image: '/projects/AC.png',
    blurb: 'A personal discord bot that monitor and controls IoT devices.',
    tags: ['Python', 'Arduino'],
  },
  {
    title: 'stella bot website',
    year: 2021,
    image: '/projects/stella-bot-website.png',
    blurb: 'A website built to integrate with stella bot.',
    link: 'https://github.com/InterStella0/StellaBotWebApp',
    tags: ['C#', '.Net Core', 'JavaScript'],
  },
  {
    title: 'stella bot',
    year: 2020,
    image: '/placeholder/github.svg',
    blurb: 'A personal discord bot that I made where people used it as a reference for their own bots.',
    link: 'https://github.com/InterStella0/stella_bot',
    tags: ['Python'],
  },
].sort((a, b) => b.year - a.year);

export const featuredProjects = allProjects.filter(p => !p.secret);

export const profile = {
  nicknames: [personal.name, ...personal.socialLinks.map(s => s.label)],
  bornYear: parseInt(personal.dob.split(' ').pop()),
  feelings: personal.longBio,
};

export const selfie = {
  src: personal.photoAbout,
  caption: personal.tagline,
};

export const contacts = [
  { kind: 'email', label: 'email', value: personal.contact.email, href: `mailto:${personal.contact.email}` },
  ...personal.socialLinks.map(s => ({ kind: s.key, label: s.key, value: s.label, href: s.href })),
];

export const supporters = [
  'slyn',
  'Andrei',
  'Longus Dongus',
  'Vynd',
  'Acaro',
  'Mod',
  'Lunariaem',
  'mangaka',
  'Planet P',
  'Kemuri',
  'Mesturpate',
  'Resonance',
  'monke',
  'Aurora',
];
