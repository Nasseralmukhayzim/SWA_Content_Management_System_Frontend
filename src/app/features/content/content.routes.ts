import { Routes } from '@angular/router';
import { ContentFormComponent } from '../../shared/content-engine/components/content-form/content-form.component';
import { ContentListComponent } from '../../shared/content-engine/components/content-list/content-list.component';
import { ContentTypeConfig } from '../../shared/content-engine/models/content-type-config';
import { documentsConfig } from './configs/documents.config';
import { eventsConfig } from './configs/events.config';
import { faqsConfig } from './configs/faqs.config';
import { newsConfig } from './configs/news.config';
import { pagesConfig } from './configs/pages.config';
import { PagePreviewComponent } from './pages/page-preview/page-preview.component';
import { servicesConfig } from './configs/services.config';

function buildContentRoutes(config: ContentTypeConfig): Routes {
  const data = { config };
  return [
    { path: '', component: ContentListComponent, data },
    { path: 'new', component: ContentFormComponent, data },
    { path: ':id', component: ContentFormComponent, data },
  ];
}

export const contentRoutes: Routes = [
  {
    path: 'pages',
    children: [...buildContentRoutes(pagesConfig), { path: ':id/preview', component: PagePreviewComponent }],
  },
  { path: 'news', children: buildContentRoutes(newsConfig) },
  { path: 'events', children: buildContentRoutes(eventsConfig) },
  { path: 'faqs', children: buildContentRoutes(faqsConfig) },
  { path: 'documents', children: buildContentRoutes(documentsConfig) },
  { path: 'services', children: buildContentRoutes(servicesConfig) },
];
