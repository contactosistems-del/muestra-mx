import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SurveyService } from '../../core/services/survey.service';
import { I18nService } from '../../core/services/i18n.service';

@Component({
  selector: 'app-survey-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    @if (surveys.modalOpen()) {
      @if (surveys.openId(); as id) {
      @if (surveys.surveyById(id); as survey) {
        <div class="modal-overlay-civica active" (click)="surveys.closeModal()">
          <div class="modal-box" [class.tulum-box]="!!survey.options[0]?.imageUrl" (click)="$event.stopPropagation()">
            <button class="btn-close" type="button" (click)="surveys.closeModal()">&times;</button>
            @if (!survey.options[0]?.imageUrl) {
              <div class="survey-hero">
                <span class="badge"><i class="fa-solid fa-bullhorn"></i> {{ i18n.t('openPoll') }}</span>
                <h2>{{ i18n.tx(survey.city) }}</h2>
              </div>
            } @else {
              <div class="survey-city">{{ i18n.tx(survey.city) }}</div>
              <h3>{{ i18n.tx(survey.title) }}</h3>
            }
            <div class="survey-body">
              @if (surveys.status()) {
                <div class="survey-alert">{{ surveys.status() }}</div>
              }
              <p class="poll-question">{{ i18n.tx(survey.question) }}</p>
              <div class="survey-grid">
                @for (opt of survey.options; track opt.id) {
                  <button
                    type="button"
                    class="civica-choice"
                    [class.selected]="surveys.selected() === (opt.voteValue ?? opt.label)"
                    (click)="surveys.select(opt.voteValue ?? opt.label)"
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
            </div>
          </div>
        </div>
      }
      }
    }
  `,
  styles: `
    .survey-hero {
      height: 130px;
      background: linear-gradient(rgba(0,0,0,.5), rgba(0,0,0,.7)),
        url('https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&w=800&q=80') center/cover;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      color: #fff; text-align: center; padding: 1rem;
    }
    .survey-hero h2 { font-size: 1.25rem; font-weight: 900; }
    .survey-city { font-size: .82rem; color: var(--brand-red); font-weight: 800; text-align: center; margin: 1.2rem 0 .4rem; }
    .survey-body { padding: 1.5rem; }
    .survey-alert { padding: .75rem; border-radius: 6px; font-size: .85rem; font-weight: 700; margin-bottom: 1rem; text-align: center; background: #FEF3C7; color: #92400E; }
    .survey-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .8rem; margin: 1.2rem 0 1.5rem; }
    .civica-choice {
      border: 2px solid var(--brand-gray); padding: .6rem; border-radius: 8px; background: var(--card-bg);
      cursor: pointer; text-align: center; color: inherit; display: flex; flex-direction: column; gap: .55rem;
    }
    .civica-choice.selected { border-color: var(--brand-red); background: #FDF2F4; }
    .civica-photo { display: block; aspect-ratio: 1 / 1; overflow: hidden; border-radius: 6px; background: #ececec; }
    .civica-choice img { width: 100%; height: 100%; object-fit: cover; object-position: top center; }
    .civica-choice h4 { font-size: .88rem; font-weight: 800; }
    .tulum-box { max-height: 90vh; overflow-y: auto; }
  `,
})
export class SurveyModal {
  readonly surveys = inject(SurveyService);
  readonly i18n = inject(I18nService);
}
