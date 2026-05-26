import * as pdfjsLib from 'pdfjs-dist';

// Vite resolves this URL at build time — no worker config needed in vite.config.ts
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url
).href;

/**
 * Extracts all readable text from a PDF File object.
 * Returns a clean string with consecutive whitespace collapsed.
 */
export async function extractTextFromPDF(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    const pageTexts: string[] = [];
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const content = await page.getTextContent();
        const pageText = content.items
            .map((item) => ('str' in item ? item.str : ''))
            .join(' ');
        pageTexts.push(pageText);
    }

    return pageTexts
        .join('\n')
        .replace(/\s{3,}/g, '  ')   // collapse excessive whitespace
        .replace(/\n{3,}/g, '\n\n') // collapse excessive newlines
        .trim();
}
