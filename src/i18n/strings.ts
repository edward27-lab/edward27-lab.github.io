import type { Lang } from './l.ts';
import { en, type Strings } from './strings.en.ts';
import { id } from './strings.id.ts';

export type { Strings };
export const DICT: Record<Lang, Strings> = { en, id };
