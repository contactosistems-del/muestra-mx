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
  readonly editingId = signal<string | null>(null);
  readonly busy = signal(false);

  constructor() {
    const stop = this.repo.watch((items) => {
      this.items.set(items);
      this.loading.set(false);
    });
    inject(DestroyRef).onDestroy(stop);
  }

  openCreate(): void {
    this.editingId.set(null);
    this.editorOpen.set(true);
  }

  openEdit(id: string): void {
    if (!id || !this.byId(id)) return;
    this.editingId.set(id);
    this.editorOpen.set(true);
  }

  closeEditor(): void {
    this.editorOpen.set(false);
    this.editingId.set(null);
  }

  async publish(input: {
    categoryId: string;
    title: string;
    body: string;
    image: File | null;
    existingImageUrl?: string;
  }): Promise<void> {
    this.busy.set(true);
    try {
      const title = input.title.trim();
      const body = input.body.trim();
      const editId = this.editingId();
      const [titleEn, bodyEn] = await Promise.all([
        this.translator.toEnglish(title),
        this.translator.toEnglish(body),
      ]);
      const imageBytes = input.image ? await this.media.prepareNewsImage(input.image) : undefined;
      const draft = {
        categoryId: input.categoryId,
        title: loc(title, titleEn),
        body: loc(body, bodyEn),
        imageUrl: imageBytes ? '' : (input.existingImageUrl ?? ''),
        imageBytes,
      };

      if (editId) {
        if (!draft.imageUrl && !draft.imageBytes?.length) {
          throw new Error('image-required');
        }
        await this.repo.update(editId, draft);
        this.closeEditor();
        await this.router.navigateByUrl(`/noticias/${editId}`);
        return;
      }

      if (!input.image) throw new Error('image-required');
      const id = await this.repo.add(draft);
      this.closeEditor();
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
