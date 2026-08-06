import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { map } from 'rxjs';
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
    MatMenuModule,
  ],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent {
  protected readonly auth = inject(AuthService);
  private readonly breakpointObserver = inject(BreakpointObserver);

  protected readonly navItems = computed(() =>
    NAV_ITEMS.filter((item) => !item.roles || item.roles.some((role) => this.auth.hasRole(role))),
  );

  protected readonly isHandset = toSignal(
    this.breakpointObserver
      .observe([Breakpoints.Handset, Breakpoints.TabletPortrait])
      .pipe(map((result) => result.matches)),
    { initialValue: false },
  );

  protected readonly displayName = computed(() => {
    const fullName = [this.auth.firstName(), this.auth.lastName()].filter(Boolean).join(' ');
    if (fullName) return fullName;

    const email = this.auth.userEmail();
    const localPart = email?.split('@')[0] ?? 'Admin';
    return localPart.charAt(0).toUpperCase() + localPart.slice(1);
  });

  protected readonly initial = computed(() => this.displayName().charAt(0).toUpperCase());

  protected readonly greeting = computed(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  });

  protected readonly today = signal(
    new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }),
  );

  logout(): void {
    this.auth.logout();
  }
}
