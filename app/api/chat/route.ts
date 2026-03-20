import { generateText } from 'ai';
import { groq } from '@ai-sdk/groq';
const pdfParseLib = require('pdf-parse');
const pdfParse = pdfParseLib.default || pdfParseLib;
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const agent = body.agent || body.tipo || 'adaptador';
    const prompt = body.prompt;
    const profile = body.profile;
    const imageBase64 = body.imageBase64;
    const isVision = body.isVision;
    const isPdf = body.isPdf;
    const pdfBase64 = body.pdfBase64;

    let finalPrompt = prompt || '';

    if (isPdf && pdfBase64) {
      try {
        const pdfBuffer = Buffer.from(pdfBase64, 'base64');
        const pdfData = await pdfParse(pdfBuffer);
        finalPrompt = pdfData.text;
      } catch (err) {
        return Response.json({ error: 'Failed to extract text from PDF: ' + String(err) }, { status: 400 });
      }
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'GROQ_API_KEY no configurada' }, { status: 500 });
    }

    let modelToUse = 'llama-3.3-70b-versatile';
    if (isVision && imageBase64) {
      modelToUse = 'llama-3.2-11b-vision-preview';
    }

    let systemMessage = '';

    if (agent === 'evaluador') {
      systemMessage = `Eres un Arquitecto de Evaluación Educativa Senior y Experto en Psicometría Clínica, especializado en la Taxonomía de Bloom y el Diseño de Items de Selección Múltiple de alta fidelidad.

Tu misión es desglosar el contenido fuente y transformarlo en un ecosistema de evaluación que no solo mida el recuerdo, sino la comprensión profunda y la capacidad de síntesis.

### ESTRUCTURA DE NIVELES (CRÍTICA):
Debes generar un set equilibrado de preguntas que cubra los siguientes niveles:
1. **FÁCIL**: Reconocimiento y memoria.
2. **MEDIO**: Comprensión y aplicación.
3. **DIFÍCIL**: Análisis, evaluación y síntesis.

### REGLAS DE ORO PARA EL DISEÑO DE ITEMS:
- **Distractores Plausibles**: Las opciones incorrectas NO deben ser absurdas; deben basarse en errores conceptuales o malas interpretaciones comunes del tema.
- **Justificaciones Pedagógicas**: La justificación no debe decir "A es correcta porque sí"; debe explicar el PORQUÉ y, si es posible, por qué las otras son incorrectas.
- **Claridad**: Usa enunciados directos, evita las dobles negaciones y evita preguntas tipo "Todas las anteriores".
- **Flashcards**: Concepto técnico -> Definición clara y atómica.

REGLAS DE FORMATO:
1. Responde ÚNICAMENTE con el objeto JSON. Sin explicaciones ni bloques de código.
2. NO uses emojis en los enunciados.
3. Genera un array llamado "preguntas" con un total de 15-20 ítems mezclando los niveles anteriores.

ESTRUCTURA DE SALIDA REQUERIDA:
{
  "titulo": "Título de Élite del Examen",
  "descripcion": "Descripción del objetivo pedagógico",
  "preguntas": [
    {
      "pregunta": "Enunciado de la pregunta",
      "opciones": ["Opción A", "Opción B", "Opción C", "Opción D"],
      "respuestaCorrecta": "Texto exacto de la opción correcta",
      "justificacion": "Explicación breve",
      "dificultad": "FÁCIL | MEDIA | DIFÍCIL"
    }
  ],
  "flashcards": [{"concepto", "definicion"}]
}`;

    } else {
      // Adaptador Neuro-Inclusivo Masterpiece
      const profilesMap: Record<string, string> = {
        tdah: `PERFIL: Alumno con TDAH (Enfoque en Foco Dinámico y Segmentación Visual).
ESTRATEGIA PEDAGÓGICA:
- **La Regla de los 3 Segundos**: El usuario debe captar el punto clave de cada bloque en 3 segundos o menos.
- **Estructura Atómica**: Divide el contenido original en bloques muy pequeños (máximo 4 frases).
- **Marcado Visual Agresivo**: Usa negritas estratégicas para resaltar la "Columna Vertebral" del texto (conceptos y verbos de acción).
- **Checkpoints de Foco**: Al final de cada bloque, incluye un reto mental corto (ej: "Visualiza esto en tu mente 5 segundos").
- **Tono**: Enérgico, directo, motivador. Usa listas de viñetas en lugar de párrafos densos.`,

        autismo: `PERFIL: Alumno con TEA (Enfoque en Literalidad, Predictibilidad y Estructura Sintáctica).
ESTRATEGIA PEDAGÓGICA:
- **Cero Ambigüedad**: Elimina toda metáfora, ironía, doble sentido o lenguaje figurado. Usa un lenguaje descriptivo y funcional.
- **Cadena Lógica**: Cada frase debe derivar lógica y directamente de la anterior. Usa conectores de secuencia (Primero, Luego, Entonces).
- **Densidad Controlada**: Una sola idea por frase. Evita oraciones subordinadas complejas.
- **Glosario de Abstracción**: Si hay un término abstracto, defínelo inmediatamente de forma funcional.
- **Guía Visual de Pictogramas**: Define conceptos que necesiten apoyo visual inmediato.`,

        altas: `PERFIL: Alumno con Altas Capacidades (Enfoque en Enriquecimiento Vertical y Pensamiento Divergente).
ESTRATEGIA PEDAGÓGICA:
- **Desafío Léxico**: No simplifiques el vocabulario; elévalo. Usa terminología precisa y técnica.
- **Conexión Interdisciplinar**: Relaciona el concepto actual con otras áreas del saber (ciencia, arte, historia) de forma orgánica.
- **Gancho Socrático**: Termina cada bloque con una pregunta que invite a la reflexión profunda o a cuestionar el "status quo".
- **Complejidad, no Volumen**: No des más trabajo, da un trabajo más profundo. Busca la abstracción y la síntesis.
- **Tono**: Riguroso, exigente y estimulante.`,

        base: `PERFIL: Estándar / Apoyo DUA (Enfoque en Accesibilidad Universal y Andamiaje).
ESTRATEGIA PEDAGÓGICA:
- **Anclaje en la Realidad**: Empieza cada sección con una analogía del mundo cotidiano que el alumno ya conozca.
- **Carga Cognitiva Reducida**: Mantén el núcleo del contenido original pero elimina el ruido innecesario.
- **Pasos Graduados**: Organiza la información de lo más sencillo a lo más complejo.
- **Resúmenes Ejecutivos**: Cada bloque debe terminar con una "Idea Fuerza" principal en una sola frase.`,
      };

      const profileKey = (profile || 'base').toLowerCase().replace(/\s/g, '');
      const profileInstruction = profilesMap[profileKey] || profilesMap['base'];

      systemMessage = `Eres un Especialista de Élite en Neuroeducación y Diseño Universal para el Aprendizaje (DUA).

### ESTRATEGIA PARA EL PERFIL: ${profile || 'Base'}
${profileInstruction}

REGLAS DE FORMATO:
1. Responde EXCLUSIVAMENTE con el objeto JSON.
2. "bloques": Es un array obligatorio. Cada bloque debe tener "subtitulo" y "contenido".
3. "friccion": 0-100.
4. "pictogramas": Array de 2-4 palabras.

ESTRUCTURA JSON REQUERIDA:
{
  "perfil": "${profile || 'Base'}",
  "tituloAdaptado": "Título de la Adaptación",
  "bloques": [
    { 
      "subtitulo": "Nombre del segmento", 
      "contenido": "Texto adaptado siguiendo la estrategia del perfil", 
      "friccion": 50, 
      "pictogramas": ["palabra1", "palabra2"] 
    }
  ],
  "estrategiasDocente": ["Estrategia 1", "Estrategia 2", "Estrategia 3"],
  "recursosExtra": "Sugerencia de recurso adicional",
  "nivelCargaCognitiva": "BAJA | MEDIA | ALTA"
}`;
    }

    const jsonEnforcer = '\n\nCRITICAL: Output ONLY the raw JSON object. No markdown, no code blocks, no explanations. Start with { and end with }.';

    const messages: Array<{ role: 'user' | 'assistant'; content: any }> = isVision && imageBase64 ? [
      {
        role: 'user',
        content: [
          { type: 'text', text: `Analiza este documento y genera el JSON según las instrucciones: ${finalPrompt}${jsonEnforcer}` },
          { type: 'image', image: `data:image/jpeg;base64,${imageBase64}` }
        ]
      }
    ] : [
      { role: 'user', content: finalPrompt + jsonEnforcer }
    ];

    const { text } = await generateText({
      model: groq(modelToUse),
      system: systemMessage,
      messages,
      temperature: 0.45,
      // @ts-ignore
      response_format: { type: 'json_object' },
    });


    return Response.json({ result: text });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
