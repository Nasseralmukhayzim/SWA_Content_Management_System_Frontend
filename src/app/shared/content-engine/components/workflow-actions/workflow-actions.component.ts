import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../../../core/services/auth.service';
import { AppError } from '../../../../core/models/problem-details.models';
import { ContentStatus } from '../../models/content-status.model';
import { WorkflowActionDef, allowedActionsFor } from '../../models/workflow-status.util';
import { ContentApiService } from '../../services/content-api.service';

@Component({
  selector: 'app-workflow-actions',
  imports: [MatButtonModule, MatTooltipModule],
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

  readonly actionCompleted = output<void>();

  protected readonly pending = signal(false);
  protected readonly actions = computed(() => allowedActionsFor(this.status()));

  protected canRun(action: WorkflowActionDef): boolean {
    if (action.key === 'publish' && !this.hasAllTranslations()) {
      return false;
    }
    return this.auth.hasAnyRole('Admin', action.role);
  }

  protected tooltipFor(action: WorkflowActionDef): string {
    if (action.key === 'publish' && !this.hasAllTranslations()) {
      return 'Both languages must be filled in before publishing';
    }
    return '';
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
}
