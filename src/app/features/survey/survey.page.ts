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
        <div class="article-top">
          <span class="badge">{{ i18n.t('openPoll') }}</span>
          <button type="button" class="share-btn" (click)="copy()">
            <i class="fa-solid fa-share-nodes"></i> {{ copied() ? i18n.t('copied') : i18n.t('copyLink') }}
          </button>
        </div>
        <p class="city">{{ i18n.tx(survey.city) }}</p>
        <h1>{{ i18n.tx(survey.title) }}</h1>
        <p class="question">{{ i18n.tx(survey.question) }}</p>
        @if (surveys.status()) {
          <div class="survey-alert">{{ surveys.status() }}</div>
        }
        <div class="survey-grid" [class.has-photos]="!!survey.options[0]?.imageUrl">
          @for (opt of survey.options; track opt.id) {
            <button
              type="button"
              class="civica-choice"
              [class.selected]="surveys.selected() === opt.id"
              (click)="surveys.select(opt.id)"
            >
              @if (opt.imageUrl) {
                <span class="civica-photo">
                  <img [src]="opt.imageUrl" [alt]="opt.label" />
                </span>
              }
              <h4>{{ opt.label }}</h4>
            </button>
          }
        </div>
        <button class="btn-votar-activo" type="button" [disabled]="surveys.busy()" (click)="surveys.vote()">
          {{ i18n.t('castVote') }}
        </button>
      </article>
    } @else {
      <section class="nosotros-section">
        <p>{{ i18n.t('newsEmpty') }}</p>
        <a routerLink="/">{{ i18n.t('navHome') }}</a>
      </section>
    }
  `,
  styles: `
    .survey-page { max-width: 860px; }
    .article-top { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem; }
    .share-btn { background: #25D366; color: #FFF; border: none; padding: .4rem .8rem; border-radius: 4px; font-size: .75rem; font-weight: 800; cursor: pointer; }
    .city { color: var(--brand-red); font-weight: 800; margin-bottom: .4rem; }
    h1 { font-size: clamp(1.5rem, 3vw, 2.1rem); font-weight: 900; margin-bottom: 1rem; }
    .question { font-size: 1.05rem; font-weight: 800; margin-bottom: 1.2rem; line-height: 1.4; }
    .survey-alert { padding: .75rem; border-radius: 6px; font-size: .85rem; font-weight: 700; margin-bottom: 1rem; text-align: center; background: #FEF3C7; color: #92400E; }
    .survey-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 160px), 1fr));
      gap: .8rem;
      margin: 0 0 1.5rem;
    }
    .civica-choice {
      border: 2px solid var(--brand-gray); padding: .8rem; border-radius: 8px; background: var(--card-bg);
      cursor: pointer; text-align: center; color: inherit; display: flex; flex-direction: column; gap: .55rem;
      min-width: 0;
    }
    .civica-choice.selected { border-color: var(--brand-red); background: #FDF2F4; }
    .civica-photo { display: block; aspect-ratio: 1 / 1; overflow: hidden; border-radius: 6px; background: #ececec; }
    .civica-choice img { width: 100%; height: 100%; object-fit: cover; object-position: top center; }
    .civica-choice h4 { font-size: .9rem; font-weight: 800; overflow-wrap: anywhere; }
    @media (max-width: 480px) {
      .survey-grid { grid-template-columns: 1fr; }
    }
  `,
})
export class SurveyPage {
  readonly i18n = inject(I18nService);
  readonly surveys = inject(SurveyService);
  readonly copied = signal(false);
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
