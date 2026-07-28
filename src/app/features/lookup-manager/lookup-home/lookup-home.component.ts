import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { RouterLink } from '@angular/router';

interface LookupLink {
  label: string;
  path: string;
}

const LOOKUP_LINKS: LookupLink[] = [
  { label: 'Event Types', path: 'event-types' },
  { label: 'FAQ Categories', path: 'faq-categories' },
  { label: 'Document Categories', path: 'document-categories' },
  { label: 'Service Audiences', path: 'service-audiences' },
  { label: 'Service Channels', path: 'service-channels' },
];

@Component({
  selector: 'app-lookup-home',
  imports: [RouterLink, MatListModule, MatIconModule],
  templateUrl: './lookup-home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LookupHomeComponent {
  protected readonly links = LOOKUP_LINKS;
}
