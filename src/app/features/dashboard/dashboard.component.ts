import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

interface QuickLink {
  label: string;
  path: string;
  icon: string;
  roles?: string[];
}

const QUICK_LINKS: QuickLink[] = [
  { label: 'Pages', path: '/pages', icon: 'description' },
  { label: 'News', path: '/news', icon: 'article' },
  { label: 'Events', path: '/events', icon: 'event' },
  { label: 'FAQs', path: '/faqs', icon: 'help' },
  { label: 'Documents', path: '/documents', icon: 'folder' },
  { label: 'Services', path: '/services', icon: 'design_services' },
  { label: 'Media', path: '/media', icon: 'perm_media' },
  { label: 'Categories', path: '/categories', icon: 'sell' },
  { label: 'Users', path: '/users', icon: 'group', roles: ['Admin'] },
];

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, MatCardModule, MatIconModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  protected readonly auth = inject(AuthService);

  protected readonly links = computed(() =>
    QUICK_LINKS.filter((link) => !link.roles || link.roles.some((role) => this.auth.hasRole(role))),
  );
}
