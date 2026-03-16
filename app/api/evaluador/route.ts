import { generateText } from 'ai';
import { groq } from '@ai-sdk/groq';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { prompt, imageBase64, isVision, systemPrompt } = await req.json();

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'GROQ_API_KEY no configurada' }, { status: 500 });
    }

    let modelToUse = 'llama-3.1-8b-instant';
    
    if (isVision && imageBase64) {
      modelToUse = 'llama-3.2-11b-vision-preview';
    }

    const evaluadorSystemPrompt = systemPrompt || `Eres el subagente EVALUADOR EXTRACURRICULAR de ThotAI. Tu rol es analizar textos y crear instrumentos de evaluación rigurosos.
    
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

    const messages: any[] = [];

    if (isVision && imageBase64) {
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: `Analiza este documento PDF y genera un test de evaluación con 15 preguntas de opción múltiple sobre el contenido. ${evaluadorSystemPrompt}` },
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
      system: evaluadorSystemPrompt,
      messages,
      temperature: 0.2,
    });

    return Response.json({ result: text });
  } catch (error) {
    console.error('Error en API Evaluador:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return Response.json(
      { error: 'Error al procesar la solicitud', details: errorMessage },
      { status: 500 }
    );
  }
}
