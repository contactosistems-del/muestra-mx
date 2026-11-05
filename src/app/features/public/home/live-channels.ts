import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18nService } from '../../../core/services/i18n.service';
import type { LocalizedString } from '../../../domain/models';

interface LiveChannel {
  name: LocalizedString;
  description: LocalizedString;
  schedule: LocalizedString;
  /** Enlace directo a la transmisión en vivo. */
  url: string;
  icon: string;
}

/**
 * Canales en vivo de la portada. Para agregar otro, copia un bloque y cambia sus datos.
 */
const CHANNELS: LiveChannel[] = [
  {
    name: { es: 'La Mañanera del Pueblo', en: 'Presidential Morning Briefing' },
    description: {
      es: 'Conferencia diaria de la Presidencia de la República, en el canal oficial del Gobierno de México.',
      en: 'Daily press conference of the Presidency, on the official Government of Mexico channel.',
    },
    schedule: { es: 'Lunes a viernes por la mañana', en: 'Monday to Friday mornings' },
    url: 'https://www.youtube.com/@GobiernoDeMexico/live',
    icon: 'fa-solid fa-landmark',
  },
];

@Component({
  selector: 'app-live-channels',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="live" [attr.lang]="i18n.lang()" aria-labelledby="live-title">
      <div class="live-head">
        <h3 id="live-title"><span class="onair"><span class="dot" aria-hidden="true"></span>{{ i18n.t('liveBadge') }}</span>{{ i18n.t('liveTitle') }}</h3>
      </div>
      <div class="live-grid">
        @for (ch of channels; track ch.url) {
          <a class="ch" [href]="ch.url" target="_blank" rel="noopener">
            <span class="screen" aria-hidden="true">
              <i [class]="ch.icon"></i>
              <span class="play"><i class="fa-solid fa-play"></i></span>
              <span class="tag"><span class="dot"></span>{{ i18n.t('liveBadge') }}</span>
            </span>
            <span class="info">
              <span class="sched"><i class="fa-regular fa-clock" aria-hidden="true"></i> {{ ch.schedule[i18n.lang()] }}</span>
              <b class="name">{{ ch.name[i18n.lang()] }}</b>
              <span class="desc">{{ ch.description[i18n.lang()] }}</span>
              <span class="cta"><i class="fa-brands fa-youtube" aria-hidden="true"></i> {{ i18n.t('watchLive') }}</span>
            </span>
          </a>
        }
      </div>
    </section>
  `,
  styles: `
    .live { margin: 2.2rem 0 0; }
    .live-head { border-bottom: 3px solid var(--text-color); padding-bottom: .55rem; margin-bottom: 1.2rem; }
    .live-head h3 { font-size: clamp(1.15rem, 2.5vw, 1.55rem); font-weight: 900; text-transform: uppercase; display: flex; align-items: center; gap: .7rem; flex-wrap: wrap; }
    .onair { display: inline-flex; align-items: center; gap: .45rem; background: #FF0000; color: #fff; font-size: .75rem; letter-spacing: .12em; padding: .3rem .6rem; border-radius: 4px; }
    .dot { width: 9px; height: 9px; border-radius: 50%; background: #fff; animation: blink 1.2s infinite; flex: none; }
    @keyframes blink { 50% { opacity: .25; } }
    .live-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 420px), 1fr)); gap: 1.2rem; }
    .ch {
      display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 6fr); text-decoration: none; color: inherit;
      background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 12px; overflow: hidden;
      transition: transform .2s, box-shadow .2s, border-color .2s;
    }
    .ch:hover { transform: translateY(-3px); border-color: #FF0000; box-shadow: 0 12px 28px rgba(0, 0, 0, .18); }
    .ch:focus-visible { outline: 3px solid #FF0000; outline-offset: 3px; }
    @media (max-width: 560px) { .ch { grid-template-columns: minmax(0, 1fr); } }
    .screen {
      position: relative; min-height: 190px; display: flex; align-items: center; justify-content: center;
      background: radial-gradient(circle at 30% 20%, #3a0a0a, #0A0A0A 70%); color: rgba(255, 255, 255, .14); font-size: 6rem;
    }
    .play {
      position: absolute; width: 74px; height: 52px; border-radius: 14px; background: #FF0000; color: #fff; font-size: 1.5rem;
      display: flex; align-items: center; justify-content: center; box-shadow: 0 0 0 0 rgba(255, 0, 0, .55); animation: ring 2s infinite;
    }
    @keyframes ring { 70% { box-shadow: 0 0 0 18px rgba(255, 0, 0, 0); } 100% { box-shadow: 0 0 0 0 rgba(255, 0, 0, 0); } }
    .ch:hover .play { transform: scale(1.08); }
    .tag { position: absolute; top: 12px; left: 12px; display: inline-flex; align-items: center; gap: .4rem; background: #FF0000; color: #fff; font-size: .7rem; font-weight: 900; letter-spacing: .12em; padding: .25rem .55rem; border-radius: 4px; }
    .info { display: flex; flex-direction: column; gap: .45rem; padding: 1.2rem 1.3rem; min-width: 0; }
    .sched { font-size: .75rem; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; color: var(--text-muted); }
    .name { font-size: 1.35rem; font-weight: 900; line-height: 1.15; }
    .desc { font-size: .9rem; color: var(--text-muted); }
    .cta { margin-top: auto; padding-top: .5rem; font-weight: 900; color: #FF0000; text-transform: uppercase; font-size: .85rem; display: inline-flex; align-items: center; gap: .45rem; }
    @media (prefers-reduced-motion: reduce) { .dot, .play { animation: none; } }
  `,
})
export class LiveChannels {
  readonly i18n = inject(I18nService);
  readonly channels = CHANNELS;
}
