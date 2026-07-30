import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AppError } from '../../../core/models/problem-details.models';
import { MAX_MEDIA_UPLOAD_BYTES } from '../../../shared/media/models/media-asset.model';
import { MediaApiService } from '../../../shared/media/services/media-api.service';

@Component({
  selector: 'app-media-upload',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ],
  templateUrl: './media-upload.component.html',
  styleUrl: './media-upload.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MediaUploadComponent {
  private readonly api = inject(MediaApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);

  protected readonly form = this.fb.group({
    titleAr: this.fb.control(''),
    titleEn: this.fb.control(''),
    altTextAr: this.fb.control(''),
    altTextEn: this.fb.control(''),
  });

  protected readonly selectedFile = signal<File | null>(null);
  protected readonly previewUrl = signal<string | null>(null);
  protected readonly fileError = signal<string | null>(null);
  protected readonly uploading = signal(false);
  protected readonly dragOver = signal(false);

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.setFile(input.files?.[0] ?? null);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(false);
    this.setFile(event.dataTransfer?.files?.[0] ?? null);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(true);
  }

  onDragLeave(): void {
    this.dragOver.set(false);
  }

  upload(): void {
    const file = this.selectedFile();
    if (!file) {
      this.fileError.set('Choose a file first.');
      return;
    }
    this.uploading.set(true);
    this.api.upload(file, this.form.getRawValue()).subscribe({
      next: () => {
        this.uploading.set(false);
        this.snackBar.open('Uploaded', 'Dismiss', { duration: 3000 });
        this.router.navigate(['..'], { relativeTo: this.route });
      },
      error: (error: AppError) => {
        this.uploading.set(false);
        this.fileError.set(error.detail ?? error.title);
      },
    });
  }

  private setFile(file: File | null): void {
    if (!file) {
      return;
    }
    if (file.size > MAX_MEDIA_UPLOAD_BYTES) {
      this.fileError.set('File exceeds the 50MB upload limit.');
      this.selectedFile.set(null);
      this.previewUrl.set(null);
      return;
    }
    this.fileError.set(null);
    this.selectedFile.set(file);
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      this.previewUrl.set(url);
    } else {
      this.previewUrl.set(null);
    }
  }
}
