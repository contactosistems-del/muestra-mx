import type { NewsItem } from '../domain/models';

/**
 * Notas publicadas desde el código (no desde el panel). Aparecen junto con las de Firestore,
 * ordenadas por fecha. Sus ids empiezan con "ed-" y no se editan ni borran desde el panel:
 * para quitarlas o cambiarlas se modifica este archivo.
 */
export const EDITORIAL_NEWS: NewsItem[] = [
  {
    id: 'ed-presupuesto-ine-2027',
    categoryId: 'NACIONAL',
    imageUrl: '/assets/images/noticias/presupuesto-ine-2027.jpg',
    publishedAt: Date.UTC(2026, 10, 5, 20, 0),
    title: {
      es: 'Sheinbaum plantea recortar el presupuesto del INE para 2027; la decisión será de la Cámara de Diputados',
      en: 'Sheinbaum proposes cutting INE’s 2027 budget; the Chamber of Deputies will decide',
    },
    body: {
      es: `La presidenta Claudia Sheinbaum afirmó este jueves en su conferencia matutina que "se pueden hacer ahorros" en el presupuesto del Instituto Nacional Electoral (INE) para 2027, y lo relacionó con señalamientos de corrupción en contrataciones del instituto.

Recordó que el INE propuso alrededor de 47 mil millones de pesos para el próximo año. El gobierno federal no estuvo de acuerdo y lo comunicó a través de la Secretaría de Gobernación. Sheinbaum explicó que el Ejecutivo no puede modificar la propuesta de los organismos autónomos y que corresponde a la Cámara de Diputados fijar el monto final, en un nivel parecido al de 2024, 2025 y 2026.

También pidió a los órganos internos de control y a la Auditoría Superior revisar las contrataciones, transparentar la fabricación de boletas y fortalecer a Talleres Gráficos de México para producir material electoral.

El tema llega en un momento de presión para el instituto. En 2026 el INE recibió más de 4 mil millones de pesos menos de lo que pidió, y a mediados de año la consejera Rita Bell López Vences advirtió que algunas juntas tenían dificultades para cubrir servicios básicos. En 2027 el INE organizará la elección federal y apoyará 32 procesos locales.

Con información de Presidencia de la República y el INE.`,
      en: `President Claudia Sheinbaum said on Thursday at her morning press conference that "savings can be made" in the National Electoral Institute (INE) budget for 2027, linking it to allegations of corruption in the institute’s contracting.

She noted that INE proposed about 47 billion pesos for next year. The federal government disagreed and said so through the Interior Ministry. Sheinbaum explained that the Executive cannot change the proposals of autonomous bodies and that the Chamber of Deputies will set the final amount, at a level similar to 2024, 2025 and 2026.

She also asked internal oversight bodies and the Federal Audit Office to review contracts, called for transparency in ballot printing, and proposed strengthening Talleres Gráficos de México to produce electoral materials.

The debate comes at a time of pressure for the institute. In 2026 INE received over 4 billion pesos less than it requested, and in mid-year councilor Rita Bell López Vences warned that some local offices struggled to cover basic services. In 2027 INE will run the federal election and support 32 local processes.

Based on information from the Office of the President and INE.`,
    },
  },
  {
    id: 'ed-ine-convenio-integridad-2027',
    categoryId: 'NACIONAL',
    imageUrl: '/assets/images/noticias/ine-convenio-integridad-2027.jpg',
    publishedAt: Date.UTC(2026, 10, 5, 19, 30),
    title: {
      es: 'INE firmará convenio con cinco instituciones para revisar a aspirantes rumbo a la elección 2027',
      en: 'INE to sign agreement with five agencies to vet candidates ahead of the 2027 election',
    },
    body: {
      es: `El Instituto Nacional Electoral (INE) firmará este viernes 6 de noviembre un convenio de colaboración para evaluar el perfil de riesgo de quienes aspiren a una candidatura en el Proceso Electoral 2027. El objetivo es evitar que personas vinculadas con el crimen organizado lleguen a las boletas.

Participan la Fiscalía General de la República, la Secretaría de Seguridad y Protección Ciudadana, el Centro Nacional de Inteligencia, la Comisión Nacional Bancaria y de Valores y la Unidad de Inteligencia Financiera.

El mecanismo es voluntario. Los partidos y los aspirantes independientes podrán entregar al INE listas de las personas que pretenden postular, con el consentimiento de cada una. El INE enviará las solicitudes a las instituciones, que aplicarán su propia metodología para determinar si existe un riesgo. El instituto aclaró que no interviene en esa evaluación.

Según el INE, el convenio busca elevar el estándar de integridad de las candidaturas y, al mismo tiempo, proteger los derechos político-electorales de los aspirantes.

La jornada electoral será el domingo 6 de junio de 2027. Se elegirán 500 diputaciones federales y 19,609 cargos locales, entre ellos 17 gubernaturas.

Con información del INE. Imagen de archivo.`,
      en: `The National Electoral Institute (INE) will sign a cooperation agreement on Friday, November 6, to assess the risk profile of people seeking candidacies in the 2027 electoral process. The goal is to keep people linked to organized crime off the ballot.

The participating agencies are the Attorney General’s Office, the Security and Citizen Protection Ministry, the National Intelligence Center, the National Banking and Securities Commission and the Financial Intelligence Unit.

The mechanism is voluntary. Parties and independent hopefuls may submit to INE lists of the people they intend to nominate, with each person’s consent. INE will forward the requests to the agencies, which will apply their own methodology to determine whether there is a risk. The institute said it does not take part in that assessment.

According to INE, the agreement seeks to raise the integrity standard for candidacies while protecting the political rights of hopefuls.

Election day will be Sunday, June 6, 2027, when 500 federal deputies and 19,609 local offices, including 17 governorships, will be elected.

Based on information from INE. File photo.`,
    },
  },
];

export function isEditorialNews(id: string): boolean {
  return id.startsWith('ed-');
}
