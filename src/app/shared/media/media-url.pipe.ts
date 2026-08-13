import { Pipe, PipeTransform } from '@angular/core';
import { resolveMediaUrl } from '../../core/utils/media-url.util';

@Pipe({ name: 'mediaUrl' })
export class MediaUrlPipe implements PipeTransform {
  transform(url: string): string {
    return resolveMediaUrl(url);
  }
}
