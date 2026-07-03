import type { ImpactLevel, MatrixEntry } from '../types';

// "Equipo GDC" en la tabla original de nivel MEDIO (tarea "Red de Cambio") se
// normaliza al rol "Equipo Experto de GDC", el único rol de equipo experto del sistema.
export const IMPACT_MATRIX: Record<ImpactLevel, MatrixEntry[]> = {
  ALTO: [
    { etapa: 'Preparar el Cambio', tarea: 'Mapa de Stakeholders', responsable: 'Equipo Experto de GDC' },
    { etapa: 'Preparar el Cambio', tarea: 'Análisis de Impactos', responsable: 'Equipo Experto de GDC' },
    {
      etapa: 'Preparar el Cambio',
      tarea: 'Estrategia de Gestión del Cambio (Comunicación – Capacitación – Acompañamiento)',
      responsable: 'Equipo Experto de GDC',
    },
    { etapa: 'Preparar el Cambio', tarea: 'Salud del Equipo de Proyecto', responsable: 'Equipo Experto de GDC' },
    { etapa: 'Gestionar el Cambio', tarea: 'Plan de Comunicación', responsable: 'Equipo Experto de GDC' },
    { etapa: 'Gestionar el Cambio', tarea: 'Plan de Capacitación', responsable: 'Equipo Experto de GDC' },
    { etapa: 'Gestionar el Cambio', tarea: 'Plan de Acompañamiento', responsable: 'Equipo Experto de GDC' },
    { etapa: 'Gestionar el Cambio', tarea: 'Red de Cambio', responsable: 'Equipo Experto de GDC' },
    { etapa: 'Reforzar el Cambio', tarea: 'Plan de Acciones de Refuerzo', responsable: 'Equipo Experto de GDC' },
    { etapa: 'Reforzar el Cambio', tarea: 'Celebración de logros', responsable: 'Equipo Experto de GDC' },
    {
      etapa: 'Reforzar el Cambio',
      tarea: 'Retrospectiva y Bitácora de Lecciones Aprendidas',
      responsable: 'Equipo Experto de GDC',
    },
  ],
  MEDIO: [
    { etapa: 'Preparar el Cambio', tarea: 'Análisis de Impactos', responsable: 'Embajadores / Staffing Dinámico' },
    {
      etapa: 'Preparar el Cambio',
      tarea: 'Estrategia de Gestión del Cambio (Comunicación – Capacitación – Acompañamiento)',
      responsable: 'Embajadores / Staffing Dinámico',
    },
    { etapa: 'Gestionar el Cambio', tarea: 'Plan de Comunicación', responsable: 'Embajadores / Staffing Dinámico' },
    { etapa: 'Gestionar el Cambio', tarea: 'Plan de Capacitación', responsable: 'Embajadores / Staffing Dinámico' },
    { etapa: 'Gestionar el Cambio', tarea: 'Plan de Acompañamiento', responsable: 'Embajadores / Staffing Dinámico' },
    { etapa: 'Gestionar el Cambio', tarea: 'Red de Cambio', responsable: 'Equipo Experto de GDC' },
    {
      etapa: 'Reforzar el Cambio',
      tarea: 'Plan de Acciones de Refuerzo',
      responsable: 'Embajadores / Staffing Dinámico',
    },
    { etapa: 'Reforzar el Cambio', tarea: 'Celebración de logros', responsable: 'Embajadores / Staffing Dinámico' },
  ],
  BAJO: [
    { etapa: 'Preparar el Cambio', tarea: 'Análisis de Impactos', responsable: 'Embajadores de Red de Cambio' },
    { etapa: 'Gestionar el Cambio', tarea: 'Plan de Comunicación', responsable: 'Embajadores de Red de Cambio' },
    { etapa: 'Gestionar el Cambio', tarea: 'Plan de Capacitación', responsable: 'Embajadores de Red de Cambio' },
    { etapa: 'Reforzar el Cambio', tarea: 'Celebración de logros', responsable: 'Embajadores de Red de Cambio' },
    {
      etapa: 'Reforzar el Cambio',
      tarea: 'Retrospectiva y Bitácora de Lecciones Aprendidas',
      responsable: 'Embajadores de Red de Cambio',
    },
  ],
};
