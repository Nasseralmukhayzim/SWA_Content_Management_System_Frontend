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
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { AppError } from '../../../core/models/problem-details.models';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmDialogService } from '../../../shared/ui/confirm-dialog/confirm-dialog.service';
import { MEDIA_KIND_LABELS, MediaAssetResponse, MediaKind } from '../../../shared/media/models/media-asset.model';
import { MediaApiService } from '../../../shared/media/services/media-api.service';

@Component({
  selector: 'app-media-list',
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
  ],
  templateUrl: './media-list.component.html',
  styleUrl: './media-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MediaListComponent implements OnInit {
  private readonly api = inject(MediaApiService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);

  // Mirrors the backend's [Authorize]: deleting media needs Publisher (upload/edit don't).
  protected readonly canDelete = this.auth.hasAnyRole('Admin', 'Publisher');

  protected readonly MediaKind = MediaKind;
  protected readonly kindLabels = MEDIA_KIND_LABELS;
  protected readonly kindOptions = Object.entries(MEDIA_KIND_LABELS).map(([value, label]) => ({
    value: Number(value),
    label,
  }));

  protected readonly items = signal<MediaAssetResponse[]>([]);
  protected readonly totalCount = signal(0);
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(20);
  protected readonly loading = signal(false);

  protected readonly kindFilter = this.fb.control<MediaKind | null>(null);
  protected readonly searchFilter = this.fb.control('');

  ngOnInit(): void {
    this.kindFilter.valueChanges.subscribe(() => {
      this.pageIndex.set(0);
      this.fetch();
    });
    this.searchFilter.valueChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => {
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

  protected kindLabel(item: MediaAssetResponse): string {
    return this.kindLabels[item.kind];
  }

  protected formatDate(value?: string): string {
    if (!value) return '-';
    try {
      return new Date(value).toLocaleDateString();
    } catch {
      return '-';
    }
  }

  remove(item: MediaAssetResponse): void {
    this.confirmDialog
      .confirm({
        title: 'Delete media',
        message: `Delete "${item.originalFileName}"? This cannot be undone.`,
        confirmLabel: 'Delete',
      })
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }
        this.api.remove(item.id).subscribe({
          next: () => this.fetch(),
          error: (error: AppError) => this.snackBar.open(error.title, 'Dismiss', { duration: 5000 }),
        });
      });
  }

  private fetch(): void {
    this.loading.set(true);
    this.api
      .list({
        page: this.pageIndex() + 1,
        pageSize: this.pageSize(),
        kind: this.kindFilter.value ?? undefined,
        search: this.searchFilter.value || undefined,
      })
      .subscribe({
        next: (result) => {
          this.items.set(result.items);
          this.totalCount.set(result.totalCount);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }
}
