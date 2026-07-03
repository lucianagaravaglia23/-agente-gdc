// TODO: integrar con API de Claude — hoy devuelve texto mock predefinido.

export function getAgentHelp(tarea: string, projectName: string): string {
  return (
    `Para ejecutar "${tarea}" en el proyecto "${projectName}", te sugerimos:\n` +
    `1. Revisá el template asociado a esta tarea como punto de partida.\n` +
    `2. Coordiná una instancia breve con el sponsor o los referentes del área impactada.\n` +
    `3. Documentá los hallazgos clave y marcá la tarea como "En progreso".\n` +
    `4. Si la tarea resulta más compleja de lo esperado, usá "Escalar al equipo experto".`
  );
}

export function generateDraft(tarea: string, projectName: string): string {
  return (
    `Borrador — ${tarea} (${projectName})\n\n` +
    `[Generado automáticamente como punto de partida. Completá y ajustá con la información real del proyecto.]`
  );
}

export interface AiChatMessage {
  role: 'user' | 'assistant';
  texto: string;
}

const ASSISTANT_DISCLAIMER =
  'Recordá: este asistente ofrece una guía orientativa. No decide por vos — la respuesta final del cuestionario queda a tu criterio.';

export function getQuestionAssistantReply(questionTexto: string, userMessage: string): string {
  return (
    `Sobre la pregunta "${questionTexto}":\n` +
    `Tu consulta: "${userMessage}"\n\n` +
    `Sugerencia orientativa: revisá el alcance real del cambio en tu proyecto y compará la situación con los ejemplos de cada opción antes de elegir un valor. ` +
    `Si la situación no encaja claramente en ninguna opción, elegí la más cercana y, si la duda persiste, usá "Elevar consulta a GDC".\n\n` +
    `${ASSISTANT_DISCLAIMER}`
  );
}
