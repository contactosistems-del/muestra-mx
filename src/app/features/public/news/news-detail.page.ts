import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { I18nService } from '../../../core/services/i18n.service';
import { NewsService } from '../../../core/services/news.service';
import { newsCategoryLabel } from '../../../data/catalog';

@Component({
  selector: 'app-news-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    @if (item(); as item) {
      <article class="article-sheet news-detail" [attr.lang]="i18n.lang()">
        <div class="article-top">
          <a routerLink="/noticias" class="back-link">{{ i18n.t('newsBack') }}</a>
          <button type="button" class="share-btn" (click)="copy()">
            <i class="fa-solid fa-share-nodes"></i> {{ copied() ? i18n.t('copied') : i18n.t('copyLink') }}
          </button>
        </div>
        <span class="badge">{{ i18n.tx(newsCategoryLabel(item.categoryId)) }}</span>
        <h1>{{ i18n.tx(item.title) }}</h1>
        <p class="meta">{{ i18n.t('publishedOn') }} {{ i18n.formatDate(item.publishedAt) }}</p>
        @if (item.imageUrl) {
          <figure class="news-hero">
            <img [src]="item.imageUrl" [alt]="i18n.tx(item.title)" />
          </figure>
        }
        <div class="news-content">
          <p>{{ i18n.tx(item.body) }}</p>
        </div>
      </article>
    } @else if (news.loading()) {
      <section class="nosotros-section">
        <p>{{ i18n.t('newsLoading') }}</p>
      </section>
    } @else {
      <section class="nosotros-section">
        <p>{{ i18n.t('newsMissing') }}</p>
        <a routerLink="/noticias">{{ i18n.t('newsBack') }}</a>
      </section>
    }
  `,
  styles: `
    .news-detail { max-width: 860px; }
    .article-top { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem; }
    .back-link { font-size: .85rem; font-weight: 800; color: var(--brand-red); }
    .share-btn { background: #25D366; color: #FFF; border: none; padding: .4rem .8rem; border-radius: 4px; font-size: .75rem; font-weight: 800; cursor: pointer; }
    h1 { font-size: clamp(1.5rem, 3vw, 2.2rem); font-weight: 900; margin: .8rem 0 0.6rem; line-height: 1.2; overflow-wrap: anywhere; }
    .meta { color: var(--text-muted); font-size: .88rem; margin-bottom: 1.2rem; }
    .news-hero { margin: 0 0 1.5rem; border-radius: 10px; overflow: hidden; background: #111; border: 1px solid var(--border-color); }
    .news-hero img { display: block; width: 100%; max-height: 480px; object-fit: cover; object-position: top center; }
    .news-content p { font-size: 1.05rem; line-height: 1.7; color: var(--text-color); white-space: pre-wrap; overflow-wrap: anywhere; }
    @media (max-width: 720px) {
      .news-hero img { max-height: min(280px, 55vh); }
    }
  `,
})
export class NewsDetailPage {
  readonly i18n = inject(I18nService);
  readonly news = inject(NewsService);
  readonly newsCategoryLabel = newsCategoryLabel;
  readonly copied = signal(false);
  private readonly id = toSignal(inject(ActivatedRoute).paramMap.pipe(map((params) => params.get('id'))), {
    initialValue: null,
  });
  readonly item = computed(() => {
    const id = this.id();
    return id ? this.news.byId(id) : undefined;
  });

  async copy(): Promise<void> {
    await navigator.clipboard.writeText(location.href);
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 1800);
  }
}
