import { Injectable } from '@angular/core';
import { compressNewsImage } from '../utils/news-image';

@Injectable({ providedIn: 'root' })
export class MediaStorageService {
  prepareNewsImage(file: File): Promise<Uint8Array> {
    return compressNewsImage(file);
  }
}
