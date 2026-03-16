# ThotAI Backend - Instrucciones de Despliegue

## ¿Es gratis?

**SÍ, 100% gratis:**
- **Groq**: Plan gratuito con límites muy generosos (30 RPM, 14k tokens/min)
- **Vercel**: Plan Hobby gratuito (100k peticiones/mes)

---

## Modelos disponibles

| Modelo | Uso | Tipo |
|--------|-----|------|
| `llama-3.1-8b-instant` | Texto | Rápido |
| `llama-3.2-11b-vision-preview` | PDFs e Imágenes | Visión |

---

## Paso 1: Subir a GitHub

1. Crea un repo en [github.com](https://github.com) llamado `thotai-backend`
2. En terminal:
```bash
cd thotai-backend
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/thotai-backend.git
git push -u origin main
```

## Paso 2: Conectar a Vercel

1. Ve a [vercel.com](https://vercel.com) → New Project
2. Importa el repo `thotai-backend`
3. En Environment Variables añade:
   - **Name**: `GROQ_API_KEY`
   - **Value**: `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`
4. Deploy

## Paso 3: Actualizar URL en la App

1. Abre `ThotAI/src/services/api.ts`
2. Cambia `thotai-backend` por tu URL real de Vercel

## Funcionalidades implementadas

- ✓ Análisis de PDFs con Groq Vision
- ✓ Texto escrito/pegado
- ✓ Perfiles cognitivos
- ✓ Generación de PDF de resultado
- ✓ Todo gratis
