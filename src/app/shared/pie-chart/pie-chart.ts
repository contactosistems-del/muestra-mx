import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Colores de las rebanadas, en orden. El primero es el rojo de la marca. */
export const PIE_COLORS = ['#BE3455', '#1F6FB2', '#2E9E5B', '#E0A21B', '#7A4FB5', '#E46A2E', '#1BA3A8', '#6B6F6D'];

export function pieColor(index: number): string {
  return PIE_COLORS[index % PIE_COLORS.length];
}

interface PieSlice {
  label: string;
  percent: number;
  color: string;
  path: string;
  full: boolean;
}

/** Gráfica de pastel en SVG, sin librerías. Recibe la lista de opciones con su porcentaje. */
@Component({
  selector: 'app-pie-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg class="pie" viewBox="0 0 200 200" role="img" [attr.aria-label]="ariaLabel()">
      @for (slice of slices(); track slice.label) {
        @if (slice.full) {
          <circle cx="100" cy="100" r="96" [attr.fill]="slice.color">
            <title>{{ slice.label }}: {{ slice.percent }}%</title>
          </circle>
        } @else {
          <path [attr.d]="slice.path" [attr.fill]="slice.color">
            <title>{{ slice.label }}: {{ slice.percent }}%</title>
          </path>
        }
      }
    </svg>
  `,
  styles: `
    :host { display: block; }
    .pie { display: block; width: 100%; height: auto; }
    path, circle { stroke: var(--card-bg, #fff); stroke-width: 2; stroke-linejoin: round; transition: opacity .2s ease; }
    path:hover, circle:hover { opacity: .85; }
  `,
})
export class PieChart {
  readonly options = input.required<Array<{ label: string; percent: number }>>();

  readonly slices = computed<PieSlice[]>(() => {
    const opts = this.options();
    const total = opts.reduce((sum, o) => sum + Math.max(0, o.percent), 0);
    if (total <= 0) return [];

    const cx = 100;
    const cy = 100;
    const r = 96;
    let angle = -Math.PI / 2; // empieza arriba, a las 12
    const result: PieSlice[] = [];

    opts.forEach((opt, i) => {
      const value = Math.max(0, opt.percent);
      if (value === 0) return;
      const sweep = (value / total) * Math.PI * 2;
      const color = pieColor(i);
      if (sweep >= Math.PI * 2 - 1e-6) {
        result.push({ label: opt.label, percent: opt.percent, color, path: '', full: true });
        return;
      }
      const x1 = cx + r * Math.cos(angle);
      const y1 = cy + r * Math.sin(angle);
      const end = angle + sweep;
      const x2 = cx + r * Math.cos(end);
      const y2 = cy + r * Math.sin(end);
      const large = sweep > Math.PI ? 1 : 0;
      const path = `M ${cx} ${cy} L ${x1.toFixed(3)} ${y1.toFixed(3)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(3)} ${y2.toFixed(3)} Z`;
      result.push({ label: opt.label, percent: opt.percent, color, path, full: false });
      angle = end;
    });
    return result;
  });

  readonly ariaLabel = computed(() =>
    this.options()
      .map((o) => `${o.label} ${o.percent}%`)
      .join(', '),
  );
}
