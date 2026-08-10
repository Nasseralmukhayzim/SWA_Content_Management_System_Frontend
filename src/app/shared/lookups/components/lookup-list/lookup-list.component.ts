import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { AppError } from '../../../../core/models/problem-details.models';
import { AuthService } from '../../../../core/services/auth.service';
import { ConfirmDialogService } from '../../../ui/confirm-dialog/confirm-dialog.service';
import { LookupListItem } from '../../models/lookup.model';
import { LookupTypeConfig } from '../../models/lookup-type-config';
import { LookupApiService } from '../../services/lookup-api.service';

@Component({
  selector: 'app-lookup-list',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TranslatePipe,
  ],
  templateUrl: './lookup-list.component.html',
  styleUrl: './lookup-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LookupListComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(LookupApiService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  protected readonly auth = inject(AuthService);

  protected readonly config = this.route.snapshot.data['config'] as LookupTypeConfig;
  protected readonly displayedColumns = ['name', 'isActive', 'sortOrder', 'actions'];
  // Mirrors the backend's [Authorize] split: Create/Update need Writer, Delete needs Publisher.
  protected readonly canCreate = this.auth.hasAnyRole('Admin', 'Writer');
  protected readonly canDelete = this.auth.hasAnyRole('Admin', 'Publisher');

  protected readonly items = signal<LookupListItem[]>([]);
  protected readonly totalCount = signal(0);
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(20);
  protected readonly loading = signal(false);

  protected readonly isActiveFilter = this.fb.control<boolean | null>(null);

  ngOnInit(): void {
    this.isActiveFilter.valueChanges.subscribe(() => {
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

  remove(item: LookupListItem): void {
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
        this.api.remove(this.config.basePath, item.id).subscribe({
          next: () => this.fetch(),
          error: (error: AppError) => this.snackBar.open(error.title, 'Dismiss', { duration: 5000 }),
        });
      });
  }

  private fetch(): void {
    this.loading.set(true);
    this.api
      .list(this.config.basePath, {
        page: this.pageIndex() + 1,
        pageSize: this.pageSize(),
        isActive: this.isActiveFilter.value,
      })
      .subscribe({
        next: (result) => {
          this.items.set(result.items);
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
