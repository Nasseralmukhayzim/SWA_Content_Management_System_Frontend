import { ContentStatus } from './content-status.model';

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
  roles: string[];
  fromStatuses: ContentStatus[];
}

/**
 * Mirrors LocalizedContent<TTranslation> (SWA.Domain/Content/LocalizedContent.cs) exactly:
 * Unpublish/RequestChanges/Restore all transition back to Draft, not to a distinct state.
 * Publish additionally requires HasAllTranslations, checked separately by the caller.
 */
export const WORKFLOW_ACTIONS: WorkflowActionDef[] = [
  { key: 'submit', label: 'Submit for review', roles: ['Writer'], fromStatuses: [ContentStatus.Draft] },
  // Publisher can approve too, alongside Reviewer — not just Reviewer alone.
  { key: 'approve', label: 'Approve', roles: ['Reviewer', 'Publisher'], fromStatuses: [ContentStatus.InReview] },
  {
    key: 'request-changes',
    label: 'Request changes',
    roles: ['Reviewer'],
    fromStatuses: [ContentStatus.InReview, ContentStatus.Approved],
  },
  { key: 'publish', label: 'Publish', roles: ['Publisher'], fromStatuses: [ContentStatus.Approved] },
  { key: 'unpublish', label: 'Unpublish', roles: ['Publisher'], fromStatuses: [ContentStatus.Published] },
  {
    key: 'archive',
    label: 'Archive',
    roles: ['Publisher'],
    fromStatuses: [ContentStatus.Published, ContentStatus.Approved, ContentStatus.Draft],
  },
  { key: 'restore', label: 'Restore', roles: ['Publisher'], fromStatuses: [ContentStatus.Archived] },
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
    if (action.roles.includes(role)) {
      for (const status of action.fromStatuses) {
        statuses.add(status);
      }
    }
  }
  return [...statuses];
}
