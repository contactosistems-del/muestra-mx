import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ContentService } from '../../core/services/content.service';
import { I18nService } from '../../core/services/i18n.service';

@Component({
  selector: 'app-content-cms',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <section class="cms-block">
      <h3>{{ i18n.t('cmsTitle') }}</h3>
      <p class="cms-lead">{{ i18n.t('cmsLead') }}</p>
      @if (message()) {
        <p class="cms-msg" [class.err]="messageError()">{{ message() }}</p>
      }

      <div class="cms-grid">
        <form class="cms-card" (ngSubmit)="saveFeatured()">
          <h4>{{ i18n.t('cmsFeatured') }}</h4>
          <div class="input-group">
            <label>{{ i18n.t('newsCategory') }} / badge</label>
            <input name="fBadge" [(ngModel)]="featuredBadge" required />
          </div>
          <div class="input-group">
            <label>{{ i18n.t('newsTitleField') }}</label>
            <input name="fTitle" [(ngModel)]="featuredTitle" required />
          </div>
          <div class="input-group">
            <label>{{ i18n.t('newsBody') }}</label>
            <textarea name="fText" rows="3" [(ngModel)]="featuredText" required></textarea>
          </div>
          <div class="input-group">
            <label>{{ i18n.t('cmsCtaPath') }}</label>
            <input name="fCta" [(ngModel)]="featuredCta" placeholder="/encuesta/playa-2027" />
          </div>
          <div class="input-group">
            <label>{{ i18n.t('newsImage') }}</label>
            <input type="file" accept="image/*" (change)="onFeaturedFile($event)" />
            @if (featuredPreview()) {
              <img class="preview" [src]="featuredPreview()" alt="" />
            }
          </div>
          <button class="btn-votar-activo" type="submit" [disabled]="content.busy()">{{ i18n.t('cmsSave') }}</button>
        </form>

        <form class="cms-card" (ngSubmit)="saveSponsor()">
          <h4>{{ i18n.t('cmsSponsor') }}</h4>
          <div class="input-group">
            <label>{{ i18n.t('sponsor') }}</label>
            <input name="sBadge" [(ngModel)]="sponsorBadge" required />
          </div>
          <div class="input-group">
            <label>{{ i18n.t('sponsorName') }}</label>
            <input name="sName" [(ngModel)]="sponsorName" required />
          </div>
          <div class="input-group">
            <label>{{ i18n.t('cmsLinkPath') }}</label>
            <input name="sLink" [(ngModel)]="sponsorLink" placeholder="/entrevista" />
          </div>
          <div class="input-group">
            <label>{{ i18n.t('newsImage') }}</label>
            <input type="file" accept="image/*" (change)="onSponsorFile($event)" />
            @if (sponsorPreview()) {
              <img class="preview" [src]="sponsorPreview()" alt="" />
            }
          </div>
          <button class="btn-votar-activo" type="submit" [disabled]="content.busy()">{{ i18n.t('cmsSave') }}</button>
        </form>

        <form class="cms-card wide" (ngSubmit)="saveInterview()">
          <h4>{{ i18n.t('cmsInterview') }}</h4>
          <div class="input-group">
            <label>{{ i18n.t('newsCategory') }}</label>
            <input name="iCat" [(ngModel)]="interviewCategory" required />
          </div>
          <div class="input-group">
            <label>{{ i18n.t('newsTitleField') }}</label>
            <input name="iTitle" [(ngModel)]="interviewTitle" required />
          </div>
          <div class="input-group">
            <label>{{ i18n.t('cmsInterviewee') }}</label>
            <input name="iPerson" [(ngModel)]="interviewPerson" required />
          </div>
          <div class="input-group">
            <label>{{ i18n.t('cmsCaption') }}</label>
            <input name="iCap" [(ngModel)]="interviewCaption" required />
          </div>
          <div class="input-group">
            <label>{{ i18n.t('newsBody') }}</label>
            <textarea name="iIntro" rows="4" [(ngModel)]="interviewIntro" required></textarea>
          </div>
          <div class="input-group">
            <label>{{ i18n.t('cmsQuote') }}</label>
            <textarea name="iQuote" rows="2" [(ngModel)]="interviewQuote" required></textarea>
          </div>
          <div class="input-group">
            <label>{{ i18n.t('newsImage') }}</label>
            <input type="file" accept="image/*" (change)="onInterviewFile($event)" />
            @if (interviewPreview()) {
              <img class="preview" [src]="interviewPreview()" alt="" />
            }
          </div>
          <button class="btn-votar-activo" type="submit" [disabled]="content.busy()">{{ i18n.t('cmsSave') }}</button>
        </form>
      </div>
    </section>
  `,
  styles: `
    .cms-block { margin: 0; border: none; padding: 0; }
    .cms-block > h3 { margin: 0 0 .3rem; font-size: 1.05rem; font-weight: 900; }
    .cms-lead { color: var(--text-muted); font-size: .84rem; margin: 0 0 1rem; max-width: 42rem; line-height: 1.4; }
    .cms-msg { padding: .55rem .75rem; border-radius: 6px; font-size: .8rem; font-weight: 700; margin-bottom: 1rem; background: #DCFCE7; color: #166534; }
    .cms-msg.err { background: #FEE2E2; color: #991B1B; }
    .cms-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; }
    .cms-card { background: var(--bg-color); border: 1px solid var(--border-color); border-radius: 10px; padding: 1rem; }
    .cms-card.wide { grid-column: 1 / -1; }
    .cms-card h4 { font-size: .9rem; font-weight: 900; margin: 0 0 .8rem; color: var(--brand-red); }
    .preview { margin-top: .5rem; width: 100%; max-height: 140px; object-fit: cover; border-radius: 8px; }
  `,
})
export class ContentCms {
  readonly i18n = inject(I18nService);
  readonly content = inject(ContentService);
  readonly message = signal('');
  readonly messageError = signal(false);
  readonly featuredPreview = signal('');
  readonly sponsorPreview = signal('');
  readonly interviewPreview = signal('');

  featuredBadge = '';
  featuredTitle = '';
  featuredText = '';
  featuredCta = '';
  private featuredFile: File | null = null;

  sponsorBadge = '';
  sponsorName = '';
  sponsorLink = '';
  private sponsorFile: File | null = null;

  interviewCategory = '';
  interviewTitle = '';
  interviewPerson = '';
  interviewCaption = '';
  interviewIntro = '';
  interviewQuote = '';
  private interviewFile: File | null = null;

  constructor() {
    const featured = this.content.featured();
    this.featuredBadge = featured.badge.es;
    this.featuredTitle = featured.title.es;
    this.featuredText = featured.text.es;
    this.featuredCta = featured.ctaPath;
    this.featuredPreview.set(featured.imageUrl);

    const sponsor = this.content.sponsor();
    this.sponsorBadge = sponsor.badge.es;
    this.sponsorName = sponsor.name.es;
    this.sponsorLink = sponsor.linkPath;
    this.sponsorPreview.set(sponsor.imageUrl);

    const interview = this.content.interview();
    this.interviewCategory = interview.category.es;
    this.interviewTitle = interview.title.es;
    this.interviewPerson = interview.interviewee.es;
    this.interviewCaption = interview.caption.es;
    this.interviewIntro = interview.intro.es;
    this.interviewQuote = interview.quote.es;
    this.interviewPreview.set(interview.imageUrl);
  }

  onFeaturedFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.featuredFile = file;
    this.featuredPreview.set(file ? URL.createObjectURL(file) : this.content.featured().imageUrl);
  }

  onSponsorFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.sponsorFile = file;
    this.sponsorPreview.set(file ? URL.createObjectURL(file) : this.content.sponsor().imageUrl);
  }

  onInterviewFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.interviewFile = file;
    this.interviewPreview.set(file ? URL.createObjectURL(file) : this.content.interview().imageUrl);
  }

  async saveFeatured(): Promise<void> {
    await this.run(async () => {
      await this.content.saveFeatured({
        badge: this.featuredBadge,
        title: this.featuredTitle,
        text: this.featuredText,
        ctaPath: this.featuredCta,
        image: this.featuredFile,
      });
      this.featuredFile = null;
    });
  }

  async saveSponsor(): Promise<void> {
    await this.run(async () => {
      await this.content.saveSponsor({
        badge: this.sponsorBadge,
        name: this.sponsorName,
        linkPath: this.sponsorLink,
        image: this.sponsorFile,
      });
      this.sponsorFile = null;
    });
  }

  async saveInterview(): Promise<void> {
    await this.run(async () => {
      await this.content.saveInterview({
        category: this.interviewCategory,
        title: this.interviewTitle,
        interviewee: this.interviewPerson,
        caption: this.interviewCaption,
        intro: this.interviewIntro,
        quote: this.interviewQuote,
        image: this.interviewFile,
      });
      this.interviewFile = null;
    });
  }

  private async run(action: () => Promise<void>): Promise<void> {
    this.message.set('');
    this.messageError.set(false);
    try {
      await action();
      this.message.set(this.i18n.t('cmsSaved'));
    } catch (err) {
      this.messageError.set(true);
      const code = err && typeof err === 'object' && 'code' in err ? String(err.code) : '';
      this.message.set(code.includes('permission-denied') ? this.i18n.t('cmsDenied') : this.i18n.t('cmsError'));
    }
  }
}
