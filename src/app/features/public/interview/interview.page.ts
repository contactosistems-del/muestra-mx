import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ContentService } from '../../../core/services/content.service';
import { I18nService } from '../../../core/services/i18n.service';

@Component({
  selector: 'app-interview-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="article-sheet" [attr.lang]="i18n.lang()">
      <div class="article-top">
        <span class="badge">{{ i18n.tx(content.interview().category) }}</span>
        <button type="button" class="share-btn" (click)="copy()">
          <i class="fa-solid fa-share-nodes"></i> {{ copied() ? i18n.t('copied') : i18n.t('copyLink') }}
        </button>
      </div>
      <h1>{{ i18n.tx(content.interview().title) }}</h1>
      <p class="byline">{{ i18n.tx(content.interview().interviewee) }}</p>
      <figure>
        <img [src]="content.interview().imageUrl" [alt]="i18n.tx(content.interview().interviewee)" />
        <figcaption>{{ i18n.tx(content.interview().caption) }}</figcaption>
      </figure>
      <p class="intro">{{ i18n.tx(content.interview().intro) }}</p>
      <blockquote>“{{ i18n.tx(content.interview().quote) }}”</blockquote>
    </article>
  `,
  styles: `
    .article-top { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem; }
    .share-btn { background: #25D366; color: #FFF; border: none; padding: .4rem .8rem; border-radius: 4px; font-size: .75rem; font-weight: 800; cursor: pointer; }
    h1 { font-size: clamp(1.6rem, 3vw, 2.4rem); font-weight: 900; line-height: 1.2; margin-bottom: 1rem; }
    .byline { font-size: .95rem; font-weight: 700; color: var(--brand-red); margin-bottom: 1.8rem; border-bottom: 2px solid var(--border-color); padding-bottom: 1rem; }
    figure { margin-bottom: 2rem; border-radius: 8px; overflow: hidden; border: 1px solid var(--border-color); background: #111; }
    img { width: 100%; aspect-ratio: 16 / 10; object-fit: cover; object-position: 12% center; display: block; }
    figcaption { font-size: .78rem; color: #FFF; padding: .6rem 1rem; background: rgba(0,0,0,.85); text-align: center; }
    .intro { font-size: 1rem; line-height: 1.7; color: var(--text-muted); margin-bottom: 1rem; white-space: pre-wrap; }
    blockquote { border-left: 4px solid var(--brand-red); padding-left: 1rem; font-style: italic; font-weight: 800; color: var(--text-color); margin: 1.5rem 0; }
  `,
})
export class InterviewPage {
  readonly i18n = inject(I18nService);
  readonly content = inject(ContentService);
  readonly copied = signal(false);

  async copy(): Promise<void> {
    await navigator.clipboard.writeText(location.href);
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 1800);
  }
}
