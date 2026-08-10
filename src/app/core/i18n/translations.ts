import { AppLanguage } from '../services/language.service';
import { AR } from './ar';
import { EN } from './en';

export const TRANSLATIONS: Record<AppLanguage, Record<string, string>> = {
  en: EN,
  ar: AR,
};
