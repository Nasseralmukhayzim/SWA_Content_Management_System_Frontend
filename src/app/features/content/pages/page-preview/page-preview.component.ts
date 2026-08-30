import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ContentApiService } from '../../../../shared/content-engine/services/content-api.service';
import { MediaApiService } from '../../../../shared/media/services/media-api.service';
import { PageSection } from '../../../../shared/content-engine/models/page-section.model';

interface PagePreviewTranslation {
  language: string;
  title: string;
  summary?: string | null;
  body?: string | null;
  sections: PageSection[];
}

interface PagePreviewDetail {
  id: string;
  slug: string;
  heroImageId?: string | null;
  translations: PagePreviewTranslation[];
}

const LANGUAGES: { code: 'ar' | 'en'; label: string }[] = [
  { code: 'ar', label: 'العربية' },
  { code: 'en', label: 'English' },
];

/**
 * A self-contained, best-effort rendering of how a page's content will read once published —
 * built entirely from the CMS's own already-authenticated page detail (same data the edit form
 * uses), so it works for a Draft/InReview/Approved page exactly like a Published one. Deliberately
 * does not reach out to the separate public website app in any way.
 */
@Component({
  selector: 'app-page-preview',
  imports: [RouterLink, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './page-preview.component.html',
  styleUrl: './page-preview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PagePreviewComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ContentApiService);
  private readonly mediaApi = inject(MediaApiService);

  protected readonly languages = LANGUAGES;
  protected readonly pageId = this.route.snapshot.paramMap.get('id')!;

  protected readonly loading = signal(true);
  protected readonly notFound = signal(false);
  protected readonly page = signal<PagePreviewDetail | null>(null);
  protected readonly mediaUrls = signal<Record<string, string>>({});
  protected readonly language = signal<'ar' | 'en'>('ar');

  protected readonly dir = computed<'rtl' | 'ltr'>(() => (this.language() === 'ar' ? 'rtl' : 'ltr'));

  protected readonly translation = computed(() => {
    const page = this.page();
    if (!page) {
      return null;
    }
    return page.translations.find((t) => t.language === this.language()) ?? page.translations[0] ?? null;
  });

  protected readonly heroImageUrl = computed(() => this.imageUrl(this.page()?.heroImageId));

  ngOnInit(): void {
    this.api.getById<PagePreviewDetail>('pages', this.pageId).subscribe({
      next: (page) => {
        this.page.set(page);
        this.loading.set(false);
        this.loadImages(page);
      },
      error: () => {
        this.notFound.set(true);
        this.loading.set(false);
      },
    });
  }

  protected imageUrl(id: string | null | undefined): string | null {
    return id ? (this.mediaUrls()[id] ?? null) : null;
  }

  private loadImages(page: PagePreviewDetail): void {
    const ids = new Set<string>();
    if (page.heroImageId) {
      ids.add(page.heroImageId);
    }
    for (const translation of page.translations) {
      for (const section of translation.sections) {
        for (const item of section.items) {
          if (item.iconId) ids.add(item.iconId);
          if (item.imageId) ids.add(item.imageId);
        }
      }
    }
    for (const id of ids) {
      this.mediaApi.getById(id).subscribe((asset) => {
        this.mediaUrls.update((current) => ({ ...current, [id]: asset.url }));
      });
    }
  }
}
