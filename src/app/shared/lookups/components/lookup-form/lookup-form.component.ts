import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AppError } from '../../../../core/models/problem-details.models';
import { AuthService } from '../../../../core/services/auth.service';
import { SLUG_MAX_LENGTH, SLUG_PATTERN } from '../../../content-engine/models/content-type-config';
import { LanguageTabDirective } from '../../../ui/language-tabs/language-tab.directive';
import { LanguageOption, LanguageTabsComponent } from '../../../ui/language-tabs/language-tabs.component';
import { LookupTypeConfig } from '../../models/lookup-type-config';
import { LookupApiService } from '../../services/lookup-api.service';

const LANGUAGES: LanguageOption[] = [
  { code: 'ar', label: 'العربية' },
  { code: 'en', label: 'English' },
];

@Component({
  selector: 'app-lookup-form',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    LanguageTabsComponent,
    LanguageTabDirective,
  ],
  templateUrl: './lookup-form.component.html',
  styleUrl: './lookup-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LookupFormComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(LookupApiService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly auth = inject(AuthService);

  protected readonly config = this.route.snapshot.data['config'] as LookupTypeConfig;
  protected readonly languages = LANGUAGES;
  // Mirrors the backend's [Authorize] split: Create/Update/SetTranslation all need Writer.
  protected readonly canWrite = this.auth.hasAnyRole('Admin', 'Writer');

  private readonly routeId = this.route.snapshot.paramMap.get('id');
  protected readonly isCreate = this.routeId === null;
  protected readonly id = signal<string | null>(this.routeId);
  protected readonly loading = signal(this.routeId !== null);
  protected readonly saving = signal(false);
  protected readonly savingTranslation = signal<string | null>(null);
  protected readonly generalError = signal<string | null>(null);

  protected readonly baseForm: FormGroup = this.fb.group({
    slug: this.fb.control('', [
      Validators.required,
      Validators.pattern(SLUG_PATTERN),
      Validators.maxLength(SLUG_MAX_LENGTH),
    ]),
    isActive: this.fb.control(true),
    sortOrder: this.fb.control(0, [Validators.min(0)]),
    ...Object.fromEntries(
      (this.config.extraFields ?? []).map((field) => [field.key, this.fb.control(null, field.validators ?? [])]),
    ),
  });

  protected readonly translationForms: Record<string, FormGroup> = Object.fromEntries(
    this.languages.map((lang) => [
      lang.code,
      this.fb.group({ name: this.fb.control('', [Validators.required, Validators.maxLength(300)]) }),
    ]),
  );

  ngOnInit(): void {
    if (this.routeId) {
      this.loadDetail(this.routeId);
    }
  }

  protected fieldControl(group: FormGroup, key: string): FormControl {
    return group.get(key) as FormControl;
  }

  saveBase(): void {
    if (this.baseForm.invalid) {
      this.baseForm.markAllAsTouched();
      return;
    }
    this.generalError.set(null);
    this.saving.set(true);
    const value = this.baseForm.value;

    if (this.isCreate) {
      this.api.create(this.config.basePath, value).subscribe({
        next: (result) => {
          this.saving.set(false);
          this.snackBar.open(`${this.config.displayName} created`, 'Dismiss', { duration: 3000 });
          this.router.navigate(['..', result.id], { relativeTo: this.route });
        },
        error: (error: AppError) => {
          this.saving.set(false);
          this.applyError(error, this.baseForm);
        },
      });
      return;
    }

    this.api.update(this.config.basePath, this.id()!, value).subscribe({
      next: () => {
        this.saving.set(false);
        this.snackBar.open('Saved', 'Dismiss', { duration: 3000 });
      },
      error: (error: AppError) => {
        this.saving.set(false);
        this.applyError(error, this.baseForm);
      },
    });
  }

  saveTranslation(language: string): void {
    const group = this.translationForms[language];
    if (group.invalid) {
      group.markAllAsTouched();
      return;
    }
    this.savingTranslation.set(language);
    this.api.setTranslation(this.config.basePath, this.id()!, language, group.value.name).subscribe({
      next: () => {
        this.savingTranslation.set(null);
        this.snackBar.open('Translation saved', 'Dismiss', { duration: 3000 });
      },
      error: (error: AppError) => {
        this.savingTranslation.set(null);
        this.applyError(error, group);
      },
    });
  }

  private applyError(error: AppError, group: FormGroup): void {
    if (error.fieldErrors) {
      for (const [field, messages] of Object.entries(error.fieldErrors)) {
        const controlKey = field.charAt(0).toLowerCase() + field.slice(1);
        group.get(controlKey)?.setErrors({ server: messages.join(' ') });
      }
    } else {
      this.generalError.set(error.detail ?? error.title);
    }
  }

  private loadDetail(id: string): void {
    this.loading.set(true);
    this.api.getById(this.config.basePath, id).subscribe({
      next: (detail) => {
        this.baseForm.patchValue(detail as unknown as Record<string, unknown>);
        for (const translation of detail.translations) {
          this.translationForms[translation.language]?.patchValue({ name: translation.name });
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
