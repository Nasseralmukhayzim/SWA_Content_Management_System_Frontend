export interface LookupTranslationResponse {
  language: string;
  name: string;
}

export interface LookupResponse {
  id: string;
  slug: string;
  isActive: boolean;
  sortOrder: number;
  translations: LookupTranslationResponse[];
}

export interface LookupListItem {
  id: string;
  slug: string;
  isActive: boolean;
  sortOrder: number;
  nameAr?: string;
  nameEn?: string;
}
