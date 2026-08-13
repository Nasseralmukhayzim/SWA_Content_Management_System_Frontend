import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
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
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { AuthService } from '../../core/services/auth.service';
import { LanguageService } from '../../core/services/language.service';

interface NavItem {
  labelKey: string;
  path: string;
  icon: string;
  roles?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { labelKey: 'nav.dashboard', path: '/dashboard', icon: 'dashboard' },
  { labelKey: 'nav.pages', path: '/pages', icon: 'description' },
  { labelKey: 'nav.news', path: '/news', icon: 'article' },
  { labelKey: 'nav.events', path: '/events', icon: 'event' },
  { labelKey: 'nav.faqs', path: '/faqs', icon: 'help' },
  { labelKey: 'nav.documents', path: '/documents', icon: 'folder' },
  { labelKey: 'nav.services', path: '/services', icon: 'design_services' },
  { labelKey: 'nav.media', path: '/media', icon: 'perm_media' },
  { labelKey: 'nav.categories', path: '/categories', icon: 'sell' },
  { labelKey: 'nav.users', path: '/users', icon: 'group', roles: ['Admin'] },
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
    TranslatePipe,
  ],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent {
  protected readonly auth = inject(AuthService);
  protected readonly languageService = inject(LanguageService);
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

  protected readonly greetingKey = computed(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'shell.greeting.morning';
    if (hour < 18) return 'shell.greeting.afternoon';
    return 'shell.greeting.evening';
  });

  protected readonly today = computed(() => {
    // Force Gregorian explicitly — the bare 'ar-SA' locale defaults to the Hijri calendar,
    // which would silently change the actual date shown, not just its language.
    const locale = this.languageService.language() === 'ar' ? 'ar-SA-u-ca-gregory' : 'en-US';
    return new Date().toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
  });

  logout(): void {
    this.auth.logout();
  }
}
