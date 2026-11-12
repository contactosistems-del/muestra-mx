import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18nService } from '../../../core/services/i18n.service';
import { SurveyService } from '../../../core/services/survey.service';
import { CountUp } from '../../../shared/count-up/count-up';

/** Franja de cifras en vivo al inicio de la portada. */
@Component({
  selector: 'app-live-stats',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, CountUp],
  template: `
    <section class="ls" [attr.lang]="i18n.lang()">
      <div class="ls-live"><span class="ls-dot"></span> {{ t('EN VIVO', 'LIVE') }}</div>
      <div class="ls-item">
        <i class="fa-solid fa-check-to-slot" aria-hidden="true"></i>
        <div><strong><app-count-up [value]="votes()" /></strong><span>{{ t('votos registrados', 'votes cast') }}</span></div>
      </div>
      <div class="ls-item">
        <i class="fa-solid fa-square-poll-vertical" aria-hidden="true"></i>
        <div><strong><app-count-up [value]="active()" [duration]="900" /></strong><span>{{ t('encuestas activas', 'active polls') }}</span></div>
      </div>
      <div class="ls-item">
        <i class="fa-solid fa-user-tie" aria-hidden="true"></i>
        <div><strong><app-count-up [value]="options()" [duration]="1000" /></strong><span>{{ t('opciones en juego', 'options in play') }}</span></div>
      </div>
      <a class="ls-cta" routerLink="/graficas">{{ t('Ver resultados', 'See results') }} <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>
    </section>
  `,
  styles: `
    .ls {
      position: relative; overflow: hidden; display: flex; align-items: center; flex-wrap: wrap; gap: .8rem 1.6rem;
      margin: 0 0 1.6rem; padding: .9rem 1.3rem; border-radius: 16px; color: #fff;
      background: linear-gradient(120deg, #0A0A0A, #2A0A15 55%, #BE3455); background-size: 180% 180%;
      animation: lsShift 14s ease infinite; box-shadow: 0 16px 32px -20px rgba(0, 0, 0, .7);
    }
    .ls::after {
      content: ''; position: absolute; inset: 0; pointer-events: none;
      background: linear-gradient(110deg, transparent 30%, rgba(255, 255, 255, .08) 50%, transparent 70%);
      transform: translateX(-100%); animation: lsShine 6s ease-in-out 1s infinite;
    }
    .ls-live {
      display: inline-flex; align-items: center; gap: .45rem; padding: .35rem .7rem; border-radius: 999px;
      background: rgba(255, 255, 255, .14); font-size: .7rem; font-weight: 900; letter-spacing: .14em;
    }
    .ls-dot { width: 8px; height: 8px; border-radius: 50%; background: #22C55E; box-shadow: 0 0 0 0 rgba(34, 197, 94, .7); animation: lsPulse 1.8s ease-out infinite; }
    .ls-item { display: flex; align-items: center; gap: .65rem; }
    .ls-item i {
      width: 38px; height: 38px; display: grid; place-items: center; border-radius: 11px;
      background: rgba(255, 255, 255, .14); font-size: 1rem;
    }
    .ls-item div { display: flex; flex-direction: column; line-height: 1.05; }
    .ls-item strong { font-family: var(--font-logo); font-size: 1.45rem; font-weight: 900; font-variant-numeric: tabular-nums; }
    .ls-item span { font-size: .72rem; color: rgba(255, 255, 255, .78); font-weight: 600; }
    .ls-cta {
      margin-left: auto; display: inline-flex; align-items: center; gap: .45rem; padding: .6rem 1rem; border-radius: 10px;
      background: #fff; color: #111; font-weight: 900; font-size: .78rem; text-transform: uppercase; letter-spacing: .04em;
      transition: transform .2s, box-shadow .2s;
    }
    .ls-cta:hover { transform: translateY(-2px); box-shadow: 0 10px 20px -10px rgba(0, 0, 0, .7); }
    .ls-cta i { transition: transform .2s; }
    .ls-cta:hover i { transform: translateX(3px); }
    @keyframes lsShift { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
    @keyframes lsShine { 0%, 60% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
    @keyframes lsPulse { 0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, .7); } 100% { box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); } }
    @media (max-width: 640px) {
      .ls { gap: .7rem 1rem; padding: .85rem 1rem; }
      .ls-item { flex: 1 1 40%; }
      .ls-item strong { font-size: 1.2rem; }
      .ls-cta { margin-left: 0; width: 100%; justify-content: center; }
    }
    @media (prefers-reduced-motion: reduce) { .ls, .ls::after, .ls-dot { animation: none; } }
  `,
})
export class LiveStats {
  readonly i18n = inject(I18nService);
  private readonly surveys = inject(SurveyService);

  readonly votes = computed(() => this.surveys.results().reduce((sum, row) => sum + (row.result.total || 0), 0));
  readonly active = computed(() => this.surveys.results().length);
  readonly options = computed(() => this.surveys.results().reduce((sum, row) => sum + row.survey.options.length, 0));

  t(es: string, en: string): string {
    return this.i18n.lang() === 'en' ? en : es;
  }
}
