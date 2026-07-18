/**
 * PRACTICE PATHS — Caminos de práctica basados en PDFs reales
 *
 * Cada "camino" representa un PDF/clase teórica concreta que el usuario ha
 * subido y que Claude (fuera del runtime de la app) ha leído e interpretado
 * a mano, diapositiva por diapositiva. A diferencia del análisis automático
 * por IA sobre texto crudo de PDF (que trunca el contenido y adivina
 * conceptos genéricos), esta lista refleja los conceptos REALES enseñados
 * en cada documento, con nombres estables (id) para que el resto del
 * sistema (masteryEngine, prompts de ejercicios) pueda referenciarlos de
 * forma fiable.
 *
 * CÓMO AÑADIR UN PDF NUEVO:
 * 1. El usuario comparte el PDF con Claude en el chat.
 * 2. Claude lee CADA diapositiva y añade un concepto por cada idea/sintaxis
 *    real que enseña — sin resumir ni fusionar diapositivas distintas.
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
        description: 'Qué es Python, variables, nomenclatura, input, tipos de datos, strings, números y comentarios — 82 diapositivas.',
        concepts: [
            { id: 'vto-que-es-python', name: 'Qué es Python: origen y características', description: 'Creado en los 80 por Guido van Rossum en el CWI (Países Bajos); multiplataforma (Unix, Linux, MacOS, Windows); multiparadigma (orientado a objetos, estructurado y funcional); sintaxis compacta y sencilla con curva de aprendizaje mínima.', order: 1 },
            { id: 'vto-interprete', name: 'Python es interpretado, no compilado', description: 'Un programa Python se ejecuta directamente con un intérprete (no se compila antes); esto permite ejecutar instrucciones de forma interactiva, crear funciones al vuelo mientras el programa corre, e interpretar un string como código Python y ejecutarlo.', order: 2 },
            { id: 'vto-linea-comandos-vs-scripts', name: 'Línea de comandos vs scripts .py', description: 'Se puede escribir Python directamente en la terminal en modo interactivo (prompt >>>, cada línea se ejecuta al momento) o guardar el código en un archivo .py (script) para ejecutarlo completo de una vez.', order: 3 },
            { id: 'vto-variable-definicion', name: 'Variable: espacio reservado en memoria con identificador', description: 'Una variable es un espacio reservado en memoria que tiene asignado un identificador (nombre) para poder referenciarlo y usarlo después.', order: 4 },
            { id: 'vto-declaracion-vs-inicializacion', name: 'Declaración vs inicialización', description: 'En pseudocódigo se declara el tipo antes de usar la variable (Definir sumaTotal Como Entero) y luego se inicializa con un valor; son dos pasos separados.', order: 5 },
            { id: 'vto-python-no-declara', name: 'En Python no se declaran las variables', description: 'A diferencia del pseudocódigo, en Python las variables se inicializan directamente con su valor en un solo paso: numero_entero = 42, sin indicar el tipo por adelantado.', order: 6 },
            { id: 'vto-inicializacion-explicita', name: 'Inicialización explícita con funciones de tipo', description: 'Se puede inicializar una variable llamando explícitamente a la función del tipo deseado: numero_entero = int(42), numero_decimal = float(12.5), texto = str(\'hola\'), variable_logica = bool(True).', order: 7 },
            { id: 'vto-modificacion-variables', name: 'Modificar una variable ya creada', description: 'Una variable se puede reasignar usando su propio valor anterior en la operación, ej. numero_entero = numero_entero + 4, o dándole directamente un valor nuevo distinto del inicial.', order: 8 },
            { id: 'vto-nomenclatura-caracteres', name: 'Nomenclatura: solo letras, números y guion bajo', description: 'Los nombres de variable solo pueden contener letras, números y barras bajas (_); ej. my_variable_1 y _my_variable_1 son válidos.', order: 9 },
            { id: 'vto-nomenclatura-inicio', name: 'Nomenclatura: nunca empezar por un número', description: 'Un nombre de variable puede empezar por una letra o un guion bajo, pero nunca por un número; 1_my_variable es inválido (SyntaxError).', order: 10 },
            { id: 'vto-nomenclatura-espacios', name: 'Nomenclatura: sin espacios, usar guion bajo', description: 'Los espacios no están permitidos en el nombre de una variable (my variable falla); se usa guion bajo para separar palabras (my_variable).', order: 11 },
            { id: 'vto-nomenclatura-palabras-reservadas', name: 'Nomenclatura: evitar nombres de funciones internas', description: 'No se deben usar como nombre de variable palabras ya asociadas a funciones internas de Python, por ejemplo print.', order: 12 },
            { id: 'vto-nomenclatura-descriptivos', name: 'Nomenclatura: nombres cortos pero descriptivos', description: 'Los nombres deben ser cortos pero descriptivos: preferir nombre_estudiante a n_e, y evitar nombres tan largos como tamaño_del_nombre_de_las_personas cuando tamaño_nombre basta.', order: 13 },
            { id: 'vto-nomenclatura-confusion-letras', name: 'Cuidado con l, I, O confundibles con 1 y 0', description: 'Evitar usar la ele minúscula (l), la i mayúscula (I) y la letra o mayúscula (O) como nombres, porque al leer el código se pueden confundir con los números 1 y 0.', order: 14 },
            { id: 'vto-asignacion-multiple-mismo-valor', name: 'Asignación múltiple: mismo valor a varias variables', description: 'x = y = z = 10 asigna el valor 10 a las tres variables x, y, z a la vez.', order: 15 },
            { id: 'vto-asignacion-multiple-valores-distintos', name: 'Asignación múltiple: valores distintos en una línea', description: 'x, y, z = 10, 20, 30 asigna un valor distinto a cada variable en una sola línea; funciona igual con strings (x, y, z = \'texto 1\', \'texto 2\', \'texto2\') o mezclando tipos (x, y, z = \'texto 1\', 120.3, 42).', order: 16 },
            { id: 'vto-input-basico', name: 'input() para leer texto por teclado', description: 'input() muestra opcionalmente un mensaje y espera que el usuario escriba algo por teclado; el valor devuelto siempre es de tipo string.', order: 17 },
            { id: 'vto-input-con-mensaje-inline', name: 'input("mensaje ") en la misma línea', description: 'nombre = input(\'¿Cómo te llamas? \') muestra la pregunta y captura la respuesta en la misma línea, en vez de necesitar un print() previo por separado.', order: 18 },
            { id: 'vto-input-error-tipo', name: 'Error típico: operar con el resultado de input() sin convertir', description: 'numero = input(\'¿Cuántos años tienes? \'); 365.0*numero da TypeError: can\'t multiply sequence by non-int of type \'float\' porque input() devuelve un string, no un número.', order: 19 },
            { id: 'vto-input-float', name: 'Solución: float(input(...))', description: 'Envolver input() en float() convierte directamente el texto capturado a número decimal antes de operar con él: numero = float(input(\'¿Cuántos años tienes? \')).', order: 20 },
            { id: 'vto-input-int', name: 'int(input(...)) y su ValueError con decimales', description: 'int(input(...)) convierte el texto a entero; pero si el usuario escribe un valor con decimales como "25.5", lanza ValueError: invalid literal for int() with base 10: \'25.5\'.', order: 21 },
            { id: 'vto-tipos-cast', name: 'Funciones de tipo: int(), float(), str(), bool()', description: 'Convierten un valor de un tipo a otro tipo de dato distinto, ej. float(numero_entero) convierte un int en float.', order: 22 },
            { id: 'vto-type', name: 'type() para consultar el tipo de un dato', description: 'type(variable) devuelve la clase del valor, ej. <class \'int\'>, <class \'float\'>, <class \'str\'>.', order: 23 },
            { id: 'vto-bool-truthy', name: 'bool() y valores truthy/falsy', description: 'bool(0) y bool(\'\') (string vacío) son False; cualquier número distinto de 0 (incluido negativo) y cualquier string no vacío son True: bool(1), bool(42), bool(45.3), bool(\'hola\') son todos True.', order: 24 },
            { id: 'vto-nameerror', name: 'NameError: variable no definida', description: 'Si se usa un nombre de variable que no existe (por ejemplo un typo, como "varable" en vez de "variable"), Python lanza NameError: name \'varable\' is not defined.', order: 25 },
            { id: 'vto-constantes', name: 'Constantes en Python (convención, no existen realmente)', description: 'En algunos lenguajes las constantes son variables inmutables; en Python las constantes no existen como tal — una "constante" es solo una variable que el programador decide no modificar a lo largo del código.', order: 26 },
            { id: 'vto-strings-usos', name: 'Strings: para qué se usan', description: 'Las variables de tipo texto son útiles para representar nombres de usuario y contraseñas, direcciones de email, mensajes de error, links, entre otros propósitos.', order: 27 },
            { id: 'vto-strings-comillas-simples-dobles', name: 'Strings: comillas simples y dobles intercambiables', description: 'Comillas simples (\'texto\') y dobles ("texto") son intercambiables; usar un tipo permite incluir el otro dentro del texto sin conflicto, ej. \'El otro día le dije a mi amigo, "Python es mi lenguaje favorito"\'.', order: 28 },
            { id: 'vto-strings-syntaxerror', name: 'SyntaxError al escribir texto sin comillas', description: 'string5 = esto pretende ser un texto (sin comillas) da SyntaxError: invalid syntax, porque Python intenta interpretarlo como código, no como texto.', order: 29 },
            { id: 'vto-strings-triples', name: 'Comillas triples para texto multilínea', description: 'Triple comilla simple (\'\'\'texto\'\'\') permite escribir un string que ocupa varias líneas tal cual, conservando los saltos de línea.', order: 30 },
            { id: 'vto-strings-title', name: 'title(): mayúscula al inicio de cada palabra', description: 'nombre.title() convierte "juan gomez" en "Juan Gomez", poniendo en mayúscula la primera letra de cada palabra.', order: 31 },
            { id: 'vto-strings-upper', name: 'upper(): todo en mayúsculas', description: 'nombre.upper() convierte "juan gomez" en "JUAN GOMEZ".', order: 32 },
            { id: 'vto-strings-lower', name: 'lower(): todo en minúsculas', description: 'nombre.lower() convierte "jUAn goMeZ" en "juan gomez".', order: 33 },
            { id: 'vto-strings-rstrip', name: 'rstrip(): elimina espacios a la derecha', description: 'nombre = \'python \'; nombre.rstrip() devuelve \'python\' sin el espacio final; ojo que rstrip() no modifica la variable original, hay que reasignarla: nombre = nombre.rstrip().', order: 34 },
            { id: 'vto-strings-lstrip', name: 'lstrip(): elimina espacios a la izquierda', description: 'nombre = \' python\'; nombre.lstrip() devuelve \'python\' sin el espacio inicial.', order: 35 },
            { id: 'vto-strings-strip', name: 'strip(): elimina espacios a ambos lados', description: 'nombre = \' python \'; nombre.strip() devuelve \'python\' sin espacios ni al principio ni al final.', order: 36 },
            { id: 'vto-strings-replace', name: 'replace(): sustituir partes de un string', description: 'string.replace(".", " ") sustituye todas las apariciones de "." por un espacio, ej. \'Hola.Mundo\' → \'Hola Mundo\'.', order: 37 },
            { id: 'vto-strings-find', name: 'find(): buscar un string dentro de otro', description: 'string.find(\'Hol\') devuelve el índice donde empieza la coincidencia (0); si no se encuentra, devuelve -1, ej. string.find(\'hey\') → -1.', order: 38 },
            { id: 'vto-strings-startswith', name: 'startswith(): comprueba cómo empieza el string', description: 'string.startswith(\'Hol\') devuelve True/False según si el string empieza exactamente con ese fragmento.', order: 39 },
            { id: 'vto-strings-endswith', name: 'endswith(): comprueba cómo termina el string', description: 'string.endswith(\'do\') devuelve True/False según si el string termina exactamente con ese fragmento.', order: 40 },
            { id: 'vto-strings-concatenar-espacio', name: 'Concatenar strings con + (añadiendo el espacio a mano)', description: 'nombre_completo = nombre + apellido pega las palabras sin espacio (juangomez); hay que concatenar también un espacio explícito: nombre + " " + apellido → "juan gomez".', order: 41 },
            { id: 'vto-strings-concatenar-con-metodos', name: 'Concatenar combinando + con .title()', description: 'mensaje = "¡Hola, " + nombre_completo.title() + "!" combina texto literal, una variable y el resultado de un método en una sola concatenación.', order: 42 },
            { id: 'vto-strings-tab', name: 'Tabulación: \\t', description: 'print("\\tPython") inserta un tabulador antes del texto, desplazándolo visualmente hacia la derecha.', order: 43 },
            { id: 'vto-strings-salto-linea', name: 'Salto de línea: \\n', description: 'print("Lenguajes:\\nPython\\nJavaScript\\nSolidity") imprime cada elemento en una línea distinta usando \\n como separador.', order: 44 },
            { id: 'vto-strings-indices', name: 'Índices de un string: empiezan en 0', description: 'nombre = \'Juan\'; nombre[0] devuelve \'J\', el primer carácter (índice 0).', order: 45 },
            { id: 'vto-strings-slicing', name: 'Slicing de un string: extraer una porción', description: 'usuario[0:5] extrae los caracteres desde el índice 0 hasta el 4 (el límite superior no se incluye); usuario[5:9] extrae la siguiente porción.', order: 46 },
            { id: 'vto-strings-revertir', name: 'Revertir un string con [::-1]', description: 'cadena = \'abcde\'; cadena[::-1] devuelve \'edcba\', el string invertido.', order: 47 },
            { id: 'vto-strings-len', name: 'len() para el tamaño de un string', description: 'len(cadena) devuelve el número de caracteres, ej. len(\'abcde\') → 5.', order: 48 },
            { id: 'vto-numeros-basicos', name: 'Operadores aritméticos básicos: +, -, *, /', description: 'Suma (2+3=5), resta (3-2=1), multiplicación (2*3=6) y división (3/2=1.5, siempre devuelve un float aunque el resultado sea exacto).', order: 49 },
            { id: 'vto-numeros-potencia', name: 'Potencia con **', description: '3**2 = 9, 3**3 = 27, 10**6 = 1000000; ** eleva la base al exponente indicado.', order: 50 },
            { id: 'vto-numeros-modulo', name: 'Módulo o resto con %', description: '4 % 3 = 1, 5 % 3 = 2, 6 % 3 = 0; % devuelve el resto de la división entera (dividendo entre divisor da cociente y resto).', order: 51 },
            { id: 'vto-orden-operaciones', name: 'Orden de las operaciones matemáticas', description: 'Python sigue el orden matemático estándar: 1) contenido de los paréntesis, 2) exponentes, 3) multiplicación y división, 4) suma y resta. Por eso 2 + 3*4 = 14 pero (2 + 3) * 4 = 20.', order: 52 },
            { id: 'vto-floats-basico', name: 'Floats o decimales: operaciones básicas', description: '0.2 + 0.2 = 0.4, 2 * 0.1 = 0.2, 2 * 0.2 = 0.4, 0.2 + 0.5 = 0.7 — la mayoría de operaciones simples con decimales dan el resultado exacto esperado.', order: 53 },
            { id: 'vto-floats-imprecision', name: 'Floats: imprecisión de punto flotante', description: '0.2 + 0.1 da 0.30000000000000004 en vez de 0.3 exacto; 3 * 0.1 también da 0.30000000000000004. Python intenta dar tantos decimales como es posible pero no siempre es exacto.', order: 54 },
            { id: 'vto-floats-por-que', name: 'Por qué ocurre la imprecisión de los floats', description: 'El origen está en cómo los ordenadores están forzados a representar internamente los números decimales; ocurre en todos los lenguajes de programación, no es un fallo específico de Python.', order: 55 },
            { id: 'vto-combinar-numeros-strings-error', name: 'Error al combinar número y string con +', description: 'numero_dias = 365; mensaje = \'El año tiene \' + numero_dias + \'dias\' da TypeError: can only concatenate str (not "int") to str.', order: 56 },
            { id: 'vto-combinar-numeros-strings-solucion', name: 'Solución: envolver el número en str()', description: 'mensaje = \'El año tiene \' + str(numero_dias) + \' dias\' convierte el número a texto antes de concatenar, evitando el TypeError.', order: 57 },
            { id: 'vto-comentarios-que-son', name: 'Comentarios: partes del código ignoradas por el intérprete', description: 'Un comentario es una parte del script que el intérprete ignora — no se ejecuta nunca, sirve solo como texto explicativo para quien lee el código.', order: 58 },
            { id: 'vto-comentarios-objetivo', name: 'Objetivo de los comentarios', description: 'Explicar qué debe hacer el código y cómo funcionan sus distintos segmentos; especialmente importante en trabajos colaborativos o al reutilizar código antiguo.', order: 59 },
            { id: 'vto-comentarios-sintaxis', name: 'Sintaxis de un comentario: #', description: 'La almohadilla # al principio de una línea marca esa línea entera como comentario, ej. # Esto es un comentario.', order: 60 },
            { id: 'vto-comentarios-strings-sueltos', name: 'Truco: strings sueltos como pseudo-comentario', description: 'Un string que no está asignado a ninguna variable (ni simple ni triple-comilla multilínea) es evaluado pero ignorado por el intérprete, por lo que también actúa como un comentario informal.', order: 61 },
        ],
    },
    {
        id: 'tuplas',
        sourceFile: 'Python-Inicial-Clase-01-Teoria-tuplas-y-sets-Diapositivas.pdf',
        title: 'Tuplas',
        emoji: '📦',
        description: 'Qué son las tuplas, su inmutabilidad, rendimiento frente a listas/arrays, y cómo trabajar con ellas — 34 diapositivas.',
        concepts: [
            { id: 'tup-definicion', name: 'Tuplas como listas inmutables', description: 'Una tupla es una colección ordenada que, a diferencia de la lista, no permite añadir, eliminar ni mover elementos una vez creada.', order: 1 },
            { id: 'tup-permite-extraer-porciones', name: 'Extraer porciones de una tupla da una tupla nueva', description: 'Aunque no se puede modificar la tupla original, sí se pueden extraer porciones (slicing); el resultado es siempre una tupla nueva, no la original modificada.', order: 2 },
            { id: 'tup-comprobar-pertenencia-intro', name: 'Las tuplas permiten comprobar pertenencia', description: 'Se puede comprobar si un elemento se encuentra dentro de la tupla, igual que en una lista.', order: 3 },
            { id: 'tup-ventajas', name: 'Ventajas: más rápidas y ocupan menos espacio', description: 'Las tuplas son más rápidas de crear que las listas y ocupan menos espacio en memoria (mayor optimización); además pueden usarse como llaves de un diccionario.', order: 4 },
            { id: 'tup-como-llave-diccionario', name: 'Tuplas como llaves de un diccionario', description: 'Al ser inmutables, las tuplas pueden usarse como clave (key) de un diccionario, algo que una lista no puede hacer.', order: 5 },
            { id: 'tup-cuando-usar', name: 'Cuándo conviene usar una tupla', description: 'Si necesitamos guardar varios elementos pero en el futuro solo queremos recorrerlos para verlos (sin modificarlos), conviene usar una tupla en vez de una lista.', order: 6 },
            { id: 'tup-sintaxis-con-parentesis', name: 'Sintaxis de una tupla: con paréntesis', description: 'mi_tupla_1 = ("fruta", 45, True); print(type(mi_tupla_1)) devuelve <class \'tuple\'>.', order: 7 },
            { id: 'tup-sintaxis-sin-parentesis', name: 'Sintaxis de una tupla: sin paréntesis', description: 'mi_tupla_2 = "fruta", 45, True también crea una tupla (<class \'tuple\'>) — los paréntesis son opcionales.', order: 8 },
            { id: 'tup-acceso-indices', name: 'Acceder a elementos por índice', description: 'mi_tupla_1[1] devuelve el elemento en la posición 1 (los índices empiezan en 0), ej. de ("fruta", 45, True) devuelve 45.', order: 9 },
            { id: 'tup-inmutabilidad-reasignar', name: 'Inmutabilidad: TypeError al reasignar un elemento', description: 'mi_tupla[0] = 4 da TypeError: \'tuple\' object does not support item assignment.', order: 10 },
            { id: 'tup-inmutabilidad-append', name: 'Inmutabilidad: AttributeError con append()', description: 'mi_tupla.append(4) da AttributeError: \'tuple\' object has no attribute \'append\' — el método append() no existe en las tuplas.', order: 11 },
            { id: 'tup-inmutabilidad-insert', name: 'Inmutabilidad: AttributeError con insert()', description: 'mi_tupla.insert(0,4) da AttributeError: \'tuple\' object has no attribute \'insert\'.', order: 12 },
            { id: 'tup-memoria', name: 'Espacio en memoria: tupla vs lista (sys.getsizeof)', description: 'Con los mismos elementos, una lista ocupa 120 bytes y la tupla equivalente ocupa 80 bytes (sys.getsizeof); la tupla ocupa aproximadamente 1.5 veces menos espacio.', order: 13 },
            { id: 'tup-tiempo-creacion', name: 'Tiempo de creación: tupla vs lista (timeit)', description: 'Con timeit.timeit(number=10000000), crear una lista tarda ~0.245s y crear la tupla equivalente ~0.037s — la tupla se crea aproximadamente 8 veces más rápido.', order: 14 },
            { id: 'tup-tabla-comparativa', name: 'Tabla: Listas vs Arrays vs Tuplas', description: 'Mutabilidad (mutable/mutable/inmutable), acceso (índice o slicing en las 3), tamaño (dinámico/fijo/fijo), tipo de elementos (mixto/homogéneo/mixto), eficiencia (listas menos eficientes que arrays y tuplas) y uso principal de cada una.', order: 15 },
            { id: 'tup-conversion-lista-a-tupla', name: 'Convertir una lista en tupla con tuple()', description: 'mi_lista = [0,1,2,"hola",True]; mi_tupla = tuple(mi_lista) convierte la lista en una tupla equivalente.', order: 16 },
            { id: 'tup-conversion-tupla-a-lista', name: 'Convertir una tupla en lista con list()', description: 'mi_tupla = (0,1,2,"hola",True); mi_lista = list(mi_tupla) convierte la tupla en una lista equivalente.', order: 17 },
            { id: 'tup-slicing', name: 'Slicing de una tupla', description: 'mi_tupla[1:3] sobre (1,2,3,4,5) devuelve (2,3), los elementos desde el índice 1 hasta el 2 (el límite superior no se incluye).', order: 18 },
            { id: 'tup-pertenencia-in', name: 'Comprobar pertenencia con in', description: '"fruta" in mi_tupla_1 devuelve True/False según si el elemento existe en la tupla, ej. 100 in mi_tupla_1 → False.', order: 19 },
            { id: 'tup-len', name: 'len() para el número de elementos', description: 'len(mi_tupla) sobre ("fruta", 45, True) devuelve 3.', order: 20 },
            { id: 'tup-count', name: 'count() para contar apariciones', description: 'mi_tupla.count(45) cuenta cuántas veces aparece 45 en la tupla; si el valor no existe, devuelve 0 (no da error).', order: 21 },
            { id: 'tup-index', name: 'index() para la posición de un elemento', description: 'mi_tupla.index(45) devuelve la posición de la primera aparición de 45 en la tupla.', order: 22 },
            { id: 'tup-max-min', name: 'max() y min() sobre una tupla', description: 'Sobre (3,1,4,1,5,9,2,6,5), max(mi_tupla) devuelve 9 y min(mi_tupla) devuelve 1.', order: 23 },
            { id: 'tup-sorted', name: 'sorted() ordena pero devuelve una LISTA', description: 'sorted(mi_tupla) ordena los elementos pero el resultado es de tipo list, no tuple; para mantenerlo como tupla hay que envolverlo: tuple(sorted(mi_tupla)).', order: 24 },
            { id: 'tup-reversed', name: 'reversed() devuelve un objeto "reversed"', description: 'reversed(mi_tupla) no devuelve directamente una tupla ni una lista, sino un objeto de tipo reversed; para verlo como tupla hay que envolverlo: tuple(reversed(mi_tupla)).', order: 25 },
            { id: 'tup-combinar-zip', name: 'Combinar tuplas con zip()', description: 'tupla1 = (1,2,3); tupla2 = (\'a\',\'b\',\'c\'); tupla_combinada = tuple(zip(tupla1, tupla2)) crea una tupla de pares emparejando elemento a elemento: ((1,\'a\'),(2,\'b\'),(3,\'c\')).', order: 26 },
            { id: 'tup-tupla-de-tuplas-acceso', name: 'Tupla de tuplas: acceso a elementos anidados', description: 'mi_tupla = ((1,\'a\'),(2,\'b\'),(3,\'c\')); mi_tupla[0][0] accede al primer elemento de la primera tupla interior (1); mi_tupla[1][1] accede al segundo elemento de la segunda tupla interior (\'b\').', order: 27 },
            { id: 'tup-tupla-de-tuplas-slicing', name: 'Tupla de tuplas: slicing de la tupla interior y de la exterior', description: 'mi_tupla[1] extrae toda la tupla interior en esa posición; mi_tupla[0:2] extrae una porción de la tupla exterior (varias tuplas interiores); mi_tupla[2][0:2] aplica slicing dentro de una tupla interior concreta.', order: 28 },
            { id: 'tup-unitaria', name: 'Tupla unitaria: la coma final es obligatoria', description: 'mi_tupla = (1) es solo un int entre paréntesis (<class \'int\'>); mi_tupla = (1,) con la coma sí es una tupla de un elemento (<class \'tuple\'>).', order: 29 },
            { id: 'tup-empaquetado', name: 'Empaquetado (packing) de una tupla', description: 'mi_tupla = "fruta", 45, True empaqueta varios valores sueltos en una única tupla.', order: 30 },
            { id: 'tup-desempaquetado', name: 'Desempaquetado (unpacking) de una tupla', description: 'string, entero, booleano = mi_tupla desempaqueta cada valor de la tupla en una variable distinta, en el mismo orden.', order: 31 },
            { id: 'tup-error-desempaquetado-pocas-variables', name: 'Error de desempaquetado: demasiados valores', description: 'Si se desempaqueta una tupla de 3 elementos en solo 2 variables (string, entero = mi_tupla), da ValueError: too many values to unpack (expected 2).', order: 32 },
            { id: 'tup-error-desempaquetado-muchas-variables', name: 'Error de desempaquetado: pocos valores', description: 'Si se desempaqueta una tupla de 3 elementos en 4 variables, da ValueError: not enough values to unpack (expected 4, got 3).', order: 33 },
        ],
    },
    {
        id: 'sets',
        sourceFile: 'Python-Inicial-Clase-02-Teoria-tuplas-y-sets-Diapositivas.pdf',
        title: 'Sets (Conjuntos)',
        emoji: '🧮',
        description: 'Qué son los sets, por qué son eficientes (hash table), y las operaciones de conjuntos — 26 diapositivas.',
        concepts: [
            { id: 'set-definicion', name: 'Sets: colecciones no ordenadas de elementos únicos e inmutables', description: 'Un set es una colección sin orden garantizado y sin duplicados; los elementos en sí son inmutables, aunque la colección permite añadir y borrar elementos.', order: 1 },
            { id: 'set-sin-indice-asociado', name: 'Los elementos de un set no llevan un índice asociado', description: 'A diferencia de listas y tuplas, ningún elemento de un set tiene una posición numérica fija.', order: 2 },
            { id: 'set-no-reasignar', name: 'No se pueden reasignar valores a los elementos del set', description: 'Aunque se pueden añadir y borrar elementos completos, no se puede cambiar el valor de un elemento existente por su posición (porque no tiene posición).', order: 3 },
            { id: 'set-unicidad-intro', name: 'Los elementos de un set son únicos: no hay duplicados', description: 'Un set nunca contiene el mismo valor dos veces.', order: 4 },
            { id: 'set-sintaxis-basica', name: 'Sintaxis básica de un set: {}', description: 'mi_set = {\'fruta\', 45, True} crea un set con esos tres elementos; print(mi_set) muestra <class \'set\'>.', order: 5 },
            { id: 'set-vacio-cuidado', name: 'Set vacío: CUIDADO con {} — crea un diccionario', description: 'mi_set = {} crea un diccionario (<class \'dict\'>), no un set vacío; para crear un set vacío hay que usar explícitamente mi_set = set() (<class \'set\'>).', order: 6 },
            { id: 'set-ausencia-orden', name: 'Ausencia de ordenamiento', description: 'El orden en que se imprime un set no tiene por qué coincidir con el orden en que se insertaron los elementos, ej. {\'manzana\',\'naranja\',\'plátano\'} puede imprimirse como {\'naranja\', \'plátano\', \'manzana\'}.', order: 7 },
            { id: 'set-sin-indices-error', name: 'Los sets no tienen índices (TypeError)', description: 'set_frutas[0] lanza TypeError: \'set\' object is not subscriptable porque los elementos no tienen posición.', order: 8 },
            { id: 'set-inmutabilidad-reasignar', name: 'Inmutabilidad: TypeError al reasignar un elemento', description: 'set_frutas[0] = "pera" da TypeError: \'set\' object does not support item assignment.', order: 9 },
            { id: 'set-unicidad-ejemplo', name: 'Unicidad: valores repetidos se eliminan automáticamente', description: 'set_frutas = {\'manzana\',\'manzana\',\'naranja\',\'plátano\'} da como resultado un set con una sola copia de \'manzana\': {\'naranja\', \'plátano\', \'manzana\'}.', order: 10 },
            { id: 'set-pertenencia-eficiencia', name: 'Comprobar pertenencia con in — más eficiente que en listas', description: 'Las pruebas de pertenencia (\'manzana\' in frutas) son mucho más eficientes en sets que en listas.', order: 11 },
            { id: 'set-por-que-eficiente', name: 'Por qué los sets son más eficientes: hash table', description: 'En una lista, comprobar pertenencia recorre todos los elementos hasta encontrar (o no) coincidencia. Un set es una tabla de hash: cada elemento tiene un hash único que determina su posición fija ("bucket"), y Python solo comprueba directamente ese bucket.', order: 12 },
            { id: 'set-tabla-propiedades', name: 'Tabla de propiedades: Lista vs Array vs Tupla vs Conjunto', description: 'Comparación por Definición, Sintaxis, Índices (sí/sí/sí/no), Modificable (sí/sí/no/sí), Homogeneidad (no/sí/no/no), Tamaño fijo (no/sí/sí/no), Únicos (no/no/no/sí) e Iterables (sí en los 4).', order: 13 },
            { id: 'set-add', name: 'add() para añadir un elemento', description: 'frutas.add(\'fresa\') añade un nuevo elemento al set.', order: 14 },
            { id: 'set-remove', name: 'remove() para borrar un elemento', description: 'frutas.remove(\'naranja\') elimina ese elemento del set.', order: 15 },
            { id: 'set-discard', name: 'discard() para borrar un elemento', description: 'frutas.discard(\'naranja\') elimina ese elemento del set, con un comportamiento distinto a remove() cuando el elemento no existe.', order: 16 },
            { id: 'set-remove-vs-discard', name: 'Diferencia entre remove() y discard()', description: 'Si el elemento a borrar no existe en el set, remove() lanza KeyError (ej. KeyError: \'fresa\'); discard() simplemente no hace nada, sin lanzar error.', order: 17 },
            { id: 'set-lista-a-set', name: 'Convertir una lista en set con set()', description: 'mi_lista = [\'manzana\',\'naranja\',\'plátano\']; mi_set = set(mi_lista) convierte la lista en un set equivalente (sin duplicados y sin orden garantizado).', order: 18 },
            { id: 'set-set-a-lista', name: 'Convertir un set en lista con list()', description: 'mi_set = {\'manzana\',\'naranja\',\'plátano\'}; mi_lista = list(mi_set) convierte el set de vuelta a una lista.', order: 19 },
            { id: 'set-eliminar-duplicados-ejemplo', name: 'Eliminar duplicados de una lista usando set()', description: 'lista_alumnos = ["Pedro","Lucas","Juan","Lucas"]; set_alumnos = set(lista_alumnos); lista_alumnos_unico = list(set_alumnos) da [\'Pedro\', \'Lucas\', \'Juan\'], sin el "Lucas" repetido.', order: 20 },
            { id: 'set-union', name: 'Unión de conjuntos: | y union()', description: 'set1 = {1,2,3}; set2 = {3,4,5}; set1 | set2 y set1.union(set2) devuelven ambos {1,2,3,4,5}, todos los elementos presentes en cualquiera de los dos sets.', order: 21 },
            { id: 'set-interseccion', name: 'Intersección de conjuntos: & e intersection()', description: 'set1 & set2 y set1.intersection(set2) sobre {1,2,3} y {3,4,5} devuelven ambos {3}, solo los elementos presentes en AMBOS sets.', order: 22 },
            { id: 'set-diferencia', name: 'Diferencia de conjuntos: - y difference()', description: 'set1 - set2 y set1.difference(set2) sobre {1,2,3} y {3,4,5} devuelven ambos {1,2}, los elementos de set1 que NO están en set2.', order: 23 },
            { id: 'set-diferencia-simetrica', name: 'Diferencia simétrica: ^ y symmetric_difference()', description: 'set1 ^ set2 y set1.symmetric_difference(set2) sobre {1,2,3} y {3,4,5} devuelven ambos {1,2,4,5}, los elementos que están en uno de los dos sets pero no en ambos a la vez.', order: 24 },
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
