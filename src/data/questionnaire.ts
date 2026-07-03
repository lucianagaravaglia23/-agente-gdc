import type { QuestionBlock, QuestionOption, QuestionnaireQuestion } from '../types';

type Anchors = Partial<Record<1 | 2 | 3 | 4 | 5, string>>;

// El Excel original solo muestra explícitamente algunos puntos de la escala (1-5, 1-3-5, o 1-5).
// Las opciones no explícitas se completan como interpolación entre las dos opciones explícitas
// más cercanas, tal como pide el PRD ("entre las opciones 1 y 3").
function buildOptions(anchors: Anchors): QuestionOption[] {
  const values: (1 | 2 | 3 | 4 | 5)[] = [1, 2, 3, 4, 5];
  return values.map((valor) => {
    const texto = anchors[valor];
    if (texto) {
      return { valor, texto, esExplicita: true };
    }
    let lower = valor - 1;
    while (lower >= 1 && !anchors[lower as 1 | 2 | 3 | 4 | 5]) lower -= 1;
    let upper = valor + 1;
    while (upper <= 5 && !anchors[upper as 1 | 2 | 3 | 4 | 5]) upper += 1;
    return {
      valor,
      texto: `Entre las opciones ${lower} ("${anchors[lower as 1 | 2 | 3 | 4 | 5]}") y ${upper} ("${anchors[upper as 1 | 2 | 3 | 4 | 5]}")`,
      esExplicita: false,
    };
  });
}

function q(bloque: QuestionBlock, prefix: string, numero: number, texto: string, anchors: Anchors): QuestionnaireQuestion {
  return {
    id: `${prefix}-${numero.toString().padStart(2, '0')}`,
    bloque,
    numero,
    texto,
    opciones: buildOptions(anchors),
  };
}

const CARACTERISTICAS: QuestionnaireQuestion[] = [
  q('Características del Cambio', 'CS', 1, 'Alcance del cambio. Impacta a…', {
    1: 'A un grupo de trabajo',
    2: 'Una o varias jefaturas',
    3: 'Una o varias gerencias',
    4: 'Una o varias direcciones',
    5: 'Toda la organización',
  }),
  q(
    'Características del Cambio',
    'CS',
    2,
    'En relación al tamaño de la compañía, ¿cuál es el número de colaboradores impactados por el cambio?',
    {
      1: 'Menos del 20%',
      2: 'Entre 20% y 45%',
      3: 'Entre 45% y 70%',
      4: 'Entre 70% y 95%',
      5: '100%',
    },
  ),
  q('Características del Cambio', 'CS', 3, '¿Cuál es la variación del impacto en los grupos involucrados?', {
    1: 'Todos los grupos afectados por igual',
    3: 'Hay alguna variación del impacto entre grupos',
    5: 'Todos los grupos con diferentes impactos',
  }),
  q(
    'Características del Cambio',
    'CS',
    4,
    'Considerando que hay 10 aspectos de Cambio, ¿cuántos de ellos están cambiando? (Procesos, Sistemas, Herramientas, Roles, Comportamientos, Estructura, Performance, Ubicación, Mindsets/Actitudes/Creencias, Compensaciones)',
    {
      1: '1 solo aspecto',
      2: 'de 2 a 3 aspectos',
      3: 'de 4 a 5 aspectos',
      4: 'de 6 a 8 aspectos',
      5: 'de 9 a 10 aspectos',
    },
  ),
  q('Características del Cambio', 'CS', 5, 'Grado de cambio en procesos', {
    1: 'Sin cambios',
    2: 'Leve',
    3: 'Significativo',
    4: 'Casi totalmente',
    5: 'Totalmente',
  }),
  q('Características del Cambio', 'CS', 6, 'Grado de cambio en tecnología y sistemas', {
    1: 'Sin cambios',
    2: 'Leve',
    3: 'Significativo',
    4: 'Casi totalmente',
    5: 'Totalmente',
  }),
  q('Características del Cambio', 'CS', 7, 'Grado de cambio en roles', {
    1: 'Sin cambios',
    2: 'Leve',
    3: 'Significativo',
    4: 'Casi totalmente',
    5: 'Totalmente',
  }),
  q('Características del Cambio', 'CS', 8, 'Grado de cambio en estructura organizacional', {
    1: 'Sin cambios',
    2: 'Leve',
    3: 'Significativo',
    4: 'Casi totalmente',
    5: 'Totalmente',
  }),
  q('Características del Cambio', 'CS', 9, 'Grado de cambio general', {
    1: 'Incremental — mejora pequeña sobre lo existente',
    2: 'Leve — ajustes sobre lo existente',
    3: 'Moderado',
    4: 'Alto — transformación importante',
    5: 'Radical — reemplazo total del paradigma actual',
  }),
  q('Características del Cambio', 'CS', 10, 'Grado de impacto en la compensación del empleado', {
    1: 'Sin impacto en sueldo o beneficios',
    5: 'Alto impacto en sueldo o beneficios',
  }),
  q('Características del Cambio', 'CS', 11, 'Reducción en el personal total', {
    1: 'Sin cambios',
    5: 'Cambios significativos',
  }),
  q('Características del Cambio', 'CS', 12, 'Período de tiempo necesario para cambiar', {
    1: 'Menor a un mes',
    2: 'Entre 1 y 2 meses',
    3: 'Entre 3 y 4 meses',
    4: 'Entre 5 y 6 meses',
    5: 'Más de 6 meses',
  }),
];

const ATRIBUTOS: QuestionnaireQuestion[] = [
  q(
    'Atributos Organizacionales',
    'AO',
    1,
    'Percepción de la necesidad de cambio por parte de colaboradores y líderes de la organización impactados',
    {
      1: 'Descontentos con el estado actual, consideran muy importante la necesidad de un cambio',
      5: 'No ven una necesidad de cambio — satisfechos con el estado actual',
    },
  ),
  q(
    'Atributos Organizacionales',
    'AO',
    2,
    '¿Cómo perciben los colaboradores los impactos de cambios pasados vividos en la organización?',
    {
      1: 'Perciben el cambio anterior positivamente',
      5: 'Perciben el cambio anterior negativamente',
    },
  ),
  q('Atributos Organizacionales', 'AO', 3, '¿Cuál es la capacidad de cambio que tienen los grupos afectados?', {
    1: 'Pocos cambios se están produciendo en la organización que afectan a estos grupos',
    5: 'Se están produciendo muchos cambios en la organización que afectan a estos grupos',
  }),
  q(
    'Atributos Organizacionales',
    'AO',
    4,
    '¿Cómo fue la experiencia de los grupos impactados en relación a cambios anteriores?',
    {
      1: 'El cambio fue exitoso y estuvo bien gestionado',
      5: 'Proyectos fallidos o mal gestionados',
    },
  ),
  q(
    'Atributos Organizacionales',
    'AO',
    5,
    '¿Existe una idea de visión y dirección compartida entre la organización y el cambio?',
    {
      1: 'Ampliamente compartida',
      5: 'Poco compartida y diferentes prioridades',
    },
  ),
  q('Atributos Organizacionales', 'AO', 6, 'Disponibilidad de recursos y fondos (Económicos, Técnicos, RRHH)', {
    1: 'Adecuados',
    3: 'Limitados',
    5: 'Muy limitados',
  }),
  q('Atributos Organizacionales', 'AO', 7, 'Cultura organizacional y respuesta a los cambios', {
    1: 'Abierta y receptiva a nuevas ideas de cambio',
    5: 'Cerrada y resistente a nuevas ideas de cambio',
  }),
  q('Atributos Organizacionales', 'AO', 8, 'Refuerzo organizacional', {
    1: 'Empleados recompensados por tomar riesgos y cambiar el status quo',
    5: 'Empleados recompensados por consistencia y previsibilidad',
  }),
  q('Atributos Organizacionales', 'AO', 9, 'Estilo de liderazgo y distribución del poder', {
    1: 'Centralizado',
    5: 'Distribuido',
  }),
  q('Atributos Organizacionales', 'AO', 10, 'Competencias de cambio de la dirección', {
    1: 'Demuestran esponsoreo efectivo en procesos de cambio',
    5: 'Demuestran falta de habilidades de cambio',
  }),
  q('Atributos Organizacionales', 'AO', 11, 'Competencias de cambio de la gerencia', {
    1: 'Demuestran esponsoreo efectivo en procesos de cambio',
    5: 'Demuestran falta de habilidades de cambio',
  }),
  q('Atributos Organizacionales', 'AO', 12, 'Competencias de cambio de los empleados', {
    1: 'Empleados altamente competentes en procesos de cambio',
    5: 'Empleados sin habilidades de cambio',
  }),
];

export const QUESTIONNAIRE: QuestionnaireQuestion[] = [...CARACTERISTICAS, ...ATRIBUTOS];
