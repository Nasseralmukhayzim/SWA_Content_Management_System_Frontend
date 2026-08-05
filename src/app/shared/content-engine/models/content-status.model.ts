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

/** Mirrors SWA.Domain/Content/ContentStatus.cs's DeletionRequestStatus — independent of ContentStatus. */
export enum DeletionRequestStatus {
  None = 0,
  Requested = 1,
  Approved = 2,
}

export const DELETION_STATUS_LABELS: Record<DeletionRequestStatus, string> = {
  [DeletionRequestStatus.None]: 'None',
  [DeletionRequestStatus.Requested]: 'Deletion requested',
  [DeletionRequestStatus.Approved]: 'Deletion approved — awaiting removal',
};
