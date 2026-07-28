import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MediaAssetResponse, MediaKind } from '../../../shared/media/models/media-asset.model';
import { MediaApiService } from '../../../shared/media/services/media-api.service';

@Component({
  selector: 'app-media-edit',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    NgOptimizedImage,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './media-edit.component.html',
  styleUrl: './media-edit.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MediaEditComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(MediaApiService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly MediaKind = MediaKind;
  protected readonly id = this.route.snapshot.paramMap.get('id')!;
  protected readonly asset = signal<MediaAssetResponse | null>(null);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);

  protected readonly form = this.fb.group({
    titleAr: this.fb.control(''),
    titleEn: this.fb.control(''),
    altTextAr: this.fb.control(''),
    altTextEn: this.fb.control(''),
  });

  ngOnInit(): void {
    this.api.getById(this.id).subscribe({
      next: (asset) => {
        this.asset.set(asset);
        this.form.patchValue(asset);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  save(): void {
    this.saving.set(true);
    this.api.describe(this.id, this.form.getRawValue()).subscribe({
      next: () => {
        this.saving.set(false);
        this.snackBar.open('Saved', 'Dismiss', { duration: 3000 });
      },
      error: () => this.saving.set(false),
    });
  }
}
