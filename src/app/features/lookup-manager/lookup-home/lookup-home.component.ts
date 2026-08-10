import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

interface LookupLink {
  labelKey: string;
  path: string;
}

const LOOKUP_LINKS: LookupLink[] = [
  { labelKey: 'lookupHome.eventTypes', path: 'event-types' },
  { labelKey: 'lookupHome.faqCategories', path: 'faq-categories' },
  { labelKey: 'lookupHome.documentCategories', path: 'document-categories' },
  { labelKey: 'lookupHome.serviceAudiences', path: 'service-audiences' },
  { labelKey: 'lookupHome.serviceChannels', path: 'service-channels' },
];

@Component({
  selector: 'app-lookup-home',
  imports: [RouterLink, MatListModule, MatIconModule, TranslatePipe],
  templateUrl: './lookup-home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LookupHomeComponent {
  protected readonly links = LOOKUP_LINKS;
}
