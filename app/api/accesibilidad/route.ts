import { generateText } from 'ai';
import { groq } from '@ai-sdk/groq';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { prompt, format, imageBase64, isVision, systemPrompt } = await req.json();

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'GROQ_API_KEY no configurada' }, { status: 500 });
    }

    let modelToUse = 'llama-3.1-8b-instant';
    
    if (isVision && imageBase64) {
      modelToUse = 'llama-3.2-11b-vision-preview';
    }

    const accesibilidadSystemPrompt = systemPrompt || `Eres el subagente de ACCESIBILIDAD UNIVERSAL de ThotAI. Tu objetivo es convertir el texto ingresado en un formato altamente inclusivo según la selección del usuario.
    Formato solicitado: ${format || 'Lectura Fácil (IFLA)'}
    
    REGLAS DE SALIDA OBLIGATORIAS:
    1. ESTRICTAMENTE PROHIBIDO usar Markdown en cualquier campo (ni asteriscos, hashtags o símbolos). Todo debe ser texto plano utilizable directamente en componentes de interfaz gráfica nativa.
    2. Tu respuesta debe ser un objeto JSON puro con esta estructura:
    {
      "tituloTransformado": "Título del contenido",
      "bloquesDeTexto": ["Primer bloque o descripción", "Segundo bloque..."],
      "instruccionLectorPantalla": "Breve indicación técnica para el software de accesibilidad (ej: cómo leer este texto)"
    }`;

    const messages: any[] = [];

    if (isVision && imageBase64) {
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: `Analiza este documento PDF y transforma el contenido al formato ${format || 'Lectura Fácil (IFLA)'}. ${accesibilidadSystemPrompt}` },
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
      system: accesibilidadSystemPrompt,
      messages,
      temperature: 0.2,
    });

    return Response.json({ result: text });
  } catch (error) {
    console.error('Error en API Accesibilidad:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return Response.json(
      { error: 'Error al procesar la solicitud', details: errorMessage },
      { status: 500 }
    );
  }
}
