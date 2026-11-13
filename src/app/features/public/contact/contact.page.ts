import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule, type NgForm } from '@angular/forms';
import { OFFICES } from '../../../data/catalog';
import { I18nService } from '../../../core/services/i18n.service';
import { LeafletMap } from '../../../shared/leaflet-map/leaflet-map';

/** Correo que recibe los mensajes del formulario de contacto. */
const CONTACT_EMAIL = 'muestramx@gmail.com';

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
            <div class="ok-box">
              <i class="fa-solid fa-circle-check"></i>
              <div>
                <strong>{{ t('¡Mensaje enviado!', 'Message sent!') }}</strong>
                <span>{{ t('Te responderemos muy pronto a tu correo.', 'We will reply to your email soon.') }}</span>
              </div>
            </div>
          } @else {
            <form #contactForm="ngForm" (ngSubmit)="submit(contactForm)">
              <div class="input-group">
                <label class="req">{{ i18n.t('name') }}</label>
                <input name="name" [(ngModel)]="name" required />
              </div>
              <div class="input-group">
                <label class="req">{{ i18n.t('email') }}</label>
                <input type="email" name="email" [(ngModel)]="email" required />
              </div>
              <div class="input-group">
                <label>{{ t('Teléfono / WhatsApp (opcional)', 'Phone / WhatsApp (optional)') }}</label>
                <input type="tel" name="phone" [(ngModel)]="phone" inputmode="tel" />
              </div>
              <div class="input-group">
                <label>{{ t('Me interesa', 'I am interested in') }}</label>
                <select name="topic" [(ngModel)]="topic">
                  @for (opt of topics; track opt.es) {
                    <option [value]="opt.es">{{ t(opt.es, opt.en) }}</option>
                  }
                </select>
              </div>
              <div class="input-group">
                <label class="req">{{ i18n.t('message') }}</label>
                <textarea name="message" rows="4" [(ngModel)]="message" required></textarea>
              </div>
              <input type="text" name="_honey" [(ngModel)]="honey" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true" />
              @if (error()) {
                <p class="err">{{ error() }}</p>
              }
              <button class="btn-votar-activo" type="submit" [disabled]="sending()">
                @if (sending()) { <i class="fa-solid fa-spinner fa-spin"></i> {{ t('Enviando…', 'Sending…') }} } @else { {{ i18n.t('send') }} }
              </button>
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
    .ok-box { display: flex; gap: .8rem; align-items: center; padding: 1rem; border-radius: 14px; background: #DCFCE7; color: #14532D; }
    .ok-box i { font-size: 1.8rem; color: #16A34A; }
    .ok-box div { display: flex; flex-direction: column; gap: .2rem; }
    .err { color: #B91C1C; font-weight: 700; font-size: .85rem; margin: .2rem 0 .6rem; }
    .hp { position: absolute; left: -9999px; width: 1px; height: 1px; opacity: 0; }
    h4 { margin-bottom: 1rem; color: var(--brand-red); font-weight: 900; }
    label.req::after { content: ' *'; color: var(--brand-red); }
  `,
})
export class ContactPage {
  readonly i18n = inject(I18nService);
  readonly offices = OFFICES;
  readonly markers = computed(() =>
    OFFICES.map((office) => ({ lat: office.lat, lng: office.lng, label: this.i18n.tx(office.name) })),
  );
  readonly sent = signal(false);
  readonly sending = signal(false);
  readonly error = signal('');
  readonly topics = [
    { es: 'Contratar una encuesta', en: 'Hiring a poll' },
    { es: 'Publicidad en el portal', en: 'Advertising on the site' },
    { es: 'Enviar una noticia o boletín', en: 'Sending news or a press release' },
    { es: 'Otro', en: 'Other' },
  ];
  phone = '';
  topic = 'Contratar una encuesta';
  honey = '';
  name = '';
  email = '';
  message = '';

  t(es: string, en: string): string {
    return this.i18n.lang() === 'en' ? en : es;
  }

  /** Envía el mensaje al correo de MUESTRA.MX (servicio FormSubmit). */
  async submit(form: NgForm): Promise<void> {
    form.control.markAllAsTouched();
    if (form.invalid || !this.name.trim() || !this.email.trim() || !this.message.trim()) return;
    if (this.honey) {
      this.sent.set(true);
      return;
    }
    this.sending.set(true);
    this.error.set('');
    try {
      const res = await fetch(`https://formsubmit.co/ajax/${CONTACT_EMAIL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          _subject: `MUESTRA.MX · ${this.topic} · ${this.name.trim()}`,
          _template: 'table',
          _captcha: 'false',
          _replyto: this.email.trim(),
          Nombre: this.name.trim(),
          Correo: this.email.trim(),
          'Teléfono / WhatsApp': this.phone.trim() || '—',
          Interés: this.topic,
          Mensaje: this.message.trim(),
          Página: typeof location !== 'undefined' ? location.href : 'https://muestra.mx/contacto',
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { success?: string | boolean };
      if (!res.ok || String(data.success) === 'false') throw new Error('send');
      this.sent.set(true);
    } catch {
      this.error.set(this.t('No se pudo enviar. Intenta de nuevo o escríbenos por WhatsApp.', 'Could not send. Try again or message us on WhatsApp.'));
    } finally {
      this.sending.set(false);
    }
  }
}
