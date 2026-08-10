import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { AuthService } from '../../../../core/services/auth.service';
import { AppError } from '../../../../core/models/problem-details.models';
import {
  ContentStatus,
  DELETION_STATUS_LABEL_KEYS,
  DeletionRequestStatus,
} from '../../models/content-status.model';
import {
  DeletionActionDef,
  WorkflowActionDef,
  allowedActionsFor,
  allowedDeletionActionsFor,
} from '../../models/workflow-status.util';
import { ContentApiService } from '../../services/content-api.service';

@Component({
  selector: 'app-workflow-actions',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule, TranslatePipe],
  templateUrl: './workflow-actions.component.html',
  styleUrl: './workflow-actions.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkflowActionsComponent {
  private readonly auth = inject(AuthService);
  private readonly api = inject(ContentApiService);
  private readonly snackBar = inject(MatSnackBar);

  readonly status = input.required<ContentStatus>();
  readonly hasAllTranslations = input(false);
  readonly basePath = input.required<string>();
  readonly id = input.required<string>();
  readonly deletionStatus = input<DeletionRequestStatus>(DeletionRequestStatus.None);

  readonly actionCompleted = output<void>();

  protected readonly DeletionRequestStatus = DeletionRequestStatus;
  protected readonly pending = signal(false);
  protected readonly actions = computed(() => allowedActionsFor(this.status()));
  protected readonly deletionActions = computed(() => allowedDeletionActionsFor(this.deletionStatus()));
  protected readonly deletionStatusLabelKey = computed(() => DELETION_STATUS_LABEL_KEYS[this.deletionStatus()]);
  protected readonly isDeletionPending = computed(() => this.deletionStatus() !== DeletionRequestStatus.None);

  protected canRun(action: WorkflowActionDef): boolean {
    if (action.key === 'publish' && !this.hasAllTranslations()) {
      return false;
    }
    return this.auth.hasAnyRole('Admin', ...action.roles);
  }

  /** Returns an i18n dictionary key (or '' for no tooltip) — resolved in the template via `| translate`. */
  protected tooltipFor(action: WorkflowActionDef): string {
    if (action.key === 'publish' && !this.hasAllTranslations()) {
      return 'workflow.tooltip.publishRequiresTranslations';
    }
    return '';
  }

  protected canRunDeletion(action: DeletionActionDef): boolean {
    if (action.role === 'Any') {
      return this.auth.hasAnyRole('Admin', 'Writer', 'Reviewer', 'Publisher');
    }
    return this.auth.hasAnyRole('Admin', action.role);
  }

  run(action: WorkflowActionDef): void {
    if (this.pending()) {
      return;
    }
    this.pending.set(true);
    this.api.runWorkflowAction(this.basePath(), this.id(), action.key).subscribe({
      next: () => {
        this.pending.set(false);
        this.actionCompleted.emit();
      },
      error: (error: AppError) => {
        this.pending.set(false);
        this.snackBar.open(error.title, 'Dismiss', { duration: 5000 });
      },
    });
  }

  runDeletion(action: DeletionActionDef): void {
    if (this.pending()) {
      return;
    }
    this.pending.set(true);
    this.api.runWorkflowAction(this.basePath(), this.id(), action.key).subscribe({
      next: () => {
        this.pending.set(false);
        this.actionCompleted.emit();
      },
      error: (error: AppError) => {
        this.pending.set(false);
        this.snackBar.open(error.title, 'Dismiss', { duration: 5000 });
      },
    });
  }
}
