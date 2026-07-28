import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PagedResult } from '../../../core/models/paged-result.model';
import { WorkflowActionKey } from '../models/workflow-status.util';

@Injectable({ providedIn: 'root' })
export class ContentApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/admin`;

  list<TListItem>(basePath: string, params: Record<string, unknown>): Observable<PagedResult<TListItem>> {
    return this.http.get<PagedResult<TListItem>>(`${this.baseUrl}/${basePath}`, { params: toHttpParams(params) });
  }

  getById<TDetail>(basePath: string, id: string): Observable<TDetail> {
    return this.http.get<TDetail>(`${this.baseUrl}/${basePath}/${id}`);
  }

  create(basePath: string, payload: Record<string, unknown>): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(`${this.baseUrl}/${basePath}`, payload);
  }

  update(basePath: string, id: string, payload: Record<string, unknown>): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${basePath}/${id}`, payload);
  }

  setTranslation(basePath: string, id: string, language: string, payload: Record<string, unknown>): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${basePath}/${id}/translations/${language}`, payload);
  }

  deleteTranslation(basePath: string, id: string, language: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${basePath}/${id}/translations/${language}`);
  }

  remove(basePath: string, id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${basePath}/${id}`);
  }

  runWorkflowAction(basePath: string, id: string, action: WorkflowActionKey): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${basePath}/${id}/${action}`, {});
  }

  runExtraAction(basePath: string, id: string, path: string, payload: Record<string, unknown>): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${basePath}/${id}/${path}`, payload);
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
