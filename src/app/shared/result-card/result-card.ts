import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { I18nService } from '../../core/services/i18n.service';
import type { Survey, SurveyResult } from '../../domain/models';
import { partyColor, partyTint } from '../party';
import { cityGeo } from '../city-geo';
import { CityMap } from './city-map';
import { Donut } from './donut';
import { downloadResultImage } from './result-image';

/** Tarjeta de "Resultados al momento" estilo tablero, con descarga de imagen para administradores. */
@Component({
  selector: 'app-result-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, CityMap, Donut],
  template: `
    <article class="rc">
      @if (geo(); as g) {
        <app-city-map class="rc-map" [lat]="g.lat" [lng]="g.lng" [zoom]="g.zoom" [height]="150" [label]="i18n.tx(survey().city)" />
      }
      <div class="rc-body">
      <div class="rc-crumb">
        <span>MUESTRA.MX</span><i>/</i><span>{{ t('ENCUESTAS', 'POLLS') }}</span><i>/</i><span>{{ city() }}</span>
      </div>
      <h4 class="rc-q">{{ question() }}</h4>

      @if (total() === 0) {
        <p class="rc-empty">{{ i18n.t('noVotesYet') }}</p>
      } @else {
        <div class="rc-sum">
          <app-donut class="rc-donut" [slices]="slices()" />
          <div class="rc-sum-text">
            <small>{{ t('Encabeza', 'Leading') }}</small>
            <strong>{{ rows()[0]?.label }}</strong>
            @if (rows()[0]?.party) {
              <em class="rc-party" [style.background]="rows()[0]?.tint" [style.color]="rows()[0]?.color">{{ rows()[0]?.party }}</em>
            }
            @if (lead() !== null) {
              <span class="rc-lead"><i class="fa-solid fa-arrow-trend-up"></i> {{ t('Ventaja de', 'Lead of') }} {{ lead()!.toFixed(1) }} {{ t('pts', 'pts') }}</span>
            }
          </div>
        </div>
        <ul class="rc-rows">
          @for (row of rows(); track row.label; let i = $index) {
            <li class="rc-row" [class.lead]="i === 0" [style.--pc]="row.color" [style.animation-delay.ms]="i * 90">
              @if (row.image) {
                <img class="rc-av" [src]="row.image" [alt]="row.label" loading="lazy" />
              } @else {
                <span class="rc-av rc-av-empty">{{ row.label.charAt(0) }}</span>
              }
              <div class="rc-main">
                <div class="rc-meta">
                  <span class="rc-name">
                    {{ row.label }}
                    @if (row.party) {
                      <em class="rc-party" [style.background]="row.tint" [style.color]="row.color">{{ row.party }}</em>
                    }
                  </span>
                  <strong class="rc-pct">
                    {{ row.percent.toFixed(1) }}%
                    @if (showCounts()) { <small>{{ row.count.toLocaleString('es-MX') }}</small> }
                  </strong>
                </div>
                <div class="rc-track"><div class="rc-fill" [style.--w]="row.percent + '%'" [style.animation-delay.ms]="150 + i * 90"></div></div>
              </div>
            </li>
          }
        </ul>
      }

      <div class="rc-foot">
        <div>
          <span>{{ t('Sondeo en línea', 'Online poll') }}</span>
          <span class="rc-live"><i></i> {{ t('En vivo', 'Live') }}</span>
        </div>
      </div>

      <div class="rc-actions">
        <a class="btn-votar result-cta" [routerLink]="['/encuesta', survey().id]">{{ i18n.t('takeSurvey') }}</a>
        @if (auth.isAdmin() && total() > 0) {
          <button type="button" class="rc-dl" [disabled]="busy()" (click)="download()">
            @if (busy()) { <i class="fa-solid fa-spinner fa-spin"></i> } @else { <i class="fa-solid fa-image"></i> }
            {{ t('Descargar imagen', 'Download image') }}
          </button>
        }
      </div>
      </div>
    </article>
  `,
  styles: `
    :host { display: block; }
    .rc {
      height: 100%; display: flex; flex-direction: column; overflow: hidden; border-radius: 22px;
      background: var(--card-bg); border: 1px solid rgba(157,161,159,.32); box-shadow: 0 18px 36px -26px rgba(15,23,42,.55);
      transition: transform .3s cubic-bezier(.2,.8,.2,1), box-shadow .3s;
    }
    .rc-body { flex: 1; display: flex; flex-direction: column; padding: 1.3rem 1.4rem 1.3rem; }
    .rc-map { border-bottom: 3px solid var(--brand-red); }
    .rc-sum { display: flex; align-items: center; gap: 1.1rem; padding: .9rem 1rem; margin-bottom: 1.1rem; border-radius: 16px; background: linear-gradient(135deg, rgba(190,52,85,.07), rgba(157,161,159,.06)); border: 1px solid rgba(157,161,159,.22); }
    .rc-donut { flex: 0 0 auto; width: 118px; }
    .rc-sum-text { display: flex; flex-direction: column; align-items: flex-start; gap: .3rem; min-width: 0; }
    .rc-sum-text small { font-family: var(--font-mono); font-size: .66rem; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: var(--text-muted); }
    .rc-sum-text strong { font-family: var(--font-display); font-size: 1.2rem; font-weight: 800; line-height: 1.15; }
    .rc-lead { font-size: .76rem; font-weight: 800; color: #16A34A; display: inline-flex; gap: .35rem; align-items: center; }
    .rc:hover { transform: translateY(-4px); box-shadow: 0 26px 44px -26px rgba(15,23,42,.6); }
    .rc-crumb { display: flex; flex-wrap: wrap; gap: .45rem; font-family: var(--font-mono); font-size: .72rem; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; color: var(--brand-red); }
    .rc-crumb i { font-style: normal; color: var(--text-muted); opacity: .6; }
    .rc-q { font-family: var(--font-display); font-size: clamp(1.25rem, 2.4vw, 1.6rem); font-weight: 800; line-height: 1.15; letter-spacing: -.02em; margin: .6rem 0 1.2rem; text-wrap: balance; }
    .rc-empty { color: var(--text-muted); font-size: .9rem; margin: .5rem 0 1rem; }
    .rc-rows { list-style: none; display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.1rem; }
    .rc-row { display: flex; align-items: center; gap: .85rem; opacity: 0; animation: rcUp .45s ease forwards; }
    .rc-av { flex: 0 0 auto; width: 48px; height: 48px; border-radius: 50%; object-fit: cover; object-position: top center; background: #EEF0F2; }
    .rc-row.lead .rc-av { box-shadow: 0 0 0 3px var(--card-bg), 0 0 0 5px var(--pc); }
    .rc-av-empty { display: grid; place-items: center; background: var(--pc); color: #fff; font-weight: 900; font-size: 1.2rem; }
    .rc-main { flex: 1; min-width: 0; }
    .rc-meta { display: flex; justify-content: space-between; align-items: center; gap: .6rem; }
    .rc-name { font-weight: 800; font-size: 1rem; display: flex; align-items: center; gap: .45rem; flex-wrap: wrap; min-width: 0; }
    .rc-party { font-style: normal; font-family: var(--font-mono); font-size: .64rem; font-weight: 700; letter-spacing: .06em; padding: .18rem .45rem; border-radius: 6px; }
    .rc-pct { font-family: var(--font-mono); font-size: 1.2rem; font-weight: 700; font-variant-numeric: tabular-nums; white-space: nowrap; text-align: right; display: flex; flex-direction: column; line-height: 1.1; }
    .rc-pct small { font-size: .7rem; font-weight: 600; color: var(--text-muted); }
    .rc-track { height: 9px; border-radius: 999px; background: #EEF0F2; overflow: hidden; margin-top: .4rem; }
    .rc-fill { height: 100%; width: 0; border-radius: 999px; background: var(--pc); animation: rcFill 1.2s cubic-bezier(.2,.8,.2,1) forwards; }
    .rc-foot { margin-top: auto; padding-top: .9rem; border-top: 1px dashed rgba(157,161,159,.55); font-family: var(--font-mono); font-size: .76rem; color: var(--text-muted); }
    .rc-foot div { display: flex; flex-direction: column; gap: .35rem; }
    .rc-live { display: inline-flex; align-items: center; gap: .4rem; color: #16A34A; font-weight: 700; }
    .rc-live i { width: 8px; height: 8px; border-radius: 50%; background: #16A34A; animation: rcPulse 1.8s ease-out infinite; }
    .rc-actions { display: flex; flex-wrap: wrap; gap: .6rem; margin-top: 1rem; }
    .rc-actions .result-cta { flex: 1 1 180px; }
    .rc-dl {
      flex: 1 1 160px; display: inline-flex; align-items: center; justify-content: center; gap: .5rem; border: none; border-radius: 10px;
      padding: .8rem 1rem; background: #0B0B0F; color: #fff; font-weight: 800; font-size: .82rem; cursor: pointer;
      box-shadow: 0 10px 20px -12px rgba(0,0,0,.7); transition: transform .2s, background .2s;
    }
    .rc-dl:hover:not(:disabled) { transform: translateY(-2px); background: #1F2430; }
    .rc-dl:disabled { opacity: .7; cursor: wait; }
    :host-context([data-theme='dark']) .rc-track { background: #252C3A; }
    :host-context([data-theme='dark']) .rc-dl { background: #fff; color: #111; }
    @keyframes rcUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
    @keyframes rcFill { from { width: 0; } to { width: var(--w); } }
    @keyframes rcPulse { 0% { box-shadow: 0 0 0 0 rgba(22,163,74,.6); } 100% { box-shadow: 0 0 0 8px rgba(22,163,74,0); } }
    @media (prefers-reduced-motion: reduce) { .rc-row, .rc-fill, .rc-live i { animation: none !important; opacity: 1; } .rc-fill { width: var(--w); } }
  `,
})
export class ResultCard {
  readonly i18n = inject(I18nService);
  readonly auth = inject(AuthService);
  readonly survey = input.required<Survey>();
  readonly result = input.required<SurveyResult>();
  /** Muestra también el número de votos de cada opción (vista de administración). */
  readonly showCounts = input(false);
  readonly busy = signal(false);

  readonly city = computed(() => this.i18n.tx(this.survey().city).toUpperCase());
  readonly question = computed(() => this.i18n.tx(this.survey().question) || this.i18n.tx(this.survey().title));
  readonly total = computed(() => this.result().total || 0);
  readonly rows = computed(() => {
    const survey = this.survey();
    return [...this.result().options]
      .sort((a, b) => b.count - a.count)
      .map((tally) => {
        const opt = survey.options.find((o) => o.label === tally.label);
        return {
          label: tally.label,
          count: tally.count,
          percent: Number(tally.percent) || 0,
          image: opt?.imageUrl ?? '',
          party: opt?.party ?? '',
          color: partyColor(opt?.party),
          tint: partyTint(opt?.party, 0.13),
        };
      });
  });

  readonly geo = computed(() => {
    const sv = this.survey();
    return cityGeo(sv.city.es, sv.city.en, sv.title.es, sv.shortLabel.es);
  });
  readonly slices = computed(() => this.rows().map((r) => ({ label: r.label, percent: r.percent, color: r.color })));
  /** Diferencia en puntos entre el primero y el segundo lugar. */
  readonly lead = computed(() => {
    const r = this.rows();
    return r.length > 1 ? r[0]!.percent - r[1]!.percent : null;
  });

  t(es: string, en: string): string {
    return this.i18n.lang() === 'en' ? en : es;
  }

  async download(): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    try {
      await downloadResultImage({
        surveyId: this.survey().id,
        city: this.i18n.tx(this.survey().city),
        question: this.question(),
        rows: this.rows(),
        geo: this.geo(),
      });
    } finally {
      this.busy.set(false);
    }
  }
}
