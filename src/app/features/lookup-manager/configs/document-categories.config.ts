import { Validators } from '@angular/forms';
import { FieldOption } from '../../../shared/content-engine/models/content-type-config';
import { LookupTypeConfig } from '../../../shared/lookups/models/lookup-type-config';

/** SWA.Domain/Content/Documents/Document.cs — DocumentSection enum. */
const SECTION_OPTIONS: FieldOption[] = [
  { value: 0, label: 'Reports', labelKey: 'content.documents.section.reports' },
  { value: 1, label: 'Regulations', labelKey: 'content.documents.section.regulations' },
];

export const documentCategoriesConfig: LookupTypeConfig = {
  key: 'document-categories',
  basePath: 'document-categories',
  displayName: 'Document Category',
  displayNameKey: 'content.document-categories.displayName',
  extraFields: [
    {
      key: 'section',
      label: 'Section',
      labelKey: 'common.field.section',
      type: 'select',
      options: SECTION_OPTIONS,
      validators: [Validators.required],
    },
  ],
};
