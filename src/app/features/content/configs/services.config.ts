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

const BASE_FIELD_KEYS = ['slug', 'deliveryType', 'iconId', 'supportPhone', 'faqCategoryId', 'isFeatured', 'sortOrder'];

/** SWA.Domain/Content/Services/Service.cs — ServiceDeliveryType enum. */
const DELIVERY_TYPE_OPTIONS: FieldOption[] = [
  { value: 0, label: 'Request' },
  { value: 1, label: 'Inquiry' },
  { value: 2, label: 'Calculator' },
  { value: 3, label: 'Payment' },
  { value: 4, label: 'External' },
];

export const servicesConfig: ContentTypeConfig = {
  key: 'services',
  basePath: 'services',
  displayName: 'Service',
  listColumns: [
    { key: 'name', label: 'Name', value: (item) => (item['nameAr'] as string) || (item['nameEn'] as string) || '' },
    { key: 'status', label: 'Status' },
    {
      key: 'deliveryType',
      label: 'Delivery type',
      value: (item) => DELIVERY_TYPE_OPTIONS.find((o) => o.value === item['deliveryType'])?.label ?? '',
    },
    { key: 'isFeatured', label: 'Featured', value: (item) => (item['isFeatured'] ? 'Yes' : 'No') },
  ],
  filterFields: [
    { key: 'search', label: 'Search', type: 'text' },
    { key: 'status', label: 'Status', type: 'select', options: CONTENT_STATUS_OPTIONS },
    { key: 'deliveryType', label: 'Delivery type', type: 'select', options: DELIVERY_TYPE_OPTIONS },
    { key: 'audienceId', label: 'Audience', type: 'select', lookupKey: 'service-audiences' },
    { key: 'channelId', label: 'Channel', type: 'select', lookupKey: 'service-channels' },
    { key: 'isFeatured', label: 'Featured', type: 'checkbox' },
  ],
  baseFieldControls: [
    slugField(),
    {
      key: 'deliveryType',
      label: 'Delivery type',
      type: 'select',
      options: DELIVERY_TYPE_OPTIONS,
      validators: [Validators.required],
    },
    { key: 'iconId', label: 'Icon', type: 'media-picker', mediaKindFilter: MediaKind.Image },
    { key: 'supportPhone', label: 'Support phone', type: 'text', validators: [Validators.maxLength(50)] },
    { key: 'faqCategoryId', label: 'FAQ category', type: 'select', lookupKey: 'faq-categories' },
    { key: 'isFeatured', label: 'Featured', type: 'checkbox' },
    sortOrderField(),
  ],
  translationFieldControls: [
    { key: 'name', label: 'Name', type: 'text', validators: [Validators.required, Validators.maxLength(400)] },
    { key: 'description', label: 'Description', type: 'textarea', validators: [Validators.required] },
    { key: 'fee', label: 'Fee', type: 'text', validators: [Validators.maxLength(300)] },
    { key: 'deliveryTime', label: 'Delivery time', type: 'text', validators: [Validators.maxLength(300)] },
    { key: 'requiredDocuments', label: 'Required documents', type: 'textarea' },
    { key: 'steps', label: 'Steps', type: 'textarea' },
    { key: 'terms', label: 'Terms', type: 'textarea' },
    { key: 'objectives', label: 'Objectives', type: 'textarea' },
    { key: 'startServiceUrl', label: 'Start service URL', type: 'text', validators: [Validators.maxLength(2000)] },
    { key: 'guideFileId', label: 'Guide file', type: 'media-picker', mediaKindFilter: MediaKind.Document },
  ],
  lookups: [
    { key: 'faq-categories', basePath: 'faq-categories' },
    { key: 'service-audiences', basePath: 'service-audiences' },
    { key: 'service-channels', basePath: 'service-channels' },
  ],
  extraActions: [
    {
      key: 'links',
      label: 'Audience & Channel Links',
      fields: [
        { key: 'audienceIds', label: 'Audiences', type: 'multiselect', lookupKey: 'service-audiences' },
        { key: 'channelIds', label: 'Channels', type: 'multiselect', lookupKey: 'service-channels' },
      ],
      save: (api, basePath, id, value) =>
        api.runExtraAction(basePath, id, 'links', {
          audienceIds: value['audienceIds'],
          channelIds: value['channelIds'],
        }),
      read: (detail) => ({ audienceIds: detail['audienceIds'], channelIds: detail['channelIds'] }),
    },
  ],
  buildCreatePayload: (value) => pickFields(value, BASE_FIELD_KEYS),
  buildUpdatePayload: (value) => pickFields(value, BASE_FIELD_KEYS),
};
