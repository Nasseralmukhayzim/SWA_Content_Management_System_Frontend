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
  { value: 0, label: 'Reports', labelKey: 'content.documents.section.reports' },
  { value: 1, label: 'Regulations', labelKey: 'content.documents.section.regulations' },
];

export const documentsConfig: ContentTypeConfig = {
  key: 'documents',
  basePath: 'documents',
  displayName: 'Document',
  displayNameKey: 'content.documents.displayName',
  listColumns: [
    { key: 'title', label: 'Title', labelKey: 'common.field.title', value: (item) => (item['titleAr'] as string) || (item['titleEn'] as string) || (item['slug'] as string) || '' },
    { key: 'slug', label: 'Slug', labelKey: 'common.field.slug', value: (item) => (item['slug'] as string) || '' },
    { key: 'status', label: 'Status', labelKey: 'common.field.status' },
    {
      key: 'section',
      label: 'Section',
      labelKey: 'common.field.section',
      value: (item) => {
        const option = SECTION_OPTIONS.find((o) => o.value === item['section']);
        return option?.labelKey ?? option?.label ?? '';
      },
    },
    { key: 'year', label: 'Year', labelKey: 'content.documents.field.year', value: (item) => (item['year'] ? String(item['year']) : '') },
    { key: 'createdAt', label: 'Created', labelKey: 'common.field.created', value: (item) => (item['createdAt'] ? new Date(item['createdAt'] as string).toLocaleDateString() : '') },
  ],
  filterFields: [
    { key: 'search', label: 'Search', labelKey: 'common.search', type: 'text' },
    { key: 'status', label: 'Status', labelKey: 'common.field.status', type: 'select', options: CONTENT_STATUS_OPTIONS },
    { key: 'section', label: 'Section', labelKey: 'common.field.section', type: 'select', options: SECTION_OPTIONS },
    { key: 'categoryId', label: 'Category', labelKey: 'common.field.category', type: 'select', lookupKey: 'document-categories' },
    { key: 'year', label: 'Year', labelKey: 'content.documents.field.year', type: 'text' },
  ],
  baseFieldControls: [
    slugField(),
    { key: 'section', label: 'Section', labelKey: 'common.field.section', type: 'select', options: SECTION_OPTIONS, validators: [Validators.required] },
    { key: 'categoryId', label: 'Category', labelKey: 'common.field.category', type: 'select', lookupKey: 'document-categories' },
    { key: 'year', label: 'Year', labelKey: 'content.documents.field.year', type: 'number', validators: [Validators.min(1900), Validators.max(2200)] },
    { key: 'coverImageId', label: 'Cover image', labelKey: 'content.documents.field.coverImage', type: 'media-picker', mediaKindFilter: MediaKind.Image },
    sortOrderField(),
  ],
  translationFieldControls: [
    { key: 'title', label: 'Title', labelKey: 'common.field.title', type: 'text', validators: [Validators.required, Validators.maxLength(400)] },
    { key: 'description', label: 'Description', labelKey: 'common.field.description', type: 'rich-text', validators: [Validators.required] },
    { key: 'seoTitle', label: 'SEO title', labelKey: 'common.field.seoTitle', type: 'text', validators: [Validators.maxLength(400)] },
    { key: 'seoDescription', label: 'SEO description', labelKey: 'common.field.seoDescription', type: 'textarea', validators: [Validators.maxLength(1000)] },
    { key: 'fileId', label: 'File', labelKey: 'content.documents.field.file', type: 'media-picker', mediaKindFilter: MediaKind.Document },
    { key: 'externalFileUrl', label: 'External file URL', labelKey: 'content.documents.field.externalFileUrl', type: 'text', validators: [Validators.maxLength(2000)] },
  ],
  lookups: [{ key: 'document-categories', basePath: 'document-categories' }],
  buildCreatePayload: (value) => pickFields(value, BASE_FIELD_KEYS),
  buildUpdatePayload: (value) => pickFields(value, BASE_FIELD_KEYS),
};
