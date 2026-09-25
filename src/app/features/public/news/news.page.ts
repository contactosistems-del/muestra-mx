import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18nService } from '../../../core/services/i18n.service';
import { NewsService } from '../../../core/services/news.service';
import { newsCategoryLabel } from '../../../data/catalog';

@Component({
  selector: 'app-news-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="news-wrap" [attr.lang]="i18n.lang()">
      <div class="news-head">
        <h3>{{ i18n.t('newsTitle') }}</h3>
      </div>
      @if (news.loading()) {
        <p class="news-state">{{ i18n.t('newsLoading') }}</p>
      } @else if (news.items().length === 0) {
        <p class="news-state">{{ i18n.t('newsEmpty') }}</p>
      } @else {
        <div class="news-grid">
          @for (item of news.items(); track item.id + i18n.lang()) {
            <a class="news-card" [routerLink]="['/noticias', item.id]">
              <div class="news-media">
                <img [src]="item.imageUrl" [alt]="i18n.tx(item.title)" />
              </div>
              <div class="news-body">
                <span class="badge">{{ i18n.tx(newsCategoryLabel(item.categoryId)) }}</span>
                <h4>{{ i18n.tx(item.title) }}</h4>
                <p>{{ excerpt(i18n.tx(item.body)) }}</p>
                <small>{{ i18n.t('publishedOn') }} {{ i18n.formatDate(item.publishedAt) }}</small>
                <span class="read-more">{{ i18n.t('newsReadMore') }}</span>
              </div>
            </a>
          }
        </div>
      }
    </section>
  `,
  styles: `
    .news-wrap { margin-top: 3.5rem; min-width: 0; }
    @media (max-width: 720px) {
      .news-wrap { margin-top: 1.75rem; }
    }
    .news-head { display: flex; justify-content: space-between; border-bottom: 3px solid var(--text-color); padding-bottom: .6rem; margin-bottom: 1.5rem; min-width: 0; }
    .news-head h3 { font-size: clamp(1.2rem, 3vw, 1.8rem); font-weight: 800; text-transform: uppercase; line-height: 1.2; }
    .news-state { color: var(--text-muted); padding: 1rem 0; }
    .news-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr)); gap: 1.5rem; }
    .news-card {
      background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 10px; overflow: hidden;
      min-width: 0; color: inherit; display: flex; flex-direction: column; transition: border-color .2s, transform .2s;
    }
    .news-card:hover { border-color: var(--brand-red); transform: translateY(-2px); }
    .news-media { aspect-ratio: 16 / 10; background: #111; overflow: hidden; }
    .news-card img { width: 100%; height: 100%; object-fit: cover; object-position: top center; }
    .news-body { padding: 1rem; min-width: 0; display: flex; flex-direction: column; flex: 1; }
    .news-body h4 { font-size: 1rem; font-weight: 800; margin: .6rem 0; overflow-wrap: anywhere; }
    .news-body p { color: var(--text-muted); font-size: .88rem; margin-bottom: .6rem; overflow-wrap: anywhere; flex: 1; }
    .news-body small { color: var(--text-muted); }
    .read-more { margin-top: .8rem; font-size: .78rem; font-weight: 800; color: var(--brand-red); text-transform: uppercase; }
  `,
})
export class NewsPage {
  readonly i18n = inject(I18nService);
  readonly news = inject(NewsService);
  readonly newsCategoryLabel = newsCategoryLabel;

  excerpt(text: string): string {
    const clean = text.trim();
    return clean.length > 140 ? `${clean.slice(0, 140).trim()}…` : clean;
  }
}
