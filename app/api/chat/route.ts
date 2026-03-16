import { generateText } from 'ai';
import { groq } from '@ai-sdk/groq';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { prompt, profile, systemPrompt, imageBase64, isVision } = await req.json();

    let modelToUse = 'llama-3.1-8b-instant';
    
    if (isVision && imageBase64) {
      modelToUse = 'llama-3.2-11b-vision-preview';
    }

    const messages: any[] = [];

    if (isVision && imageBase64) {
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: prompt || `Analiza este documento y extrae el texto para adaptar al perfil ${profile}. Luego adapta el contenido.` },
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
      system: systemPrompt || `Eres el subagente ADAPTADOR de ThotAI. Tu objetivo es procesar el texto educativo ingresado y adaptarlo estrictamente al perfil cognitivo y nivel educativo indicado.\n\nPerfil Actual: ${profile}.\n\nREGLAS ESTRICTAS:\n1. NO debes usar formato Markdown crudo (ni #, ni *, ni -). Nada.\n2. Tu respuesta DEBE ser un objeto JSON válido con la siguiente estructura exacta:\n{\n  "tituloAdaptado": "Un título adecuado al perfil",\n  "parrafos": ["Párrafo adaptado 1", "Párrafo adaptado 2..."],\n  "consejoEducador": "Breve recomendación metodológica para el profesor"\n}\n3. Asegúrate de que el JSON sea perfectamente parseable por JSON.parse().`,
      messages,
      temperature: 0.2,
    });

    return Response.json({ result: text });
  } catch (error) {
    console.error('Error en API Groq:', error);
    return Response.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}
