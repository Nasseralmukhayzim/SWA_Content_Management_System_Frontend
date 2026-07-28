import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AuthService } from '../../core/services/auth.service';

interface NavItem {
  label: string;
  path: string;
  icon: string;
  roles?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
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
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent {
  protected readonly auth = inject(AuthService);

  protected readonly navItems = computed(() =>
    NAV_ITEMS.filter((item) => !item.roles || item.roles.some((role) => this.auth.hasRole(role))),
  );

  logout(): void {
    this.auth.logout();
  }
}
