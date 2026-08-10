import { Pipe, PipeTransform, inject } from '@angular/core';
import { LanguageService } from '../services/language.service';
import { TRANSLATIONS } from './translations';

@Pipe({
  name: 'translate',
  // Impure so the pipe re-evaluates on every change detection run, keeping the
  // LanguageService signal read alive and the translated text in sync when the
  // user toggles the UI language (no page reload required).
  pure: false,
})
export class TranslatePipe implements PipeTransform {
  private readonly languageService = inject(LanguageService);

  transform(key: string, params?: Record<string, string | number>): string {
    const language = this.languageService.language();
    const template = TRANSLATIONS[language][key] ?? key;
    if (!params) return template;

    return Object.entries(params).reduce(
      (result, [token, value]) => result.replaceAll(`{${token}}`, String(value)),
      template,
    );
  }
}
