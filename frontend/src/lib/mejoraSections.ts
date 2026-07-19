/**
 * MEJORA SECTIONS — unifica los bloques pedagógicos curados
 * (LEARNING_BLOCKS en practicePaths.ts) con cualquier PDF que el usuario
 * haya subido en "Mi Perfil" y que Claude aún no haya revisado/asignado a
 * un bloque.
 *
 * REGLA CLAVE: un bloque puede combinar varios PDFs (cuando pertenecen al
 * mismo tema pedagógico), pero nunca mezcla temas distintos. Cada PDF sin
 * revisar aparece como su propia sección aislada hasta que Claude decida a
 * qué bloque pertenece (o cree uno nuevo para él).
 */

import { LEARNING_BLOCKS, PracticeConcept } from '../data/practicePaths';
import { loadTheoryContexts } from './theoryContext';

export interface MejoraSection {
    id: string;
    title: string;
    emoji: string;
    description: string;
    /** Por qué estos PDFs están agrupados juntos (vacío si aún no revisado). */
    reason: string;
    /** Ids de otras MejoraSection que conviene completar antes. */
    prerequisites: string[];
    concepts: PracticeConcept[];
    /** Uno o más PDFs que componen esta sección. */
    sources: { fileName: string; rawText: string }[];
    /** true = Claude ha leído los PDFs y los ha organizado en un bloque pedagógico. */
    curated: boolean;
}

/**
 * Devuelve todas las secciones de Mejora: primero los bloques curados por
 * Claude (practicePaths.ts), luego una sección independiente por cada PDF
 * subido en "Mi Perfil" que todavía no pertenezca a ningún bloque
 * (comparando por nombre de archivo contra todas las `sources` de cada
 * bloque). Ninguna sección mezcla contenido de bloques distintos.
 */
export function getAllMejoraSections(): MejoraSection[] {
    const curated: MejoraSection[] = LEARNING_BLOCKS.map(block => ({
        id: block.id,
        title: block.title,
        emoji: block.emoji,
        description: block.description,
        reason: block.reason,
        prerequisites: block.prerequisites,
        concepts: block.concepts,
        sources: block.sources,
        curated: true,
    }));

    const assignedFiles = new Set(curated.flatMap(c => c.sources.map(s => s.fileName)));
    const uncurated: MejoraSection[] = loadTheoryContexts()
        .filter(ctx => !assignedFiles.has(ctx.fileName))
        .map(ctx => {
            const title = ctx.fileName.replace(/\.pdf$/i, '');
            return {
                id: `pdf:${ctx.fileName}`,
                title,
                emoji: '📄',
                description: `PDF subido en Mi Perfil (${ctx.charCount.toLocaleString()} caracteres). Todavía no ha sido asignado a un bloque pedagógico — el mentor trabaja directamente con el texto extraído del PDF.`,
                reason: 'Aún sin revisar por Claude.',
                prerequisites: [],
                concepts: [{
                    id: `pdf-concept:${ctx.fileName}`,
                    name: title,
                    description: 'Contenido completo de este PDF, aún sin desglosar en conceptos individuales.',
                    order: 1,
                }],
                sources: [{ fileName: ctx.fileName, rawText: ctx.rawText }],
                curated: false,
            };
        });

    return [...curated, ...uncurated];
}

export function getMejoraSectionById(id: string): MejoraSection | undefined {
    return getAllMejoraSections().find(s => s.id === id);
}
