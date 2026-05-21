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
}

export interface CareerPath {
    id: string;
    emoji: string;
    title: string;
    jobTitle: string;            // exact job title to search on LinkedIn
    description: string;
    colorClass: string;          // tailwind color prefix (e.g. 'yellow')
    glowHex: string;
    jobExamples: string[];
    salaryRange: string;
    estimatedMonths: string;
    skills: PathSkill[];
}

// ─── PATH 1: Python Developer ─────────────────────────────────────────────────
const pythonDevSkills: PathSkill[] = [
    // ── Python core (auto-detect from profile) ──
    {
        id: 'py-variables', name: 'Variables y tipos de datos',
        description: 'int, float, str, bool, None. Base de todo.',
        profileKeywords: ['variables y tipos', 'tipos básicos'],
        selfAssess: false, category: 'python', importance: 'critical',
        masterRef: 'Python Tema 1', mentorTopic: 'variables, tipos de datos y conversiones en Python',
    },
    {
        id: 'py-io', name: 'Entrada y salida (input/print)',
        description: 'Leer datos del usuario y mostrar resultados.',
        profileKeywords: ['entrada de datos', 'salida por pantalla'],
        selfAssess: false, category: 'python', importance: 'critical',
        masterRef: 'Python Tema 1', mentorTopic: 'input(), print() y formateo de strings en Python',
    },
    {
        id: 'py-operators', name: 'Operadores y expresiones',
        description: 'Aritméticos, comparación, lógicos.',
        profileKeywords: ['operadores aritm', 'operadores de comp'],
        selfAssess: false, category: 'python', importance: 'critical',
        masterRef: 'Python Tema 1', mentorTopic: 'operadores aritméticos, de comparación y lógicos en Python',
    },
    {
        id: 'py-conditionals', name: 'Condicionales (if/elif/else)',
        description: 'Tomar decisiones en el código.',
        profileKeywords: ['condicional'],
        selfAssess: false, category: 'python', importance: 'critical',
        masterRef: 'Python Tema 2', mentorTopic: 'estructuras condicionales if/elif/else en Python',
    },
    {
        id: 'py-for', name: 'Bucle for e iteración',
        description: 'Recorrer listas, rangos y cualquier iterable.',
        profileKeywords: ['bucle for'],
        selfAssess: false, category: 'python', importance: 'critical',
        masterRef: 'Python Tema 3', mentorTopic: 'bucle for, range() e iteración en Python',
    },
    {
        id: 'py-while', name: 'Bucle while',
        description: 'Repetir mientras se cumpla una condición.',
        profileKeywords: ['bucle while'],
        selfAssess: false, category: 'python', importance: 'critical',
        masterRef: 'Python Tema 3', mentorTopic: 'bucle while y control de flujo en Python',
    },
    {
        id: 'py-lists', name: 'Listas',
        description: 'Colecciones ordenadas y mutables.',
        profileKeywords: ['listas'],
        selfAssess: false, category: 'python', importance: 'critical',
        masterRef: 'Python Tema 3', mentorTopic: 'listas en Python: creación, acceso, métodos, slicing',
    },
    {
        id: 'py-tuples', name: 'Tuplas',
        description: 'Colecciones ordenadas e inmutables.',
        profileKeywords: ['tuplas'],
        selfAssess: false, category: 'python', importance: 'important',
        masterRef: 'Python Tema 5', mentorTopic: 'tuplas en Python y cuándo usarlas vs listas',
    },
    {
        id: 'py-sets', name: 'Conjuntos (set)',
        description: 'Colecciones sin duplicados.',
        profileKeywords: ['conjuntos'],
        selfAssess: false, category: 'python', importance: 'important',
        masterRef: 'Python Tema 5', mentorTopic: 'sets en Python: operaciones de conjuntos y casos de uso',
    },
    {
        id: 'py-dicts', name: 'Diccionarios',
        description: 'Pares clave-valor. Esencial en todo proyecto real.',
        profileKeywords: ['diccionarios'],
        selfAssess: false, category: 'python', importance: 'critical',
        masterRef: 'Python Tema 6', mentorTopic: 'diccionarios en Python: creación, acceso, métodos, iteración',
    },
    {
        id: 'py-functions', name: 'Funciones y modularidad',
        description: 'Definir, llamar, parámetros, retorno, scope.',
        profileKeywords: ['funciones (def)', 'parámetros y retorno'],
        selfAssess: false, category: 'python', importance: 'critical',
        masterRef: 'Python Avanzado Tema 1', mentorTopic: 'funciones en Python: def, parámetros, return, scope',
    },
    {
        id: 'py-strings', name: 'Manejo de cadenas',
        description: 'Métodos de string, formateo, f-strings.',
        profileKeywords: ['manejo de cadenas'],
        selfAssess: false, category: 'python', importance: 'critical',
        masterRef: 'Python Tema 1', mentorTopic: 'strings en Python: métodos, f-strings, slicing',
    },
    {
        id: 'py-modules', name: 'Módulos e imports',
        description: 'Usar módulos de la librería estándar y externos.',
        profileKeywords: ['módulos e imports'],
        selfAssess: false, category: 'python', importance: 'important',
        masterRef: 'Python Tema 4', mentorTopic: 'módulos en Python: import, from, librería estándar',
    },
    {
        id: 'py-exceptions', name: 'Excepciones (try/except)',
        description: 'Gestionar errores de forma controlada.',
        profileKeywords: ['excepciones'],
        selfAssess: false, category: 'python', importance: 'critical',
        masterRef: 'Python Avanzado Tema 2', mentorTopic: 'manejo de excepciones en Python: try/except/finally',
    },
    {
        id: 'py-files', name: 'Manejo de archivos',
        description: 'Leer y escribir ficheros. Muy frecuente en entrevistas.',
        profileKeywords: ['manejo de archivos'],
        selfAssess: false, category: 'python', importance: 'important',
        masterRef: 'Python Avanzado Tema 2', mentorTopic: 'lectura y escritura de archivos en Python con open()',
    },
    {
        id: 'py-oop', name: 'POO — Clases y objetos',
        description: 'Clases, instancias, atributos, métodos, herencia.',
        profileKeywords: ['programación orientada', 'clases'],
        selfAssess: false, category: 'python', importance: 'critical',
        masterRef: 'Python Avanzado Tema 3', mentorTopic: 'POO en Python: clases, __init__, métodos, herencia',
    },
    {
        id: 'py-comprehensions', name: 'Comprensiones de lista',
        description: 'Código pythónico y conciso.',
        profileKeywords: ['comprensiones'],
        selfAssess: false, category: 'python', importance: 'important',
        masterRef: 'Python Avanzado', mentorTopic: 'list comprehensions y dict comprehensions en Python',
    },
    // ── Transversal (self-assess) ──
    {
        id: 'git-basic', name: 'Git básico',
        description: 'init, add, commit, push, pull, branches. Obligatorio en cualquier empresa.',
        profileKeywords: [],
        selfAssess: true, category: 'git', importance: 'critical',
        masterRef: 'Git y Github - Módulo 4', mentorTopic: 'comandos básicos de Git y flujo de trabajo',
    },
    {
        id: 'sql-basic', name: 'SQL básico',
        description: 'SELECT, WHERE, JOIN, GROUP BY. Muy habitual en entrevistas Python.',
        profileKeywords: [],
        selfAssess: true, category: 'sql', importance: 'important',
        masterRef: 'SQL - Módulo 5', mentorTopic: 'consultas SQL básicas: SELECT, WHERE, JOIN, GROUP BY',
    },
    {
        id: 'algo-problem', name: 'Resolución de algoritmos',
        description: 'Pensar soluciones eficientes. Lo más evaluado en entrevistas técnicas.',
        profileKeywords: [],
        selfAssess: true, category: 'soft', importance: 'critical',
        masterRef: 'Práctica continua con Mentor', mentorTopic: 'algoritmos, complejidad y resolución de problemas paso a paso',
    },
    {
        id: 'interview-prep', name: 'Preparación de entrevista técnica',
        description: 'Preguntas típicas, coding challenges, pair programming.',
        profileKeywords: [],
        selfAssess: true, category: 'soft', importance: 'important',
        masterRef: 'Módulo 17 - Preparación de Entrevistas', mentorTopic: 'preguntas de entrevista técnica Python: qué esperar y cómo responder',
    },
];

// ─── PATH 2: Frontend Developer ───────────────────────────────────────────────
const frontendDevSkills: PathSkill[] = [
    {
        id: 'logic-base', name: 'Base de lógica de programación',
        description: 'Variables, condicionales, bucles. Aplica a cualquier lenguaje.',
        profileKeywords: ['variables y tipos', 'condicional', 'bucle'],
        selfAssess: false, category: 'python', importance: 'critical',
        masterRef: 'Python Temas 1-3', mentorTopic: 'lógica de programación básica',
    },
    { id: 'html-basic', name: 'HTML estructural', description: 'Semántica, formularios, tablas, multimedia.', profileKeywords: [], selfAssess: true, category: 'html', importance: 'critical', masterRef: 'HTML - Módulo 8', mentorTopic: 'estructura HTML semántica' },
    { id: 'css-basic', name: 'CSS — Estilos y selectores', description: 'Selectores, modelo de caja, tipografía.', profileKeywords: [], selfAssess: true, category: 'css', importance: 'critical', masterRef: 'CSS - Módulo 9 Temas 1-4', mentorTopic: 'selectores CSS y modelo de caja' },
    { id: 'css-layout', name: 'CSS — Flexbox y Grid', description: 'Los dos sistemas de layout modernos.', profileKeywords: [], selfAssess: true, category: 'css', importance: 'critical', masterRef: 'CSS Tema 6', mentorTopic: 'Flexbox y CSS Grid' },
    { id: 'css-responsive', name: 'Responsive Design', description: 'Media queries, diseño mobile-first.', profileKeywords: [], selfAssess: true, category: 'css', importance: 'critical', masterRef: 'CSS Tema 8', mentorTopic: 'responsive design y media queries' },
    { id: 'js-basic', name: 'JavaScript — Fundamentos', description: 'Variables, funciones, arrays, objetos.', profileKeywords: [], selfAssess: true, category: 'js', importance: 'critical', masterRef: 'JavaScript Temas 1-3', mentorTopic: 'fundamentos JavaScript: variables, funciones, arrays' },
    { id: 'js-dom', name: 'Manipulación del DOM', description: 'Seleccionar y modificar elementos HTML con JS.', profileKeywords: [], selfAssess: true, category: 'js', importance: 'critical', masterRef: 'JavaScript Tema 6', mentorTopic: 'DOM manipulation en JavaScript' },
    { id: 'js-events', name: 'Eventos en JavaScript', description: 'Click, input, submit, event listeners.', profileKeywords: [], selfAssess: true, category: 'js', importance: 'critical', masterRef: 'JavaScript Tema 7', mentorTopic: 'eventos JavaScript y event listeners' },
    { id: 'js-async', name: 'Promesas y Fetch', description: 'Llamadas a APIs externas de forma asíncrona.', profileKeywords: [], selfAssess: true, category: 'js', importance: 'critical', masterRef: 'JavaScript Temas 9-10', mentorTopic: 'fetch API, promesas y async/await en JavaScript' },
    { id: 'react-basic', name: 'React — Componentes y Props', description: 'JSX, componentes funcionales, paso de props.', profileKeywords: [], selfAssess: true, category: 'react', importance: 'critical', masterRef: 'ReactJS Temas 1-2', mentorTopic: 'componentes React, JSX y props' },
    { id: 'react-hooks', name: 'React — useState y useEffect', description: 'Estado local y efectos secundarios.', profileKeywords: [], selfAssess: true, category: 'react', importance: 'critical', masterRef: 'ReactJS Tema 3', mentorTopic: 'hooks useState y useEffect en React' },
    { id: 'git-basic-fe', name: 'Git básico', description: 'Control de versiones. Obligatorio.', profileKeywords: [], selfAssess: true, category: 'git', importance: 'critical', masterRef: 'Git - Módulo 4', mentorTopic: 'Git básico para proyectos frontend' },
];

// ─── PATH 3: Full Stack Python/Django ─────────────────────────────────────────
const fullStackSkills: PathSkill[] = [
    ...pythonDevSkills.filter(s => s.importance === 'critical'),
    { id: 'django-basics', name: 'Django — Fundamentos', description: 'Modelos, vistas, URLs, templates.', profileKeywords: [], selfAssess: true, category: 'django', importance: 'critical', masterRef: 'Django Módulo 13 Temas 1-5', mentorTopic: 'Django básico: modelos, vistas y URLs' },
    { id: 'django-forms', name: 'Django — Formularios y CBV', description: 'Forms, class-based views, auth.', profileKeywords: [], selfAssess: true, category: 'django', importance: 'critical', masterRef: 'Django Temas 7-8', mentorTopic: 'formularios Django y vistas basadas en clases' },
    { id: 'sql-intermediate', name: 'SQL intermedio', description: 'JOINs, subconsultas, ORM de Django.', profileKeywords: [], selfAssess: true, category: 'sql', importance: 'critical', masterRef: 'SQL Módulo 5', mentorTopic: 'SQL intermedio y ORM Django' },
    { id: 'html-css-basic', name: 'HTML y CSS básico', description: 'Para crear templates Django funcionales.', profileKeywords: [], selfAssess: true, category: 'html', importance: 'important', masterRef: 'Módulos 8-9', mentorTopic: 'HTML/CSS básico para templates' },
    { id: 'deploy-basic', name: 'Despliegue (Render / DigitalOcean)', description: 'Poner tu app en producción.', profileKeywords: [], selfAssess: true, category: 'deploy', importance: 'important', masterRef: 'Módulo 15', mentorTopic: 'despliegue de aplicaciones Django en producción' },
];

// ─── PATH 4: Máster Completo ───────────────────────────────────────────────────
const masterCompleteSkills: PathSkill[] = [
    ...pythonDevSkills,
    ...frontendDevSkills.filter(s => !s.id.startsWith('logic')),
    { id: 'django-full', name: 'Django completo', description: 'Todo el módulo de Django.', profileKeywords: [], selfAssess: true, category: 'django', importance: 'critical', masterRef: 'Django - Módulo 13', mentorTopic: 'Django full stack completo' },
    { id: 'deploy-full', name: 'Despliegue completo', description: 'Servidores, dominios, producción.', profileKeywords: [], selfAssess: true, category: 'deploy', importance: 'critical', masterRef: 'Módulo 15', mentorTopic: 'despliegue completo con nginx, servidor y dominio' },
    { id: 'scrum', name: 'Scrum y metodologías ágiles', description: 'Cómo trabajan los equipos de desarrollo.', profileKeywords: [], selfAssess: true, category: 'soft', importance: 'important', masterRef: 'Módulo 18', mentorTopic: 'Scrum, sprints y trabajo en equipo ágil' },
];

export const CAREER_PATHS: CareerPath[] = [
    {
        id: 'python-dev',
        emoji: '🐍',
        title: 'Desarrollador Python',
        jobTitle: 'Python Developer',
        description: 'El camino más directo desde el máster hasta tu primer empleo. Python es el lenguaje más demandado en backend, data y automatización.',
        colorClass: 'yellow',
        glowHex: 'rgba(234,179,8,0.3)',
        jobExamples: ['Python Backend Developer', 'Python Automation Engineer', 'Junior Python Developer'],
        salaryRange: '22.000 – 35.000 €/año',
        estimatedMonths: '3 – 5 meses',
        skills: pythonDevSkills,
    },
    {
        id: 'frontend-dev',
        emoji: '🎨',
        title: 'Desarrollador Frontend',
        jobTitle: 'Frontend Developer',
        description: 'HTML, CSS, JavaScript y React. La ruta visual del máster, orientada a construir interfaces y experiencias de usuario.',
        colorClass: 'pink',
        glowHex: 'rgba(236,72,153,0.3)',
        jobExamples: ['Frontend Developer', 'React Developer', 'UI Engineer'],
        salaryRange: '22.000 – 38.000 €/año',
        estimatedMonths: '4 – 6 meses',
        skills: frontendDevSkills,
    },
    {
        id: 'fullstack-python',
        emoji: '🔧',
        title: 'Full Stack Python/Django',
        jobTitle: 'Full Stack Python Developer',
        description: 'Python en el backend con Django + frontend básico. El perfil más completo y demandado del ecosistema Python.',
        colorClass: 'blue',
        glowHex: 'rgba(59,130,246,0.3)',
        jobExamples: ['Full Stack Python Developer', 'Django Developer', 'Backend Python + HTML/CSS'],
        salaryRange: '28.000 – 45.000 €/año',
        estimatedMonths: '6 – 9 meses',
        skills: fullStackSkills,
    },
    {
        id: 'master-complete',
        emoji: '🌐',
        title: 'Full Stack Developer (Máster)',
        jobTitle: 'Full Stack Developer',
        description: 'Completar el máster entero y convertirte en un desarrollador full stack con Python, Django, React y despliegue.',
        colorClass: 'violet',
        glowHex: 'rgba(139,92,246,0.3)',
        jobExamples: ['Full Stack Developer', 'Software Engineer', 'Web Developer'],
        salaryRange: '32.000 – 55.000 €/año',
        estimatedMonths: '12 – 18 meses',
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
