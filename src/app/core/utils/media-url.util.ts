import { environment } from '../../../environments/environment';

/**
 * MediaAssetResponse.url from the API is a root-relative path (e.g. `/media/1448/02/...`),
 * meant to be resolved against the backend host. Binding it directly in a template resolves
 * against the frontend's own origin instead, so every image/PDF preview 404s.
 */
export function resolveMediaUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) {
    return url;
  }
  return `${environment.apiBaseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
}
