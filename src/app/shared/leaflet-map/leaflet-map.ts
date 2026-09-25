import { afterNextRender, ChangeDetectionStrategy, Component, effect, ElementRef, input, viewChild } from '@angular/core';
import type { CircleMarker, Map as LeafletMapType } from 'leaflet';

export interface MapMarker {
  lat: number;
  lng: number;
  label: string;
}

@Component({
  selector: 'app-leaflet-map',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div #host class="map-host"></div>`,
  styles: `
    :host { display: block; width: 100%; height: 100%; min-height: inherit; }
    .map-host { width: 100%; height: 100%; min-height: inherit; border-radius: 8px; }
  `,
})
export class LeafletMap {
  readonly markers = input<MapMarker[]>([]);
  readonly center = input<[number, number]>([21.16, -86.85]);
  readonly zoom = input(5);
  private readonly host = viewChild.required<ElementRef<HTMLDivElement>>('host');
  private map?: LeafletMapType;
  private pins: CircleMarker[] = [];

  constructor() {
    afterNextRender(() => void this.init());
    effect(() => {
      this.markers();
      if (this.map) void this.sync();
    });
  }

  private async init(): Promise<void> {
    const L = await import('leaflet');
    this.map = L.map(this.host().nativeElement, { scrollWheelZoom: true }).setView(this.center(), this.zoom());
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, OpenStreetMap',
      maxZoom: 19,
    }).addTo(this.map);
    await this.sync();
    setTimeout(() => {
      this.map?.invalidateSize();
      void this.sync();
    }, 250);
  }

  private async sync(): Promise<void> {
    if (!this.map) return;
    const L = await import('leaflet');
    this.pins.forEach((pin) => pin.remove());
    const points = this.markers().filter(
      (item) => Number.isFinite(item.lat) && Number.isFinite(item.lng) && Math.abs(item.lat) <= 90 && Math.abs(item.lng) <= 180,
    );
    this.pins = points.map((item) =>
      L.circleMarker([item.lat, item.lng], {
        radius: 10,
        color: '#7F1D1D',
        weight: 2,
        fillColor: '#BE3455',
        fillOpacity: 0.95,
      })
        .addTo(this.map!)
        .bindPopup(item.label),
    );

    if (points.length === 1) {
      this.map.setView([points[0]!.lat, points[0]!.lng], Math.max(this.zoom(), 8));
    } else if (points.length > 1) {
      this.map.fitBounds(
        L.latLngBounds(points.map((item) => [item.lat, item.lng] as [number, number])),
        { padding: [28, 28], maxZoom: 10 },
      );
    }
  }
}
