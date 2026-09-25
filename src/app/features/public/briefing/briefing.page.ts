import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18nService } from '../../../core/services/i18n.service';

@Component({
  selector: 'app-briefing-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="nosotros-section">
      <h3 class="page-title"><i class="fa-brands fa-youtube youtube"></i> {{ i18n.t('briefingTitle') }}</h3>
      <p class="muted">{{ i18n.t('briefingText') }}</p>
      <div class="live-box">
        <a href="https://www.youtube.com/@GobiernoDeMexico/live" target="_blank" rel="noopener" class="live-btn">
          <i class="fa-brands fa-youtube"></i> {{ i18n.t('watchLive') }}
        </a>
      </div>
    </section>
  `,
  styles: `
    .page-title { font-size: 1.8rem; font-weight: 800; margin-bottom: 1.5rem; }
    .youtube { color: #FF0000; }
    .muted { color: var(--text-muted); margin-bottom: 1.5rem; }
    .live-box { text-align: center; padding: 3rem; background: #000; border-radius: 10px; }
    .live-btn { background: #FF0000; color: #FFF; padding: 1rem 2rem; font-weight: 900; border-radius: 6px; display: inline-block; text-transform: uppercase; }
  `,
})
export class BriefingPage {
  readonly i18n = inject(I18nService);
}
