import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { MediaAssetResponse, MediaKind } from '../../media/models/media-asset.model';
import { MediaPickerDialogComponent } from './media-picker-dialog.component';

@Injectable({ providedIn: 'root' })
export class MediaPickerService {
  private readonly dialog = inject(MatDialog);

  pick(kindFilter?: MediaKind): Observable<MediaAssetResponse | undefined> {
    const dialogRef = this.dialog.open(MediaPickerDialogComponent, {
      data: { kindFilter },
      width: '640px',
    });
    return dialogRef.afterClosed();
  }
}
