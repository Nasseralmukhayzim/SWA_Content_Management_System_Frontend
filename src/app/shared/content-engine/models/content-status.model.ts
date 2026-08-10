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

/** i18n dictionary keys for `CONTENT_STATUS_LABELS` — see core/i18n. Consumed by StatusBadgeComponent. */
export const CONTENT_STATUS_LABEL_KEYS: Record<ContentStatus, string> = {
  [ContentStatus.Draft]: 'status.draft',
  [ContentStatus.InReview]: 'status.inReview',
  [ContentStatus.Approved]: 'status.approved',
  [ContentStatus.Published]: 'status.published',
  [ContentStatus.Archived]: 'status.archived',
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

/** i18n dictionary keys for `DELETION_STATUS_LABELS` — see core/i18n. Consumed by WorkflowActionsComponent. */
export const DELETION_STATUS_LABEL_KEYS: Record<DeletionRequestStatus, string> = {
  [DeletionRequestStatus.None]: 'status.deletion.none',
  [DeletionRequestStatus.Requested]: 'status.deletion.requested',
  [DeletionRequestStatus.Approved]: 'status.deletion.approved',
};
