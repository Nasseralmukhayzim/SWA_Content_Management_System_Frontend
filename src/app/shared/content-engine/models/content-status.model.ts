export enum ContentStatus {
  Draft = 0,
  InReview = 1,
  Approved = 2,
  Published = 3,
  Archived = 4,
}

export const CONTENT_STATUS_LABELS: Record<ContentStatus, string> = {
  [ContentStatus.Draft]: 'Draft',
  [ContentStatus.InReview]: 'In Review',
  [ContentStatus.Approved]: 'Approved',
  [ContentStatus.Published]: 'Published',
  [ContentStatus.Archived]: 'Archived',
};

export const CONTENT_STATUS_OPTIONS: { value: ContentStatus; label: string }[] = Object.entries(
  CONTENT_STATUS_LABELS,
).map(([value, label]) => ({ value: Number(value), label }));
