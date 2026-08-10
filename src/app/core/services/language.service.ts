import { Injectable, computed, signal } from '@angular/core';

export type AppLanguage = 'en' | 'ar';

const LANG_STORAGE_KEY = 'swa-cms-lang';

function readStoredLanguage(): AppLanguage {
  const stored = localStorage.getItem(LANG_STORAGE_KEY);
  return stored === 'ar' ? 'ar' : 'en';
}

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly _language = signal<AppLanguage>(readStoredLanguage());

  readonly language = this._language.asReadonly();

  readonly direction = computed<'ltr' | 'rtl'>(() => (this._language() === 'ar' ? 'rtl' : 'ltr'));

  constructor() {
    this.applyDocumentAttributes(this._language());
  }

  toggle(): void {
    this.setLanguage(this._language() === 'en' ? 'ar' : 'en');
  }

  setLanguage(language: AppLanguage): void {
    this._language.set(language);
    localStorage.setItem(LANG_STORAGE_KEY, language);
    this.applyDocumentAttributes(language);
  }

  private applyDocumentAttributes(language: AppLanguage): void {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }
}
