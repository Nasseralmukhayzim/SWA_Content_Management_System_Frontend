import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { switchMap, timer } from 'rxjs';
import { LocalizedDatePipe } from '../../core/i18n/localized-date.pipe';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { AuthService } from '../../core/services/auth.service';
import { ContentStatus } from '../../shared/content-engine/models/content-status.model';
import { ContentApiService, RecentActivityApiItem } from '../../shared/content-engine/services/content-api.service';
import { statusesActionableByRole } from '../../shared/content-engine/models/workflow-status.util';
import { StatusBadgeComponent } from '../../shared/ui/status-badge/status-badge.component';

const REFRESH_INTERVAL_MS = 30_000;

interface QuickLink {
  label: string;
  labelKey: string;
  path: string;
  icon: string;
  description: string;
  descriptionKey: string;
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
  {
    label: 'Pages',
    labelKey: 'nav.pages',
    path: '/pages',
    icon: 'description',
    description: 'Static site pages',
    descriptionKey: 'dashboard.section.pages.description',
    basePath: 'pages',
  },
  {
    label: 'News',
    labelKey: 'nav.news',
    path: '/news',
    icon: 'article',
    description: 'Announcements & press',
    descriptionKey: 'dashboard.section.news.description',
    basePath: 'news',
  },
  {
    label: 'Events',
    labelKey: 'nav.events',
    path: '/events',
    icon: 'event',
    description: 'Calendar & events',
    descriptionKey: 'dashboard.section.events.description',
    basePath: 'events',
  },
  {
    label: 'FAQs',
    labelKey: 'nav.faqs',
    path: '/faqs',
    icon: 'help',
    description: 'Common questions',
    descriptionKey: 'dashboard.section.faqs.description',
    basePath: 'faqs',
  },
  {
    label: 'Documents',
    labelKey: 'nav.documents',
    path: '/documents',
    icon: 'folder',
    description: 'Reports & downloads',
    descriptionKey: 'dashboard.section.documents.description',
    basePath: 'documents',
  },
  {
    label: 'Services',
    labelKey: 'nav.services',
    path: '/services',
    icon: 'design_services',
    description: 'Water e-services',
    descriptionKey: 'dashboard.section.services.description',
    basePath: 'services',
  },
];

const SECTION_LABEL_KEYS: Record<string, string> = {
  news: 'nav.news',
  events: 'nav.events',
  faqs: 'nav.faqs',
  documents: 'nav.documents',
  pages: 'nav.pages',
  services: 'nav.services',
};

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, MatIconModule, StatusBadgeComponent, TranslatePipe, LocalizedDatePipe],
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

  ngOnInit(): void {
    // Refresh on load, then again every REFRESH_INTERVAL_MS — no manual page reload needed to
    // see activity that happened elsewhere while this dashboard is open.
    timer(0, REFRESH_INTERVAL_MS)
      .pipe(
        switchMap(() => this.contentApi.recentActivity(6, this.relevantStatuses)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (items) => this.recentActivity.set(items.map(toActivityItem)),
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
    section: SECTION_LABEL_KEYS[item.contentType] ?? item.contentType,
    date: item.occurredAtUtc,
    status: item.status,
    icon: isPublished ? 'check' : 'more_horiz',
    iconClass: isPublished ? 'dashboard__activity-icon--done' : 'dashboard__activity-icon--pending',
    path: `/${item.contentType}/${item.id}`,
  };
}
