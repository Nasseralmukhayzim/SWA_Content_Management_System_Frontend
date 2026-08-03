import { Validators } from '@angular/forms';
import { MediaKind } from '../../../shared/media/models/media-asset.model';
import { CONTENT_STATUS_OPTIONS } from '../../../shared/content-engine/models/content-status.model';
import { ContentTypeConfig, pickFields, slugField, sortOrderField } from '../../../shared/content-engine/models/content-type-config';

const BASE_FIELD_KEYS = ['slug', 'parentId', 'heroImageId', 'showInNavigation', 'sortOrder'];

export const pagesConfig: ContentTypeConfig = {
  key: 'pages',
  basePath: 'pages',
  displayName: 'Page',
  listColumns: [
    { key: 'title', label: 'Title', value: (item) => (item['titleAr'] as string) || (item['titleEn'] as string) || '' },
    { key: 'status', label: 'Status' },
    { key: 'showInNavigation', label: 'In navigation', value: (item) => (item['showInNavigation'] ? 'Yes' : 'No') },
  ],
  filterFields: [
    { key: 'search', label: 'Search', type: 'text' },
    { key: 'status', label: 'Status', type: 'select', options: CONTENT_STATUS_OPTIONS },
    { key: 'showInNavigation', label: 'In navigation', type: 'checkbox' },
  ],
  baseFieldControls: [
    slugField(),
    { key: 'parentId', label: 'Parent page ID', type: 'text', hint: 'Optional — the GUID of a parent page' },
    { key: 'heroImageId', label: 'Hero image', type: 'media-picker', mediaKindFilter: MediaKind.Image },
    { key: 'showInNavigation', label: 'Show in navigation', type: 'checkbox' },
    sortOrderField(),
  ],
  translationFieldControls: [
    { key: 'title', label: 'Title', type: 'text', validators: [Validators.required, Validators.maxLength(400)] },
    { key: 'summary', label: 'Summary', type: 'textarea', validators: [Validators.maxLength(1000)] },
    { key: 'body', label: 'Body', type: 'textarea', validators: [Validators.required] },
    { key: 'seoTitle', label: 'SEO title', type: 'text', validators: [Validators.maxLength(400)] },
    { key: 'seoDescription', label: 'SEO description', type: 'textarea', validators: [Validators.maxLength(1000)] },
    { key: 'sections', label: 'Page sections', type: 'section-list' },
  ],
  buildCreatePayload: (value) => pickFields(value, BASE_FIELD_KEYS),
  buildUpdatePayload: (value) => pickFields(value, BASE_FIELD_KEYS),
};
