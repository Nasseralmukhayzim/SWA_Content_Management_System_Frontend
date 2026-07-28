import { Routes } from '@angular/router';
import { LookupFormComponent } from '../../shared/lookups/components/lookup-form/lookup-form.component';
import { LookupListComponent } from '../../shared/lookups/components/lookup-list/lookup-list.component';
import { LookupTypeConfig } from '../../shared/lookups/models/lookup-type-config';
import { documentCategoriesConfig } from './configs/document-categories.config';
import { eventTypesConfig } from './configs/event-types.config';
import { faqCategoriesConfig } from './configs/faq-categories.config';
import { serviceAudiencesConfig } from './configs/service-audiences.config';
import { serviceChannelsConfig } from './configs/service-channels.config';
import { LookupHomeComponent } from './lookup-home/lookup-home.component';

function buildLookupRoutes(config: LookupTypeConfig): Routes {
  const data = { config };
  return [
    { path: '', component: LookupListComponent, data },
    { path: 'new', component: LookupFormComponent, data },
    { path: ':id', component: LookupFormComponent, data },
  ];
}

export const lookupManagerRoutes: Routes = [
  { path: '', component: LookupHomeComponent },
  { path: 'event-types', children: buildLookupRoutes(eventTypesConfig) },
  { path: 'faq-categories', children: buildLookupRoutes(faqCategoriesConfig) },
  { path: 'document-categories', children: buildLookupRoutes(documentCategoriesConfig) },
  { path: 'service-audiences', children: buildLookupRoutes(serviceAudiencesConfig) },
  { path: 'service-channels', children: buildLookupRoutes(serviceChannelsConfig) },
];
