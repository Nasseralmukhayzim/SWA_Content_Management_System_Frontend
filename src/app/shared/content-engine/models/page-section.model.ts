import { FieldOption } from './content-type-config';

export type SectionKind = 'Text' | 'CardGrid' | 'StatGroup' | 'Timeline';

export interface PageSectionItem {
  id?: string;
  title: string;
  description?: string | null;
  /** Card-grid only: a small pictogram, a larger illustrative image, and an optional "read more" link. */
  iconId?: string | null;
  imageId?: string | null;
  linkUrl?: string | null;
}

export interface PageSection {
  id?: string;
  kind: SectionKind;
  heading?: string | null;
  intro?: string | null;
  body?: string | null;
  items: PageSectionItem[];
}

export const SECTION_KIND_OPTIONS: FieldOption[] = [
  { value: 'Text', label: 'Text' },
  { value: 'CardGrid', label: 'Card grid' },
  { value: 'StatGroup', label: 'Stat group' },
  { value: 'Timeline', label: 'Timeline' },
];

/** Item rows are labelled per kind so the editor reads naturally (a stat's "title" is really its number). */
export const ITEM_LABELS: Record<SectionKind, { title: string; description: string }> = {
  Text: { title: 'Title', description: 'Description' },
  CardGrid: { title: 'Card title', description: 'Card description' },
  StatGroup: { title: 'Number', description: 'Label' },
  Timeline: { title: 'Year', description: 'Label' },
};

export function emptySection(kind: SectionKind): PageSection {
  return { kind, heading: '', intro: '', body: '', items: [] };
}

export function emptyItem(): PageSectionItem {
  return { title: '', description: '', iconId: null, imageId: null, linkUrl: '' };
}
