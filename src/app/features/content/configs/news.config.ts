import { Validators } from '@angular/forms';
import { MediaKind } from '../../../shared/media/models/media-asset.model';
import { CONTENT_STATUS_OPTIONS } from '../../../shared/content-engine/models/content-status.model';
import { ContentTypeConfig, pickFields, slugField, sortOrderField } from '../../../shared/content-engine/models/content-type-config';

const BASE_FIELD_KEYS = ['slug', 'heroImageId', 'isFeatured', 'sortOrder'];

export const newsConfig: ContentTypeConfig = {
  key: 'news',
  basePath: 'news',
  displayName: 'News Article',
  listColumns: [
    { key: 'title', label: 'Title', value: (item) => (item['titleAr'] as string) || (item['titleEn'] as string) || '' },
    { key: 'status', label: 'Status' },
    { key: 'isFeatured', label: 'Featured', value: (item) => (item['isFeatured'] ? 'Yes' : 'No') },
  ],
  filterFields: [
    { key: 'search', label: 'Search', type: 'text' },
    { key: 'status', label: 'Status', type: 'select', options: CONTENT_STATUS_OPTIONS },
    { key: 'isFeatured', label: 'Featured', type: 'checkbox' },
  ],
  baseFieldControls: [
    slugField(),
    { key: 'heroImageId', label: 'Hero image', type: 'media-picker', mediaKindFilter: MediaKind.Image },
    { key: 'isFeatured', label: 'Featured', type: 'checkbox' },
    sortOrderField(),
  ],
  translationFieldControls: [
    { key: 'title', label: 'Title', type: 'text', validators: [Validators.required, Validators.maxLength(400)] },
    { key: 'summary', label: 'Summary', type: 'textarea', validators: [Validators.maxLength(1000)] },
    { key: 'body', label: 'Body', type: 'textarea', validators: [Validators.required] },
    { key: 'heroImageCaption', label: 'Hero image caption', type: 'text', validators: [Validators.maxLength(500)] },
    { key: 'seoTitle', label: 'SEO title', type: 'text', validators: [Validators.maxLength(400)] },
    { key: 'seoDescription', label: 'SEO description', type: 'textarea', validators: [Validators.maxLength(1000)] },
  ],
  buildCreatePayload: (value) => pickFields(value, BASE_FIELD_KEYS),
  buildUpdatePayload: (value) => pickFields(value, BASE_FIELD_KEYS),
};
