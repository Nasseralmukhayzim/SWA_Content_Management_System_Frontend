import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PagedResult } from '../../../core/models/paged-result.model';
import { DescribeMediaRequest, MediaAssetResponse, MediaKind } from '../models/media-asset.model';

export interface MediaListParams {
  page: number;
  pageSize: number;
  kind?: MediaKind;
  search?: string;
}

export interface UploadMediaFields {
  titleAr?: string | null;
  titleEn?: string | null;
  altTextAr?: string | null;
  altTextEn?: string | null;
}

function mapMediaAsset(raw: Record<string, unknown>): MediaAssetResponse {
  const url = (raw['fileUrl'] as string) || (raw['url'] as string) || '';
  const sizeInBytes = (raw['sizeBytes'] as number) ?? (raw['sizeInBytes'] as number) ?? 0;
  const createdAtUtc = (raw['uploadedAt'] as string) || (raw['createdAtUtc'] as string) || '';
  return {
    ...(raw as unknown as MediaAssetResponse),
    url,
    sizeInBytes,
    createdAtUtc,
  };
}

@Injectable({ providedIn: 'root' })
export class MediaApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/admin/media`;

  list(params: MediaListParams): Observable<PagedResult<MediaAssetResponse>> {
    let httpParams = new HttpParams().set('page', params.page).set('pageSize', params.pageSize);
    if (params.kind !== undefined) {
      httpParams = httpParams.set('kind', params.kind);
    }
    if (params.search) {
      httpParams = httpParams.set('search', params.search);
    }
    return this.http.get<PagedResult<Record<string, unknown>>>(this.baseUrl, { params: httpParams }).pipe(
      map((result) => ({
        ...result,
        items: result.items.map(mapMediaAsset),
      })),
    );
  }

  getById(id: string): Observable<MediaAssetResponse> {
    return this.http.get<Record<string, unknown>>(`${this.baseUrl}/${id}`).pipe(map(mapMediaAsset));
  }

  upload(file: File, fields: UploadMediaFields): Observable<MediaAssetResponse> {
    const formData = new FormData();
    formData.append('File', file);
    if (fields.titleAr) formData.append('TitleAr', fields.titleAr);
    if (fields.titleEn) formData.append('TitleEn', fields.titleEn);
    if (fields.altTextAr) formData.append('AltTextAr', fields.altTextAr);
    if (fields.altTextEn) formData.append('AltTextEn', fields.altTextEn);

    return this.http.post<Record<string, unknown>>(this.baseUrl, formData).pipe(map(mapMediaAsset));
  }

  describe(id: string, request: DescribeMediaRequest): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}/description`, request);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
