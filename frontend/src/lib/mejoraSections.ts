/**
 * MEJORA SECTIONS — unifica los caminos curados (practicePaths.ts) con
 * cualquier PDF que el usuario haya subido en "Mi Perfil" y que Claude aún
 * no haya revisado/curado a mano.
 *
 * REGLA CLAVE: cada PDF es SIEMPRE su propia sección aislada. Nunca se
 * concatenan varios PDFs en un mismo bloque de texto — eso es justo lo que
 * hacía `theoryContext.getContextForPrompt()` (juntar todos los PDFs
 * subidos en un solo blob) y por qué el modo Mejora se sentía "mezclado".
 * Aquí cada PDF, curado o no, mantiene su propio rawText y su propia
 * identidad en la lista de secciones.
 */

import { PRACTICE_PATHS, PracticeConcept } from '../data/practicePaths';
import { loadTheoryContexts } from './theoryContext';

export interface MejoraSection {
    id: string;
    sourceFile: string;
    title: string;
    emoji: string;
    description: string;
    concepts: PracticeConcept[];
    rawText: string;
    /** true = Claude ha leído el PDF y ha desglosado sus conceptos reales a mano. */
    curated: boolean;
}

/**
 * Devuelve todas las secciones de Mejora: primero las curadas por Claude
 * (practicePaths.ts), luego una sección independiente por cada PDF subido
 * en "Mi Perfil" que todavía no tenga curación propia (comparando por
 * nombre de archivo). Ninguna sección mezcla contenido de más de un PDF.
 */
export function getAllMejoraSections(): MejoraSection[] {
    const curated: MejoraSection[] = PRACTICE_PATHS.map(p => ({
        id: p.id,
        sourceFile: p.sourceFile,
        title: p.title,
        emoji: p.emoji,
        description: p.description,
        concepts: p.concepts,
        rawText: p.rawText,
        curated: true,
    }));

    const curatedFiles = new Set(curated.map(c => c.sourceFile));
    const uncurated: MejoraSection[] = loadTheoryContexts()
        .filter(ctx => !curatedFiles.has(ctx.fileName))
        .map(ctx => {
            const title = ctx.fileName.replace(/\.pdf$/i, '');
            return {
                id: `pdf:${ctx.fileName}`,
                sourceFile: ctx.fileName,
                title,
                emoji: '📄',
                description: `PDF subido en Mi Perfil (${ctx.charCount.toLocaleString()} caracteres). Todavía no ha sido revisado en detalle — el mentor trabaja directamente con el texto extraído del PDF.`,
                concepts: [{
                    id: `pdf-concept:${ctx.fileName}`,
                    name: title,
                    description: 'Contenido completo de este PDF, aún sin desglosar en conceptos individuales.',
                    order: 1,
                }],
                rawText: ctx.rawText,
                curated: false,
            };
        });

    return [...curated, ...uncurated];
}

export function getMejoraSectionById(id: string): MejoraSection | undefined {
    return getAllMejoraSections().find(s => s.id === id);
}
