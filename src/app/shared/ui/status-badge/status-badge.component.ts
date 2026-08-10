import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { CONTENT_STATUS_LABEL_KEYS, ContentStatus } from '../../content-engine/models/content-status.model';

const STATUS_CLASS: Record<ContentStatus, string> = {
  [ContentStatus.Draft]: 'status-badge--draft',
  [ContentStatus.InReview]: 'status-badge--in-review',
  [ContentStatus.Approved]: 'status-badge--approved',
  [ContentStatus.Published]: 'status-badge--published',
  [ContentStatus.Archived]: 'status-badge--archived',
};

@Component({
  selector: 'app-status-badge',
  imports: [TranslatePipe],
  templateUrl: './status-badge.component.html',
  styleUrl: './status-badge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusBadgeComponent {
  readonly status = input.required<ContentStatus>();

  protected readonly labelKey = computed(() => CONTENT_STATUS_LABEL_KEYS[this.status()]);
  protected readonly cssClass = computed(() => STATUS_CLASS[this.status()]);
}
