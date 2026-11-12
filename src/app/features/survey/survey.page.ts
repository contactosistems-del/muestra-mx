import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { I18nService } from '../../core/services/i18n.service';
import { SurveyService } from '../../core/services/survey.service';

@Component({
  selector: 'app-survey-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    @if (survey(); as survey) {
      <article class="article-sheet survey-page">
        <div class="sp-hero">
          <div class="article-top">
            <span class="sp-badge"><span class="sp-dot"></span> {{ i18n.t('openPoll') }}</span>
            <button type="button" class="share-btn" (click)="copy()">
              <i class="fa-solid" [class.fa-share-nodes]="!copied()" [class.fa-check]="copied()"></i>
              {{ copied() ? i18n.t('copied') : i18n.t('copyLink') }}
            </button>
          </div>
          <p class="city"><i class="fa-solid fa-location-dot"></i> {{ i18n.tx(survey.city) }}</p>
          <h1>{{ i18n.tx(survey.title) }}</h1>
          <p class="question">{{ i18n.tx(survey.question) }}</p>
        </div>

        @if (showResults()) {
          <section class="sp-results">
            @if (justVoted()) {
              <div class="sp-confetti" aria-hidden="true">
                @for (c of confetti; track c.k) {
                  <span [style.left.%]="c.x" [style.background]="c.color" [style.animation-delay.s]="c.d" [style.animation-duration.s]="c.t" [style.width.px]="c.w" [style.height.px]="c.h"></span>
                }
              </div>
              <div class="sp-thanks">
                <span class="sp-check"><i class="fa-solid fa-check"></i></span>
                <div>
                  <strong>{{ t('¡Gracias! Tu voto quedó registrado.', 'Thanks! Your vote was recorded.') }}</strong>
                  <span>{{ t('Así van los resultados en este momento:', 'Here are the live results:') }}</span>
                </div>
              </div>
            } @else {
              <div class="sp-thanks sp-thanks-info">
                <span class="sp-check"><i class="fa-solid fa-chart-simple"></i></span>
                <div>
                  <strong>{{ t('Ya participaste en esta encuesta.', 'You already took this poll.') }}</strong>
                  <span>{{ t('Así van los resultados en este momento:', 'Here are the live results:') }}</span>
                </div>
              </div>
            }
            <div class="sp-bars">
              @for (row of rows(); track row.label; let i = $index) {
                <div class="sp-row" [class.mine]="row.mine" [class.lead]="i === 0" [style.animation-delay.ms]="i * 110">
                  @if (row.image) {
                    <img class="sp-avatar" [src]="row.image" [alt]="row.label" />
                  } @else {
                    <span class="sp-avatar sp-avatar-empty">{{ row.label.charAt(0) }}</span>
                  }
                  <div class="sp-row-main">
                    <div class="sp-row-meta">
                      <span>
                        {{ row.label }}
                        @if (i === 0) { <i class="fa-solid fa-crown sp-crown" aria-hidden="true"></i> }
                        @if (row.mine) { <em>{{ t('Tu voto', 'Your vote') }}</em> }
                      </span>
                      <strong>{{ row.percent }}%</strong>
                    </div>
                    <div class="sp-track"><div class="sp-fill" [style.--w]="row.percent + '%'" [style.animation-delay.ms]="200 + i * 110"></div></div>
                  </div>
                </div>
              }
            </div>
            <p class="sp-total">{{ t('Sondeo en línea · se actualiza en vivo', 'Online poll · updates live') }}</p>
            <div class="sp-actions">
              <a class="sp-wa" [href]="waUrl()" target="_blank" rel="noopener"><i class="fa-brands fa-whatsapp"></i> {{ t('Invita a votar', 'Invite others') }}</a>
              <a class="sp-more" routerLink="/graficas">{{ t('Ver todas las encuestas', 'See all polls') }} <i class="fa-solid fa-arrow-right"></i></a>
            </div>
          </section>
        } @else {
          @if (surveys.status()) {
            <div class="survey-alert">{{ surveys.status() }}</div>
          }
          <p class="sp-hint">{{ t('Toca a tu candidato y luego presiona votar', 'Tap your choice, then press vote') }}</p>
          <div class="survey-grid" [class.has-pick]="!!surveys.selected()" [class.has-photos]="!!survey.options[0]?.imageUrl">
            @for (opt of survey.options; track opt.id; let i = $index) {
              <button
                type="button"
                class="civica-choice"
                [style.animation-delay.ms]="i * 90"
                [class.selected]="surveys.selected() === opt.id"
                [attr.aria-pressed]="surveys.selected() === opt.id"
                (click)="surveys.select(opt.id)"
              >
                <span class="sp-tick"><i class="fa-solid fa-check"></i></span>
                @if (opt.imageUrl) {
                  <span class="civica-photo">
                    <img [src]="opt.imageUrl" [alt]="opt.label" />
                  </span>
                }
                <h4>{{ opt.label }}</h4>
              </button>
            }
          </div>
          <button class="btn-votar-activo" type="button" [class.ready]="!!surveys.selected()" [disabled]="surveys.busy()" (click)="surveys.vote()">
            @if (surveys.busy()) {
              <i class="fa-solid fa-spinner fa-spin"></i> {{ t('Registrando…', 'Saving…') }}
            } @else {
              {{ i18n.t('castVote') }}
            }
          </button>
          <p class="sp-secure"><i class="fa-solid fa-shield-halved"></i> {{ t('Un voto por dispositivo · Participación anónima', 'One vote per device · Anonymous') }}</p>
        }
      </article>
    } @else {
      <section class="nosotros-section">
        <p>{{ i18n.t('newsEmpty') }}</p>
        <a routerLink="/">{{ i18n.t('navHome') }}</a>
      </section>
    }
  `,
  styles: `
    .survey-page { max-width: 900px; padding: 0 !important; overflow: hidden; }
    .sp-hero {
      position: relative; padding: clamp(1.3rem, 3vw, 2rem); color: #fff;
      background: linear-gradient(125deg, #0A0A0A, #2A0A15 55%, #BE3455); background-size: 180% 180%;
      animation: spShift 14s ease infinite;
    }
    .sp-hero::after { content: ''; position: absolute; right: -80px; top: -90px; width: 280px; height: 280px; border-radius: 50%; background: rgba(255,255,255,.07); pointer-events: none; }
    .article-top { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem; position: relative; z-index: 1; }
    .sp-badge { display: inline-flex; align-items: center; gap: .45rem; padding: .35rem .75rem; border-radius: 999px; background: rgba(255,255,255,.14); font-size: .7rem; font-weight: 900; letter-spacing: .12em; text-transform: uppercase; }
    .sp-dot { width: 8px; height: 8px; border-radius: 50%; background: #22C55E; animation: spPulse 1.8s ease-out infinite; }
    .share-btn { background: #25D366; color: #FFF; border: none; padding: .55rem .95rem; border-radius: 10px; font-size: .78rem; font-weight: 800; cursor: pointer; box-shadow: 0 8px 18px -10px rgba(0,0,0,.6); transition: transform .2s; }
    .share-btn:hover { transform: translateY(-2px); }
    .city { color: #FFB3C4; font-weight: 800; margin-bottom: .4rem; display: flex; gap: .4rem; align-items: center; }
    h1 { font-size: clamp(1.6rem, 3.4vw, 2.4rem); font-weight: 900; margin-bottom: .8rem; line-height: 1.1; }
    .question { font-size: clamp(1rem, 2vw, 1.15rem); font-weight: 600; line-height: 1.45; color: rgba(255,255,255,.88); max-width: 46rem; }
    .survey-alert { margin: 1.2rem clamp(1.1rem, 3vw, 2rem) 0; padding: .8rem; border-radius: 12px; font-size: .88rem; font-weight: 700; text-align: center; background: #FEF3C7; color: #92400E; animation: spUp .35s ease; }
    .sp-hint { text-align: center; font-size: .8rem; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; color: var(--text-muted); margin: 1.4rem 0 .2rem; }
    .survey-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 170px), 1fr)); gap: 1rem;
      padding: 1rem clamp(1.1rem, 3vw, 2rem) 1.4rem;
    }
    .civica-choice {
      position: relative; border: 2px solid rgba(157,161,159,.4); padding: .7rem; border-radius: 16px; background: var(--card-bg);
      cursor: pointer; text-align: center; color: inherit; display: flex; flex-direction: column; gap: .6rem; min-width: 0;
      box-shadow: 0 10px 22px -18px rgba(15,23,42,.6);
      opacity: 0; animation: spUp .5s cubic-bezier(.2,.8,.2,1) forwards;
      transition: transform .25s cubic-bezier(.2,.8,.2,1), box-shadow .25s, border-color .25s, opacity .25s, filter .25s;
    }
    .civica-choice:hover { transform: translateY(-5px); box-shadow: 0 18px 30px -18px rgba(15,23,42,.65); border-color: rgba(190,52,85,.55); }
    .civica-photo { display: block; aspect-ratio: 1 / 1; overflow: hidden; border-radius: 11px; background: #f1f1f1; }
    .civica-choice img { width: 100%; height: 100%; object-fit: cover; object-position: top center; transition: transform .5s cubic-bezier(.2,.8,.2,1); }
    .civica-choice:hover img { transform: scale(1.06); }
    .civica-choice h4 { font-size: .95rem; font-weight: 900; overflow-wrap: anywhere; padding: .1rem .2rem .2rem; }
    .sp-tick {
      position: absolute; top: .55rem; right: .55rem; z-index: 2; width: 34px; height: 34px; border-radius: 50%; display: grid; place-items: center;
      background: var(--brand-red); color: #fff; font-size: .95rem; box-shadow: 0 6px 14px -4px rgba(190,52,85,.8);
      transform: scale(0); transition: transform .35s cubic-bezier(.2,1.6,.4,1);
    }
    .civica-choice.selected { border-color: var(--brand-red); transform: translateY(-6px) scale(1.02); box-shadow: 0 0 0 4px rgba(190,52,85,.18), 0 22px 36px -18px rgba(190,52,85,.7); }
    .civica-choice.selected .sp-tick { transform: scale(1); }
    .civica-choice.selected h4 { color: var(--brand-red); }
    .has-pick .civica-choice:not(.selected) { opacity: .62 !important; filter: grayscale(.35); }
    .has-pick .civica-choice:not(.selected):hover { opacity: .95 !important; filter: none; }
    .btn-votar-activo { display: block; width: calc(100% - 2 * clamp(1.1rem, 3vw, 2rem)) !important; margin: 0 auto; padding: 1.05rem !important; font-size: 1rem !important; }
    .btn-votar-activo.ready { animation: spReady 1.6s ease-in-out infinite; }
    .sp-secure { text-align: center; font-size: .75rem; color: var(--text-muted); margin: .8rem 0 1.4rem; font-weight: 600; }
    .sp-secure i { color: #16A34A; margin-right: .3rem; }

    .sp-results { position: relative; padding: 1.4rem clamp(1.1rem, 3vw, 2rem) 1.6rem; overflow: hidden; }
    .sp-thanks { display: flex; gap: .85rem; align-items: center; padding: .9rem 1rem; border-radius: 14px; background: #DCFCE7; color: #14532D; margin-bottom: 1.2rem; animation: spUp .45s ease; }
    .sp-thanks-info { background: #EFF6FF; color: #1E3A8A; }
    .sp-thanks div { display: flex; flex-direction: column; gap: .15rem; font-size: .88rem; }
    .sp-thanks strong { font-size: 1rem; }
    .sp-check { flex: 0 0 auto; width: 42px; height: 42px; border-radius: 50%; display: grid; place-items: center; background: #16A34A; color: #fff; font-size: 1.1rem; animation: spBounce .6s cubic-bezier(.2,1.6,.4,1); }
    .sp-thanks-info .sp-check { background: #2563EB; }
    .sp-bars { display: flex; flex-direction: column; gap: .8rem; }
    .sp-row { display: flex; align-items: center; gap: .85rem; padding: .7rem .8rem; border-radius: 14px; border: 1px solid rgba(157,161,159,.3); background: var(--card-bg); opacity: 0; animation: spUp .45s ease forwards; }
    .sp-row.mine { border-color: var(--brand-red); box-shadow: 0 0 0 3px rgba(190,52,85,.12); }
    .sp-avatar { flex: 0 0 auto; width: 54px; height: 54px; border-radius: 50%; object-fit: cover; object-position: top center; border: 3px solid #fff; box-shadow: 0 4px 12px -4px rgba(0,0,0,.4); }
    .sp-avatar-empty { display: grid; place-items: center; background: var(--brand-red); color: #fff; font-weight: 900; font-size: 1.3rem; }
    .sp-row-main { flex: 1; min-width: 0; }
    .sp-row-meta { display: flex; justify-content: space-between; align-items: baseline; gap: .6rem; font-weight: 800; font-size: .95rem; }
    .sp-row-meta em { font-style: normal; font-size: .65rem; font-weight: 900; text-transform: uppercase; letter-spacing: .06em; background: var(--brand-red); color: #fff; padding: .15rem .45rem; border-radius: 999px; margin-left: .35rem; vertical-align: 2px; }
    .sp-row-meta strong { font-family: var(--font-logo); font-size: 1.35rem; color: var(--brand-red); }
    .sp-crown { color: #F59E0B; margin-left: .3rem; }
    .sp-track { height: 12px; border-radius: 999px; background: #EEF0F2; overflow: hidden; margin-top: .4rem; }
    .sp-fill { height: 100%; width: 0; border-radius: 999px; background: linear-gradient(90deg, #9B2443, #BE3455, #E0577A); animation: spFill 1.2s cubic-bezier(.2,.8,.2,1) forwards; }
    .sp-row:not(.lead) .sp-fill { background: linear-gradient(90deg, #6B7280, #9CA3AF); }
    .sp-row.mine:not(.lead) .sp-fill { background: linear-gradient(90deg, #9B2443, #E0577A); }
    .sp-total { text-align: center; font-size: .8rem; color: var(--text-muted); font-weight: 700; margin: 1rem 0; }
    .sp-actions { display: flex; gap: .7rem; flex-wrap: wrap; justify-content: center; }
    .sp-wa, .sp-more { display: inline-flex; align-items: center; gap: .45rem; padding: .8rem 1.2rem; border-radius: 12px; font-weight: 900; font-size: .85rem; text-transform: uppercase; letter-spacing: .03em; transition: transform .2s, box-shadow .2s; }
    .sp-wa { background: #25D366; color: #fff; box-shadow: 0 10px 20px -12px rgba(18,140,126,.9); }
    .sp-more { background: #111; color: #fff; }
    .sp-wa:hover, .sp-more:hover { transform: translateY(-2px); }
    .sp-confetti { position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 3; }
    .sp-confetti span { position: absolute; top: -20px; border-radius: 2px; animation: spConfetti linear forwards; }

    @keyframes spShift { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
    @keyframes spPulse { 0% { box-shadow: 0 0 0 0 rgba(34,197,94,.7); } 100% { box-shadow: 0 0 0 10px rgba(34,197,94,0); } }
    @keyframes spUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
    @keyframes spFill { from { width: 0; } to { width: var(--w); } }
    @keyframes spBounce { from { transform: scale(0); } to { transform: scale(1); } }
    @keyframes spReady { 0%, 100% { box-shadow: 0 10px 22px -10px rgba(190,52,85,.7); } 50% { box-shadow: 0 0 0 8px rgba(190,52,85,.15), 0 14px 26px -10px rgba(190,52,85,.9); } }
    @keyframes spConfetti { to { transform: translateY(700px) rotate(720deg); opacity: 0; } }
    @media (max-width: 480px) {
      .survey-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .7rem; }
      .civica-choice h4 { font-size: .82rem; }
      .sp-avatar { width: 44px; height: 44px; }
    }
    @media (prefers-reduced-motion: reduce) {
      .sp-hero, .civica-choice, .sp-row, .sp-fill, .btn-votar-activo.ready, .sp-confetti span { animation: none !important; opacity: 1; }
      .sp-fill { width: var(--w); }
    }
  `,
})
export class SurveyPage {
  readonly i18n = inject(I18nService);
  readonly surveys = inject(SurveyService);
  readonly copied = signal(false);
  /** true cuando el voto se registró en esta visita (para lanzar el confeti). */
  readonly justVoted = computed(() => this.surveys.statusKey() === 'voteOk');
  readonly showResults = computed(() => {
    const key = this.surveys.statusKey();
    return key === 'voteOk' || key === 'alreadyVoted';
  });
  readonly result = computed(() => {
    const current = this.survey();
    return current ? this.surveys.results().find((row) => row.survey.id === current.id)?.result : undefined;
  });
  readonly total = computed(() => this.result()?.total ?? 0);
  readonly rows = computed(() => {
    const current = this.survey();
    const res = this.result();
    if (!current || !res) return [];
    const picked = this.surveys.selected();
    const pickedLabel = current.options.find((o) => o.id === picked)?.label;
    return [...res.options]
      .sort((a, b) => b.count - a.count)
      .map((tally) => ({
        label: tally.label,
        percent: tally.percent,
        image: current.options.find((o) => o.label === tally.label)?.imageUrl ?? '',
        mine: !!pickedLabel && tally.label === pickedLabel && this.justVoted(),
      }));
  });
  readonly confetti = Array.from({ length: 70 }, (_, k) => ({
    k,
    x: Math.random() * 100,
    color: ['#BE3455', '#FFD166', '#06D6A0', '#118AB2', '#E0577A', '#F78C6B'][k % 6],
    d: Math.random() * 0.6,
    t: 2 + Math.random() * 1.8,
    w: 6 + Math.random() * 6,
    h: 9 + Math.random() * 8,
  }));
  readonly waUrl = computed(() => {
    const current = this.survey();
    const title = current ? this.i18n.tx(current.title) : 'MUESTRA.MX';
    const text = this.t(`Ya voté en la encuesta "${title}" de MUESTRA.MX. ¡Participa tú también!`, `I just voted in the "${title}" poll on MUESTRA.MX. Join in!`);
    return `https://wa.me/?text=${encodeURIComponent(`${text} ${typeof location !== 'undefined' ? location.href : 'https://muestra.mx'}`)}`;
  });

  t(es: string, en: string): string {
    return this.i18n.lang() === 'en' ? en : es;
  }
  private readonly id = toSignal(inject(ActivatedRoute).paramMap.pipe(map((params) => params.get('id'))), { initialValue: null });
  readonly survey = computed(() => {
    const id = this.id();
    return id ? this.surveys.surveyById(id) : undefined;
  });

  constructor() {
    effect(() => {
      const current = this.survey();
      if (current && this.surveys.openId() !== current.id) this.surveys.open(current.id, { modal: false });
    });
  }

  async copy(): Promise<void> {
    await navigator.clipboard.writeText(location.href);
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 1800);
  }
}
