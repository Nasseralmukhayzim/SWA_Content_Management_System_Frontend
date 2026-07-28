import { Validators } from '@angular/forms';
import { CONTENT_STATUS_OPTIONS } from '../../../shared/content-engine/models/content-status.model';
import { ContentTypeConfig, pickFields, slugField, sortOrderField } from '../../../shared/content-engine/models/content-type-config';

const BASE_FIELD_KEYS = ['slug', 'categoryId', 'sortOrder'];

export const faqsConfig: ContentTypeConfig = {
  key: 'faqs',
  basePath: 'faqs',
  displayName: 'FAQ',
  listColumns: [
    {
      key: 'question',
      label: 'Question',
      value: (item) => (item['questionAr'] as string) || (item['questionEn'] as string) || '',
    },
    { key: 'status', label: 'Status' },
  ],
  filterFields: [
    { key: 'search', label: 'Search', type: 'text' },
    { key: 'status', label: 'Status', type: 'select', options: CONTENT_STATUS_OPTIONS },
    { key: 'categoryId', label: 'Category', type: 'select', lookupKey: 'faq-categories' },
  ],
  baseFieldControls: [
    slugField(),
    { key: 'categoryId', label: 'Category', type: 'select', lookupKey: 'faq-categories' },
    sortOrderField(),
  ],
  translationFieldControls: [
    { key: 'question', label: 'Question', type: 'text', validators: [Validators.required, Validators.maxLength(1000)] },
    { key: 'answer', label: 'Answer', type: 'textarea', validators: [Validators.required] },
  ],
  lookups: [{ key: 'faq-categories', basePath: 'faq-categories' }],
  buildCreatePayload: (value) => pickFields(value, BASE_FIELD_KEYS),
  buildUpdatePayload: (value) => pickFields(value, BASE_FIELD_KEYS),
};
