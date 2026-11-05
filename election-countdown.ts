import { ChangeDetectionStrategy, Component, DestroyRef, afterNextRender, computed, inject, signal } from '@angular/core';
import { I18nService } from '../../../core/services/i18n.service';

/** Jornada electoral federal: domingo 6 de junio de 2027, apertura de casillas 8:00 hora del centro (UTC-6). */
const ELECTION_AT = Date.UTC(2027, 5, 6, 14);

@Component({
  selector: 'app-election-countdown',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="countdown" [attr.lang]="i18n.lang()" aria-labelledby="cd-title">
      <div class="cd-text">
        <span class="cd-eyebrow"><i class="fa-solid fa-check-to-slot" aria-hidden="true"></i> {{ i18n.t('electionEyebrow') }}</span>
        <h3 id="cd-title">{{ i18n.t('electionDate') }}</h3>
        <p>{{ i18n.t('electionOffices') }}</p>
      </div>
      @if (left().done) {
        <p class="cd-done">{{ i18n.t('electionDone') }}</p>
      } @else {
        <div class="cd-grid" role="timer" aria-live="off">
          <div class="cd-cell cd-days"><b>{{ left().d }}</b><span>{{ i18n.t('cdDays') }}</span></div>
          <div class="cd-cell"><b>{{ pad(left().h) }}</b><span>{{ i18n.t('cdHours') }}</span></div>
          <div class="cd-cell"><b>{{ pad(left().m) }}</b><span>{{ i18n.t('cdMinutes') }}</span></div>
          <div class="cd-cell"><b>{{ pad(left().s) }}</b><span>{{ i18n.t('cdSeconds') }}</span></div>
        </div>
      }
    </section>
  `,
  styles: `
    .countdown {
      margin: 2.2rem 0 0; padding: 1.4rem 1.5rem; border-radius: 12px; background: var(--brand-dark); color: #F8FAFC;
      display: flex; align-items: center; justify-content: space-between; gap: 1.4rem 2rem; flex-wrap: wrap;
      border-left: 6px solid var(--brand-red); position: relative; overflow: hidden;
    }
    .cd-text { flex: 1 1 300px; min-width: 0; }
    .cd-eyebrow { font-size: .75rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: #F9A8C1; }
    .cd-text h3 { font-family: var(--font-logo); font-size: clamp(1.25rem, 2.8vw, 1.7rem); font-weight: 900; margin: .3rem 0 .35rem; }
    .cd-text p { color: #CBD5E1; font-size: .9rem; }
    .cd-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .6rem; flex: 1 1 320px; max-width: 460px; }
    .cd-cell {
      display: flex; flex-direction: column; align-items: center; padding: .7rem .3rem; border-radius: 10px;
      background: rgba(255, 255, 255, .07); border: 1px solid rgba(255, 255, 255, .12);
    }
    .cd-days { background: var(--brand-red); border-color: var(--brand-red); }
    .cd-cell b { font-family: var(--font-logo); font-size: clamp(1.5rem, 4vw, 2.2rem); font-weight: 900; line-height: 1.05; font-variant-numeric: tabular-nums; }
    .cd-cell span { font-size: .68rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: #E2E8F0; }
    .cd-done { font-family: var(--font-logo); font-size: 1.4rem; font-weight: 900; color: #F9A8C1; }
  `,
})
export class ElectionCountdown {
  readonly i18n = inject(I18nService);
  private readonly now = signal(Date.now());

  readonly left = computed(() => {
    const ms = ELECTION_AT - this.now();
    if (ms <= 0) return { done: true, d: 0, h: 0, m: 0, s: 0 };
    const sec = Math.floor(ms / 1000);
    return { done: false, d: Math.floor(sec / 86_400), h: Math.floor((sec % 86_400) / 3600), m: Math.floor((sec % 3600) / 60), s: sec % 60 };
  });

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const id = window.setInterval(() => this.now.set(Date.now()), 1000);
      destroyRef.onDestroy(() => clearInterval(id));
    });
  }

  pad(n: number): string {
    return String(n).padStart(2, '0');
  }
}
