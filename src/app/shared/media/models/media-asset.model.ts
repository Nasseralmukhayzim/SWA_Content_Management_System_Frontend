export enum MediaKind {
  Image = 0,
  Document = 1,
  Video = 2,
  Other = 3,
}

export const MEDIA_KIND_LABELS: Record<MediaKind, string> = {
  [MediaKind.Image]: 'Image',
  [MediaKind.Document]: 'Document',
  [MediaKind.Video]: 'Video',
  [MediaKind.Other]: 'Other',
};

export const MEDIA_KIND_LABEL_KEYS: Record<MediaKind, string> = {
  [MediaKind.Image]: 'media.kind.image',
  [MediaKind.Document]: 'media.kind.document',
  [MediaKind.Video]: 'media.kind.video',
  [MediaKind.Other]: 'media.kind.other',
};

export interface MediaAssetResponse {
  id: string;
  url: string;
  originalFileName: string;
  contentType: string;
  sizeInBytes: number;
  kind: MediaKind;
  titleAr?: string;
  titleEn?: string;
  altTextAr?: string;
  altTextEn?: string;
  createdAtUtc: string;
}

export interface DescribeMediaRequest {
  titleAr?: string | null;
  titleEn?: string | null;
  altTextAr?: string | null;
  altTextEn?: string | null;
}

export const MAX_MEDIA_UPLOAD_BYTES = 50 * 1024 * 1024;
