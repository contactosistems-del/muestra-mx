import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  viewChild,
} from '@angular/core';
import type { CircleMarker, Map as LeafletMapType } from 'leaflet';

export interface MapMarker {
  lat: number;
  lng: number;
  label: string;
  /** Opcional: agrupa puntos cercanos y cuenta por esta etiqueta (p. ej. el candidato). */
  group?: string;
}

interface Bubble {
  lat: number;
  lng: number;
  total: number;
  labels: string[];
  groups: Map<string, number>;
}

type LeafletNS = typeof import('leaflet');

@Component({
  selector: 'app-leaflet-map',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div #host class="map-host" aria-label="Mapa"></div>
    <button type="button" class="map-reset" (click)="fit()" title="Centrar mapa" aria-label="Centrar mapa">
      <i class="fa-solid fa-crosshairs" aria-hidden="true"></i>
    </button>
  `,
  styles: `
    :host {
      display: block;
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
    }
    .map-host {
      width: 100%;
      height: 100%;
      background: #dfe7ee;
    }
    .map-reset {
      position: absolute; left: 10px; bottom: 26px; z-index: 500;
      width: 38px; height: 38px; border-radius: 10px; border: none; cursor: pointer;
      background: #fff; color: #111; font-size: 1rem;
      box-shadow: 0 6px 16px -6px rgba(0, 0, 0, .45);
      transition: transform .2s ease, background .2s ease, color .2s ease;
    }
    .map-reset:hover { transform: scale(1.08); background: var(--brand-red, #BE3455); color: #fff; }
  `,
})
export class LeafletMap {
  readonly markers = input<MapMarker[]>([]);
  readonly center = input<[number, number]>([21.16, -86.85]);
  readonly zoom = input(5);
  private readonly host = viewChild.required<ElementRef<HTMLDivElement>>('host');
  private readonly destroyRef = inject(DestroyRef);
  private map?: LeafletMapType;
  private pins: CircleMarker[] = [];
  private resizeObs?: ResizeObserver;
  private refreshTimers: number[] = [];
  private syncing = false;
  private L?: LeafletNS;
  private points: MapMarker[] = [];

  constructor() {
    afterNextRender(() => void this.init());
    effect(() => {
      this.markers();
      if (this.map) void this.syncMarkers();
    });
    this.destroyRef.onDestroy(() => {
      this.resizeObs?.disconnect();
      this.refreshTimers.forEach((id) => clearTimeout(id));
      this.map?.remove();
      this.map = undefined;
    });
  }

  private async leaflet(): Promise<LeafletNS> {
    if (this.L) return this.L;
    const mod = await import('leaflet');
    const ns = (mod as { default?: LeafletNS }).default ?? (mod as LeafletNS);
    this.L = ns;
    return ns;
  }

  private async init(): Promise<void> {
    const el = this.host().nativeElement;
    const box = el.closest('.map-box') ?? el.parentElement;
    const L = await this.leaflet();
    if (typeof L.map !== 'function') return;

    this.map = L.map(el, {
      scrollWheelZoom: false,
      tapHold: false,
      preferCanvas: true,
      zoomControl: true,
    }).setView(this.center(), this.zoom());

    const esri = (service: string) =>
      L.tileLayer(`https://server.arcgisonline.com/ArcGIS/rest/services/${service}/MapServer/tile/{z}/{y}/{x}`, {
        attribution: 'Tiles &copy; Esri',
        maxZoom: 19,
      });
    const base = {
      Mapa: esri('World_Street_Map'),
      Claro: esri('Canvas/World_Light_Gray_Base'),
      Oscuro: esri('Canvas/World_Dark_Gray_Base'),
      'Satélite': esri('World_Imagery'),
    };
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    (dark ? base.Oscuro : base.Mapa).addTo(this.map);
    L.control.layers(base, undefined, { position: 'topright' }).addTo(this.map);
    L.control.scale({ imperial: false, position: 'bottomright' }).addTo(this.map);

    this.resizeObs = new ResizeObserver(() => this.invalidate());
    this.resizeObs.observe(el);
    if (box) this.resizeObs.observe(box);

    await this.syncMarkers();
    this.invalidate();
    for (const ms of [80, 250, 700]) {
      this.refreshTimers.push(window.setTimeout(() => this.invalidate(), ms));
    }
  }

  private invalidate(): void {
    if (!this.map) return;
    const el = this.host().nativeElement;
    if (el.clientWidth < 32 || el.clientHeight < 32) return;
    this.map.invalidateSize({ animate: false });
  }

  private async syncMarkers(): Promise<void> {
    if (!this.map || this.syncing) return;
    this.syncing = true;
    try {
      const L = await this.leaflet();
      this.pins.forEach((pin) => pin.remove());
      const points = this.markers().filter(
        (item) =>
          Number.isFinite(item.lat) &&
          Number.isFinite(item.lng) &&
          Math.abs(item.lat) <= 90 &&
          Math.abs(item.lng) <= 180,
      );
      const bubbles = this.cluster(points);
      const max = Math.max(1, ...bubbles.map((b) => b.total));
      this.pins = bubbles.map((b) => {
        const radius = b.total === 1 ? 8 : Math.min(30, 9 + Math.sqrt(b.total / max) * 21);
        return L.circleMarker([b.lat, b.lng], {
          radius,
          color: '#FFFFFF',
          weight: 2.5,
          fillColor: '#BE3455',
          fillOpacity: b.total === 1 ? 0.9 : 0.78,
          className: 'mx-bubble',
        })
          .addTo(this.map!)
          .bindTooltip(b.total > 1 ? String(b.total) : '', {
            permanent: b.total > 1,
            direction: 'center',
            className: 'mx-bubble-count',
          })
          .bindPopup(this.popupHtml(b), { className: 'mx-popup', maxWidth: 260 });
      });

      this.points = points;
      this.invalidate();
      if (points.length === 1) {
        this.map.setView([points[0]!.lat, points[0]!.lng], Math.max(this.zoom(), 8));
      } else if (points.length > 1) {
        this.map.fitBounds(
          L.latLngBounds(points.map((item) => [item.lat, item.lng] as [number, number])),
          { padding: [24, 24], maxZoom: 10 },
        );
      } else {
        this.map.setView(this.center(), this.zoom());
      }
    } finally {
      this.syncing = false;
    }
  }

  /** Vuelve a encuadrar todos los puntos. */
  fit(): void {
    if (!this.map || !this.L) return;
    const pts = this.points;
    if (pts.length === 1) this.map.flyTo([pts[0]!.lat, pts[0]!.lng], Math.max(this.zoom(), 8), { duration: 0.6 });
    else if (pts.length > 1) this.map.flyToBounds(this.L.latLngBounds(pts.map((p) => [p.lat, p.lng] as [number, number])), { padding: [24, 24], maxZoom: 10, duration: 0.6 });
    else this.map.flyTo(this.center(), this.zoom(), { duration: 0.6 });
  }

  /** Junta los puntos que caen en la misma zona (~1 km) en una sola burbuja. */
  private cluster(points: MapMarker[]): Bubble[] {
    const byKey = new Map<string, Bubble>();
    for (const p of points) {
      const key = `${p.lat.toFixed(2)},${p.lng.toFixed(2)}`;
      let b = byKey.get(key);
      if (!b) {
        b = { lat: 0, lng: 0, total: 0, labels: [], groups: new Map() };
        byKey.set(key, b);
      }
      b.lat = (b.lat * b.total + p.lat) / (b.total + 1);
      b.lng = (b.lng * b.total + p.lng) / (b.total + 1);
      b.total += 1;
      if (p.group) b.groups.set(p.group, (b.groups.get(p.group) ?? 0) + 1);
      else if (b.labels.length < 5) b.labels.push(p.label);
    }
    return [...byKey.values()].sort((a, b) => b.total - a.total);
  }

  private popupHtml(b: Bubble): string {
    const esc = (t: string) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
    if (b.groups.size) {
      const rows = [...b.groups.entries()]
        .sort((x, y) => y[1] - x[1])
        .map(([name, n]) => {
          const pct = Math.round((n / b.total) * 100);
          return `<div class="mx-row"><span>${esc(name)}</span><strong>${n} · ${pct}%</strong></div>`
            + `<div class="mx-track"><i style="width:${pct}%"></i></div>`;
        })
        .join('');
      return `<div class="mx-pop"><div class="mx-pop-head">${b.total} ${b.total === 1 ? 'voto' : 'votos'} en esta zona</div>${rows}</div>`;
    }
    const list = b.labels.map((l) => `<div class="mx-row"><span>${esc(l)}</span></div>`).join('');
    const head = b.total > 1 ? `<div class="mx-pop-head">${b.total} registros</div>` : '';
    return `<div class="mx-pop">${head}${list}</div>`;
  }
}
