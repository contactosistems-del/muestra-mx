import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OFFICES } from '../../../data/catalog';
import { I18nService } from '../../../core/services/i18n.service';
import { LeafletMap } from '../../../shared/leaflet-map/leaflet-map';

@Component({
  selector: 'app-contact-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, LeafletMap],
  template: `
    <section class="contacto-section">
      <h3 class="page-title"><i class="fa-solid fa-address-book"></i> {{ i18n.t('contactTitle') }}</h3>
      <p class="muted">{{ i18n.t('contactLead') }}</p>
      <div class="contacto-grid">
        <div>
          @for (office of offices; track office.address) {
            <div class="dir-box">
              <h5><i class="fa-solid fa-location-dot"></i> {{ i18n.tx(office.name) }}</h5>
              <p>{{ office.address }}</p>
            </div>
          }
          <h5 class="map-label">{{ i18n.t('officesMap') }}</h5>
          <div class="map-box">
            <app-leaflet-map [markers]="markers()" [center]="[23.6, -102.5]" [zoom]="5" />
          </div>
        </div>
        <div class="nosotros-card">
          <h4>{{ i18n.t('contactForm') }}</h4>
          @if (sent()) {
            <p class="ok">{{ i18n.t('sent') }}</p>
          } @else {
            <form (ngSubmit)="submit()">
              <div class="input-group">
                <label>{{ i18n.t('name') }}</label>
                <input name="name" [(ngModel)]="name" required />
              </div>
              <div class="input-group">
                <label>{{ i18n.t('email') }}</label>
                <input type="email" name="email" [(ngModel)]="email" required />
              </div>
              <div class="input-group">
                <label>{{ i18n.t('message') }}</label>
                <textarea name="message" rows="4" [(ngModel)]="message" required></textarea>
              </div>
              <button class="btn-votar-activo" type="submit">{{ i18n.t('send') }}</button>
            </form>
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    .page-title { font-size: clamp(1.25rem, 4vw, 1.8rem); font-weight: 800; margin-bottom: .5rem; }
    .page-title i { color: var(--brand-red); }
    .muted { color: var(--text-muted); margin-bottom: 1.5rem; font-size: .9rem; }
    .dir-box + .dir-box { margin-top: 1rem; }
    .map-label { font-size: .85rem; font-weight: 800; margin: 1.5rem 0 .5rem; }
    .map-box { width: 100%; height: 300px; min-height: 300px; position: relative; background: #e5e7eb; border-radius: 8px; overflow: hidden; }
    @media (max-width: 720px) {
      .map-box { height: 240px; min-height: 240px; }
    }
    .ok { color: #15803D; font-weight: 700; }
    h4 { margin-bottom: 1rem; color: var(--brand-red); font-weight: 900; }
  `,
})
export class ContactPage {
  readonly i18n = inject(I18nService);
  readonly offices = OFFICES;
  readonly markers = computed(() =>
    OFFICES.map((office) => ({ lat: office.lat, lng: office.lng, label: this.i18n.tx(office.name) })),
  );
  readonly sent = signal(false);
  name = '';
  email = '';
  message = '';

  submit(): void {
    this.sent.set(true);
  }
}
