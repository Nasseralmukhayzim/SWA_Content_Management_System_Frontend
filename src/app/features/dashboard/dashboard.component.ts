import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ContentStatus } from '../../shared/content-engine/models/content-status.model';
import { ContentApiService } from '../../shared/content-engine/services/content-api.service';
import { StatusBadgeComponent } from '../../shared/ui/status-badge/status-badge.component';

interface QuickLink {
  label: string;
  path: string;
  icon: string;
  description: string;
  basePath?: string;
  roles?: string[];
}

interface ActivityItem {
  title: string;
  section: string;
  date: string;
  status: ContentStatus;
  icon: string;
  iconClass: string;
}

const QUICK_LINKS: QuickLink[] = [
  { label: 'Pages', path: '/pages', icon: 'description', description: 'Static site pages', basePath: 'pages' },
  { label: 'News', path: '/news', icon: 'article', description: 'Announcements & press', basePath: 'news' },
  { label: 'Events', path: '/events', icon: 'event', description: 'Calendar & events', basePath: 'events' },
  { label: 'FAQs', path: '/faqs', icon: 'help', description: 'Common questions', basePath: 'faqs' },
  { label: 'Documents', path: '/documents', icon: 'folder', description: 'Reports & downloads', basePath: 'documents' },
  { label: 'Services', path: '/services', icon: 'design_services', description: 'Water e-services', basePath: 'services' },
];

// Placeholder — there's no "recent activity across content types" endpoint yet;
// swap this for a real feed once the backend exposes one.
const RECENT_ACTIVITY: ActivityItem[] = [
  {
    title: 'New desalination e-services portal',
    section: 'Pages',
    date: '30 Jul 2026',
    status: ContentStatus.Published,
    icon: 'check',
    iconClass: 'dashboard__activity-icon--done',
  },
  {
    title: 'Water sustainability workshop — Riyadh',
    section: 'Events',
    date: '28 Jul 2026',
    status: ContentStatus.InReview,
    icon: 'more_horiz',
    iconClass: 'dashboard__activity-icon--pending',
  },
];

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, MatIconModule, StatusBadgeComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly contentApi = inject(ContentApiService);

  protected readonly links = computed(() =>
    QUICK_LINKS.filter((link) => !link.roles || link.roles.some((role) => this.auth.hasRole(role))),
  );

  protected readonly counts = signal<Record<string, number | null>>({});
  protected readonly recentActivity = RECENT_ACTIVITY;

  ngOnInit(): void {
    for (const link of this.links()) {
      if (!link.basePath) continue;
      this.contentApi.list(link.basePath, { page: 1, pageSize: 1 }).subscribe({
        next: (result) => this.counts.update((current) => ({ ...current, [link.basePath!]: result.totalCount })),
        error: () => this.counts.update((current) => ({ ...current, [link.basePath!]: null })),
      });
    }
  }

  protected countFor(link: QuickLink): number | null {
    return link.basePath ? (this.counts()[link.basePath] ?? null) : null;
  }
}
