import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { I18nService, type I18nKey } from '../../core/services/i18n.service';
import { NewsService } from '../../core/services/news.service';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

@Component({
  selector: 'app-news-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  host: { class: 'notranslate', translate: 'no' },
  template: `
    <div class="modal-overlay active" (click)="news.editorOpen.set(false)">
      <div class="modal-box news-box" (click)="$event.stopPropagation()">
        <button class="btn-close" type="button" (click)="news.editorOpen.set(false)">&times;</button>
        <h3>{{ i18n.t('newsEditorTitle') }}</h3>
        @if (error()) {
          <p class="news-error">{{ error() }}</p>
        }
        <form (ngSubmit)="publish()">
          <div class="input-group">
            <label>{{ i18n.t('newsCategory') }}</label>
            <select name="category" [(ngModel)]="categoryId">
              @for (cat of categories; track cat.id) {
                <option [value]="cat.id">{{ i18n.t(cat.key) }}</option>
              }
            </select>
          </div>
          <div class="input-group">
            <label>{{ i18n.t('newsTitleField') }}</label>
            <input name="title" [(ngModel)]="title" required />
          </div>
          <div class="input-group">
            <label>{{ i18n.t('newsImage') }}</label>
            <input type="file" name="image" accept="image/*" (change)="onFile($event)" />
            @if (preview()) {
              <img class="preview" [src]="preview()" alt="" />
            }
          </div>
          <div class="input-group">
            <label>{{ i18n.t('newsBody') }}</label>
            <textarea name="body" rows="4" [(ngModel)]="body" required></textarea>
          </div>
          <button class="btn-votar-activo" type="submit" [disabled]="news.busy()">
            {{ news.busy() ? i18n.t('newsPublishing') : i18n.t('publish') }}
          </button>
        </form>
      </div>
    </div>
  `,
  styles: `
    .news-box { max-width: 550px; padding: 2rem; max-height: 90vh; overflow: auto; }
    .news-box h3 { font-size: 1.2rem; margin-bottom: 1rem; }
    .news-error { background: #FEE2E2; color: #991B1B; padding: .5rem; border-radius: 4px; font-size: .8rem; margin-bottom: .8rem; }
    .preview { margin-top: .6rem; width: 100%; max-height: 180px; object-fit: cover; border-radius: 8px; }
  `,
})
export class NewsEditor {
  readonly i18n = inject(I18nService);
  readonly news = inject(NewsService);
  readonly error = signal('');
  readonly preview = signal('');
  readonly categories: { id: string; key: I18nKey }[] = [
    { id: 'NACIONAL', key: 'catNacional' },
    { id: 'NOTICIAS', key: 'catNoticias' },
    { id: 'QUINTANA ROO', key: 'catQroo' },
    { id: 'MOVILIDAD', key: 'catMovilidad' },
  ];
  categoryId = 'NACIONAL';
  title = '';
  body = '';
  private file: File | null = null;

  onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.error.set('');
    if (!file) {
      this.file = null;
      this.preview.set('');
      return;
    }
    if (!file.type.startsWith('image/')) {
      this.error.set(this.i18n.t('newsImageType'));
      input.value = '';
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      this.error.set(this.i18n.t('newsImageSize'));
      input.value = '';
      return;
    }
    this.file = file;
    this.preview.set(URL.createObjectURL(file));
  }

  private publishError(err: unknown): string {
    const message = err instanceof Error ? err.message : '';
    if (message === 'image-too-large') return this.i18n.t('newsImageTooLarge');
    const code = err && typeof err === 'object' && 'code' in err ? String(err.code) : '';
    if (code.includes('permission-denied')) return this.i18n.t('newsPublishDenied');
    const detail = code || message;
    return detail ? `${this.i18n.t('newsPublishError')} ${detail}` : this.i18n.t('newsPublishError');
  }

  async publish(): Promise<void> {
    this.error.set('');
    if (!this.file) {
      this.error.set(this.i18n.t('newsImageRequired'));
      return;
    }
    try {
      await this.news.publish({
        categoryId: this.categoryId,
        title: this.title,
        body: this.body,
        image: this.file,
      });
      this.title = '';
      this.body = '';
      this.file = null;
      this.preview.set('');
    } catch (err) {
      this.error.set(this.publishError(err));
    }
  }
}
