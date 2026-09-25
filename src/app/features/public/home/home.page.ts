import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContentService } from '../../../core/services/content.service';
import { I18nService } from '../../../core/services/i18n.service';
import { NewsService } from '../../../core/services/news.service';
import { SurveyService } from '../../../core/services/survey.service';
import { newsCategoryLabel } from '../../../data/catalog';

@Component({
  selector: 'app-home-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="main-grid" [attr.lang]="i18n.lang()">
      <section class="hero-slider-container">
        <img [src]="content.featured().imageUrl" class="slide-img-real" [alt]="i18n.t('heroAlt')" />
        <div class="slide-overlay">
          <div class="slide-content">
            <span class="badge">{{ i18n.tx(content.featured().badge) }}</span>
            <h2>{{ i18n.tx(content.featured().title) }}</h2>
            <p>{{ i18n.tx(content.featured().text) }}</p>
            <a class="btn-leer" [routerLink]="content.featured().ctaPath">{{ i18n.t('takeSurvey') }}</a>
          </div>
        </div>
      </section>

      <aside>
        <div class="sidebar-widget sponsor-card">
          <a [routerLink]="content.sponsor().linkPath" class="sponsor-media">
            <img [src]="content.sponsor().imageUrl" [alt]="i18n.t('sponsorAlt')" />
          </a>
          <div class="sponsor-body">
            <span class="badge">{{ i18n.tx(content.sponsor().badge) }}</span>
            <h5>{{ i18n.tx(content.sponsor().name) }}</h5>
            <a [routerLink]="content.sponsor().linkPath" class="btn-votar-activo sponsor-cta">{{ i18n.t('seeInterview') }}</a>
          </div>
        </div>

        <div class="sidebar-widget">
          <div class="widget-header"><i class="fa-solid fa-chart-column"></i> {{ i18n.t('polls') }}</div>
          <div class="widget-content">
            @for (survey of surveys.surveys(); track survey.id; let last = $last) {
              <div class="poll-block" [class.poll-divider]="!last">
                <div class="poll-city">{{ i18n.tx(survey.city) }}</div>
                <div class="poll-question">{{ i18n.tx(survey.question) }}</div>
                <a class="btn-votar" [routerLink]="['/encuesta', survey.id]">{{ i18n.t('takeSurvey') }}</a>
              </div>
            }
          </div>
        </div>
      </aside>
    </div>

    <section class="results-section" [attr.lang]="i18n.lang()">
      <div class="results-head">
        <h3><i class="fa-solid fa-chart-pie"></i> {{ i18n.t('liveResults') }}</h3>
      </div>
      <div class="results-grid">
        @for (survey of surveys.surveys(); track survey.id) {
          @if (surveys.resultById(survey.id); as result) {
            <article class="result-card">
              <div class="result-top">
                <div>
                  <div class="poll-city">{{ i18n.tx(survey.city) }}</div>
                  <h4>{{ i18n.tx(survey.title) }}</h4>
                </div>
                <div class="result-total">
                  <strong>{{ result.total }}</strong>
                  <span>{{ i18n.t('totalVotes') }}</span>
                </div>
              </div>
              @if (result.total === 0) {
                <p class="empty">{{ i18n.t('noVotesYet') }}</p>
              } @else {
                <ul class="bars">
                  @for (opt of result.options; track opt.label) {
                    <li>
                      <div class="bar-meta">
                        <span>{{ opt.label }}</span>
                        <strong>{{ opt.percent }}%</strong>
                      </div>
                      <div class="bar-track">
                        <div class="bar-fill" [style.width.%]="opt.percent"></div>
                      </div>
                    </li>
                  }
                </ul>
              }
              <a class="btn-votar result-cta" [routerLink]="['/encuesta', survey.id]">{{ i18n.t('takeSurvey') }}</a>
            </article>
          }
        }
      </div>
    </section>

    <section class="home-news" [attr.lang]="i18n.lang()">
      <div class="results-head news-head">
        <h3>{{ i18n.t('newsTitle') }}</h3>
        <a routerLink="/noticias" class="see-all">{{ i18n.t('newsSeeAll') }}</a>
      </div>
      @if (news.loading()) {
        <p class="empty">{{ i18n.t('newsLoading') }}</p>
      } @else if (latestNews().length === 0) {
        <p class="empty">{{ i18n.t('newsEmpty') }}</p>
      } @else {
        <div class="news-grid">
          @for (item of latestNews(); track item.id + i18n.lang()) {
            <a class="news-card" [routerLink]="['/noticias', item.id]">
              <div class="news-media">
                <img [src]="item.imageUrl" [alt]="i18n.tx(item.title)" />
              </div>
              <div class="news-body">
                <span class="badge">{{ i18n.tx(newsCategoryLabel(item.categoryId)) }}</span>
                <h4>{{ i18n.tx(item.title) }}</h4>
                <p>{{ excerpt(i18n.tx(item.body)) }}</p>
                <span class="read-more">{{ i18n.t('newsReadMore') }}</span>
              </div>
            </a>
          }
        </div>
      }
    </section>
  `,
  styles: `
    .sponsor-card { border: 2px solid #0EA5E9; text-align: center; background: #0A0A0A; }
    .sponsor-media { display: block; aspect-ratio: 16 / 9; background: #071018; overflow: hidden; }
    .sponsor-card img { width: 100%; height: 100%; object-fit: cover; object-position: 75% center; display: block; }
    .sponsor-body { padding: .8rem; background: var(--card-bg); }
    .sponsor-body .badge { font-size: .65rem; margin-bottom: .3rem; }
    .sponsor-body h5 { font-size: .82rem; font-weight: 800; margin-bottom: .4rem; }
    .sponsor-cta { display: inline-block; padding: .4rem; font-size: .7rem; text-align: center; }
    .poll-city { font-size: .82rem; color: var(--brand-red); font-weight: 800; margin-bottom: .4rem; }
    .poll-divider { padding-bottom: 1.2rem; margin-bottom: 1.2rem; border-bottom: 1px solid #ddd; }
    .results-section, .home-news { margin: 2.5rem 0 1rem; }
    .results-head { border-bottom: 3px solid var(--text-color); padding-bottom: .55rem; margin-bottom: 1.2rem; }
    .news-head { display: flex; justify-content: space-between; align-items: end; gap: 1rem; }
    .results-head h3 { font-size: clamp(1.15rem, 2.5vw, 1.55rem); font-weight: 900; text-transform: uppercase; }
    .results-head i { color: var(--brand-red); margin-right: .35rem; }
    .see-all { font-size: .78rem; font-weight: 800; color: var(--brand-red); text-transform: uppercase; white-space: nowrap; }
    .results-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr)); gap: 1.2rem; }
    .result-card { background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 10px; padding: 1.1rem; }
    .result-top { display: flex; justify-content: space-between; gap: 1rem; align-items: flex-start; margin-bottom: 1rem; }
    .result-top h4 { font-size: 1rem; font-weight: 900; line-height: 1.25; }
    .result-total { text-align: right; min-width: 5rem; }
    .result-total strong { display: block; font-size: 1.4rem; color: var(--brand-red); line-height: 1; }
    .result-total span { font-size: .68rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; }
    .empty { color: var(--text-muted); font-size: .88rem; margin-bottom: 1rem; }
    .bars { list-style: none; display: flex; flex-direction: column; gap: .75rem; margin-bottom: 1rem; }
    .bar-meta { display: flex; justify-content: space-between; gap: .8rem; font-size: .82rem; font-weight: 700; margin-bottom: .3rem; }
    .bar-track { height: 10px; background: #E5E7EB; border-radius: 999px; overflow: hidden; }
    .bar-fill { height: 100%; background: var(--brand-red); border-radius: 999px; min-width: 0; transition: width .35s ease; }
    .result-cta { display: inline-flex; justify-content: center; margin-top: .2rem; }
    .news-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr)); gap: 1.2rem; }
    .news-card {
      background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 10px; overflow: hidden;
      color: inherit; display: flex; flex-direction: column; min-width: 0; transition: border-color .2s, transform .2s;
    }
    .news-card:hover { border-color: var(--brand-red); transform: translateY(-2px); }
    .news-media { aspect-ratio: 16 / 10; background: #111; overflow: hidden; }
    .news-media img { width: 100%; height: 100%; object-fit: cover; object-position: top center; }
    .news-body { padding: 1rem; display: flex; flex-direction: column; flex: 1; min-width: 0; }
    .news-body h4 { font-size: 1rem; font-weight: 800; margin: .55rem 0; overflow-wrap: anywhere; }
    .news-body p { color: var(--text-muted); font-size: .86rem; flex: 1; overflow-wrap: anywhere; }
    .read-more { margin-top: .75rem; font-size: .75rem; font-weight: 800; color: var(--brand-red); text-transform: uppercase; }
  `,
})
export class HomePage {
  readonly i18n = inject(I18nService);
  readonly surveys = inject(SurveyService);
  readonly content = inject(ContentService);
  readonly news = inject(NewsService);
  readonly newsCategoryLabel = newsCategoryLabel;
  readonly latestNews = computed(() => this.news.items().slice(0, 3));

  excerpt(text: string): string {
    const clean = text.trim();
    return clean.length > 120 ? `${clean.slice(0, 120).trim()}…` : clean;
  }
}
