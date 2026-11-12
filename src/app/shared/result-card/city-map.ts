import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { tileUrl, worldPx } from '../city-geo';

/** Mapa estático de la ciudad (teselas CARTO) con un pin animado al centro. Sin librerías. */
@Component({
  selector: 'app-city-map',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="cm" [style.height.px]="height()">
      <div class="cm-tiles" [style.transform]="'translate(' + offset().x + 'px,' + offset().y + 'px)'">
        @for (t of tiles(); track t.key) {
          <img [src]="t.src" [style.left.px]="t.left" [style.top.px]="t.top" alt="" loading="lazy" decoding="async" />
        }
      </div>
      <div class="cm-shade"></div>
      <div class="cm-pin"><span class="cm-ring"></span><span class="cm-ring r2"></span><i class="fa-solid fa-location-dot"></i></div>
      <div class="cm-label"><i class="fa-solid fa-map-location-dot"></i> {{ label() }}</div>
    </div>
  `,
  styles: `
    :host { display: block; }
    .cm { position: relative; overflow: hidden; background: #11141B; }
    .cm-tiles { position: absolute; left: 50%; top: 50%; width: 0; height: 0; animation: cmDrift 18s ease-in-out infinite alternate; }
    .cm-tiles img { position: absolute; width: 256px; height: 256px; max-width: none; user-select: none; pointer-events: none; }
    .cm-shade {
      position: absolute; inset: 0;
      background:
        radial-gradient(circle at 50% 55%, transparent 0 18%, rgba(10,10,15,.35) 60%),
        linear-gradient(180deg, rgba(190,52,85,.25), rgba(10,10,15,.15) 45%, rgba(10,10,15,.75));
      mix-blend-mode: normal;
    }
    .cm-pin { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -85%); color: #FF4D7A; font-size: 1.9rem; filter: drop-shadow(0 4px 8px rgba(0,0,0,.6)); }
    .cm-ring { position: absolute; left: 50%; top: 100%; width: 14px; height: 6px; margin: -3px 0 0 -7px; border-radius: 50%; border: 2px solid #FF4D7A; animation: cmRing 2.2s ease-out infinite; }
    .cm-ring.r2 { animation-delay: 1.1s; }
    .cm-label {
      position: absolute; left: .9rem; bottom: .75rem; display: inline-flex; gap: .45rem; align-items: center;
      padding: .35rem .7rem; border-radius: 999px; background: rgba(10,10,15,.65); backdrop-filter: blur(6px);
      color: #fff; font-family: var(--font-mono); font-size: .7rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
    }
    .cm-label i { color: #FF8FAB; }
    @keyframes cmRing { from { transform: scale(1); opacity: .9; } to { transform: scale(6); opacity: 0; } }
    @keyframes cmDrift { from { margin-left: -6px; } to { margin-left: 6px; } }
    @media (prefers-reduced-motion: reduce) { .cm-tiles, .cm-ring { animation: none; } }
  `,
})
export class CityMap {
  readonly lat = input.required<number>();
  readonly lng = input.required<number>();
  readonly zoom = input(13);
  readonly height = input(150);
  readonly label = input('');

  private readonly center = computed(() => worldPx(this.lat(), this.lng(), this.zoom()));
  readonly tiles = computed(() => {
    const z = this.zoom();
    const c = this.center();
    const cx = Math.floor(c.x / 256);
    const cy = Math.floor(c.y / 256);
    const out: Array<{ key: string; src: string; left: number; top: number }> = [];
    for (let dx = -2; dx <= 2; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const x = cx + dx;
        const y = cy + dy;
        out.push({ key: `${x}-${y}`, src: tileUrl(x, y, z), left: x * 256, top: y * 256 });
      }
    }
    return out;
  });
  /** Desplaza las teselas para que la ciudad quede al centro del recuadro. */
  readonly offset = computed(() => ({ x: -this.center().x, y: -this.center().y }));
}
