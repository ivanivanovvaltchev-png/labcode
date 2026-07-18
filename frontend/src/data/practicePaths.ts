/**
 * PRACTICE PATHS — Caminos de práctica basados en PDFs reales
 *
 * Cada "camino" representa un PDF/clase teórica concreta que el usuario ha
 * subido y que Claude (fuera del runtime de la app) ha leído e interpretado
 * a mano. A diferencia del análisis automático por IA sobre texto crudo de
 * PDF (que trunca el contenido y adivina conceptos genéricos), esta lista
 * refleja los conceptos REALES enseñados en cada documento, con nombres
 * estables (id) para que el resto del sistema (masteryEngine, prompts de
 * ejercicios) pueda referenciarlos de forma fiable.
 *
 * CÓMO AÑADIR UN PDF NUEVO:
 * 1. El usuario comparte el PDF con Claude en el chat.
 * 2. Claude lee el contenido y añade un nuevo objeto `PracticePath` aquí,
 *    con un concepto por cada idea/sintaxis real que enseña el documento.
 * 3. No hace falta tocar ningún otro archivo — masteryEngine.ts siembra el
 *    registro de conceptos automáticamente a partir de este array, y la
 *    página "Mejora" (Mentor → Mejora) lista los caminos automáticamente.
 */

export interface PracticeConcept {
    /** Id estable, usado como clave interna. No cambiar una vez creado. */
    id: string;
    /** Nombre corto mostrado al usuario y usado como "skillRef" en ejercicios. */
    name: string;
    /** Explicación breve del concepto — se inyecta en los prompts de la IA. */
    description: string;
    order: number;
}

export interface PracticePath {
    id: string;
    /** Nombre de archivo original del PDF, para que el usuario lo reconozca. */
    sourceFile: string;
    title: string;
    emoji: string;
    description: string;
    concepts: PracticeConcept[];
}

export const PRACTICE_PATHS: PracticePath[] = [
    {
        id: 'variables-tipos-operaciones',
        sourceFile: 'Variables, Tipos de Datos y Operaciones Básicas.pdf',
        title: 'Variables, Tipos y Operaciones Básicas',
        emoji: '🔤',
        description: 'Variables, tipos de datos, strings, números y comentarios en Python.',
        concepts: [
            { id: 'vto-variables-init', name: 'Variables: inicialización directa sin declarar tipo', description: 'En Python no se declara el tipo (a diferencia de pseudocódigo "Definir x Como Entero"); la variable se crea al asignarle un valor: numero_entero = 42.', order: 1 },
            { id: 'vto-nomenclatura', name: 'Reglas de nomenclatura de variables', description: 'Solo letras, números y guion bajo; no puede empezar por número; sin espacios (usar guion bajo); no usar palabras reservadas como print; nombres cortos pero descriptivos; evitar l, I, O por confusión con 1 y 0.', order: 2 },
            { id: 'vto-asignacion-multiple', name: 'Asignación múltiple', description: 'x = y = z = 10 asigna el mismo valor a varias variables; x, y, z = 1, 2, 3 asigna valores distintos en una sola línea.', order: 3 },
            { id: 'vto-input', name: 'input() para leer texto por teclado', description: 'input() siempre devuelve un string; input("pregunta ") permite mostrar el mensaje en la misma línea.', order: 4 },
            { id: 'vto-tipos-cast', name: 'Funciones de tipo: int(), float(), str(), bool()', description: 'Convierten un valor de un tipo a otro; imprescindible tras input() para operar con números (int(input(...))).', order: 5 },
            { id: 'vto-type', name: 'type() para consultar el tipo de un dato', description: 'type(variable) devuelve la clase del valor (int, float, str, bool).', order: 6 },
            { id: 'vto-bool-truthy', name: 'bool() y valores truthy/falsy', description: 'bool(0) y bool("") son False; cualquier número distinto de 0 y cualquier string no vacío son True.', order: 7 },
            { id: 'vto-constantes', name: 'Constantes en Python (convención, no existen realmente)', description: 'Python no tiene constantes inmutables reales; una "constante" es solo una variable que el programador decide no modificar.', order: 8 },
            { id: 'vto-strings-sintaxis', name: 'Strings: comillas simples, dobles y triples', description: 'Comillas simples y dobles son intercambiables (útil para incluir la otra dentro del texto); comillas triples permiten texto multilínea.', order: 9 },
            { id: 'vto-strings-metodos-caso', name: 'Métodos de string: title(), upper(), lower()', description: 'title() pone en mayúscula cada palabra, upper() todo mayúsculas, lower() todo minúsculas.', order: 10 },
            { id: 'vto-strings-strip', name: 'Eliminar espacios: strip(), lstrip(), rstrip()', description: 'rstrip() quita espacios a la derecha, lstrip() a la izquierda, strip() a ambos lados.', order: 11 },
            { id: 'vto-strings-replace-find', name: 'replace() y find()', description: 'replace(a, b) sustituye todas las apariciones de a por b; find(sub) devuelve el índice de la primera aparición o -1 si no existe.', order: 12 },
            { id: 'vto-strings-startswith-endswith', name: 'startswith() y endswith()', description: 'Comprueban si el string empieza o termina con un fragmento concreto, devuelven True/False.', order: 13 },
            { id: 'vto-strings-concatenar', name: 'Concatenar strings con +', description: 'nombre + " " + apellido une strings; hay que añadir espacios manualmente entre palabras.', order: 14 },
            { id: 'vto-strings-indices-slicing', name: 'Índices y slicing de strings', description: 'Los índices empiezan en 0; string[0:5] extrae una porción; string[::-1] invierte el string completo.', order: 15 },
            { id: 'vto-strings-len', name: 'len() para el tamaño de un string', description: 'Devuelve el número de caracteres del string.', order: 16 },
            { id: 'vto-errores-name-syntax', name: 'NameError y SyntaxError típicos', description: 'NameError: variable no definida (typo en el nombre); SyntaxError: texto sin comillas u otro error de sintaxis básica.', order: 17 },
            { id: 'vto-combinar-numeros-strings', name: 'Combinar números y strings (TypeError)', description: 'No se puede concatenar directamente un int con un string ("texto" + numero da TypeError); hay que envolver el número en str().', order: 18 },
            { id: 'vto-operadores-aritmeticos', name: 'Operadores aritméticos: +, -, *, /, **, %', description: 'Suma, resta, multiplicación, división (siempre da float), potencia (**) y módulo/resto (%).', order: 19 },
            { id: 'vto-orden-operaciones', name: 'Orden de las operaciones matemáticas', description: 'Python sigue el orden matemático estándar: paréntesis, exponentes, multiplicación/división, suma/resta.', order: 20 },
            { id: 'vto-floats-imprecision', name: 'Floats y su imprecisión (0.1 + 0.2 ≠ 0.3 exacto)', description: 'Los decimales se representan de forma imprecisa en cualquier lenguaje de programación; 0.2 + 0.1 puede dar 0.30000000000000004.', order: 21 },
            { id: 'vto-comentarios', name: 'Comentarios con # y strings sueltos ignorados', description: 'La almohadilla # marca una línea como comentario; un string no asignado a ninguna variable también es ignorado por el intérprete.', order: 22 },
            { id: 'vto-python-interpretado', name: 'Python es un lenguaje interpretado, no compilado', description: 'Un programa Python se ejecuta directamente con un intérprete (no se compila antes); esto permite ejecutar instrucciones de forma interactiva línea a línea.', order: 23 },
            { id: 'vto-linea-comandos-vs-scripts', name: 'Línea de comandos vs scripts .py', description: 'Se puede escribir Python directamente en la terminal (línea a línea, modo interactivo >>>) o guardar el código en un archivo .py (script) para ejecutarlo completo de una vez.', order: 24 },
            { id: 'vto-modificacion-variables', name: 'Modificar una variable ya creada', description: 'Una variable se puede reasignar usando su propio valor anterior, ej. numero_entero = numero_entero + 4, o simplemente dándole un valor nuevo distinto del inicial.', order: 25 },
        ],
    },
    {
        id: 'tuplas',
        sourceFile: 'Python-Inicial-Clase-01-Teoria-tuplas-y-sets-Diapositivas.pdf',
        title: 'Tuplas',
        emoji: '📦',
        description: 'Qué son las tuplas, su inmutabilidad, cómo se comparan con listas/arrays y cómo trabajar con ellas.',
        concepts: [
            { id: 'tup-definicion', name: 'Tuplas como listas inmutables', description: 'Una tupla es una colección ordenada que, a diferencia de la lista, no permite añadir, eliminar ni mover elementos una vez creada.', order: 1 },
            { id: 'tup-sintaxis', name: 'Sintaxis de una tupla: con y sin paréntesis', description: 'mi_tupla = ("fruta", 45, True) o directamente mi_tupla = "fruta", 45, True (los paréntesis son opcionales pero recomendados).', order: 2 },
            { id: 'tup-inmutabilidad-errores', name: 'Inmutabilidad: TypeError al reasignar/append/insert', description: 'tupla[0] = valor da TypeError "does not support item assignment"; .append() e .insert() dan AttributeError porque no existen en tuplas.', order: 3 },
            { id: 'tup-vs-lista-vs-array', name: 'Tupla vs lista vs array: memoria y velocidad', description: 'Las tuplas ocupan menos memoria (sys.getsizeof) y se crean más rápido (timeit) que las listas equivalentes; los arrays exigen que todos los elementos sean del mismo tipo.', order: 4 },
            { id: 'tup-acceso-indices', name: 'Acceder a elementos por índice', description: 'mi_tupla[1] devuelve el elemento en la posición 1 (los índices empiezan en 0).', order: 5 },
            { id: 'tup-slicing', name: 'Slicing de una tupla', description: 'mi_tupla[1:3] devuelve una tupla nueva con los elementos desde el índice 1 hasta el 2 (el límite superior no se incluye).', order: 6 },
            { id: 'tup-pertenencia', name: 'Comprobar pertenencia con in', description: '"fruta" in mi_tupla devuelve True/False según si el elemento existe en la tupla.', order: 7 },
            { id: 'tup-len-count-index', name: 'len(), count() e index()', description: 'len(tupla) da el número de elementos; tupla.count(x) cuenta apariciones de x; tupla.index(x) devuelve la posición de la primera aparición.', order: 8 },
            { id: 'tup-max-min', name: 'max() y min() sobre una tupla', description: 'Devuelven el valor máximo y mínimo de los elementos de la tupla.', order: 9 },
            { id: 'tup-sorted-reversed', name: 'sorted() devuelve lista, reversed() un objeto reversed', description: 'sorted(tupla) ordena pero devuelve una LISTA, no una tupla; reversed(tupla) devuelve un objeto "reversed" que hay que envolver en tuple() para verlo como tupla.', order: 10 },
            { id: 'tup-conversion-list-tuple', name: 'Conversión entre lista y tupla: list() y tuple()', description: 'tuple(mi_lista) convierte una lista en tupla y list(mi_tupla) una tupla en lista.', order: 11 },
            { id: 'tup-tupla-de-tuplas', name: 'Tuplas de tuplas: acceso y slicing anidado', description: 'mi_tupla[1][0] accede al primer elemento de la tupla interior en la posición 1; también se puede aplicar slicing sobre la tupla interior, ej. mi_tupla[2][0:2].', order: 12 },
            { id: 'tup-unitaria', name: 'Tupla unitaria: la coma final es obligatoria', description: '(1) es solo un int entre paréntesis; (1,) con la coma es una tupla de un elemento.', order: 13 },
            { id: 'tup-empaquetado-desempaquetado', name: 'Empaquetado y desempaquetado (packing/unpacking)', description: 'mi_tupla = "fruta", 45, True empaqueta valores en una tupla; a, b, c = mi_tupla desempaqueta cada valor en una variable distinta.', order: 14 },
            { id: 'tup-errores-desempaquetado', name: 'Errores de desempaquetado (ValueError)', description: 'Si el número de variables no coincide con el de elementos de la tupla, Python lanza ValueError ("too many values to unpack" o "not enough values to unpack").', order: 15 },
            { id: 'tup-como-llave-diccionario', name: 'Tuplas como llaves de un diccionario', description: 'Al ser inmutables, las tuplas pueden usarse como clave (key) de un diccionario, algo que una lista no puede hacer.', order: 16 },
            { id: 'tup-cuando-usar', name: 'Cuándo conviene usar una tupla', description: 'Cuando necesitamos guardar varios elementos pero en el futuro solo queremos recorrerlos/leerlos sin modificarlos, conviene usar una tupla en vez de una lista (más rápida y ocupa menos memoria).', order: 17 },
        ],
    },
    {
        id: 'sets',
        sourceFile: 'Python-Inicial-Clase-02-Teoria-tuplas-y-sets-Diapositivas.pdf',
        title: 'Sets (Conjuntos)',
        emoji: '🧮',
        description: 'Qué son los sets, su falta de orden e índices, unicidad, y operaciones de conjuntos (unión, intersección, diferencia).',
        concepts: [
            { id: 'set-definicion', name: 'Sets: colecciones no ordenadas de elementos únicos', description: 'Un set es una colección sin orden garantizado, sin índices asociados, y donde no puede haber elementos duplicados.', order: 1 },
            { id: 'set-sintaxis', name: 'Sintaxis de un set: {} y cuidado con set() vacío', description: 'mi_set = {\'fruta\', 45, True} crea un set; OJO: {} vacío crea un diccionario, no un set — para un set vacío hay que usar set().', order: 2 },
            { id: 'set-sin-orden', name: 'Ausencia de ordenamiento', description: 'El orden en que se imprime un set no coincide necesariamente con el orden en que se insertaron los elementos.', order: 3 },
            { id: 'set-sin-indices', name: 'Los sets no tienen índices (TypeError)', description: 'set_frutas[0] lanza TypeError "\'set\' object is not subscriptable" porque los elementos no tienen posición.', order: 4 },
            { id: 'set-inmutabilidad-elementos', name: 'No se pueden reasignar elementos', description: 'set_frutas[0] = "pera" da TypeError "does not support item assignment"; los elementos del set no se modifican individualmente.', order: 5 },
            { id: 'set-unicidad', name: 'Unicidad: no hay duplicados', description: 'Si se intenta crear un set con valores repetidos, el resultado solo conserva una copia de cada valor.', order: 6 },
            { id: 'set-pertenencia-eficiente', name: 'Comprobar pertenencia con in — más eficiente que en listas', description: 'Los sets usan una tabla hash internamente: cada elemento tiene un "hash" único que determina su posición ("bucket"), por lo que comprobar "x in set" es mucho más rápido que en una lista, donde hay que recorrer todos los elementos.', order: 7 },
            { id: 'set-add', name: 'Añadir elementos con add()', description: 'frutas.add(\'fresa\') añade un nuevo elemento al set (si no existe ya).', order: 8 },
            { id: 'set-remove-vs-discard', name: 'remove() vs discard()', description: 'remove(x) lanza KeyError si x no existe en el set; discard(x) no hace nada si x no existe (no lanza error).', order: 9 },
            { id: 'set-conversion-list-set', name: 'Conversión lista↔set para eliminar duplicados', description: 'set(mi_lista) elimina duplicados de una lista; list(mi_set) convierte el set de vuelta a lista.', order: 10 },
            { id: 'set-union', name: 'Unión de conjuntos: | y union()', description: 'set1 | set2 o set1.union(set2) devuelven todos los elementos presentes en cualquiera de los dos sets.', order: 11 },
            { id: 'set-interseccion', name: 'Intersección de conjuntos: & e intersection()', description: 'set1 & set2 o set1.intersection(set2) devuelven solo los elementos presentes en AMBOS sets.', order: 12 },
            { id: 'set-diferencia', name: 'Diferencia de conjuntos: - y difference()', description: 'set1 - set2 o set1.difference(set2) devuelven los elementos de set1 que NO están en set2.', order: 13 },
            { id: 'set-diferencia-simetrica', name: 'Diferencia simétrica: ^ y symmetric_difference()', description: 'set1 ^ set2 o set1.symmetric_difference(set2) devuelven los elementos que están en uno de los dos sets pero no en ambos a la vez.', order: 14 },
            { id: 'set-tabla-comparativa', name: 'Lista vs array vs tupla vs set: tabla comparativa', description: 'Comparación por mutabilidad, presencia de índices, homogeneidad, tamaño fijo/dinámico y unicidad: listas y sets son modificables, tuplas y arrays no; solo los arrays exigen mismo tipo; solo los sets garantizan unicidad y carecen de índices.', order: 15 },
            { id: 'set-eliminar-duplicados-lista', name: 'Eliminar duplicados de una lista usando un set', description: 'Convertir una lista en set (set(mi_lista)) elimina automáticamente los duplicados; luego se puede reconvertir a list() si se necesita el resultado como lista.', order: 16 },
        ],
    },
];

/** Devuelve un PracticePath por su id, o undefined si no existe. */
export function getPracticePathById(id: string): PracticePath | undefined {
    return PRACTICE_PATHS.find(p => p.id === id);
}

/** Devuelve todos los conceptos (nombre) de todos los caminos, en orden de definición. */
export function getAllPracticeConceptNames(): string[] {
    return PRACTICE_PATHS.flatMap(p => p.concepts.map(c => c.name));
}
