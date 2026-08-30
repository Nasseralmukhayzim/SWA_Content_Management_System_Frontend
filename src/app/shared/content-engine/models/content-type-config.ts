import { ValidatorFn, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { MediaKind } from '../../media/models/media-asset.model';
import { ContentApiService } from '../services/content-api.service';

export type FieldControlType =
  | 'text'
  | 'textarea'
  | 'rich-text'
  | 'number'
  | 'checkbox'
  | 'select'
  | 'multiselect'
  | 'datetime'
  | 'media-picker'
  | 'section-list';

export interface FieldOption {
  value: string | number;
  label: string;
  /** Translation key for static enum-backed options; dynamic (lookup/content) options leave this unset. */
  labelKey?: string;
}

export interface FieldDef {
  key: string;
  label: string;
  /**
   * Optional i18n dictionary key (see core/i18n) that, when present, is preferred over `label`.
   * Additive/backward-compatible: fields that don't set this keep rendering their plain-English
   * `label` untouched (TranslatePipe falls back to the raw key it's given when the key is
   * missing from the dictionary — so passing `label` itself through the pipe round-trips to the
   * original English text).
   */
  labelKey?: string;
  type: FieldControlType;
  validators?: ValidatorFn[];
  /** Resolves select options at runtime from a `LookupDependency` with the same key. */
  lookupKey?: string;
  /** Static options, used for enum-backed selects (Section, DeliveryType, ...). */
  options?: FieldOption[];
  /** Restricts the media-picker dialog to a `MediaKind`, e.g. `MediaKind.Image`. */
  mediaKindFilter?: MediaKind;
  hint?: string;
  /** Optional i18n dictionary key for `hint`, same additive/fallback pattern as `labelKey`. */
  hintKey?: string;
  /**
   * Overrides the control's initial value (default: false for checkbox, [] for multiselect,
   * null otherwise). Needed for fields backed by a non-nullable server type — e.g. SortOrder is
   * a plain `int`, not `int?`, so it must default to 0, not null.
   */
  defaultValue?: unknown;
}

export type FilterControlType = 'text' | 'select' | 'checkbox';

export interface FilterFieldDef {
  key: string;
  label: string;
  /** Same additive/fallback pattern as `FieldDef.labelKey`. */
  labelKey?: string;
  type: FilterControlType;
  lookupKey?: string;
  options?: FieldOption[];
}

export interface ColumnDef<TListItem = Record<string, unknown>> {
  key: string;
  label: string;
  /** Same additive/fallback pattern as `FieldDef.labelKey`. */
  labelKey?: string;
  value?: (item: TListItem) => string;
}

export interface LookupDependency {
  key: string;
  basePath: string;
  extraQueryParams?: Record<string, string | number | boolean>;
  /**
   * 'lookup' (default) reads from LookupApiService — small named reference lists (categories,
   * types). 'content' reads from ContentApiService.list — real content items (e.g. Pages, for a
   * parent-page picker), labeled by title instead of name.
   */
  source?: 'lookup' | 'content';
}

export interface ExtraActionDef {
  key: string;
  label: string;
  /** Same additive/fallback pattern as `FieldDef.labelKey`. */
  labelKey?: string;
  fields: FieldDef[];
  save: (api: ContentApiService, basePath: string, id: string, value: Record<string, unknown>) => Observable<void>;
  /** Reads the current values back out of the detail response to seed the extra-action form. */
  read: (detail: Record<string, unknown>) => Record<string, unknown>;
}

export interface ContentTypeConfig<TListItem = Record<string, unknown>> {
  key: string;
  basePath: string;
  displayName: string;
  /** Same additive/fallback pattern as `FieldDef.labelKey`, applied to `displayName`. */
  displayNameKey?: string;
  listColumns: ColumnDef<TListItem>[];
  filterFields: FilterFieldDef[];
  baseFieldControls: FieldDef[];
  translationFieldControls: FieldDef[];
  lookups?: LookupDependency[];
  buildCreatePayload: (value: Record<string, unknown>) => Record<string, unknown>;
  buildUpdatePayload: (value: Record<string, unknown>) => Record<string, unknown>;
  extraActions?: ExtraActionDef[];
  /** Shows a "Preview" button on the edit form, linking to this content type's own `:id/preview` route. */
  hasPreview?: boolean;
}

export function defaultValueFor(field: FieldDef): unknown {
  if (field.defaultValue !== undefined) {
    return field.defaultValue;
  }
  if (field.type === 'checkbox') {
    return false;
  }
  if (field.type === 'multiselect' || field.type === 'section-list') {
    return [];
  }
  return null;
}

export function pickFields(value: Record<string, unknown>, keys: string[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of keys) {
    result[key] = value[key];
  }
  return result;
}

/**
 * An empty text input for an optional Guid/date field (ParentId, HeroImageId, ...) submits as
 * `''`, which the backend can't bind to `Guid?`/`DateTime?` — send `null` instead. Safe for
 * plain optional strings too, since FluentValidation accepts both `null` and `''` there.
 */
export function emptyToNull(value: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, fieldValue] of Object.entries(value)) {
    result[key] = fieldValue === '' ? null : fieldValue;
  }
  return result;
}

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const SLUG_MAX_LENGTH = 200;

/** Every content type and lookup carries an identical Slug field (SWA.Domain/Content/Slug.cs). */
export function slugField(): FieldDef {
  return {
    key: 'slug',
    label: 'Slug',
    labelKey: 'common.field.slug',
    type: 'text',
    validators: [Validators.required, Validators.pattern(SLUG_PATTERN), Validators.maxLength(SLUG_MAX_LENGTH)],
    hint: 'Lowercase letters, numbers, and hyphens only',
    hintKey: 'common.hint.slug',
  };
}

/**
 * Every content type carries a SortOrder field used for the fixed display ordering.
 * Backed by a non-nullable `int` (never `int?`), so it must default to 0, not null.
 */
export function sortOrderField(): FieldDef {
  return {
    key: 'sortOrder',
    label: 'Sort order',
    labelKey: 'common.field.sortOrder',
    type: 'number',
    validators: [Validators.required, Validators.min(0)],
    defaultValue: 0,
  };
}
