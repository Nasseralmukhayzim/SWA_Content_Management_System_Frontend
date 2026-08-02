import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MediaAssetResponse, MediaKind } from '../../media/models/media-asset.model';
import { MediaApiService } from '../../media/services/media-api.service';

export interface MediaPickerDialogData {
  kindFilter?: MediaKind;
}

@Component({
  selector: 'app-media-picker-dialog',
  imports: [MatDialogModule, MatButtonModule, MatPaginatorModule, MatProgressSpinnerModule],
  templateUrl: './media-picker-dialog.component.html',
  styleUrl: './media-picker-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MediaPickerDialogComponent implements OnInit {
  private readonly mediaApi = inject(MediaApiService);
  private readonly dialogRef = inject(MatDialogRef<MediaPickerDialogComponent>);
  protected readonly data = inject<MediaPickerDialogData>(MAT_DIALOG_DATA);

  protected readonly MediaKind = MediaKind;
  protected readonly assets = signal<MediaAssetResponse[]>([]);
  protected readonly totalCount = signal(0);
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(12);
  protected readonly loading = signal(false);

  ngOnInit(): void {
    this.fetch();
  }

  onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.fetch();
  }

  select(asset: MediaAssetResponse): void {
    this.dialogRef.close(asset);
  }

  cancel(): void {
    this.dialogRef.close();
  }

  private fetch(): void {
    this.loading.set(true);
    this.mediaApi
      .list({ page: this.pageIndex() + 1, pageSize: this.pageSize(), kind: this.data.kindFilter })
      .subscribe({
        next: (result) => {
          this.assets.set(result.items);
          this.totalCount.set(result.totalCount);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }
}
