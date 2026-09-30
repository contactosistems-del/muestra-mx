import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { I18nService } from '../../core/services/i18n.service';
import { SurveyService } from '../../core/services/survey.service';
import type { Survey, SurveyDraft } from '../../domain/models';

type OptionForm = {
  id: string;
  label: string;
  voteValue: string;
  aliases: string[];
  imageUrl: string;
  preview: string;
  file: File | null;
};

@Component({
  selector: 'app-survey-cms',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <section class="cms-block">
      <div class="head">
        <div>
          <h3>{{ i18n.t('surveyCmsTitle') }}</h3>
          <p class="cms-lead">{{ i18n.t('surveyCmsLead') }}</p>
        </div>
        <div class="head-actions">
          <button type="button" class="ghost" (click)="newSurvey()">{{ i18n.t('surveyNew') }}</button>
          <button type="button" class="ghost" [disabled]="busy()" (click)="seed()">{{ i18n.t('surveySeed') }}</button>
        </div>
      </div>

      @if (message()) {
        <p class="cms-msg" [class.err]="messageError()">{{ message() }}</p>
      }

      <div class="layout">
        <div class="list">
          @for (item of surveys.adminSurveys(); track item.id) {
            <button type="button" class="list-item" [class.active]="editingId() === item.id" (click)="edit(item)">
              <strong>{{ i18n.tx(item.title) }}</strong>
              <span>{{ item.options.length }} {{ i18n.t('surveyCandidates') }} · /encuesta/{{ item.id }}</span>
            </button>
          } @empty {
            <p class="empty">{{ i18n.t('surveyEmpty') }}</p>
          }
        </div>

        <form class="cms-card" (ngSubmit)="save()">
        <h4>{{ editingId() ? i18n.t('surveyEdit') : i18n.t('surveyNew') }}</h4>
        <div class="grid">
          <div class="input-group">
            <label>{{ i18n.t('surveyId') }}</label>
            <input name="id" [(ngModel)]="formId" [disabled]="!!editingId()" required placeholder="cancun-2027" />
          </div>
          <div class="input-group">
            <label>{{ i18n.t('surveyShort') }}</label>
            <input name="short" [(ngModel)]="formShort" required />
          </div>
          <div class="input-group">
            <label>{{ i18n.t('surveyCity') }}</label>
            <input name="city" [(ngModel)]="formCity" required />
          </div>
          <div class="input-group">
            <label>{{ i18n.t('surveySort') }}</label>
            <input name="sort" type="number" [(ngModel)]="formSort" />
          </div>
        </div>
        <div class="input-group">
          <label>{{ i18n.t('newsTitleField') }}</label>
          <input name="title" [(ngModel)]="formTitle" required />
        </div>
        <div class="input-group">
          <label>{{ i18n.t('surveyQuestion') }}</label>
          <textarea name="question" rows="2" [(ngModel)]="formQuestion" required></textarea>
        </div>
        <div class="flags">
          <label><input type="checkbox" name="active" [(ngModel)]="formActive" /> {{ i18n.t('surveyActive') }}</label>
          <label><input type="checkbox" name="nav" [(ngModel)]="formNav" /> {{ i18n.t('surveyShowNav') }}</label>
        </div>

        <div class="opts-head">
          <h5>{{ i18n.t('surveyCandidates') }}</h5>
          <button type="button" class="ghost" (click)="addOption()">{{ i18n.t('surveyAddCandidate') }}</button>
        </div>
        @for (opt of options; track $index; let i = $index) {
          <div class="opt-row">
            <input [name]="'label' + i" [(ngModel)]="opt.label" [placeholder]="i18n.t('surveyCandidateName')" required />
            <input [name]="'vote' + i" [(ngModel)]="opt.voteValue" [placeholder]="i18n.t('surveyVoteValue')" />
            <input type="file" accept="image/*" (change)="onOptionFile($event, i)" />
            @if (opt.preview) {
              <img [src]="opt.preview" alt="" />
            }
            <button type="button" class="danger" (click)="removeOption(i)" [disabled]="options.length <= 2">×</button>
          </div>
        }

        <div class="form-actions">
          <button class="btn-votar-activo" type="submit" [disabled]="busy()">{{ i18n.t('cmsSave') }}</button>
          @if (editingId()) {
            <button type="button" class="danger" [disabled]="busy()" (click)="remove()">{{ i18n.t('surveyDelete') }}</button>
          }
        </div>
      </form>
      </div>
    </section>
  `,
  styles: `
    .cms-block { margin: 0; border: none; padding: 0; }
    .head { display: flex; justify-content: space-between; gap: 1rem; flex-wrap: wrap; align-items: flex-start; margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border-color); }
    .head h3 { margin: 0 0 .3rem; font-size: 1.05rem; font-weight: 900; }
    .head-actions { display: flex; gap: .5rem; }
    .cms-lead { color: var(--text-muted); font-size: .84rem; margin: 0; max-width: 40rem; line-height: 1.4; }
    .cms-msg { padding: .55rem .75rem; border-radius: 6px; font-size: .8rem; font-weight: 700; margin-bottom: 1rem; background: #DCFCE7; color: #166534; }
    .cms-msg.err { background: #FEE2E2; color: #991B1B; }
    .layout { display: grid; grid-template-columns: 1fr; gap: 1rem; }
    @media (min-width: 992px) { .layout { grid-template-columns: .9fr 1.1fr; } }
    .list { display: flex; flex-direction: column; gap: .45rem; max-height: 420px; overflow: auto; }
    .list-item { text-align: left; border: 1px solid var(--border-color); background: var(--bg-color); border-radius: 8px; padding: .75rem .85rem; cursor: pointer; display: flex; flex-direction: column; gap: .2rem; }
    .list-item.active { border-color: var(--brand-red); box-shadow: inset 3px 0 0 var(--brand-red); }
    .list-item span { color: var(--text-muted); font-size: .75rem; }
    .empty { color: var(--text-muted); font-size: .85rem; }
    .cms-card { background: var(--bg-color); border: 1px solid var(--border-color); border-radius: 10px; padding: 1rem; }
    .cms-card h4 { font-size: .9rem; font-weight: 900; margin: 0 0 .8rem; color: var(--brand-red); }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 160px), 1fr)); gap: .75rem; }
    .flags { display: flex; gap: 1rem; flex-wrap: wrap; margin: .6rem 0 1rem; font-size: .82rem; font-weight: 700; }
    .opts-head { display: flex; justify-content: space-between; align-items: center; margin: .5rem 0; flex-wrap: wrap; gap: .5rem; }
    .opts-head h5 { font-size: .82rem; font-weight: 900; margin: 0; }
    .opt-row { display: grid; grid-template-columns: 1fr; gap: .45rem; align-items: center; margin-bottom: .55rem; }
    @media (min-width: 992px) {
      .opt-row { grid-template-columns: 1.4fr 1fr auto auto auto; }
    }
    .opt-row img { width: 42px; height: 42px; object-fit: cover; border-radius: 6px; }
    .ghost, .danger { border: none; padding: .45rem .8rem; border-radius: 6px; font-weight: 800; cursor: pointer; color: #FFF; font-size: .75rem; }
    .ghost { background: #64748B; }
    .danger { background: #EF4444; }
    .form-actions { display: flex; gap: .6rem; margin-top: 1rem; flex-wrap: wrap; }
  `,
})
export class SurveyCms {
  readonly i18n = inject(I18nService);
  readonly surveys = inject(SurveyService);
  readonly editingId = signal<string | null>(null);
  readonly busy = signal(false);
  readonly message = signal('');
  readonly messageError = signal(false);

  formId = '';
  formShort = '';
  formCity = '';
  formTitle = '';
  formQuestion = '';
  formSort = 100;
  formActive = true;
  formNav = true;
  options: OptionForm[] = [this.blankOption('opt-1'), this.blankOption('opt-2')];

  newSurvey(): void {
    this.editingId.set(null);
    this.formId = '';
    this.formShort = '';
    this.formCity = '';
    this.formTitle = '';
    this.formQuestion = '';
    this.formSort = (this.surveys.adminSurveys().length + 1) * 10;
    this.formActive = true;
    this.formNav = true;
    this.options = [this.blankOption('opt-1'), this.blankOption('opt-2')];
  }

  edit(item: Survey): void {
    this.editingId.set(item.id);
    this.formId = item.id;
    this.formShort = item.shortLabel.es;
    this.formCity = item.city.es;
    this.formTitle = item.title.es;
    this.formQuestion = item.question.es;
    this.formSort = item.sortOrder;
    this.formActive = item.active;
    this.formNav = item.showInNav;
    this.options = item.options.map((opt) => ({
      id: opt.id,
      label: opt.label,
      voteValue: opt.voteValue ?? '',
      aliases: opt.aliases ?? [],
      imageUrl: opt.imageUrl ?? '',
      preview: opt.imageUrl ?? '',
      file: null,
    }));
    if (this.options.length < 2) {
      this.options.push(this.blankOption(`opt-${this.options.length + 1}`));
    }
  }

  addOption(): void {
    this.options = [...this.options, this.blankOption(`opt-${this.options.length + 1}`)];
  }

  removeOption(index: number): void {
    if (this.options.length <= 2) return;
    this.options = this.options.filter((_, i) => i !== index);
  }

  onOptionFile(event: Event, index: number): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    const current = this.options[index];
    if (!current) return;
    current.file = file;
    current.preview = file ? URL.createObjectURL(file) : current.imageUrl;
  }

  async save(): Promise<void> {
    this.busy.set(true);
    this.message.set('');
    this.messageError.set(false);
    try {
      const draft: SurveyDraft = {
        id: this.formId,
        active: this.formActive,
        showInNav: this.formNav,
        sortOrder: this.formSort,
        shortLabel: this.formShort,
        city: this.formCity,
        title: this.formTitle,
        question: this.formQuestion,
        options: this.options.map((opt) => ({
          id: opt.id,
          label: opt.label,
          voteValue: opt.voteValue,
          aliases: opt.aliases,
          imageUrl: opt.imageUrl,
          imageFile: opt.file,
        })),
      };
      await this.surveys.saveSurvey(draft);
      const id = draft.id
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9_-]+/g, '')
        .replace(/-+/g, '-')
        .slice(0, 64);
      this.editingId.set(id);
      this.message.set(this.i18n.t('cmsSaved'));
    } catch (err) {
      this.messageError.set(true);
      const msg = err instanceof Error ? err.message : '';
      if (msg === 'need-options') this.message.set(this.i18n.t('surveyNeedOptions'));
      else if (msg === 'invalid-id') this.message.set(this.i18n.t('surveyInvalidId'));
      else {
        const code = err && typeof err === 'object' && 'code' in err ? String(err.code) : '';
        this.message.set(code.includes('permission-denied') ? this.i18n.t('cmsDenied') : this.i18n.t('cmsError'));
      }
    } finally {
      this.busy.set(false);
    }
  }

  async remove(): Promise<void> {
    const id = this.editingId();
    if (!id) return;
    this.busy.set(true);
    try {
      await this.surveys.removeSurvey(id);
      this.newSurvey();
      this.message.set(this.i18n.t('cmsSaved'));
    } catch {
      this.messageError.set(true);
      this.message.set(this.i18n.t('cmsError'));
    } finally {
      this.busy.set(false);
    }
  }

  async seed(): Promise<void> {
    this.busy.set(true);
    this.message.set('');
    this.messageError.set(false);
    try {
      await this.surveys.seedDefaults();
      this.message.set(this.i18n.t('surveySeeded'));
    } catch {
      this.messageError.set(true);
      this.message.set(this.i18n.t('cmsError'));
    } finally {
      this.busy.set(false);
    }
  }

  private blankOption(id: string): OptionForm {
    return { id, label: '', voteValue: '', aliases: [], imageUrl: '', preview: '', file: null };
  }
}
