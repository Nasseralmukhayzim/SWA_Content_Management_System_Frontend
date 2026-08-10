import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { switchMap, timer } from 'rxjs';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { AuthService } from '../../core/services/auth.service';
import { ContentStatus } from '../../shared/content-engine/models/content-status.model';
import { ContentApiService, RecentActivityApiItem } from '../../shared/content-engine/services/content-api.service';
import { statusesActionableByRole } from '../../shared/content-engine/models/workflow-status.util';
import { StatusBadgeComponent } from '../../shared/ui/status-badge/status-badge.component';

const REFRESH_INTERVAL_MS = 30_000;

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
  path: string;
}

const QUICK_LINKS: QuickLink[] = [
  { label: 'Pages', path: '/pages', icon: 'description', description: 'Static site pages', basePath: 'pages' },
  { label: 'News', path: '/news', icon: 'article', description: 'Announcements & press', basePath: 'news' },
  { label: 'Events', path: '/events', icon: 'event', description: 'Calendar & events', basePath: 'events' },
  { label: 'FAQs', path: '/faqs', icon: 'help', description: 'Common questions', basePath: 'faqs' },
  { label: 'Documents', path: '/documents', icon: 'folder', description: 'Reports & downloads', basePath: 'documents' },
  { label: 'Services', path: '/services', icon: 'design_services', description: 'Water e-services', basePath: 'services' },
];

const SECTION_LABELS: Record<string, string> = {
  news: 'News',
  events: 'Events',
  faqs: 'FAQs',
  documents: 'Documents',
  pages: 'Pages',
  services: 'Services',
};

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, MatIconModule, StatusBadgeComponent, TranslatePipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly contentApi = inject(ContentApiService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly links = computed(() =>
    QUICK_LINKS.filter((link) => !link.roles || link.roles.some((role) => this.auth.hasRole(role))),
  );

  protected readonly counts = signal<Record<string, number | null>>({});
  protected readonly recentActivity = signal<ActivityItem[]>([]);

  /** Admin acts on everything, so it gets the unfiltered feed. Every other role only ever runs
   *  actions on a subset of statuses (see WORKFLOW_ACTIONS) — restrict "Recent activity" to
   *  that subset so each role's widget reflects what they can actually do something about. */
  private readonly relevantStatuses: ContentStatus[] | undefined = this.auth.hasRole('Admin')
    ? undefined
    : [...new Set(this.auth.roles().flatMap((role) => statusesActionableByRole(role)))];

  /** Ticks every second so "Updated Xs ago" visibly counts up — proof the poll is alive even
   *  on refreshes where the underlying data happens not to have changed. */
  protected readonly secondsSinceUpdate = signal(0);

  ngOnInit(): void {
    timer(0, 1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.secondsSinceUpdate.update((seconds) => seconds + 1));

    // Refresh on load, then again every REFRESH_INTERVAL_MS — no manual page reload needed to
    // see activity that happened elsewhere while this dashboard is open.
    timer(0, REFRESH_INTERVAL_MS)
      .pipe(
        switchMap(() => this.contentApi.recentActivity(6, this.relevantStatuses)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (items) => {
          this.recentActivity.set(items.map(toActivityItem));
          this.secondsSinceUpdate.set(0);
        },
        error: () => this.recentActivity.set([]),
      });

    for (const link of this.links()) {
      if (!link.basePath) continue;
      const basePath = link.basePath;
      timer(0, REFRESH_INTERVAL_MS)
        .pipe(
          switchMap(() => this.contentApi.list(basePath, { page: 1, pageSize: 1 })),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe({
          next: (result) => this.counts.update((current) => ({ ...current, [basePath]: result.totalCount })),
          error: () => this.counts.update((current) => ({ ...current, [basePath]: null })),
        });
    }
  }

  protected countFor(link: QuickLink): number | null {
    return link.basePath ? (this.counts()[link.basePath] ?? null) : null;
  }
}

function toActivityItem(item: RecentActivityApiItem): ActivityItem {
  const isPublished = item.status === ContentStatus.Published;
  return {
    title: item.title,
    section: SECTION_LABELS[item.contentType] ?? item.contentType,
    date: new Date(item.occurredAtUtc).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
    status: item.status,
    icon: isPublished ? 'check' : 'more_horiz',
    iconClass: isPublished ? 'dashboard__activity-icon--done' : 'dashboard__activity-icon--pending',
    path: `/${item.contentType}/${item.id}`,
  };
}
