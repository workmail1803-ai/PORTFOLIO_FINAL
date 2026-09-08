export const profile = {
  name: 'Nafis Hossain Momen',
  short: 'Momen',
  role: 'Full-stack engineer',
  location: 'Dhaka, Bangladesh',
  locationBn: 'ঢাকা, বাংলাদেশ',
  email: 'workmail1803.ai@gmail.com',
  github: 'https://github.com/workmail1803-ai',
  linkedin: 'https://linkedin.com/in/nafis-hossain-momen',
  whatsapp: 'https://wa.me/8801756003283',
  study: 'Computer Science, BRAC University',
  timezone: 'Asia/Dhaka',
  utcOffset: 6,
} as const;

/** Real coordinates, used by the globe. [lon, lat] */
export const places = {
  dhaka: [90.4125, 23.8103],
  rajshahi: [88.6, 24.3745],
  rome: [12.4964, 41.9028],
  vilnius: [25.2797, 54.6872],
  budapest: [19.0402, 47.4979],
  berlin: [13.405, 52.52],
  london: [-0.1276, 51.5072],
} as const;

/** Arcs drawn out of Dhaka — the routes NextUp Mentor actually places students on. */
export const routes: Array<[keyof typeof places, keyof typeof places, string]> = [
  ['dhaka', 'rome', 'Italy'],
  ['dhaka', 'vilnius', 'Lithuania'],
  ['dhaka', 'budapest', 'Hungary'],
  ['dhaka', 'berlin', 'Germany'],
  ['dhaka', 'london', 'United Kingdom'],
];
