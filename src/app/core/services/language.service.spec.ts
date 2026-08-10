import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LanguageService } from './language.service';

const LANG_STORAGE_KEY = 'swa-cms-lang';

describe('LanguageService', () => {
  afterEach(() => {
    localStorage.removeItem(LANG_STORAGE_KEY);
    document.documentElement.removeAttribute('lang');
    document.documentElement.removeAttribute('dir');
  });

  function configureTestBed(): void {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
  }

  it('defaults to English and ltr direction when nothing is stored', () => {
    configureTestBed();
    const service = TestBed.inject(LanguageService);

    expect(service.language()).toBe('en');
    expect(service.direction()).toBe('ltr');
    expect(document.documentElement.lang).toBe('en');
    expect(document.documentElement.dir).toBe('ltr');
  });

  it('restores the previously persisted language on init', () => {
    localStorage.setItem(LANG_STORAGE_KEY, 'ar');
    configureTestBed();
    const service = TestBed.inject(LanguageService);

    expect(service.language()).toBe('ar');
    expect(service.direction()).toBe('rtl');
    expect(document.documentElement.lang).toBe('ar');
    expect(document.documentElement.dir).toBe('rtl');
  });

  it('toggle() switches between en and ar, persisting and updating document attributes', () => {
    configureTestBed();
    const service = TestBed.inject(LanguageService);

    service.toggle();
    expect(service.language()).toBe('ar');
    expect(service.direction()).toBe('rtl');
    expect(localStorage.getItem(LANG_STORAGE_KEY)).toBe('ar');
    expect(document.documentElement.lang).toBe('ar');
    expect(document.documentElement.dir).toBe('rtl');

    service.toggle();
    expect(service.language()).toBe('en');
    expect(service.direction()).toBe('ltr');
    expect(localStorage.getItem(LANG_STORAGE_KEY)).toBe('en');
    expect(document.documentElement.lang).toBe('en');
    expect(document.documentElement.dir).toBe('ltr');
  });

  it('setLanguage() sets an explicit language', () => {
    configureTestBed();
    const service = TestBed.inject(LanguageService);

    service.setLanguage('ar');
    expect(service.language()).toBe('ar');

    service.setLanguage('en');
    expect(service.language()).toBe('en');
  });
});
