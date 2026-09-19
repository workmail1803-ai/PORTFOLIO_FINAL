/**
 * Everything on the site that is not a project: the about copy, education and
 * the sections that are waiting for real material.
 *
 * The copy here was lifted verbatim from the previous version of the site. The
 * empty arrays are deliberate — achievements, certifications, writing and
 * testimonials do not exist yet, and their pages stay out of the navigation
 * until they do. Add an entry and the page appears; nothing is ever invented
 * to fill a layout.
 */
import { profile } from './profile.ts';

export const hero = {
  greeting: 'Hey there!',
  headline: ['Built in Dhaka.', 'Shipped to production.'],
  lede: 'products you can open right now: a national newspaper index, a study-abroad platform, a mosque directory for a country of 300,000 mosques, a storefront that lives inside a Telegram chat. Real users. Real databases. Real constraints.',
};

export const about = {
  lede: 'I am a computer science student at BRAC University who could not wait to graduate before building things people actually use.',
  paragraphs: [
    'Most of what I build is for Bangladesh, in Bangla, for problems I watched someone have. A directory because finding a newspaper meant six ad-covered aggregators. A student portal because an anxious applicant deserves to know who is holding their file. A mosque map because the information existed everywhere and nowhere.',
    'I care about the unglamorous half: permissions enforced in the database, money computed in SQL, a README that states its own limits. It is slower on day one and it is the reason these projects are still running.',
  ],
  bangla: 'যা বানাই, তা মানুষের কাজে লাগুক। এটাই আসল কথা।',
  facts: [
    ['Based in', `${profile.location} · UTC+${profile.utcOffset}`],
    ['Studying', profile.study],
    ['Working in', 'TypeScript, Python, SQL'],
    ['Open to', 'Product work, platforms, contract builds'],
  ] as Array<[string, string]>,
};

export type Education = {
  institution: string;
  field: string;
  /** Only filled in when known — never estimated. */
  degree?: string;
  period?: string;
  result?: string;
  /** Coursework that has a real, linkable artefact. */
  work?: Array<{ course: string; projectId: string }>;
};

export const education: Education[] = [
  {
    institution: 'BRAC University',
    field: 'Computer Science',
    // CSE425 is named in the SOUND-AI repository's own README.
    work: [{ course: 'CSE425: Neural Networks', projectId: 'soundai' }],
  },
];

export type Achievement = { title: string; issuer: string; date: string; url?: string; note?: string };
export type Post = {
  slug: string;
  title: string;
  date: string;
  category: string;
  excerpt: string;
  url: string;
  minutes?: number;
};
export type Testimonial = { name: string; role: string; company: string; quote: string; avatar?: string };

export const achievements: Achievement[] = [];
export const certifications: Achievement[] = [];
export const posts: Post[] = [];
export const testimonials: Testimonial[] = [];

/** Decorative handwritten notes. Never a substitute for real copy. */
export const notes = {
  hero: ['Same curiosity.', 'Bigger ideas.'],
  projects: ['Ideas → reality'],
  about: ['Good code.', 'Better tomorrow.'],
  lab: ['Keep building.'],
  build: ['One step at a time.'],
  contact: ["Let's build", 'something good.'],
  footer: ['Build.', 'Learn.', 'Create.', 'Repeat.'],
};
