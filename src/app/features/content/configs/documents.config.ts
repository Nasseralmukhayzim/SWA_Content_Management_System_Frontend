import { Validators } from '@angular/forms';
import { MediaKind } from '../../../shared/media/models/media-asset.model';
import { CONTENT_STATUS_OPTIONS } from '../../../shared/content-engine/models/content-status.model';
import {
  ContentTypeConfig,
  FieldOption,
  pickFields,
  slugField,
  sortOrderField,
} from '../../../shared/content-engine/models/content-type-config';

const BASE_FIELD_KEYS = ['slug', 'section', 'categoryId', 'year', 'coverImageId', 'sortOrder'];

/** SWA.Domain/Content/Documents/Document.cs — DocumentSection enum. */
const SECTION_OPTIONS: FieldOption[] = [
  { value: 0, label: 'Reports' },
  { value: 1, label: 'Regulations' },
];

export const documentsConfig: ContentTypeConfig = {
  key: 'documents',
  basePath: 'documents',
  displayName: 'Document',
  listColumns: [
    { key: 'title', label: 'Title', value: (item) => (item['titleAr'] as string) || (item['titleEn'] as string) || '' },
    { key: 'status', label: 'Status' },
    {
      key: 'section',
      label: 'Section',
      value: (item) => SECTION_OPTIONS.find((o) => o.value === item['section'])?.label ?? '',
    },
    { key: 'year', label: 'Year', value: (item) => (item['year'] ? String(item['year']) : '') },
  ],
  filterFields: [
    { key: 'search', label: 'Search', type: 'text' },
    { key: 'status', label: 'Status', type: 'select', options: CONTENT_STATUS_OPTIONS },
    { key: 'section', label: 'Section', type: 'select', options: SECTION_OPTIONS },
    { key: 'categoryId', label: 'Category', type: 'select', lookupKey: 'document-categories' },
    { key: 'year', label: 'Year', type: 'text' },
  ],
  baseFieldControls: [
    slugField(),
    { key: 'section', label: 'Section', type: 'select', options: SECTION_OPTIONS, validators: [Validators.required] },
    { key: 'categoryId', label: 'Category', type: 'select', lookupKey: 'document-categories' },
    { key: 'year', label: 'Year', type: 'number', validators: [Validators.min(1900), Validators.max(2200)] },
    { key: 'coverImageId', label: 'Cover image', type: 'media-picker', mediaKindFilter: MediaKind.Image },
    sortOrderField(),
  ],
  translationFieldControls: [
    { key: 'title', label: 'Title', type: 'text', validators: [Validators.required, Validators.maxLength(400)] },
    { key: 'description', label: 'Description', type: 'textarea', validators: [Validators.maxLength(2000)] },
    { key: 'fileId', label: 'File', type: 'media-picker', mediaKindFilter: MediaKind.Document },
    { key: 'externalFileUrl', label: 'External file URL', type: 'text', validators: [Validators.maxLength(2000)] },
  ],
  lookups: [{ key: 'document-categories', basePath: 'document-categories' }],
  buildCreatePayload: (value) => pickFields(value, BASE_FIELD_KEYS),
  buildUpdatePayload: (value) => pickFields(value, BASE_FIELD_KEYS),
};
