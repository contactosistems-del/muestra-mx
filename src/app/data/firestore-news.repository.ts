import { inject, Injectable } from '@angular/core';
import {
  addDoc,
  Bytes,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { NEWS_SEEDS } from './catalog';
import { toLocalized } from '../core/i18n/localized';
import { jpegToDataUrl } from '../core/utils/news-image';
import type { NewsDraft, NewsItem } from '../domain/models';
import { FIRESTORE, type NewsRepository } from '../domain/tokens';

const COLLECTION = 'noticias';

@Injectable()
export class FirestoreNewsRepository implements NewsRepository {
  private readonly db = inject(FIRESTORE);
  private seeded = false;

  watch(onChange: (items: NewsItem[]) => void): () => void {
    const ref = collection(this.db, COLLECTION);
    const q = query(ref, orderBy('publishedAt', 'desc'));
    return onSnapshot(
      q,
      async (snap) => {
        if (snap.empty) {
          if (!this.seeded) {
            this.seeded = true;
            try {
              await this.seedIfEmpty();
              return;
            } catch {
              onChange([]);
              return;
            }
          }
          onChange([]);
          return;
        }
        onChange(snap.docs.map((item) => this.toNews(item.id, item.data())));
      },
      () => onChange([]),
    );
  }

  async add(draft: NewsDraft): Promise<string> {
    const imageUrl = draft.imageBytes?.length ? jpegToDataUrl(draft.imageBytes) : draft.imageUrl;
    const created = await addDoc(collection(this.db, COLLECTION), {
      categoryId: draft.categoryId,
      title: { es: String(draft.title.es), en: String(draft.title.en || draft.title.es) },
      body: { es: String(draft.body.es), en: String(draft.body.en || draft.body.es) },
      imageUrl,
      publishedAt: serverTimestamp(),
    });
    return created.id;
  }

  async remove(id: string): Promise<void> {
    await deleteDoc(doc(this.db, COLLECTION, id));
  }

  private async seedIfEmpty(): Promise<void> {
    const existing = await getDocs(collection(this.db, COLLECTION));
    if (!existing.empty) return;
    await Promise.all(NEWS_SEEDS.map((draft) => this.add(draft)));
  }

  private toNews(id: string, data: Record<string, unknown>): NewsItem {
    const published = data['publishedAt'];
    return {
      id,
      categoryId: String(data['categoryId'] ?? 'NOTICIAS'),
      title: toLocalized(data['title']),
      body: toLocalized(data['body']),
      imageUrl: this.readImage(data),
      publishedAt: published instanceof Timestamp ? published.toMillis() : Date.now(),
    };
  }

  private readImage(data: Record<string, unknown>): string {
    const stored = data['imageBytes'];
    if (stored instanceof Bytes) return jpegToDataUrl(stored.toUint8Array());
    return String(data['imageUrl'] ?? '');
  }
}
