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
