import { generateText } from 'ai';
import { groq } from '@ai-sdk/groq';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { agent, prompt, profile, format, systemPrompt, imageBase64, isVision } = await req.json();

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'GROQ_API_KEY no configurada' }, { status: 500 });
    }

    let modelToUse = 'llama-3.1-8b-instant';
    
    if (isVision && imageBase64) {
      modelToUse = 'llama-3.2-11b-vision-preview';
    }

    let system = '';
    
    if (agent === 'evaluador') {
      system = `Eres el subagente EVALUADOR EXTRACURRICULAR de ThotAI. Tu rol es analizar textos y crear instrumentos de evaluación rigurosos.
      REGLAS DE FORMATO ESTRICTAS:
      1. PROHIBICIÓN TOTAL DE MARKDOWN: No uses asteriscos, guiones, ni corchetes fuera de la sintaxis JSON.
      2. ÚNICA SALIDA PERMITIDA: Un objeto JSON perfectamente estructurado. Las claves exactas a usar son:
      {
        "tituloTest": "Título descriptivo de la evaluación",
        "descripcion": "Breve resumen de los contenidos evaluados",
        "preguntas": [
          {
            "enunciado": "¿Pregunta de opción múltiple?",
            "opciones": ["Opción A", "Opción B", "Opción C", "Opción D"],
            "respuestaCorrecta": "Opción en formato string (coincidente con el array)"
          }
        ],
        "sugerenciaDidactica": "Consejo avanzado para el profesor al aplicar esta prueba"
      }
      3. Genera exactamente 15 preguntas de opción múltiple.`;
    } else if (agent === 'accesibilidad') {
      system = `Eres el subagente de ACCESIBILIDAD UNIVERSAL de ThotAI. Tu objetivo es convertir el texto ingresado en un formato altamente inclusivo según la selección del usuario.
      Formato solicitado: ${format || 'Lectura Fácil (IFLA)'}
      REGLAS DE SALIDA OBLIGATORIAS:
      1. ESTRICTAMENTE PROHIBIDO usar Markdown en cualquier campo (ni asteriscos, hashtags o símbolos).
      2. Tu respuesta debe ser un objeto JSON puro con esta estructura:
      {
        "tituloTransformado": "Título del contenido",
        "bloquesDeTexto": ["Primer bloque o descripción", "Segundo bloque..."],
        "instruccionLectorPantalla": "Breve indicación técnica para el software de accesibilidad"
      }`;
    } else {
      system = `Eres el subagente ADAPTADOR de ThotAI. Tu objetivo es procesar el texto educativo ingresado y adaptarlo estrictamente al perfil cognitivo y nivel educativo indicado.
      Perfil Actual: ${profile}.
      REGLAS ESTRICTAS:
      1. NO debes usar formato Markdown crudo (ni #, ni *, ni -). Nada.
      2. Tu respuesta DEBE ser un objeto JSON válido con la siguiente estructura exacta:
      {
        "tituloAdaptado": "Un título adecuado al perfil",
        "parrafos": ["Párrafo adaptado 1", "Párrafo adaptado 2..."],
        "consejoEducador": "Breve recomendación metodológica para el profesor"
      }
      3. Asegúrate de que el JSON sea perfectamente parseable por JSON.parse().`;
    }

    const messages: any[] = [];

    if (isVision && imageBase64) {
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image', image: `data:application/pdf;base64,${imageBase64}` }
        ]
      });
    } else {
      messages.push({
        role: 'user',
        content: prompt
      });
    }

    const { text } = await generateText({
      model: groq(modelToUse),
      system: systemPrompt || system,
      messages,
      temperature: 0.2,
    });

    return Response.json({ result: text });
  } catch (error) {
    console.error('Error en API:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return Response.json(
      { error: 'Error al procesar la solicitud', details: errorMessage },
      { status: 500 }
    );
  }
}
