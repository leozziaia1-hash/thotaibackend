import { generateText } from 'ai';
import { groq } from '@ai-sdk/groq';
// @ts-ignore
import PDFParser from 'pdf2json';
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
    const difficulty = (body.difficulty || 'MEDIO').toUpperCase();

    let finalPrompt = prompt || '';

    if (isPdf && pdfBase64) {
      try {
        const pdfBuffer = Buffer.from(pdfBase64, 'base64');
        // @ts-ignore
        const pdfParser = new PDFParser(null, 1);
        finalPrompt = await new Promise<string>((resolve, reject) => {
          pdfParser.on("pdfParser_dataError", (errData: any) => reject(errData.parserError));
          pdfParser.on("pdfParser_dataReady", () => resolve(pdfParser.getRawTextContent()));
          // @ts-ignore
          pdfParser.parseBuffer(pdfBuffer);
        });
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
      const difficultyDesc = difficulty === 'FÁCIL'
        ? 'Evalúa retención de memoria semántica y conceptos base. Las opciones falsas deben ser términos hermanos o conceptos relacionados pero incorrectos.'
        : difficulty === 'DIFÍCIL'
        ? 'Evalúa el pensamiento crítico de segundo orden, análisis y síntesis. Exige discriminar entre distinciones vitales. Dos opciones deben parecer correctas, pero una es técnicamente superior.'
        : 'Plantea micro-escenarios resolutivos o casos prácticos donde la teoría debe ser aplicada en el mundo real. Evalúa comprensión y aplicación.';

      systemMessage = `Eres un Arquitecto de Evaluación Educativa Senior y Psicómetra Clínico de Élite.
Tu misión exclusiva es diseñar un Ecosistema de Evaluación de Alta Fidelidad centrado ÚNICAMENTE en el nivel de dificultad: ${difficulty}.

INSTRUCCIONES CLÍNICAS DE EVALUACIÓN Y PSICOMETRÍA:
1. FOCO EN DIFICULTAD ${difficulty} (ESTRICTO):
   ${difficultyDesc}

2. INGENIERÍA DE DISTRACTORES:
   - NUNCA uses "Ninguna de las anteriores", "Todas las anteriores" o "A y B son correctas".
   - Todo distractor debe representar un sesgo cognitivo común o un error frecuente de los estudiantes.
   - Las opciones deben tener longitudes sintácticas y estilos similares.

3. JUSTIFICACIONES PEDAGÓGICAS PROFUNDAS:
   - Explica el MECANISMO RACIONAL profundo de por qué la respuesta es correcta y por qué las trampas más tentadoras representaban falacias de entendimiento.

REGLAS DE FORMATO:
1. Responde EXCLUSIVAMENTE con el objeto JSON. Sin backticks de markdown.
2. Genera un array llamado "preguntas" con EXACTAMENTE 20 ítems de dificultad ${difficulty}.
3. "respuestaCorrecta" DEBE ser el ÍNDICE numérico (0, 1, 2 o 3) de la opción correcta dentro del array "opciones". NO devuelvas texto, solo el número.

ESTRUCTURA EXACTA DE SALIDA REQUERIDA:
{
  "titulo": "Título de Élite (${difficulty})",
  "descripcion": "Objetivo psicométrico para el nivel ${difficulty}",
  "preguntas": [
    {
      "pregunta": "Enunciado de la pregunta",
      "opciones": ["Opción A", "Opción B", "Opción C", "Opción D"],
      "respuestaCorrecta": 0,
      "justificacion": "Explicación profunda de la lógica",
      "dificultad": "${difficulty}"
    }
  ]
}`;

    } else {
      // Adaptador Neuro-Inclusivo Masterpiece
      const profilesMap: Record<string, string> = {
        tdah: `PERFIL CLÍNICO: TDAH (Disfunción Ejecutiva, Fatiga Atencional, Necesidad Extrema de Gratificación Rápida y Foco Dinámico).
ESTRATEGIA NEURO-PEDAGÓGICA (STRICT RULES):
- "Chunking" Atómico: Rompe el texto fuente sin piedad. Un bloque = Una sola revelación importante. NUNCA uses más de 3-4 líneas seguidas.
- Aceleración Sintáctica: Elimina introducciones aburridas ("la paja"). Ve directo al concepto explosivo ("el jugo").
- Ganchos Dopaminérgicos: Inicia los bloques con frases cortas, de alto impacto e imperativas (Ej: "La clave es esta:", "Ojo aquí:", "Observa este patrón:", "El secreto de X:").
- Tono: Altamente conversacional, enérgico, inmersivo, empático. Habla como un mentor carismático.
- Estímulo Visual Táctico: Usa siempre viñetas en lugar de párrafos densos.
- Interrupción del Patrón Bucle: Al final de cada bloque clave, inyecta un micro-reto de imaginación rápida de 3 segundos para reiniciar la atención del lector.`,

        autismo: `PERFIL CLÍNICO: TEA / Nivel Diagnóstico 1-2 (Procesamiento Literal, Hipersensibilidad al "Ruido" Semántico, Necesidad de Previsibilidad Paramétrica).
ESTRATEGIA NEURO-PEDAGÓGICA (STRICT RULES):
- Cero Ambigüedad Semántica y Figurativa: PROHIBIDO usar metáforas abstractas, ironías, sarcasmos, frases hechas o verbos confusos. Trata todo concepto de forma brutalmente literal. En lugar de decir "El corazón es el motor", di "El corazón actúa como una bomba muscular".
- Cadena Lógica Perfecta (A -> B -> C): Las explicaciones deben seguir el formato lógico algorítmico inquebrantable. Cada causa explícita debe ser seguida de su efecto explícito. No asumas conocimiento tácito intermedio.
- Reducción Activa de Abstracción: Si tienes que usar un término abstracto nuevo, defínelo inmediatamente en la misma frase usando referencias tangibles y puramente funcionales.
- Tono: Brutalmente claro, hiper-estructurado, seguro, académico pero totalmente accesible. Como un manual de instrucciones exacto.
- Transiciones Explícitas Seguras: Cada bloque debe tener un propósito hiper-definido que le anuncie paso a paso al alumno exactamente qué viene después, dándole seguridad predictiva extrema.`,

        altas: `PERFIL CLÍNICO: Altas Capacidades (AACC / Superdotación Cognitiva, Hambre Epistémica, Velocidad de Procesamiento Ultra-Rápida, Aburrimiento Crónico por Sub-Estimulación).
ESTRATEGIA NEURO-PEDAGÓGICA (STRICT RULES):
- Enriquecimiento Vertical: NO simplifiques ni abogues el texto; transfórmalo en un absoluto reto intelectual equivalente a material de post-grado de alta gama. Usa jerga técnica avanzada, neologismos científicos modernos y conceptos universitarios tangenciales.
- Intersección de Disciplinas (Conexión Divergente): Para saciar su pensamiento lateral, relaciona orgánicamente el concepto principal con otras esferas del conocimiento (ej. une biología con filosofía, o historia con física cuántica si es lógico).
- Andamiaje Socrático y Metacognición: No proveas respuestas "masticadas". Finaliza bloques importantes con "Preguntas Retóricas" densas que cuestionen la ética, la moral o la futura metodología del concepto. Haz que duden, que piensen a macro escala.
- Tarea Profunda y Ruptura Científica: Evita el resumen obvio; exígeles una síntesis disruptiva en sus pensamientos. Trátalos como un analista o investigador colega nivel dios.
- Tono: Intelectual, provocador, sumamente riguroso y analítico.`,

        base: `PERFIL CLÍNICO: Estándar (Implementando Diseño Universal para el Aprendizaje - DUA, Accesibilidad Cognitiva Máxima, Reducción de Ansiedad).
ESTRATEGIA NEURO-PEDAGÓGICA (STRICT RULES):
- Analogías de la Vida Real (Anclaje Empírico): Todo concepto abstracto, técnico o denso de la instrucción debe anclarse primero a una metáfora vivencial del mundo tangible que cualquier persona experimente a diario, para aterrizar la teoría.
- Pirámide Invertida de Complejidad: Inicia el bloque entregando siempre la conclusión lógica más importante y masticable primero, y solo entonces desgrana los componentes técnicos y analíticos paso a paso.
- Reducción de Ruido y Fricción: Purga la información de arrogancia académica, pero mantén absolutamente todo el rigor técnico y la profundidad científica original intactos.
- Formato Amigable: Usa espacios limpios, viñetas amigables y una estructura que invite a leer sin sentirse abrumado.
- Tono: Expositivo, paciente, extremadamente claro, motivador y guiador. Transmite siempre la sensación inquebrantable de que el alumno es perfectamente capaz de asimilar esta materia compleja.`,
      };

      const profileKey = (profile || 'base').toLowerCase().replace(/\s/g, '');
      const profileInstruction = profilesMap[profileKey] || profilesMap['base'];

      systemMessage = `Eres un Especialista de Élite Mundial en Neuroeducación Clínica, Experto Diamante en DUA (Diseño Universal para el Aprendizaje) y Modificación Estructural de Carga Cognitiva Intrínseca.
Tu objetivo sagrado es absorber el material técnico fuente y adaptarlo quirúrgicamente para un perfil neurodivergente específico, maximizando drásticamente su retención a largo plazo, minimizando la fricción dopaminérgica y estructurando todo el conocimiento basándote estrictamente en avances clínicos reales respaldados por la neurociencia del aprendizaje.

### ESTRATEGIA CLÍNICA ACTIVADA PARA EL PERFIL: ${profile || 'Base'}
${profileInstruction}

REGLAS ESTRUCTURALES Y DE FORMATO:
1. Responde EXCLUSIVAMENTE con el objeto JSON puro y válido. Sin bloques de markdown.
2. "bloques": Es un array obligatorio en el JSON. Divide todo el contenido adaptado utilizando viñetas y saltos de línea donde se requiera mediante \\n dentro del "contenido". Cada bloque debe tener su propio "subtitulo" atractivo.
3. "friccion": Un número exacto de 0 a 100 que indique la dificultad atencional que el alumno podría sufrir en ese bloque, evaluada según su perfil neurocognitivo.
4. "pictogramas": Sugiere visualmente 2 o 4 iconos, símbolos lógicos o palabras visuales extremadamente atómicas y funcionales que un UI podría renderizar como ancla visual para el núcleo de ese bloque. (Ejemplo: ["Reloj de arena", "Flecha hacia arriba"]).

ESTRUCTURA DE SALIDA JSON EXACTA (STRICT):
{
  "perfil": "${profile || 'Base'}",
  "tituloAdaptado": "Título Maestro Atrapante de la Adaptación",
  "bloques": [
    { 
      "subtitulo": "Nombre seductor y descriptivo del segmento", 
      "contenido": "Texto adaptado al detalle utilizando las reglas estrictas de la neuro-estrategia indicada. Separado lógicamente con \\n en caso de viñetas.", 
      "friccion": 50, 
      "pictogramas": ["símbolo visual 1", "símbolo visual 2"] 
    }
  ],
  "estrategiasDocente": ["Estrategia de andamiaje 1", "Sugerencia metodológica 2", "Regulación emocional 3"],
  "recursosExtra": "Sugerencia directa de un material multimedia o actividad sensorial para complementar el tema",
  "nivelCargaCognitiva": "BAJA | MEDIA | ALTA"
}`;
    }

    const jsonEnforcer = '\n\nCRITICAL SYSTEM OVERRIDE: YOU MUST OUTPUT ONLY A RAW JSON OBJECT. DO NOT INCLUDE MARKDOWN FORMATTING LIKE ```json. START YOUR OUTPUT WITH { AND END IT WITH }. NO EXPLANATIONS. NO ADDITIONAL TEXT.';

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
