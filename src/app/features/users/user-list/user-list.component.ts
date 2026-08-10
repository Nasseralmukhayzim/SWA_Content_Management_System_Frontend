import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { AppError } from '../../../core/models/problem-details.models';
import { ConfirmDialogService } from '../../../shared/ui/confirm-dialog/confirm-dialog.service';
import { UserSummary } from '../models/user.model';
import { UsersApiService } from '../users-api.service';

@Component({
  selector: 'app-user-list',
  imports: [
    RouterLink,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    TranslatePipe,
  ],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserListComponent implements OnInit {
  private readonly api = inject(UsersApiService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly users = signal<UserSummary[]>([]);
  protected readonly loading = signal(true);
  protected readonly displayedColumns = ['email', 'name', 'roles', 'actions'];

  ngOnInit(): void {
    this.fetch();
  }

  protected fullName(user: UserSummary): string {
    return [user.firstName, user.lastName].filter(Boolean).join(' ');
  }

  remove(user: UserSummary): void {
    this.confirmDialog
      .confirm({
        title: 'Delete user',
        message: `Delete ${user.email}? This cannot be undone.`,
        confirmLabel: 'Delete',
      })
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }
        this.api.remove(user.id).subscribe(() => this.fetch());
      });
  }

  private fetch(): void {
    this.loading.set(true);
    this.api.list().subscribe({
      next: (users) => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: (error: AppError) => {
        this.loading.set(false);
        this.snackBar.open(error.title || 'Failed to load users.', 'Dismiss', { duration: 5000 });
      },
    });
  }
}
