import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import type { Survey, SurveyGeoMap } from '../../../domain/models';
import { I18nService } from '../../../core/services/i18n.service';
import { SurveyService } from '../../../core/services/survey.service';
import { LeafletMap, type MapMarker } from '../../../shared/leaflet-map/leaflet-map';
import { cityGeo } from '../../../shared/city-geo';
import { partyColor } from '../../../shared/party';

/** Colores para opciones sin partido. */
const PALETTE = ['#BE3455', '#118AB2', '#06A77D', '#F4A259', '#7B2CBF', '#EF476F', '#3D5A80', '#8D99AE'];
/** Ciudad por defecto del mapa. */
const DEFAULT_CITY = { lat: 20.6296, lng: -87.0739, zoom: 13 };
/** Radio (en grados, ~13 km) para "solo esta ciudad". */
const CITY_RADIUS = 0.12;

@Component({
  selector: 'app-vote-map-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LeafletMap],
  template: `
    <article class="article-sheet vm-page">
      @if (survey(); as s) {
        <header class="vm-head">
          <span class="vm-badge"><span class="vm-dot"></span> {{ t('En vivo', 'Live') }}</span>
          <p class="vm-city"><i class="fa-solid fa-location-dot"></i> {{ i18n.tx(s.city) }}</p>
          <h1>{{ t('¿Cómo va la votación?', 'How is the vote going?') }}</h1>
          <p class="vm-q">{{ i18n.tx(s.question) }}</p>
        </header>

        @if (surveys.surveys().length > 1) {
          <nav class="vm-chips" [attr.aria-label]="t('Encuestas', 'Polls')">
            @for (item of surveys.surveys(); track item.id) {
              <a [routerLink]="['/mapa', item.id]" [class.on]="item.id === s.id">{{ i18n.tx(item.shortLabel) }}</a>
            }
          </nav>
        }

        <div class="vm-grid">
          <section class="vm-side">
            <p class="vm-total"><strong>{{ total() }}</strong> {{ t('votos', 'votes') }}</p>
            @for (row of rows(); track row.label; let i = $index) {
              <div class="vm-row">
                <div class="vm-meta">
                  <span><i class="vm-sw" [style.background]="row.color"></i>{{ row.label }}
                    @if (i === 0 && row.count > 0) { <i class="fa-solid fa-crown vm-crown" aria-hidden="true"></i> }
                  </span>
                  <strong>{{ row.percent }}%</strong>
                </div>
                <div class="vm-track"><i [style.width.%]="row.percent" [style.background]="row.color"></i></div>
              </div>
            }

            <label class="vm-only">
              <input type="checkbox" [checked]="onlyCity()" (change)="onlyCity.set(!onlyCity())" />
              {{ t('Solo', 'Only') }} {{ i18n.tx(s.city) }}
            </label>

            <a class="vm-vote" [routerLink]="['/encuesta', s.id]">{{ t('Votar en esta encuesta', 'Vote in this poll') }} <i class="fa-solid fa-arrow-right"></i></a>
          </section>

          <section class="vm-map-wrap">
            <div class="map-box vm-map">
              @for (mapId of [s.id]; track mapId) {
                <app-leaflet-map
                  [markers]="markers()"
                  [center]="center()"
                  [zoom]="zoom()"
                  [fitMaxZoom]="14"
                  [precision]="3"
                  [groupColors]="colorByLabel()"
                />
              }
            </div>
            <p class="vm-note">
              @if (markers().length) {
                {{ t('Cada círculo es una zona de unos 500 m. Su color es la opción que va ganando ahí y el número, los votos de esa zona. Nunca se muestra la ubicación exacta de quien votó.',
                     'Each circle is an area of about 500 m. Its color is the option leading there and the number is the votes in that area. The exact location of a voter is never shown.') }}
              } @else {
                {{ t('Todavía no hay votos con ubicación para mostrar en el mapa.', 'There are no votes with a location to show yet.') }}
              }
            </p>
          </section>
        </div>
      } @else {
        <p class="vm-empty">{{ t('Cargando encuestas…', 'Loading polls…') }}</p>
      }
    </article>
  `,
  styles: `
    .vm-page { max-width: 1180px; }
    .vm-head { text-align: center; margin-bottom: 1.2rem; }
    .vm-badge { display: inline-flex; align-items: center; gap: .45rem; padding: .3rem .8rem; border-radius: 999px; background: rgba(190, 52, 85, .12); color: var(--brand-red, #BE3455); font-weight: 900; font-size: .75rem; text-transform: uppercase; letter-spacing: .06em; }
    .vm-dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; animation: vm-pulse 1.4s infinite; }
    @keyframes vm-pulse { 50% { opacity: .3; } }
    .vm-city { margin: .8rem 0 .2rem; font-weight: 800; opacity: .75; }
    h1 { margin: .2rem 0 .4rem; font-size: clamp(1.6rem, 4vw, 2.4rem); }
    .vm-q { margin: 0; font-size: 1.05rem; opacity: .85; }
    .vm-chips { display: flex; flex-wrap: wrap; gap: .5rem; justify-content: center; margin: 0 0 1.4rem; }
    .vm-chips a { padding: .45rem .9rem; border-radius: 999px; border: 1px solid var(--border-color, #ddd); font-weight: 800; font-size: .82rem; text-decoration: none; color: inherit; }
    .vm-chips a.on { background: var(--brand-red, #BE3455); border-color: var(--brand-red, #BE3455); color: #fff; }
    .vm-grid { display: grid; grid-template-columns: 320px 1fr; gap: 1.4rem; align-items: start; }
    .vm-total { margin: 0 0 .8rem; font-size: .95rem; opacity: .85; }
    .vm-total strong { font-size: 1.8rem; opacity: 1; margin-right: .25rem; }
    .vm-row { margin: .7rem 0; }
    .vm-meta { display: flex; justify-content: space-between; gap: .6rem; font-weight: 700; font-size: .92rem; margin-bottom: .3rem; }
    .vm-sw { display: inline-block; width: 11px; height: 11px; border-radius: 50%; margin-right: .45rem; vertical-align: middle; }
    .vm-crown { color: #E5B800; margin-left: .3rem; }
    .vm-track { height: 10px; border-radius: 6px; background: rgba(157, 161, 159, .25); overflow: hidden; }
    .vm-track i { display: block; height: 100%; border-radius: 6px; transition: width .6s ease; }
    .vm-only { display: flex; align-items: center; gap: .5rem; margin: 1.2rem 0; font-weight: 700; font-size: .9rem; cursor: pointer; }
    .vm-vote { display: inline-flex; align-items: center; gap: .45rem; padding: .8rem 1.2rem; border-radius: 12px; background: #111; color: #fff; font-weight: 900; font-size: .85rem; text-transform: uppercase; letter-spacing: .03em; text-decoration: none; }
    .vm-map-wrap { min-width: 0; }
    .vm-map { position: relative; height: 560px; }
    .vm-note { font-size: .8rem; opacity: .7; margin: .7rem 0 0; line-height: 1.45; }
    .vm-empty { text-align: center; opacity: .7; }
    @media (max-width: 860px) {
      .vm-grid { grid-template-columns: 1fr; }
      .vm-map-wrap { order: -1; }
      .vm-map { height: 420px; }
    }
  `,
})
export class VoteMapPage {
  readonly i18n = inject(I18nService);
  readonly surveys = inject(SurveyService);
  readonly onlyCity = signal(true);
  private readonly geo = signal<SurveyGeoMap | null>(null);
  private readonly id = toSignal(inject(ActivatedRoute).paramMap.pipe(map((p) => p.get('id'))), { initialValue: null });

  /** La encuesta pedida; sin id, la primera de Playa del Carmen (o la primera activa). */
  readonly survey = computed<Survey | undefined>(() => {
    const id = this.id();
    if (id) return this.surveys.surveyById(id);
    const list = this.surveys.surveys();
    return list.find((s) => /playa del carmen|solidaridad/i.test(`${s.city.es} ${s.title.es}`)) ?? list[0];
  });

  private readonly city = computed(() => {
    const s = this.survey();
    return (s && cityGeo(s.city.es, s.city.en, s.title.es)) || DEFAULT_CITY;
  });
  readonly center = computed<[number, number]>(() => [this.city().lat, this.city().lng]);
  readonly zoom = computed(() => this.city().zoom);

  /** Color por id de opción: el del partido si tiene, si no uno de la paleta. */
  private readonly colorById = computed(() => {
    const out: Record<string, string> = {};
    (this.survey()?.options ?? []).forEach((opt, i) => {
      out[opt.id] = opt.party ? partyColor(opt.party) : PALETTE[i % PALETTE.length]!;
    });
    return out;
  });
  readonly colorByLabel = computed(() => {
    const out: Record<string, string> = {};
    const byId = this.colorById();
    (this.survey()?.options ?? []).forEach((opt) => (out[opt.label] = byId[opt.id]!));
    return out;
  });

  private readonly result = computed(() => {
    const s = this.survey();
    return s ? this.surveys.resultById(s.id) : undefined;
  });
  readonly total = computed(() => this.result()?.total ?? 0);
  readonly rows = computed(() => {
    const colors = this.colorByLabel();
    return (this.result()?.options ?? []).map((o) => ({ ...o, color: colors[o.label] ?? '#BE3455' }));
  });

  /** Una marca por voto, puesta en el centro de su zona, para que el mapa cuente y coloree. */
  readonly markers = computed<MapMarker[]>(() => {
    const s = this.survey();
    const zones = this.geo()?.zones ?? [];
    if (!s) return [];
    const names = new Map(s.options.map((o) => [o.id, o.label] as [string, string]));
    const { lat, lng } = this.city();
    const only = this.onlyCity();
    const out: MapMarker[] = [];
    for (const z of zones) {
      if (only && (Math.abs(z.lat - lat) > CITY_RADIUS || Math.abs(z.lng - lng) > CITY_RADIUS)) continue;
      for (const [optId, n] of Object.entries(z.counts)) {
        const label = names.get(optId) ?? optId;
        for (let k = 0; k < n; k++) out.push({ lat: z.lat, lng: z.lng, label, group: label });
      }
    }
    return out;
  });

  constructor() {
    effect((onCleanup) => {
      const id = this.survey()?.id;
      this.geo.set(null);
      if (!id) return;
      const stop = this.surveys.watchMap(id, (data) => this.geo.set(data));
      onCleanup(stop);
    });
  }

  t(es: string, en: string): string {
    return this.i18n.lang() === 'en' ? en : es;
  }
}
