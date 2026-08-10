import { Validators } from '@angular/forms';
import { CONTENT_STATUS_OPTIONS } from '../../../shared/content-engine/models/content-status.model';
import { ContentTypeConfig, pickFields, slugField, sortOrderField } from '../../../shared/content-engine/models/content-type-config';

const BASE_FIELD_KEYS = ['slug', 'categoryId', 'sortOrder'];

export const faqsConfig: ContentTypeConfig = {
  key: 'faqs',
  basePath: 'faqs',
  displayName: 'FAQ',
  displayNameKey: 'content.faqs.displayName',
  listColumns: [
    {
      key: 'question',
      label: 'Question',
      labelKey: 'content.faqs.field.question',
      value: (item) => (item['questionAr'] as string) || (item['questionEn'] as string) || '',
    },
    { key: 'status', label: 'Status', labelKey: 'common.field.status' },
  ],
  filterFields: [
    { key: 'search', label: 'Search', labelKey: 'common.search', type: 'text' },
    { key: 'status', label: 'Status', labelKey: 'common.field.status', type: 'select', options: CONTENT_STATUS_OPTIONS },
    { key: 'categoryId', label: 'Category', labelKey: 'common.field.category', type: 'select', lookupKey: 'faq-categories' },
  ],
  baseFieldControls: [
    slugField(),
    { key: 'categoryId', label: 'Category', labelKey: 'common.field.category', type: 'select', lookupKey: 'faq-categories' },
    sortOrderField(),
  ],
  translationFieldControls: [
    { key: 'question', label: 'Question', labelKey: 'content.faqs.field.question', type: 'text', validators: [Validators.required, Validators.maxLength(1000)] },
    { key: 'answer', label: 'Answer', labelKey: 'content.faqs.field.answer', type: 'rich-text', validators: [Validators.required] },
  ],
  lookups: [{ key: 'faq-categories', basePath: 'faq-categories' }],
  buildCreatePayload: (value) => pickFields(value, BASE_FIELD_KEYS),
  buildUpdatePayload: (value) => pickFields(value, BASE_FIELD_KEYS),
};
