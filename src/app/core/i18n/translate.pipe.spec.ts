import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LanguageService } from '../services/language.service';
import { TranslatePipe } from './translate.pipe';

const LANG_STORAGE_KEY = 'swa-cms-lang';

describe('TranslatePipe', () => {
  afterEach(() => {
    localStorage.removeItem(LANG_STORAGE_KEY);
  });

  function configureTestBed(): { pipe: TranslatePipe; languageService: LanguageService } {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const languageService = TestBed.inject(LanguageService);
    const pipe = TestBed.runInInjectionContext(() => new TranslatePipe());
    return { pipe, languageService };
  }

  it('translates a known key to English by default', () => {
    const { pipe } = configureTestBed();

    expect(pipe.transform('nav.dashboard')).toBe('Dashboard');
  });

  it('translates a known key to Arabic once the language is toggled', () => {
    const { pipe, languageService } = configureTestBed();

    languageService.toggle();

    expect(pipe.transform('nav.dashboard')).toBe('لوحة التحكم');
  });

  it('returns the raw key when no translation is found', () => {
    const { pipe } = configureTestBed();

    expect(pipe.transform('unknown.key')).toBe('unknown.key');
  });
});
