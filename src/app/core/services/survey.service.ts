import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { SURVEY_SEEDS } from '../../data/catalog';
import type { Survey, SurveyDraft, SurveyOption, SurveyOptionTally, SurveyResult, VoteRecord } from '../../domain/models';
import { SURVEY_REPOSITORY, VOTE_REPOSITORY, type SurveyResultCounts } from '../../domain/tokens';
import { loc } from '../i18n/localized';
import type { I18nKey } from '../i18n/ui-dictionary';
import { jpegToDataUrl } from '../utils/news-image';
import { AuthService } from './auth.service';
import { DeviceService } from './device.service';
import { I18nService } from './i18n.service';
import { MediaStorageService } from './media-storage.service';
import { TranslationService } from './translation.service';

@Injectable({ providedIn: 'root' })
export class SurveyService {
  private readonly votesRepo = inject(VOTE_REPOSITORY);
  private readonly surveyRepo = inject(SURVEY_REPOSITORY);
  private readonly device = inject(DeviceService);
  private readonly i18n = inject(I18nService);
  private readonly translator = inject(TranslationService);
  private readonly media = inject(MediaStorageService);
  private readonly auth = inject(AuthService);

  readonly surveys = signal<Survey[]>([]);
  readonly adminSurveys = signal<Survey[]>([]);
  readonly openId = signal<string | null>(null);
  readonly modalOpen = signal(false);
  readonly selected = signal<string | null>(null);
  readonly statusKey = signal<I18nKey | null>(null);
  readonly status = computed(() => {
    const key = this.statusKey();
    return key ? this.i18n.t(key) : '';
  });
  readonly busy = signal(false);
  readonly publicCounts = signal<Record<string, SurveyResultCounts>>({});
  readonly navSurveys = computed(() => this.surveys().filter((item) => item.showInNav));
  readonly results = computed(() =>
    this.surveys().map((survey) => this.buildResult(survey, this.publicCounts()[survey.id])),
  );

  private resultStops: Array<() => void> = [];

  constructor() {
    const stopActive = this.surveyRepo.watchActive((items) => {
      this.surveys.set(items);
      this.resubscribeResults(items);
    });
    inject(DestroyRef).onDestroy(() => {
      stopActive();
      this.stopAdminWatch();
      this.resultStops.forEach((stop) => stop());
    });
  }

  /** Todas las encuestas (también las ocultas). Solo para el panel de administración. */
  watchAdmin(): () => void {
    this.stopAdminWatch();
    this.adminWatchStop = this.surveyRepo.watchAll((items) => {
      this.adminSurveys.set(items);
      const byId = new Map<string, Survey>();
      [...this.surveys(), ...items].forEach((item) => byId.set(item.id, item));
      this.resubscribeResults([...byId.values()]);
    });
    return () => this.stopAdminWatch();
  }

  private adminWatchStop: (() => void) | null = null;

  private stopAdminWatch(): void {
    this.adminWatchStop?.();
    this.adminWatchStop = null;
  }

  surveyById(id: string) {
    return this.surveys().find((item) => item.id === id) ?? this.adminSurveys().find((item) => item.id === id);
  }

  resultById(id: string): SurveyResult | undefined {
    const survey = this.surveyById(id);
    if (!survey) return undefined;
    return this.buildResult(survey, this.publicCounts()[survey.id]);
  }

  open(id: string, options: { modal?: boolean } = {}): void {
    this.openId.set(id);
    this.modalOpen.set(!!options.modal);
    this.selected.set(null);
    const survey = this.surveyById(id);
    this.statusKey.set(survey && this.localVoted(survey) ? 'alreadyVoted' : null);
  }

  close(): void {
    this.modalOpen.set(false);
    this.openId.set(null);
    this.selected.set(null);
    this.statusKey.set(null);
  }

  closeModal(): void {
    this.modalOpen.set(false);
  }

  select(value: string): void {
    this.selected.set(value);
  }

  async vote(): Promise<void> {
    const survey = this.surveyById(this.openId() ?? '');
    if (!survey || this.busy()) return;
    if (this.localVoted(survey)) {
      this.statusKey.set('alreadyVoted');
      return;
    }
    if (!this.selected()) {
      this.statusKey.set('pickOption');
      return;
    }

    this.busy.set(true);
    try {
      const ctx = await this.device.context();
      if (await this.votesRepo.hasDeviceVote(survey, ctx.fingerprint)) {
        this.device.markVoted(survey.id);
        this.statusKey.set('alreadyVoted');
        return;
      }
      await this.votesRepo.add(survey, {
        fecha: new Date().toISOString(),
        opcion: this.selected()!,
        ip: ctx.ip,
        deviceId: ctx.fingerprint,
        zona: `${ctx.lat.toFixed(2)},${ctx.lng.toFixed(2)}`,
        lat: ctx.lat,
        lng: ctx.lng,
        timestamp: Date.now(),
        encuestaId: survey.id,
      });
      this.device.markVoted(survey.id);
      this.statusKey.set('voteOk');
    } catch {
      this.statusKey.set('voteError');
    } finally {
      this.busy.set(false);
    }
  }

  async listAll(): Promise<VoteRecord[]> {
    const list = this.auth.isAdmin() ? this.adminSurveys() : this.surveys();
    const groups = await Promise.all(list.map((survey) => this.votesRepo.list(survey)));
    return groups.flat().sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));
  }

  async syncPublicResults(): Promise<void> {
    const list = this.adminSurveys().length ? this.adminSurveys() : this.surveys();
    await Promise.all(
      list.map(async (survey) => {
        const votes = await this.votesRepo.list(survey);
        await this.votesRepo.rebuildResults(survey, votes);
      }),
    );
  }

  /** Permite votar otra vez en este celular o computadora (solo desde el panel de admin). */
  async unlockThisDevice(): Promise<void> {
    const list = this.adminSurveys().length ? this.adminSurveys() : this.surveys();
    const ids = [...new Set([...list.map((item) => item.id), ...this.surveys().map((item) => item.id)])];
    if (!ids.length) throw new Error('no-surveys');
    const deviceId = this.device.fingerprint();
    await this.votesRepo.clearDeviceVotes(deviceId, ids);
    this.device.clearVoted(ids);
  }

  async saveSurvey(draft: SurveyDraft): Promise<void> {
    const id = this.normalizeId(draft.id);
    if (!id) throw new Error('invalid-id');
    const options = await this.buildOptions(draft);
    if (options.length < 2) throw new Error('need-options');

    const [shortEn, cityEn, titleEn, questionEn] = await Promise.all([
      this.translator.toEnglish(draft.shortLabel),
      this.translator.toEnglish(draft.city),
      this.translator.toEnglish(draft.title),
      this.translator.toEnglish(draft.question),
    ]);

    await this.surveyRepo.save({
      id,
      active: draft.active,
      showInNav: draft.showInNav,
      sortOrder: Number(draft.sortOrder) || 0,
      shortLabel: loc(draft.shortLabel.trim(), shortEn),
      city: loc(draft.city.trim(), cityEn),
      title: loc(draft.title.trim(), titleEn),
      question: loc(draft.question.trim(), questionEn),
      options,
      updatedAt: Date.now(),
    });
  }

  async removeSurvey(id: string): Promise<void> {
    await this.surveyRepo.remove(id);
  }

  async seedDefaults(): Promise<void> {
    await this.surveyRepo.seed(SURVEY_SEEDS);
  }

  private async buildOptions(draft: SurveyDraft): Promise<SurveyOption[]> {
    const built: SurveyOption[] = [];
    for (let i = 0; i < draft.options.length; i += 1) {
      const row = draft.options[i]!;
      const label = row.label.trim();
      if (!label) continue;
      let imageUrl = row.imageUrl?.trim() || '';
      if (row.imageFile) {
        imageUrl = jpegToDataUrl(await this.media.prepareNewsImage(row.imageFile));
      }
      const voteValue = row.voteValue?.trim();
      built.push({
        id: row.id?.trim() || `opt-${i + 1}`,
        label,
        ...(voteValue ? { voteValue } : {}),
        ...(imageUrl ? { imageUrl } : {}),
      });
    }
    return built;
  }

  private normalizeId(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9_-]+/g, '')
      .replace(/-+/g, '-')
      .slice(0, 64);
  }

  private localVoted(survey: Survey): boolean {
    return this.device.hasVoted(survey.id);
  }

  private resubscribeResults(surveys: Survey[]): void {
    this.resultStops.forEach((stop) => stop());
    this.resultStops = surveys.map((survey) =>
      this.votesRepo.watchResults(survey, (counts) => {
        this.publicCounts.update((current) => ({ ...current, [survey.id]: counts }));
      }),
    );
  }

  private buildResult(survey: Survey, data?: SurveyResultCounts): SurveyResult {
    const counts = new Map<string, number>();
    survey.options.forEach((opt) => counts.set(opt.voteValue ?? opt.label, 0));
    Object.entries(data?.counts ?? {}).forEach(([label, count]) => {
      counts.set(label, Number(count) || 0);
    });
    const total = data?.total ?? [...counts.values()].reduce((sum, n) => sum + n, 0);
    const options: SurveyOptionTally[] = [...counts.entries()]
      .map(([label, count]) => ({
        label,
        count,
        percent: total ? Math.round((count / total) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
    return { surveyId: survey.id, total, options };
  }
}
