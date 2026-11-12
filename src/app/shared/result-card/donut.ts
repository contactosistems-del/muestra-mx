import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export interface DonutSlice { label: string; percent: number; color: string; }

/** Dona animada en SVG: cada rebanada con el color de su partido y el líder al centro. */
@Component({
  selector: 'app-donut',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg viewBox="0 0 120 120" class="dn" role="img" [attr.aria-label]="aria()">
      <circle cx="60" cy="60" r="46" class="dn-bg" />
      @for (s of arcs(); track s.label; let i = $index) {
        <circle cx="60" cy="60" r="46" class="dn-seg"
          [attr.stroke]="s.color"
          [attr.stroke-dasharray]="s.len + ' ' + (C - s.len)"
          [attr.stroke-dashoffset]="-s.start"
          [style.animation-delay.ms]="i * 120">
          <title>{{ s.label }}: {{ s.percent.toFixed(1) }}%</title>
        </circle>
      }
      <text x="60" y="58" class="dn-big">{{ lead()?.percent?.toFixed(1) }}%</text>
      <text x="60" y="74" class="dn-small">{{ leadName() }}</text>
    </svg>
  `,
  styles: `
    :host { display: block; }
    .dn { width: 100%; height: auto; display: block; transform: rotate(-90deg); overflow: visible; }
    .dn-bg { fill: none; stroke: rgba(157,161,159,.18); stroke-width: 16; }
    .dn-seg { fill: none; stroke-width: 16; stroke-linecap: butt; opacity: 0; animation: dnIn .7s cubic-bezier(.2,.8,.2,1) forwards; transform-origin: 60px 60px; }
    .dn-seg:hover { stroke-width: 19; }
    text { transform: rotate(90deg); transform-origin: 60px 60px; text-anchor: middle; fill: currentColor; }
    .dn-big { font-family: var(--font-mono); font-size: 17px; font-weight: 700; }
    .dn-small { font-family: var(--font-sans); font-size: 7.5px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; opacity: .65; }
    @keyframes dnIn { from { opacity: 0; transform: rotate(-30deg) scale(.85); } to { opacity: 1; transform: none; } }
    @media (prefers-reduced-motion: reduce) { .dn-seg { animation: none; opacity: 1; } }
  `,
})
export class Donut {
  readonly slices = input<DonutSlice[]>([]);
  readonly C = 2 * Math.PI * 46;
  private readonly gap = 1.6;

  readonly arcs = computed(() => {
    const items = this.slices().filter((s) => s.percent > 0);
    const sum = items.reduce((a, s) => a + s.percent, 0) || 1;
    let start = 0;
    return items.map((s) => {
      const full = (s.percent / sum) * this.C;
      const len = Math.max(0.5, full - (items.length > 1 ? this.gap : 0));
      const arc = { ...s, len, start };
      start += full;
      return arc;
    });
  });
  readonly lead = computed(() => [...this.slices()].sort((a, b) => b.percent - a.percent)[0]);
  readonly leadName = computed(() => {
    const name = this.lead()?.label ?? '';
    const first = name.split(/\s+/)[0] ?? '';
    return first.length > 12 ? first.slice(0, 11) + '…' : first;
  });
  readonly aria = computed(() => this.slices().map((s) => `${s.label} ${s.percent.toFixed(1)}%`).join(', '));
}
