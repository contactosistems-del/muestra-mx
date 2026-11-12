import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { I18nService } from '../../core/services/i18n.service';
import type { VoteRecord } from '../../domain/models';
import { CountUp } from '../../shared/count-up/count-up';

interface DayPoint { key: string; label: string; count: number; }

/** Tablero de la encuesta seleccionada: cifras con tendencia, votos por día y por hora, y reparto por candidato. */
@Component({
  selector: 'app-admin-insights',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CountUp],
  template: `
    <div class="ins">
      <div class="kpis">
        <div class="kpi">
          <span class="k-ico"><i class="fa-solid fa-check-to-slot"></i></span>
          <div><small>{{ t('Votos totales', 'Total votes') }}</small><strong><app-count-up [value]="total()" /></strong></div>
        </div>
        <div class="kpi">
          <span class="k-ico"><i class="fa-solid fa-calendar-day"></i></span>
          <div><small>{{ t('Hoy', 'Today') }}</small><strong><app-count-up [value]="today()" /></strong></div>
        </div>
        <div class="kpi">
          <span class="k-ico"><i class="fa-solid fa-calendar-week"></i></span>
          <div>
            <small>{{ t('Últimos 7 días', 'Last 7 days') }}</small>
            <strong><app-count-up [value]="week()" /></strong>
            @if (trend() !== null) {
              <em class="trend" [class.up]="trend()! >= 0" [class.down]="trend()! < 0">
                <i class="fa-solid" [class.fa-arrow-trend-up]="trend()! >= 0" [class.fa-arrow-trend-down]="trend()! < 0"></i>
                {{ trend()! >= 0 ? '+' : '' }}{{ trend() }}% {{ t('vs semana anterior', 'vs prior week') }}
              </em>
            }
          </div>
        </div>
        <div class="kpi">
          <span class="k-ico"><i class="fa-solid fa-clock"></i></span>
          <div><small>{{ t('Hora pico', 'Peak hour') }}</small><strong>{{ peakHour() }}</strong></div>
        </div>
      </div>

      <div class="charts">
        <section class="card wide">
          <header><h4>{{ t('Votos por día', 'Votes per day') }}</h4><span>{{ t('Últimos 30 días', 'Last 30 days') }}</span></header>
          <svg class="area" viewBox="0 0 600 180" preserveAspectRatio="none" role="img" [attr.aria-label]="t('Votos por día', 'Votes per day')">
            <defs>
              <linearGradient id="insArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#BE3455" stop-opacity=".45" />
                <stop offset="100%" stop-color="#BE3455" stop-opacity="0" />
              </linearGradient>
            </defs>
            @for (g of [0.25, 0.5, 0.75]; track g) {
              <line x1="0" x2="600" [attr.y1]="170 - g * 150" [attr.y2]="170 - g * 150" class="grid" />
            }
            <path [attr.d]="areaPath()" fill="url(#insArea)" class="fill" />
            <path [attr.d]="linePath()" class="line" />
            @for (p of dots(); track p.key) {
              <circle [attr.cx]="p.x" [attr.cy]="p.y" r="3.5" class="dot"><title>{{ p.label }}: {{ p.count }}</title></circle>
            }
          </svg>
          <div class="axis"><span>{{ days()[0]?.label }}</span><span>{{ days()[14]?.label }}</span><span>{{ days()[29]?.label }}</span></div>
        </section>

        <section class="card">
          <header><h4>{{ t('Votos por hora', 'Votes by hour') }}</h4><span>{{ t('Hora local', 'Local time') }}</span></header>
          <div class="hours">
            @for (h of hours(); track h.hour) {
              <div class="hbar" [title]="h.hour + ':00 · ' + h.count">
                <i [style.height.%]="h.pct" [class.peak]="h.peak"></i>
              </div>
            }
          </div>
          <div class="axis"><span>0h</span><span>6h</span><span>12h</span><span>18h</span><span>23h</span></div>
        </section>
      </div>
    </div>
  `,
  styles: `
    .ins { margin: 0 0 1rem; display: flex; flex-direction: column; gap: 1rem; }
    .kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 190px), 1fr)); gap: .8rem; }
    .kpi {
      position: relative; overflow: hidden; display: flex; gap: .8rem; align-items: center; padding: 1rem; border-radius: 16px;
      background: var(--card-bg); border: 1px solid rgba(157,161,159,.3); box-shadow: 0 10px 22px -18px rgba(15,23,42,.6);
      animation: insUp .45s cubic-bezier(.2,.8,.2,1) both; transition: transform .25s, box-shadow .25s;
    }
    .kpi:nth-child(2) { animation-delay: .06s; } .kpi:nth-child(3) { animation-delay: .12s; } .kpi:nth-child(4) { animation-delay: .18s; }
    .kpi:hover { transform: translateY(-3px); box-shadow: 0 16px 26px -16px rgba(15,23,42,.6); }
    .kpi::before { content: ''; position: absolute; inset: 0 0 auto; height: 4px; background: linear-gradient(90deg, #E0577A, #BE3455, #9B2443); }
    .k-ico { flex: 0 0 auto; width: 46px; height: 46px; border-radius: 13px; display: grid; place-items: center; font-size: 1.1rem; color: #fff; background: linear-gradient(135deg, #E0577A, #9B2443); box-shadow: 0 8px 16px -8px rgba(190,52,85,.9); }
    .kpi div { display: flex; flex-direction: column; min-width: 0; }
    .kpi small { font-size: .68rem; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; color: var(--text-muted); }
    .kpi strong { font-family: var(--font-logo); font-size: 1.7rem; font-weight: 900; line-height: 1.1; font-variant-numeric: tabular-nums; }
    .trend { font-style: normal; font-size: .7rem; font-weight: 800; margin-top: .15rem; }
    .trend.up { color: #16A34A; } .trend.down { color: #DC2626; }
    .charts { display: grid; grid-template-columns: 1fr; gap: 1rem; }
    @media (min-width: 992px) { .charts { grid-template-columns: 1.6fr 1fr; } }
    .card { padding: 1rem 1.1rem .8rem; border-radius: 16px; background: var(--card-bg); border: 1px solid rgba(157,161,159,.3); box-shadow: 0 10px 22px -20px rgba(15,23,42,.5); animation: insUp .5s ease .15s both; }
    .card header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: .6rem; }
    .card h4 { font-size: .85rem; font-weight: 900; text-transform: uppercase; letter-spacing: .05em; }
    .card header span { font-size: .72rem; color: var(--text-muted); font-weight: 700; }
    .area { width: 100%; height: 180px; display: block; overflow: visible; }
    .grid { stroke: rgba(157,161,159,.3); stroke-dasharray: 4 6; }
    .line { fill: none; stroke: #BE3455; stroke-width: 3; stroke-linejoin: round; stroke-linecap: round; vector-effect: non-scaling-stroke; stroke-dasharray: 2000; stroke-dashoffset: 2000; animation: insDraw 1.6s ease forwards; }
    .fill { opacity: 0; animation: insFade .8s ease .6s forwards; }
    .dot { fill: #fff; stroke: #BE3455; stroke-width: 2; vector-effect: non-scaling-stroke; }
    .axis { display: flex; justify-content: space-between; font-size: .68rem; color: var(--text-muted); font-weight: 700; margin-top: .35rem; }
    .hours { display: grid; grid-template-columns: repeat(24, 1fr); gap: 3px; align-items: end; height: 180px; }
    .hbar { height: 100%; display: flex; align-items: flex-end; }
    .hbar i { display: block; width: 100%; min-height: 2px; border-radius: 4px 4px 1px 1px; background: linear-gradient(#9CA3AF, #CBD5E1); transform-origin: bottom; animation: insGrow .9s cubic-bezier(.2,.8,.2,1) both; }
    .hbar i.peak { background: linear-gradient(#E0577A, #9B2443); }
    @keyframes insUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
    @keyframes insDraw { to { stroke-dashoffset: 0; } }
    @keyframes insFade { to { opacity: 1; } }
    @keyframes insGrow { from { transform: scaleY(0); } to { transform: scaleY(1); } }
    @media (prefers-reduced-motion: reduce) { .kpi, .card, .line, .fill, .hbar i { animation: none !important; opacity: 1; stroke-dashoffset: 0; } }
  `,
})
export class AdminInsights {
  readonly i18n = inject(I18nService);
  readonly votes = input<VoteRecord[]>([]);

  private readonly times = computed(() =>
    this.votes()
      .map((v) => (Number.isFinite(v.timestamp) && v.timestamp > 0 ? v.timestamp : Date.parse(v.fecha)))
      .filter((ms) => Number.isFinite(ms)),
  );

  readonly total = computed(() => this.votes().length);
  readonly today = computed(() => {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    return this.times().filter((ms) => ms >= start.getTime()).length;
  });
  private readonly windowCount = (fromDaysAgo: number, toDaysAgo: number) => {
    const now = Date.now(); const day = 86_400_000;
    return this.times().filter((ms) => ms > now - fromDaysAgo * day && ms <= now - toDaysAgo * day).length;
  };
  readonly week = computed(() => this.windowCount(7, 0));
  readonly trend = computed<number | null>(() => {
    const prev = this.windowCount(14, 7);
    if (!prev) return null;
    return Math.round(((this.week() - prev) / prev) * 100);
  });

  readonly days = computed<DayPoint[]>(() => {
    const out: DayPoint[] = [];
    const counts = new Map<string, number>();
    for (const ms of this.times()) {
      const d = new Date(ms);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const base = new Date(); base.setHours(0, 0, 0, 0);
    for (let i = 29; i >= 0; i--) {
      const d = new Date(base); d.setDate(base.getDate() - i);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      out.push({ key, label: d.toLocaleDateString(this.i18n.lang() === 'en' ? 'en-US' : 'es-MX', { day: 'numeric', month: 'short' }), count: counts.get(key) ?? 0 });
    }
    return out;
  });

  readonly dots = computed(() => {
    const days = this.days();
    const max = Math.max(1, ...days.map((d) => d.count));
    return days.map((d, i) => ({ ...d, x: (i / (days.length - 1)) * 600, y: 170 - (d.count / max) * 150 }));
  });
  readonly linePath = computed(() => this.dots().map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '));
  readonly areaPath = computed(() => `${this.linePath()} L600,170 L0,170 Z`);

  readonly hours = computed(() => {
    const counts = Array.from({ length: 24 }, () => 0);
    for (const ms of this.times()) counts[new Date(ms).getHours()]++;
    const max = Math.max(1, ...counts);
    const peak = counts.indexOf(Math.max(...counts));
    return counts.map((count, hour) => ({ hour, count, pct: (count / max) * 100, peak: count > 0 && hour === peak }));
  });
  readonly peakHour = computed(() => {
    const top = this.hours().find((h) => h.peak);
    return top ? `${String(top.hour).padStart(2, '0')}:00` : '—';
  });

  t(es: string, en: string): string {
    return this.i18n.lang() === 'en' ? en : es;
  }
}
