import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, map } from 'rxjs';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { AppError } from '../../../../core/models/problem-details.models';
import { AuthService } from '../../../../core/services/auth.service';
import { LookupApiService } from '../../../lookups/services/lookup-api.service';
import { ConfirmDialogService } from '../../../ui/confirm-dialog/confirm-dialog.service';
import { StatusBadgeComponent } from '../../../ui/status-badge/status-badge.component';
import { ContentStatus } from '../../models/content-status.model';
import { ContentTypeConfig, FieldOption, FilterFieldDef } from '../../models/content-type-config';
import { ContentApiService } from '../../services/content-api.service';

@Component({
  selector: 'app-content-list',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    StatusBadgeComponent,
    TranslatePipe,
  ],
  templateUrl: './content-list.component.html',
  styleUrl: './content-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContentListComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ContentApiService);
  private readonly lookupApi = inject(LookupApiService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  protected readonly auth = inject(AuthService);

  protected readonly config = this.route.snapshot.data['config'] as ContentTypeConfig;
  // Mirrors the backend's [Authorize] split: Create/Update need Writer, Delete needs Publisher.
  protected readonly canCreate = this.auth.hasAnyRole('Admin', 'Writer');
  protected readonly canDelete = this.auth.hasAnyRole('Admin', 'Publisher');

  protected readonly items = signal<Record<string, unknown>[]>([]);
  protected readonly totalCount = signal(0);
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(20);
  protected readonly loading = signal(false);
  protected readonly lookupOptions = signal<Record<string, FieldOption[]>>({});

  protected readonly displayedColumns = [...this.config.listColumns.map((c) => c.key), 'actions'];

  protected readonly filterForm = this.fb.group(
    Object.fromEntries(this.config.filterFields.map((field) => [field.key, this.fb.control<string | null>(null)])),
  );

  ngOnInit(): void {
    this.loadLookups();
    this.filterForm.valueChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => {
      this.pageIndex.set(0);
      this.fetch();
    });
    this.fetch();
  }

  onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.fetch();
  }

  protected columnValue(item: Record<string, unknown>, key: string): string {
    const column = this.config.listColumns.find((c) => c.key === key);
    if (column?.value) {
      return column.value(item);
    }
    const value = item[key];
    return value === null || value === undefined ? '' : String(value);
  }

  protected idOf(item: Record<string, unknown>): string {
    return String(item['id']);
  }

  protected statusOf(item: Record<string, unknown>): ContentStatus {
    return item['status'] as ContentStatus;
  }

  protected optionsFor(field: FilterFieldDef): FieldOption[] {
    if (field.options) {
      return field.options;
    }
    if (field.lookupKey) {
      return this.lookupOptions()[field.lookupKey] ?? [];
    }
    return [];
  }

  remove(item: Record<string, unknown>): void {
    this.confirmDialog
      .confirm({
        title: `Delete ${this.config.displayName}`,
        message: 'This cannot be undone. Are you sure you want to delete this item?',
        confirmLabel: 'Delete',
      })
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }
        this.api.remove(this.config.basePath, this.idOf(item)).subscribe({
          next: () => this.fetch(),
          error: (error: AppError) => this.snackBar.open(error.title, 'Dismiss', { duration: 5000 }),
        });
      });
  }

  private loadLookups(): void {
    for (const lookup of this.config.lookups ?? []) {
      const options$ =
        lookup.source === 'content'
          ? this.api
              .list<Record<string, unknown>>(lookup.basePath, { page: 1, pageSize: 200, ...lookup.extraQueryParams })
              .pipe(
                map((result) =>
                  result.items.map(
                    (item): FieldOption => ({
                      value: item['id'] as string,
                      label: (item['titleAr'] as string) || (item['titleEn'] as string) || (item['slug'] as string) || '',
                    }),
                  ),
                ),
              )
          : this.lookupApi
              .list(lookup.basePath, { pageSize: 100, isActive: true, ...lookup.extraQueryParams })
              .pipe(
                map((result) =>
                  result.items.map(
                    (item): FieldOption => ({ value: item.id, label: item.nameAr || item.nameEn || item.slug }),
                  ),
                ),
              );

      options$.subscribe((options) => {
        this.lookupOptions.update((current) => ({ ...current, [lookup.key]: options }));
      });
    }
  }

  private fetch(): void {
    this.loading.set(true);
    this.api
      .list(this.config.basePath, {
        page: this.pageIndex() + 1,
        pageSize: this.pageSize(),
        ...this.filterForm.value,
      })
      .subscribe({
        next: (result) => {
          this.items.set(result.items as Record<string, unknown>[]);
          this.totalCount.set(result.totalCount);
          this.loading.set(false);
        },
        error: (error: AppError) => {
          this.loading.set(false);
          this.snackBar.open(error.title || 'Failed to load list.', 'Dismiss', { duration: 5000 });
        },
      });
  }
}
