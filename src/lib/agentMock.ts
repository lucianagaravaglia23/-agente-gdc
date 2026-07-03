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

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

export async function getQuestionAssistantReply(questionTexto: string, userMessage: string): Promise<string> {
  const fallback =
    `No pude conectarme con el asistente en este momento. Revisá el alcance real del cambio en tu proyecto y ` +
    `compará la situación con los ejemplos de cada opción antes de elegir un valor.\n\n${ASSISTANT_DISCLAIMER}`;

  if (!GEMINI_API_KEY) {
    console.error('Falta VITE_GEMINI_API_KEY en el archivo .env');
    return fallback;
  }

  const prompt =
    `Sos un asistente que ayuda a interpretar preguntas de un cuestionario de Gestión del Cambio. ` +
    `La pregunta del cuestionario es: "${questionTexto}". ` +
    `El usuario consulta lo siguiente: "${userMessage}". ` +
    `Respondé en español, en un párrafo breve (máximo 4 líneas), orientativo, sin decidir la respuesta por el usuario ` +
    `y sin usar jerga técnica de IA.`;

  try {
    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });

    if (!response.ok) {
      console.error('Gemini respondió con error', response.status, await response.text());
      return fallback;
    }

    const data = await response.json();
    const texto = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return texto ? `${texto}\n\n${ASSISTANT_DISCLAIMER}` : fallback;
  } catch (error) {
    console.error('Error llamando a Gemini:', error);
    return fallback;
  }
}