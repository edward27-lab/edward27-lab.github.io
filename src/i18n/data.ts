import { localize, type Lang } from './l.ts';
import { useLang } from './locale.tsx';
import { profile, education } from '../data/profile.ts';
import { roles } from '../data/experience.ts';
import { projects } from '../data/projects.ts';
import { skillGroups, LEVELS, misc } from '../data/skills.ts';

/**
 * The site's content, resolved to one language. Built once per language and
 * cached, so consumers get a stable object identity (Typewriter and the
 * skills layout memoize on it).
 */
function build(lang: Lang) {
  return {
    profile: localize(profile, lang),
    education: localize(education, lang),
    roles: localize(roles, lang),
    projects: localize(projects, lang),
    skillGroups: localize(skillGroups, lang),
    levels: localize(LEVELS, lang),
    misc: localize(misc, lang),
  };
}

export type Data = ReturnType<typeof build>;

const cache: Partial<Record<Lang, Data>> = {};

export function getData(lang: Lang): Data {
  return (cache[lang] ??= build(lang));
}

export function useData(): Data {
  return getData(useLang().lang);
}
