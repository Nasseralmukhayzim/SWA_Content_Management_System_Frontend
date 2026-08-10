import { Validators } from '@angular/forms';
import { MediaKind } from '../../../shared/media/models/media-asset.model';
import { CONTENT_STATUS_OPTIONS } from '../../../shared/content-engine/models/content-status.model';
import { ContentTypeConfig, pickFields, slugField, sortOrderField } from '../../../shared/content-engine/models/content-type-config';

const BASE_FIELD_KEYS = ['slug', 'startsAtUtc', 'endsAtUtc', 'eventTypeId', 'imageId', 'registrationUrl', 'sortOrder'];

export const eventsConfig: ContentTypeConfig = {
  key: 'events',
  basePath: 'events',
  displayName: 'Event',
  displayNameKey: 'content.events.displayName',
  listColumns: [
    { key: 'title', label: 'Title', labelKey: 'common.field.title', value: (item) => (item['titleAr'] as string) || (item['titleEn'] as string) || (item['slug'] as string) || '' },
    { key: 'slug', label: 'Slug', labelKey: 'common.field.slug', value: (item) => (item['slug'] as string) || '' },
    { key: 'status', label: 'Status', labelKey: 'common.field.status' },
    {
      key: 'startsAtUtc',
      label: 'Starts',
      labelKey: 'content.events.column.starts',
      value: (item) => (item['startsAtUtc'] ? new Date(item['startsAtUtc'] as string).toLocaleString() : ''),
    },
    { key: 'location', label: 'Location', labelKey: 'content.events.field.location', value: (item) => (item['locationAr'] as string) || (item['locationEn'] as string) || '' },
  ],
  filterFields: [
    { key: 'search', label: 'Search', labelKey: 'common.search', type: 'text' },
    { key: 'status', label: 'Status', labelKey: 'common.field.status', type: 'select', options: CONTENT_STATUS_OPTIONS },
    { key: 'eventTypeId', label: 'Event type', labelKey: 'content.events.field.eventType', type: 'select', lookupKey: 'event-types' },
    { key: 'upcoming', label: 'Upcoming', labelKey: 'content.events.filter.upcoming', type: 'checkbox' },
  ],
  baseFieldControls: [
    slugField(),
    { key: 'startsAtUtc', label: 'Starts at', labelKey: 'content.events.field.startsAt', type: 'datetime', validators: [Validators.required] },
    { key: 'endsAtUtc', label: 'Ends at', labelKey: 'content.events.field.endsAt', type: 'datetime' },
    { key: 'eventTypeId', label: 'Event type', labelKey: 'content.events.field.eventType', type: 'select', lookupKey: 'event-types' },
    { key: 'imageId', label: 'Image', labelKey: 'content.events.field.image', type: 'media-picker', mediaKindFilter: MediaKind.Image },
    { key: 'registrationUrl', label: 'Registration URL', labelKey: 'content.events.field.registrationUrl', type: 'text', validators: [Validators.maxLength(2000)] },
    sortOrderField(),
  ],
  translationFieldControls: [
    { key: 'title', label: 'Title', labelKey: 'common.field.title', type: 'text', validators: [Validators.required, Validators.maxLength(400)] },
    { key: 'description', label: 'Description', labelKey: 'common.field.description', type: 'rich-text', validators: [Validators.required] },
    { key: 'location', label: 'Location', labelKey: 'content.events.field.location', type: 'text', validators: [Validators.maxLength(400)] },
    { key: 'seoTitle', label: 'SEO title', labelKey: 'common.field.seoTitle', type: 'text', validators: [Validators.maxLength(400)] },
    { key: 'seoDescription', label: 'SEO description', labelKey: 'common.field.seoDescription', type: 'textarea', validators: [Validators.maxLength(1000)] },
  ],
  lookups: [{ key: 'event-types', basePath: 'event-types' }],
  buildCreatePayload: (value) => pickFields(value, BASE_FIELD_KEYS),
  buildUpdatePayload: (value) => pickFields(value, BASE_FIELD_KEYS),
};
