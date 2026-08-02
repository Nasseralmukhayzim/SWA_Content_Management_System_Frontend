import { Validators } from '@angular/forms';
import { MediaKind } from '../../../shared/media/models/media-asset.model';
import { CONTENT_STATUS_OPTIONS } from '../../../shared/content-engine/models/content-status.model';
import { ContentTypeConfig, pickFields, slugField, sortOrderField } from '../../../shared/content-engine/models/content-type-config';

const BASE_FIELD_KEYS = ['slug', 'startsAtUtc', 'endsAtUtc', 'eventTypeId', 'imageId', 'registrationUrl', 'sortOrder'];

export const eventsConfig: ContentTypeConfig = {
  key: 'events',
  basePath: 'events',
  displayName: 'Event',
  listColumns: [
    { key: 'title', label: 'Title', value: (item) => (item['titleAr'] as string) || (item['titleEn'] as string) || (item['slug'] as string) || '' },
    { key: 'slug', label: 'Slug', value: (item) => (item['slug'] as string) || '' },
    { key: 'status', label: 'Status' },
    {
      key: 'startsAtUtc',
      label: 'Starts',
      value: (item) => (item['startsAtUtc'] ? new Date(item['startsAtUtc'] as string).toLocaleString() : ''),
    },
    { key: 'location', label: 'Location', value: (item) => (item['locationAr'] as string) || (item['locationEn'] as string) || '' },
  ],
  filterFields: [
    { key: 'search', label: 'Search', type: 'text' },
    { key: 'status', label: 'Status', type: 'select', options: CONTENT_STATUS_OPTIONS },
    { key: 'eventTypeId', label: 'Event type', type: 'select', lookupKey: 'event-types' },
    { key: 'upcoming', label: 'Upcoming', type: 'checkbox' },
  ],
  baseFieldControls: [
    slugField(),
    { key: 'startsAtUtc', label: 'Starts at', type: 'datetime', validators: [Validators.required] },
    { key: 'endsAtUtc', label: 'Ends at', type: 'datetime' },
    { key: 'eventTypeId', label: 'Event type', type: 'select', lookupKey: 'event-types' },
    { key: 'imageId', label: 'Image', type: 'media-picker', mediaKindFilter: MediaKind.Image },
    { key: 'registrationUrl', label: 'Registration URL', type: 'text', validators: [Validators.maxLength(2000)] },
    sortOrderField(),
  ],
  translationFieldControls: [
    { key: 'title', label: 'Title', type: 'text', validators: [Validators.required, Validators.maxLength(400)] },
    { key: 'description', label: 'Description', type: 'rich-text', validators: [Validators.required] },
    { key: 'location', label: 'Location', type: 'text', validators: [Validators.maxLength(400)] },
    { key: 'seoTitle', label: 'SEO title', type: 'text', validators: [Validators.maxLength(400)] },
    { key: 'seoDescription', label: 'SEO description', type: 'textarea', validators: [Validators.maxLength(1000)] },
  ],
  lookups: [{ key: 'event-types', basePath: 'event-types' }],
  buildCreatePayload: (value) => pickFields(value, BASE_FIELD_KEYS),
  buildUpdatePayload: (value) => pickFields(value, BASE_FIELD_KEYS),
};
