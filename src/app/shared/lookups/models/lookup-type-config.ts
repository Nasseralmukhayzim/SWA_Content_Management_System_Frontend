import { FieldDef } from '../../content-engine/models/content-type-config';

export interface LookupTypeConfig {
  key: string;
  basePath: string;
  displayName: string;
  /**
   * Optional i18n dictionary key that, when present, is preferred over `displayName`. Additive/
   * backward-compatible — same fallback pattern as `FieldDef.labelKey`.
   */
  displayNameKey?: string;
  /** Non-translated fields beyond slug/isActive/sortOrder, e.g. DocumentCategory's Section. */
  extraFields?: FieldDef[];
}
