import { Validators } from '@angular/forms';
import { MediaKind } from '../../../shared/media/models/media-asset.model';
import { CONTENT_STATUS_OPTIONS } from '../../../shared/content-engine/models/content-status.model';
import { ContentTypeConfig, pickFields, slugField, sortOrderField } from '../../../shared/content-engine/models/content-type-config';

const BASE_FIELD_KEYS = ['slug', 'parentId', 'heroImageId', 'showInNavigation', 'sortOrder'];

export const pagesConfig: ContentTypeConfig = {
  key: 'pages',
  basePath: 'pages',
  displayName: 'Page',
  displayNameKey: 'content.pages.displayName',
  listColumns: [
    { key: 'title', label: 'Title', labelKey: 'common.field.title', value: (item) => (item['titleAr'] as string) || (item['titleEn'] as string) || '' },
    { key: 'status', label: 'Status', labelKey: 'common.field.status' },
    { key: 'showInNavigation', label: 'In navigation', labelKey: 'content.pages.field.inNavigation', value: (item) => (item['showInNavigation'] ? 'common.yes' : 'common.no') },
  ],
  filterFields: [
    { key: 'search', label: 'Search', labelKey: 'common.search', type: 'text' },
    { key: 'status', label: 'Status', labelKey: 'common.field.status', type: 'select', options: CONTENT_STATUS_OPTIONS },
    { key: 'showInNavigation', label: 'In navigation', labelKey: 'content.pages.field.inNavigation', type: 'checkbox' },
  ],
  baseFieldControls: [
    slugField(),
    { key: 'parentId', label: 'Parent page', labelKey: 'content.pages.field.parentPage', type: 'select', lookupKey: 'parent-page', hint: 'Optional — nests this page under another page', hintKey: 'content.pages.hint.parentPage' },
    { key: 'heroImageId', label: 'Hero image', labelKey: 'common.field.heroImage', type: 'media-picker', mediaKindFilter: MediaKind.Image },
    { key: 'showInNavigation', label: 'Show in navigation', labelKey: 'content.pages.field.showInNavigation', type: 'checkbox' },
    sortOrderField(),
  ],
  translationFieldControls: [
    { key: 'title', label: 'Title', labelKey: 'common.field.title', type: 'text', validators: [Validators.required, Validators.maxLength(400)] },
    { key: 'summary', label: 'Summary', labelKey: 'content.pages.field.summary', type: 'textarea', validators: [Validators.maxLength(1000)] },
    { key: 'body', label: 'Body', labelKey: 'common.field.body', type: 'textarea', validators: [Validators.required] },
    { key: 'seoTitle', label: 'SEO title', labelKey: 'common.field.seoTitle', type: 'text', validators: [Validators.maxLength(400)] },
    { key: 'seoDescription', label: 'SEO description', labelKey: 'common.field.seoDescription', type: 'textarea', validators: [Validators.maxLength(1000)] },
    { key: 'sections', label: 'Page sections', labelKey: 'content.pages.field.sections', type: 'section-list' },
  ],
  lookups: [{ key: 'parent-page', basePath: 'pages', source: 'content' }],
  buildCreatePayload: (value) => pickFields(value, BASE_FIELD_KEYS),
  buildUpdatePayload: (value) => pickFields(value, BASE_FIELD_KEYS),
  hasPreview: true,
};
