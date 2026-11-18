import { inject, Injectable } from '@angular/core';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import type { GeoZone, Survey, SurveyGeoMap, VoteRecord } from '../domain/models';
import { FIRESTORE, type SurveyResultCounts, type VoteRepository } from '../domain/tokens';
import { matchSurveyOption, enrichOptionsWithVoteAliases } from '../core/utils/survey-option';

const RESULTS = 'resultados_encuestas';
const VOTES = 'votos';
const DEVICE_VOTES = 'voto_dispositivo';
/** El mapa público vive junto a los resultados (lectura pública) en `resultados_encuestas/{id}__mapa`. */
const MAP_SUFFIX = '__mapa';
/** Tamaño de cada zona del mapa público, en grados (~500 m). */
const CELL = 0.005;
/** Ubicación por defecto cuando no hay GPS ni IP (centro de Cancún): no se dibuja en el mapa. */
const FALLBACK = { lat: 21.1619, lng: -86.8515 };

type Cells = Record<string, Record<string, number>>;

/** Clave de la zona (cuadrícula) donde cae un voto, o null si no tiene ubicación real. */
function cellKey(lat: unknown, lng: unknown): string | null {
  const la = Number(lat);
  const ln = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return null;
  if (Math.abs(la) > 90 || Math.abs(ln) > 180 || (la === 0 && ln === 0)) return null;
  if (Math.abs(la - FALLBACK.lat) < 1e-6 && Math.abs(ln - FALLBACK.lng) < 1e-6) return null;
  return `${Math.floor(la / CELL)}_${Math.floor(ln / CELL)}`;
}

function readCells(raw: unknown): Cells {
  const cells: Cells = {};
  Object.entries((raw as Record<string, unknown>) || {}).forEach(([key, value]) => {
    const counts: Record<string, number> = {};
    Object.entries((value as Record<string, unknown>) || {}).forEach(([opt, n]) => {
      const num = Number(n) || 0;
      if (num > 0) counts[opt] = num;
    });
    cells[key] = counts;
  });
  return cells;
}

@Injectable()
export class FirestoreVoteRepository implements VoteRepository {
  private readonly db = inject(FIRESTORE);

  async add(survey: Survey, vote: VoteRecord): Promise<void> {
    const voteRef = doc(collection(this.db, VOTES));
    const resultRef = doc(this.db, RESULTS, survey.id);
    const deviceRef = doc(this.db, DEVICE_VOTES, this.deviceKey(survey.id, vote.deviceId));
    const mapRef = doc(this.db, RESULTS, survey.id + MAP_SUFFIX);
    const zoneKey = cellKey(vote.lat, vote.lng);
    const matched = matchSurveyOption(survey, vote.opcion);
    const optionKey = matched?.id ?? vote.opcion;
    const stored: VoteRecord = { ...vote, opcion: optionKey };

    await runTransaction(this.db, async (tx) => {
      const resultSnap = await tx.get(resultRef);
      const mapSnap = zoneKey ? await tx.get(mapRef) : null;
      const prev = resultSnap.exists() ? (resultSnap.data() as Record<string, unknown>) : {};
      const prevCounts = (prev['counts'] as Record<string, unknown>) || {};
      const counts: Record<string, number> = {};
      Object.entries(prevCounts).forEach(([key, value]) => {
        counts[key] = Number(value) || 0;
      });
      counts[optionKey] = (counts[optionKey] ?? 0) + 1;
      const total = Object.values(counts).reduce((sum, n) => sum + n, 0);

      tx.set(voteRef, stored);
      tx.set(deviceRef, { surveyId: survey.id, deviceId: vote.deviceId, at: vote.timestamp });
      tx.set(resultRef, {
        surveyId: survey.id,
        total,
        counts,
        updatedAt: Date.now(),
      });
      if (zoneKey) {
        const cells = readCells(mapSnap?.exists() ? mapSnap.data()['celdas'] : {});
        const cell = (cells[zoneKey] ||= {});
        cell[optionKey] = (cell[optionKey] ?? 0) + 1;
        tx.set(mapRef, { surveyId: survey.id, celdas: cells, updatedAt: Date.now() });
      }
    });
  }

  async list(survey: Survey): Promise<VoteRecord[]> {
    const primary = await getDocs(query(collection(this.db, VOTES), where('encuestaId', '==', survey.id)));
    return primary.docs.map((item) => this.toVote(survey.id, item.data() as Record<string, unknown>));
  }

  /**
   * Reparte los votos de una opción entre varias (mitad y mitad, en orden de llegada).
   * Se usa para corregir encuestas donde dos candidatos quedaron con el mismo id.
   */
  async splitVotes(surveyId: string, groups: Map<string, string[]>): Promise<void> {
    const snap = await getDocs(query(collection(this.db, VOTES), where('encuestaId', '==', surveyId)));
    const updates: Array<{ id: string; opcion: string }> = [];
    groups.forEach((ids, originalId) => {
      const docs = snap.docs
        .filter((d) => String(d.data()['opcion'] ?? '') === originalId)
        .sort((a, b) => (Number(a.data()['timestamp']) || 0) - (Number(b.data()['timestamp']) || 0));
      docs.forEach((d, i) => {
        const target = ids[i % ids.length]!;
        if (target !== originalId) updates.push({ id: d.id, opcion: target });
      });
    });
    for (let i = 0; i < updates.length; i += 400) {
      const batch = writeBatch(this.db);
      updates.slice(i, i + 400).forEach((u) => batch.update(doc(this.db, VOTES, u.id), { opcion: u.opcion }));
      await batch.commit();
    }
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

  async rebuildResults(survey: Survey, votes: VoteRecord[], previous?: Survey | null): Promise<void> {
    const voteNames = votes.map((vote) => vote.opcion);
    const enriched = {
      ...survey,
      options: enrichOptionsWithVoteAliases(survey, voteNames, previous),
    };
    const counts: Record<string, number> = {};
    const cells: Cells = {};
    enriched.options.forEach((opt) => {
      counts[opt.id] = 0;
    });
    votes.forEach((vote) => {
      const opt = matchSurveyOption(enriched, vote.opcion, previous);
      if (!opt) return;
      counts[opt.id] = (counts[opt.id] ?? 0) + 1;
      const key = cellKey(vote.lat, vote.lng);
      if (key) {
        const cell = (cells[key] ||= {});
        cell[opt.id] = (cell[opt.id] ?? 0) + 1;
      }
    });
    const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
    await setDoc(doc(this.db, RESULTS, survey.id), {
      surveyId: survey.id,
      total,
      counts,
      updatedAt: Date.now(),
    });
    await setDoc(doc(this.db, RESULTS, survey.id + MAP_SUFFIX), {
      surveyId: survey.id,
      celdas: cells,
      updatedAt: Date.now(),
    });
  }

  watchMap(surveyId: string, onChange: (map: SurveyGeoMap) => void): () => void {
    const empty: SurveyGeoMap = { surveyId, zones: [], updatedAt: 0 };
    return onSnapshot(
      doc(this.db, RESULTS, surveyId + MAP_SUFFIX),
      (snap) => {
        if (!snap.exists()) {
          onChange(empty);
          return;
        }
        const data = snap.data() as Record<string, unknown>;
        const zones: GeoZone[] = Object.entries(readCells(data['celdas']))
          .map(([key, counts]) => {
            const [i, j] = key.split('_').map(Number);
            const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
            // Centro de la zona: nunca la ubicación exacta de quien votó.
            return { lat: (i! + 0.5) * CELL, lng: (j! + 0.5) * CELL, total, counts };
          })
          .filter((zone) => zone.total > 0 && Number.isFinite(zone.lat) && Number.isFinite(zone.lng));
        onChange({ surveyId, zones, updatedAt: Number(data['updatedAt']) || 0 });
      },
      () => onChange(empty),
    );
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
