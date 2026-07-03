import * as XLSX from 'xlsx';
import { QUESTIONNAIRE } from '../data/questionnaire';
import type { Project } from '../types';

const ANSWER_COLUMN = 'M';
const FIRST_QUESTION_ROW = 12;
const ROW_STEP = 4; // pregunta en fila N, opciones/respuesta en fila N+1, siguiente pregunta en N+4 (layout del Toolkit oficial)
const PROYECTO_CELL = 'D6';

const SHEET_BY_BLOQUE: Record<'Características del Cambio' | 'Atributos Organizacionales', string> = {
  'Características del Cambio': 'Consciencia Situacional',
  'Atributos Organizacionales': 'Consciencia Situacional (2)',
};

// El Toolkit trae fullCalcOnLoad=false y SheetJS no reescribe ese flag al guardar,
// así que además de las respuestas pisamos a mano el valor cacheado de las celdas
// de score/riesgo (las fórmulas quedan intactas para quien fuerce un recálculo).
function setCellValue(ws: XLSX.WorkSheet, addr: string, value: string | number) {
  const existing = ws[addr];
  if (existing) {
    existing.v = value;
    existing.t = typeof value === 'number' ? 'n' : 's';
    delete existing.w;
  } else {
    ws[addr] = { t: typeof value === 'number' ? 'n' : 's', v: value };
  }
}

async function loadTemplateWorkbook(): Promise<XLSX.WorkBook> {
  const response = await fetch('/toolkit-template.xlsx');
  const buffer = await response.arrayBuffer();
  return XLSX.read(buffer, { type: 'array' });
}

function fillAnswersIntoSheet(ws: XLSX.WorkSheet, bloque: 'Características del Cambio' | 'Atributos Organizacionales', respuestas: Project['respuestas']) {
  const preguntas = QUESTIONNAIRE.filter((p) => p.bloque === bloque);
  preguntas.forEach((pregunta, index) => {
    const answerRow = FIRST_QUESTION_ROW + 1 + index * ROW_STEP;
    const respuesta = respuestas?.[pregunta.id] ?? 0;
    setCellValue(ws, `${ANSWER_COLUMN}${answerRow}`, respuesta);
  });
}

export async function exportDiagnosticXlsx(project: Project): Promise<void> {
  const wb = await loadTemplateWorkbook();

  const scoreC = project.scoreCaracteristicasDelCambio ?? 0;
  const scoreA = project.scoreAtributosOrganizacionales ?? 0;
  const nivel = project.nivelCalculado ?? '';

  const wsCaracteristicas = wb.Sheets[SHEET_BY_BLOQUE['Características del Cambio']];
  fillAnswersIntoSheet(wsCaracteristicas, 'Características del Cambio', project.respuestas);
  setCellValue(wsCaracteristicas, `${ANSWER_COLUMN}62`, scoreC);

  const wsAtributos = wb.Sheets[SHEET_BY_BLOQUE['Atributos Organizacionales']];
  fillAnswersIntoSheet(wsAtributos, 'Atributos Organizacionales', project.respuestas);
  setCellValue(wsAtributos, `${ANSWER_COLUMN}62`, scoreA);

  const wsTablero = wb.Sheets['Tablero'];
  setCellValue(wsTablero, PROYECTO_CELL, project.nombre);
  setCellValue(wsTablero, 'F24', scoreC);
  setCellValue(wsTablero, 'F25', scoreA);
  setCellValue(wsTablero, 'F26', nivel);

  const fileName = `Toolkit_GDC_COMPRAS_${project.nombre.replace(/[^a-z0-9]+/gi, '_')}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
