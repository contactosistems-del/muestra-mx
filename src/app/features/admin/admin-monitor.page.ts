import { ChangeDetectionStrategy, Component, computed, effect, inject, OnDestroy, OnInit, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { I18nService } from '../../core/services/i18n.service';
import { NewsService } from '../../core/services/news.service';
import { SurveyService } from '../../core/services/survey.service';
import type { VoteRecord } from '../../domain/models';
import { LeafletMap } from '../../shared/leaflet-map/leaflet-map';
import { ResultCard } from '../../shared/result-card/result-card';
import { AdminInsights } from './admin-insights';
import { ContentCms } from './content-cms';
import { NewsEditor } from './news-editor';
import { SurveyCms } from './survey-cms';

type AdminTab = 'results' | 'charts' | 'surveys' | 'content' | 'news';

@Component({
  selector: 'app-admin-monitor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, FormsModule, LeafletMap, ResultCard, AdminInsights, ContentCms, SurveyCms, NewsEditor],
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
              <i class="fa-solid fa-map-location-dot"></i>
              <span>{{ i18n.t('adminTabResults') }}</span>
            </button>
            <button type="button" class="tab" [class.active]="tab() === 'charts'" (click)="setTab('charts')">
              <i class="fa-solid fa-chart-column"></i>
              <span>{{ i18n.t('adminTabCharts') }}</span>
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
              </div>
            </div>

            @if (unlockMsg()) {
              <p class="unlock-msg">{{ unlockMsg() }}</p>
            }

            <section class="block">
              <h3>{{ i18n.t('activeSurveys') }}</h3>
              @if (activeSurveys().length === 0) {
                <p class="empty">{{ i18n.t('noActiveSurveys') }}</p>
              } @else {
                <div class="survey-picker">
                  @for (survey of activeSurveys(); track survey.id) {
                    <button
                      type="button"
                      class="survey-pick"
                      [class.active]="selectedSurveyId() === survey.id"
                      (click)="selectSurvey(survey.id)"
                    >
                      <strong>{{ i18n.tx(survey.shortLabel) }}</strong>
                      <span>{{ voteCount(survey.id) }} {{ i18n.t('surveyVotes') }}</span>
                    </button>
                  }
                </div>
              }
            </section>

            @if (selectedSurvey(); as survey) {
              <app-admin-insights [votes]="selectedVotes()" />

              <div class="panel-actions survey-export">
                <button type="button" class="export" (click)="exportCsv()">
                  {{ i18n.t('exportSurveyCsv') }}
                </button>
              </div>

              <section class="block">
                <h3>{{ i18n.t('electoralMap') }} · {{ i18n.tx(survey.shortLabel) }}</h3>
                <div class="map-box map-box-wide">
                  @for (mapId of [survey.id]; track mapId) {
                    <app-leaflet-map
                      [markers]="selectedMarkers()"
                      [center]="[21.16, -86.85]"
                      [zoom]="6"
                    />
                  }
                </div>
              </section>

              <section class="block table-block">
                <h3>{{ i18n.t('cloudRecords') }} · {{ i18n.tx(survey.title) }}</h3>
                <div class="table-wrap">
                  <table class="monitor-table">
                    <thead>
                      <tr>
                        <th>{{ i18n.t('colDate') }}</th>
                        <th>{{ i18n.t('colCandidate') }}</th>
                        <th>{{ i18n.t('colZone') }}</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (vote of selectedVotes(); track vote.timestamp + vote.deviceId) {
                        <tr>
                          <td>{{ vote.fecha }}</td>
                          <td>{{ vote.opcion }}</td>
                          <td>{{ vote.zona }} / {{ vote.ip }}</td>
                        </tr>
                      } @empty {
                        <tr><td colspan="3" class="empty">{{ i18n.t('noRecords') }}</td></tr>
                      }
                    </tbody>
                  </table>
                </div>
              </section>
            } @else if (activeSurveys().length > 0) {
              <p class="empty">{{ i18n.t('selectSurveyResults') }}</p>
            }
          </div>
        }

        @if (tab() === 'charts') {
          <div class="panel">
            <div class="panel-head">
              <div>
                <h2>{{ i18n.t('adminTabCharts') }}</h2>
                <p>{{ i18n.t('adminChartsLead') }}</p>
              </div>
              <div class="panel-actions">
                <button type="button" class="ghost" [disabled]="syncing()" (click)="syncResults()">
                  {{ syncing() ? i18n.t('syncingResults') : i18n.t('syncResults') }}
                </button>
              </div>
            </div>

            <div class="admin-cards">
              @for (row of surveys.adminResults(); track row.survey.id) {
                <app-result-card [survey]="row.survey" [result]="row.result" [showCounts]="true" />
              } @empty {
                <p class="empty">{{ i18n.t('surveyEmpty') }}</p>
              }
            </div>
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
              <div class="panel-actions">
                <button type="button" class="export" (click)="news.openCreate()">{{ i18n.t('publishNews') }}</button>
              </div>
            </div>

            @if (news.loading()) {
              <p class="empty">{{ i18n.t('newsLoading') }}</p>
            } @else if (news.items().length === 0) {
              <p class="empty">{{ i18n.t('newsEmpty') }}</p>
            } @else {
              <ul class="news-manage-list">
                @for (item of news.items(); track item.id) {
                  <li class="news-manage-item">
                    <div class="news-manage-meta">
                      <strong>{{ i18n.tx(item.title) }}</strong>
                      <span>{{ i18n.formatDate(item.publishedAt) }} · {{ item.categoryId }}</span>
                    </div>
                    <div class="news-actions">
                      @if (news.isEditorial(item.id)) {
                        <span class="badge">{{ i18n.lang() === 'es' ? 'Publicada desde el código' : 'Published from code' }}</span>
                      } @else {
                        <button type="button" class="ghost" (click)="news.openEdit(item.id)">
                          {{ i18n.t('editNews') }}
                        </button>
                        <button type="button" class="danger" (click)="askRemove(item.id)">
                          {{ i18n.t('deleteNews') }}
                        </button>
                      }
                    </div>
                  </li>
                }
              </ul>
            }
          </div>
        }
        </div>
      </div>

      @if (news.editorOpen()) {
        <app-news-editor />
      }

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
    .admin-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr)); gap: 1.1rem; }
    .pie-dot { display: inline-block; width: .7rem; height: .7rem; border-radius: 50%; margin-right: .4rem; vertical-align: -1px; }
    :host {
      display: block;
      min-height: 100dvh;
    }
    .admin-monitor-overlay.active {
      position: fixed;
      inset: 0;
      z-index: 5000;
      display: flex;
      flex-direction: column;
      background: var(--bg-color);
      color: var(--text-color);
      padding: max(0.75rem, env(safe-area-inset-top)) max(0.75rem, env(safe-area-inset-right)) max(0.75rem, env(safe-area-inset-bottom)) max(0.75rem, env(safe-area-inset-left));
      overflow: hidden;
    }
    .monitor-shell {
      width: min(100%, 1180px);
      margin: 0 auto;
      height: 100%;
      min-height: 0;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .shell-top {
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
    }
    .shell-body {
      flex: 1;
      min-height: 0;
      overflow: auto;
      -webkit-overflow-scrolling: touch;
      padding-bottom: 0.5rem;
    }
    .shell-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.85rem;
      padding: 0.9rem 1.05rem;
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 12px;
    }
    .eyebrow {
      margin: 0 0 0.2rem;
      font-size: 0.7rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--brand-red);
    }
    .shell-head h1 {
      margin: 0;
      font-size: 1.15rem;
      font-weight: 900;
      display: flex;
      align-items: center;
      gap: 0.45rem;
      line-height: 1.2;
    }
    .shell-head h1 i { color: var(--brand-red); }
    .back-btn {
      background: #111827;
      color: #fff;
      padding: 0.55rem 0.95rem;
      border-radius: 6px;
      font-weight: 800;
      font-size: 0.78rem;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .tabs {
      display: flex;
      flex-wrap: nowrap;
      gap: 0.3rem;
      padding: 0.35rem;
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 12px;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
    }
    .tabs::-webkit-scrollbar { display: none; }
    .tab {
      border: 1px solid transparent;
      background: transparent;
      color: #cbd5e1;
      font-weight: 800;
      font-size: 0.74rem;
      padding: 0.6rem 0.75rem;
      border-radius: 8px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.35rem;
      min-height: 42px;
      flex: 0 0 auto;
      white-space: nowrap;
    }
    .tab i { font-size: 0.85rem; }
    .tab:hover { background: rgba(255,255,255,0.06); color: #fff; }
    .tab.active {
      background: var(--brand-red);
      color: #fff;
      border-color: color-mix(in srgb, var(--brand-red) 70%, #000);
    }
    @media (min-width: 992px) {
      .tabs {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        overflow: visible;
      }
      .tab { flex: unset; }
    }
    .panel {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 1.15rem;
    }
    .panel-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 0.85rem;
      flex-wrap: wrap;
      margin-bottom: 1rem;
      padding-bottom: 0.9rem;
      border-bottom: 1px solid var(--border-color);
    }
    .panel-head h2 {
      margin: 0 0 0.25rem;
      font-size: 1.02rem;
      font-weight: 900;
    }
    .panel-head p {
      margin: 0;
      color: var(--text-muted);
      font-size: 0.82rem;
      line-height: 1.4;
      max-width: 42rem;
    }
    .panel-actions, .stats-row { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .stats-row { margin-bottom: 1rem; }
    .unlock-msg {
      margin: 0 0 1rem;
      padding: 0.55rem 0.75rem;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 700;
      background: #dcfce7;
      color: #166534;
    }
    .stat {
      min-width: 0;
      flex: 1 1 120px;
      padding: 0.7rem 0.85rem;
      border: 1px solid var(--border-color);
      border-radius: 10px;
      background: var(--bg-color);
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }
    .stat span {
      font-size: 0.68rem;
      font-weight: 800;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .stat strong { font-size: 1.2rem; font-weight: 900; }
    .split {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    @media (min-width: 992px) {
      .split { grid-template-columns: 1.1fr 0.9fr; }
    }
    .block {
      border: 1px solid var(--border-color);
      border-radius: 10px;
      padding: 0.9rem;
      background: var(--bg-color);
    }
    .block h3 {
      margin: 0 0 0.7rem;
      font-size: 0.78rem;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--text-muted);
    }
    .survey-picker {
      display: flex;
      flex-wrap: wrap;
      gap: 0.55rem;
    }
    .survey-pick {
      border: 1px solid var(--border-color);
      background: var(--card-bg);
      color: var(--text-color);
      border-radius: 10px;
      padding: 0.7rem 0.9rem;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.2rem;
      min-width: min(100%, 160px);
      text-align: left;
    }
    .survey-pick strong { font-size: 0.86rem; font-weight: 900; }
    .survey-pick span { font-size: 0.72rem; color: var(--text-muted); font-weight: 700; }
    .survey-pick.active {
      border-color: var(--brand-red);
      background: color-mix(in srgb, var(--brand-red) 10%, var(--card-bg));
      box-shadow: inset 3px 0 0 var(--brand-red);
    }
    .survey-export { margin: 0 0 1rem; }
    .map-box {
      height: 360px;
      min-height: 360px;
      width: 100%;
      border-radius: 8px;
      overflow: hidden;
      position: relative;
      background: #dbe2ea;
      border: 1px solid var(--border-color);
    }
    .map-box-wide { height: 420px; min-height: 420px; }
    .results-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-height: 320px;
      overflow: auto;
    }
    .results-list-full { max-height: none; }
    .result-item {
      padding: 0.75rem;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      background: var(--card-bg);
    }
    .result-item-head {
      display: flex;
      justify-content: space-between;
      gap: 0.5rem;
      margin-bottom: 0.55rem;
      font-size: 0.82rem;
    }
    .result-item-head span { color: var(--text-muted); }
    .admin-bars {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin: 0;
      padding: 0;
    }
    .bar-meta {
      display: flex;
      justify-content: space-between;
      gap: 0.5rem;
      font-size: 0.74rem;
      font-weight: 700;
      margin-bottom: 0.15rem;
      flex-wrap: wrap;
    }
    .bar-track { height: 7px; background: #e5e7eb; border-radius: 999px; overflow: hidden; }
    .bar-fill { height: 100%; background: var(--brand-red); border-radius: 999px; }
    .table-block { margin-top: 0.85rem; }
    .table-wrap {
      max-height: 300px;
      overflow: auto;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      background: var(--card-bg);
      -webkit-overflow-scrolling: touch;
    }
    :host ::ng-deep .monitor-table { min-width: 560px; }
    .news-manage-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .news-manage-item {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem 1rem;
      justify-content: space-between;
      align-items: center;
      padding: 0.9rem 1rem;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      background: var(--card-bg);
    }
    .news-manage-meta {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      min-width: min(100%, 220px);
      flex: 1;
    }
    .news-manage-meta strong {
      font-size: 0.92rem;
      font-weight: 800;
      line-height: 1.3;
    }
    .news-manage-meta span {
      font-size: 0.75rem;
      color: var(--text-muted);
      font-weight: 600;
    }
    .news-actions { display: flex; flex-wrap: wrap; gap: 0.55rem; }
    .danger, .ghost, .export {
      border: none;
      padding: 0.55rem 1rem;
      border-radius: 6px;
      font-weight: 800;
      cursor: pointer;
      color: #fff;
      font-size: 0.75rem;
    }
    .danger { background: #ef4444; }
    .danger:disabled { opacity: 0.55; cursor: not-allowed; }
    .ghost { background: #64748b; }
    .export { background: #15803d; }
    .empty { text-align: center; color: var(--text-muted); margin: 0.4rem 0; font-size: 0.85rem; }
    .confirm-overlay {
      position: fixed;
      inset: 0;
      background: rgba(10, 10, 10, 0.72);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 5200;
      padding: 1rem;
    }
    .confirm-box {
      width: min(100%, 420px);
      background: var(--card-bg);
      color: var(--text-color);
      border-radius: 12px;
      border: 1px solid var(--border-color);
      padding: 1.5rem;
      box-shadow: 0 16px 40px rgba(0,0,0,0.28);
    }
    .confirm-box h4 { font-size: 1.05rem; font-weight: 900; margin-bottom: 0.6rem; }
    .confirm-box p { font-size: 0.9rem; color: var(--text-muted); line-height: 1.45; }
    .confirm-title { margin-top: 0.8rem; color: var(--text-color) !important; font-weight: 800; }
    .confirm-actions { display: flex; gap: 0.6rem; margin-top: 1.2rem; }
    .confirm-actions .ghost, .confirm-actions .danger { flex: 1; }

    @media (max-width: 720px) {
      .shell-head {
        flex-direction: column;
        align-items: stretch;
        gap: 0.65rem;
        padding: 0.8rem;
      }
      .shell-head h1 { font-size: 1.02rem; }
      .back-btn { width: 100%; text-align: center; }
      .tab { font-size: 0.68rem; padding: 0.55rem 0.7rem; min-height: 40px; }
      .panel { padding: 0.85rem; }
      .panel-actions {
        width: 100%;
        flex-direction: column;
      }
      .panel-actions .ghost,
      .panel-actions .export { width: 100%; text-align: center; }
      .map-box,
      .map-box-wide {
        height: 52vw;
        min-height: 260px;
        max-height: 340px;
      }
      .table-wrap { max-height: 240px; }
      .monitor-table { font-size: 0.72rem; }
      .monitor-table th, .monitor-table td { padding: 8px 10px; }
    }

    /* ===== Acabado profesional del panel ===== */
    .admin-monitor-overlay.active {
      background:
        radial-gradient(1200px 500px at 100% -10%, rgba(190, 52, 85, .10), transparent 60%),
        radial-gradient(900px 400px at -10% 110%, rgba(17, 24, 39, .10), transparent 60%),
        var(--bg-color);
    }
    .shell-head {
      position: relative; overflow: hidden; color: #fff; border: none; border-radius: 18px; padding: 1.1rem 1.3rem;
      background: linear-gradient(120deg, #0A0A0A, #2A0A15 55%, #BE3455);
      background-size: 180% 180%; animation: admShift 14s ease infinite;
      box-shadow: 0 18px 36px -20px rgba(0, 0, 0, .7);
    }
    .shell-head::after {
      content: ''; position: absolute; right: -60px; top: -80px; width: 260px; height: 260px; border-radius: 50%;
      background: rgba(255, 255, 255, .08); pointer-events: none;
    }
    .shell-head .eyebrow { color: rgba(255, 255, 255, .7); }
    .shell-head h1 { font-size: 1.35rem; }
    .shell-head h1 i {
      color: #fff; width: 38px; height: 38px; display: inline-grid; place-items: center; border-radius: 11px;
      background: rgba(255, 255, 255, .16); font-size: 1rem;
    }
    .back-btn {
      position: relative; z-index: 1; background: rgba(255, 255, 255, .14); border: 1px solid rgba(255, 255, 255, .3);
      border-radius: 10px; padding: .6rem 1rem; backdrop-filter: blur(6px); transition: background .2s, transform .2s;
    }
    .back-btn:hover { background: #fff; color: #111; transform: translateY(-2px); }
    .tabs { border-radius: 16px; padding: .4rem; background: #0B1220; border-color: #172036; box-shadow: 0 12px 26px -18px rgba(0, 0, 0, .8); }
    .tab { border-radius: 11px; min-height: 46px; letter-spacing: .02em; transition: background .25s, color .25s, transform .2s, box-shadow .25s; }
    .tab i { transition: transform .3s ease; }
    .tab:hover { transform: translateY(-1px); }
    .tab:hover i { transform: scale(1.18) rotate(-6deg); }
    .tab.active {
      background: linear-gradient(135deg, #E0577A, #BE3455 55%, #9B2443); border-color: transparent;
      box-shadow: 0 10px 20px -10px rgba(190, 52, 85, .9);
    }
    .panel {
      border-radius: 18px; padding: 1.35rem; border-color: rgba(157, 161, 159, .3);
      box-shadow: 0 16px 34px -24px rgba(15, 23, 42, .45);
      animation: admUp .45s cubic-bezier(.2, .8, .2, 1);
    }
    .panel-head h2 { font-size: 1.2rem; display: flex; align-items: center; gap: .5rem; }
    .panel-head h2::before { content: ''; width: 6px; height: 1.2em; border-radius: 4px; background: linear-gradient(var(--brand-red), #9B2443); }
    .stat {
      position: relative; overflow: hidden; border-radius: 14px; padding: .9rem 1rem; background: var(--card-bg);
      border-color: rgba(157, 161, 159, .3); box-shadow: 0 8px 18px -14px rgba(15, 23, 42, .5);
      transition: transform .25s, box-shadow .25s;
    }
    .stat::before { content: ''; position: absolute; inset: 0 0 auto; height: 4px; background: linear-gradient(90deg, #E0577A, #BE3455, #9B2443); }
    .stat:hover { transform: translateY(-3px); box-shadow: 0 14px 24px -14px rgba(15, 23, 42, .55); }
    .stat strong { font-size: 1.75rem; color: var(--brand-red); line-height: 1.1; }
    .block { border-radius: 16px; padding: 1.1rem; border-color: rgba(157, 161, 159, .3); background: var(--card-bg); box-shadow: 0 10px 22px -20px rgba(15, 23, 42, .5); }
    .block h3 { display: flex; align-items: center; gap: .45rem; color: var(--text-color); letter-spacing: .06em; }
    .block h3::before { content: ''; width: 8px; height: 8px; border-radius: 50%; background: var(--brand-red); box-shadow: 0 0 0 4px rgba(190, 52, 85, .18); }
    .survey-pick { border-radius: 12px; transition: transform .2s, box-shadow .2s, border-color .2s; }
    .survey-pick:hover { transform: translateY(-2px); box-shadow: 0 10px 18px -12px rgba(15, 23, 42, .5); border-color: var(--brand-red); }
    .survey-pick.active { box-shadow: inset 4px 0 0 var(--brand-red), 0 10px 18px -12px rgba(190, 52, 85, .6); }
    .map-box { border-radius: 14px; overflow: hidden; box-shadow: inset 0 0 0 1px rgba(157, 161, 159, .35); }
    .danger, .ghost, .export {
      border-radius: 10px; padding: .6rem 1rem; display: inline-flex; align-items: center; gap: .4rem;
      box-shadow: 0 8px 16px -10px rgba(15, 23, 42, .6); transition: transform .2s, filter .2s, box-shadow .2s;
    }
    .danger:hover:not(:disabled), .ghost:hover:not(:disabled), .export:hover { transform: translateY(-2px); filter: brightness(1.08); }
    .ghost { background: linear-gradient(135deg, #64748B, #334155); }
    .export { background: linear-gradient(135deg, #22C55E, #15803D); }
    .danger { background: linear-gradient(135deg, #F87171, #DC2626); }
    .table-wrap { border-radius: 12px; }
    .monitor-table tbody tr { transition: background .15s; }
    .monitor-table tbody tr:hover { background: rgba(190, 52, 85, .06); }
    .news-manage-item { border-radius: 12px; transition: transform .2s, box-shadow .2s; }
    .news-manage-item:hover { transform: translateY(-2px); box-shadow: 0 10px 20px -14px rgba(15, 23, 42, .5); }
    .confirm-box { border-radius: 18px; animation: admPop .3s cubic-bezier(.2, .8, .2, 1); }
    @keyframes admShift { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
    @keyframes admUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
    @keyframes admPop { from { opacity: 0; transform: scale(.95); } to { opacity: 1; transform: none; } }
    @media (prefers-reduced-motion: reduce) { .shell-head, .panel, .confirm-box { animation: none; } }
  `,
})
export class AdminMonitorPage implements OnInit, OnDestroy {
  readonly i18n = inject(I18nService);
  readonly news = inject(NewsService);
  readonly surveys = inject(SurveyService);
  readonly tab = signal<AdminTab>('results');
  readonly votes = signal<VoteRecord[]>([]);
  readonly selectedSurveyId = signal('');
  readonly confirmOpen = signal(false);
  readonly removing = signal(false);
  readonly syncing = signal(false);
  readonly unlocking = signal(false);
  readonly unlockMsg = signal('');
  readonly pendingTitle = signal('');
  selectedNewsId = '';

  readonly activeSurveys = computed(() =>
    this.surveys.adminSurveys().filter((survey) => survey.active),
  );

  readonly selectedSurvey = computed(() => {
    const id = this.selectedSurveyId();
    return this.activeSurveys().find((survey) => survey.id === id) ?? null;
  });

  readonly selectedVotes = computed(() => {
    const id = this.selectedSurveyId();
    if (!id) return [];
    return this.votes().filter((vote) => vote.encuestaId === id);
  });

  readonly selectedMarkers = computed(() => {
    const survey = this.selectedSurvey();
    const names = new Map((survey?.options ?? []).map((opt) => [opt.id, opt.label] as [string, string]));
    return this.selectedVotes()
      .map((vote) => {
        const marker = this.toMarker(vote);
        return marker ? { ...marker, group: names.get(String(vote.opcion)) ?? String(vote.opcion) } : null;
      })
      .filter((item): item is { lat: number; lng: number; label: string; group: string } => !!item);
  });

  private stopAdmin: (() => void) | null = null;
  private votesKey = '';

  constructor() {
    effect(() => {
      const key = this.surveys
        .adminSurveys()
        .map((survey) => survey.id)
        .join('|');
      if (!key || key === this.votesKey) {
        untracked(() => this.ensureSurveySelection());
        return;
      }
      this.votesKey = key;
      untracked(() => void this.reloadVotes());
    });
  }

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
      label: `${vote.opcion} · ${vote.fecha}`,
    };
  }

  voteCount(surveyId: string): number {
    return this.votes().filter((vote) => vote.encuestaId === surveyId).length;
  }

  selectSurvey(id: string): void {
    this.selectedSurveyId.set(id);
  }

  private ensureSurveySelection(): void {
    const active = this.activeSurveys();
    const current = this.selectedSurveyId();
    if (current && active.some((survey) => survey.id === current)) return;
    this.selectedSurveyId.set(active[0]?.id ?? '');
  }

  private async reloadVotes(): Promise<void> {
    this.votes.set(await this.surveys.listAll());
    this.ensureSurveySelection();
  }

  async ngOnInit(): Promise<void> {
    this.stopAdmin = this.surveys.watchAdmin();
    await this.reloadVotes();
    try {
      await this.surveys.syncPublicResults();
    } catch {
      /* los votos del panel ya cargaron; el público se alinea en el siguiente intento */
    }
  }

  ngOnDestroy(): void {
    this.stopAdmin?.();
  }

  setTab(next: AdminTab): void {
    this.tab.set(next);
    if (next === 'results') this.ensureSurveySelection();
  }

  askRemove(id: string): void {
    if (!id) return;
    this.selectedNewsId = id;
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
      this.selectedNewsId = '';
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
      this.ensureSurveySelection();
    } finally {
      this.syncing.set(false);
    }
  }

  exportCsv(): void {
    const survey = this.selectedSurvey();
    const rows = [
      ['fecha', 'opcion', 'encuesta', 'zona', 'ip', 'deviceId', 'lat', 'lng'],
      ...this.selectedVotes().map((vote) => [
        vote.fecha,
        vote.opcion,
        vote.encuestaId,
        vote.zona,
        vote.ip,
        vote.deviceId,
        vote.lat ?? '',
        vote.lng ?? '',
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const slug = survey?.id || 'encuesta';
    a.download = `votos-${slug}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
