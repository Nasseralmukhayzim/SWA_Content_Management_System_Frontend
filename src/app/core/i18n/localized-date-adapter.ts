import { Injectable, inject } from '@angular/core';
import { MatDateFormats, NativeDateAdapter } from '@angular/material/core';
import { LanguageService } from '../services/language.service';

/**
 * Formats/parses datepicker dates per the current UI language instead of the browser's OS
 * locale — English uses dd/mm/yyyy, Arabic uses yyyy/dd/mm (SWA CMS convention, not a
 * general-purpose locale format).
 */
@Injectable()
export class LocalizedDateAdapter extends NativeDateAdapter {
  private readonly languageService = inject(LanguageService);

  override format(date: Date, displayFormat: Object): string {
    if (displayFormat !== 'input') {
      return super.format(date, displayFormat);
    }
    const pad = (value: number) => String(value).padStart(2, '0');
    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1);
    const year = date.getFullYear();
    return this.languageService.language() === 'ar' ? `${year}/${day}/${month}` : `${day}/${month}/${year}`;
  }

  override parse(value: unknown): Date | null {
    if (typeof value !== 'string' || !value.trim()) {
      return null;
    }
    const parts = value.split('/').map((part) => Number(part.trim()));
    if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) {
      return super.parse(value);
    }
    const [first, second, third] = parts;
    const [year, day, month] = this.languageService.language() === 'ar' ? [first, second, third] : [third, second, first];
    const date = new Date(year, month - 1, day);
    return Number.isNaN(date.getTime()) ? null : date;
  }
}

export const LOCALIZED_DATE_FORMATS: MatDateFormats = {
  parse: {
    dateInput: 'input',
  },
  display: {
    dateInput: 'input',
    monthYearLabel: { year: 'numeric', month: 'short' },
    dateA11yLabel: { year: 'numeric', month: 'long', day: 'numeric' },
    monthYearA11yLabel: { year: 'numeric', month: 'long' },
  },
};
