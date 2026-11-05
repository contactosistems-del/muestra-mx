import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import type { CircleMarker, Map as LeafletMapType } from 'leaflet';
import { I18nService } from '../../../core/services/i18n.service';
import {
  MX_CENSUS_2020_TOTAL,
  MX_POPULATION,
  MX_STATES,
  populationAt,
  startOfMxDay,
  startOfMxYear,
  YEAR_MS,
} from '../../../data/mexico-population';

type LeafletNS = typeof import('leaflet');

const BOY = '#0EA5E9';
const GIRL = '#BE3455';
/** Milisegundos promedio entre un nacimiento y otro en todo el país. */
const MS_PER_BIRTH = YEAR_MS / MX_POPULATION.birthsPerYear;

interface BirthEvent {
  id: number;
  state: string;
  boy: boolean;
}

@Component({
  selector: 'app-population-clock',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="pop" [attr.lang]="i18n.lang()" aria-labelledby="pop-title">
      <div class="results-head">
        <h3 id="pop-title"><span class="live-dot" aria-hidden="true"></span>{{ i18n.t('popTitle') }}</h3>
      </div>

      <div class="pop-grid">
        <div class="pop-stats">
          <div class="stat stat-total">
            <span class="label">{{ i18n.t('popTotal') }}</span>
            <b class="big">{{ fmt(stats().total) }}</b>
            <div class="split" role="img" [attr.aria-label]="i18n.t('popMen') + ' ' + menPct() + '%, ' + i18n.t('popWomen') + ' ' + womenPct() + '%'">
              <span class="bar-m" [style.width.%]="menPct()"></span><span class="bar-f" [style.width.%]="womenPct()"></span>
            </div>
            <div class="split-legend">
              <span><i class="fa-solid fa-mars" aria-hidden="true"></i> {{ i18n.t('popMen') }} <b>{{ fmt(stats().men) }}</b></span>
              <span><i class="fa-solid fa-venus" aria-hidden="true"></i> {{ i18n.t('popWomen') }} <b>{{ fmt(stats().women) }}</b></span>
            </div>
          </div>

          <div class="stat">
            <span class="label">{{ i18n.t('popBirthsToday') }}</span>
            <b class="mid">{{ fmt(stats().birthsToday) }}</b>
            <div class="babies">
              <div class="baby boy"><i class="fa-solid fa-baby" aria-hidden="true"></i><span>{{ i18n.t('popBoys') }}</span><b>{{ fmt(stats().boysToday) }}</b></div>
              <div class="baby girl"><i class="fa-solid fa-baby" aria-hidden="true"></i><span>{{ i18n.t('popGirls') }}</span><b>{{ fmt(stats().girlsToday) }}</b></div>
            </div>
            <p class="every">{{ i18n.t('popEveryPre') }} <b>{{ secondsPerBirth }}</b> {{ i18n.t('popSeconds') }}</p>
          </div>

          <div class="stat mini-row">
            <div><span class="label">{{ i18n.t('popBirthsYear') }}</span><b class="sm">{{ fmt(stats().birthsYear) }}</b></div>
            <div><span class="label">{{ i18n.t('popDeathsToday') }}</span><b class="sm">{{ fmt(stats().deathsToday) }}</b></div>
          </div>
        </div>

        <div class="map-card">
          <div class="map-head">
            <b>{{ i18n.t('popMapTitle') }}</b>
            <span class="legend"><i class="dot" [style.background]="boy"></i>{{ i18n.t('popBoys') }} <i class="dot" [style.background]="girl"></i>{{ i18n.t('popGirls') }}</span>
          </div>
          <div class="map-box"><div #host class="map-host" [attr.aria-label]="i18n.t('popMapTitle')"></div></div>
          <div class="feed" aria-live="polite">
            @for (ev of feed(); track ev.id) {
              <span class="feed-item" [class.boy]="ev.boy" [class.girl]="!ev.boy">
                <i class="fa-solid fa-baby" aria-hidden="true"></i>
                {{ ev.boy ? i18n.t('popBornBoy') : i18n.t('popBornGirl') }} {{ ev.state }}
              </span>
            } @empty {
              <span class="feed-wait">{{ i18n.t('popMapHint') }}</span>
            }
          </div>
        </div>
      </div>
      <p class="source">{{ i18n.t('popSource') }}</p>
    </section>
  `,
  styles: `
    .pop { margin: 2.2rem 0 0; }
    .results-head { border-bottom: 3px solid var(--text-color); padding-bottom: .55rem; margin-bottom: 1.2rem; }
    .results-head h3 { font-size: clamp(1.15rem, 2.5vw, 1.55rem); font-weight: 900; text-transform: uppercase; display: flex; align-items: center; gap: .6rem; }
    .live-dot { width: 12px; height: 12px; border-radius: 50%; background: var(--brand-red); box-shadow: 0 0 0 0 rgba(190, 52, 85, .6); animation: live 1.6s infinite; flex: none; }
    @keyframes live { 70% { box-shadow: 0 0 0 10px rgba(190, 52, 85, 0); } 100% { box-shadow: 0 0 0 0 rgba(190, 52, 85, 0); } }
    .pop-grid { display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); gap: 1.2rem; }
    @media (max-width: 860px) { .pop-grid { grid-template-columns: minmax(0, 1fr); } }
    .pop-stats { display: flex; flex-direction: column; gap: 1rem; min-width: 0; }
    .stat { background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 10px; padding: 1rem 1.1rem; min-width: 0; }
    .label { display: block; font-size: .72rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: var(--text-muted); }
    .big, .mid, .sm { display: block; font-family: var(--font-logo); font-weight: 900; font-variant-numeric: tabular-nums; line-height: 1.1; overflow-wrap: anywhere; }
    .big { font-size: clamp(1.7rem, 4.4vw, 2.5rem); margin: .25rem 0 .7rem; }
    .mid { font-size: clamp(1.4rem, 3.4vw, 1.9rem); margin: .25rem 0 .7rem; color: var(--brand-red); }
    .sm { font-size: 1.15rem; margin-top: .2rem; }
    .split { display: flex; height: 10px; border-radius: 99px; overflow: hidden; background: var(--border-color); }
    .bar-m { background: #0EA5E9; }
    .bar-f { background: #BE3455; }
    .split-legend { display: flex; justify-content: space-between; gap: .5rem 1rem; flex-wrap: wrap; margin-top: .5rem; font-size: .82rem; color: var(--text-muted); }
    .split-legend b { color: var(--text-color); font-variant-numeric: tabular-nums; }
    .fa-mars { color: #0EA5E9; } .fa-venus { color: #BE3455; }
    .babies { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .6rem; }
    .baby { display: grid; grid-template-columns: auto 1fr; grid-template-rows: auto auto; column-gap: .55rem; align-items: center; padding: .6rem .7rem; border-radius: 8px; }
    .baby i { grid-row: span 2; font-size: 1.5rem; }
    .baby span { font-size: .72rem; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; }
    .baby b { font-size: 1.15rem; font-weight: 900; font-variant-numeric: tabular-nums; }
    .baby.boy { background: rgba(14, 165, 233, .12); color: #0EA5E9; }
    .baby.girl { background: rgba(190, 52, 85, .12); color: #BE3455; }
    .baby b { color: var(--text-color); }
    .every { margin-top: .7rem; font-size: .82rem; color: var(--text-muted); }
    .every b { color: var(--text-color); }
    .mini-row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
    .map-card { background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 10px; overflow: hidden; display: flex; flex-direction: column; min-width: 0; }
    .map-head { display: flex; justify-content: space-between; align-items: center; gap: .5rem 1rem; flex-wrap: wrap; padding: .8rem 1rem; font-size: .9rem; }
    .legend { display: inline-flex; align-items: center; gap: .35rem; font-size: .78rem; color: var(--text-muted); }
    .dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-left: .4rem; }
    .map-box { position: relative; flex: 1; min-height: 340px; }
    .map-host { position: absolute; inset: 0; background: #e5e7eb; }
    .feed { display: flex; flex-wrap: wrap; gap: .4rem; padding: .7rem 1rem; min-height: 3.1rem; border-top: 1px solid var(--border-color); align-items: center; }
    .feed-item { font-size: .78rem; font-weight: 700; padding: .25rem .6rem; border-radius: 99px; animation: pop-in .4s ease; }
    .feed-item.boy { background: rgba(14, 165, 233, .14); color: #0EA5E9; }
    .feed-item.girl { background: rgba(190, 52, 85, .14); color: #BE3455; }
    .feed-wait { font-size: .8rem; color: var(--text-muted); }
    @keyframes pop-in { from { transform: scale(.6); opacity: 0; } }
    .source { margin-top: .8rem; font-size: .75rem; color: var(--text-muted); max-width: 80ch; }
    @media (prefers-reduced-motion: reduce) { .live-dot, .feed-item { animation: none; } }
  `,
})
export class PopulationClock {
  readonly i18n = inject(I18nService);
  readonly boy = BOY;
  readonly girl = GIRL;
  readonly secondsPerBirth = (MS_PER_BIRTH / 1000).toFixed(1);

  private readonly host = viewChild.required<ElementRef<HTMLDivElement>>('host');
  private readonly destroyRef = inject(DestroyRef);
  private readonly now = signal(Date.now());
  readonly feed = signal<BirthEvent[]>([]);
  private eventId = 0;
  private map?: LeafletMapType;
  private L?: LeafletNS;
  private circles: CircleMarker[] = [];

  readonly stats = computed(() => {
    const now = this.now();
    const p = MX_POPULATION;
    const total = populationAt(now);
    const menShare = p.men / (p.men + p.women);
    const birthsToday = (p.birthsPerYear * (now - startOfMxDay(now))) / YEAR_MS;
    return {
      total,
      men: total * menShare,
      women: total * (1 - menShare),
      birthsToday,
      boysToday: birthsToday * p.boyShare,
      girlsToday: birthsToday * (1 - p.boyShare),
      deathsToday: (p.deathsPerYear * (now - startOfMxDay(now))) / YEAR_MS,
      birthsYear: (p.birthsPerYear * (now - startOfMxYear(now))) / YEAR_MS,
    };
  });

  readonly menPct = computed(() => Math.round((MX_POPULATION.men / (MX_POPULATION.men + MX_POPULATION.women)) * 1000) / 10);
  readonly womenPct = computed(() => Math.round((100 - this.menPct()) * 10) / 10);

  constructor() {
    afterNextRender(() => {
      const tick = window.setInterval(() => this.now.set(Date.now()), 1000);
      let birthTimer = 0;
      const scheduleBirth = () => {
        // Tiempo entre nacimientos con variación natural alrededor del promedio nacional.
        const wait = -Math.log(1 - Math.random()) * MS_PER_BIRTH;
        birthTimer = window.setTimeout(() => {
          this.birth();
          scheduleBirth();
        }, Math.min(Math.max(wait, 2500), 45_000));
      };
      birthTimer = window.setTimeout(() => {
        this.birth();
        scheduleBirth();
      }, 1800);
      void this.initMap();
      this.destroyRef.onDestroy(() => {
        clearInterval(tick);
        clearTimeout(birthTimer);
        this.map?.remove();
        this.map = undefined;
      });
    });
  }

  fmt(n: number): string {
    return Math.floor(n).toLocaleString(this.i18n.locale());
  }

  /** Elige un estado según su peso en la población y anima el nacimiento en el mapa. */
  private birth(): void {
    let r = Math.random() * MX_CENSUS_2020_TOTAL;
    let index = 0;
    for (; index < MX_STATES.length - 1; index++) {
      r -= MX_STATES[index]!.census2020;
      if (r <= 0) break;
    }
    const isBoy = Math.random() < MX_POPULATION.boyShare;
    const state = MX_STATES[index]!;
    this.feed.update((list) => [{ id: ++this.eventId, state: state.name, boy: isBoy }, ...list].slice(0, 4));
    this.pulse(index, isBoy);
  }

  private pulse(index: number, isBoy: boolean): void {
    if (!this.map || !this.L) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const state = MX_STATES[index]!;
    const color = isBoy ? BOY : GIRL;
    const ring = this.L.circleMarker([state.lat, state.lng], { radius: 6, color, weight: 3, fill: false, interactive: false }).addTo(this.map);
    const base = this.circles[index];
    base?.setStyle({ fillColor: color, fillOpacity: 0.85 });
    const start = performance.now();
    const step = (t: number) => {
      const k = Math.min((t - start) / 1600, 1);
      ring.setRadius(6 + 34 * k);
      ring.setStyle({ opacity: 1 - k });
      if (k < 1 && this.map) requestAnimationFrame(step);
      else {
        ring.remove();
        base?.setStyle({ fillColor: '#64748B', fillOpacity: 0.45 });
      }
    };
    requestAnimationFrame(step);
  }

  private stateText(i: number): string {
    const s = MX_STATES[i]!;
    const share = s.census2020 / MX_CENSUS_2020_TOTAL;
    const st = this.stats();
    return `<b>${s.name}</b><br>${this.i18n.t('popTotal')}: ${this.fmt(st.total * share)}<br>${this.i18n.t('popBirthsToday')}: ${this.fmt(st.birthsToday * share)}`;
  }

  private async initMap(): Promise<void> {
    const mod = await import('leaflet');
    const L = (mod as { default?: LeafletNS }).default ?? (mod as LeafletNS);
    if (typeof L.map !== 'function') return;
    this.L = L;
    const el = this.host().nativeElement;
    this.map = L.map(el, { scrollWheelZoom: false, preferCanvas: true, zoomControl: true, attributionControl: true }).setView([23.6, -102.5], 4);
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri',
      maxZoom: 12,
    }).addTo(this.map);

    const max = Math.max(...MX_STATES.map((s) => s.census2020));
    this.circles = MX_STATES.map((s, i) =>
      L.circleMarker([s.lat, s.lng], {
        radius: 4 + 18 * Math.sqrt(s.census2020 / max),
        color: '#334155',
        weight: 1,
        fillColor: '#64748B',
        fillOpacity: 0.45,
      })
        .addTo(this.map!)
        .bindTooltip(() => this.stateText(i), { direction: 'top' })
        .bindPopup(() => this.stateText(i)),
    );
    this.map.fitBounds(L.latLngBounds(MX_STATES.map((s) => [s.lat, s.lng] as [number, number])), { padding: [18, 18] });

    const resize = new ResizeObserver(() => this.map?.invalidateSize({ animate: false }));
    resize.observe(el);
    this.destroyRef.onDestroy(() => resize.disconnect());
  }
}
