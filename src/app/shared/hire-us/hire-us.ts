import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { I18nService } from '../../core/services/i18n.service';

/** Número de WhatsApp para contrataciones (formato internacional, sin "+" ni espacios). */
const WHATSAPP_NUMBER = '529982142201';

/** Botón flotante "Contrata nuestras encuestas" que abre WhatsApp con un mensaje listo. */
@Component({
  selector: 'app-hire-us',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'open.set(false)' },
  template: `
    @if (open()) {
      <div class="hu-backdrop" (click)="open.set(false)"></div>
      <div class="hu-card" role="dialog" aria-labelledby="hu-title">
        <button type="button" class="hu-close" (click)="open.set(false)" [attr.aria-label]="t('Cerrar', 'Close')">
          <i class="fa-solid fa-xmark" aria-hidden="true"></i>
        </button>
        <div class="hu-top">
          <span class="hu-eyebrow"><i class="fa-solid fa-briefcase" aria-hidden="true"></i> {{ t('Contrátanos', 'Hire us') }}</span>
          <h4 id="hu-title">{{ t('Encuestas profesionales para tu proyecto', 'Professional polling for your project') }}</h4>
          <p>{{ t('Datos claros para tomar mejores decisiones.', 'Clear data for better decisions.') }}</p>
        </div>
        <ul class="hu-list">
          @for (item of services; track item.icon; let i = $index) {
            <li [style.animation-delay.ms]="80 + i * 70">
              <span class="hu-ico"><i class="fa-solid {{ item.icon }}" aria-hidden="true"></i></span>
              {{ t(item.es, item.en) }}
            </li>
          }
        </ul>
        <a class="hu-wa" [href]="waUrl()" target="_blank" rel="noopener" (click)="open.set(false)">
          <i class="fa-brands fa-whatsapp" aria-hidden="true"></i> {{ t('Escríbenos por WhatsApp', 'Message us on WhatsApp') }}
        </a>
        <p class="hu-note">{{ t('Respuesta rápida · Cotización sin costo', 'Fast reply · Free quote') }}</p>
      </div>
    }

    <button type="button" class="hu-fab" [class.is-open]="open()" (click)="open.update((v) => !v)" [attr.aria-expanded]="open()">
      <span class="hu-fab-icon"><i class="fa-brands fa-whatsapp" aria-hidden="true"></i></span>
      <span class="hu-fab-text">{{ t('Contrata nuestras encuestas', 'Hire our polling services') }}</span>
    </button>
  `,
  styles: `
    :host { position: fixed; left: 20px; bottom: 30px; z-index: 3100; }
    .hu-fab {
      display: flex; align-items: center; gap: .6rem; padding: .45rem 1.1rem .45rem .45rem; border: none; border-radius: 999px;
      background: linear-gradient(135deg, #2EE07A, #25D366 45%, #128C7E); color: #fff; cursor: pointer;
      font-weight: 900; font-size: .82rem; letter-spacing: .03em; text-transform: uppercase;
      box-shadow: 0 12px 26px -10px rgba(18, 140, 126, .8);
      animation: huIn .7s cubic-bezier(.2, .8, .2, 1) .5s both, huRing 2.8s ease-out 2s infinite;
      transition: transform .25s cubic-bezier(.2, .8, .2, 1), box-shadow .25s;
    }
    .hu-fab:hover { transform: translateY(-3px) scale(1.03); box-shadow: 0 18px 30px -10px rgba(18, 140, 126, .9); }
    .hu-fab-icon {
      display: grid; place-items: center; width: 42px; height: 42px; border-radius: 50%; background: rgba(255, 255, 255, .22);
      font-size: 1.5rem; transition: transform .35s ease;
    }
    .hu-fab:hover .hu-fab-icon, .hu-fab.is-open .hu-fab-icon { transform: rotate(-12deg) scale(1.08); }
    .hu-fab-text { white-space: nowrap; }

    .hu-backdrop { position: fixed; inset: 0; background: rgba(15, 23, 42, .35); backdrop-filter: blur(3px); animation: huFade .25s ease; }
    .hu-card {
      position: absolute; left: 0; bottom: calc(100% + 14px); width: min(340px, calc(100vw - 40px));
      background: var(--card-bg, #fff); color: var(--text-color, #111); border-radius: 18px; overflow: hidden;
      box-shadow: 0 24px 50px -18px rgba(0, 0, 0, .5); animation: huPop .35s cubic-bezier(.2, .8, .2, 1);
    }
    .hu-close {
      position: absolute; top: .6rem; right: .6rem; z-index: 1; width: 32px; height: 32px; border-radius: 50%; border: none;
      background: rgba(255, 255, 255, .2); color: #fff; cursor: pointer; font-size: 1rem; transition: transform .2s, background .2s;
    }
    .hu-close:hover { transform: rotate(90deg); background: rgba(255, 255, 255, .35); }
    .hu-top { padding: 1.3rem 1.3rem 1.1rem; color: #fff; background: linear-gradient(135deg, #0A0A0A, #3B0D1C 55%, #BE3455); }
    .hu-eyebrow {
      display: inline-flex; align-items: center; gap: .4rem; font-size: .68rem; font-weight: 800; letter-spacing: .14em;
      text-transform: uppercase; padding: .3rem .65rem; border-radius: 999px; background: rgba(255, 255, 255, .16);
    }
    .hu-top h4 { font-family: var(--font-logo); font-size: 1.2rem; font-weight: 900; line-height: 1.2; margin: .6rem 0 .35rem; padding-right: 1.5rem; }
    .hu-top p { font-size: .85rem; color: rgba(255, 255, 255, .82); }
    .hu-list { list-style: none; padding: 1rem 1.3rem .4rem; display: flex; flex-direction: column; gap: .55rem; }
    .hu-list li { display: flex; align-items: center; gap: .65rem; font-size: .9rem; font-weight: 700; animation: huUp .4s ease both; }
    .hu-ico {
      flex: 0 0 auto; display: grid; place-items: center; width: 32px; height: 32px; border-radius: 9px;
      background: rgba(190, 52, 85, .12); color: var(--brand-red, #BE3455); font-size: .9rem;
    }
    .hu-wa {
      display: flex; align-items: center; justify-content: center; gap: .55rem; margin: .8rem 1.3rem .5rem; padding: .85rem 1rem;
      border-radius: 12px; background: linear-gradient(135deg, #2EE07A, #25D366 45%, #128C7E); color: #fff; font-weight: 900;
      font-size: .92rem; text-decoration: none; box-shadow: 0 10px 20px -10px rgba(18, 140, 126, .9);
      transition: transform .2s, box-shadow .2s;
    }
    .hu-wa i { font-size: 1.3rem; }
    .hu-wa:hover { transform: translateY(-2px); box-shadow: 0 16px 26px -10px rgba(18, 140, 126, .95); }
    .hu-note { text-align: center; font-size: .74rem; color: var(--text-muted, #4B5563); padding: 0 1rem 1rem; }

    @keyframes huIn { from { opacity: 0; transform: translateX(-60px) scale(.7); } to { opacity: 1; transform: none; } }
    @keyframes huRing { 0% { box-shadow: 0 12px 26px -10px rgba(18, 140, 126, .8), 0 0 0 0 rgba(37, 211, 102, .55); } 80%, 100% { box-shadow: 0 12px 26px -10px rgba(18, 140, 126, .8), 0 0 0 18px rgba(37, 211, 102, 0); } }
    @keyframes huPop { from { opacity: 0; transform: translateY(16px) scale(.95); } to { opacity: 1; transform: none; } }
    @keyframes huUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
    @keyframes huFade { from { opacity: 0; } to { opacity: 1; } }

    @media (max-width: 720px) {
      :host { left: 14px; bottom: 22px; }
      .hu-fab { padding: .4rem; }
      .hu-fab-text { display: none; }
      .hu-fab-icon { width: 46px; height: 46px; background: transparent; font-size: 1.7rem; }
    }
    @media (prefers-reduced-motion: reduce) {
      .hu-fab, .hu-card, .hu-list li, .hu-backdrop { animation: none !important; }
    }
  `,
})
export class HireUs {
  readonly i18n = inject(I18nService);
  readonly open = signal(false);

  readonly services = [
    { icon: 'fa-check-to-slot', es: 'Encuestas electorales', en: 'Election polls' },
    { icon: 'fa-comments', es: 'Sondeos de opinión pública', en: 'Public opinion surveys' },
    { icon: 'fa-chart-line', es: 'Estudios de mercado', en: 'Market research' },
    { icon: 'fa-map-location-dot', es: 'Mapas de resultados por zona', en: 'Results maps by area' },
  ];

  readonly waUrl = computed(() => {
    const text = this.t(
      'Hola MUESTRA.MX, me interesa contratar sus servicios de encuestas.',
      'Hi MUESTRA.MX, I am interested in hiring your polling services.',
    );
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  });

  t(es: string, en: string): string {
    return this.i18n.lang() === 'en' ? en : es;
  }
}
