import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
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
import { LookupApiService } from '../../../lookups/services/lookup-api.service';
import { LanguageTabDirective } from '../../../ui/language-tabs/language-tab.directive';
import { LanguageOption, LanguageTabsComponent } from '../../../ui/language-tabs/language-tabs.component';
import { MediaPickerService } from '../../../ui/media-picker/media-picker.service';
import { isoToLocalInput, localInputToIso } from '../../datetime.util';
import { ContentStatus } from '../../models/content-status.model';
import {
  ContentTypeConfig,
  FieldDef,
  FieldOption,
  defaultValueFor,
  emptyToNull,
} from '../../models/content-type-config';
import { ContentApiService } from '../../services/content-api.service';
import { WorkflowActionsComponent } from '../workflow-actions/workflow-actions.component';
import { RichTextEditorComponent } from '../../../ui/rich-text-editor/rich-text-editor.component';

const LANGUAGES: LanguageOption[] = [
  { code: 'ar', label: 'العربية' },
  { code: 'en', label: 'English' },
];

@Component({
  selector: 'app-content-form',
  imports: [
    ReactiveFormsModule,
    NgTemplateOutlet,
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
    WorkflowActionsComponent,
    RichTextEditorComponent,
  ],
  templateUrl: './content-form.component.html',
  styleUrl: './content-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContentFormComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ContentApiService);
  private readonly lookupApi = inject(LookupApiService);
  private readonly mediaPicker = inject(MediaPickerService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly config = this.route.snapshot.data['config'] as ContentTypeConfig;
  protected readonly languages = LANGUAGES;

  private readonly routeId = this.route.snapshot.paramMap.get('id');
  protected readonly isCreate = this.routeId === null;
  protected readonly id = signal<string | null>(this.routeId);

  protected readonly loading = signal(this.routeId !== null);
  protected readonly savingBase = signal(false);
  protected readonly savingTranslation = signal<string | null>(null);
  protected readonly status = signal<ContentStatus>(ContentStatus.Draft);
  protected readonly translationLanguages = signal<string[]>([]);
  protected readonly hasAllTranslations = computed(() => this.translationLanguages().length >= this.languages.length);
  protected readonly generalError = signal<string | null>(null);

  protected readonly lookupOptions = signal<Record<string, FieldOption[]>>({});
  protected readonly mediaPreview = signal<Record<string, string>>({});

  protected readonly baseForm: FormGroup = this.fb.group(
    Object.fromEntries(this.config.baseFieldControls.map((field) => [field.key, this.buildControl(field)])),
  );

  protected readonly translationForms: Record<string, FormGroup> = Object.fromEntries(
    this.languages.map((lang) => [
      lang.code,
      this.fb.group(
        Object.fromEntries(
          this.config.translationFieldControls.map((field) => [field.key, this.buildControl(field)]),
        ),
      ),
    ]),
  );

  protected readonly extraActionForms: Record<string, FormGroup> = Object.fromEntries(
    (this.config.extraActions ?? []).map((action) => [
      action.key,
      this.fb.group(Object.fromEntries(action.fields.map((field) => [field.key, this.buildControl(field)]))),
    ]),
  );

  protected readonly savingExtraAction = signal<string | null>(null);

  ngOnInit(): void {
    this.loadLookups();
    if (this.routeId) {
      this.loadDetail(this.routeId);
    }
  }

  protected fieldControl(group: FormGroup, key: string): FormControl {
    return group.get(key) as FormControl;
  }

  protected optionsFor(field: FieldDef): FieldOption[] {
    if (field.options) {
      return field.options;
    }
    if (field.lookupKey) {
      return this.lookupOptions()[field.lookupKey] ?? [];
    }
    return [];
  }

  protected mediaPreviewFor(field: FieldDef, group: FormGroup): string | null {
    const id = group.get(field.key)?.value;
    if (!id) {
      return null;
    }
    return this.mediaPreview()[id] ?? id;
  }

  protected chooseMedia(field: FieldDef, group: FormGroup): void {
    this.mediaPicker.pick(field.mediaKindFilter).subscribe((asset) => {
      if (!asset) {
        return;
      }
      group.get(field.key)?.setValue(asset.id);
      this.mediaPreview.update((current) => ({ ...current, [asset.id]: asset.originalFileName }));
    });
  }

  protected clearMedia(field: FieldDef, group: FormGroup): void {
    group.get(field.key)?.setValue(null);
  }

  saveBase(): void {
    if (this.baseForm.invalid) {
      this.baseForm.markAllAsTouched();
      return;
    }
    this.generalError.set(null);
    this.savingBase.set(true);
    const payload = this.toIsoPayload(emptyToNull(this.baseForm.value));

    if (this.isCreate) {
      this.api.create(this.config.basePath, this.config.buildCreatePayload(payload)).subscribe({
        next: (result) => {
          this.savingBase.set(false);
          this.snackBar.open(`${this.config.displayName} created`, 'Dismiss', { duration: 3000 });
          this.router.navigate(['..', result.id], { relativeTo: this.route });
        },
        error: (error: AppError) => {
          this.savingBase.set(false);
          this.applyError(error, this.baseForm);
        },
      });
      return;
    }

    this.api.update(this.config.basePath, this.id()!, this.config.buildUpdatePayload(payload)).subscribe({
      next: () => {
        this.savingBase.set(false);
        this.snackBar.open('Saved', 'Dismiss', { duration: 3000 });
      },
      error: (error: AppError) => {
        this.savingBase.set(false);
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
    this.generalError.set(null);
    this.savingTranslation.set(language);
    this.api.setTranslation(this.config.basePath, this.id()!, language, emptyToNull(group.value)).subscribe({
      next: () => {
        this.savingTranslation.set(null);
        this.snackBar.open('Translation saved', 'Dismiss', { duration: 3000 });
        if (!this.translationLanguages().includes(language)) {
          this.translationLanguages.update((langs) => [...langs, language]);
        }
      },
      error: (error: AppError) => {
        this.savingTranslation.set(null);
        this.applyError(error, group);
      },
    });
  }

  saveExtraAction(actionKey: string): void {
    const action = (this.config.extraActions ?? []).find((a) => a.key === actionKey);
    const group = this.extraActionForms[actionKey];
    if (!action || !group) {
      return;
    }
    this.savingExtraAction.set(actionKey);
    action.save(this.api, this.config.basePath, this.id()!, group.value).subscribe({
      next: () => {
        this.savingExtraAction.set(null);
        this.snackBar.open('Saved', 'Dismiss', { duration: 3000 });
      },
      error: (error: AppError) => {
        this.savingExtraAction.set(null);
        this.applyError(error, group);
      },
    });
  }

  onWorkflowActionCompleted(): void {
    const currentId = this.id();
    if (currentId) {
      this.loadDetail(currentId);
    }
  }

  private buildControl(field: FieldDef): FormControl {
    const initial = defaultValueFor(field);
    return this.fb.control(initial, field.validators ?? []);
  }

  private toIsoPayload(value: Record<string, unknown>): Record<string, unknown> {
    const result = { ...value };
    for (const field of this.config.baseFieldControls) {
      if (field.type === 'datetime' && result[field.key]) {
        result[field.key] = localInputToIso(result[field.key] as string);
      }
    }
    return result;
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

  private loadLookups(): void {
    for (const lookup of this.config.lookups ?? []) {
      this.lookupApi
        .list(lookup.basePath, { pageSize: 100, isActive: true, ...lookup.extraQueryParams })
        .subscribe((result) => {
          const options: FieldOption[] = result.items.map((item) => ({
            value: item.id,
            label: item.nameAr || item.nameEn || item.slug,
          }));
          this.lookupOptions.update((current) => ({ ...current, [lookup.key]: options }));
        });
    }
  }

  private loadDetail(id: string): void {
    this.loading.set(true);
    this.api.getById<Record<string, unknown>>(this.config.basePath, id).subscribe({
      next: (detail) => {
        const patched: Record<string, unknown> = { ...detail };
        for (const field of this.config.baseFieldControls) {
          if (field.type === 'datetime') {
            patched[field.key] = isoToLocalInput(detail[field.key] as string | null);
          }
        }
        this.baseForm.patchValue(patched);
        this.status.set(detail['status'] as ContentStatus);

        const translations = (detail['translations'] as Record<string, unknown>[]) ?? [];
        if (translations.length > 0) {
          this.translationLanguages.set(translations.map((t) => String(t['language'])));
          for (const translation of translations) {
            const language = String(translation['language']);
            this.translationForms[language]?.patchValue(translation);
          }
        } else {
          const activeLangs: string[] = [];
          for (const lang of this.languages) {
            const suffix = lang.code === 'ar' ? 'Ar' : 'En';
            const translationData: Record<string, unknown> = {};
            let hasAnyValue = false;

            for (const field of this.config.translationFieldControls) {
              const keyPascal = field.key.charAt(0).toUpperCase() + field.key.slice(1) + suffix;
              const keyCamel = field.key + suffix;
              const val = detail[keyPascal] ?? detail[keyCamel] ?? detail[field.key];
              if (val !== undefined && val !== null && val !== '') {
                translationData[field.key] = val;
                hasAnyValue = true;
              }
            }

            if (hasAnyValue) {
              activeLangs.push(lang.code);
              this.translationForms[lang.code]?.patchValue(translationData);
            }
          }
          this.translationLanguages.set(activeLangs);
        }

        for (const action of this.config.extraActions ?? []) {
          this.extraActionForms[action.key]?.patchValue(action.read(detail));
        }

        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
