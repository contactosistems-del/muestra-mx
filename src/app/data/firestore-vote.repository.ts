import { inject, Injectable } from '@angular/core';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  query,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import type { Survey, VoteRecord } from '../domain/models';
import { FIRESTORE, type SurveyResultCounts, type VoteRepository } from '../domain/tokens';

const RESULTS = 'resultados_encuestas';
const VOTES = 'votos';
const DEVICE_VOTES = 'voto_dispositivo';

@Injectable()
export class FirestoreVoteRepository implements VoteRepository {
  private readonly db = inject(FIRESTORE);

  async add(survey: Survey, vote: VoteRecord): Promise<void> {
    const batch = writeBatch(this.db);
    const voteRef = doc(collection(this.db, VOTES));
    const resultRef = doc(this.db, RESULTS, survey.id);
    const deviceRef = doc(this.db, DEVICE_VOTES, this.deviceKey(survey.id, vote.deviceId));

    batch.set(voteRef, vote);
    batch.set(deviceRef, { surveyId: survey.id, deviceId: vote.deviceId, at: vote.timestamp });
    batch.set(
      resultRef,
      {
        surveyId: survey.id,
        total: increment(1),
        [`counts.${vote.opcion}`]: increment(1),
        updatedAt: Date.now(),
      },
      { merge: true },
    );
    await batch.commit();
  }

  async list(survey: Survey): Promise<VoteRecord[]> {
    const primary = await getDocs(query(collection(this.db, VOTES), where('encuestaId', '==', survey.id)));
    return primary.docs.map((item) => this.toVote(survey.id, item.data() as Record<string, unknown>));
  }

  async hasDeviceVote(survey: Survey, deviceId: string): Promise<boolean> {
    const snap = await getDoc(doc(this.db, DEVICE_VOTES, this.deviceKey(survey.id, deviceId)));
    return snap.exists();
  }

  async clearDeviceVotes(deviceId: string, surveyIds: string[]): Promise<void> {
    await Promise.all(
      surveyIds.map((surveyId) => deleteDoc(doc(this.db, DEVICE_VOTES, this.deviceKey(surveyId, deviceId)))),
    );
  }

  watchResults(survey: Survey, onChange: (counts: SurveyResultCounts) => void): () => void {
    return onSnapshot(
      doc(this.db, RESULTS, survey.id),
      (snap) => {
        if (!snap.exists()) {
          onChange({ surveyId: survey.id, total: 0, counts: {} });
          return;
        }
        const data = snap.data() as Record<string, unknown>;
        const rawCounts = (data['counts'] as Record<string, unknown>) || {};
        const counts: Record<string, number> = {};
        Object.entries(rawCounts).forEach(([key, value]) => {
          counts[key] = Number(value) || 0;
        });
        onChange({
          surveyId: survey.id,
          total: Number(data['total']) || Object.values(counts).reduce((sum, n) => sum + n, 0),
          counts,
        });
      },
      () => onChange({ surveyId: survey.id, total: 0, counts: {} }),
    );
  }

  async rebuildResults(survey: Survey, votes: VoteRecord[]): Promise<void> {
    const counts: Record<string, number> = {};
    survey.options.forEach((opt) => {
      counts[opt.voteValue ?? opt.label] = 0;
    });
    votes.forEach((vote) => {
      const key = vote.opcion || '—';
      counts[key] = (counts[key] ?? 0) + 1;
    });
    await setDoc(doc(this.db, RESULTS, survey.id), {
      surveyId: survey.id,
      total: votes.length,
      counts,
      updatedAt: Date.now(),
    });
  }

  private deviceKey(surveyId: string, deviceId: string): string {
    return `${surveyId}__${deviceId}`.replace(/[^\w.-]+/g, '_');
  }

  private toVote(encuestaId: string, data: Record<string, unknown>): VoteRecord {
    return {
      encuestaId,
      fecha: String(data['fecha'] ?? ''),
      opcion: String(data['opcion'] ?? ''),
      ip: String(data['ip'] ?? ''),
      deviceId: String(data['deviceId'] ?? ''),
      zona: String(data['zona'] ?? ''),
      lat: Number(data['lat']) || 0,
      lng: Number(data['lng']) || 0,
      timestamp: Number(data['timestamp']) || 0,
    };
  }
}
