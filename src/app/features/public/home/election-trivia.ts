import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { I18nService } from '../../../core/services/i18n.service';
import type { LocalizedString } from '../../../domain/models';

interface TriviaQuestion {
  q: LocalizedString;
  options: LocalizedString[];
  /** Índice de la respuesta correcta dentro de options. */
  answer: number;
  fact: LocalizedString;
}

const L = (es: string, en: string): LocalizedString => ({ es, en });

/** Banco de preguntas. Para agregar más, copia un bloque y cambia el texto. */
const QUESTIONS: TriviaQuestion[] = [
  {
    q: L('¿Cuál es la montaña más alta de México?', 'What is the highest mountain in Mexico?'),
    options: [L('Popocatépetl', 'Popocatépetl'), L('Pico de Orizaba', 'Pico de Orizaba'), L('Nevado de Toluca', 'Nevado de Toluca')],
    answer: 1,
    fact: L('El Pico de Orizaba o Citlaltépetl, entre Puebla y Veracruz, es el punto más alto del país.', 'Pico de Orizaba (Citlaltépetl), between Puebla and Veracruz, is the country’s highest point.'),
  },
  {
    q: L('¿Cuántas entidades federativas tiene México?', 'How many federal entities does Mexico have?'),
    options: [L('30', '30'), L('32', '32'), L('35', '35')],
    answer: 1,
    fact: L('Son 31 estados más la Ciudad de México.', '31 states plus Mexico City.'),
  },
  {
    q: L('¿Qué es un cenote?', 'What is a cenote?'),
    options: [L('Un volcán apagado', 'An extinct volcano'), L('Un pozo natural de agua', 'A natural water sinkhole'), L('Una pirámide maya', 'A Mayan pyramid')],
    answer: 1,
    fact: L('Es una cavidad en la roca caliza llena de agua dulce; la península de Yucatán tiene miles.', 'A limestone hollow filled with fresh water; the Yucatán Peninsula has thousands.'),
  },
  {
    q: L('¿Cuál es la capital de Quintana Roo?', 'What is the capital of Quintana Roo?'),
    options: [L('Cancún', 'Cancún'), L('Chetumal', 'Chetumal'), L('Playa del Carmen', 'Playa del Carmen')],
    answer: 1,
    fact: L('Aunque Cancún es la ciudad más grande, la capital es Chetumal.', 'Cancún is the biggest city, but the capital is Chetumal.'),
  },
  {
    q: L('¿Cómo le dicen a la Laguna de Bacalar?', 'What is Bacalar Lagoon known as?'),
    options: [L('Laguna de los Siete Colores', 'Lagoon of Seven Colors'), L('Laguna Azul', 'Blue Lagoon'), L('Laguna Encantada', 'Enchanted Lagoon')],
    answer: 0,
    fact: L('Sus tonos de azul cambian según la profundidad y el fondo.', 'Its shades of blue change with depth and the bottom.'),
  },
  {
    q: L('¿Qué arrecife pasa frente a las costas de Quintana Roo?', 'Which reef runs along Quintana Roo’s coast?'),
    options: [L('Gran Barrera de Coral', 'Great Barrier Reef'), L('Sistema Arrecifal Mesoamericano', 'Mesoamerican Reef'), L('Arrecife de Florida', 'Florida Reef')],
    answer: 1,
    fact: L('Es el sistema de arrecifes más grande del continente americano.', 'It is the largest reef system in the Americas.'),
  },
  {
    q: L('¿En qué estado está Chichén Itzá?', 'In which state is Chichén Itzá?'),
    options: [L('Yucatán', 'Yucatán'), L('Quintana Roo', 'Quintana Roo'), L('Campeche', 'Campeche')],
    answer: 0,
    fact: L('Está en Yucatán y es una de las nuevas siete maravillas del mundo.', 'It is in Yucatán and is one of the New Seven Wonders of the World.'),
  },
  {
    q: L('¿De dónde es originario el ajolote?', 'Where is the axolotl native to?'),
    options: [L('Lago de Chapala', 'Lake Chapala'), L('Canales de Xochimilco', 'Xochimilco canals'), L('Cenotes de Yucatán', 'Yucatán cenotes')],
    answer: 1,
    fact: L('Vive de forma natural solo en los lagos y canales de Xochimilco, en la CDMX.', 'It lives in the wild only in the lakes and canals of Xochimilco, Mexico City.'),
  },
  {
    q: L('¿A qué estados llega cada invierno la mariposa monarca?', 'Where do monarch butterflies arrive each winter?'),
    options: [L('Michoacán y Estado de México', 'Michoacán and State of Mexico'), L('Sonora y Chihuahua', 'Sonora and Chihuahua'), L('Oaxaca y Chiapas', 'Oaxaca and Chiapas')],
    answer: 0,
    fact: L('Viajan miles de kilómetros desde Canadá y Estados Unidos hasta los bosques de oyamel.', 'They fly thousands of kilometers from Canada and the US to the fir forests.'),
  },
  {
    q: L('¿Con qué planta se hace el tequila?', 'What plant is tequila made from?'),
    options: [L('Maguey pulquero', 'Pulque agave'), L('Agave azul', 'Blue agave'), L('Caña de azúcar', 'Sugar cane')],
    answer: 1,
    fact: L('Se elabora con agave azul y su origen es Jalisco.', 'It is made from blue agave and comes from Jalisco.'),
  },
  {
    q: L('¿Cuál es la lengua indígena más hablada en México?', 'What is the most spoken Indigenous language in Mexico?'),
    options: [L('Maya', 'Maya'), L('Náhuatl', 'Nahuatl'), L('Zapoteco', 'Zapotec')],
    answer: 1,
    fact: L('El náhuatl es la más hablada; el maya ocupa el segundo lugar.', 'Nahuatl is the most spoken; Maya is second.'),
  },
  {
    q: L('¿Cuál es la flor nacional de México?', 'What is Mexico’s national flower?'),
    options: [L('La dalia', 'Dahlia'), L('El cempasúchil', 'Marigold'), L('La rosa', 'Rose')],
    answer: 0,
    fact: L('La dalia es flor nacional desde 1963; el cempasúchil es la flor del Día de Muertos.', 'The dahlia has been the national flower since 1963; marigold is the Day of the Dead flower.'),
  },
];

const ROUND_SIZE = 5;

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

@Component({
  selector: 'app-election-trivia',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="trivia" [attr.lang]="i18n.lang()" aria-labelledby="trivia-title">
      <div class="tv-head">
        <span class="tv-eyebrow"><i class="fa-solid fa-gamepad" aria-hidden="true"></i> {{ t('Juega y aprende', 'Play and learn') }}</span>
        <h3 id="trivia-title">{{ t('¿Cuánto sabes de México?', 'How much do you know about Mexico?') }}</h3>
      </div>

      @if (!started()) {
        <div class="tv-intro">
          <p>{{ t('5 preguntas rápidas sobre México y el Caribe mexicano. ¿Las contestas todas?', '5 quick questions about Mexico and the Mexican Caribbean. Can you get them all?') }}</p>
          <button type="button" class="tv-btn" (click)="start()">{{ t('Empezar', 'Start') }} <i class="fa-solid fa-play" aria-hidden="true"></i></button>
        </div>
      } @else if (!finished()) {
        @let q = current();
        <div class="tv-progress">
          <span>{{ t('Pregunta', 'Question') }} {{ index() + 1 }} / {{ round().length }}</span>
          <span class="tv-score">{{ score() }} <i class="fa-solid fa-star" aria-hidden="true"></i></span>
        </div>
        <div class="tv-bar"><div class="tv-bar-fill" [style.width.%]="((index() + (picked() !== null ? 1 : 0)) / round().length) * 100"></div></div>
        <p class="tv-q">{{ i18n.tx(q.q) }}</p>
        <div class="tv-options">
          @for (opt of q.options; track $index; let i = $index) {
            <button
              type="button"
              class="tv-opt"
              [disabled]="picked() !== null"
              [class.right]="picked() !== null && i === q.answer"
              [class.wrong]="picked() === i && i !== q.answer"
              (click)="pick(i)"
            >
              {{ i18n.tx(opt) }}
            </button>
          }
        </div>
        @if (picked() !== null) {
          <div class="tv-feedback" [class.ok]="picked() === q.answer">
            <strong>{{ picked() === q.answer ? t('¡Correcto!', 'Correct!') : t('Casi…', 'Not quite…') }}</strong>
            {{ i18n.tx(q.fact) }}
          </div>
          <button type="button" class="tv-btn" (click)="next()">
            {{ isLast() ? t('Ver resultado', 'See result') : t('Siguiente', 'Next') }}
            <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
          </button>
        }
      } @else {
        <div class="tv-result">
          <div class="tv-big">{{ score() }}<small>/{{ round().length }}</small></div>
          <p class="tv-verdict">{{ verdict() }}</p>
          <div class="tv-actions">
            <button type="button" class="tv-btn" (click)="start()"><i class="fa-solid fa-rotate-right" aria-hidden="true"></i> {{ t('Jugar otra vez', 'Play again') }}</button>
            <a class="tv-btn tv-wa" [href]="shareUrl()" target="_blank" rel="noopener"><i class="fa-brands fa-whatsapp" aria-hidden="true"></i> {{ t('Reta a un amigo', 'Challenge a friend') }}</a>
          </div>
        </div>
      }
    </section>
  `,
  styles: `
    .trivia {
      margin: 2.2rem 0 0; padding: 1.5rem; border-radius: 12px; background: var(--card-bg);
      border: 1px solid var(--border-color); border-top: 6px solid var(--brand-red);
    }
    .tv-eyebrow { font-size: .75rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: var(--brand-red); }
    .tv-head h3 { font-family: var(--font-logo); font-size: clamp(1.25rem, 2.8vw, 1.7rem); font-weight: 900; margin: .3rem 0 1rem; }
    .tv-intro { display: flex; align-items: center; justify-content: space-between; gap: 1rem 2rem; flex-wrap: wrap; }
    .tv-intro p { color: var(--text-muted); font-size: .95rem; flex: 1 1 280px; line-height: 1.45; }
    .tv-btn {
      display: inline-flex; align-items: center; justify-content: center; gap: .5rem; border: none; border-radius: 8px;
      background: var(--brand-red); color: #fff; font-weight: 800; font-size: .9rem; padding: .75rem 1.3rem; cursor: pointer;
      text-transform: uppercase; text-decoration: none; transition: transform .15s ease, filter .15s ease;
    }
    .tv-btn:hover { transform: translateY(-1px); filter: brightness(1.08); }
    .tv-wa { background: #25D366; }
    .tv-ghost { background: transparent; color: var(--brand-red); border: 2px solid var(--brand-red); }
    .tv-progress { display: flex; justify-content: space-between; font-size: .8rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; }
    .tv-score { color: var(--brand-red); }
    .tv-bar { height: 6px; background: #E5E7EB; border-radius: 999px; overflow: hidden; margin: .45rem 0 1.1rem; }
    .tv-bar-fill { height: 100%; background: var(--brand-red); transition: width .3s ease; }
    .tv-q { font-size: clamp(1.05rem, 2.2vw, 1.25rem); font-weight: 800; line-height: 1.35; margin-bottom: 1rem; }
    .tv-options { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr)); gap: .7rem; margin-bottom: 1rem; }
    .tv-opt {
      border: 2px solid var(--brand-gray); background: var(--card-bg); color: inherit; border-radius: 8px;
      padding: .85rem .9rem; font-weight: 700; font-size: .95rem; cursor: pointer; text-align: center;
      transition: border-color .15s ease, background .15s ease;
    }
    .tv-opt:hover:not(:disabled) { border-color: var(--brand-red); }
    .tv-opt:disabled { cursor: default; opacity: .75; }
    .tv-opt.right { border-color: #16A34A; background: #DCFCE7; color: #14532D; opacity: 1; }
    .tv-opt.wrong { border-color: var(--brand-red); background: #FDE2E8; color: #7F1D1D; opacity: 1; }
    .tv-feedback { padding: .8rem 1rem; border-radius: 8px; background: #FEF3C7; color: #78350F; font-size: .9rem; line-height: 1.4; margin-bottom: 1rem; }
    .tv-feedback.ok { background: #DCFCE7; color: #14532D; }
    .tv-result { text-align: center; }
    .tv-big { font-family: var(--font-logo); font-size: clamp(3rem, 9vw, 4.5rem); font-weight: 900; color: var(--brand-red); line-height: 1; }
    .tv-big small { font-size: .45em; color: var(--text-muted); }
    .tv-verdict { font-size: 1.05rem; font-weight: 800; margin: .6rem 0 1.2rem; }
    .tv-actions { display: flex; gap: .7rem; justify-content: center; flex-wrap: wrap; }
    @media (max-width: 480px) { .tv-actions .tv-btn, .tv-intro .tv-btn { width: 100%; } }
  `,
})
export class ElectionTrivia {
  readonly i18n = inject(I18nService);

  readonly started = signal(false);
  readonly round = signal<TriviaQuestion[]>([]);
  readonly index = signal(0);
  readonly picked = signal<number | null>(null);
  readonly score = signal(0);
  readonly finished = signal(false);

  readonly current = computed(() => this.round()[this.index()]);
  readonly isLast = computed(() => this.index() + 1 >= this.round().length);

  readonly verdict = computed(() => {
    const s = this.score();
    const total = this.round().length;
    if (s === total) return this.t('¡Perfecto! Te sabes México de memoria.', 'Perfect! You know Mexico by heart.');
    if (s >= total - 1) return this.t('¡Muy bien! Casi perfecto.', 'Great! Almost perfect.');
    if (s >= Math.ceil(total / 2)) return this.t('Nada mal. ¿Lo intentas otra vez?', 'Not bad. Try again?');
    return this.t('A repasar… ¡juega otra vez y mejora tu marca!', 'Time to study… play again and beat your score!');
  });

  readonly shareUrl = computed(() => {
    const text = this.t(
      `Saqué ${this.score()}/${this.round().length} en la trivia de México de MUESTRA.MX. ¿Me superas? https://muestra.mx`,
      `I scored ${this.score()}/${this.round().length} on the MUESTRA.MX Mexico trivia. Can you beat me? https://muestra.mx`,
    );
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  });

  t(es: string, en: string): string {
    return this.i18n.lang() === 'en' ? en : es;
  }

  start(): void {
    this.round.set(shuffle(QUESTIONS).slice(0, ROUND_SIZE));
    this.index.set(0);
    this.picked.set(null);
    this.score.set(0);
    this.finished.set(false);
    this.started.set(true);
  }

  pick(i: number): void {
    if (this.picked() !== null) return;
    this.picked.set(i);
    if (i === this.current().answer) this.score.update((s) => s + 1);
  }

  next(): void {
    if (this.index() + 1 >= this.round().length) {
      this.finished.set(true);
      return;
    }
    this.index.update((i) => i + 1);
    this.picked.set(null);
  }
}
