import { ContentStatus, DeletionRequestStatus } from './content-status.model';

/**
 * Matches the route segments ContentControllerBase<TStatusCommand> declares
 * (SWA_Content_Management_System/Common/ContentControllerBase.cs).
 */
export type WorkflowActionKey =
  | 'submit'
  | 'approve'
  | 'request-changes'
  | 'publish'
  | 'unpublish'
  | 'archive'
  | 'restore';

export interface WorkflowActionDef {
  key: WorkflowActionKey;
  label: string;
  role: string;
  fromStatuses: ContentStatus[];
}

/**
 * Mirrors LocalizedContent<TTranslation> (SWA.Domain/Content/LocalizedContent.cs) exactly:
 * Unpublish/RequestChanges/Restore all transition back to Draft, not to a distinct state.
 * Publish additionally requires HasAllTranslations, checked separately by the caller.
 */
export const WORKFLOW_ACTIONS: WorkflowActionDef[] = [
  { key: 'submit', label: 'Submit for review', role: 'Writer', fromStatuses: [ContentStatus.Draft] },
  { key: 'approve', label: 'Approve', role: 'Reviewer', fromStatuses: [ContentStatus.InReview] },
  {
    key: 'request-changes',
    label: 'Request changes',
    role: 'Reviewer',
    fromStatuses: [ContentStatus.InReview, ContentStatus.Approved],
  },
  { key: 'publish', label: 'Publish', role: 'Publisher', fromStatuses: [ContentStatus.Approved] },
  { key: 'unpublish', label: 'Unpublish', role: 'Publisher', fromStatuses: [ContentStatus.Published] },
  {
    key: 'archive',
    label: 'Archive',
    role: 'Publisher',
    fromStatuses: [ContentStatus.Published, ContentStatus.Approved, ContentStatus.Draft],
  },
  { key: 'restore', label: 'Restore', role: 'Publisher', fromStatuses: [ContentStatus.Archived] },
];

export function allowedActionsFor(status: ContentStatus): WorkflowActionDef[] {
  return WORKFLOW_ACTIONS.filter((action) => action.fromStatuses.includes(status));
}

/** Every status a role can run at least one workflow action from — e.g. a Reviewer's actions
 *  (approve, request-changes) only ever apply to InReview/Approved items, so that's their
 *  actionable slice of the world. Admin isn't itself an action-owning role here (it's granted
 *  admission to every action via `canRun`'s Admin bypass), so callers should skip filtering for it. */
export function statusesActionableByRole(role: string): ContentStatus[] {
  const statuses = new Set<ContentStatus>();
  for (const action of WORKFLOW_ACTIONS) {
    if (action.role === role) {
      for (const status of action.fromStatuses) {
        statuses.add(status);
      }
    }
  }
  return [...statuses];
}

/**
 * Deletion is a small workflow of its own, independent of ContentStatus — a Published item can
 * have a deletion pending without stopping being Published in the meantime (mirrors
 * LocalizedContent.RequestDeletion/ApproveDeletion/CancelDeletionRequest in the domain).
 */
export type DeletionActionKey = 'request-deletion' | 'approve-deletion' | 'cancel-deletion';

export interface DeletionActionDef {
  key: DeletionActionKey;
  label: string;
  /** 'Any' means all four content roles (Admin/Writer/Reviewer/Publisher) may run it. */
  role: string | 'Any';
  fromDeletionStatuses: DeletionRequestStatus[];
}

export const DELETION_ACTIONS: DeletionActionDef[] = [
  {
    key: 'request-deletion',
    label: 'Request deletion',
    role: 'Writer',
    fromDeletionStatuses: [DeletionRequestStatus.None],
  },
  {
    key: 'approve-deletion',
    label: 'Approve deletion',
    role: 'Reviewer',
    fromDeletionStatuses: [DeletionRequestStatus.Requested],
  },
  {
    key: 'cancel-deletion',
    label: 'Cancel deletion request',
    role: 'Any',
    fromDeletionStatuses: [DeletionRequestStatus.Requested, DeletionRequestStatus.Approved],
  },
];

export function allowedDeletionActionsFor(status: DeletionRequestStatus): DeletionActionDef[] {
  return DELETION_ACTIONS.filter((action) => action.fromDeletionStatuses.includes(status));
}
