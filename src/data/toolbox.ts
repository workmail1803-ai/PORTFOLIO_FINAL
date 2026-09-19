import { projects, stack, type Project } from './projects.ts';

/**
 * Every technology named in a project's stack, with the projects that use it.
 *
 * Versions are folded together for display ("Next.js 15" and "Next.js 16"
 * are both Next.js) — the underlying project data is untouched. Nothing here
 * is a rating: a count of real projects is the only measure shown.
 */

const ALIASES: Array<[RegExp, string]> = [
  [/^next\.js/i, 'Next.js'],
  [/^react\b/i, 'React'],
  [/^tailwind/i, 'Tailwind CSS'],
  [/^postgres(ql)?(\s*\d+)?$/i, 'PostgreSQL'],
  [/^prisma/i, 'Prisma'],
  [/^rls$/i, 'Row-level security'],
];

export function canonical(name: string) {
  for (const [pattern, label] of ALIASES) if (pattern.test(name.trim())) return label;
  return name.trim();
}

const GROUP_OF = new Map<string, string>();
for (const group of stack) for (const item of group.items) GROUP_OF.set(canonical(item), group.group);

export type Tool = { name: string; group: string; projects: Project[] };

export const toolbox: Tool[] = (() => {
  const map = new Map<string, Tool>();
  for (const project of projects) {
    for (const raw of project.stack) {
      const name = canonical(raw);
      const entry = map.get(name) ?? { name, group: GROUP_OF.get(name) ?? 'Other', projects: [] };
      if (!entry.projects.includes(project)) entry.projects.push(project);
      map.set(name, entry);
    }
  }
  // Tools listed in the stack groups but not (yet) in any project still belong in the kit.
  for (const group of stack) {
    for (const item of group.items) {
      const name = canonical(item);
      if (!map.has(name)) map.set(name, { name, group: group.group, projects: [] });
    }
  }
  return [...map.values()].sort((a, b) => b.projects.length - a.projects.length || a.name.localeCompare(b.name));
})();

export const toolGroups = ['All', ...stack.map(g => g.group), 'Other'].filter(
  group => group === 'All' || toolbox.some(t => t.group === group),
);
