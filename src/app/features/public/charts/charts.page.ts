import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18nService } from '../../../core/services/i18n.service';
import { SurveyService } from '../../../core/services/survey.service';
import { ResultCard } from '../../../shared/result-card/result-card';

@Component({
  selector: 'app-charts-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ResultCard],
  template: `
    <section class="charts-wrap" [attr.lang]="i18n.lang()">
      <div class="charts-head">
        <h3><i class="fa-solid fa-chart-pie"></i> {{ i18n.t('navCharts') }}</h3>
        <p class="muted">{{ i18n.t('chartsLead') }}</p>
      </div>

      <div class="results-grid">
        @for (row of surveys.results(); track row.survey.id) {
          <app-result-card [survey]="row.survey" [result]="row.result" />
        } @empty {
          <p class="empty">{{ i18n.t('surveyEmpty') }}</p>
        }
      </div>
    </section>
  `,
  styles: `
    .charts-wrap { margin: 1rem 0 2rem; }
    .charts-head { border-bottom: 3px solid var(--text-color); padding-bottom: .55rem; margin-bottom: 1.2rem; }
    .charts-head h3 {
      font-size: clamp(1.15rem, 2.5vw, 1.55rem);
      font-weight: 900;
      text-transform: uppercase;
      margin-bottom: .35rem;
    }
    .charts-head i { color: var(--brand-red); margin-right: .35rem; }
    .muted { color: var(--text-muted); font-size: .92rem; line-height: 1.45; max-width: 42rem; }
    .results-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr)); gap: 1.2rem; }
    .result-card { background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 10px; padding: 1.1rem; }
    .result-top { margin-bottom: 1rem; }
    .result-top h4 { font-size: 1rem; font-weight: 900; line-height: 1.25; min-width: 0; overflow-wrap: anywhere; }
    .poll-city { font-size: .82rem; color: var(--brand-red); font-weight: 800; margin-bottom: .4rem; }
    .empty { color: var(--text-muted); font-size: .88rem; margin-bottom: 1rem; }
    .bars { list-style: none; display: flex; flex-direction: column; gap: .75rem; margin-bottom: 1rem; }
    .bar-meta { display: flex; justify-content: space-between; gap: .8rem; font-size: .82rem; font-weight: 700; margin-bottom: .3rem; flex-wrap: wrap; }
    .bar-meta span { min-width: 0; overflow-wrap: anywhere; }
    .bar-track { height: 10px; background: #E5E7EB; border-radius: 999px; overflow: hidden; }
    .bar-fill { height: 100%; background: var(--brand-red); border-radius: 999px; min-width: 0; transition: width .35s ease; }
    .pie-box { width: min(100%, 220px); margin: 0 auto 1.1rem; }
    .dot { display: inline-block; width: .7rem; height: .7rem; border-radius: 50%; margin-right: .4rem; vertical-align: -1px; }
    .result-cta { display: inline-flex; justify-content: center; margin-top: .2rem; }
    @media (max-width: 720px) {
      .result-cta { width: 100%; }
    }
  `,
})
export class ChartsPage {
  readonly i18n = inject(I18nService);
  readonly surveys = inject(SurveyService);
}
