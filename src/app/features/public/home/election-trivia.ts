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

interface TopicTheme {
  id: TriviaTopic;
  icon: string;
  label: LocalizedString;
  tagline: LocalizedString;
  /** Íconos que flotan en el fondo. */
  deco: string[];
}

const TOPICS: TopicTheme[] = [
  {
    id: 'mx', icon: 'fa-solid fa-landmark', label: L('México', 'Mexico'), tagline: L('Historia, naturaleza y cultura', 'History, nature and culture'),
    deco: ['fa-mountain-sun', 'fa-landmark', 'fa-feather', 'fa-sun', 'fa-dove', 'fa-monument', 'fa-leaf'],
  },
  {
    id: 'cb', icon: 'fa-solid fa-umbrella-beach', label: L('Caribe', 'Caribbean'), tagline: L('Playas, cenotes y arrecifes', 'Beaches, cenotes and reefs'),
    deco: ['fa-fish', 'fa-water', 'fa-sun', 'fa-umbrella-beach', 'fa-shrimp', 'fa-anchor', 'fa-fish-fins'],
  },
  {
    id: 'fd', icon: 'fa-solid fa-pepper-hot', label: L('Comida', 'Food'), tagline: L('Sabores que enamoran', 'Flavors to fall for'),
    deco: ['fa-pepper-hot', 'fa-lemon', 'fa-mug-hot', 'fa-bowl-food', 'fa-carrot', 'fa-seedling', 'fa-utensils'],
  },
  {
    id: 'fb', icon: 'fa-solid fa-futbol', label: L('Futbol', 'Soccer'), tagline: L('Mundiales, ídolos y goles', 'World Cups, idols and goals'),
    deco: ['fa-futbol', 'fa-trophy', 'fa-medal', 'fa-flag-checkered', 'fa-shirt', 'fa-stopwatch', 'fa-star'],
  },
];

/** Íconos de la portada (mezcla de todos los temas). */
const INTRO_DECO = ['fa-futbol', 'fa-umbrella-beach', 'fa-pepper-hot', 'fa-landmark', 'fa-fish', 'fa-trophy', 'fa-sun', 'fa-lemon'];

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const CONFETTI_COLORS = ['#BE3455', '#FFD166', '#06D6A0', '#118AB2', '#FFFFFF', '#F78C6B'];

@Component({
  selector: 'app-election-trivia',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section [class]="'trivia theme-' + (started() ? topic() : 'intro')" [attr.lang]="i18n.lang()" aria-labelledby="trivia-title">
      <!-- Fondo animado -->
      <div class="tv-bg" aria-hidden="true">
        <div class="tv-glow g1"></div>
        <div class="tv-glow g2"></div>
        @for (d of deco(); track d.key) {
          <i class="tv-float fa-solid {{ d.icon }}" [style.left.%]="d.x" [style.top.%]="d.y" [style.font-size.rem]="d.size" [style.animation-delay.s]="d.delay" [style.animation-duration.s]="d.dur"></i>
        }
        @if (started() && topic() === 'cb') {
          <svg class="tv-waves" viewBox="0 0 1440 120" preserveAspectRatio="none">
            <path class="w1" d="M0,60 C240,110 480,10 720,60 C960,110 1200,10 1440,60 L1440,120 L0,120 Z" />
            <path class="w2" d="M0,80 C240,40 480,120 720,80 C960,40 1200,120 1440,80 L1440,120 L0,120 Z" />
          </svg>
        }
        @if (started() && topic() === 'fb') {
          <div class="tv-pitch"><span class="circle"></span><span class="line"></span></div>
        }
      </div>

      <div class="tv-inner">
        <div class="tv-head">
          <span class="tv-eyebrow"><i class="fa-solid fa-gamepad" aria-hidden="true"></i> {{ t('Juega y aprende', 'Play and learn') }}</span>
          <h3 id="trivia-title">
            @if (started()) {
              <i [class]="currentTheme().icon" aria-hidden="true"></i> {{ t('Trivia', 'Trivia') }}: {{ i18n.tx(currentTheme().label) }}
            } @else {
              {{ t('¿Cuánto sabes de México?', 'How much do you know about Mexico?') }}
            }
          </h3>
        </div>

        @if (!started()) {
          <div class="tv-intro">
            <p>{{ t('Escoge un tema y contesta 5 preguntas rápidas. ¿Las sacas todas?', 'Pick a topic and answer 5 quick questions. Can you get them all?') }}</p>
            <div class="tv-topics">
              @for (tp of topics; track tp.id; let i = $index) {
                <button type="button" class="tv-topic tp-{{ tp.id }}" [style.animation-delay.ms]="i * 90" (click)="start(tp.id)">
                  <span class="tp-icon"><i [class]="tp.icon" aria-hidden="true"></i></span>
                  <span class="tp-name">{{ i18n.tx(tp.label) }}</span>
                  <span class="tp-tag">{{ i18n.tx(tp.tagline) }}</span>
                  <span class="tp-go">{{ t('Jugar', 'Play') }} <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></span>
                </button>
              }
            </div>
          </div>
        } @else if (!finished()) {
          <div class="tv-progress">
            <span>{{ t('Pregunta', 'Question') }} {{ index() + 1 }} / {{ round().length }}</span>
            <span class="tv-score" [class.bump]="scoreBump()"><i class="fa-solid fa-star" aria-hidden="true"></i> {{ score() }}</span>
          </div>
          <div class="tv-bar"><div class="tv-bar-fill" [style.width.%]="progress()"></div></div>

          @for (q of [current()]; track index()) {
            <div class="tv-card">
              <p class="tv-q">{{ i18n.tx(q.q) }}</p>
              <div class="tv-options">
                @for (opt of q.options; track $index; let i = $index) {
                  <button
                    type="button"
                    class="tv-opt"
                    [style.animation-delay.ms]="120 + i * 90"
                    [disabled]="picked() !== null"
                    [class.right]="picked() !== null && i === q.answer"
                    [class.wrong]="picked() === i && i !== q.answer"
                    (click)="pick(i)"
                  >
                    <span class="tv-letter">{{ letters[i] }}</span>
                    <span class="tv-opt-text">{{ i18n.tx(opt) }}</span>
                    @if (picked() !== null && i === q.answer) {
                      <i class="fa-solid fa-circle-check tv-mark" aria-hidden="true"></i>
                    } @else if (picked() === i) {
                      <i class="fa-solid fa-circle-xmark tv-mark" aria-hidden="true"></i>
                    }
                  </button>
                }
              </div>
              @if (picked() !== null) {
                <div class="tv-feedback" [class.ok]="picked() === q.answer">
                  <span class="tv-fb-icon">{{ picked() === q.answer ? '🎉' : '💡' }}</span>
                  <div>
                    <strong>{{ picked() === q.answer ? t('¡Correcto!', 'Correct!') : t('¡Casi!', 'Almost!') }}</strong>
                    {{ i18n.tx(q.fact) }}
                  </div>
                </div>
                <button type="button" class="tv-btn tv-next" (click)="next()">
                  {{ isLast() ? t('Ver resultado', 'See result') : t('Siguiente', 'Next') }}
                  <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
                </button>
              }
            </div>
          }
        } @else {
          <div class="tv-result">
            <div class="tv-confetti" aria-hidden="true">
              @for (c of confetti(); track c.key) {
                <span [style.left.%]="c.x" [style.background]="c.color" [style.animation-delay.s]="c.delay" [style.animation-duration.s]="c.dur" [style.width.px]="c.w" [style.height.px]="c.h"></span>
              }
            </div>
            <div class="tv-ring" [style.--pct]="(score() / round().length) * 100">
              <div class="tv-big">{{ score() }}<small>/{{ round().length }}</small></div>
            </div>
            <p class="tv-verdict">{{ verdict() }}</p>
            <div class="tv-actions">
              <button type="button" class="tv-btn" (click)="start(topic())"><i class="fa-solid fa-rotate-right" aria-hidden="true"></i> {{ t('Jugar otra vez', 'Play again') }}</button>
              <button type="button" class="tv-btn tv-ghost" (click)="started.set(false)"><i class="fa-solid fa-table-cells-large" aria-hidden="true"></i> {{ t('Cambiar de tema', 'Change topic') }}</button>
              <a class="tv-btn tv-wa" [href]="shareUrl()" target="_blank" rel="noopener"><i class="fa-brands fa-whatsapp" aria-hidden="true"></i> {{ t('Reta a un amigo', 'Challenge a friend') }}</a>
            </div>
          </div>
        }
      </div>
    </section>
  `,
  styles: `
    :host { display: block; }
    .trivia {
      --c1: #0A0A0A; --c2: #3B0D1C; --c3: #BE3455;
      position: relative; overflow: hidden; isolation: isolate;
      margin: 2.2rem 0 0; border-radius: 16px; color: #fff;
      background: linear-gradient(135deg, var(--c1), var(--c2) 55%, var(--c3));
      background-size: 220% 220%;
      animation: tvGradient 14s ease infinite;
      box-shadow: 0 18px 40px -18px rgba(0, 0, 0, .55);
      min-height: 380px;
    }
    .theme-mx { --c1: #04332A; --c2: #0B6E4F; --c3: #BE3455; }
    .theme-cb { --c1: #023E8A; --c2: #0096C7; --c3: #48CAE4; }
    .theme-fd { --c1: #6A040F; --c2: #D62828; --c3: #F77F00; }
    .theme-fb { --c1: #0B3D1E; --c2: #1B7F3B; --c3: #2DA44E; }

    /* ---------- Fondo ---------- */
    .tv-bg { position: absolute; inset: 0; z-index: -1; pointer-events: none; }
    .tv-glow { position: absolute; width: 360px; height: 360px; border-radius: 50%; filter: blur(70px); opacity: .45; }
    .g1 { background: rgba(255, 255, 255, .35); top: -140px; right: -80px; animation: tvDrift 12s ease-in-out infinite; }
    .g2 { background: rgba(255, 209, 102, .35); bottom: -160px; left: -100px; animation: tvDrift 15s ease-in-out infinite reverse; }
    .tv-float {
      position: absolute; color: rgba(255, 255, 255, .13);
      animation-name: tvFloat; animation-timing-function: ease-in-out; animation-iteration-count: infinite;
    }
    .tv-waves { position: absolute; left: 0; bottom: 0; width: 200%; height: 90px; }
    .tv-waves path { fill: rgba(255, 255, 255, .14); }
    .tv-waves .w1 { animation: tvWave 9s linear infinite; }
    .tv-waves .w2 { fill: rgba(255, 255, 255, .09); animation: tvWave 13s linear infinite reverse; }
    .tv-pitch { position: absolute; inset: 14px; border: 2px solid rgba(255, 255, 255, .12); border-radius: 10px; }
    .tv-pitch .line { position: absolute; top: 0; bottom: 0; left: 50%; border-left: 2px solid rgba(255, 255, 255, .12); }
    .tv-pitch .circle {
      position: absolute; top: 50%; left: 50%; width: 150px; height: 150px; margin: -75px 0 0 -75px;
      border: 2px solid rgba(255, 255, 255, .12); border-radius: 50%;
    }

    /* ---------- Contenido ---------- */
    .tv-inner { position: relative; padding: clamp(1.3rem, 3vw, 2rem); }
    .tv-eyebrow {
      display: inline-flex; align-items: center; gap: .4rem; font-size: .72rem; font-weight: 800; letter-spacing: .14em;
      text-transform: uppercase; padding: .35rem .7rem; border-radius: 999px;
      background: rgba(255, 255, 255, .14); backdrop-filter: blur(6px);
    }
    .tv-head h3 {
      font-family: var(--font-logo); font-size: clamp(1.4rem, 3.4vw, 2.1rem); font-weight: 900; margin: .7rem 0 1rem;
      text-shadow: 0 2px 14px rgba(0, 0, 0, .3);
    }
    .tv-head h3 i { margin-right: .35rem; }
    .tv-intro p { color: rgba(255, 255, 255, .85); font-size: 1rem; line-height: 1.45; margin-bottom: 1.2rem; }

    .tv-topics { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 170px), 1fr)); gap: .9rem; }
    .tv-topic {
      position: relative; overflow: hidden; display: flex; flex-direction: column; align-items: flex-start; gap: .25rem;
      padding: 1.1rem 1rem 1rem; border-radius: 14px; border: 1px solid rgba(255, 255, 255, .22); color: #fff; text-align: left;
      cursor: pointer; min-height: 165px;
      box-shadow: 0 10px 24px -14px rgba(0, 0, 0, .6);
      opacity: 0; animation: tvRise .55s cubic-bezier(.2, .8, .2, 1) forwards;
      transition: transform .25s ease, box-shadow .25s ease;
    }
    .tv-topic::after {
      content: ''; position: absolute; inset: 0; background: linear-gradient(120deg, transparent 30%, rgba(255, 255, 255, .25) 50%, transparent 70%);
      transform: translateX(-120%); transition: transform .7s ease;
    }
    .tv-topic:hover { transform: translateY(-5px) scale(1.02); box-shadow: 0 18px 30px -14px rgba(0, 0, 0, .7); }
    .tv-topic:hover::after { transform: translateX(120%); }
    .tp-mx { background: linear-gradient(145deg, #0B6E4F, #04332A); }
    .tp-cb { background: linear-gradient(145deg, #00B4D8, #0353A4); }
    .tp-fd { background: linear-gradient(145deg, #F77F00, #9D0208); }
    .tp-fb { background: linear-gradient(145deg, #2DA44E, #0B3D1E); }
    .tp-icon {
      display: grid; place-items: center; width: 52px; height: 52px; border-radius: 14px; font-size: 1.55rem;
      background: rgba(255, 255, 255, .18); margin-bottom: .55rem; transition: transform .35s ease;
    }
    .tv-topic:hover .tp-icon { transform: rotate(-10deg) scale(1.12); }
    .tp-name { font-size: 1.15rem; font-weight: 900; }
    .tp-tag { font-size: .8rem; color: rgba(255, 255, 255, .82); line-height: 1.3; }
    .tp-go { margin-top: auto; padding-top: .7rem; font-size: .75rem; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; }
    .tp-go i { transition: transform .25s ease; }
    .tv-topic:hover .tp-go i { transform: translateX(4px); }

    .tv-progress { display: flex; justify-content: space-between; align-items: center; font-size: .8rem; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; }
    .tv-score { display: inline-flex; gap: .35rem; align-items: center; padding: .3rem .7rem; border-radius: 999px; background: rgba(255, 255, 255, .16); }
    .tv-score i { color: #FFD166; }
    .tv-score.bump { animation: tvPop .5s ease; }
    .tv-bar { height: 8px; background: rgba(255, 255, 255, .18); border-radius: 999px; overflow: hidden; margin: .6rem 0 1.2rem; }
    .tv-bar-fill { height: 100%; background: linear-gradient(90deg, #FFD166, #fff); border-radius: 999px; transition: width .5s cubic-bezier(.2, .8, .2, 1); }

    .tv-card {
      background: rgba(255, 255, 255, .1); border: 1px solid rgba(255, 255, 255, .18); border-radius: 14px;
      padding: clamp(1rem, 2.5vw, 1.4rem); backdrop-filter: blur(10px);
      animation: tvSlide .45s cubic-bezier(.2, .8, .2, 1);
    }
    .tv-q { font-size: clamp(1.1rem, 2.4vw, 1.4rem); font-weight: 800; line-height: 1.35; margin-bottom: 1.1rem; }
    .tv-options { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr)); gap: .7rem; margin-bottom: 1rem; }
    .tv-opt {
      display: flex; align-items: center; gap: .7rem; text-align: left;
      border: 2px solid rgba(255, 255, 255, .25); background: rgba(255, 255, 255, .95); color: #111;
      border-radius: 12px; padding: .75rem .9rem; font-weight: 700; font-size: .95rem; cursor: pointer;
      opacity: 0; animation: tvRise .4s ease forwards;
      transition: transform .18s ease, box-shadow .18s ease, background .2s ease, border-color .2s ease;
    }
    .tv-opt:hover:not(:disabled) { transform: translateY(-3px); box-shadow: 0 10px 18px -10px rgba(0, 0, 0, .6); }
    .tv-opt:disabled { cursor: default; }
    .tv-opt:disabled:not(.right):not(.wrong) { opacity: .55 !important; }
    .tv-letter {
      flex: 0 0 auto; display: grid; place-items: center; width: 30px; height: 30px; border-radius: 8px;
      background: #111; color: #fff; font-size: .8rem; font-weight: 900;
    }
    .tv-opt-text { flex: 1; min-width: 0; }
    .tv-mark { font-size: 1.25rem; }
    .tv-opt.right { background: #DCFCE7; border-color: #16A34A; color: #14532D; animation: tvRise .4s ease forwards, tvPulse .7s ease .05s; }
    .tv-opt.right .tv-letter { background: #16A34A; }
    .tv-opt.wrong { background: #FFE4E6; border-color: #E11D48; color: #7F1D1D; animation: tvRise .4s ease forwards, tvShake .45s ease; }
    .tv-opt.wrong .tv-letter { background: #E11D48; }

    .tv-feedback {
      display: flex; gap: .7rem; align-items: flex-start; padding: .85rem 1rem; border-radius: 12px; margin-bottom: 1rem;
      background: rgba(255, 209, 102, .95); color: #4A2B00; font-size: .92rem; line-height: 1.45;
      animation: tvRise .35s ease both;
    }
    .tv-feedback.ok { background: rgba(220, 252, 231, .97); color: #14532D; }
    .tv-fb-icon { font-size: 1.4rem; line-height: 1; }

    .tv-btn {
      display: inline-flex; align-items: center; justify-content: center; gap: .5rem; border: none; border-radius: 10px;
      background: #fff; color: #111; font-weight: 900; font-size: .88rem; padding: .8rem 1.3rem; cursor: pointer;
      text-transform: uppercase; letter-spacing: .04em; text-decoration: none;
      box-shadow: 0 8px 18px -10px rgba(0, 0, 0, .6); transition: transform .18s ease, box-shadow .18s ease;
    }
    .tv-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 22px -10px rgba(0, 0, 0, .7); }
    .tv-next { animation: tvRise .35s ease .1s both; }
    .tv-wa { background: #25D366; color: #fff; }
    .tv-ghost { background: rgba(255, 255, 255, .14); color: #fff; border: 1px solid rgba(255, 255, 255, .35); }

    .tv-result { position: relative; text-align: center; padding: .5rem 0 .3rem; }
    .tv-ring {
      --pct: 0;
      width: 170px; height: 170px; margin: 0 auto; border-radius: 50%; display: grid; place-items: center;
      background: conic-gradient(#FFD166 calc(var(--pct) * 1%), rgba(255, 255, 255, .15) 0);
      animation: tvZoom .7s cubic-bezier(.2, 1.4, .4, 1);
    }
    .tv-big {
      width: 138px; height: 138px; border-radius: 50%; display: grid; place-items: center; align-content: center;
      background: rgba(0, 0, 0, .35); font-family: var(--font-logo); font-size: 3.4rem; font-weight: 900; line-height: 1;
    }
    .tv-big small { font-size: 1.1rem; opacity: .8; }
    .tv-verdict { font-size: 1.15rem; font-weight: 900; margin: 1rem 0 1.3rem; animation: tvRise .5s ease .3s both; }
    .tv-actions { display: flex; gap: .7rem; justify-content: center; flex-wrap: wrap; animation: tvRise .5s ease .45s both; }
    .tv-confetti { position: absolute; inset: -40px 0 0; pointer-events: none; overflow: hidden; height: 420px; }
    .tv-confetti span { position: absolute; top: -20px; border-radius: 2px; opacity: .95; animation: tvConfetti linear forwards; }

    @keyframes tvGradient { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
    @keyframes tvDrift { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(40px, 30px); } }
    @keyframes tvFloat { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-22px) rotate(12deg); } }
    @keyframes tvWave { from { transform: translateX(0); } to { transform: translateX(-50%); } }
    @keyframes tvRise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes tvSlide { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }
    @keyframes tvPop { 0% { transform: scale(1); } 40% { transform: scale(1.35); } 100% { transform: scale(1); } }
    @keyframes tvPulse { 0% { box-shadow: 0 0 0 0 rgba(22, 163, 74, .6); } 100% { box-shadow: 0 0 0 16px rgba(22, 163, 74, 0); } }
    @keyframes tvShake { 0%, 100% { transform: translateX(0); } 20%, 60% { transform: translateX(-7px); } 40%, 80% { transform: translateX(7px); } }
    @keyframes tvZoom { from { transform: scale(.4) rotate(-90deg); opacity: 0; } to { transform: scale(1) rotate(0); opacity: 1; } }
    @keyframes tvConfetti { to { transform: translateY(460px) rotate(720deg); opacity: 0; } }

    @media (max-width: 480px) {
      .tv-actions .tv-btn { width: 100%; }
      .tv-topic { min-height: 0; }
    }
    @media (prefers-reduced-motion: reduce) {
      .trivia, .tv-glow, .tv-float, .tv-waves path, .tv-confetti span { animation: none !important; }
      .tv-topic, .tv-opt, .tv-card, .tv-feedback, .tv-next, .tv-verdict, .tv-actions, .tv-ring { animation: none !important; opacity: 1; }
    }
  `,
})
export class ElectionTrivia {
  readonly i18n = inject(I18nService);

  readonly topics = TOPICS;
  readonly letters = ['A', 'B', 'C', 'D'];
  readonly topic = signal<TriviaTopic>('mx');
  readonly started = signal(false);
  readonly round = signal<TriviaQuestion[]>([]);
  readonly index = signal(0);
  readonly picked = signal<number | null>(null);
  readonly score = signal(0);
  readonly scoreBump = signal(false);
  readonly finished = signal(false);

  readonly current = computed(() => this.round()[this.index()]);
  readonly isLast = computed(() => this.index() + 1 >= this.round().length);
  readonly currentTheme = computed(() => TOPICS.find((tp) => tp.id === this.topic()) ?? TOPICS[0]);
  readonly progress = computed(() => ((this.index() + (this.picked() !== null ? 1 : 0)) / Math.max(1, this.round().length)) * 100);

  /** Íconos flotantes del fondo, con posición y ritmo fijos por tema. */
  readonly deco = computed(() => {
    const icons = this.started() ? this.currentTheme().deco : INTRO_DECO;
    const spots = [[6, 12], [84, 8], [70, 62], [14, 72], [46, 6], [92, 44], [32, 86], [58, 34]];
    return icons.map((icon, i) => ({
      key: `${this.started() ? this.topic() : 'intro'}-${i}`,
      icon,
      x: spots[i % spots.length][0],
      y: spots[i % spots.length][1],
      size: 1.8 + ((i * 7) % 5) * 0.55,
      delay: -(i * 1.3),
      dur: 7 + (i % 4) * 1.6,
    }));
  });

  /** Confeti del resultado: más piezas entre mejor sea el puntaje. */
  readonly confetti = computed(() => {
    const pieces = 18 + this.score() * 8;
    return Array.from({ length: pieces }, (_, i) => ({
      key: i,
      x: Math.random() * 100,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      delay: Math.random() * 0.8,
      dur: 1.8 + Math.random() * 1.6,
      w: 6 + Math.random() * 6,
      h: 8 + Math.random() * 8,
    }));
  });

  readonly verdict = computed(() => {
    const s = this.score();
    const total = this.round().length;
    if (s === total) return this.t('¡Perfecto! Eres un experto. 🏆', 'Perfect! You are an expert. 🏆');
    if (s >= total - 1) return this.t('¡Muy bien! Casi perfecto. 🔥', 'Great! Almost perfect. 🔥');
    if (s >= Math.ceil(total / 2)) return this.t('Nada mal. ¿Vas por la revancha? 💪', 'Not bad. Up for a rematch? 💪');
    return this.t('A repasar… ¡juega otra vez y mejora tu marca! 📚', 'Time to study… play again and beat your score! 📚');
  });

  readonly shareUrl = computed(() => {
    const topic = this.i18n.tx(this.currentTheme().label);
    const text = this.t(
      `Saqué ${this.score()}/${this.round().length} en la trivia de ${topic} de MUESTRA.MX. ¿Me superas? https://muestra.mx`,
      `I scored ${this.score()}/${this.round().length} on the MUESTRA.MX ${topic} trivia. Can you beat me? https://muestra.mx`,
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
    if (i === this.current().answer) {
      this.score.update((s) => s + 1);
      this.scoreBump.set(true);
      setTimeout(() => this.scoreBump.set(false), 520);
    }
  }

  next(): void {
    if (this.isLast()) {
      this.finished.set(true);
      return;
    }
    this.index.update((i) => i + 1);
    this.picked.set(null);
  }
}
