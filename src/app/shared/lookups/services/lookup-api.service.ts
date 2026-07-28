import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PagedResult } from '../../../core/models/paged-result.model';
import { LookupListItem, LookupResponse } from '../models/lookup.model';

@Injectable({ providedIn: 'root' })
export class LookupApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/admin`;

  list(
    basePath: string,
    params: Record<string, unknown> = {},
  ): Observable<PagedResult<LookupListItem>> {
    return this.http.get<PagedResult<LookupListItem>>(`${this.baseUrl}/${basePath}`, {
      params: toHttpParams(params),
    });
  }

  getById(basePath: string, id: string): Observable<LookupResponse> {
    return this.http.get<LookupResponse>(`${this.baseUrl}/${basePath}/${id}`);
  }

  create(basePath: string, payload: Record<string, unknown>): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(`${this.baseUrl}/${basePath}`, payload);
  }

  update(basePath: string, id: string, payload: Record<string, unknown>): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${basePath}/${id}`, payload);
  }

  setTranslation(basePath: string, id: string, language: string, name: string): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${basePath}/${id}/translations/${language}`, { name });
  }

  remove(basePath: string, id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${basePath}/${id}`);
  }
}

function toHttpParams(params: Record<string, unknown>): HttpParams {
  let httpParams = new HttpParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== '') {
      httpParams = httpParams.set(key, String(value));
    }
  }
  return httpParams;
}
