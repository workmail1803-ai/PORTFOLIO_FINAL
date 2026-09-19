import { achievements, certifications, posts, testimonials } from './data/content.ts';

export type RouteName =
  | 'home'
  | 'about'
  | 'projects'
  | 'case'
  | 'skills'
  | 'build'
  | 'lab'
  | 'education'
  | 'resume'
  | 'playground'
  | 'achievements'
  | 'blog'
  | 'contact';

type RouteDef = {
  name: RouteName;
  path: string;
  label: string;
  nav: 'primary' | 'more' | 'none';
  /** A page whose data does not exist yet is not routed at all. */
  enabled: boolean;
};

export const ROUTES: RouteDef[] = [
  { name: 'home', path: '/', label: 'Home', nav: 'primary', enabled: true },
  { name: 'about', path: '/about', label: 'About', nav: 'primary', enabled: true },
  { name: 'projects', path: '/projects', label: 'Projects', nav: 'primary', enabled: true },
  { name: 'case', path: '/projects/:id', label: 'Case study', nav: 'none', enabled: true },
  { name: 'skills', path: '/skills', label: 'Skills', nav: 'primary', enabled: true },
  { name: 'lab', path: '/lab', label: 'Lab', nav: 'primary', enabled: true },
  { name: 'contact', path: '/contact', label: 'Contact', nav: 'primary', enabled: true },
  { name: 'build', path: '/build-log', label: 'Build log', nav: 'more', enabled: true },
  { name: 'education', path: '/education', label: 'Education', nav: 'more', enabled: true },
  { name: 'resume', path: '/resume', label: 'Résumé', nav: 'more', enabled: true },
  { name: 'playground', path: '/playground', label: 'Playground', nav: 'more', enabled: true },
  {
    name: 'achievements',
    path: '/achievements',
    label: 'Achievements',
    nav: 'more',
    enabled: achievements.length + certifications.length > 0,
  },
  { name: 'blog', path: '/blog', label: 'Writing', nav: 'more', enabled: posts.length > 0 },
];

export const hasTestimonials = testimonials.length > 0;

export const routePatterns = ROUTES.filter(r => r.enabled).map(r => [r.name, r.path] as [string, string]);

export const pathFor = (name: RouteName) => ROUTES.find(r => r.name === name)!.path;
