import { Injectable } from '@angular/core';
import type { DeviceContext } from '../../domain/models';
import { readStorage, removeStorage, writeStorage } from '../utils/storage';

@Injectable({ providedIn: 'root' })
export class DeviceService {
  private cached: DeviceContext | null = null;

  fingerprint(): string {
    const nav = window.navigator;
    const screen = window.screen;
    const raw = [nav.userAgent, nav.language, screen.colorDepth, `${screen.width}x${screen.height}`, new Date().getTimezoneOffset()].join('###');
    let hash = 0;
    for (let i = 0; i < raw.length; i += 1) {
      hash = ((hash << 5) - hash) + raw.charCodeAt(i);
      hash |= 0;
    }
    return 'DEV-' + Math.abs(hash).toString(16).toUpperCase();
  }

  hasVoted(surveyId: string): boolean {
    return readStorage(this.voteKey(surveyId) + this.fingerprint()) === 'true';
  }

  markVoted(surveyId: string): void {
    writeStorage(this.voteKey(surveyId) + this.fingerprint(), 'true');
  }

  clearVoted(surveyIds: string[]): void {
    const id = this.fingerprint();
    surveyIds.forEach((surveyId) => removeStorage(this.voteKey(surveyId) + id));
    try {
      const prefix = 'muestra_vote_';
      for (let i = localStorage.length - 1; i >= 0; i -= 1) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix) && key.endsWith(id)) localStorage.removeItem(key);
      }
    } catch {
      // Si el navegador no deja borrar el historial local, seguimos igual.
    }
    this.cached = null;
  }

  private voteKey(surveyId: string): string {
    return `muestra_vote_${surveyId}_`;
  }

  async context(): Promise<DeviceContext> {
    if (this.cached) return this.cached;

    const fingerprint = this.fingerprint();
    const [network, gps] = await Promise.all([this.resolveNetwork(), this.resolveGps()]);

    this.cached = {
      fingerprint,
      ip: network.ip || 'unknown',
      lat: gps.lat ?? network.lat ?? 21.1619,
      lng: gps.lng ?? network.lng ?? -86.8515,
    };
    return this.cached;
  }

  /** Ubicación del GPS del celular o computadora (la más exacta). */
  private resolveGps(): Promise<{ lat?: number; lng?: number }> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({});
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        () => resolve({}),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 30_000 },
      );
    });
  }

  /** Si no hay GPS, estima la zona con la conexión a internet. */
  private async resolveNetwork(): Promise<{ ip: string; lat?: number; lng?: number }> {
    const providers = [() => this.fromIpWho(), () => this.fromIpApiCo()];
    for (const provider of providers) {
      try {
        const result = await provider();
        if (result.ip) return result;
      } catch {
        // Si un servicio falla, se prueba el siguiente.
      }
    }
    return { ip: 'unknown' };
  }

  private async fromIpWho(): Promise<{ ip: string; lat?: number; lng?: number }> {
    const res = await fetch('https://ipwho.is/', { signal: this.timeoutSignal(6000) });
    if (!res.ok) throw new Error('ipwho');
    const data = (await res.json()) as {
      success?: boolean;
      ip?: string;
      latitude?: number;
      longitude?: number;
    };
    if (data.success === false || !data.ip) throw new Error('ipwho');
    return {
      ip: data.ip,
      lat: Number(data.latitude) || undefined,
      lng: Number(data.longitude) || undefined,
    };
  }

  private async fromIpApiCo(): Promise<{ ip: string; lat?: number; lng?: number }> {
    const res = await fetch('https://ipapi.co/json/', { signal: this.timeoutSignal(6000) });
    if (!res.ok) throw new Error('ipapi');
    const data = (await res.json()) as { ip?: string; latitude?: number; longitude?: number; error?: boolean };
    if (data.error || !data.ip) throw new Error('ipapi');
    return {
      ip: data.ip,
      lat: Number(data.latitude) || undefined,
      lng: Number(data.longitude) || undefined,
    };
  }

  private timeoutSignal(ms: number): AbortSignal {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), ms);
    return controller.signal;
  }
}
