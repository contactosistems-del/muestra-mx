import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
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
    q: L('¿A partir de qué edad puedes votar en México?', 'At what age can you vote in Mexico?'),
    options: [L('16 años', '16'), L('18 años', '18'), L('21 años', '21')],
    answer: 1,
    fact: L('Desde los 18 años, con tu credencial para votar vigente.', 'From age 18, with a valid voter ID.'),
  },
  {
    q: L('¿Qué institución organiza las elecciones federales?', 'Which institution runs federal elections?'),
    options: [L('El INE', 'INE'), L('La Suprema Corte', 'The Supreme Court'), L('El Congreso', 'Congress')],
    answer: 0,
    fact: L('El Instituto Nacional Electoral organiza las elecciones federales.', 'The National Electoral Institute (INE) runs federal elections.'),
  },
  {
    q: L('¿En qué año el INE sustituyó al IFE?', 'In what year did INE replace IFE?'),
    options: [L('2000', '2000'), L('2008', '2008'), L('2014', '2014')],
    answer: 2,
    fact: L('La reforma político-electoral de 2014 creó el INE.', 'The 2014 electoral reform created INE.'),
  },
  {
    q: L('¿De qué municipio es cabecera Playa del Carmen?', 'Playa del Carmen is the seat of which municipality?'),
    options: [L('Benito Juárez', 'Benito Juárez'), L('Solidaridad', 'Solidaridad'), L('Cozumel', 'Cozumel')],
    answer: 1,
    fact: L('Playa del Carmen es la cabecera del municipio de Solidaridad.', 'Playa del Carmen is the seat of Solidaridad municipality.'),
  },
  {
    q: L('¿Cuántos municipios tiene Quintana Roo?', 'How many municipalities does Quintana Roo have?'),
    options: [L('9', '9'), L('11', '11'), L('15', '15')],
    answer: 1,
    fact: L('Son 11; los más recientes son Bacalar y Puerto Morelos.', 'There are 11; the newest are Bacalar and Puerto Morelos.'),
  },
  {
    q: L('¿En qué año Quintana Roo se convirtió en estado?', 'In what year did Quintana Roo become a state?'),
    options: [L('1910', '1910'), L('1950', '1950'), L('1974', '1974')],
    answer: 2,
    fact: L('Dejó de ser territorio federal en 1974.', 'It stopped being a federal territory in 1974.'),
  },
  {
    q: L('¿Cuántos años dura el cargo de un diputado federal?', 'How long is a federal deputy’s term?'),
    options: [L('3 años', '3 years'), L('4 años', '4 years'), L('6 años', '6 years')],
    answer: 0,
    fact: L('La Cámara de Diputados se renueva cada 3 años.', 'The Chamber of Deputies is renewed every 3 years.'),
  },
  {
    q: L('¿Cuántos años dura una presidencia municipal en Quintana Roo?', 'How long is a mayor’s term in Quintana Roo?'),
    options: [L('2 años', '2 years'), L('3 años', '3 years'), L('6 años', '6 years')],
    answer: 1,
    fact: L('Los ayuntamientos duran 3 años en el cargo.', 'Municipal councils serve 3-year terms.'),
  },
  {
    q: L('¿Cuál es la capital de Tabasco?', 'What is the capital of Tabasco?'),
    options: [L('Villahermosa', 'Villahermosa'), L('Cárdenas', 'Cárdenas'), L('Comalcalco', 'Comalcalco')],
    answer: 0,
    fact: L('Villahermosa es la capital del estado de Tabasco.', 'Villahermosa is the capital of Tabasco.'),
  },
  {
    q: L('¿En qué año Tulum se convirtió en municipio?', 'In what year did Tulum become a municipality?'),
    options: [L('1995', '1995'), L('2008', '2008'), L('2018', '2018')],
    answer: 1,
    fact: L('Tulum se separó de Solidaridad y es municipio desde 2008.', 'Tulum split from Solidaridad and became a municipality in 2008.'),
  },
  {
    q: L('¿Cuánto dura un sexenio presidencial?', 'How long is a presidential term?'),
    options: [L('4 años', '4 years'), L('5 años', '5 years'), L('6 años', '6 years')],
    answer: 2,
    fact: L('La presidencia de la República dura 6 años, sin reelección.', 'The presidency lasts 6 years, with no re-election.'),
  },
  {
    q: L('¿Qué documento necesitas para votar?', 'What document do you need to vote?'),
    options: [L('Pasaporte', 'Passport'), L('Credencial para votar', 'Voter ID card'), L('Acta de nacimiento', 'Birth certificate')],
    answer: 1,
    fact: L('Solo se vota con la credencial para votar con fotografía vigente.', 'You can only vote with a valid photo voter ID.'),
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
  imports: [RouterLink],
  template: `
    <section class="trivia" [attr.lang]="i18n.lang()" aria-labelledby="trivia-title">
      <div class="tv-head">
        <span class="tv-eyebrow"><i class="fa-solid fa-gamepad" aria-hidden="true"></i> {{ t('Juega y aprende', 'Play and learn') }}</span>
        <h3 id="trivia-title">{{ t('¿Cuánto sabes de elecciones?', 'How much do you know about elections?') }}</h3>
      </div>

      @if (!started()) {
        <div class="tv-intro">
          <p>{{ t('5 preguntas rápidas sobre México, Quintana Roo y la elección 2027. ¿Las contestas todas?', '5 quick questions about Mexico, Quintana Roo and the 2027 election. Can you get them all?') }}</p>
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
            <a class="tv-btn tv-ghost" routerLink="/graficas">{{ t('Ver encuestas', 'See polls') }}</a>
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
    if (s === total) return this.t('¡Perfecto! Eres experto electoral.', 'Perfect! You are an election expert.');
    if (s >= total - 1) return this.t('¡Muy bien! Casi perfecto.', 'Great! Almost perfect.');
    if (s >= Math.ceil(total / 2)) return this.t('Nada mal. ¿Lo intentas otra vez?', 'Not bad. Try again?');
    return this.t('A repasar… ¡juega otra vez y mejora tu marca!', 'Time to study… play again and beat your score!');
  });

  readonly shareUrl = computed(() => {
    const text = this.t(
      `Saqué ${this.score()}/${this.round().length} en la trivia electoral de MUESTRA.MX. ¿Me superas? https://muestra.mx`,
      `I scored ${this.score()}/${this.round().length} on the MUESTRA.MX election trivia. Can you beat me? https://muestra.mx`,
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
