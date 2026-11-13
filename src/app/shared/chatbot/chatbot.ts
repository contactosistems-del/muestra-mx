import { ChangeDetectionStrategy, Component, ElementRef, effect, inject, signal, untracked, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { I18nService } from '../../core/services/i18n.service';

/** Número de WhatsApp para ventas (formato internacional, sin "+"). */
const WHATSAPP = '529982142201';

interface Faq {
  id: string;
  q: { es: string; en: string };
  a: { es: string; en: string };
  /** Palabras que, si el usuario las escribe, disparan esta respuesta. */
  keys: string[];
  cta?: 'whatsapp' | 'contact' | 'results' | 'news';
}

/**
 * Preguntas rápidas del chatbot. Para cambiar textos, editar esta lista.
 * Están pensadas para vender los servicios de encuestas y el portal.
 */
const FAQS: Faq[] = [
  {
    id: 'services',
    q: { es: '¿Qué ofrecen?', en: 'What do you offer?' },
    a: {
      es: 'Tres cosas:\n• Encuestas para campañas y gobiernos\n• Estudios de mercado para negocios\n• Publicidad para tu negocio en el portal y redes',
      en: 'Three things:\n• Polls for campaigns and governments\n• Market research for businesses\n• Advertising for your business on our site and socials',
    },
    keys: ['servicio', 'ofrecen', 'hacen', 'service', 'offer'],
    cta: 'whatsapp',
  },
  {
    id: 'price',
    q: { es: 'Cotizar una encuesta', en: 'Get a poll quote' },
    a: {
      es: 'El precio depende de la zona y el número de preguntas. La cotización es gratis por WhatsApp.',
      en: 'Price depends on area and number of questions. Quotes are free on WhatsApp.',
    },
    keys: ['cuesta', 'precio', 'costo', 'cotiza', 'cobran', 'candidat', 'campaña', 'campana', 'price', 'cost', 'quote'],
    cta: 'whatsapp',
  },
  {
    id: 'ads',
    q: { es: 'Anunciar mi negocio', en: 'Advertise my business' },
    a: {
      es: 'Tu negocio puede aparecer en muestra.mx y en nuestras redes, con planes accesibles para comercios de Quintana Roo. Pregúntanos por WhatsApp.',
      en: 'Your business can appear on muestra.mx and our socials, with affordable plans for Quintana Roo businesses. Ask us on WhatsApp.',
    },
    keys: ['anunci', 'publicidad', 'promocion', 'negocio', 'comercio', 'empresa', 'banner', 'advert', 'business'],
    cta: 'whatsapp',
  },
  {
    id: 'vote',
    q: { es: '¿Cómo voto?', en: 'How do I vote?' },
    a: {
      es: 'Abre una encuesta, toca tu opción y presiona votar. Es anónimo y un voto por dispositivo.',
      en: 'Open a poll, tap your choice and press vote. Anonymous, one vote per device.',
    },
    keys: ['votar', 'voto', 'participar', 'vote'],
    cta: 'results',
  },
  {
    id: 'news',
    q: { es: 'Enviar una noticia', en: 'Send news' },
    a: {
      es: 'Mándanos tu información por Contacto o WhatsApp y la revisamos.',
      en: 'Send it via Contact or WhatsApp and we will review it.',
    },
    keys: ['noticia', 'boletin', 'nota', 'prensa', 'news', 'press'],
    cta: 'contact',
  },
];

interface Msg { role: 'bot' | 'user'; text: string; cta?: Faq['cta']; }

@Component({
  selector: 'app-chatbot',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <button class="chatbot-float-trigger" type="button" (click)="open.set(!open())" [title]="i18n.t('chatToggle')">
      <i class="fa-solid" [class.fa-comments]="!open()" [class.fa-xmark]="open()"></i>
    </button>
    @if (open()) {
      <div class="chatbot-window active">
        <div class="chatbot-header cb-head">
          <span class="cb-title">
            <span class="cb-avatar"><i class="fa-solid fa-robot"></i></span>
            <span>
              <strong>{{ i18n.t('chatTitle') }}</strong>
              <small><i class="cb-dot"></i> {{ t('En línea', 'Online') }}</small>
            </span>
          </span>
          <button type="button" (click)="open.set(false)">&times;</button>
        </div>
        <div class="chatbot-body" #body>
          @for (msg of messages(); track $index) {
            <div class="chat-msg" [class.bot]="msg.role === 'bot'" [class.user]="msg.role === 'user'">
              {{ msg.text }}
              @if (msg.cta === 'whatsapp') {
                <a class="cb-cta cb-wa" [href]="waUrl()" target="_blank" rel="noopener"><i class="fa-brands fa-whatsapp"></i> {{ t('Cotizar por WhatsApp', 'Quote on WhatsApp') }}</a>
              } @else if (msg.cta === 'contact') {
                <button type="button" class="cb-cta" (click)="go('/contacto')"><i class="fa-solid fa-envelope"></i> {{ t('Ir a Contacto', 'Go to Contact') }}</button>
              } @else if (msg.cta === 'results') {
                <button type="button" class="cb-cta" (click)="go('/graficas')"><i class="fa-solid fa-chart-pie"></i> {{ t('Ver encuestas', 'See polls') }}</button>
              }
            </div>
          }
          @if (typing()) {
            <div class="chat-msg bot cb-typing"><span></span><span></span><span></span></div>
          }
        </div>
        <div class="cb-chips">
          @for (f of faqs; track f.id) {
            <button type="button" class="cb-chip" (click)="ask(f)">{{ t(f.q.es, f.q.en) }}</button>
          }
        </div>
        <div class="chatbot-footer">
          <input [(ngModel)]="draft" name="chat" [placeholder]="i18n.t('chatPlaceholder')" (keyup.enter)="send()" />
          <button type="button" (click)="send()"><i class="fa-solid fa-paper-plane"></i></button>
        </div>
      </div>
    }
  `,
  styles: `
    .cb-head { display: flex; align-items: center; justify-content: space-between; background: linear-gradient(120deg, #0A0A0A, #3B0D1C 55%, #BE3455) !important; }
    .cb-title { display: flex; align-items: center; gap: .6rem; }
    .cb-title strong { display: block; font-size: .9rem; }
    .cb-title small { display: flex; align-items: center; gap: .35rem; font-size: .68rem; opacity: .85; font-weight: 600; }
    .cb-avatar { width: 34px; height: 34px; border-radius: 50%; display: grid; place-items: center; background: rgba(255,255,255,.18); }
    .cb-dot { width: 7px; height: 7px; border-radius: 50%; background: #22C55E; display: inline-block; }
    .chat-msg { animation: cbIn .3s ease; white-space: pre-line; }
    .cb-cta {
      display: flex; align-items: center; justify-content: center; gap: .4rem; margin-top: .55rem; padding: .5rem .7rem; width: 100%;
      border: none; border-radius: 9px; background: var(--brand-red); color: #fff; font-weight: 800; font-size: .76rem; cursor: pointer; text-decoration: none;
    }
    .cb-wa { background: #25D366; }
    .cb-chips { display: flex; gap: .4rem; overflow-x: auto; padding: .55rem .7rem; border-top: 1px solid var(--border-color); background: var(--card-bg); scrollbar-width: thin; }
    .cb-chip {
      flex: 0 0 auto; border: 1px solid rgba(190,52,85,.45); color: var(--brand-red); background: rgba(190,52,85,.06);
      padding: .38rem .7rem; border-radius: 999px; font-size: .72rem; font-weight: 700; cursor: pointer; white-space: nowrap;
      transition: background .2s, color .2s;
    }
    .cb-chip:hover { background: var(--brand-red); color: #fff; }
    .cb-typing { display: flex; gap: 4px; align-items: center; }
    .cb-typing span { width: 6px; height: 6px; border-radius: 50%; background: var(--text-muted); animation: cbDot 1s infinite; }
    .cb-typing span:nth-child(2) { animation-delay: .15s; }
    .cb-typing span:nth-child(3) { animation-delay: .3s; }
    @keyframes cbIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
    @keyframes cbDot { 0%, 100% { opacity: .3; transform: translateY(0); } 50% { opacity: 1; transform: translateY(-3px); } }
  `,
})
export class Chatbot {
  readonly i18n = inject(I18nService);
  private readonly router = inject(Router);
  readonly open = signal(false);
  readonly typing = signal(false);
  readonly messages = signal<Msg[]>([]);
  readonly faqs = FAQS;
  private readonly body = viewChild<ElementRef<HTMLElement>>('body');
  draft = '';

  constructor() {
    effect(() => {
      const hello = this.t(
        '¡Hola! 👋 ¿En qué te ayudo? Elige una opción abajo.',
        'Hi! 👋 How can I help? Pick an option below.',
      );
      untracked(() => {
        this.messages.update((list) => (list.length <= 1 ? [{ role: 'bot', text: hello }] : list));
      });
    });
  }

  t(es: string, en: string): string {
    return this.i18n.lang() === 'en' ? en : es;
  }

  waUrl(): string {
    const text = this.t('Hola MUESTRA.MX, me interesa cotizar una encuesta.', 'Hi MUESTRA.MX, I would like a quote for a poll.');
    return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;
  }

  go(path: string): void {
    this.open.set(false);
    void this.router.navigateByUrl(path);
  }

  ask(f: Faq): void {
    this.reply(this.t(f.q.es, f.q.en), f);
  }

  send(): void {
    const text = this.draft.trim();
    if (!text) return;
    this.draft = '';
    const lower = text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const hit = FAQS.find((f) => f.keys.some((k) => lower.includes(k.normalize('NFD').replace(/[̀-ͯ]/g, ''))));
    this.reply(text, hit);
  }

  private reply(userText: string, faq?: Faq): void {
    this.messages.update((list) => [...list, { role: 'user', text: userText }]);
    this.typing.set(true);
    this.scroll();
    setTimeout(() => {
      this.typing.set(false);
      const msg: Msg = faq
        ? { role: 'bot', text: this.t(faq.a.es, faq.a.en), cta: faq.cta }
        : {
            role: 'bot',
            text: this.t(
              'Gracias por escribirnos. Para atenderte más rápido, escríbenos por WhatsApp y un asesor te responde.',
              'Thanks for writing. For a faster answer, message us on WhatsApp.',
            ),
            cta: 'whatsapp',
          };
      this.messages.update((list) => [...list, msg]);
      this.scroll();
    }, 650);
  }

  private scroll(): void {
    setTimeout(() => {
      const el = this.body()?.nativeElement;
      if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }, 30);
  }
}
