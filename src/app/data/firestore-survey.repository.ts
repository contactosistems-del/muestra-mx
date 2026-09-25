import { inject, Injectable } from '@angular/core';
import { collection, deleteDoc, doc, onSnapshot, query, setDoc, where } from 'firebase/firestore';
import { toLocalized } from '../core/i18n/localized';
import type { Survey, SurveyOption } from '../domain/models';
import { FIRESTORE, type SurveyRepository } from '../domain/tokens';

const COLLECTION = 'encuestas';

@Injectable()
export class FirestoreSurveyRepository implements SurveyRepository {
  private readonly db = inject(FIRESTORE);

  watchActive(onChange: (items: Survey[]) => void): () => void {
    return onSnapshot(
      query(collection(this.db, COLLECTION), where('active', '==', true)),
      (snap) => {
        const items = snap.docs
          .map((item) => this.toSurvey(item.id, item.data() as Record<string, unknown>))
          .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
        onChange(items);
      },
      () => onChange([]),
    );
  }

  watchAll(onChange: (items: Survey[]) => void): () => void {
    return onSnapshot(
      collection(this.db, COLLECTION),
      (snap) => {
        const items = snap.docs
          .map((item) => this.toSurvey(item.id, item.data() as Record<string, unknown>))
          .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
        onChange(items);
      },
      () => onChange([]),
    );
  }

  async save(survey: Survey): Promise<void> {
    const { id, ...data } = survey;
    await setDoc(doc(this.db, COLLECTION, id), data, { merge: true });
  }

  async remove(id: string): Promise<void> {
    await deleteDoc(doc(this.db, COLLECTION, id));
  }

  async seed(items: Survey[]): Promise<void> {
    await Promise.all(items.map((item) => this.save({ ...item, updatedAt: Date.now() })));
  }

  private toSurvey(id: string, data: Record<string, unknown>): Survey {
    const rawOptions = Array.isArray(data['options']) ? data['options'] : [];
    const options: SurveyOption[] = rawOptions
      .map((item, index) => {
        if (!item || typeof item !== 'object') return null;
        const row = item as Record<string, unknown>;
        const label = String(row['label'] ?? '').trim();
        if (!label) return null;
        const voteValue = String(row['voteValue'] ?? '').trim();
        const imageUrl = String(row['imageUrl'] ?? '').trim();
        return {
          id: String(row['id'] ?? `opt-${index + 1}`),
          label,
          ...(voteValue ? { voteValue } : {}),
          ...(imageUrl ? { imageUrl } : {}),
        };
      })
      .filter((item): item is SurveyOption => !!item);

    return {
      id,
      active: data['active'] !== false,
      showInNav: data['showInNav'] !== false,
      sortOrder: Number(data['sortOrder']) || 0,
      shortLabel: toLocalized(data['shortLabel'], id),
      city: toLocalized(data['city'], id),
      title: toLocalized(data['title'], id),
      question: toLocalized(data['question'], ''),
      options,
      updatedAt: Number(data['updatedAt']) || 0,
    };
  }
}
