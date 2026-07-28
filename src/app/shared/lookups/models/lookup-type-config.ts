import { FieldDef } from '../../content-engine/models/content-type-config';

export interface LookupTypeConfig {
  key: string;
  basePath: string;
  displayName: string;
  /** Non-translated fields beyond slug/isActive/sortOrder, e.g. DocumentCategory's Section. */
  extraFields?: FieldDef[];
}
