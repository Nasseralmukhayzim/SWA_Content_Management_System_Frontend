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
  { value: 'Text', label: 'Text', labelKey: 'sectionKind.Text' },
  { value: 'CardGrid', label: 'Card grid', labelKey: 'sectionKind.CardGrid' },
  { value: 'StatGroup', label: 'Stat group', labelKey: 'sectionKind.StatGroup' },
  { value: 'Timeline', label: 'Timeline', labelKey: 'sectionKind.Timeline' },
];

/**
 * Item rows are labelled per kind so the editor reads naturally (a stat's "title" is really its
 * number). Values are translation keys — the editor runs in both UI languages.
 */
export const ITEM_LABELS: Record<SectionKind, { title: string; description: string; add: string }> = {
  Text: { title: 'sectionItem.Text.title', description: 'sectionItem.Text.description', add: 'sectionEditor.addItem.Text' },
  CardGrid: {
    title: 'sectionItem.CardGrid.title',
    description: 'sectionItem.CardGrid.description',
    add: 'sectionEditor.addItem.CardGrid',
  },
  StatGroup: {
    title: 'sectionItem.StatGroup.title',
    description: 'sectionItem.StatGroup.description',
    add: 'sectionEditor.addItem.StatGroup',
  },
  Timeline: {
    title: 'sectionItem.Timeline.title',
    description: 'sectionItem.Timeline.description',
    add: 'sectionEditor.addItem.Timeline',
  },
};

export function emptySection(kind: SectionKind): PageSection {
  return { kind, heading: '', intro: '', body: '', items: [] };
}

export function emptyItem(): PageSectionItem {
  return { title: '', description: '', iconId: null, imageId: null, linkUrl: '' };
}
