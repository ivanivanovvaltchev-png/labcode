import React from 'react';

// ─── Tokenizer ────────────────────────────────────────────────────────────────

type TokenType = 'keyword' | 'builtin' | 'string' | 'comment' | 'number' | 'operator' | 'bracket' | 'identifier' | 'space';

interface Token { type: TokenType; text: string; }

const KEYWORDS = new Set([
    'for', 'while', 'if', 'elif', 'else', 'in', 'not', 'and', 'or',
    'import', 'as', 'from', 'break', 'continue', 'True', 'False', 'None', 'pass',
]);

const BUILTINS = new Set([
    'print', 'input', 'int', 'str', 'float', 'bool', 'len', 'range',
    'list', 'type', 'abs', 'max', 'min', 'sum', 'sorted', 'enumerate',
    'zip', 'append', 'remove', 'pop', 'sort', 'reverse', 'copy', 'np',
]);

const PATTERNS: { re: RegExp; type: TokenType }[] = [
    { re: /^#[^\n]*/, type: 'comment' },
    { re: /^(?:f|b|r|rb|br)?(?:"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/, type: 'string' },
    { re: /^\b\d+\.?\d*\b/, type: 'number' },
    { re: /^[+\-*/%=<>!&|^~,.:;@]+/, type: 'operator' },
    { re: /^[\[\]{}()]/, type: 'bracket' },
    { re: /^[a-zA-Z_]\w*/, type: 'identifier' },
    { re: /^\s+/, type: 'space' },
    { re: /^./, type: 'operator' },
];

function tokenize(code: string): Token[] {
    const tokens: Token[] = [];
    let remaining = code;

    while (remaining.length > 0) {
        let matched = false;
        for (const { re, type } of PATTERNS) {
            const m = remaining.match(re);
            if (m) {
                let finalType = type;
                if (type === 'identifier') {
                    if (KEYWORDS.has(m[0])) finalType = 'keyword';
                    else if (BUILTINS.has(m[0])) finalType = 'builtin';
                }
                tokens.push({ type: finalType, text: m[0] });
                remaining = remaining.slice(m[0].length);
                matched = true;
                break;
            }
        }
        if (!matched) { tokens.push({ type: 'operator', text: remaining[0] }); remaining = remaining.slice(1); }
    }

    return tokens;
}

const TOKEN_COLORS: Record<TokenType, string> = {
    keyword:    '#c586c0',
    builtin:    '#4ec9b0',
    string:     '#ce9178',
    comment:    '#6a9955',
    number:     '#b5cea8',
    operator:   '#d4d4d4',
    bracket:    '#ffd700',
    identifier: '#9cdcfe',
    space:      'inherit',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Detects whether a line looks like Python code rather than prose.
 * Avoids matching lines that start with a capital Spanish letter (prose).
 */
function looksLikePython(line: string): boolean {
    const t = line.trim();
    if (!t || /^[A-ZÁÉÍÓÚ¿¡"]/.test(t)) return false;
    return /^(for |while |if |elif |else:|import |from |print\(|input\(|np\.|#|\w[\w.]*\s*[=([\]])/.test(t);
}

/**
 * Splits a question string into a prose part and an optional code part.
 * Requires actual newlines in the text (AI must format code with \\n).
 */
export function splitQuestionCode(text: string): { prose: string; code: string | null } {
    const lines = text.split('\n');
    if (lines.length <= 1) return { prose: text, code: null };

    for (let i = 0; i < lines.length; i++) {
        if (looksLikePython(lines[i])) {
            const prose = lines.slice(0, i).join('\n').trim();
            const code  = lines.slice(i).join('\n').trim();
            return { prose: prose || text, code };
        }
    }
    return { prose: text, code: null };
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props { code: string; }

const PythonCodeBlock: React.FC<Props> = ({ code }) => {
    const tokens = tokenize(code);

    return (
        <div className="rounded-xl overflow-hidden my-3 border border-white/10">
            {/* Title bar */}
            <div className="flex items-center gap-1.5 px-4 py-2 bg-[#1e1e1e] border-b border-white/10">
                <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
                <span className="w-3 h-3 rounded-full bg-[#28c840]" />
                <span className="ml-3 text-xs text-white/30 font-mono">python</span>
            </div>
            {/* Code */}
            <pre className="bg-[#1e1e1e] px-5 py-4 overflow-x-auto text-sm leading-relaxed font-mono">
                <code>
                    {tokens.map((tok, i) => (
                        tok.type === 'space'
                            ? <span key={i}>{tok.text}</span>
                            : <span key={i} style={{ color: TOKEN_COLORS[tok.type] }}>{tok.text}</span>
                    ))}
                </code>
            </pre>
        </div>
    );
};

export default PythonCodeBlock;
