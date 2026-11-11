import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { I18nService } from '../../../core/services/i18n.service';
import type { LocalizedString } from '../../../domain/models';

type TriviaTopic = 'mx' | 'cb' | 'fd' | 'fb';

interface TriviaQuestion {
  cat: TriviaTopic;
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
    cat: 'mx',
    q: L('¿Cuál es la montaña más alta de México?', 'What is the highest mountain in Mexico?'),
    options: [L('Popocatépetl', 'Popocatépetl'), L('Pico de Orizaba', 'Pico de Orizaba'), L('Nevado de Toluca', 'Nevado de Toluca')],
    answer: 1,
    fact: L('El Pico de Orizaba o Citlaltépetl, entre Puebla y Veracruz, es el punto más alto del país.', 'Pico de Orizaba (Citlaltépetl), between Puebla and Veracruz, is the country’s highest point.'),
  },
  {
    cat: 'mx',
    q: L('¿Cuántas entidades federativas tiene México?', 'How many federal entities does Mexico have?'),
    options: [L('30', '30'), L('32', '32'), L('35', '35')],
    answer: 1,
    fact: L('Son 31 estados más la Ciudad de México.', '31 states plus Mexico City.'),
  },
  {
    cat: 'mx',
    q: L('¿En qué estado está Chichén Itzá?', 'In which state is Chichén Itzá?'),
    options: [L('Yucatán', 'Yucatán'), L('Quintana Roo', 'Quintana Roo'), L('Campeche', 'Campeche')],
    answer: 0,
    fact: L('Está en Yucatán y es una de las nuevas siete maravillas del mundo.', 'It is in Yucatán and is one of the New Seven Wonders of the World.'),
  },
  {
    cat: 'mx',
    q: L('¿De dónde es originario el ajolote?', 'Where is the axolotl native to?'),
    options: [L('Lago de Chapala', 'Lake Chapala'), L('Canales de Xochimilco', 'Xochimilco canals'), L('Cenotes de Yucatán', 'Yucatán cenotes')],
    answer: 1,
    fact: L('Vive de forma natural solo en los lagos y canales de Xochimilco, en la CDMX.', 'It lives in the wild only in the lakes and canals of Xochimilco, Mexico City.'),
  },
  {
    cat: 'mx',
    q: L('¿A qué estados llega cada invierno la mariposa monarca?', 'Where do monarch butterflies arrive each winter?'),
    options: [L('Michoacán y Estado de México', 'Michoacán and State of Mexico'), L('Sonora y Chihuahua', 'Sonora and Chihuahua'), L('Oaxaca y Chiapas', 'Oaxaca and Chiapas')],
    answer: 0,
    fact: L('Viajan miles de kilómetros desde Canadá y Estados Unidos hasta los bosques de oyamel.', 'They fly thousands of kilometers from Canada and the US to the fir forests.'),
  },
  {
    cat: 'mx',
    q: L('¿Cuál es la lengua indígena más hablada en México?', 'What is the most spoken Indigenous language in Mexico?'),
    options: [L('Maya', 'Maya'), L('Náhuatl', 'Nahuatl'), L('Zapoteco', 'Zapotec')],
    answer: 1,
    fact: L('El náhuatl es la más hablada; el maya ocupa el segundo lugar.', 'Nahuatl is the most spoken; Maya is second.'),
  },
  {
    cat: 'mx',
    q: L('¿Cuál es la flor nacional de México?', 'What is Mexico’s national flower?'),
    options: [L('La dalia', 'Dahlia'), L('El cempasúchil', 'Marigold'), L('La rosa', 'Rose')],
    answer: 0,
    fact: L('La dalia es flor nacional desde 1963; el cempasúchil es la flor del Día de Muertos.', 'The dahlia has been the national flower since 1963; marigold is the Day of the Dead flower.'),
  },
  {
    cat: 'mx',
    q: L('¿Cuál es el desierto más grande de México?', 'What is the largest desert in Mexico?'),
    options: [L('Desierto de Sonora', 'Sonoran Desert'), L('Desierto Chihuahuense', 'Chihuahuan Desert'), L('Desierto de Altar', 'Altar Desert')],
    answer: 1,
    fact: L('El Chihuahuense es el más grande de Norteamérica y cruza varios estados del norte.', 'The Chihuahuan is the largest in North America and spans several northern states.'),
  },
  {
    cat: 'cb',
    q: L('¿Qué es un cenote?', 'What is a cenote?'),
    options: [L('Un volcán apagado', 'An extinct volcano'), L('Un pozo natural de agua', 'A natural water sinkhole'), L('Una pirámide maya', 'A Mayan pyramid')],
    answer: 1,
    fact: L('Es una cavidad en la roca caliza llena de agua dulce; la península de Yucatán tiene miles.', 'A limestone hollow filled with fresh water; the Yucatán Peninsula has thousands.'),
  },
  {
    cat: 'cb',
    q: L('¿Cuál es la capital de Quintana Roo?', 'What is the capital of Quintana Roo?'),
    options: [L('Cancún', 'Cancún'), L('Chetumal', 'Chetumal'), L('Playa del Carmen', 'Playa del Carmen')],
    answer: 1,
    fact: L('Aunque Cancún es la ciudad más grande, la capital es Chetumal.', 'Cancún is the biggest city, but the capital is Chetumal.'),
  },
  {
    cat: 'cb',
    q: L('¿Cómo le dicen a la Laguna de Bacalar?', 'What is Bacalar Lagoon known as?'),
    options: [L('Laguna de los Siete Colores', 'Lagoon of Seven Colors'), L('Laguna Azul', 'Blue Lagoon'), L('Laguna Encantada', 'Enchanted Lagoon')],
    answer: 0,
    fact: L('Sus tonos de azul cambian según la profundidad y el fondo.', 'Its shades of blue change with depth and the bottom.'),
  },
  {
    cat: 'cb',
    q: L('¿Qué arrecife pasa frente a las costas de Quintana Roo?', 'Which reef runs along Quintana Roo’s coast?'),
    options: [L('Gran Barrera de Coral', 'Great Barrier Reef'), L('Sistema Arrecifal Mesoamericano', 'Mesoamerican Reef'), L('Arrecife de Florida', 'Florida Reef')],
    answer: 1,
    fact: L('Es el sistema de arrecifes más grande del continente americano.', 'It is the largest reef system in the Americas.'),
  },
  {
    cat: 'cb',
    q: L('¿Cuál es la isla más grande del Caribe mexicano?', 'What is the largest island in the Mexican Caribbean?'),
    options: [L('Isla Mujeres', 'Isla Mujeres'), L('Holbox', 'Holbox'), L('Cozumel', 'Cozumel')],
    answer: 2,
    fact: L('Cozumel es la isla habitada más grande del Caribe mexicano.', 'Cozumel is the largest inhabited island in the Mexican Caribbean.'),
  },
  {
    cat: 'cb',
    q: L('¿Por qué animal gigante es famosa Holbox?', 'Which giant animal is Holbox famous for?'),
    options: [L('El tiburón ballena', 'Whale shark'), L('La ballena azul', 'Blue whale'), L('La manta gigante', 'Giant manta')],
    answer: 0,
    fact: L('Cada verano llegan tiburones ballena, el pez más grande del mundo.', 'Every summer whale sharks, the world’s largest fish, arrive.'),
  },
  {
    cat: 'cb',
    q: L('¿Qué ciudad maya está sobre un acantilado frente al mar Caribe?', 'Which Mayan city sits on a cliff over the Caribbean Sea?'),
    options: [L('Cobá', 'Cobá'), L('Tulum', 'Tulum'), L('Palenque', 'Palenque')],
    answer: 1,
    fact: L('La zona arqueológica de Tulum mira directo al mar desde lo alto del acantilado.', 'Tulum’s archaeological site overlooks the sea from the clifftop.'),
  },
  {
    cat: 'cb',
    q: L('¿Qué es Sian Ka’an?', 'What is Sian Ka’an?'),
    options: [L('Un parque de diversiones', 'A theme park'), L('Una reserva de la biosfera', 'A biosphere reserve'), L('Un cenote', 'A cenote')],
    answer: 1,
    fact: L('Es Patrimonio de la Humanidad; en maya su nombre significa “origen del cielo”.', 'A World Heritage Site; in Maya its name means “origin of the sky”.'),
  },
  {
    cat: 'cb',
    q: L('¿En qué década nació Cancún como destino turístico?', 'In which decade was Cancún born as a resort?'),
    options: [L('Años 50', '1950s'), L('Años 70', '1970s'), L('Años 90', '1990s')],
    answer: 1,
    fact: L('Se fundó en 1970 como un proyecto turístico planeado desde cero.', 'It was founded in 1970 as a resort planned from scratch.'),
  },
  {
    cat: 'fd',
    q: L('¿Con qué planta se hace el tequila?', 'What plant is tequila made from?'),
    options: [L('Maguey pulquero', 'Pulque agave'), L('Agave azul', 'Blue agave'), L('Caña de azúcar', 'Sugar cane')],
    answer: 1,
    fact: L('Se elabora con agave azul y su origen es Jalisco.', 'It is made from blue agave and comes from Jalisco.'),
  },
  {
    cat: 'fd',
    q: L('¿Qué condimento le da su color rojo a la cochinita pibil?', 'What gives cochinita pibil its red color?'),
    options: [L('Chile guajillo', 'Guajillo chile'), L('Achiote', 'Annatto (achiote)'), L('Jitomate', 'Tomato')],
    answer: 1,
    fact: L('Se marina con achiote y naranja agria; “pib” es el horno bajo tierra maya.', 'It is marinated in achiote and sour orange; “pib” is the Mayan underground oven.'),
  },
  {
    cat: 'fd',
    q: L('¿De qué ciudad es famoso el mole poblano?', 'Which city is mole poblano famous from?'),
    options: [L('Oaxaca', 'Oaxaca'), L('Puebla', 'Puebla'), L('Mérida', 'Mérida')],
    answer: 1,
    fact: L('Lleva chiles, especias y chocolate, y es emblema de Puebla.', 'It has chiles, spices and chocolate, and is Puebla’s emblem.'),
  },
  {
    cat: 'fd',
    q: L('¿Qué colores representan los chiles en nogada?', 'What colors do chiles en nogada represent?'),
    options: [L('Los de la bandera', 'The flag’s'), L('Los del arcoíris', 'The rainbow’s'), L('Los del otoño', 'Autumn’s')],
    answer: 0,
    fact: L('Verde del chile y perejil, blanco de la nogada y rojo de la granada.', 'Green chile and parsley, white walnut sauce, red pomegranate.'),
  },
  {
    cat: 'fd',
    q: L('¿Qué platillo extranjero inspiró los tacos al pastor?', 'Which foreign dish inspired tacos al pastor?'),
    options: [L('El shawarma', 'Shawarma'), L('La pizza', 'Pizza'), L('El kebab turco de pollo', 'Chicken kebab')],
    answer: 0,
    fact: L('Los inmigrantes libaneses trajeron el trompo; en México se adaptó con cerdo y adobo.', 'Lebanese immigrants brought the spit; in Mexico it became pork with adobo.'),
  },
  {
    cat: 'fd',
    q: L('¿Qué maíz se usa tradicionalmente en el pozole?', 'What corn is traditionally used in pozole?'),
    options: [L('Maíz palomero', 'Popcorn'), L('Maíz cacahuazintle', 'Cacahuazintle corn'), L('Maíz dulce', 'Sweet corn')],
    answer: 1,
    fact: L('Sus granos grandes “revientan” al cocerse, como flor.', 'Its large kernels burst open like flowers when cooked.'),
  },
  {
    cat: 'fd',
    q: L('¿De qué está hecho el chocolate?', 'What is chocolate made from?'),
    options: [L('Cacao', 'Cacao'), L('Café', 'Coffee'), L('Vainilla', 'Vanilla')],
    answer: 0,
    fact: L('El cacao ya se tomaba como bebida en Mesoamérica hace miles de años.', 'Cacao was already drunk in Mesoamerica thousands of years ago.'),
  },
  {
    cat: 'fd',
    q: L('¿Qué son los papadzules?', 'What are papadzules?'),
    options: [L('Tortillas con huevo y salsa de pepita', 'Tortillas with egg and pumpkin seed sauce'), L('Panes dulces', 'Sweet breads'), L('Bebida de maíz', 'A corn drink')],
    answer: 0,
    fact: L('Son un platillo yucateco de origen maya.', 'A Yucatecan dish of Mayan origin.'),
  },
  {
    cat: 'fd',
    q: L('¿Cuál es el ingrediente principal del guacamole?', 'What is the main ingredient in guacamole?'),
    options: [L('Tomate verde', 'Tomatillo'), L('Aguacate', 'Avocado'), L('Chile poblano', 'Poblano chile')],
    answer: 1,
    fact: L('El nombre viene del náhuatl ahuacamolli, “salsa de aguacate”.', 'The name comes from Nahuatl ahuacamolli, “avocado sauce”.'),
  },
  {
    cat: 'fb',
    q: L('¿Cuántos Mundiales se han jugado en México?', 'How many World Cups has Mexico hosted?'),
    options: [L('1', '1'), L('2', '2'), L('3', '3')],
    answer: 2,
    fact: L('1970, 1986 y 2026; es el primer país en recibir tres Mundiales.', '1970, 1986 and 2026; the first country to host three.'),
  },
  {
    cat: 'fb',
    q: L('¿Qué estadio ha recibido dos finales de Mundial?', 'Which stadium has hosted two World Cup finals?'),
    options: [L('Estadio Azteca', 'Estadio Azteca'), L('Estadio Jalisco', 'Estadio Jalisco'), L('Estadio BBVA', 'Estadio BBVA')],
    answer: 0,
    fact: L('El Azteca albergó las finales de 1970 y 1986.', 'The Azteca hosted the 1970 and 1986 finals.'),
  },
  {
    cat: 'fb',
    q: L('¿Qué selección ganó el Mundial de México 1970?', 'Who won the 1970 World Cup in Mexico?'),
    options: [L('Italia', 'Italy'), L('Alemania', 'Germany'), L('Brasil', 'Brazil')],
    answer: 2,
    fact: L('El Brasil de Pelé goleó 4-1 a Italia en la final.', 'Pelé’s Brazil beat Italy 4-1 in the final.'),
  },
  {
    cat: 'fb',
    q: L('¿Qué selección ganó el Mundial de México 1986?', 'Who won the 1986 World Cup in Mexico?'),
    options: [L('Argentina', 'Argentina'), L('Alemania', 'Germany'), L('Francia', 'France')],
    answer: 0,
    fact: L('La Argentina de Maradona venció 3-2 a Alemania en el Azteca.', 'Maradona’s Argentina beat Germany 3-2 at the Azteca.'),
  },
  {
    cat: 'fb',
    q: L('¿En qué Juegos Olímpicos ganó México el oro en futbol?', 'At which Olympics did Mexico win football gold?'),
    options: [L('México 1968', 'Mexico 1968'), L('Londres 2012', 'London 2012'), L('Tokio 2020', 'Tokyo 2020')],
    answer: 1,
    fact: L('Venció 2-1 a Brasil en la final en Wembley.', 'It beat Brazil 2-1 in the final at Wembley.'),
  },
  {
    cat: 'fb',
    q: L('¿En qué club europeo brilló Hugo Sánchez?', 'At which European club did Hugo Sánchez shine?'),
    options: [L('Barcelona', 'Barcelona'), L('Real Madrid', 'Real Madrid'), L('Manchester United', 'Manchester United')],
    answer: 1,
    fact: L('Fue cinco veces Pichichi, el máximo goleador de la liga española.', 'He was the Spanish league’s top scorer five times.'),
  },
  {
    cat: 'fb',
    q: L('¿En qué año ganó México su primer Mundial Sub-17?', 'When did Mexico win its first U-17 World Cup?'),
    options: [L('1999', '1999'), L('2005', '2005'), L('2011', '2011')],
    answer: 1,
    fact: L('Lo ganó en Perú 2005 y repitió en casa en 2011.', 'It won in Peru 2005 and again at home in 2011.'),
  },
  {
    cat: 'fb',
    q: L('¿Cómo se conoce en el mundo la ola de los estadios?', 'How is the stadium wave known worldwide?'),
    options: [L('Ola brasileña', 'Brazilian wave'), L('Ola mexicana', 'Mexican wave'), L('Ola inglesa', 'English wave')],
    answer: 1,
    fact: L('Se hizo famosa en todo el mundo durante el Mundial de México 1986.', 'It became famous worldwide during the 1986 World Cup in Mexico.'),
  },
];

const ROUND_SIZE = 5;

const TOPICS: Array<{ id: TriviaTopic; icon: string; label: LocalizedString }> = [
  { id: 'mx', icon: 'fa-solid fa-flag', label: L('México', 'Mexico') },
  { id: 'cb', icon: 'fa-solid fa-umbrella-beach', label: L('Caribe', 'Caribbean') },
  { id: 'fd', icon: 'fa-solid fa-pepper-hot', label: L('Comida', 'Food') },
  { id: 'fb', icon: 'fa-solid fa-futbol', label: L('Futbol', 'Soccer') },
];

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
          <p>{{ t('Escoge un tema y contesta 5 preguntas rápidas. ¿Las sacas todas?', 'Pick a topic and answer 5 quick questions. Can you get them all?') }}</p>
          <div class="tv-topics">
            @for (topic of topics; track topic.id) {
              <button type="button" class="tv-topic" (click)="start(topic.id)">
                <i [class]="topic.icon" aria-hidden="true"></i>
                <span>{{ i18n.tx(topic.label) }}</span>
              </button>
            }
          </div>
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
            <button type="button" class="tv-btn" (click)="start(topic())"><i class="fa-solid fa-rotate-right" aria-hidden="true"></i> {{ t('Jugar otra vez', 'Play again') }}</button>
            <button type="button" class="tv-btn tv-ghost" (click)="started.set(false)">{{ t('Cambiar de tema', 'Change topic') }}</button>
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
    .tv-intro p { color: var(--text-muted); font-size: .95rem; line-height: 1.45; margin-bottom: 1rem; }
    .tv-topics { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 140px), 1fr)); gap: .7rem; }
    .tv-topic {
      display: flex; flex-direction: column; align-items: center; gap: .45rem; padding: 1.1rem .8rem; border-radius: 10px;
      border: 2px solid var(--border-color); background: var(--card-bg); color: inherit; font-weight: 800; font-size: .95rem;
      cursor: pointer; transition: border-color .15s ease, transform .15s ease, background .15s ease;
    }
    .tv-topic i { font-size: 1.6rem; color: var(--brand-red); }
    .tv-topic:hover { border-color: var(--brand-red); transform: translateY(-2px); background: #FDF2F4; color: #111; }
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
    @media (max-width: 480px) { .tv-actions .tv-btn { width: 100%; } }
  `,
})
export class ElectionTrivia {
  readonly i18n = inject(I18nService);

  readonly topics = TOPICS;
  readonly topic = signal<TriviaTopic>('mx');
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
      `Saqué ${this.score()}/${this.round().length} en la trivia de MUESTRA.MX. ¿Me superas? https://muestra.mx`,
      `I scored ${this.score()}/${this.round().length} on the MUESTRA.MX trivia. Can you beat me? https://muestra.mx`,
    );
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  });

  t(es: string, en: string): string {
    return this.i18n.lang() === 'en' ? en : es;
  }

  start(topic: TriviaTopic): void {
    this.topic.set(topic);
    this.round.set(shuffle(QUESTIONS.filter((q) => q.cat === topic)).slice(0, ROUND_SIZE));
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
