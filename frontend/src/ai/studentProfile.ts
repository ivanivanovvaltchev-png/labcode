/**
 * STUDENT KNOWLEDGE PROFILE — Single Source of Truth
 *
 * This file is the ONLY place that defines what the student currently knows.
 * Both the daily plan generator and the daily test generator read exclusively
 * from these constants. The dynamic curriculum-based allowlist is overridden
 * by this hardcoded profile until the student explicitly advances.
 *
 * Update this file manually as new topics are completed and validated.
 * DO NOT add topics that have not been finished and tested in real exercises.
 *
 * "En progreso" (currently being taught, not yet mastered) topics live in
 * `../data/practicePaths.ts` instead — one PracticePath per PDF/clase, each
 * with its own set of real concepts. `masteryEngine.seedFromPracticePaths()`
 * feeds those into the concept registry at low mastery (Slot 2/3), separate
 * from the fully-mastered topics below.
 */

import { LEARNING_BLOCKS } from '../data/practicePaths';

// ─── Temas completados: Básico Python Temas 1–3 ───────────────────────────────

export const TEMAS_COMPLETADOS = [
    'Variables: str, int, float, bool',
    'Operaciones aritméticas: +, -, *, /, //, %, **',
    'Condicionales: if, elif, else',
    'Listas: crear, acceder por índice, modificar, slicing, len()',
    'Métodos de lista: append(), remove(), pop(), sort(), reverse()',
    'Bucle for con range() e iteración sobre listas',
    'Bucle while con condiciones y break/continue',
    'input() y print() con f-strings',
] as const;

// ─── Tema 4 validado: Introducción a NumPy Arrays ────────────────────────────
// Only the specific micro-skills confirmed in the student's real .py files.

export const NUMPY_VALIDADO = [
    'import numpy as np',
    'np.zeros(n) — array de ceros unidimensional',
    'np.ones(n) — array de unos unidimensional',
    'np.arange(start, stop, step) — secuencias numéricas',
    'Bucle for para iterar sobre un array numpy (sumas acumulativas)',
    'np.sum(array) — suma total de elementos',
    'array.copy() — clonar un array sin referencias',
    'array[::-1] — inversión de array con slicing',
    'np.intersect1d(a, b) — elementos comunes entre dos arrays',
] as const;

// ─── Lista completa de lo que la IA puede tocar ───────────────────────────────

// "En progreso" concepts (tuplas, sets, variables/tipos avanzado) are included
// here too so the AI knowledge-block fallback (when no PDF raw text is loaded)
// still knows the student is actively learning them — see practicePaths.ts.
const EN_PROGRESO: string[] = LEARNING_BLOCKS.flatMap(p =>
    p.concepts.map(c => `${c.name}: ${c.description}`)
);

export const HABILIDADES_PERMITIDAS: string[] = [
    ...TEMAS_COMPLETADOS,
    ...NUMPY_VALIDADO,
    ...EN_PROGRESO,
];

// ─── Conceptos absolutamente prohibidos ──────────────────────────────────────
// If any of these appear in AI output, the response is rejected and retried.
//
// NOTE: 'tupla'/'tuple('/'set(' were removed from this list — the student is
// now actively studying tuples and sets (see practicePaths.ts), so they are
// no longer forbidden content. Diccionarios/funciones/clases/excepciones etc.
// remain forbidden until a PDF introduces them.

export const CONCEPTOS_PROHIBIDOS: string[] = [
    'def ',
    ' def',
    'return ',
    ' return',
    'parámetros',
    'parametros',
    'argumentos',
    'función',
    'funcion',
    'funciones',
    'function',
    'sql',
    'select ',
    'where ',
    'join ',
    'base de datos',
    'bases de datos',
    'pseudocódigo',
    'pseudocodigo',
    'git ',
    'github',
    '.split()',
    'split(',
    'diccionario',
    'dict(',
    '.keys()',
    '.values()',
    '.items()',
    'class ',
    'lambda',
    'try:',
    'except',
    'raise ',
    'open(',
    'with open',
    '__init__',
    'self.',
    'orm',
    'sqlalchemy',
];

// ─── Estructura fija del test diario ─────────────────────────────────────────
// The 3 questions are always assigned to these exact topic slots.
// This prevents the AI from choosing topics freely.

export const TEST_SLOTS = [
    {
        slot: 1,
        tema: 'Bucles for/while y Listas en Python',
        instruccion: 'Una pregunta de opción múltiple sobre bucles (for/while) o listas (append, slicing, len, sort). No mencionar funciones def ni return.',
    },
    {
        slot: 2,
        tema: 'Condicionales en Python (if/elif/else)',
        instruccion: 'Una pregunta de opción múltiple sobre condicionales if/elif/else y expresiones booleanas. No mencionar funciones def ni return.',
    },
    {
        slot: 3,
        tema: 'NumPy Arrays — introducción (Tema 4)',
        instruccion: 'Una pregunta de opción múltiple sobre np.zeros(), np.ones(), np.arange(), array.copy(), np.sum(), array[::-1] o np.intersect1d(). No mencionar nada fuera de estos métodos.',
    },
] as const;
