import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { loc } from '../i18n/localized';
import type { NewsItem } from '../../domain/models';
import { NEWS_REPOSITORY } from '../../domain/tokens';
import { MediaStorageService } from './media-storage.service';
import { TranslationService } from './translation.service';

@Injectable({ providedIn: 'root' })
export class NewsService {
  private readonly repo = inject(NEWS_REPOSITORY);
  private readonly media = inject(MediaStorageService);
  private readonly translator = inject(TranslationService);
  private readonly router = inject(Router);
  readonly items = signal<NewsItem[]>([]);
  readonly loading = signal(true);
  readonly editorOpen = signal(false);
  readonly busy = signal(false);

  constructor() {
    const stop = this.repo.watch((items) => {
      this.items.set(items);
      this.loading.set(false);
    });
    inject(DestroyRef).onDestroy(stop);
  }

  async publish(input: { categoryId: string; title: string; body: string; image: File }): Promise<void> {
    this.busy.set(true);
    try {
      const title = input.title.trim();
      const body = input.body.trim();
      const [imageBytes, titleEn, bodyEn] = await Promise.all([
        this.media.prepareNewsImage(input.image),
        this.translator.toEnglish(title),
        this.translator.toEnglish(body),
      ]);
      const id = await this.repo.add({
        categoryId: input.categoryId,
        title: loc(title, titleEn),
        body: loc(body, bodyEn),
        imageUrl: '',
        imageBytes,
      });
      this.editorOpen.set(false);
      await this.router.navigateByUrl(`/noticias/${id}`);
    } finally {
      this.busy.set(false);
    }
  }

  byId(id: string): NewsItem | undefined {
    return this.items().find((item) => item.id === id);
  }

  async remove(id: string): Promise<void> {
    if (!id) return;
    await this.repo.remove(id);
  }
}
