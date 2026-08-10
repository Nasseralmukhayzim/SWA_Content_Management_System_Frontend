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
  { value: 0, label: 'Request', labelKey: 'content.services.deliveryType.request' },
  { value: 1, label: 'Inquiry', labelKey: 'content.services.deliveryType.inquiry' },
  { value: 2, label: 'Calculator', labelKey: 'content.services.deliveryType.calculator' },
  { value: 3, label: 'Payment', labelKey: 'content.services.deliveryType.payment' },
  { value: 4, label: 'External', labelKey: 'content.services.deliveryType.external' },
];

export const servicesConfig: ContentTypeConfig = {
  key: 'services',
  basePath: 'services',
  displayName: 'Service',
  displayNameKey: 'content.services.displayName',
  listColumns: [
    { key: 'name', label: 'Name', labelKey: 'common.name', value: (item) => (item['nameAr'] as string) || (item['nameEn'] as string) || '' },
    { key: 'status', label: 'Status', labelKey: 'common.field.status' },
    {
      key: 'deliveryType',
      label: 'Delivery type',
      labelKey: 'content.services.field.deliveryType',
      value: (item) => {
        const option = DELIVERY_TYPE_OPTIONS.find((o) => o.value === item['deliveryType']);
        return option?.labelKey ?? option?.label ?? '';
      },
    },
    { key: 'isFeatured', label: 'Featured', labelKey: 'common.field.featured', value: (item) => (item['isFeatured'] ? 'common.yes' : 'common.no') },
  ],
  filterFields: [
    { key: 'search', label: 'Search', labelKey: 'common.search', type: 'text' },
    { key: 'status', label: 'Status', labelKey: 'common.field.status', type: 'select', options: CONTENT_STATUS_OPTIONS },
    { key: 'deliveryType', label: 'Delivery type', labelKey: 'content.services.field.deliveryType', type: 'select', options: DELIVERY_TYPE_OPTIONS },
    { key: 'audienceId', label: 'Audience', labelKey: 'content.services.filter.audience', type: 'select', lookupKey: 'service-audiences' },
    { key: 'channelId', label: 'Channel', labelKey: 'content.services.filter.channel', type: 'select', lookupKey: 'service-channels' },
    { key: 'isFeatured', label: 'Featured', labelKey: 'common.field.featured', type: 'checkbox' },
  ],
  baseFieldControls: [
    slugField(),
    {
      key: 'deliveryType',
      label: 'Delivery type',
      labelKey: 'content.services.field.deliveryType',
      type: 'select',
      options: DELIVERY_TYPE_OPTIONS,
      validators: [Validators.required],
    },
    { key: 'iconId', label: 'Icon', labelKey: 'content.services.field.icon', type: 'media-picker', mediaKindFilter: MediaKind.Image },
    { key: 'supportPhone', label: 'Support phone', labelKey: 'content.services.field.supportPhone', type: 'text', validators: [Validators.maxLength(50)] },
    { key: 'faqCategoryId', label: 'FAQ category', labelKey: 'content.services.field.faqCategory', type: 'select', lookupKey: 'faq-categories' },
    { key: 'isFeatured', label: 'Featured', labelKey: 'common.field.featured', type: 'checkbox' },
    sortOrderField(),
  ],
  translationFieldControls: [
    { key: 'name', label: 'Name', labelKey: 'common.name', type: 'text', validators: [Validators.required, Validators.maxLength(400)] },
    { key: 'description', label: 'Description', labelKey: 'common.field.description', type: 'textarea', validators: [Validators.required] },
    { key: 'fee', label: 'Fee', labelKey: 'content.services.field.fee', type: 'text', validators: [Validators.maxLength(300)] },
    { key: 'deliveryTime', label: 'Delivery time', labelKey: 'content.services.field.deliveryTime', type: 'text', validators: [Validators.maxLength(300)] },
    { key: 'requiredDocuments', label: 'Required documents', labelKey: 'content.services.field.requiredDocuments', type: 'textarea' },
    { key: 'steps', label: 'Steps', labelKey: 'content.services.field.steps', type: 'textarea' },
    { key: 'terms', label: 'Terms', labelKey: 'content.services.field.terms', type: 'textarea' },
    { key: 'objectives', label: 'Objectives', labelKey: 'content.services.field.objectives', type: 'textarea' },
    { key: 'startServiceUrl', label: 'Start service URL', labelKey: 'content.services.field.startServiceUrl', type: 'text', validators: [Validators.maxLength(2000)] },
    { key: 'guideFileId', label: 'Guide file', labelKey: 'content.services.field.guideFile', type: 'media-picker', mediaKindFilter: MediaKind.Document },
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
      labelKey: 'content.services.action.links',
      fields: [
        { key: 'audienceIds', label: 'Audiences', labelKey: 'content.services.field.audiences', type: 'multiselect', lookupKey: 'service-audiences' },
        { key: 'channelIds', label: 'Channels', labelKey: 'content.services.field.channels', type: 'multiselect', lookupKey: 'service-channels' },
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
