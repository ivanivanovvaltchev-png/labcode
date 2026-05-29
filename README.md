# 🧪 LabCode — Motor de Aprendizaje Adaptativo e Inteligencia Educativa

[![Vercel Deployment](https://img.shields.io/badge/Deploy-Vercel-black?style=flat-square&logo=vercel)](https://labcode-kappa.vercel.app)
[![AI-Powered](https://img.shields.io/badge/AI--Engine-DeepSeek--Chat-blue?style=flat-square)](https://deepseek.com)
[![Stack](https://img.shields.io/badge/Stack-React%20%7C%20TypeScript%20%7C%20Vite-purple?style=flat-square)]()
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)]()

LabCode es un motor de aprendizaje adaptativo conceptualizado y dirigido por **Iván Ivanov Valtchev** (alumno del Máster), con código e infraestructura desarrollados íntegramente por **Claude Code** bajo una metodología de Product Management impulsada por IA.

Su propósito absoluto no es seguir un temario genérico, sino acelerar la **empleabilidad real** del alumno mediante un bucle continuo de análisis cognitivo, personalizando el ritmo de estudio y mitigando por completo el estancamiento o la frustración.

> **Demo en producción:** [labcode-kappa.vercel.app](https://labcode-kappa.vercel.app)

---

## 🔄 El Bucle de Inteligencia Continuo (Core del Sistema)

El software no trabaja con prompts estáticos; opera como un sistema vivo basado en cuatro fases automatizadas:

1. **Ingesta y Análisis de Evidencias:** El alumno entrena subiendo sus PDFs oficiales de teoría de la clase del Máster y sus scripts reales de código (`.py` o `.ipynb`). El sistema procesa los archivos y extrae la sintaxis y lógica exacta que el usuario domina o está estudiando.
2. **Diagnóstico Automatizado:** A través de un check-in diario (estado de energía y objetivos) y mini-test de diagnóstico de opción múltiple, el motor detecta lagunas conceptuales antes de que se conviertan en un bloqueo real.
3. **Entrenamiento Quirúrgico (Matriz de Eisenhower):** Los fallos detectados se clasifican en una matriz de prioridad. El Cuadrante I (Urgente + Importante) captura los errores de lógica actuales y fuerza a la IA a generar retos de consola específicos para machacar esa debilidad, antes de permitir al alumno avanzar.
4. **Reevaluación Dinámica:** Al resolver los retos correctamente, el perfil del alumno se recalibra en tiempo real, desbloqueando de forma orgánica el acceso a las siguientes temáticas del mapa.

---

## 🧠 Motor de Progresión Adaptativa — 3 Slots Dinámicos

El sistema más relevante arquitectónicamente es el **Motor de Mastery** (`masteryEngine.ts`), que sustituye cualquier currículo fijo por un plan que evoluciona en tiempo real según el dominio demostrado por el alumno.

Cada concepto del alumno se clasifica en uno de tres slots según su `masteryPct`:

| Slot | Umbral | Tipo de tarjeta | Tipo de pregunta en test |
|------|--------|-----------------|--------------------------|
| **Slot 1 — Repaso** | mastery ≥ 70% | 🔄 Repetición espaciada | Dificultad alta |
| **Slot 2 — Práctica** | mastery 35–69% | 💪 Práctica deliberada | Dificultad media |
| **Slot 3 — Aprender** | mastery < 35% | 🌱 Introducción guiada | Dificultad básica |

### Flujo de progresión real — del PDF de clase a la consolidación

```
PASO 1 — Alumno sube el PDF de la clase de hoy
        │
        ▼  extractTextFromPDF() — extrae texto bruto
        ▼  analyzeConceptsFromPDF(pdfText, alreadyKnown)
           → IA detecta solo los conceptos NUEVOS respecto al perfil actual
           → Ejemplo: "Diccionarios: crear con dict() y acceder por clave"
        ▼  addConceptsFromPDF() — registra el concepto con mastery 0%
        ▼  UI muestra: "🧠 1 concepto nuevo detectado en el PDF"

PASO 2 — getDynamicSlots() reclasifica el estado completo del alumno
        ┌────────────────────┬──────────────────────┬───────────────────────────┐
        │  SLOT 1 (Repaso)   │  SLOT 2 (Práctica)   │  SLOT 3 (Aprender) ←NUEVO │
        │  Bucles · Listas   │  NumPy Arrays        │  Diccionarios · dict()    │
        │  mastery 78%       │  mastery 50%         │  mastery 0%               │
        └────────────────────┴──────────────────────┴───────────────────────────┘

PASO 3 — generateDailyPlan() construye las 3 tarjetas del día
        Tarjeta 1 → "Repaso — Bucle for + Listas" (escenario nuevo cada día)
        Tarjeta 2 → "Práctica — NumPy Arrays" (ejercicio de nivel medio)
        Tarjeta 3 → "Aprender — Diccionarios: dict()" (introducción guiada)

        generateDailyTest() genera las 3 preguntas del test alineadas con los slots:
        Pregunta 1 → Slot 1 · dificultad alta · concepto consolidado
        Pregunta 2 → Slot 2 · dificultad media · concepto en práctica
        Pregunta 3 → Slot 3 · dificultad básica · concepto recién introducido

PASO 4 — Alumno trabaja la Tarjeta 3 con el Mentor de IA
        Sesión 1 (ejercicio base):        mastery Diccionarios  0% → 15%
        Sesión 2 (variante — inventario): mastery Diccionarios 15% → 30%
        Sesión 3 (variante — agenda):     mastery Diccionarios 30% → 45%
                                                          ↓
                              cruza umbral 35% → SLOT 3 → SLOT 2

PASO 5 — Plan del día siguiente recalibrado automáticamente
        Tarjeta 2 → "Práctica — Diccionarios" (ejercicio más exigente)
        Tarjeta 3 → siguiente concepto nuevo del PDF ("Métodos: .keys(), .values()")

PASO 6 — Con más práctica, Diccionarios cruza 70% → SLOT 1
        → Tarjeta 1 incorpora Diccionarios como repaso espaciado
        → Dominio mantenido a largo plazo sin intervención manual
```

### Reglas de ordenación dentro de cada slot

- **Slot 1**: ordenado por `lastPracticed` ascendente → el concepto más "olvidado" aparece primero (spaced repetition clásico).
- **Slot 2**: ordenado por `lastPracticed` descendente → el concepto más activo se practica primero.
- **Slot 3**: ordenado por `addedAt` descendente → el concepto más recientemente introducido desde el PDF aparece primero.

---

## 🔒 Arquitectura de Seguridad: State-Driven Prompting

Para mitigar las alucinaciones de los modelos de lenguaje y evitar que la IA introduzca conceptos avanzados del futuro (como funciones, POO o bases de datos si el alumno se encuentra en fases iniciales), LabCode implementa dos capas de contención:

### 1. Inyección basada en Estado

Cada petición a la API de DeepSeek se construye concatenando un array vivo de `habilidades_validadas` guardado en el perfil del usuario:

```typescript
// El prompt viaja al rol 'system' parametrizado estrictamente por el estado actual
"Solo puedes incluir conceptos de esta lista de habilidades validadas: ${user.habilidades_validadas.join(', ')}"
```

### 2. Filtro de Post-Generación con Lista Negra

Antes de que cualquier respuesta de la IA llegue al alumno, pasa por un guardián de texto:

```typescript
// CONCEPTOS_PROHIBIDOS actúa como cortafuegos léxico
const questionPassesGuard = (q: TestQuestion): boolean => {
    const text = [q.question, q.options.A, q.options.B, q.options.C, q.explanation].join(' ').toLowerCase();
    return !CONCEPTOS_PROHIBIDOS.some(term => text.includes(term.toLowerCase()));
};
```

Si una respuesta contiene `def`, `return`, `class`, `lambda`, `diccionarios`, `SQL` u otros conceptos fuera del nivel del alumno, es descartada silenciosamente antes de renderizarse. La IA nunca puede saltarse el perímetro pedagógico, ni siquiera por error.

---

## ✨ Características Principales

### 🎯 Plan de Entrenamiento Diario Dinámico
- 3 tarjetas generadas por IA desde los slots reales de mastery del alumno
- Cada tarjeta corresponde a un nivel pedagógico distinto: repaso, práctica y aprendizaje nuevo
- Los títulos y contenidos reflejan el concepto real, no etiquetas genéricas
- El plan persiste entre sesiones y sobrevive a cierres de pestaña y recargas

### 🧪 Test Diario de Active Recall
- 3 preguntas de opción múltiple (A/B/C) alineadas con los 3 slots del alumno
- Cada acierto suma mastery al concepto correspondiente; cada fallo lo penaliza levemente
- Los resultados alimentan la Matriz de Eisenhower que prioriza el estudio del día siguiente
- `skillRef` tageado dinámicamente al concepto real del slot para trazabilidad exacta

### 🤖 Mentor Socrático con IA
- Modo `init`: presenta el problema sin resolver nada
- Modo `chat`: responde dudas sin revelar la solución directa
- Detecta `[EJERCICIO_COMPLETADO]` en la respuesta y dispara `recordMentorSession()` → +15% mastery
- Soporte para **variantes** del mismo ejercicio: el alumno puede pedir un escenario distinto para el mismo concepto — cada variante cuenta como sesión adicional
- Las sesiones se guardan en `completedSessions` y se sincronizan con Supabase

### 📘 Detector de Conceptos Nuevos desde PDF
- `analyzeConceptsFromPDF(pdfText, alreadyKnown)` llama a DeepSeek con la lista de conceptos ya conocidos
- Extrae hasta 8 nuevos conceptos Python del material de clase, sin duplicar los ya registrados
- Cada concepto detectado entra en el registro con `mastery 0%` y se asigna automáticamente al Slot 3
- La UI notifica con badge: `"🧠 N conceptos nuevos detectados en el PDF"`

### 🔍 Análisis de Código del Alumno
- El alumno sube sus propios `.py`, `.ipynb` o `.txt` de práctica
- `knowledgeAnalyzer.ts` usa IA para inferir qué conceptos domina realmente, no lo que dice dominar
- El perfil detectado alimenta `seedMasteryFromProfile()`, que inicializa los niveles base del motor

### 📊 Matriz de Eisenhower Educativa
Clasifica cada skill en cuatro cuadrantes en tiempo real tras cada test:
- **Q1 Urgente + Importante**: fallos recientes en conceptos base → actúa hoy
- **Q2 Importante + No Urgente**: siguiente paso del temario → programa para mañana
- **Q3 Urgente + No Importante**: conceptos dominados sin repasar en 3+ días → revisión rápida
- **Q4 No Urgente + No Importante**: temas avanzados fuera del nivel actual → pospón

### 📈 Árbol de Habilidades y Gap Analysis
- Visualización del `masteryPct` de cada skill con barras de progreso
- Gap Analysis comparando el nivel actual del alumno con los requisitos del puesto objetivo
- Actividad semanal con histograma de sesiones y skills trabajados

### ☁️ Sincronización Cloud con Supabase
- Todo el progreso del alumno (plan diario, historial de tests, sesiones de mentor, mastery, path seleccionado) se sincroniza en Supabase en cada cambio relevante
- `pushToCloud()` / `pullFromCloud()` con lógica de merge inteligente: los datos más recientes ganan
- Persistencia cross-device: el alumno puede continuar desde cualquier navegador

### 🗺️ Caminos de Carrera (Career Paths)
- **Python Junior Fast-Track**: enfocado en empleabilidad backend rápida — Python + SQL + Git. Contenido de frontend bloqueado por el State-Driven Prompting.
- **Full-Stack Developer**: recorrido completo del Máster — Python → Frontend (HTML/CSS/JS/React) → Django → Despliegue.

---

## 🏗️ Arquitectura Técnica

```
frontend/
├── src/
│   ├── ai/
│   │   ├── agents.ts              # Mentor socrático, evaluación, variantes, chat
│   │   ├── diagnosticAgent.ts     # Plan diario, test, diagnóstico inicial, feedback maestro
│   │   ├── knowledgeAnalyzer.ts   # Análisis de código del alumno para detectar habilidades
│   │   ├── pdfConceptAnalyzer.ts  # Extracción de conceptos nuevos desde PDF con IA
│   │   ├── progressiveAgent.ts    # Agente para ejercicios multi-día progresivos
│   │   └── studentProfile.ts      # CONCEPTOS_PROHIBIDOS, HABILIDADES_PERMITIDAS, TEST_SLOTS (fallback)
│   │
│   ├── lib/
│   │   ├── masteryEngine.ts       # ★ Motor de progresión: ConceptRegistry, getDynamicSlots()
│   │   ├── learningMetrics.ts     # SkillMastery, DailyMetric, recordMentorSession, getActiveSkills
│   │   ├── dailyTest.ts           # TestSession, EisenhowerMatrix, calculateMatrix, recordTestResult
│   │   ├── knowledgeProfile.ts    # KnowledgeProfile — perfil inferido del código del alumno
│   │   ├── theoryContext.ts       # TheoryContext — texto de PDFs de teoría para los prompts
│   │   ├── cloudSync.ts           # pushToCloud / pullFromCloud con Supabase
│   │   ├── userProgress.ts        # DailyPlan, DailyTask, saveDailyPlan, completeTask
│   │   ├── completedSessions.ts   # Historial de sesiones completadas con el Mentor
│   │   ├── pdfExtractor.ts        # extractTextFromPDF con pdf.js
│   │   └── selectedPath.ts        # loadSelectedPath, saveSelfAssessments
│   │
│   ├── components/
│   │   ├── modules/
│   │   │   ├── PathDashboard.tsx  # Dashboard principal — plan diario + skills + test prompt
│   │   │   ├── MentorPage.tsx     # Mentor socrático — chat, variantes, detección de completado
│   │   │   ├── DailyTestPage.tsx  # Test diario — check-in, preguntas, Matriz de Eisenhower
│   │   │   ├── KnowledgePage.tsx  # Perfil de aprendizaje — upload de código y PDFs
│   │   │   └── AIPracticePage.tsx # Práctica libre con IA por módulo
│   │   ├── layout/
│   │   │   ├── Dashboard.tsx      # Shell principal con auth y sync
│   │   │   ├── Navigation.tsx     # Barra de navegación
│   │   │   └── PathSelector.tsx   # Selector de camino de carrera
│   │   └── onboarding/
│   │       └── OnboardingFlow.tsx # Diagnóstico inicial del alumno
│   │
│   └── data/
│       └── careerPaths.ts         # Definición de skills, orden curricular, importancia, selfAssess
```

### Flujo de datos por acción clave

| Acción del alumno | Cadena de llamadas | Resultado |
|-------------------|--------------------|-----------|
| Sube PDF de clase | `extractTextFromPDF → analyzeConceptsFromPDF → addConceptsFromPDF` | Concepto en Slot 3 con mastery 0% |
| Completa ejercicio con Mentor | `recordMentorSession → ensureConceptTracked` | +15% mastery al concepto trabajado |
| Pide variante de ejercicio | `callDeepSeekForMentorVariant → recordMentorSession` | +15% mastery adicional |
| Genera plan diario | `seedConceptRegistry → getDynamicSlots → generateDailyPlan` | 3 tarjetas desde mastery real |
| Hace el test diario | `seedConceptRegistry → getDynamicSlots → generateDailyTest` | 3 preguntas por slot |
| Envía respuestas del test | `recordTestResult → calculateMatrix → saveTodayTest` | Mastery actualizado + Eisenhower |
| Marca tarea como hecha | `completeTask → recordPractice → ensureConceptTracked` | +10% mastery + sync cloud |

---

## 🚀 Setup Local

```bash
# 1. Clona el repositorio
git clone https://github.com/ivanivanovvaltchev-png/labcode.git
cd labcode/frontend

# 2. Instala dependencias
npm install

# 3. Configura las variables de entorno
cp .env.example .env
# Edita .env con tus claves:
# VITE_DEEPSEEK_API_KEY=sk-...
# VITE_SUPABASE_URL=https://xxx.supabase.co
# VITE_SUPABASE_ANON_KEY=eyJ...

# 4. Arranca el servidor de desarrollo
npm run dev
```

---

## 🗄️ Supabase — Tabla de datos de usuario

Ejecuta en Supabase → SQL Editor:

```sql
create table public.user_data (
  user_id uuid references auth.users(id) on delete cascade primary key,
  progress jsonb default '{}',
  selected_path text,
  self_assessments jsonb default '{}',
  knowledge_profile jsonb,
  completed_sessions jsonb default '[]',
  updated_at timestamptz default now()
);

alter table public.user_data enable row level security;

create policy "Users manage own data"
  on public.user_data for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

---

## 🌐 Deploy en Vercel

1. Sube el repo a GitHub
2. Entra en [vercel.com](https://vercel.com) → New Project → importa el repo
3. **Root Directory:** `frontend`
4. **Framework:** Vite (detección automática)
5. Añade las variables de entorno (`VITE_DEEPSEEK_API_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
6. Deploy

Después del primer deploy, añade la URL de Vercel en:
- Supabase → Authentication → URL Configuration → **Site URL**
- Supabase → Authentication → URL Configuration → **Redirect URLs**

---

## 🔑 Google OAuth (Opcional)

1. Supabase Dashboard → Authentication → Providers → Google → Enable
2. Crea credenciales OAuth en [Google Console](https://console.cloud.google.com/)
3. Añade el Client ID y Secret en Supabase
4. En Google Console → Authorized redirect URIs añade:
   `https://[tu-proyecto].supabase.co/auth/v1/callback`

---

## 📦 Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Estilos | Tailwind CSS |
| Auth & DB | Supabase (email/password + Google OAuth) |
| IA | DeepSeek Chat API (`deepseek-chat`) |
| PDF | pdf.js (`pdfjs-dist`) |
| Deploy | Vercel |
| State | localStorage + Supabase cloud sync |

---

## 🛡️ Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `VITE_DEEPSEEK_API_KEY` | Clave de API de DeepSeek (obligatoria) |
| `VITE_SUPABASE_URL` | URL del proyecto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clave anon pública de Supabase |

---

## 👤 Autoría

**Conceptualizado y dirigido por:** Iván Ivanov Valtchev — Alumno del Máster Full Stack de ConquerBlocks.  
**Desarrollo técnico y generación de código:** Claude Code (Anthropic).

Este proyecto nace como una demostración real de cómo un estudiante puede apalancarse en las tecnologías de Inteligencia Artificial Generativa para estructurar, diseñar y desplegar herramientas de producción que complementan el proceso de aprendizaje del Máster.

- 📧 ivanivanovvaltchev@gmail.com
- 🌐 [labcode-kappa.vercel.app](https://labcode-kappa.vercel.app)
- 💻 [github.com/ivanivanovvaltchev-png/labcode](https://github.com/ivanivanovvaltchev-png/labcode)
