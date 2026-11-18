import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import type { CircleMarker, Map as LeafletMapType } from 'leaflet';
import type { SurveyGeoMap } from '../../domain/models';
import { SurveyService } from '../../core/services/survey.service';
import { cityGeo } from '../../shared/city-geo';
import { partyColor } from '../../shared/party';

type LeafletNS = typeof import('leaflet');

const PALETTE = ['#E63946', '#1D8FE1', '#06A77D', '#F4A259', '#9B5DE5', '#F15BB5', '#00BBF9', '#FEE440'];
const DEFAULT_CITY = { lat: 20.6296, lng: -87.0739, zoom: 13 };
/** Media zona (~250 m): los puntos se reparten dentro de su zona, nunca en el lugar exacto del voto. */
const HALF_CELL = 0.0025;

/** Número pseudoaleatorio estable (los puntos no "brincan" cada vez que entra un voto). */
function seeded(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return ((h >>> 0) % 10000) / 10000;
}

/**
 * Mapa privado para compartir con un candidato: solo puntos por zona, sin números.
 * No está enlazado desde el sitio; se comparte con el enlace /seguimiento/:id.
 */
@Component({
  selector: 'app-candidate-map-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="cm">
      <header class="cm-head">
        <div>
          <p class="cm-city">{{ cityName() }}</p>
          <h1>{{ title() }}</h1>
        </div>
        <span class="cm-live"><i></i> En vivo</span>
      </header>
      <div class="cm-map" #host aria-label="Mapa de votación"></div>
      <footer class="cm-legend">
        @for (item of legend(); track item.label) {
          <span><i [style.background]="item.color"></i>{{ item.label }}</span>
        }
        @if (!loading() && !legend().length) {
          <span class="cm-empty">Aún no hay votos con ubicación.</span>
        }
      </footer>
    </div>
  `,
  styles: `
    :host { display: block; }
    .cm { position: fixed; inset: 0; display: flex; flex-direction: column; background: #0b1220; color: #f1f5f9;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
    .cm-head { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: .8rem 1.1rem; }
    .cm-city { margin: 0; font-size: .78rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: #94a3b8; }
    h1 { margin: .1rem 0 0; font-size: clamp(1.05rem, 3vw, 1.5rem); line-height: 1.2; }
    .cm-live { display: inline-flex; align-items: center; gap: .4rem; font-size: .75rem; font-weight: 900; text-transform: uppercase;
               color: #22c55e; white-space: nowrap; }
    .cm-live i { width: 8px; height: 8px; border-radius: 50%; background: currentColor; animation: cm-pulse 1.4s infinite; }
    @keyframes cm-pulse { 50% { opacity: .3; } }
    .cm-map { flex: 1; min-height: 0; background: #1f2937; }
    .cm-legend { display: flex; flex-wrap: wrap; gap: .5rem 1.1rem; padding: .75rem 1.1rem calc(.75rem + env(safe-area-inset-bottom)); font-size: .88rem; font-weight: 700; }
    .cm-legend span { display: inline-flex; align-items: center; gap: .45rem; }
    .cm-legend i { width: 12px; height: 12px; border-radius: 50%; box-shadow: 0 0 0 2px rgba(255,255,255,.25); }
    .cm-empty { color: #94a3b8; font-weight: 600; }
  `,
})
export class CandidateMapPage {
  private readonly surveys = inject(SurveyService);
  private readonly host = viewChild.required<ElementRef<HTMLDivElement>>('host');
  private readonly id = toSignal(inject(ActivatedRoute).paramMap.pipe(map((p) => p.get('id'))), { initialValue: null });
  private readonly geo = signal<SurveyGeoMap | null>(null);
  readonly loading = computed(() => this.geo() === null);
  private L?: LeafletNS;
  private map?: LeafletMapType;
  private dots: CircleMarker[] = [];
  private framed = false;

  private readonly survey = computed(() => {
    const id = this.id();
    return id ? this.surveys.surveyById(id) : undefined;
  });
  readonly title = computed(() => this.survey()?.title.es ?? 'Seguimiento de votación');
  readonly cityName = computed(() => this.survey()?.city.es ?? '');
  private readonly city = computed(() => {
    const s = this.survey();
    return (s && cityGeo(s.city.es, s.title.es)) || DEFAULT_CITY;
  });

  private readonly colors = computed(() => {
    const out = new Map<string, { label: string; color: string }>();
    (this.survey()?.options ?? []).forEach((opt, i) =>
      out.set(opt.id, { label: opt.label, color: opt.party ? partyColor(opt.party) : PALETTE[i % PALETTE.length]! }),
    );
    return out;
  });
  readonly legend = computed(() => {
    const zones = this.geo()?.zones ?? [];
    const present = new Set(zones.flatMap((z) => Object.keys(z.counts)));
    return [...this.colors().entries()].filter(([id]) => present.has(id)).map(([, v]) => v);
  });

  constructor() {
    // Que los buscadores no indexen este enlace.
    const robots = document.createElement('meta');
    robots.name = 'robots';
    robots.content = 'noindex, nofollow';
    document.head.appendChild(robots);
    inject(DestroyRef).onDestroy(() => {
      robots.remove();
      this.map?.remove();
    });

    effect((onCleanup) => {
      const id = this.id();
      if (!id) return;
      const stop = this.surveys.watchMap(id, (data) => this.geo.set(data));
      onCleanup(stop);
    });
    effect(() => {
      this.geo();
      this.colors();
      if (this.map) void this.draw();
    });
    afterNextRender(() => void this.init());
  }

  private async leaflet(): Promise<LeafletNS> {
    if (this.L) return this.L;
    const mod = await import('leaflet');
    this.L = (mod as { default?: LeafletNS }).default ?? (mod as LeafletNS);
    return this.L;
  }

  private async init(): Promise<void> {
    const L = await this.leaflet();
    const { lat, lng, zoom } = this.city();
    this.map = L.map(this.host().nativeElement, { preferCanvas: true, zoomControl: true }).setView([lat, lng], zoom);
    const esri = (service: string) =>
      L.tileLayer(`https://server.arcgisonline.com/ArcGIS/rest/services/${service}/MapServer/tile/{z}/{y}/{x}`, {
        attribution: 'Tiles &copy; Esri',
        maxZoom: 19,
      });
    const base = { Oscuro: esri('Canvas/World_Dark_Gray_Base'), Mapa: esri('World_Street_Map'), 'Satélite': esri('World_Imagery') };
    base.Oscuro.addTo(this.map);
    L.control.layers(base, undefined, { position: 'topright' }).addTo(this.map);
    new ResizeObserver(() => this.map?.invalidateSize({ animate: false })).observe(this.host().nativeElement);
    await this.draw();
  }

  /** Un punto por voto, repartido dentro de su zona y pintado del color de su opción. */
  private async draw(): Promise<void> {
    if (!this.map) return;
    const L = await this.leaflet();
    this.dots.forEach((d) => d.remove());
    this.dots = [];
    const colors = this.colors();
    const points: Array<[number, number]> = [];
    for (const zone of this.geo()?.zones ?? []) {
      for (const [optId, n] of Object.entries(zone.counts)) {
        const color = colors.get(optId)?.color ?? '#BE3455';
        for (let k = 0; k < n; k++) {
          const seed = `${zone.lat.toFixed(4)}|${zone.lng.toFixed(4)}|${optId}|${k}`;
          const p: [number, number] = [
            zone.lat + (seeded(seed + 'a') * 2 - 1) * HALF_CELL,
            zone.lng + (seeded(seed + 'b') * 2 - 1) * HALF_CELL,
          ];
          points.push(p);
          this.dots.push(
            L.circleMarker(p, { radius: 5, stroke: true, color: '#0b1220', weight: 1, fillColor: color, fillOpacity: 0.9, interactive: false }).addTo(this.map),
          );
        }
      }
    }
    // Encuadra una sola vez sobre la ciudad de la encuesta (no salta cuando llegan votos nuevos).
    if (!this.framed && points.length) {
      this.framed = true;
      const { lat, lng } = this.city();
      const near = points.filter(([a, b]) => Math.abs(a - lat) < 0.12 && Math.abs(b - lng) < 0.12);
      const use = near.length ? near : points;
      this.map.fitBounds(L.latLngBounds(use), { padding: [30, 30], maxZoom: 15 });
    }
  }
}
