const fs = require('fs');
const path = require('path');

const curriculumList = `MÓDULO 1: INTRODUCCIÓN A LA INFORMÁTICA Y PSEUDOCÓDIGO
Tema 1: Introducción a la Informática
MÓDULO 2: PSEUDOCÓDIGO
Tema 1: Introducción a PSEint
Tema 2: Tu primer algoritmo
Tema 3: Funciones
Tema 4: Arrays y funciones propias
MÓDULO 3: INTRODUCCIÓN A LINUX Y LA TERMINAL
Tema 1: Introducción a Linux y la Terminal
Tema 2: Virtualbox
Tema 3: Windows Subsystem Linux (WSL)
Tema 4: Primeros comandos y tipos de archivos
Tema 5: Gestión de usuarios y grupos
Tema 6: Utilidades avanzadas
MÓDULO 4: PYTHON BÁSICO Y AVANZADO
Tema 1: Configuración y Entorno de Desarrollo
Tema 2: Gestión de entornos virtuales
Tema 3: Python inicial
Tema 4: Estructuras de datos
Tema 5: Funciones
Tema 6: Gestión de archivos
Tema 7: Programación orientada a objetos
Tema 8: Ejercicios avanzados con explicación
MÓDULO 5: GIT Y GITHUB
Tema 1: Introducción a Git y Control de Versiones
Tema 2: Uso Básico de Git
Tema 3: Trabajo Colaborativo Local
Tema 4: Introducción a GitHub
Tema 5: Trabajo Colaborativo en GitHub
Tema 6: Flujo de Trabajo Avanzado
Tema 7: Buenas Prácticas y Consejos
Tema 8: Integración Continua y Despliegue
Tema 9: Casos de Uso Específicos
MÓDULO 6: FRONTEND / HTML
Tema 1: Introducción a HTML
Tema 2: Texto y estructura en HTML
Tema 3: Tablas, Formularios e Imágenes
Tema 4: Contenido adicional
MÓDULO 7: CSS
Tema 1: Introducción a CSS
Tema 2: Unidades de Medida en CSS
Tema 3: Tipos de Etiqueta y CSS del Navegador
Tema 4: Cascada y Prioridad
Tema 5: Selectores
Tema 6: Selectores II
Tema 7: Selectores III
Tema 8: Texto en CSS
Tema 9: Tipografías en CSS
Tema 10: Iconos tipográficos
Tema 11: Modelo de Caja
Tema 12: Imágenes
Tema 13: Posicionamiento I
Tema 14: Posicionamiento II
Tema 15: Tablas y Listas
Tema 16: Flexbox Básico
Tema 17: Grid Básico
Tema 18: Interactividad
Tema 19: Degradados, Sombras y Efectos
Tema 20: Responsive Web Design
Tema 21: Variables
Tema 22: Transformaciones
Tema 23: Animaciones
Tema 24: Frameworks CSS: Tailwind, Bootstrap y Bulma
Tema 25: Preprocesadores CSS
MÓDULO 8: JAVASCRIPT
Tema 0: Introducción a JS
Tema 1: Conceptos básicos del lenguaje
Tema 2: Conceptos propios del lenguaje
Tema 3: Arrays, String y Number
Tema 4: Sentencias de control de flujo
Tema 5: Sentencias iterativas básicas
Tema 6: Debugging
Tema 7a: Manejo de Arrays en profundidad
Tema 7b: Manejo de Arrays en profundidad II
Tema 8: DOM
Tema 9: Eventos
Tema 10: EmacScript
Tema 11: Ajax
Tema 12: Asincronía
Tema 13: TypeScript
MÓDULO 9: REACT: BÁSICO, INTERMEDIO Y AVANZADO
Tema 1: Introducción a React JS
Tema 2: Tu primer proyecto de React JS con Vite
Tema 3: ¿Qué es un componente?
Tema 4: Ciclo de vida de un componente
Tema 5: Organización de archivos y carpetas
Tema 6: Fundamentos de JSX
Tema 7: React Dev Tools
Tema 8: Estilos CSS en React
Tema 9: Eventos en React JS
Tema 10: Comunicación entre componentes
Tema 11: ¿Qué son los efectos?
Tema 12: ¿Qué es el estado?
Tema 13: Local Storage con React JS
Tema 14: Estados de carga
Tema 15: Formularios en React JS
Tema 16: Comunicación con el servidor
Tema 17: Rutas y navegación
Tema 18: Portales
Tema 19: React Context
Tema 20: Proyecto Lista de Todos
Tema 21: Obtener lista de todos del servidor
Tema 22: Crear todo
Tema 23: Eliminar Todo
Tema 24: Despliegue en Github Pages
Tema 25: NextJS
Tema 26: De React a Angular (diferencias y similitudes)
Tema 27: De React a Vuejs (diferencias y similitudes)
MÓDULO 10: ASTRO
Tema 1: Introducción a Astro
Tema 2: Estructura de un proyecto en Astro
Tema 3: Componentes y slots
Tema 4: Renderización e imports
Tema 5: Estilos CSS en Astro
Tema 6: Integraciones con otros frameworks
Tema 7: Directivas client
Tema 8: Barra de herramientas de Astro
Tema 9: Rutas dinámicas y paginación
Tema 10: Internacionalización de un proyecto en Astro
Tema 11: Content pages y collections
MÓDULO 11: SQL
Tema 1: Instalación del software
Tema 2: Introducción a las bases de datos
Tema 3: El Modelo Relacional
Tema 4: Introducción al lenguaje de consulta
Tema 5: Cláusulas de filtrado de datos
Tema 6: Cláusulas de ordenación de datos
Tema 7: Funciones de cada tipo de dato
Tema 8: Agrupaciones y funciones de grupo
Tema 9: Uniones entre tablas: Las JOINS
Tema 10: Subqueries o Subconsultas
Tema 11: Operaciones de conjuntos
Tema 12: Actualización de Bases de datos. DML
Tema 13: Creación de Tablas y Constraints
Tema 14: Vistas
Tema 15: Índices
Tema 16: Usuarios y permisos
Tema 17: Procedimientos
Tema 18: Control de Flujo
Tema 19: Creación de funciones
Tema 20: Control de errores
Tema 21: Cursores
Tema 22: Triggers
MÓDULO 12: DJANGO
Tema 1: Introducción a Django
Tema 2: Tu primer proyecto en Django
Tema 3: Entorno de Desarrollo
Tema 4: Modelo MVT
Tema 5: Estructura de ficheros del proyecto
Tema 6: Creación de tu primera aplicación
Tema 7: Modelos I
Tema 8: Modelos II
Tema 9: Queries
Tema 10: Admin de Django
Tema 11: Views
Tema 12: Urls
Tema 13: Formularios
Tema 14: Model Forms
Tema 15: Templates
Tema 16: Autenticación
Tema 17: CCBV vs Function Views
Tema 18: ListView y DetailView
Tema 19: FormView, CreateView y UpdateView
Tema 20: DeleteView
Tema 21: Decorators, Middlewares y Session
Tema 22: Tests
Tema 23: Internacionalización y Rosetta
MÓDULO 13: NODE.JS (JAVASCRIPT)
Tema 1: Introducción a Node.js
Tema 2: Fundamentos de Node.js
Tema 3: Asincronía en Node.js
Tema 4: Introducción a Express.js
Tema 5: Profundizando en Express.js
Tema 6: Introducción a MongoDB y Mongoose
Tema 7: Creación de un API REST: Fundamentos
Tema 8: Desarrollo Avanzado de API REST
Tema 9: Mejores Prácticas y Performance en Node.js
Tema 10: Proyecto Final API REST Completa
MÓDULO 14: JAVA Y SPRING
Tema 1: Introducción a Java
Tema 2: Fundamentos de Programación en Java
Tema 3: Fundamentos de Programación en Java II
Tema 4: Fundamentos de Programación en Java II
Tema 5: Fundamentos de Programación en Java III
Tema 6: Conceptos Avanzados en Java
Tema 7: Serie de ejercicios Prácticos
Tema 8: Introducción a Spring Framework
Tema 9: Configuración inicial y estructura del proyecto
Tema 10: Desarrollo de aplicaciones web con Spring Boot
Tema 11: Uso de bases de datos con Spring Boot (Hibernate)
Tema 12: Uso de bases de datos con Spring Boot (Hibernate) II
Tema 13: Pruebas unitarias e integración con Spring Boot
Tema 14: Proyecto Final – API REST Completa (Web de una Biblioteca)
MÓDULO 15: RUST
Tema 1: Introducción a Rust
Tema 2: Tipos en Rust
Tema 3: Flujo de control en Rust
Tema 4: Lógica en Rust
Tema 5: Tipos avanzados en Rust
Tema 6: Data ownership en Rust
Tema 7: Manejo de errores
Tema 8: Librería standard de Rust
Tema 9: Módulos y Testing en Rust
Tema 10: Desarrollo de aplicación de línea de comandos
MÓDULO 16: PREPARACIÓN DE ENTREVISTAS DE TRABAJO
Tema 1: Tipos de procesos de selección
Tema 2: Procesos de selección
Tema 3: Investigación de la empresa objetivo
Tema 4: Tipos de procesos
Tema 5: La importancia del currículum
Tema 6: Búsqueda de empleo en redes sociales I
Tema 7: Búsqueda de empleo en redes sociales II
Tema 8: Nuestra huella digital
Tema 9: Soft Skills y Hard Skills
Tema 10: Tu mejor versión
Tema 11: Comunicación no verbal (CNV)
Tema 12: Comunicación no verbal 2 (CNV)
Tema 13: La entrevista
Tema 14: Preguntas fáciles
Tema 15: Preguntas prohibidas
Tema 16: Final de la entrevista y consejos del reclutador`;

const modulesData = {};
let currentModule = '';

// Parse curriculum
curriculumList.split('\n').forEach(line => {
    line = line.trim();
    if (!line) return;
    if (line.startsWith('MÓDULO')) {
        currentModule = line.match(/MÓDULO (\d+):/)[1];
        modulesData[currentModule] = { title: line, themes: [] };
    } else if (line.startsWith('Tema')) {
        modulesData[currentModule].themes.push(line);
    }
});

const modulesDir = path.join(__dirname, 'src', 'components', 'modules');

for (let i = 1; i <= 16; i++) {
    const filePath = path.join(modulesDir, `Module${i}.tsx`);
    if (!fs.existsSync(filePath)) continue;

    let content = fs.readFileSync(filePath, 'utf-8');

    // Skip if already modified
    if (content.includes('ModuleCurriculum')) continue;

    const data = modulesData[i];
    if (!data) continue;

    content = content.replace("import React, { useState } from 'react';", "import React, { useState } from 'react';\nimport ModuleCurriculum from './ModuleCurriculum';");
    content = content.replace("import React,{ useState } from 'react';", "import React, { useState } from 'react';\nimport ModuleCurriculum from './ModuleCurriculum';");

    const signatureRegex = new RegExp(`(const Module${i}: React\\.FC<Module(?:[0-9]+)?Props> = \\(\\{ onComplete, onBack \\}\\) => \\{)`);

    if (signatureRegex.test(content)) {
        const replacement = `const themes = ${JSON.stringify(data.themes, null, 4)};\n\n$1\n    const [showCurriculum, setShowCurriculum] = useState(true);\n\n    if (showCurriculum) {\n        return <ModuleCurriculum title="${data.title}" themes={themes} onBack={onBack} onStartChallenge={() => setShowCurriculum(false)} />;\n    }\n`;
        content = content.replace(signatureRegex, replacement);
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`Updated Module ${i}`);
    } else {
        console.log(`Signatures did not match perfectly for Module ${i}`);
    }
}
