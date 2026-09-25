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
}

@Component({
  selector: 'app-leaflet-map',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div #host class="map-host" aria-label="Mapa"></div>`,
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
      background: #e5e7eb;
    }
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

  private async init(): Promise<void> {
    const el = this.host().nativeElement;
    const box = el.closest('.map-box') ?? el.parentElement;
    const L = await import('leaflet');

    this.map = L.map(el, {
      scrollWheelZoom: false,
      tapHold: false,
      preferCanvas: true,
      zoomControl: true,
    }).setView(this.center(), this.zoom());

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri',
      maxZoom: 19,
    }).addTo(this.map);

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
      const L = await import('leaflet');
      this.pins.forEach((pin) => pin.remove());
      const points = this.markers().filter(
        (item) =>
          Number.isFinite(item.lat) &&
          Number.isFinite(item.lng) &&
          Math.abs(item.lat) <= 90 &&
          Math.abs(item.lng) <= 180,
      );
      this.pins = points.map((item) =>
        L.circleMarker([item.lat, item.lng], {
          radius: 9,
          color: '#7F1D1D',
          weight: 2,
          fillColor: '#BE3455',
          fillOpacity: 0.95,
        })
          .addTo(this.map!)
          .bindPopup(item.label),
      );

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
}
