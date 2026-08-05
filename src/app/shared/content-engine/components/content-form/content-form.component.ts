import { Location, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
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
import { map } from 'rxjs';
import { AppError } from '../../../../core/models/problem-details.models';
import { AuthService } from '../../../../core/services/auth.service';
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
import { SectionListFieldComponent } from '../section-list-field/section-list-field.component';

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
    SectionListFieldComponent,
  ],
  templateUrl: './content-form.component.html',
  styleUrl: './content-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContentFormComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly api = inject(ContentApiService);
  private readonly lookupApi = inject(LookupApiService);
  private readonly mediaPicker = inject(MediaPickerService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly auth = inject(AuthService);

  protected readonly config = this.route.snapshot.data['config'] as ContentTypeConfig;
  protected readonly languages = LANGUAGES;
  // Mirrors the backend's [Authorize] split: Create/Update/SetTranslation all need Writer.
  protected readonly canWrite = this.auth.hasAnyRole('Admin', 'Writer');

  private readonly routeId = this.route.snapshot.paramMap.get('id');
  // A signal, not a plain boolean: once the base fields are saved on the create route, the form
  // flips in place to "editing" (workflow actions, translations, ...) rather than navigating to
  // a separate edit URL and re-instantiating the whole component from scratch.
  protected readonly isCreate = signal(this.routeId === null);
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

  /** Optional selects (no Validators.required) get a "None" option so a prior choice can be cleared. */
  protected isOptionalSelect(field: FieldDef): boolean {
    return !(field.validators ?? []).includes(Validators.required);
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

    if (this.isCreate()) {
      this.api.create(this.config.basePath, this.config.buildCreatePayload(payload)).subscribe({
        next: (result) => {
          this.savingBase.set(false);
          this.snackBar.open(`${this.config.displayName} created`, 'Dismiss', { duration: 3000 });
          // Reveal translations/workflow actions in place instead of navigating to a fresh
          // edit route — that would tear down and rebuild this whole component for no reason.
          this.id.set(result.id);
          this.status.set(ContentStatus.Draft);
          this.isCreate.set(false);
          this.location.replaceState(this.router.url.replace(/\/new$/, `/${result.id}`));
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
    const payload = emptyToNull(group.value);
    this.api.setTranslation(this.config.basePath, this.id()!, language, payload).subscribe({
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
      const options$ =
        lookup.source === 'content'
          ? this.api
              .list<Record<string, unknown>>(lookup.basePath, { page: 1, pageSize: 200, ...lookup.extraQueryParams })
              .pipe(
                map((result) =>
                  result.items
                    // Exclude the item being edited so it can't be picked as its own parent.
                    .filter((item) => item['id'] !== this.id())
                    .map(
                      (item): FieldOption => ({
                        value: item['id'] as string,
                        label: (item['titleAr'] as string) || (item['titleEn'] as string) || (item['slug'] as string) || '',
                      }),
                    ),
                ),
              )
          : this.lookupApi
              .list(lookup.basePath, { pageSize: 100, isActive: true, ...lookup.extraQueryParams })
              .pipe(
                map((result) =>
                  result.items.map(
                    (item): FieldOption => ({ value: item.id, label: item.nameAr || item.nameEn || item.slug }),
                  ),
                ),
              );

      options$.subscribe((options) => {
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
