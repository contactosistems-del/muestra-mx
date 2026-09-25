import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18nService } from '../../../core/services/i18n.service';

@Component({
  selector: 'app-about-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="nosotros-section" [attr.lang]="i18n.lang()">
      <h3 class="page-title"><i class="fa-solid fa-users-viewfinder"></i> {{ i18n.t('aboutTitle') }}</h3>
      <p class="muted">{{ i18n.t('aboutLead') }}</p>
      <div class="nosotros-grid">
        <div class="nosotros-card">
          <h4>{{ i18n.t('aboutSurveys') }}</h4>
          <p>{{ i18n.t('aboutSurveysText') }}</p>
        </div>
        <div class="nosotros-card">
          <h4>{{ i18n.t('aboutConsulting') }}</h4>
          <p>{{ i18n.t('aboutConsultingText') }}</p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .page-title { font-size: 1.8rem; font-weight: 800; margin-bottom: .5rem; }
    .page-title i { color: var(--brand-red); }
    .muted { font-size: .9rem; color: var(--text-muted); margin-bottom: 1.5rem; }
  `,
})
export class AboutPage {
  readonly i18n = inject(I18nService);
}
