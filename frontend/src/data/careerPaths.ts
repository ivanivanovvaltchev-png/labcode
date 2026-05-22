export interface PathSkill {
    id: string;
    name: string;
    description: string;
    profileKeywords: string[];   // substring match against knowledge profile concepts
    selfAssess: boolean;         // true = user must confirm manually (non-Python skills)
    category: 'python' | 'git' | 'sql' | 'html' | 'css' | 'js' | 'react' | 'django' | 'deploy' | 'soft';
    importance: 'critical' | 'important' | 'bonus';
    masterRef: string;           // ConquerBlocks curriculum reference
    mentorTopic: string;         // what to focus on in Mentor sessions
    order: number;               // curriculum sequence — lower = earlier in the course
}

export interface CareerPath {
    id: string;
    emoji: string;
    title: string;
    jobTitle: string;
    description: string;
    colorClass: string;
    glowHex: string;
    jobExamples: string[];
    salaryRange: string;
    estimatedMonths: string;
    skills: PathSkill[];
}

// ─── PATH 1: Python Developer ─────────────────────────────────────────────────
// Skills ordered exactly as they appear in the ConquerBlocks master curriculum.
// The daily plan will only suggest skills at/near the student's current position.

const pythonDevSkills: PathSkill[] = [
    // ── PREWORK (Temas iniciales) ──────────────────────────────────────────────
    {
        id: 'py-pseudocode', name: 'Pseudocódigo y algoritmia',
        description: 'Pensar la solución antes de escribir código. La base del pensamiento lógico.',
        profileKeywords: ['algoritmo', 'pseudocodigo', 'pseudocódigo', 'pseint', 'mientras', 'para cada'],
        selfAssess: true, category: 'soft', importance: 'critical',
        masterRef: 'Prework Tema 1 — Pseudocódigo', mentorTopic: 'algoritmia y pensamiento lógico con pseudocódigo',
        order: 1,
    },
    {
        id: 'git-basic', name: 'Git y GitHub',
        description: 'Control de versiones. Obligatorio en cualquier empresa.',
        profileKeywords: [],
        selfAssess: true, category: 'git', importance: 'critical',
        masterRef: 'Prework — Git y GitHub', mentorTopic: 'comandos básicos de Git y flujo de trabajo en GitHub',
        order: 2,
    },
    {
        id: 'sql-basic', name: 'SQL básico',
        description: 'SELECT, WHERE, JOIN, GROUP BY. Habitual en entrevistas Python.',
        profileKeywords: [],
        selfAssess: true, category: 'sql', importance: 'important',
        masterRef: 'Prework — SQL', mentorTopic: 'consultas SQL: SELECT, WHERE, JOIN, GROUP BY',
        order: 3,
    },

    // ── PYTHON BÁSICO — Temas 1-3 (✅ COMPLETADO) ─────────────────────────────
    {
        id: 'py-variables', name: 'Variables y tipos de datos',
        description: 'int, float, str, bool, None. Conversión de tipos.',
        profileKeywords: ['variable', 'tipo', 'int', 'float', 'bool', 'none', 'type('],
        selfAssess: false, category: 'python', importance: 'critical',
        masterRef: 'Python Tema 1', mentorTopic: 'variables y tipos de datos en Python',
        order: 4,
    },
    {
        id: 'py-io', name: 'Entrada y salida (input/print)',
        description: 'Leer datos del usuario y mostrar resultados con formato.',
        profileKeywords: ['input(', 'print(', 'f-string', 'fstring', 'format('],
        selfAssess: false, category: 'python', importance: 'critical',
        masterRef: 'Python Tema 1', mentorTopic: 'input(), print() y formateo de strings en Python',
        order: 5,
    },
    {
        id: 'py-operators', name: 'Operadores y expresiones',
        description: 'Operadores aritméticos, de comparación y lógicos.',
        profileKeywords: ['operador', '== ', '!= ', '>= ', '<= ', ' and ', ' or ', ' not ', '% '],
        selfAssess: false, category: 'python', importance: 'critical',
        masterRef: 'Python Tema 1-2', mentorTopic: 'operadores en Python: aritméticos, comparación y lógicos',
        order: 6,
    },
    {
        id: 'py-conditionals', name: 'Condicionales (if/elif/else)',
        description: 'Tomar decisiones en el código según condiciones.',
        profileKeywords: ['if ', 'elif ', 'else:', 'condicional'],
        selfAssess: false, category: 'python', importance: 'critical',
        masterRef: 'Python Tema 2', mentorTopic: 'estructuras condicionales if/elif/else en Python',
        order: 7,
    },
    {
        id: 'py-for', name: 'Bucle for e iteración',
        description: 'Recorrer listas, rangos y cualquier iterable con for.',
        profileKeywords: ['for ', 'range(', 'enumerate(', 'in range', 'for i in', 'for elemento'],
        selfAssess: false, category: 'python', importance: 'critical',
        masterRef: 'Python Tema 3', mentorTopic: 'bucle for, range() e iteración en Python',
        order: 8,
    },
    {
        id: 'py-while', name: 'Bucle while y estructuras iterativas',
        description: 'Repetir mientras se cumpla una condición. break y continue.',
        profileKeywords: ['while ', 'break', 'continue', 'bucle while', 'while True'],
        selfAssess: false, category: 'python', importance: 'critical',
        masterRef: 'Python Tema 3', mentorTopic: 'bucle while, break, continue en Python',
        order: 9,
    },
    {
        id: 'py-lists', name: 'Listas',
        description: 'Colecciones ordenadas y mutables. El tipo de dato más usado en Python.',
        profileKeywords: ['lista', 'list', '.append(', '.extend(', '.pop(', '.insert(', '.remove(', 'len(', '.sort(', '.index('],
        selfAssess: false, category: 'python', importance: 'critical',
        masterRef: 'Python Tema 3 ✅ COMPLETADO', mentorTopic: 'listas en Python: creación, acceso, slicing y métodos',
        order: 10,
    },

    // ── PYTHON BÁSICO — Tema 4 (🔄 EMPEZANDO AHORA) ────────────────────────────
    {
        id: 'py-arrays-modules', name: 'Arrays y módulos',
        description: 'Importar módulos de la librería estándar. math, random, os, etc.',
        profileKeywords: ['import ', 'from ', 'módulo', 'module', 'math.', 'random.', 'os.'],
        selfAssess: false, category: 'python', importance: 'critical',
        masterRef: 'Python Tema 4 — Arrays y Módulos', mentorTopic: 'módulos en Python: import, from, librería estándar',
        order: 11,
    },

    // ── PYTHON BÁSICO — Tema 5 ─────────────────────────────────────────────────
    {
        id: 'py-tuples', name: 'Tuplas',
        description: 'Colecciones ordenadas e inmutables. Cuándo usar tuplas vs listas.',
        profileKeywords: ['tupla', 'tuple(', ') = (', 'tuple ='],
        selfAssess: false, category: 'python', importance: 'important',
        masterRef: 'Python Tema 5 — Tuplas y Sets', mentorTopic: 'tuplas en Python: cuándo y cómo usarlas',
        order: 12,
    },
    {
        id: 'py-sets', name: 'Conjuntos (set)',
        description: 'Colecciones sin duplicados. Operaciones de conjuntos.',
        profileKeywords: ['conjunto', 'set(', '.add(', '.union(', '.intersection(', '.difference('],
        selfAssess: false, category: 'python', importance: 'important',
        masterRef: 'Python Tema 5 — Tuplas y Sets', mentorTopic: 'sets en Python: operaciones y casos de uso',
        order: 13,
    },

    // ── PYTHON BÁSICO — Tema 6 ─────────────────────────────────────────────────
    {
        id: 'py-dicts', name: 'Diccionarios',
        description: 'Pares clave-valor. El tipo de dato más importante en proyectos reales.',
        profileKeywords: ['diccionario', 'dict', '.keys()', '.values()', '.items()', '.get(', 'dict('],
        selfAssess: false, category: 'python', importance: 'critical',
        masterRef: 'Python Tema 6 — Diccionarios', mentorTopic: 'diccionarios en Python: creación, acceso, métodos e iteración',
        order: 14,
    },

    // ── PYTHON AVANZADO — Tema 1 ───────────────────────────────────────────────
    {
        id: 'py-functions', name: 'Funciones (def, parámetros, return)',
        description: 'Definir funciones reutilizables. Parámetros, retorno y scope.',
        profileKeywords: ['def ', 'return ', 'parámetro', 'argumento', 'función', 'funcion'],
        selfAssess: false, category: 'python', importance: 'critical',
        masterRef: 'Avanzado Tema 1 — Funciones', mentorTopic: 'funciones en Python: def, parámetros, return y scope',
        order: 15,
    },
    {
        id: 'py-lambda', name: 'Lambda, map, filter y decoradores',
        description: 'Funciones de orden superior y programación funcional.',
        profileKeywords: ['lambda', 'map(', 'filter(', 'decorator', 'decorador', '@'],
        selfAssess: false, category: 'python', importance: 'important',
        masterRef: 'Avanzado Tema 1 — Lambda y Decoradores', mentorTopic: 'funciones lambda, map, filter y decoradores en Python',
        order: 16,
    },
    {
        id: 'py-recursion', name: 'Recursividad y memoización',
        description: 'Funciones que se llaman a sí mismas. Optimización con memoización.',
        profileKeywords: ['recursiv', 'memoiz', 'factorial', 'fibonacci'],
        selfAssess: false, category: 'python', importance: 'important',
        masterRef: 'Avanzado Tema 1 — Recursividad', mentorTopic: 'recursividad y memoización en Python',
        order: 17,
    },

    // ── PYTHON AVANZADO — Tema 2 ───────────────────────────────────────────────
    {
        id: 'py-files', name: 'Manejo de archivos',
        description: 'Leer y escribir ficheros. Muy frecuente en proyectos y entrevistas.',
        profileKeywords: ['open(', 'with open', 'read()', 'write(', 'archivo', 'fichero', '.txt', '.csv'],
        selfAssess: false, category: 'python', importance: 'important',
        masterRef: 'Avanzado Tema 2 — Archivos', mentorTopic: 'lectura y escritura de archivos en Python con open()',
        order: 18,
    },
    {
        id: 'py-exceptions', name: 'Excepciones (try/except)',
        description: 'Gestionar errores de forma controlada.',
        profileKeywords: ['try:', 'except', 'except ', 'finally:', 'raise ', 'exception'],
        selfAssess: false, category: 'python', importance: 'critical',
        masterRef: 'Avanzado Tema 2 — Excepciones', mentorTopic: 'manejo de excepciones en Python: try/except/finally/raise',
        order: 19,
    },

    // ── PYTHON AVANZADO — Tema 3 ───────────────────────────────────────────────
    {
        id: 'py-oop', name: 'POO — Clases y objetos',
        description: 'Clases, instancias, atributos, métodos, herencia. Base del código profesional.',
        profileKeywords: ['class ', '__init__', 'self.', 'herencia', 'inheritance', 'super()', 'objeto', 'instancia'],
        selfAssess: false, category: 'python', importance: 'critical',
        masterRef: 'Avanzado Tema 3 — POO', mentorTopic: 'POO en Python: clases, __init__, métodos, herencia y polimorfismo',
        order: 20,
    },

    // ── PYTHON AVANZADO — Tema 4 ───────────────────────────────────────────────
    {
        id: 'py-solid', name: 'Principios SOLID',
        description: 'Código limpio y mantenible. Obligatorio en empresas serias.',
        profileKeywords: ['solid', 'srp', 'responsabilidad única', 'ocp', 'liskov', 'composicion', 'composición'],
        selfAssess: false, category: 'python', importance: 'important',
        masterRef: 'Avanzado Tema 4 — SOLID', mentorTopic: 'principios SOLID en Python con ejemplos prácticos',
        order: 21,
    },

    // ── PYTHON AVANZADO — Tema 5 ───────────────────────────────────────────────
    {
        id: 'py-orm', name: 'ORM y SQLAlchemy',
        description: 'Acceso a bases de datos desde Python sin escribir SQL raw.',
        profileKeywords: ['sqlalchemy', 'session', 'orm', 'Base', 'Column', 'relationship'],
        selfAssess: false, category: 'python', importance: 'important',
        masterRef: 'Avanzado Tema 5 — ORM', mentorTopic: 'ORM con SQLAlchemy: modelos, CRUD y relaciones',
        order: 22,
    },

    // ── STRINGS (se refuerzan a lo largo del curso) ────────────────────────────
    {
        id: 'py-strings', name: 'Manejo de cadenas (strings)',
        description: 'Métodos de string, f-strings, slicing. Muy evaluado en entrevistas.',
        profileKeywords: ['.upper()', '.lower()', '.split()', '.join(', '.strip()', '.replace(', '.find(', 'f"'],
        selfAssess: false, category: 'python', importance: 'critical',
        masterRef: 'Python Temas 1-3 (transversal)', mentorTopic: 'strings en Python: métodos, f-strings y slicing',
        order: 10, // Alongside lists — both covered in Tema 3
    },

    // ── PROFESIONAL (final del camino) ────────────────────────────────────────
    {
        id: 'py-algorithms', name: 'Resolución de algoritmos',
        description: 'Pensar soluciones eficientes. Lo más evaluado en entrevistas técnicas.',
        profileKeywords: ['algoritmo', 'complejidad', 'ordenamiento', 'busqueda', 'búsqueda'],
        selfAssess: true, category: 'soft', importance: 'critical',
        masterRef: 'Práctica continua + Avanzado ejercicios', mentorTopic: 'resolución de algoritmos paso a paso y pensamiento computacional',
        order: 23,
    },
    {
        id: 'interview-prep', name: 'Preparación de entrevista técnica',
        description: 'Preguntas típicas, coding challenges, pair programming.',
        profileKeywords: [],
        selfAssess: true, category: 'soft', importance: 'important',
        masterRef: 'Módulo preparación de entrevistas', mentorTopic: 'preguntas de entrevista técnica Python y cómo resolverlas',
        order: 24,
    },
];

// ─── PATH 2: Frontend Developer ───────────────────────────────────────────────
const frontendDevSkills: PathSkill[] = [
    { id: 'logic-base', name: 'Base de lógica de programación', description: 'Variables, condicionales, bucles.', profileKeywords: ['if ', 'for ', 'while ', 'variable'], selfAssess: false, category: 'python', importance: 'critical', masterRef: 'Python Temas 1-3', mentorTopic: 'lógica de programación básica', order: 1 },
    { id: 'html-basic', name: 'HTML estructural', description: 'Semántica, formularios, tablas, multimedia.', profileKeywords: [], selfAssess: true, category: 'html', importance: 'critical', masterRef: 'HTML - Módulo 8', mentorTopic: 'estructura HTML semántica', order: 2 },
    { id: 'css-basic', name: 'CSS — Estilos y selectores', description: 'Selectores, modelo de caja, tipografía.', profileKeywords: [], selfAssess: true, category: 'css', importance: 'critical', masterRef: 'CSS - Módulo 9', mentorTopic: 'selectores CSS y modelo de caja', order: 3 },
    { id: 'css-layout', name: 'CSS — Flexbox y Grid', description: 'Los dos sistemas de layout modernos.', profileKeywords: [], selfAssess: true, category: 'css', importance: 'critical', masterRef: 'CSS Tema 6', mentorTopic: 'Flexbox y CSS Grid', order: 4 },
    { id: 'css-responsive', name: 'Responsive Design', description: 'Media queries, diseño mobile-first.', profileKeywords: [], selfAssess: true, category: 'css', importance: 'critical', masterRef: 'CSS Tema 8', mentorTopic: 'responsive design y media queries', order: 5 },
    { id: 'js-basic', name: 'JavaScript — Fundamentos', description: 'Variables, funciones, arrays, objetos.', profileKeywords: [], selfAssess: true, category: 'js', importance: 'critical', masterRef: 'JavaScript Temas 1-3', mentorTopic: 'fundamentos JavaScript', order: 6 },
    { id: 'js-dom', name: 'Manipulación del DOM', description: 'Seleccionar y modificar elementos HTML con JS.', profileKeywords: [], selfAssess: true, category: 'js', importance: 'critical', masterRef: 'JavaScript Tema 6', mentorTopic: 'DOM manipulation en JavaScript', order: 7 },
    { id: 'js-events', name: 'Eventos en JavaScript', description: 'Click, input, submit, event listeners.', profileKeywords: [], selfAssess: true, category: 'js', importance: 'critical', masterRef: 'JavaScript Tema 7', mentorTopic: 'eventos JavaScript', order: 8 },
    { id: 'js-async', name: 'Promesas y Fetch', description: 'Llamadas a APIs externas de forma asíncrona.', profileKeywords: [], selfAssess: true, category: 'js', importance: 'critical', masterRef: 'JavaScript Temas 9-10', mentorTopic: 'fetch API y async/await en JavaScript', order: 9 },
    { id: 'react-basic', name: 'React — Componentes y Props', description: 'JSX, componentes funcionales, paso de props.', profileKeywords: [], selfAssess: true, category: 'react', importance: 'critical', masterRef: 'ReactJS Temas 1-2', mentorTopic: 'componentes React y props', order: 10 },
    { id: 'react-hooks', name: 'React — useState y useEffect', description: 'Estado local y efectos secundarios.', profileKeywords: [], selfAssess: true, category: 'react', importance: 'critical', masterRef: 'ReactJS Tema 3', mentorTopic: 'hooks useState y useEffect en React', order: 11 },
    { id: 'git-basic-fe', name: 'Git básico', description: 'Control de versiones. Obligatorio.', profileKeywords: [], selfAssess: true, category: 'git', importance: 'critical', masterRef: 'Git - Módulo 4', mentorTopic: 'Git básico para proyectos frontend', order: 12 },
];

// ─── PATH 3: Full Stack Python/Django ─────────────────────────────────────────
const fullStackSkills: PathSkill[] = [
    ...pythonDevSkills.filter(s => s.importance === 'critical'),
    { id: 'django-basics', name: 'Django — Fundamentos', description: 'Modelos, vistas, URLs, templates.', profileKeywords: [], selfAssess: true, category: 'django', importance: 'critical', masterRef: 'Django Módulo 13', mentorTopic: 'Django básico: modelos, vistas y URLs', order: 25 },
    { id: 'django-forms', name: 'Django — Formularios y CBV', description: 'Forms, class-based views, auth.', profileKeywords: [], selfAssess: true, category: 'django', importance: 'critical', masterRef: 'Django Temas 7-8', mentorTopic: 'formularios Django y vistas basadas en clases', order: 26 },
    { id: 'sql-intermediate', name: 'SQL intermedio', description: 'JOINs, subconsultas, ORM de Django.', profileKeywords: [], selfAssess: true, category: 'sql', importance: 'critical', masterRef: 'SQL Módulo 5', mentorTopic: 'SQL intermedio y ORM Django', order: 27 },
    { id: 'html-css-basic', name: 'HTML y CSS básico', description: 'Para crear templates Django funcionales.', profileKeywords: [], selfAssess: true, category: 'html', importance: 'important', masterRef: 'Módulos 8-9', mentorTopic: 'HTML/CSS básico para templates', order: 28 },
    { id: 'deploy-basic', name: 'Despliegue', description: 'Poner tu app en producción.', profileKeywords: [], selfAssess: true, category: 'deploy', importance: 'important', masterRef: 'Módulo 15', mentorTopic: 'despliegue de aplicaciones Django', order: 29 },
];

// ─── PATH 4: Máster Completo ───────────────────────────────────────────────────
const masterCompleteSkills: PathSkill[] = [
    ...pythonDevSkills,
    ...frontendDevSkills.filter(s => !s.id.startsWith('logic')),
    { id: 'django-full', name: 'Django completo', description: 'Todo el módulo de Django.', profileKeywords: [], selfAssess: true, category: 'django', importance: 'critical', masterRef: 'Django - Módulo 13', mentorTopic: 'Django full stack completo', order: 30 },
    { id: 'deploy-full', name: 'Despliegue completo', description: 'Servidores, dominios, producción.', profileKeywords: [], selfAssess: true, category: 'deploy', importance: 'critical', masterRef: 'Módulo 15', mentorTopic: 'despliegue completo con nginx y dominio', order: 31 },
    { id: 'scrum', name: 'Scrum y metodologías ágiles', description: 'Cómo trabajan los equipos de desarrollo.', profileKeywords: [], selfAssess: true, category: 'soft', importance: 'important', masterRef: 'Módulo 18', mentorTopic: 'Scrum, sprints y trabajo ágil en equipo', order: 32 },
];

export const CAREER_PATHS: CareerPath[] = [
    {
        id: 'python-dev', emoji: '🐍', title: 'Desarrollador Python', jobTitle: 'Python Developer',
        description: 'El camino más directo desde el máster hasta tu primer empleo. Python es el lenguaje más demandado en backend, data y automatización.',
        colorClass: 'yellow', glowHex: 'rgba(234,179,8,0.3)',
        jobExamples: ['Python Backend Developer', 'Python Automation Engineer', 'Junior Python Developer'],
        salaryRange: '22.000 – 35.000 €/año', estimatedMonths: '3 – 5 meses',
        skills: pythonDevSkills,
    },
    {
        id: 'frontend-dev', emoji: '🎨', title: 'Desarrollador Frontend', jobTitle: 'Frontend Developer',
        description: 'HTML, CSS, JavaScript y React. La ruta visual del máster, orientada a construir interfaces y experiencias de usuario.',
        colorClass: 'pink', glowHex: 'rgba(236,72,153,0.3)',
        jobExamples: ['Frontend Developer', 'React Developer', 'UI Engineer'],
        salaryRange: '22.000 – 38.000 €/año', estimatedMonths: '4 – 6 meses',
        skills: frontendDevSkills,
    },
    {
        id: 'fullstack-python', emoji: '🔧', title: 'Full Stack Python/Django', jobTitle: 'Full Stack Python Developer',
        description: 'Python en el backend con Django + frontend básico. El perfil más completo del ecosistema Python.',
        colorClass: 'blue', glowHex: 'rgba(59,130,246,0.3)',
        jobExamples: ['Full Stack Python Developer', 'Django Developer', 'Backend Python'],
        salaryRange: '28.000 – 45.000 €/año', estimatedMonths: '6 – 9 meses',
        skills: fullStackSkills,
    },
    {
        id: 'master-complete', emoji: '🌐', title: 'Full Stack Developer (Máster)', jobTitle: 'Full Stack Developer',
        description: 'Completar el máster entero y convertirte en desarrollador full stack con Python, Django, React y despliegue.',
        colorClass: 'violet', glowHex: 'rgba(139,92,246,0.3)',
        jobExamples: ['Full Stack Developer', 'Software Engineer', 'Web Developer'],
        salaryRange: '32.000 – 55.000 €/año', estimatedMonths: '12 – 18 meses',
        skills: masterCompleteSkills,
    },
];

export function getPathById(id: string): CareerPath | undefined {
    return CAREER_PATHS.find(p => p.id === id);
}

export function isSkillMastered(
    skill: PathSkill,
    profileConcepts: string[],
    selfAssessments: Record<string, boolean>
): boolean {
    if (skill.selfAssess) return selfAssessments[skill.id] === true;
    if (profileConcepts.length === 0) return false;
    return skill.profileKeywords.some(kw =>
        profileConcepts.some(concept => concept.toLowerCase().includes(kw.toLowerCase()))
    );
}

export function calculateProgress(
    path: CareerPath,
    profileConcepts: string[],
    selfAssessments: Record<string, boolean>
): { pct: number; mastered: number; total: number; criticalMastered: number; criticalTotal: number } {
    const critical = path.skills.filter(s => s.importance === 'critical');
    const criticalMastered = critical.filter(s => isSkillMastered(s, profileConcepts, selfAssessments)).length;
    const allMastered = path.skills.filter(s => isSkillMastered(s, profileConcepts, selfAssessments)).length;
    const pct = critical.length > 0 ? Math.round((criticalMastered / critical.length) * 100) : 0;
    return { pct, mastered: allMastered, total: path.skills.length, criticalMastered, criticalTotal: critical.length };
}

/**
 * Returns the skills available to practice right now:
 * all mastered skills + the next 2 in curriculum order.
 * This prevents the daily plan from suggesting topics not yet studied.
 */
export function getAvailableSkills(
    path: CareerPath,
    profileConcepts: string[],
    selfAssessments: Record<string, boolean>
): PathSkill[] {
    const sorted = [...path.skills].sort((a, b) => a.order - b.order);
    const masteredOrders = sorted
        .filter(s => isSkillMastered(s, profileConcepts, selfAssessments))
        .map(s => s.order);

    const maxMasteredOrder = masteredOrders.length > 0 ? Math.max(...masteredOrders) : 0;

    // Include mastered skills + the next 1 topic (the immediate next thing to learn)
    return sorted.filter(s => s.order <= maxMasteredOrder + 1);
}
