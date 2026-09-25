import { afterNextRender, ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { I18nService } from '../../core/services/i18n.service';
import { NewsService } from '../../core/services/news.service';
import { SurveyService } from '../../core/services/survey.service';
import { ThemeService } from '../../core/services/theme.service';
import type { Lang } from '../../domain/models';
import { Chatbot } from '../../shared/chatbot/chatbot';
import { LoginModal } from '../admin/login-modal';
import { NewsEditor } from '../admin/news-editor';
import { SurveyModal } from '../survey/survey-modal';

@Component({
  selector: 'app-public-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Chatbot, SurveyModal, LoginModal, NewsEditor],
  templateUrl: './public-shell.html',
  host: { class: 'notranslate', translate: 'no' },
})
export class PublicShell {
  readonly i18n = inject(I18nService);
  readonly theme = inject(ThemeService);
  readonly auth = inject(AuthService);
  readonly surveys = inject(SurveyService);
  readonly news = inject(NewsService);
  readonly splash = signal(true);
  readonly loginOpen = signal(false);

  readonly links = [
    { path: '/', key: 'navHome' as const, exact: true },
    { path: '/mananera', key: 'navBriefing' as const, exact: false },
    { path: '/entrevista', key: 'navInterviews' as const, exact: false },
    { path: '/nosotros', key: 'navAbout' as const, exact: false },
    { path: '/noticias', key: 'navNews' as const, exact: false },
    { path: '/contacto', key: 'navContact' as const, exact: false },
  ];

  constructor() {
    this.theme.apply();
    this.i18n.setLang(this.i18n.lang());
    afterNextRender(() => {
      setTimeout(() => this.splash.set(false), 1500);
    });
  }

  onLangChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    if (value === 'es' || value === 'en') this.i18n.setLang(value as Lang);
  }

  onLogoDblClick(): void {
    if (!this.auth.isAdmin()) this.loginOpen.set(true);
  }
}
