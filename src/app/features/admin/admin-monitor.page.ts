import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { I18nService } from '../../core/services/i18n.service';
import { NewsService } from '../../core/services/news.service';
import { SurveyService } from '../../core/services/survey.service';
import type { VoteRecord } from '../../domain/models';
import { LeafletMap } from '../../shared/leaflet-map/leaflet-map';
import { ContentCms } from './content-cms';
import { SurveyCms } from './survey-cms';

type AdminTab = 'results' | 'surveys' | 'content' | 'news';

@Component({
  selector: 'app-admin-monitor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, FormsModule, LeafletMap, ContentCms, SurveyCms],
  template: `
    <section class="admin-monitor-overlay active">
      <div class="monitor-shell">
        <div class="shell-top">
          <header class="shell-head">
            <div>
              <p class="eyebrow">Admin</p>
              <h1><i class="fa-solid fa-shield-halved"></i> {{ i18n.t('monitor') }}</h1>
            </div>
            <a routerLink="/" class="back-btn">{{ i18n.t('back') }}</a>
          </header>

          <nav class="tabs" aria-label="Admin">
            <button type="button" class="tab" [class.active]="tab() === 'results'" (click)="setTab('results')">
              <i class="fa-solid fa-chart-column"></i>
              <span>{{ i18n.t('adminTabResults') }}</span>
            </button>
            <button type="button" class="tab" [class.active]="tab() === 'surveys'" (click)="setTab('surveys')">
              <i class="fa-solid fa-square-poll-vertical"></i>
              <span>{{ i18n.t('adminTabSurveys') }}</span>
            </button>
            <button type="button" class="tab" [class.active]="tab() === 'content'" (click)="setTab('content')">
              <i class="fa-solid fa-pen-to-square"></i>
              <span>{{ i18n.t('adminTabContent') }}</span>
            </button>
            <button type="button" class="tab" [class.active]="tab() === 'news'" (click)="setTab('news')">
              <i class="fa-solid fa-newspaper"></i>
              <span>{{ i18n.t('adminTabNews') }}</span>
            </button>
          </nav>
        </div>

        <div class="shell-body">
        @if (tab() === 'results') {
          <div class="panel">
            <div class="panel-head">
              <div>
                <h2>{{ i18n.t('adminTabResults') }}</h2>
                <p>{{ i18n.t('adminResultsLead') }}</p>
              </div>
              <div class="panel-actions">
                <button type="button" class="ghost" [disabled]="unlocking()" (click)="unlockDevice()">
                  {{ unlocking() ? i18n.t('unlockingDevice') : i18n.t('unlockDevice') }}
                </button>
                <button type="button" class="ghost" [disabled]="syncing()" (click)="syncResults()">
                  {{ syncing() ? i18n.t('syncingResults') : i18n.t('syncResults') }}
                </button>
                <button type="button" class="export" (click)="exportCsv()">{{ i18n.t('export') }}</button>
              </div>
            </div>

            <div class="stats-row">
              <div class="stat">
                <span>{{ i18n.t('cloudRecords') }}</span>
                <strong>{{ votes().length }}</strong>
              </div>
              <div class="stat">
                <span>{{ i18n.t('adminTabSurveys') }}</span>
                <strong>{{ surveys.adminSurveys().length }}</strong>
              </div>
            </div>
            @if (unlockMsg()) {
              <p class="unlock-msg">{{ unlockMsg() }}</p>
            }

            <div class="split">
              <section class="block">
                <h3>{{ i18n.t('electoralMap') }}</h3>
                <div class="map-box">
                  <app-leaflet-map [markers]="markers()" [center]="[21.16, -86.85]" [zoom]="6" />
                </div>
              </section>

              <section class="block">
                <h3>{{ i18n.t('liveResults') }}</h3>
                <div class="results-list">
                  @for (survey of surveys.adminSurveys(); track survey.id) {
                    @if (surveys.resultById(survey.id); as result) {
                      <article class="result-item">
                        <div class="result-item-head">
                          <strong>{{ i18n.tx(survey.title) }}</strong>
                          <span>{{ result.total }} {{ i18n.t('totalVotes') }}</span>
                        </div>
                        @if (result.total === 0) {
                          <p class="empty">{{ i18n.t('noVotesYet') }}</p>
                        } @else {
                          <ul class="admin-bars">
                            @for (opt of result.options; track opt.label) {
                              <li>
                                <div class="bar-meta">
                                  <span>{{ opt.label }}</span>
                                  <strong>{{ opt.percent }}% · {{ opt.count }}</strong>
                                </div>
                                <div class="bar-track">
                                  <div class="bar-fill" [style.width.%]="opt.percent"></div>
                                </div>
                              </li>
                            }
                          </ul>
                        }
                      </article>
                    }
                  } @empty {
                    <p class="empty">{{ i18n.t('surveyEmpty') }}</p>
                  }
                </div>
              </section>
            </div>

            <section class="block table-block">
              <h3>{{ i18n.t('cloudRecords') }}</h3>
              <div class="table-wrap">
                <table class="monitor-table">
                  <thead>
                    <tr>
                      <th>{{ i18n.t('colDate') }}</th>
                      <th>{{ i18n.t('colCandidate') }}</th>
                      <th>{{ i18n.t('colSurvey') }}</th>
                      <th>{{ i18n.t('colZone') }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (vote of votes(); track vote.timestamp + vote.deviceId) {
                      <tr>
                        <td>{{ vote.fecha }}</td>
                        <td>{{ vote.opcion }}</td>
                        <td>{{ vote.encuestaId }}</td>
                        <td>{{ vote.zona }} / {{ vote.ip }}</td>
                      </tr>
                    } @empty {
                      <tr><td colspan="4" class="empty">{{ i18n.t('noRecords') }}</td></tr>
                    }
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        }

        @if (tab() === 'surveys') {
          <div class="panel">
            <app-survey-cms />
          </div>
        }

        @if (tab() === 'content') {
          <div class="panel">
            <app-content-cms />
          </div>
        }

        @if (tab() === 'news') {
          <div class="panel">
            <div class="panel-head">
              <div>
                <h2>{{ i18n.t('manageNews') }}</h2>
                <p>{{ i18n.t('adminNewsLead') }}</p>
              </div>
            </div>
            <div class="news-box">
              <div class="input-group">
                <label>{{ i18n.t('newsTitle') }}</label>
                <select name="selectedNews" [(ngModel)]="selectedNewsId">
                  @for (item of news.items(); track item.id) {
                    <option [value]="item.id">{{ i18n.formatDate(item.publishedAt) }} — {{ i18n.tx(item.title) }}</option>
                  }
                </select>
              </div>
              <button type="button" class="danger" (click)="askRemove()" [disabled]="!selectedNewsId">
                {{ i18n.t('deleteNews') }}
              </button>
            </div>
          </div>
        }
        </div>
      </div>

      @if (confirmOpen()) {
        <div class="confirm-overlay" (click)="confirmOpen.set(false)">
          <div class="confirm-box" (click)="$event.stopPropagation()">
            <h4>{{ i18n.t('deleteNewsTitle') }}</h4>
            <p>{{ i18n.t('deleteNewsConfirm') }}</p>
            @if (pendingTitle()) {
              <p class="confirm-title">“{{ pendingTitle() }}”</p>
            }
            <div class="confirm-actions">
              <button type="button" class="ghost" (click)="confirmOpen.set(false)">{{ i18n.t('cancel') }}</button>
              <button type="button" class="danger" [disabled]="removing()" (click)="confirmRemove()">
                {{ removing() ? i18n.t('deleting') : i18n.t('confirmDelete') }}
              </button>
            </div>
          </div>
        </div>
      }
    </section>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
    }
    .monitor-shell {
      width: min(100%, 1180px);
      margin: 0 auto;
      height: 100%;
      min-height: 0;
      display: flex;
      flex-direction: column;
      gap: .85rem;
    }
    .shell-top {
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      gap: .75rem;
    }
    .shell-body {
      flex: 1;
      min-height: 0;
      overflow: auto;
      padding-bottom: 1rem;
    }
    .shell-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      padding: 1rem 1.15rem;
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 12px;
    }
    .eyebrow {
      margin: 0 0 .25rem;
      font-size: .72rem;
      font-weight: 800;
      letter-spacing: .08em;
      text-transform: uppercase;
      color: var(--brand-red);
    }
    .shell-head h1 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 900;
      display: flex;
      align-items: center;
      gap: .55rem;
    }
    .shell-head h1 i { color: var(--brand-red); }
    .back-btn {
      background: #111827;
      color: #FFF;
      padding: .55rem 1rem;
      border-radius: 6px;
      font-weight: 800;
      font-size: .8rem;
      white-space: nowrap;
    }
    .tabs {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: .35rem;
      padding: .4rem;
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 12px;
    }
    .tab {
      border: 1px solid transparent;
      background: transparent;
      color: #cbd5e1;
      font-weight: 800;
      font-size: .78rem;
      padding: .7rem .55rem;
      border-radius: 8px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: .4rem;
      min-height: 44px;
    }
    .tab i { font-size: .9rem; }
    .tab:hover { background: rgba(255,255,255,.06); color: #fff; }
    .tab.active {
      background: var(--brand-red);
      color: #FFF;
      border-color: color-mix(in srgb, var(--brand-red) 70%, #000);
    }
    @media (max-width: 720px) {
      .tabs { grid-template-columns: 1fr 1fr; }
    }
    .panel {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 1.25rem;
    }
    .panel-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      flex-wrap: wrap;
      margin-bottom: 1.1rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--border-color);
    }
    .panel-head h2 {
      margin: 0 0 .3rem;
      font-size: 1.05rem;
      font-weight: 900;
    }
    .panel-head p {
      margin: 0;
      color: var(--text-muted);
      font-size: .84rem;
      line-height: 1.4;
      max-width: 42rem;
    }
    .panel-actions, .stats-row { display: flex; gap: .5rem; flex-wrap: wrap; }
    .stats-row { margin-bottom: 1rem; }
    .unlock-msg {
      margin: 0 0 1rem;
      padding: .55rem .75rem;
      border-radius: 6px;
      font-size: .8rem;
      font-weight: 700;
      background: #DCFCE7;
      color: #166534;
    }
    .stat {
      min-width: 140px;
      padding: .75rem .9rem;
      border: 1px solid var(--border-color);
      border-radius: 10px;
      background: var(--bg-color);
      display: flex;
      flex-direction: column;
      gap: .2rem;
    }
    .stat span { font-size: .72rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: .04em; }
    .stat strong { font-size: 1.25rem; font-weight: 900; }
    .split {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    @media (min-width: 960px) {
      .split { grid-template-columns: 1.1fr .9fr; }
    }
    .block {
      border: 1px solid var(--border-color);
      border-radius: 10px;
      padding: 1rem;
      background: var(--bg-color);
    }
    .block h3 {
      margin: 0 0 .75rem;
      font-size: .82rem;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: .04em;
      color: var(--text-muted);
    }
    .map-box { height: 320px; border-radius: 8px; overflow: hidden; }
    .results-list { display: flex; flex-direction: column; gap: .75rem; max-height: 320px; overflow: auto; }
    .result-item {
      padding: .75rem;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      background: var(--card-bg);
    }
    .result-item-head {
      display: flex;
      justify-content: space-between;
      gap: .5rem;
      margin-bottom: .55rem;
      font-size: .82rem;
    }
    .result-item-head span { color: var(--text-muted); white-space: nowrap; }
    .admin-bars { list-style: none; display: flex; flex-direction: column; gap: .5rem; margin: 0; padding: 0; }
    .bar-meta { display: flex; justify-content: space-between; gap: .5rem; font-size: .74rem; font-weight: 700; margin-bottom: .15rem; }
    .bar-track { height: 7px; background: #E5E7EB; border-radius: 999px; overflow: hidden; }
    .bar-fill { height: 100%; background: var(--brand-red); border-radius: 999px; }
    .table-block { margin-top: .2rem; }
    .table-wrap { max-height: 300px; overflow: auto; border: 1px solid var(--border-color); border-radius: 8px; background: var(--card-bg); }
    .news-box {
      display: grid;
      gap: .9rem;
      max-width: 560px;
    }
    .danger, .ghost, .export {
      border: none;
      padding: .55rem 1rem;
      border-radius: 6px;
      font-weight: 800;
      cursor: pointer;
      color: #FFF;
      font-size: .75rem;
    }
    .danger { background: #EF4444; }
    .danger:disabled { opacity: .55; cursor: not-allowed; }
    .ghost { background: #64748B; }
    .export { background: #15803D; }
    .empty { text-align: center; color: var(--text-muted); margin: .4rem 0; font-size: .85rem; }
    .confirm-overlay {
      position: fixed; inset: 0; background: rgba(10, 10, 10, 0.72); display: flex; align-items: center; justify-content: center;
      z-index: 5200; padding: 1rem;
    }
    .confirm-box {
      width: min(100%, 420px); background: var(--card-bg); color: var(--text-color); border-radius: 12px;
      border: 1px solid var(--border-color); padding: 1.5rem; box-shadow: 0 16px 40px rgba(0,0,0,.28);
    }
    .confirm-box h4 { font-size: 1.05rem; font-weight: 900; margin-bottom: .6rem; }
    .confirm-box p { font-size: .9rem; color: var(--text-muted); line-height: 1.45; }
    .confirm-title { margin-top: .8rem; color: var(--text-color) !important; font-weight: 800; }
    .confirm-actions { display: flex; gap: .6rem; margin-top: 1.2rem; }
    .confirm-actions .ghost, .confirm-actions .danger { flex: 1; }
  `,
})
export class AdminMonitorPage implements OnInit, OnDestroy {
  readonly i18n = inject(I18nService);
  readonly news = inject(NewsService);
  readonly surveys = inject(SurveyService);
  readonly tab = signal<AdminTab>('results');
  readonly votes = signal<VoteRecord[]>([]);
  readonly confirmOpen = signal(false);
  readonly removing = signal(false);
  readonly syncing = signal(false);
  readonly unlocking = signal(false);
  readonly unlockMsg = signal('');
  readonly pendingTitle = signal('');
  selectedNewsId = '';
  readonly markers = computed(() =>
    this.votes()
      .map((vote) => this.toMarker(vote))
      .filter((item): item is { lat: number; lng: number; label: string } => !!item),
  );

  private stopAdmin: (() => void) | null = null;

  private toMarker(vote: VoteRecord): { lat: number; lng: number; label: string } | null {
    let lat = Number(vote.lat);
    let lng = Number(vote.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) {
      const match = String(vote.zona ?? '').match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
      if (!match) return null;
      lat = Number(match[1]);
      lng = Number(match[2]);
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
    return {
      lat,
      lng,
      label: `${vote.opcion} · ${vote.encuestaId}`,
    };
  }

  async ngOnInit(): Promise<void> {
    this.stopAdmin = this.surveys.watchAdmin();
    this.votes.set(await this.surveys.listAll());
    this.selectedNewsId = this.news.items()[0]?.id ?? '';
  }

  ngOnDestroy(): void {
    this.stopAdmin?.();
  }

  setTab(next: AdminTab): void {
    this.tab.set(next);
  }

  askRemove(): void {
    const id = this.selectedNewsId;
    if (!id) return;
    const item = this.news.byId(id);
    this.pendingTitle.set(item ? this.i18n.tx(item.title) : '');
    this.confirmOpen.set(true);
  }

  async confirmRemove(): Promise<void> {
    const id = this.selectedNewsId;
    if (!id) return;
    this.removing.set(true);
    try {
      await this.news.remove(id);
      this.selectedNewsId = this.news.items().find((item) => item.id !== id)?.id ?? '';
      this.confirmOpen.set(false);
      this.pendingTitle.set('');
    } finally {
      this.removing.set(false);
    }
  }

  async unlockDevice(): Promise<void> {
    this.unlocking.set(true);
    this.unlockMsg.set('');
    try {
      await this.surveys.unlockThisDevice();
      this.unlockMsg.set(this.i18n.t('unlockDeviceOk'));
    } catch {
      this.unlockMsg.set(this.i18n.t('unlockDeviceError'));
    } finally {
      this.unlocking.set(false);
    }
  }

  async syncResults(): Promise<void> {
    this.syncing.set(true);
    try {
      await this.surveys.syncPublicResults();
      this.votes.set(await this.surveys.listAll());
    } finally {
      this.syncing.set(false);
    }
  }

  exportCsv(): void {
    const rows = [
      ['fecha', 'opcion', 'encuesta', 'zona', 'ip', 'deviceId'],
      ...this.votes().map((vote) => [vote.fecha, vote.opcion, vote.encuestaId, vote.zona, vote.ip, vote.deviceId]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'votos-muestra.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
}
