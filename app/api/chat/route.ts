import { generateText } from 'ai';
import { groq } from '@ai-sdk/groq';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const agent = body.agent || body.tipo || 'adaptador';
    const prompt = body.prompt;
    const profile = body.profile;
    const format = body.format;
    const imageBase64 = body.imageBase64;
    const isVision = body.isVision;

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'GROQ_API_KEY no configurada' }, { status: 500 });
    }

    let modelToUse = 'llama-3.1-8b-instant';
    if (isVision && imageBase64) {
      modelToUse = 'llama-3.2-11b-vision-preview';
    }

    let systemMessage = '';
    
    if (agent === 'evaluador') {
      systemMessage = `Eres un Experto Pedagógico Senior especializado en Evaluación Educativa. 
TU ÚNICA MISIÓN es generar un test de alta calidad basado en el contenido proporcionado.
REGLAS ESTRICTAS DE SALIDA:
1. Responde ÚNICAMENTE con un objeto JSON válido.
2. NO incluyas introducciones, explicaciones, ni bloques de código markdown (como \`\`\`json).
3. Si no hay contenido suficiente, crea preguntas generales sobre el tema mencionado.

ESTRUCTURA DEL JSON:
{
  "tituloTest": "Nombre creativo del test",
  "descripcion": "Resumen de lo que evalúa este test",
  "preguntas": [
    {
      "enunciado": "Pregunta clara y desafiante",
      "opciones": ["Opción A", "Opción B", "Opción C", "Opción D"],
      "respuestaCorrecta": "La opción exacta de la lista anterior"
    }
  ],
  "sugerenciaDidactica": "Consejo breve para mejorar en este tema"
}`;
    } else if (agent === 'accesibilidad') {
      systemMessage = `Eres un Especialista en Inclusión Educativa y Accesibilidad (Diseño Universal de Aprendizaje - DUA).
TRANSFORMA el contenido proporcionado al formato solicitado: ${profile || 'Lectura Fácil'}.
REGLAS ESTRICTAS:
1. Responde ÚNICAMENTE con un JSON.
2. El lenguaje debe ser extremadamente claro y adaptado a la necesidad específica.

ESTRUCTURA DEL JSON:
{
  "tituloTransformado": "Título adaptado",
  "bloquesDeTexto": ["Párrafo 1 adaptado", "Párrafo 2 adaptado"],
  "instruccionLectorPantalla": "Instrucción específica para que un lector de pantalla ayude al estudiante a navegar este contenido"
}`;
    } else {
      systemMessage = `Eres un Adaptador de Contenidos Educativos Especializados.
Tu objetivo es simplificar o profundizar el contenido para el perfil: ${profile || 'Estándar'}.
REGLAS ESTRICTAS:
1. Responde SOLO con JSON.
2. Mantén el rigor académico pero ajusta el vocabulario según el perfil.

ESTRUCTURA DEL JSON:
{
  "tituloAdaptado": "Título del material",
  "parrafos": ["Contenido adaptado 1", "Contenido adaptado 2"],
  "consejoEducador": "Breve nota sobre cómo presentar este material al alumno según su perfil"
}`;
    }

    // Mejora en la construcción de mensajes para evitar que la IA se confunda
    const messages = isVision && imageBase64 ? [
      { 
        role: 'user', 
        content: [
          { type: 'text', text: `Analiza el contenido de este documento y realízalo según las instrucciones de tu sistema: ${prompt}` },
          { type: 'image', image: `data:image/jpeg;base64,${imageBase64}` } 
        ] 
      }
    ] : [
      { role: 'user', content: prompt }
    ];

    const { text } = await generateText({
      model: groq(modelToUse),
      system: systemMessage,
      messages,
      temperature: 0.1,
      // @ts-ignore - Forzar formato JSON en Groq
      response_format: { type: 'json_object' },
    });

    return Response.json({ result: text });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
