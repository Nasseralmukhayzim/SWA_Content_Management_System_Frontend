import { Validators } from '@angular/forms';
import { MediaKind } from '../../../shared/media/models/media-asset.model';
import { CONTENT_STATUS_OPTIONS } from '../../../shared/content-engine/models/content-status.model';
import { ContentTypeConfig, pickFields, slugField, sortOrderField } from '../../../shared/content-engine/models/content-type-config';

const BASE_FIELD_KEYS = ['slug', 'heroImageId', 'isFeatured', 'sortOrder'];

export const newsConfig: ContentTypeConfig = {
  key: 'news',
  basePath: 'news',
  displayName: 'News Article',
  displayNameKey: 'content.news.displayName',
  listColumns: [
    { key: 'title', label: 'Title', labelKey: 'common.field.title', value: (item) => (item['titleAr'] as string) || (item['titleEn'] as string) || (item['slug'] as string) || '' },
    { key: 'slug', label: 'Slug', labelKey: 'common.field.slug', value: (item) => (item['slug'] as string) || '' },
    { key: 'status', label: 'Status', labelKey: 'common.field.status' },
    { key: 'isFeatured', label: 'Featured', labelKey: 'common.field.featured', value: (item) => (item['isFeatured'] ? 'common.yes' : 'common.no') },
    { key: 'createdAt', label: 'Created', labelKey: 'common.field.created', value: (item) => (item['createdAt'] ? new Date(item['createdAt'] as string).toLocaleDateString() : '') },
  ],
  filterFields: [
    { key: 'search', label: 'Search', labelKey: 'common.search', type: 'text' },
    { key: 'status', label: 'Status', labelKey: 'common.field.status', type: 'select', options: CONTENT_STATUS_OPTIONS },
    { key: 'isFeatured', label: 'Featured', labelKey: 'common.field.featured', type: 'checkbox' },
  ],
  baseFieldControls: [
    slugField(),
    { key: 'heroImageId', label: 'Hero image', labelKey: 'common.field.heroImage', type: 'media-picker', mediaKindFilter: MediaKind.Image },
    { key: 'isFeatured', label: 'Featured', labelKey: 'common.field.featured', type: 'checkbox' },
    sortOrderField(),
  ],
  translationFieldControls: [
    { key: 'title', label: 'Title', labelKey: 'common.field.title', type: 'text', validators: [Validators.required, Validators.maxLength(400)] },
    { key: 'summary', label: 'Summary', labelKey: 'content.news.field.summary', type: 'rich-text', validators: [Validators.maxLength(1000)] },
    { key: 'body', label: 'Body', labelKey: 'common.field.body', type: 'rich-text', validators: [Validators.required] },
    { key: 'heroImageCaption', label: 'Hero image caption', labelKey: 'content.news.field.heroImageCaption', type: 'text', validators: [Validators.maxLength(500)] },
    { key: 'seoTitle', label: 'SEO title', labelKey: 'common.field.seoTitle', type: 'text', validators: [Validators.maxLength(400)] },
    { key: 'seoDescription', label: 'SEO description', labelKey: 'common.field.seoDescription', type: 'textarea', validators: [Validators.maxLength(1000)] },
  ],
  buildCreatePayload: (value) => pickFields(value, BASE_FIELD_KEYS),
  buildUpdatePayload: (value) => pickFields(value, BASE_FIELD_KEYS),
};
