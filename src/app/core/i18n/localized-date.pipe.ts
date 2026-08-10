import { Pipe, PipeTransform, inject } from '@angular/core';
import { LanguageService } from '../services/language.service';

const DEFAULT_OPTIONS: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };

@Pipe({
  name: 'localizedDate',
  // Impure so it re-evaluates on toggle, matching TranslatePipe's live-update behavior.
  pure: false,
})
export class LocalizedDatePipe implements PipeTransform {
  private readonly languageService = inject(LanguageService);

  transform(value: string | Date | null | undefined, options: Intl.DateTimeFormatOptions = DEFAULT_OPTIONS): string {
    if (!value) return '';
    const date = typeof value === 'string' ? new Date(value) : value;
    if (Number.isNaN(date.getTime())) return '';

    // Force Gregorian explicitly — the bare 'ar-SA' locale defaults to the Hijri calendar,
    // which would silently change the actual date shown, not just its language.
    const locale = this.languageService.language() === 'ar' ? 'ar-SA-u-ca-gregory' : 'en-US';
    return date.toLocaleDateString(locale, options);
  }
}
