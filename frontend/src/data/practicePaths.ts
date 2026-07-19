/**
 * LEARNING BLOCKS — Bloques pedagógicos del módulo "Mejora"
 *
 * Un bloque NO es "un PDF". Es un tema de aprendizaje coherente, definido a
 * partir del contenido real de los PDFs (conceptos, dificultad, relación
 * entre temas y orden natural de aprendizaje de Python) — no por el nombre
 * del archivo. Un bloque puede agrupar varios PDFs si pertenecen al mismo
 * tema pedagógico, o quedarse en uno solo si el tema lo justifica.
 *
 * Claude diseña estos bloques a mano tras leer cada PDF completo. No es una
 * clasificación automática ni un resumen — cada concepto viene de una idea
 * real explicada en las diapositivas.
 *
 * REGLA CLAVE para el módulo Mejora: cuando el alumno entra a un bloque,
 * SOLO practica con los conceptos de ese bloque. Nunca se mezclan conceptos
 * de bloques distintos, aunque un bloque sí pueda combinar varios PDFs que
 * pertenecen genuinamente al mismo tema (ver `sources`).
 *
 * CÓMO AÑADIR CONTENIDO NUEVO:
 * 1. El usuario comparte uno o más PDFs con Claude en el chat.
 * 2. Claude decide: ¿encajan en un bloque ya existente (mismo tema), forman
 *    un bloque nuevo, o deberían dividir/fusionar bloques existentes?
 * 3. Se actualiza `LEARNING_BLOCKS` en consecuencia — añadiendo conceptos,
 *    una nueva `source`, o un bloque entero con sus prerequisites.
 * 4. No hace falta tocar ningún otro archivo — masteryEngine.ts, el panel
 *    "Mejora" (ImprovePage.tsx) y MentorPage.tsx leen este array.
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

export interface BlockSource {
    /** Nombre de archivo original del PDF, para que el usuario lo reconozca. */
    fileName: string;
    /** Contenido real del PDF (diapositivas en orden, con código y salidas). */
    rawText: string;
}

export interface LearningBlock {
    id: string;
    title: string;
    emoji: string;
    /** Qué aprende el alumno en este bloque. */
    description: string;
    /** Por qué estos PDFs concretos están agrupados en un mismo bloque. */
    reason: string;
    /** Ids de otros LearningBlock que conviene haber completado antes. */
    prerequisites: string[];
    concepts: PracticeConcept[];
    /** Uno o más PDFs que componen este bloque. */
    sources: BlockSource[];
}

export const LEARNING_BLOCKS: LearningBlock[] = [
    {
        id: 'fundamentos-python',
        title: 'Fundamentos de Python: Variables, Tipos y Operaciones',
        emoji: '🔤',
        description: 'La base absoluta antes de tocar cualquier estructura de datos: qué es Python, cómo se crean y nombran las variables, los tipos de datos básicos, cómo trabajar con texto (strings) y números, y buenas prácticas como comentar el código.',
        reason: 'Es un único PDF, pero es intencionadamente el punto de partida del curso: introduce el lenguaje y los tipos de datos primitivos (int, float, str, bool) que después se usan como elementos dentro de listas, tuplas y sets. Ningún otro bloque tiene sentido sin este.',
        prerequisites: [],
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
            { id: 'vto-asignacion-multiple-valores-distintos', name: 'Asignación múltiple: valores distintos en una línea', description: 'x, y, z = 10, 20, 30 asigna un valor distinto a cada variable en una sola línea; funciona igual con strings o mezclando tipos (x, y, z = \'texto 1\', 120.3, 42).', order: 16 },
            { id: 'vto-input-basico', name: 'input() para leer texto por teclado', description: 'input() muestra opcionalmente un mensaje y espera que el usuario escriba algo por teclado; el valor devuelto siempre es de tipo string.', order: 17 },
            { id: 'vto-input-con-mensaje-inline', name: 'input("mensaje ") en la misma línea', description: 'nombre = input(\'¿Cómo te llamas? \') muestra la pregunta y captura la respuesta en la misma línea, en vez de necesitar un print() previo por separado.', order: 18 },
            { id: 'vto-input-error-tipo', name: 'Error típico: operar con el resultado de input() sin convertir', description: 'numero = input(\'¿Cuántos años tienes? \'); 365.0*numero da TypeError: can\'t multiply sequence by non-int of type \'float\' porque input() devuelve un string, no un número.', order: 19 },
            { id: 'vto-input-float', name: 'Solución: float(input(...))', description: 'Envolver input() en float() convierte directamente el texto capturado a número decimal antes de operar con él.', order: 20 },
            { id: 'vto-input-int', name: 'int(input(...)) y su ValueError con decimales', description: 'int(input(...)) convierte el texto a entero; pero si el usuario escribe un valor con decimales como "25.5", lanza ValueError: invalid literal for int() with base 10: \'25.5\'.', order: 21 },
            { id: 'vto-tipos-cast', name: 'Funciones de tipo: int(), float(), str(), bool()', description: 'Convierten un valor de un tipo a otro tipo de dato distinto, ej. float(numero_entero) convierte un int en float.', order: 22 },
            { id: 'vto-type', name: 'type() para consultar el tipo de un dato', description: 'type(variable) devuelve la clase del valor, ej. <class \'int\'>, <class \'float\'>, <class \'str\'>.', order: 23 },
            { id: 'vto-bool-truthy', name: 'bool() y valores truthy/falsy', description: 'bool(0) y bool(\'\') (string vacío) son False; cualquier número distinto de 0 (incluido negativo) y cualquier string no vacío son True.', order: 24 },
            { id: 'vto-nameerror', name: 'NameError: variable no definida', description: 'Si se usa un nombre de variable que no existe (por ejemplo un typo), Python lanza NameError: name \'varable\' is not defined.', order: 25 },
            { id: 'vto-constantes', name: 'Constantes en Python (convención, no existen realmente)', description: 'En Python las constantes no existen como tal — una "constante" es solo una variable que el programador decide no modificar a lo largo del código.', order: 26 },
            { id: 'vto-strings-usos', name: 'Strings: para qué se usan', description: 'Las variables de tipo texto son útiles para nombres de usuario y contraseñas, direcciones de email, mensajes de error, links, entre otros propósitos.', order: 27 },
            { id: 'vto-strings-comillas-simples-dobles', name: 'Strings: comillas simples y dobles intercambiables', description: 'Comillas simples (\'texto\') y dobles ("texto") son intercambiables; usar un tipo permite incluir el otro dentro del texto sin conflicto.', order: 28 },
            { id: 'vto-strings-syntaxerror', name: 'SyntaxError al escribir texto sin comillas', description: 'string5 = esto pretende ser un texto (sin comillas) da SyntaxError: invalid syntax, porque Python intenta interpretarlo como código, no como texto.', order: 29 },
            { id: 'vto-strings-triples', name: 'Comillas triples para texto multilínea', description: 'Triple comilla simple (\'\'\'texto\'\'\') permite escribir un string que ocupa varias líneas tal cual, conservando los saltos de línea.', order: 30 },
            { id: 'vto-strings-title', name: 'title(): mayúscula al inicio de cada palabra', description: 'nombre.title() convierte "juan gomez" en "Juan Gomez", poniendo en mayúscula la primera letra de cada palabra.', order: 31 },
            { id: 'vto-strings-upper', name: 'upper(): todo en mayúsculas', description: 'nombre.upper() convierte "juan gomez" en "JUAN GOMEZ".', order: 32 },
            { id: 'vto-strings-lower', name: 'lower(): todo en minúsculas', description: 'nombre.lower() convierte "jUAn goMeZ" en "juan gomez".', order: 33 },
            { id: 'vto-strings-rstrip', name: 'rstrip(): elimina espacios a la derecha', description: 'nombre.rstrip() elimina espacios al final del string; no modifica la variable original, hay que reasignarla: nombre = nombre.rstrip().', order: 34 },
            { id: 'vto-strings-lstrip', name: 'lstrip(): elimina espacios a la izquierda', description: 'nombre.lstrip() elimina espacios al principio del string.', order: 35 },
            { id: 'vto-strings-strip', name: 'strip(): elimina espacios a ambos lados', description: 'nombre.strip() elimina espacios tanto al principio como al final del string.', order: 36 },
            { id: 'vto-strings-replace', name: 'replace(): sustituir partes de un string', description: 'string.replace(".", " ") sustituye todas las apariciones de "." por un espacio, ej. \'Hola.Mundo\' → \'Hola Mundo\'.', order: 37 },
            { id: 'vto-strings-find', name: 'find(): buscar un string dentro de otro', description: 'string.find(\'Hol\') devuelve el índice donde empieza la coincidencia; si no se encuentra, devuelve -1.', order: 38 },
            { id: 'vto-strings-startswith', name: 'startswith(): comprueba cómo empieza el string', description: 'string.startswith(\'Hol\') devuelve True/False según si el string empieza exactamente con ese fragmento.', order: 39 },
            { id: 'vto-strings-endswith', name: 'endswith(): comprueba cómo termina el string', description: 'string.endswith(\'do\') devuelve True/False según si el string termina exactamente con ese fragmento.', order: 40 },
            { id: 'vto-strings-concatenar-espacio', name: 'Concatenar strings con + (añadiendo el espacio a mano)', description: 'nombre + apellido pega las palabras sin espacio; hay que concatenar también un espacio explícito: nombre + " " + apellido.', order: 41 },
            { id: 'vto-strings-concatenar-con-metodos', name: 'Concatenar combinando + con .title()', description: 'mensaje = "¡Hola, " + nombre_completo.title() + "!" combina texto literal, una variable y el resultado de un método en una sola concatenación.', order: 42 },
            { id: 'vto-strings-tab', name: 'Tabulación: \\t', description: 'print("\\tPython") inserta un tabulador antes del texto, desplazándolo visualmente hacia la derecha.', order: 43 },
            { id: 'vto-strings-salto-linea', name: 'Salto de línea: \\n', description: 'print("Lenguajes:\\nPython\\nJavaScript\\nSolidity") imprime cada elemento en una línea distinta usando \\n como separador.', order: 44 },
            { id: 'vto-strings-indices', name: 'Índices de un string: empiezan en 0', description: 'nombre = \'Juan\'; nombre[0] devuelve \'J\', el primer carácter (índice 0).', order: 45 },
            { id: 'vto-strings-slicing', name: 'Slicing de un string: extraer una porción', description: 'usuario[0:5] extrae los caracteres desde el índice 0 hasta el 4 (el límite superior no se incluye).', order: 46 },
            { id: 'vto-strings-revertir', name: 'Revertir un string con [::-1]', description: 'cadena = \'abcde\'; cadena[::-1] devuelve \'edcba\', el string invertido.', order: 47 },
            { id: 'vto-strings-len', name: 'len() para el tamaño de un string', description: 'len(cadena) devuelve el número de caracteres, ej. len(\'abcde\') → 5.', order: 48 },
            { id: 'vto-numeros-basicos', name: 'Operadores aritméticos básicos: +, -, *, /', description: 'Suma (2+3=5), resta (3-2=1), multiplicación (2*3=6) y división (3/2=1.5, siempre devuelve un float aunque el resultado sea exacto).', order: 49 },
            { id: 'vto-numeros-potencia', name: 'Potencia con **', description: '3**2 = 9, 3**3 = 27, 10**6 = 1000000; ** eleva la base al exponente indicado.', order: 50 },
            { id: 'vto-numeros-modulo', name: 'Módulo o resto con %', description: '4 % 3 = 1, 5 % 3 = 2, 6 % 3 = 0; % devuelve el resto de la división entera (dividendo entre divisor da cociente y resto).', order: 51 },
            { id: 'vto-orden-operaciones', name: 'Orden de las operaciones matemáticas', description: 'Python sigue el orden matemático estándar: 1) paréntesis, 2) exponentes, 3) multiplicación y división, 4) suma y resta.', order: 52 },
            { id: 'vto-floats-basico', name: 'Floats o decimales: operaciones básicas', description: '0.2 + 0.2 = 0.4, 2 * 0.1 = 0.2, 2 * 0.2 = 0.4, 0.2 + 0.5 = 0.7 — la mayoría de operaciones simples con decimales dan el resultado exacto esperado.', order: 53 },
            { id: 'vto-floats-imprecision', name: 'Floats: imprecisión de punto flotante', description: '0.2 + 0.1 da 0.30000000000000004 en vez de 0.3 exacto; 3 * 0.1 también da 0.30000000000000004.', order: 54 },
            { id: 'vto-floats-por-que', name: 'Por qué ocurre la imprecisión de los floats', description: 'El origen está en cómo los ordenadores están forzados a representar internamente los números decimales; ocurre en todos los lenguajes de programación, no es un fallo específico de Python.', order: 55 },
            { id: 'vto-combinar-numeros-strings-error', name: 'Error al combinar número y string con +', description: 'numero_dias = 365; mensaje = \'El año tiene \' + numero_dias + \'dias\' da TypeError: can only concatenate str (not "int") to str.', order: 56 },
            { id: 'vto-combinar-numeros-strings-solucion', name: 'Solución: envolver el número en str()', description: 'mensaje = \'El año tiene \' + str(numero_dias) + \' dias\' convierte el número a texto antes de concatenar, evitando el TypeError.', order: 57 },
            { id: 'vto-comentarios-que-son', name: 'Comentarios: partes del código ignoradas por el intérprete', description: 'Un comentario es una parte del script que el intérprete ignora — no se ejecuta nunca, sirve solo como texto explicativo para quien lee el código.', order: 58 },
            { id: 'vto-comentarios-objetivo', name: 'Objetivo de los comentarios', description: 'Explicar qué debe hacer el código y cómo funcionan sus distintos segmentos; especialmente importante en trabajos colaborativos o al reutilizar código antiguo.', order: 59 },
            { id: 'vto-comentarios-sintaxis', name: 'Sintaxis de un comentario: #', description: 'La almohadilla # al principio de una línea marca esa línea entera como comentario.', order: 60 },
            { id: 'vto-comentarios-strings-sueltos', name: 'Truco: strings sueltos como pseudo-comentario', description: 'Un string que no está asignado a ninguna variable (ni simple ni triple-comilla multilínea) es evaluado pero ignorado por el intérprete, por lo que también actúa como un comentario informal.', order: 61 },
        ],
        sources: [
            {
                fileName: 'Variables, Tipos de Datos y Operaciones Básicas.pdf',
                rawText: `QUE ES PYTHON
Lenguaje creado en los años 80 por Guido van Rossum en el Centro para las Matemáticas y la Informática CWI de los países bajos.
Multiplataforma: Unix, Linux, MacOS, Windows.
Multiparadigma (alto nivel): permite programación orientada a objetos, programación estructurada y programación funcional.
Sintaxis compacta, sencilla e intuitiva, con una curva de aprendizaje mínima y una potente librería de funciones y clases.
Un programa de Python no se compila sino que se ejecuta directamente (usa un intérprete). Eso permite hacer cosas imposibles en otros lenguajes como ejecutar instrucciones de manera interactiva, crear funciones al vuelo mientras un programa se ejecuta, interpretar un string como código Python y ejecutarlo, etc.

LINEA DE COMANDOS VS SCRIPTS
Se puede escribir Python directamente en la terminal en modo interactivo:
>>> 'Esto es una linea de comandos de python'
'Esto es una linea de comandos de python'
>>> 3+2
5
>>> exit()
O se puede guardar el código en un archivo .py (script) y ejecutarlo completo de una vez, por ejemplo un archivo suma.py con: print(3+2)

VARIABLES
Definición: Espacio reservado en memoria que tiene asignado un identificador.
En pseudocódigo se DECLARA la variable indicando su tipo antes de usarla:
Definir sumaTotal Como Entero
Definir precio Como Real
Definir nota Como Texto
Definir terminado Como Logica
Luego se INICIALIZA asignándole un valor:
sumaTotal = 12
precio = 20.5
nota = "Hola"
terminado = Falso
En PYTHON NO declaramos las variables. Las variables se inicializan directamente:
numero_entero = 42
numero_decimal = 12.5
texto = 'hola'
variable_logica = True
Inicialización explícita usando las funciones de tipo:
numero_entero = int(42)
numero_decimal = float(12.5)
texto = str('hola')
variable_logica = bool(True)
Modificación de una variable ya creada (reasignación, usando su propio valor anterior):
numero_entero = numero_entero + 4
numero_decimal = 12.5 + 4.6
texto = 'adios'
variable_logica = False

VARIABLES - NOMENCLATURA
Los nombres pueden contener solo letras, números y barras bajas: my_variable_1, _my_variable_1 ✓
Pueden comenzar por una letra o una barra baja pero NUNCA por un número: 1_my_variable ✗
Los espacios no están permitidos, se pueden usar barras bajas para separar palabras: "my variable" ✗
No se deben usar palabras ya asociadas a funciones internas de python, por ejemplo: print ✗
Los nombres de variables deben ser cortos pero descriptivos: nombre >> n, nombre_estudiante >> n_e, tamaño_nombre >> tamaño_del_nombre_de_las_personas
Cuidado al usar la ele minúscula 'l', la i mayúscula 'I' y la letra o mayúscula 'O'. Al leer el código se pueden confundir con los números '1', '0'.

VARIABLES - ASIGNACIÓN MÚLTIPLE
x = y = z = 10
print(x,y,z)  →  10 10 10
x, y, z = 10,20,30
print(x,y,z)  →  10 20 30
x, y, z = 'texto 1', 'texto 2', 'texto2'
print(x,y,z)  →  texto 1 texto 2 texto2
x, y, z = 'texto 1', 120.3, 42
print(x,y,z)  →  texto 1 120.3 42

VARIABLES - PEDIR VALORES
La función input() permite obtener texto escrito por teclado. Siempre devuelve un string.
print('¿Cómo te llamas?')
nombre = input()
print('Me alegro de conocerte', nombre)
Se puede pasar el mensaje directamente a input(): nombre = input('¿Cómo te llamas? ')
Error típico al operar sin convertir el tipo:
numero = input('¿Cúantos años tienes? ')
print('Entonces has vivido aproximadamente', 365.0*numero, 'dias')
TypeError: can't multiply sequence by non-int of type 'float'
Solución con float(): numero = float(input('¿Cúantos años tienes? ')) → funciona (9125.0 dias)
Con int(): numero = int(input('¿Cúantos años tienes? ')) → funciona con valores enteros (9125 dias), pero si el usuario escribe "25.5":
ValueError: invalid literal for int() with base 10: '25.5'

VARIABLES - TIPOS
Las funciones int(), float(), str() y bool() son funciones de tipo: convierten un tipo de dato en otro.
numero_entero = 42; numero_decimal = float(numero_entero); print(numero_decimal) → 42.0
La función type() devuelve el tipo de dato: type(numero_entero), type(numero_decimal), type(numero_texto) → <class 'int'> <class 'float'> <class 'str'>
bool(0) → False; bool(1) → True; bool(42) → True; bool(45.3) → True; bool('hola') → True; bool('') → False

VARIABLES - ERRORES TÍPICOS
variable = 'esta es mi variable'
print(varable)
NameError: name 'varable' is not defined

CONSTANTES
CONSTANTE = VARIABLE. En algunos lenguajes de programación estas variables son inmutables. En Python las constantes no existen como tal: una constante será una variable que no variaremos a lo largo de nuestro código.

STRINGS
Variables de tipo texto. Son útiles para muchísimos propósitos: representar nombres de usuario y contraseñas, direcciones de email, mensajes de error, links…
string1 = "Esto es un texto"
string2 = 'Esto tambien es un texto'
string3 = 'El otro dia le dije a mi amigo, "Python es mi lenguaje favorito"'
Comillas simples y dobles son intercambiables. Sin comillas da error:
string5 = esto pretende ser un texto
SyntaxError: invalid syntax
Comillas triples para texto multilínea:
string4 = '''
Este texto es completamente inventado:
Lorem ipsum dolor sit amet...
'''

STRINGS - MÉTODOS
title(): nombre = 'juan gomez'; nombre.title() → Juan Gomez
upper(): nombre.upper() → JUAN GOMEZ
lower(): nombre = 'jUAn goMeZ'; nombre.lower() → juan gomez
rstrip() (elimina espacios a la derecha): nombre = 'python '; nombre.rstrip() → 'python' (ojo: no modifica la variable, hay que reasignar: nombre = nombre.rstrip())
lstrip() (elimina espacios a la izquierda): nombre = ' python'; nombre.lstrip() → 'python'
strip() (elimina espacios a ambos lados): nombre = ' python '; nombre.strip() → 'python'
replace(): string = 'Hola.Mundo'; string.replace(".", " ") → 'Hola Mundo'
find(): string = 'Hola Mundo'; string.find('Hol') → 0; string.find('do') → 8; string.find('hey') → -1
startswith(): string.startswith('Hol') → True; string.startswith('Mun') → False
endswith(): string.endswith('do') → True; string.endswith('Ho') → False

STRINGS - CONCATENAR
nombre = 'juan'; apellido = 'gomez'; nombre_completo = nombre + apellido → 'juangomez' (sin espacio)
nombre_completo = nombre + " " + apellido → 'juan gomez'
mensaje = "¡Hola, " + nombre_completo.title() + "!" → '¡Hola, Juan Gomez!'
Tab: print("\\tPython") inserta un tabulador.
Salto de línea: print("Lenguajes:\\nPython\\nJavaScript\\nSolidity") imprime cada uno en su línea.

STRINGS - ÍNDICES Y SLICING
Los índices comienzan en 0: nombre = 'Juan'; nombre[0] → 'J'
Extraer partes: usuario = 'YoSoyJuan'; usuario[0:5] → 'YoSoy'; usuario[5:9] → 'Juan'
Revertir un string: cadena = 'abcde'; cadena[::-1] → 'edcba'
Tamaño de un string: len(cadena) → 5

NÚMEROS
Enteros: suma (+), resta (-), multiplicación (*), división (/, siempre float): 2+3=5, 3-2=1, 2*3=6, 3/2=1.5
Potencia (**): 3**2=9, 3**3=27, 10**6=1000000
Módulo o resto (%): 4%3=1, 5%3=2, 6%3=0 (dividendo entre divisor da cociente y resto)
Orden de las operaciones: 1) paréntesis, 2) exponentes, 3) multiplicación y división, 4) suma y resta. 2 + 3*4 = 14, (2 + 3) * 4 = 20
Floats: 0.2+0.2=0.4, 2*0.1=0.2, 2*0.2=0.4, 0.2+0.5=0.7 — pero 0.2+0.1 → 0.30000000000000004, 3*0.1 → 0.30000000000000004. El origen de esta imprecisión está en cómo los ordenadores representan internamente los números; ocurre en todos los lenguajes de programación.

COMBINAR NÚMEROS Y STRINGS
numero_dias = 365; mensaje = 'El año tiene ' + numero_dias + 'dias'
TypeError: can only concatenate str (not "int") to str
Solución: mensaje = 'El año tiene ' + str(numero_dias) + ' dias' → 'El año tiene 365 dias'

COMENTARIOS
Partes del script ignoradas por el intérprete — no se ejecutan. Objetivo: explicar qué debe hacer el código y cómo funcionan sus distintos segmentos; especialmente importante en trabajos colaborativos o al reutilizar código antiguo.
Sintaxis: la almohadilla # indica que esa línea es un comentario.
# Esto es un comentario
# Puedo escribir lo que quiera aqui
# y el interprete lo ignorará
print('hey!')
Truco: los strings que no están asociados a una variable son ignorados por el intérprete (incluidos los de triple comilla multilínea).`,
            },
        ],
    },
    {
        id: 'tuplas-y-sets',
        title: 'Tuplas y Sets: Estructuras de Datos Más Allá de las Listas',
        emoji: '📦',
        description: 'Dos estructuras de datos especializadas que resuelven problemas distintos a los de una lista: las tuplas (colecciones ordenadas e inmutables, más rápidas y ligeras) y los sets (colecciones sin orden con elementos únicos, optimizadas para comprobar pertenencia). Incluye cuándo elegir cada una frente a listas y arrays.',
        reason: 'Son dos PDFs de la misma miniserie de clase ("Clase 01" y "Clase 02", mismo curso), pensados explícitamente como continuación uno del otro: la Clase 02 empieza repasando tuplas antes de introducir sets, ambos se comparan constantemente contra listas/arrays con la misma tabla de propiedades, y pedagógicamente responden a la misma pregunta — "¿qué estructura de datos uso cuando una lista no es la herramienta correcta?". Separarlos en dos bloques distintos rompería esa comparación conjunta que es el objetivo real de la lección. Su propio repaso inicial ("1. Listas 2. Arrays") confirma que Arrays ya se asume conocido en este punto del curso.',
        prerequisites: ['fundamentos-python', 'arrays'],
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
            { id: 'tup-tabla-comparativa', name: 'Tabla: Listas vs Arrays vs Tuplas', description: 'Mutabilidad (mutable/mutable/inmutable), acceso (índice o slicing en las 3), tamaño (dinámico/fijo/fijo), tipo de elementos (mixto/homogéneo/mixto), eficiencia y uso principal de cada una.', order: 15 },
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
            { id: 'tup-tupla-de-tuplas-slicing', name: 'Tupla de tuplas: slicing de la tupla interior y de la exterior', description: 'mi_tupla[1] extrae toda la tupla interior en esa posición; mi_tupla[0:2] extrae una porción de la tupla exterior; mi_tupla[2][0:2] aplica slicing dentro de una tupla interior concreta.', order: 28 },
            { id: 'tup-unitaria', name: 'Tupla unitaria: la coma final es obligatoria', description: 'mi_tupla = (1) es solo un int entre paréntesis (<class \'int\'>); mi_tupla = (1,) con la coma sí es una tupla de un elemento (<class \'tuple\'>).', order: 29 },
            { id: 'tup-empaquetado', name: 'Empaquetado (packing) de una tupla', description: 'mi_tupla = "fruta", 45, True empaqueta varios valores sueltos en una única tupla.', order: 30 },
            { id: 'tup-desempaquetado', name: 'Desempaquetado (unpacking) de una tupla', description: 'string, entero, booleano = mi_tupla desempaqueta cada valor de la tupla en una variable distinta, en el mismo orden.', order: 31 },
            { id: 'tup-error-desempaquetado-pocas-variables', name: 'Error de desempaquetado: demasiados valores', description: 'Si se desempaqueta una tupla de 3 elementos en solo 2 variables, da ValueError: too many values to unpack (expected 2).', order: 32 },
            { id: 'tup-error-desempaquetado-muchas-variables', name: 'Error de desempaquetado: pocos valores', description: 'Si se desempaqueta una tupla de 3 elementos en 4 variables, da ValueError: not enough values to unpack (expected 4, got 3).', order: 33 },
            { id: 'set-definicion', name: 'Sets: colecciones no ordenadas de elementos únicos e inmutables', description: 'Un set es una colección sin orden garantizado y sin duplicados; los elementos en sí son inmutables, aunque la colección permite añadir y borrar elementos.', order: 34 },
            { id: 'set-sin-indice-asociado', name: 'Los elementos de un set no llevan un índice asociado', description: 'A diferencia de listas y tuplas, ningún elemento de un set tiene una posición numérica fija.', order: 35 },
            { id: 'set-no-reasignar', name: 'No se pueden reasignar valores a los elementos del set', description: 'Aunque se pueden añadir y borrar elementos completos, no se puede cambiar el valor de un elemento existente por su posición (porque no tiene posición).', order: 36 },
            { id: 'set-unicidad-intro', name: 'Los elementos de un set son únicos: no hay duplicados', description: 'Un set nunca contiene el mismo valor dos veces.', order: 37 },
            { id: 'set-sintaxis-basica', name: 'Sintaxis básica de un set: {}', description: 'mi_set = {\'fruta\', 45, True} crea un set con esos tres elementos; print(mi_set) muestra <class \'set\'>.', order: 38 },
            { id: 'set-vacio-cuidado', name: 'Set vacío: CUIDADO con {} — crea un diccionario', description: 'mi_set = {} crea un diccionario (<class \'dict\'>), no un set vacío; para crear un set vacío hay que usar explícitamente mi_set = set() (<class \'set\'>).', order: 39 },
            { id: 'set-ausencia-orden', name: 'Ausencia de ordenamiento', description: 'El orden en que se imprime un set no tiene por qué coincidir con el orden en que se insertaron los elementos.', order: 40 },
            { id: 'set-sin-indices-error', name: 'Los sets no tienen índices (TypeError)', description: 'set_frutas[0] lanza TypeError: \'set\' object is not subscriptable porque los elementos no tienen posición.', order: 41 },
            { id: 'set-inmutabilidad-reasignar', name: 'Inmutabilidad: TypeError al reasignar un elemento', description: 'set_frutas[0] = "pera" da TypeError: \'set\' object does not support item assignment.', order: 42 },
            { id: 'set-unicidad-ejemplo', name: 'Unicidad: valores repetidos se eliminan automáticamente', description: 'set_frutas = {\'manzana\',\'manzana\',\'naranja\',\'plátano\'} da como resultado un set con una sola copia de \'manzana\'.', order: 43 },
            { id: 'set-pertenencia-eficiencia', name: 'Comprobar pertenencia con in — más eficiente que en listas', description: 'Las pruebas de pertenencia (\'manzana\' in frutas) son mucho más eficientes en sets que en listas.', order: 44 },
            { id: 'set-por-que-eficiente', name: 'Por qué los sets son más eficientes: hash table', description: 'En una lista, comprobar pertenencia recorre todos los elementos hasta encontrar (o no) coincidencia. Un set es una tabla de hash: cada elemento tiene un hash único que determina su posición fija ("bucket"), y Python solo comprueba directamente ese bucket.', order: 45 },
            { id: 'set-tabla-propiedades', name: 'Tabla de propiedades: Lista vs Array vs Tupla vs Conjunto', description: 'Comparación por Definición, Sintaxis, Índices (sí/sí/sí/no), Modificable (sí/sí/no/sí), Homogeneidad (no/sí/no/no), Tamaño fijo (no/sí/sí/no), Únicos (no/no/no/sí) e Iterables (sí en los 4).', order: 46 },
            { id: 'set-add', name: 'add() para añadir un elemento', description: 'frutas.add(\'fresa\') añade un nuevo elemento al set.', order: 47 },
            { id: 'set-remove', name: 'remove() para borrar un elemento', description: 'frutas.remove(\'naranja\') elimina ese elemento del set.', order: 48 },
            { id: 'set-discard', name: 'discard() para borrar un elemento', description: 'frutas.discard(\'naranja\') elimina ese elemento del set, con un comportamiento distinto a remove() cuando el elemento no existe.', order: 49 },
            { id: 'set-remove-vs-discard', name: 'Diferencia entre remove() y discard()', description: 'Si el elemento a borrar no existe en el set, remove() lanza KeyError; discard() simplemente no hace nada, sin lanzar error.', order: 50 },
            { id: 'set-lista-a-set', name: 'Convertir una lista en set con set()', description: 'mi_lista = [\'manzana\',\'naranja\',\'plátano\']; mi_set = set(mi_lista) convierte la lista en un set equivalente (sin duplicados y sin orden garantizado).', order: 51 },
            { id: 'set-set-a-lista', name: 'Convertir un set en lista con list()', description: 'mi_set = {\'manzana\',\'naranja\',\'plátano\'}; mi_lista = list(mi_set) convierte el set de vuelta a una lista.', order: 52 },
            { id: 'set-eliminar-duplicados-ejemplo', name: 'Eliminar duplicados de una lista usando set()', description: 'lista_alumnos = ["Pedro","Lucas","Juan","Lucas"]; set_alumnos = set(lista_alumnos); lista_alumnos_unico = list(set_alumnos) da [\'Pedro\', \'Lucas\', \'Juan\'], sin el "Lucas" repetido.', order: 53 },
            { id: 'set-union', name: 'Unión de conjuntos: | y union()', description: 'set1 | set2 y set1.union(set2) devuelven todos los elementos presentes en cualquiera de los dos sets.', order: 54 },
            { id: 'set-interseccion', name: 'Intersección de conjuntos: & e intersection()', description: 'set1 & set2 y set1.intersection(set2) devuelven solo los elementos presentes en AMBOS sets.', order: 55 },
            { id: 'set-diferencia', name: 'Diferencia de conjuntos: - y difference()', description: 'set1 - set2 y set1.difference(set2) devuelven los elementos de set1 que NO están en set2.', order: 56 },
            { id: 'set-diferencia-simetrica', name: 'Diferencia simétrica: ^ y symmetric_difference()', description: 'set1 ^ set2 y set1.symmetric_difference(set2) devuelven los elementos que están en uno de los dos sets pero no en ambos a la vez.', order: 57 },
        ],
        sources: [
            {
                fileName: 'Python-Inicial-Clase-01-Teoria-tuplas-y-sets-Diapositivas.pdf',
                rawText: `TUPLAS
Definición: Las tuplas son listas inmutables.
No permiten añadir, eliminar o mover elementos (append, remove…)
Permiten extraer porciones pero eso da como resultado una tupla nueva.
Permiten comprobar si un elemento se encuentra en la tupla.
✓ Más rápidas que las listas
✓ Ocupan menos espacio (mayor optimización)
✓ Pueden usarse como llaves de un diccionario
Si necesitamos guardar varios elementos pero en el futuro solo queremos recorrerlos para verlos, entonces nos conviene usar tuplas.

SINTAXIS BASICA DE UNA TUPLA
# sintaxis de una tupla
mi_tupla_1 = ("fruta", 45, True)
print(type(mi_tupla_1))  →  <class 'tuple'>
# sintaxis de una lista
mi_lista_1 = ["fruta", 45, True]
print(type(mi_lista_1))  →  <class 'list'>
# sintaxis de una tupla sin paréntesis
mi_tupla_2 = "fruta", 45, True
print(type(mi_tupla_2))  →  <class 'tuple'>
#acceder a elementos de un tupla
mi_tupla_1 = ("fruta", 45, True)
print(mi_tupla_1[1])  →  45

INMUTABILIDAD
# mutabilidad de una lista
mi_lista = [1, 2, 3]
mi_lista[0] = 4 # reasignacion
print(mi_lista)  →  [4, 2, 3]
# inmutabilidad de una tupla
mi_tupla = (1, 2, 3)
mi_tupla[0] = 4 # intento de reasignacion
TypeError: 'tuple' object does not support item assignment
# inmutabilidad de una tupla
mi_tupla = (1, 2, 3)
mi_tupla.append(4)
AttributeError: 'tuple' object has no attribute 'append'
mi_tupla.insert(0,4)
AttributeError: 'tuple' object has no attribute 'insert'

OPTIMIZACIÓN LISTA VS TUPLA
ESPACIO EN MEMORIA:
import sys
mi_lista = [0,1,2, "hola", True]
mi_tupla = (0,1,2,"hola", True)
print(sys.getsizeof(mi_lista),'bytes')
print(sys.getsizeof(mi_tupla),'bytes')
→ 120 bytes
→ 80 bytes
TIEMPO DE CREACIÓN:
import timeit
print(timeit.timeit(stmt="[0,1,2,3,4,5]", number = 10000000))
print(timeit.timeit(stmt="(0,1,2,3,4,5)", number = 10000000))
→ 0.24537658299993836
→ 0.037102917000083835
(la tupla ocupa ~1.5 veces menos espacio y se crea ~8 veces más rápido)

LISTA VS ARRAY VS TUPLA (tabla de propiedades)
Mutabilidad: Lista=Mutable, Array=Mutable, Tupla=Inmutable
Acceso a elementos: los 3 por índice o slicing
Tamaño de la lista: Lista=Dinámico, Array=Fijo, Tupla=Fijo
Tipo de elementos: Lista=diferentes tipos, Array=mismo tipo, Tupla=diferentes tipos
Eficiencia: Lista=no tan eficiente, Array=más eficiente que listas, Tupla=más eficiente que listas
Uso principal: Lista=modificar con frecuencia, Array=eficiencia con mismo tipo, Tupla=elementos inmutables y eficientes

PASAR DE LISTAS A TUPLAS Y VICEVERSA
mi_lista = [0,1,2, "hola", True]
print("mi_lista es de tipo...",type(mi_lista))  →  <class 'list'>
mi_tupla = tuple(mi_lista)
print("mi_tupla es de tipo...",type(mi_tupla))  →  <class 'tuple'>
print(mi_tupla)  →  (0, 1, 2, 'hola', True)
mi_tupla = (0,1,2, "hola", True)
mi_lista = list(mi_tupla)
print(mi_lista)  →  [0, 1, 2, 'hola', True]

TRABAJANDO CON TUPLAS
# acceder a elementos: mi_tupla_1 = ("fruta", 45, True); print(mi_tupla_1[1]) → 45
# slicing: mi_tupla = (1, 2, 3, 4, 5); subtupla = mi_tupla[1:3]; print(subtupla) # (2, 3)
# comprobar si un elemento esta en la tupla: print("fruta" in mi_tupla_1) → True; print(100 in mi_tupla_1) → False
# longitud: mi_tupla = ("fruta", 45, True); longitud = len(mi_tupla); print(longitud) # 3
# numero de apariciones: mi_tupla.count(45) → 1; mi_tupla.count("perro") → 0; (1,2,3,3,3,4,5).count(3) → 3
# indice de un elemento: mi_tupla.index(45) → 1
# maximos y minimos: mi_tupla = (3, 1, 4, 1, 5, 9, 2, 6, 5); max(mi_tupla) → 9; min(mi_tupla) → 1
# ordenar (sorted): mi_tupla = (3, 1, 4, 1, 5, 9, 2, 6, 5); sorted(mi_tupla) → [1, 1, 2, 3, 4, 5, 5, 6, 9] <class 'list'> — ¡RETORNA UNA LISTA! Para mantener tupla: tuple(sorted(mi_tupla)) → (1, 1, 2, 3, 4, 5, 5, 6, 9) <class 'tuple'>
# invertir (reversed): mi_tupla = (1, 2, 3, 4, 5); reversed(mi_tupla) → <reversed object at ...> <class 'reversed'> — ¡NO es lista ni tupla! Para mantener tupla: tuple(reversed(mi_tupla)) → (5, 4, 3, 2, 1) <class 'tuple'>
# combinar tuplas con zip: tupla1 = (1, 2, 3); tupla2 = ('a', 'b', 'c'); tupla_combinada = tuple(zip(tupla1, tupla2)) → ((1, 'a'), (2, 'b'), (3, 'c'))
# acceder a elementos de una tupla de tuplas: mi_tupla = ((1, 'a'), (2, 'b'), (3, 'c')); print(mi_tupla[0][0]) → 1; print(mi_tupla[1][1]) → b; print(mi_tupla[2][0]) → 3
# slicing de una tupla de tuplas: mi_tupla = ((1, 2, 3), (4, 5, 6), (7, 8, 9)); tupla_interior = mi_tupla[1] → (4, 5, 6); porcion_tupla = mi_tupla[0:2] → ((1, 2, 3), (4, 5, 6)); porcion_interior = mi_tupla[2][0:2] → (7, 8)

TUPLA UNITARIA
mi_tupla = (1); print(type(mi_tupla)) → <class 'int'>; print(mi_tupla) → 1
mi_tupla = (1,); print(type(mi_tupla)) → <class 'tuple'>; print(mi_tupla) → (1,)  ← la coma es obligatoria

EMPAQUETAMIENTO Y DESEMPAQUETAMIENTO
# empaquetamiento
mi_tupla = "fruta", 45, True
print(mi_tupla)  →  ('fruta', 45, True)
# desempaquetamiento
mi_tupla = ("fruta", 45, True)
string, entero, booleano = mi_tupla
print(string) → fruta; print(entero) → 45; print(booleano) → True

DESEMPAQUETAMIENTO: POSIBLES ERRORES
mi_tupla = ("fruta", 45, True)
string, entero = mi_tupla
ValueError: too many values to unpack (expected 2)
string, entero, booleano, otra_variable = mi_tupla
ValueError: not enough values to unpack (expected 4, got 3)

REPASO: 1) Diferencias entre array, lista y tupla 2) Inmutabilidad de una tupla 3) Performance tupla vs lista 4) Bases del trabajo con tuplas (acceso a elementos, métodos y funciones, empaquetamiento y desempaquetamiento…) 5) Trabajo con tuplas de tuplas (acceso a elementos y slicing)`,
            },
            {
                fileName: 'Python-Inicial-Clase-02-Teoria-tuplas-y-sets-Diapositivas.pdf',
                rawText: `SETS
Definición: Colecciones no ordenadas de elementos únicos e inmutables.
Los elementos no llevan un indice asociado
No podemos reasignar valores a los elementos del set
Podemos añadir y borrar elementos
Los elementos son únicos, no hay duplicados

SINTAXIS BASICA DE UN CONJUNTO/SET
# sintaxis de un set
mi_set = {'fruta', 45, True}
print(mi_set)  →  {'fruta', 45, True}
# Crear set vacío
mi_set = set()
print(type(mi_set))  →  <class 'set'>
CUIDADO → # Crear set vacío
mi_set = {}
print(type(mi_set))  →  <class 'dict'>  (¡esto crea un diccionario, NO un set!)

AUSENCIA DE ORDENAMIENTO
El orden del contenido no se preserva.
set_frutas = {'manzana', 'naranja', 'plátano'}
print(set_frutas)  →  {'naranja', 'plátano', 'manzana'}
Los elementos no llevan asignados un índice:
set_frutas[0]
TypeError: 'set' object is not subscriptable

INMUTABILIDAD
set_frutas[0]="pera"
TypeError: 'set' object does not support item assignment
(No podemos reasignar valores)

UNICIDAD
En un set todos los elementos son únicos. No hay repeticiones.
set_frutas = {'manzana','manzana', 'naranja', 'plátano'}
print(set_frutas)  →  {'naranja', 'plátano', 'manzana'}

COMPROBAR PERTENENCIA
Sets: frutas = {'manzana', 'naranja', 'plátano'}; print('manzana' in frutas) # True; print('fresa' in frutas) # False
Listas: frutas = ['manzana', 'naranja', 'plátano']; print('manzana' in frutas) # True; print('fresa' in frutas) # False
Las pruebas de pertenencia son mucho más eficientes en sets que en listas.
¿Por qué? Los elementos en una lista tienen asociado un índice — para comprobar la pertenencia se recorren todos los elementos de la lista hasta encontrar o no el coincidente. Los elementos en un set no tienen un índice sino un hash (un set es una hash table o tabla de hash). El hash es único para cada elemento, de manera que ese elemento siempre va a estar guardado en el mismo lugar dentro de ese set (en el mismo "bucket"). Python comprueba el bucket correspondiente a ese set y ve si está lleno o no.

PROPIEDADES: LISTA VS ARRAY VS TUPLA VS SETS (tabla)
Característica | Lista | Array | Tupla | Conjunto (Set)
Definición: colección ordenada modificable | conjunto homogéneo ordenado modificable | colección ordenada e inmutable | colección de elementos únicos e inmutables
Sintaxis: mi_lista = [1, 2, 3] | mi_array = np.array([1, 2, 3]) | mi_tupla = (1, 2, 3) | mi_set = {1, 2, 3}
Índices: Sí | Sí | Sí | No
Modificable: Sí | Sí | No | Sí
Homogeneidad: No | Sí | No | No
Tamaño fijo: No | Sí | Sí | No
Únicos: No | No | No | Sí
Iterables: Sí | Sí | Sí | Sí

AÑADIR Y BORRAR ELEMENTOS
frutas = {'manzana', 'naranja', 'plátano'}
frutas.add('fresa')
print(frutas)  →  {'naranja', 'plátano', 'fresa', 'manzana'}
frutas.remove('naranja') → {'plátano', 'manzana'}
frutas.discard('naranja') → {'plátano', 'manzana'}
La diferencia entre remove() y discard(): si intentamos borrar un elemento que no existe en el set, remove() nos devuelve un error:
frutas.remove('fresa')
KeyError: 'fresa'
Mientras que discard() simplemente no hace nada.

PASAR DE LISTAS A SETS Y VICEVERSA
mi_lista = ['manzana', 'naranja', 'plátano']
mi_set = set(mi_lista)
print(mi_set)  →  {'naranja', 'plátano', 'manzana'}
mi_set = {'manzana', 'naranja', 'plátano'}
mi_lista = list(mi_set)
print(mi_lista)  →  ['naranja', 'plátano', 'manzana']

TRABAJANDO CON SETS - EJEMPLO: crear una lista nueva eliminando duplicados
lista_alumnos = ["Pedro", "Lucas", "Juan", "Lucas"]
set_alumnos = set(lista_alumnos)
print(set_alumnos)  →  {'Pedro', 'Lucas', 'Juan'}
lista_alumnos_unico = list(set_alumnos)
print(lista_alumnos_unico)  →  ['Pedro', 'Lucas', 'Juan']

OPERACIONES CON SETS
Unión: set1 = {1, 2, 3}; set2 = {3, 4, 5}; print(set1 | set2) → {1, 2, 3, 4, 5}; print(set1.union(set2)) → {1, 2, 3, 4, 5}
Intersección: print(set1 & set2) → {3}; print(set1.intersection(set2)) → {3}
Diferencia: print(set1 - set2) → {1, 2}; print(set1.difference(set2)) → {1, 2}
Diferencia simétrica: print(set1 ^ set2) → {1, 2, 4, 5}; print(set1.symmetric_difference(set2)) → {1, 2, 4, 5}

REPASO: 1) Qué es un set y su sintaxis 2) Propiedades de un set 3) Índices y hash 4) Añadir y borrar elementos de un set 5) Trabajar con sets y listas 6) Operaciones con sets (unión, intersección y diferencias)`,
            },
        ],
    },
    {
        id: 'condicionales',
        title: 'Condicionales: Test Condicionales, If Statement y Switch-Case',
        emoji: '🔀',
        description: 'Cómo tomar decisiones en el código: comparar valores, combinar condiciones con and/or, y usar if/elif/else (Python no tiene switch-case, se imita con if/elif/else).',
        reason: 'Un único PDF centrado enteramente en control de flujo condicional — es el segundo bloque natural del curso tras los fundamentos, ya que introduce el primer mecanismo de decisión antes de pasar a bucles y listas.',
        prerequisites: ['fundamentos-python'],
        concepts: [
            { id: 'cond-test-igualdad', name: 'Test condicionales: == y !=', description: 'Comprueban si algo es cierto o falso (True/False): nombre_usuario == \'Juan\' compara igualdad; nombre_usuario != \'Juan\' compara desigualdad.', order: 1 },
            { id: 'cond-in-string', name: 'Operador in en strings', description: '\'e\' in nombre comprueba si un string está contenido dentro de otro string, devuelve True/False.', order: 2 },
            { id: 'cond-case-sensitive', name: 'Comparaciones sensibles a mayúsculas (case sensitive)', description: 'nombre_usuario == \'juan\' es False si la variable vale \'Juan\' (distinta capitalización); usar .lower() en ambos lados hace la comparación insensible a mayúsculas/minúsculas.', order: 3 },
            { id: 'cond-comparaciones-numericas', name: 'Comparaciones numéricas: >, <, >=, <=', description: 'edad > 24, edad < 24, edad <= 23, edad >= 23 — comprobar si un número es mayor, menor, mayor o igual, o menor o igual que otro.', order: 4 },
            { id: 'cond-and', name: 'Condiciones múltiples con and', description: '(nombre_usuario == \'Juan\') and (edad >= 21) — todas las condiciones deben cumplirse para que el resultado sea True.', order: 5 },
            { id: 'cond-or', name: 'Condiciones múltiples con or', description: '(edad_juan > 18) or (edad_lucas > 18) — basta con que una condición se cumpla para que el resultado sea True.', order: 6 },
            { id: 'cond-concatenar-multiples', name: 'Concatenar más de dos condiciones con and/or y paréntesis', description: 'Se pueden combinar muchas condiciones a la vez, anidando paréntesis para agrupar sub-expresiones and/or, ej. ((a and b and c) or (d or e or f)).', order: 7 },
            { id: 'cond-expresiones-booleanas', name: 'Expresiones booleanas', description: 'Otro nombre para los test condicionales; un valor booleano solo puede ser True o False, útil para llevar el estado de un programa (proceso activo, permisos, etc.).', order: 8 },
            { id: 'cond-if-basico', name: 'If statement: if / elif / else', description: 'Equivalente al Si-Entonces-SiNo de PSEINT: if condicion_1: ... elif condicion_2: ... else: ... — "elif" es "else if" y "else" se ejecuta si ninguna condición anterior se cumplió.', order: 9 },
            { id: 'cond-indentacion', name: 'Indentación obligatoria en Python', description: 'A diferencia de PSEINT (que usa FinSi), en Python los bloques de código dentro de if/elif/else deben estar indentados; no hay palabra de cierre explícita.', order: 10 },
            { id: 'cond-if-anidado', name: 'If statements anidados', description: 'Un if/elif/else completo dentro de otro if/elif/else, para expresar lógica de decisión con varios niveles (ej. comprobar primero si ha pagado, y dentro de esa rama, comprobar el precio).', order: 11 },
            { id: 'cond-sin-switch-case', name: 'Python no tiene switch-case (Según de PSEINT)', description: 'PSEInt tiene la estructura "Según...Hacer...De otro modo...FinSegun"; Python no tiene un equivalente switch-case, así que se imita su comportamiento con una cadena de if/elif/else comparando el mismo valor.', order: 12 },
        ],
        sources: [
            {
                fileName: 'Condicionales, if-statements y switch-case.pdf',
                rawText: `TEST CONDICIONALES
Comprueban si algo es cierto o falso, True/False

>>> nombre_usuario = 'Juan'
>>> nombre_usuario == 'Juan'
True
>>> nombre_usuario == 'Fede'
False

>>> nombre_usuario = 'Juan'
>>> nombre_usuario != 'Juan'
False
>>> nombre_usuario != 'Fede'
True

- Asignamos a la variable nombre_usuario un string con el símbolo =
- Comparamos si la variable nombre_usuario es IGUAL al string Juan usando un ==
- nombre_usuario no está asociado al valor Fede, luego el resultado es FALSO o FALSE

Operador in:
>>> nombre = 'Fede'
>>> 'e' in nombre
True
>>> 'a' in nombre
False
>>> 'de' in nombre
True
También podemos comprobar si cierto string está contenido en otro string

Mayúsculas y minúsculas:
>>> nombre_usuario = 'Juan'
>>> nombre_usuario == 'Juan'
True
>>> nombre_usuario == 'juan'
False
>>> nombre_usuario.lower() == 'juan'
True
La condición es sensible a las mayúsculas y las minúsculas (case sensitive). Hacemos la comparación insensible a la forma con .lower() (case insensitive)

Comparaciones numéricas:
>>> edad = 23
>>> edad == 23
True
>>> edad != 23
False
>>> edad > 24
False
>>> edad < 24
True
>>> edad < 23
False
>>> edad <= 23
True
>>> edad >= 23
True

TESTEAR CONDICIONES MÚLTIPLES (AND)
Muchas veces puede ser útil comprobar si varias condiciones se cumplen simultáneamente. En estos casos usaremos la palabra AND
Ejemplo: Buscamos a una persona que se llama Juan y que tenga 21 años o más.
>>> nombre_usuario = 'Juan'
>>> edad = 23
>>> (nombre_usuario == 'Juan') and (edad >= 21)
True
>>> nombre_usuario = 'Juan'
>>> edad = 16
>>> (nombre_usuario == 'Juan') and (edad >= 21)
False

TESTEAR CONDICIONES MÚLTIPLES (OR)
En otras ocasiones nos basta si una de varias condiciones se cumple. En estos casos usaremos la palabra OR
Ejemplo: Hay un local en el que solo puede entrar gente mayor de edad o menores acompañados de un mayor de edad
>>> edad_juan = 17
>>> edad_lucas = 22
>>> (edad_juan > 18) or (edad_lucas > 18)
True
Con que uno de los dos lo cumpla será TRUE
>>> edad_juan = 17
>>> edad_lucas = 16
>>> (edad_juan > 18) or (edad_lucas > 18)
False

TESTEAR CONDICIONES MÚLTIPLES (concatenación de varias)
Podemos concatenar tantas condiciones como queramos:
>>> edad_juan = 17
>>> edad_lucas = 22
>>> edad_jose = 28
>>> (edad_juan > 18) and (edad_lucas > 18) and (edad_jose > 18)
False
Ejemplo: local en el que entra gente mayor de edad o menores acompañados de alguien mayor de 25
>>> ((edad_juan > 18) and (edad_lucas > 18) and (edad_jose > 18)) or ((edad_juan > 25) or (edad_lucas > 25) or (edad_jose > 25))
True

LISTA DE TEST CONDICIONALES (tabla resumen)
Igualdades          ----  h == 10
Desigualdades       ----  h != 10
Mayor que           ----  h > 0
Mayor o igual que   ----  h >= 0
Menor que           ----  h < 0
Menor o igual que   ----  h <= 0
Concatenación: and (y) todas las condiciones deben cumplirse; or (o) una de las condiciones debe cumplirse

EXPRESIONES BOOLEANAS
Tan solo es otra manera de llamar a los test condicionales. Un valor booleano puede ser solo VERDADERO (True) o FALSO (False)
>>> proceso_activo = True
>>> permiso_edicion = False
Estos valores pueden usarse para: tener información de si un proceso se está ejecutando; saber si un usuario tiene ciertos permisos sobre un archivo. Nos serán útiles para realizar un seguimiento del estado de nuestro programa

IF STATEMENTS = EXPRESIONES IF
PSEINT:
Si expresion_logica Entonces
    ejecucion_codigo_1
SiNo
    ejecucion_codigo_2
FinSi

Python:
if conditional_1:
    ejecucion_de_codigo_1
elif condicional_2:
    ejecucion_de_codigo_2
else:
    ejecucion_de_codigo_3

"if" equivale al "Si...Entonces"; "elif" equivale al "SiNo" (con una condición nueva) — else if; "else:" ejecuta el bloque final si ninguna condición anterior se cumplió. La INDENTACION es necesaria en Python.

Ejemplo con variable precio:
PSEINT:
Definir precio Como Entero
precio = 0
Leer precio
Si precio < 20 Entonces
    Escribir "El precio es menor a 20. Es: ", precio
SiNo
    Escribir "El precio es mayor o igual a 20. Es: ", precio
FinSi

Python:
precio = int(input())
if precio < 20:
    print('El precio es menor a 20. Es ', precio)
else:
    print('El precio es mayor a 20. Es ', precio)

IF STATEMENTS ANIDADOS
PSEINT:
Si expresion_logica_1 Entonces
    Si expresion_logica_2 Entonces
        ejecucion_codigo_1
    SiNo
        ejecucion_codigo_2
    FinSi
SiNo
    Si expresion_logica_3 Entonces
        ejecucion_codigo_3
    SiNo
        ejecucion_codigo_4
    FinSi
FinSi

Python:
if condicional_1:
    if condicional_a:
        ejecucion_de_codigo_a
    else:
        ejecucion_de_codigo_b
else:
    if condicional_c:
        ejecucion_de_codigo_c
    elif condicional_d:
        ejecucion_de_codigo_d
    else:
        ejecucion_de_codigo_e

Ejemplo hasPagado / precio:
PSEINT:
Definir hasPagado Como Logica
Definir precio Como Entero
hasPagado = Falso
precio = 0
Leer hasPagado
Leer precio
Si hasPagado = Falso Entonces
    Escribir "No has pagado aún"
    Si precio ≤ 20 Entonces
        Escribir "Tienes que pagar menos de 20 euros"
    SiNo
        Escribir "Tienes que pagar más de 20 euros"
    FinSi
SiNo
    Escribir "Ya has pagado"
FinSi

Python:
hasPagado = input()
precio = float(input())
if hasPagado == "False":
    print("No has pagado aún")
    if precio <= 20:
        print("Tienes que pagar menos de 20 euros")
    else:
        print("Tienes que pagar más de 20 euros")
else:
    print("Ya has pagado")

ESTRUCTURA SEGÚN O SWITCH-CASE
PSEINT:
Definir nombre Como Texto
nombre = ""
Escribir "Introduce tu nombre"
Leer nombre
Segun nombre Hacer
    "Juan":
        Escribir "Bienvenido Juan!"
    "Maria":
        Escribir "Bienvenida Maria!"
    "Pepa":
        Escribir "Bienvenida Pepa!"
De otro Modo:
    Escribir "Bienvenido, seas quien seas!"
FinSegun

Python (no existe switch-case, se imita con if/elif/else):
nombre = input('Introduce tu nombre')
if nombre == 'Juan':
    print('¡Bienvenido, Juan!')
elif nombre == 'Maria':
    print('¡Bienvenida, Maria!')
elif nombre == 'Pepa':
    print('¡Bienvenida, Pepa!')
else:
    print('¡Bienvenido, seas quien seas!')
En Python no existe la estructura switch-case (según). Podemos imitar su funcionamiento con el if-statement

REPASO: 1) Test condicionales simples 2) Test condicionales múltiples 3) Expresión If simple 4) Expresión If anidada 5) Sustitución del switch case por expresiones If`,
            },
        ],
    },
    {
        id: 'listas-y-bucles',
        title: 'Listas y Estructuras Iterativas (Bucles)',
        emoji: '🔁',
        description: 'Cómo crear y manipular listas (acceder, modificar, añadir, borrar, ordenar), y cómo repetir código con bucles while y for — incluyendo recorrer listas, slicing, listas anidadas, y break/continue.',
        reason: 'Son dos PDFs consecutivos de la misma clase ("Parte 1" y "Parte 2"): la Parte 2 empieza repasando exactamente el contenido de la Parte 1, y ambos entrelazan listas con bucles constantemente (recorrer listas con for, comprobar pertenencia con if). Separarlos rompería esa progresión única: listas → condicional+lista → bucles → recorrer listas con bucles.',
        prerequisites: ['condicionales'],
        concepts: [
            { id: 'list-definicion', name: 'Qué es una lista', description: 'Una colección de objetos en un orden particular, delimitada por corchetes: lista1 = ["a","b","c"]; puede mezclar tipos: lista4 = [1,"a","b",3,7,"e"].', order: 1 },
            { id: 'list-acceso-indice', name: 'Acceder a elementos por índice', description: 'embarcaciones[0] devuelve el primer elemento (índices empiezan en 0); embarcaciones[-1] devuelve el último elemento (índice negativo).', order: 2 },
            { id: 'list-tipo-elemento', name: 'type() de la lista vs type() del elemento', description: 'type(embarcaciones) es <class \'list\'>; type(embarcaciones[0]) es el tipo del elemento en sí, ej. <class \'str\'>.', order: 3 },
            { id: 'list-usar-elemento', name: 'Usar un elemento de la lista en una expresión', description: 'mensaje = \'Elegiría un \' + embarcaciones[-1].title() — se puede acceder y usar un elemento como cualquier otra variable, aplicando métodos como .title().', order: 4 },
            { id: 'list-modificar', name: 'Modificar un elemento existente', description: 'coches[2] = \'mercedes\' reemplaza el valor en esa posición.', order: 5 },
            { id: 'list-append', name: 'append(): añadir al final', description: 'coches.append(\'mercedes\') añade el elemento en la última posición; las listas son objetos dinámicos, se les puede asignar más memoria sobre la marcha (útil para construir una lista vacía e ir llenándola).', order: 6 },
            { id: 'list-insert', name: 'insert(pos, valor): añadir en cualquier posición', description: 'coches.insert(0,\'mercedes\') inserta el valor en la posición indicada, desplazando el resto de elementos hacia la derecha.', order: 7 },
            { id: 'list-pop', name: 'pop() / pop(i): eliminar y devolver un elemento', description: 'coches.pop() elimina y devuelve el último elemento; coches.pop(1) elimina y devuelve el elemento en la posición 1; el valor devuelto se puede guardar en una variable.', order: 8 },
            { id: 'list-remove', name: 'remove(valor): eliminar por valor', description: 'coches.remove(\'audi\') elimina la primera aparición de ese valor; si hay duplicados, solo borra el primero que encuentra.', order: 9 },
            { id: 'list-del', name: 'del lista[i] y del lista', description: 'del coches[1] borra el elemento en esa posición; del coches (sin índice) borra la variable entera — usarla después da NameError: name \'coches\' is not defined.', order: 10 },
            { id: 'list-sort', name: 'sort(): ordenar de forma permanente', description: 'coches.sort() modifica la lista original; con strings numéricos como [\'23\',\'11\',\'5\'] ordena lexicográficamente (por texto), no numéricamente: da [\'11\',\'23\',\'5\'].', order: 11 },
            { id: 'list-sorted', name: 'sorted(): ordenar de forma temporal', description: 'sorted(coches) devuelve una lista nueva ordenada sin modificar la lista original.', order: 12 },
            { id: 'list-reverse', name: 'reverse(): invertir el orden', description: 'coches.reverse() invierte permanentemente el orden de los elementos en la lista.', order: 13 },
            { id: 'list-len', name: 'len(): longitud de la lista', description: 'len(coches) devuelve el número de elementos.', order: 14 },
            { id: 'list-indexerror', name: 'IndexError: índice fuera de rango', description: 'coches[3] sobre una lista de 3 elementos, o lista[0] sobre una lista vacía, da IndexError: list index out of range.', order: 15 },
            { id: 'list-in-condicional', name: 'Comprobar pertenencia con in + if', description: 'if coche_elegido in coches: ... else: ... — comprueba si un elemento está en la lista antes de actuar.', order: 16 },
            { id: 'list-vacia-condicional', name: 'Comprobar si una lista está vacía', description: 'if coches: (lista con contenido) es truthy; else: (lista vacía []) es falsy — patrón habitual para comprobar antes de procesar.', order: 17 },
            { id: 'bucle-definicion', name: 'Qué es una estructura iterativa o bucle', description: 'Una secuencia de instrucciones que se ejecuta repetidamente mientras se cumple una condición; en Python: while = mientras, for = para.', order: 18 },
            { id: 'bucle-while', name: 'Bucle while', description: 'while expr_logica: ejecucion_codigo — equivalente al Mientras...FinMientras de PSEINT; para salir del bucle, algo dentro del cuerpo debe cambiar el valor de la expresión lógica (ej. decrementar un temporizador).', order: 19 },
            { id: 'bucle-for-lista', name: 'Recorrer una lista con for objeto in lista', description: 'for coche in coches: print(coche) — itera directamente sobre cada elemento de la lista.', order: 20 },
            { id: 'bucle-for-range-len', name: 'Recorrer una lista con for i in range(len(lista))', description: 'for i in range(0,len(coches)): print(coches[i]) — forma alternativa iterando por índice en vez de por elemento.', order: 21 },
            { id: 'bucle-indentacion-alcance', name: 'La indentación decide si una línea está dentro o fuera del bucle', description: 'Si un print() está indentado dentro del for, se ejecuta en cada iteración; si está fuera (sin indentar), se ejecuta solo una vez al terminar todo el bucle.', order: 22 },
            { id: 'bucle-indentationerror', name: 'IndentationError: expected an indented block', description: 'Ocurre si tras for ...: no se indenta la línea siguiente.', order: 23 },
            { id: 'bucle-syntaxerror-dos-puntos', name: 'SyntaxError por falta de los dos puntos tras for', description: 'for i in range(0,len(coches)) (sin :) da SyntaxError: invalid syntax.', order: 24 },
            { id: 'bucle-indentationerror-inesperada', name: 'IndentationError: unexpected indent', description: 'Indentar una línea sin que pertenezca a ningún bloque (for/if/etc.) anterior da este error.', order: 25 },
            { id: 'list-numericas-range', name: 'Listas numéricas con list(range(...))', description: 'numeros = list(range(1,6)) crea [1,2,3,4,5]; list(range(2,11,2)) permite indicar el paso, ej. [2,4,6,8,10].', order: 26 },
            { id: 'list-comprehension', name: 'Compresión de listas (list comprehension)', description: 'numeros_cuadrados = [valor**2 for valor in range(1,11)] es la forma comprimida equivalente a un for + append() en varias líneas.', order: 27 },
            { id: 'list-min-max-sum', name: 'min(), max(), sum() sobre listas numéricas', description: 'min(digitos), max(digitos), sum(digitos) — mínimo, máximo y suma total de una lista de números.', order: 28 },
            { id: 'list-slicing', name: 'Slicing: porción de una lista', description: 'digitos[2:5] devuelve una sublista con los elementos desde el índice 2 hasta el 4 (el límite superior no se incluye); jugadores[:3] equivale a jugadores[0:3]; jugadores[3:] toma desde el índice 3 hasta el final; jugadores[-3:] toma los últimos 3 elementos con índices negativos.', order: 29 },
            { id: 'list-recorrer-slice', name: 'Recorrer una porción de una lista', description: 'for jugador in jugadores[0:3]: print(jugador) combina slicing con un bucle for para recorrer solo esa parte.', order: 30 },
            { id: 'list-copia-referencia', name: 'Copiar una lista: referencia (mismo objeto en memoria)', description: 'comida_invitado = mi_comida no crea una copia independiente — ambas variables apuntan al mismo objeto en memoria; modificar una (ej. .append()) modifica también la otra.', order: 31 },
            { id: 'list-copia-real', name: 'Copiar una lista de verdad con [:]', description: 'comida_invitado = mi_comida[:] crea una copia independiente en un nuevo objeto de memoria; modificar la copia ya no afecta a la original.', order: 32 },
            { id: 'list-anidadas', name: 'Listas anidadas (lista de listas)', description: 'datos_alumnos = [[\'David\',27],[\'Jose\',22],[\'Lucas\',23]] — una lista puede contener otras listas como elementos.', order: 33 },
            { id: 'list-anidadas-doble-indice', name: 'Acceder a listas anidadas con doble índice', description: 'datos_alumnos[0] devuelve la sublista [\'David\',27]; datos_alumnos[0][0] devuelve \'David\' y datos_alumnos[0][1] devuelve 27.', order: 34 },
            { id: 'list-anidadas-slicing', name: 'Slicing sobre listas anidadas', description: 'datos_alumnos[0:2] devuelve una lista con las dos primeras sublistas completas.', order: 35 },
            { id: 'bucle-for-range-paso', name: 'for con range(inicio, fin, paso)', description: 'El número de repeticiones lo determina el propio range, sin gestionar manualmente el incremento/decremento como en while; range(temporizador,0,-1) permite recorrer hacia atrás con paso negativo; range(a,b) va de a hasta b-1 (el valor final no se incluye).', order: 36 },
            { id: 'bucle-break', name: 'break: interrumpir el bucle', description: 'if condicion: break sale inmediatamente del bucle (for o while), creando un "exit point"; ninguna línea después del break dentro del mismo bloque se ejecuta.', order: 37 },
            { id: 'bucle-continue', name: 'continue: saltar a la siguiente iteración', description: 'if condicion: continue salta el resto del cuerpo del bucle en esa iteración y vuelve al inicio con el siguiente valor; ninguna línea después del continue en ese bloque se ejecuta.', order: 38 },
            { id: 'bucle-break-continue-buenas-practicas', name: 'Buenas prácticas con break/continue', description: 'Son útiles pero no hay que abusar: crear muchos "exit points" complica la lectura; la programación estructurada prefiere puntos de entrada/salida únicos. Se recomiendan sobre todo para comprobaciones rápidas de precondiciones al inicio; si el código se puede escribir igual de simple sin ellos, es preferible evitarlos.', order: 39 },
        ],
        sources: [
            {
                fileName: 'Listas y estructuras Iterativas1.pdf',
                rawText: `LISTAS
¿QUÉ ES UNA LISTA? Una Lista es una colección de objetos en un orden particular.
Lista1 = [ "a", "b", "c", "d", "e", "f"]
Lista2 = [ 1, 2, 3, 4, 5, 6 ]
Lista4 = [ 1, "a", "b", 3, 7, "e"]

embarcaciones = ['bote', 'yate', 'velero', 'catamarán']
print(embarcaciones)
['bote', 'yate', 'velero', 'catamarán']

ACCEDER A LOS ELEMENTOS DE UNA LISTA
print(embarcaciones[0]) → bote (¡Es un string!)
print(type(embarcaciones)) → <class 'list'>
print(type(embarcaciones[0])) → <class 'str'>
print(embarcaciones[0].title()) → Bote
print(embarcaciones[1], embarcaciones[2]) → yate velero
print(embarcaciones[-1]) → catamarán

USAR UN ELEMENTO DE LA LISTA
mensaje = 'Si me comprase una embarcación, elegiría un ' + embarcaciones[-1].title()
print(mensaje) → Si me comprase una embarcación, elegiría un Catamarán

MODIFICAR ELEMENTOS
coches = ['bmw', 'audi', 'seat']
coches[2] = 'mercedes'
print(coches) → ['bmw', 'audi', 'mercedes']

APPEND()
coches = ['bmw', 'audi', 'seat']
coches.append('mercedes')
print(coches) → ['bmw', 'audi', 'seat', 'mercedes']
Las listas son objetos dinámicos. Se les puede asignar más memoria de manera dinámica.
coches = []
coches.append('bmw'); coches.append('audi'); coches.append('mercedes')
print(coches) → ['bmw', 'audi', 'mercedes']

INSERT()
coches = ['bmw', 'audi', 'seat']
coches.insert(0,'mercedes')
print(coches) → ['mercedes', 'bmw', 'audi', 'seat']
coches.insert(1,'mercedes') → ['bmw', 'mercedes', 'audi', 'seat']

POP()
coches = ['bmw', 'audi', 'seat']
coches.pop()
print(coches) → ['bmw', 'audi']
coche_eliminado = coches.pop() → coches=['bmw','audi'], coche_eliminado='seat'
coche_eliminado = coches.pop(1) → coche_eliminado='audi', coches=['bmw','seat']

REMOVE()
coches = ['bmw', 'audi', 'seat']
coches.remove('audi')
print(coches) → ['bmw', 'seat']
coches = ['bmw', 'audi', 'seat', 'audi']
coches.remove('audi')
print(coches) → ['bmw', 'seat', 'audi']  (elimina solo la primera aparición)

DEL - Palabra Clave
coches = ['bmw', 'audi', 'seat']
del coches[1]
print(coches) → ['bmw', 'seat']
coches = ['bmw', 'audi', 'seat']
del coches
print(coches)
NameError: name 'coches' is not defined

SORT()
coches = ['bmw', 'audi', 'seat']
coches.sort()
print(coches) → ['audi', 'bmw', 'seat']
coches = [23, 11, 5]; coches.sort() → [5, 11, 23]
coches = ['23', '11', '5']; coches.sort() → ['11', '23', '5']  (orden lexicográfico, no numérico)

SORTED()
coches = ['bmw', 'audi', 'seat']
print(sorted(coches)) → ['audi', 'bmw', 'seat']
autos = sorted(coches); print(autos); print(sorted(coches)) → ['audi', 'bmw', 'seat'] (dos veces, coches sin modificar)

REVERSE()
coches = ['bmw', 'audi', 'seat']
coches.reverse()
print(coches) → ['seat', 'audi', 'bmw']

LEN()
coches = ['bmw', 'audi', 'seat']
print(len(coches)) → 3

DEBUGGING
coches = ['bmw', 'audi', 'seat']
print(coches[3])
IndexError: list index out of range
coches = []
print(coches[0])
IndexError: list index out of range

LISTAS Y ESTRUCTURA CONDICIONAL
coches = ['bmw', 'audi', 'seat']
coche_elegido = 'audi'
if coche_elegido in coches:
    print('Has escogido un', coche_elegido )
else:
    print('No tenemos esa marca de coche')
→ Has escogido un audi

coches = []
if coches:
    print('La lista tiene el siguiente contenido ', coches)
else:
    print('La lista está vacía')
→ La lista está vacía

ESTRUCTURAS ITERATIVAS
¿QUÉ ES UNA ESTRUCTURA ITERATIVA O BUCLE? Es una secuencia de instrucciones que se ejecuta repetidamente mientras se cumple cierta condición establecida previamente.
En Python: WHILE = MIENTRAS, FOR = PARA

BUCLE MIENTRAS O WHILE
PSEINT: Mientras expr_logica Hacer / ejecucion_codigo / FinMientras
Python: while expr_logica: / ejecucion_codigo
Para entrar en el ciclo WHILE debe cumplirse la condición. Pero debe haber alguna opción para que la expresión deje de cumplirse y se salga del bucle → debe cambiarse el valor de la expresión lógica dentro del cuerpo.

Ejemplo temporizador:
import time
temporizador = int(input('Introduce el número de segundos del temporzador'))
print('Comienza el temporizador')
while (temporizador > 0):
    print('Quedan ', temporizador, ' segundos')
    time.sleep(1)
    temporizador = temporizador - 1
print('¡El temporizador ha finalizado!')
Output:
Comienza el temporizador
Quedan  3  segundos
Quedan  2  segundos
Quedan  1  segundos
¡El temporizador ha finalizado!`,
            },
            {
                fileName: 'Listas y estructuras Iterativas2.pdf',
                rawText: `RECORRER UNA LISTA CON UN BUCLE
for objeto in lista:
    print(objeto)
coches = ['bmw', 'audi', 'seat']
for coche in coches:
    print(coche)
→ bmw / audi / seat

for i in range(0,len(lista)):
    print(lista[i])
coches = ['bmw', 'audi', 'seat']
for i in range(0,len(coches)):
    print(coches[i])
→ bmw / audi / seat

coches = ['bmw', 'audi', 'seat']
for i in range(0,len(coches)):
    print('este coche es un ',coches[i].title())
print('Lista de coches terminada')   # FUERA del bucle (sin indentar)
→ este coche es un Bmw / este coche es un Audi / este coche es un Seat / Lista de coches terminada (una sola vez)

Si 'Lista de coches terminada' se indenta DENTRO del bucle:
→ este coche es un Bmw / Lista de coches terminada / este coche es un Audi / Lista de coches terminada / este coche es un Seat / Lista de coches terminada (se repite en cada iteración)

DEBUGGING
coches = ['bmw', 'audi', 'seat']
for i in range(0,len(coches)):
print('este coche es un ',coches[i].title())
IndentationError: expected an indented block  (falta sangría tras el for)

for i in range(0,len(coches))
    print('este coche es un ',coches[i].title())
SyntaxError: invalid syntax  (faltan los dos puntos tras el for)

print('Aqui no hay sangría')
    print('Aquí hay sangría')
IndentationError: unexpected indent

LISTAS NUMÉRICAS
numeros = list(range(1,6))
print(numeros) → [1, 2, 3, 4, 5]

numeros_cuadrados = []
for valor in range(1,11):
    cuadrado = valor**2
    numeros_cuadrados.append(cuadrado)
print(numeros_cuadrados) → [1, 4, 9, 16, 25, 36, 49, 64, 81, 100]

numeros_pares = list(range(2,11,2))
print(numeros_pares) → [2, 4, 6, 8, 10]

COMPRESIÓN DE LISTAS
Declaración extendida (for + append):
numeros_cuadrados = []
for valor in range(1,11):
    cuadrado = valor**2
    numeros_cuadrados.append(cuadrado)
Declaración comprimida (equivalente):
numeros_cuadrados = [valor**2 for valor in range(1,11)]
print(numeros_cuadrados) → [1, 4, 9, 16, 25, 36, 49, 64, 81, 100]

FUNCIONES PARA LISTAS NUMÉRICAS
digitos = [1,2,3,4,5,6,7,8,9,0]
min(digitos) → 0
max(digitos) → 9
sum(digitos) → 45

PARTES DE UNA LISTA (SLICING)
digitos = [1,2,3,4,5,6,7,8,9,0]
algunos_digitos = digitos[2:5]
print(algunos_digitos) → [3, 4, 5]

jugadores = ['Alejandro', 'Felipe', 'Samuel', 'Juan Marcos', 'Lucas', 'David']
equipo_A = jugadores[0:3] → ['Alejandro', 'Felipe', 'Samuel']
equipo_B = jugadores[3:6] → ['Juan Marcos', 'Lucas', 'David']
jugadores[:3] es igual a jugadores[0:3]
jugadores[3:] es igual a jugadores[3:6]
jugadores[-3:] es igual a jugadores[3:6] (con índices negativos)

RECORRER UNA PARTE DE UNA LISTA
for jugador in jugadores[0:3]:
    print(jugador)
→ Alejandro / Felipe / Samuel

COPIAR UNA LISTA
mi_comida = ['pizza', 'carne', 'tarta de queso']
comida_invitado = mi_comida
comida_invitado.append('helado')
print(mi_comida) → ['pizza', 'carne', 'tarta de queso', 'helado']  (¡también cambió el original! mi_comida y comida_invitado apuntan al MISMO objeto en memoria)

comida_invitado = mi_comida[:]   (copia real)
comida_invitado.append('helado')
print(mi_comida) → ['pizza', 'carne', 'tarta de queso']  (sin cambios, ahora son dos objetos distintos en memoria)

LISTAS ANIDADAS
datos_alumnos = [['David', 27], ['Jose', 22], ['Lucas',23]]
print(type(datos_alumnos)) → <class 'list'>
print(datos_alumnos[0]) → ['David', 27]
print(datos_alumnos[0][0]) → David
print(datos_alumnos[0][1]) → 27
print(datos_alumnos[0:2]) → [['David', 27], ['Jose', 22]]

BUCLE FOR O PARA
PSEINT: Para i = valor_inicial Hasta valor_final Con Paso incr_decr Hacer / ejecucion_codigo / FinPara
Python: for i in range(valor_inicial, valor_final, paso): / ejecucion_codigo
El número de repeticiones viene dado por el propio range; no hace falta cambiar manualmente la condición.

Ejemplo temporizador con for:
import time
temporizador = int(input('Introduce el número de segundos del temporzador'))
print('Comienza el temporizador ')
for i in range(temporizador,0,-1):
    print('Quedan ', i, ' segundos')
    time.sleep(1)
print('¡El temporizador ha finalizado!')

for i in range(0,3): print(i) → 0 1 2
for i in range(1,3): print(i) → 1 2  (range(a,b) va de a hasta b-1)

INTERRUMPIR UN BUCLE: BREAK
for i in range(5):
    if i == 3:
        break
    print(i)
print("Estamos fuera del bucle")
→ 0 1 2 / Estamos fuera del bucle

for i in range(5):
    if i == 3:
        print("Estoy dentro del if")
        break
        print("nunca se ejecuta")
    print(i)
print("Estamos fuera del bucle")
→ 0 1 2 / Estoy dentro del if / Estamos fuera del bucle

INTERRUMPIR UN BUCLE: CONTINUE
for i in range(5):
    if i == 3:
        print("Estoy dentro del if")
        continue
        print("nunca se ejecuta")
    print(i)
print("Estamos fuera del bucle")
→ 0 1 2 / Estoy dentro del if / 4 / Estamos fuera del bucle  (salta el print(i) cuando i==3 y continúa con i=4)

CONTINUE y BREAK: buenas prácticas
Son útiles pero hay que evitar abusar de ellas. Crear muchos exit points complica la lectura y el flujo del código; es preferible salir del bucle de manera natural. La base de la programación estructurada es tener puntos de entrada y salida bien definidos.
Casos de uso: comprobaciones rápidas al comienzo del programa, actuando como pre-condiciones.
Regla de estilo: piensa si puedes escribir el código sin break/continue manteniéndolo simple y elegante; si no es posible, entonces úsalos.`,
            },
        ],
    },
    {
        id: 'funciones-basico',
        title: 'Introducción a Funciones',
        emoji: '🧩',
        description: 'Qué es una función, cómo crearla con def, la diferencia entre parámetros y argumentos, argumentos posicionales vs de palabra clave, y valores por defecto.',
        reason: 'Es el PDF introductorio de funciones (Python-avanzado-01), la base sintáctica de def/parámetros/return sobre la que se apoyan directamente los bloques de Lambda/Decoradores y Recursividad — por eso es su prerrequisito común.',
        prerequisites: ['listas-y-bucles'],
        concepts: [
            { id: 'func-paradigmas', name: 'Paradigmas de programación', description: 'Un mismo problema (sumar los pares de una lista) se puede resolver con distintos enfoques: imperativo (bucle+if), funcional (filter+lambda+sum), estructurado (bucle+if organizado) u orientado a objetos (una clase con método); Python permite combinarlos.', order: 1 },
            { id: 'func-que-es', name: 'Qué es una función', description: 'Un bloque de código al que se le asigna un nombre, diseñado para realizar una tarea específica y que puede usarse repetidamente.', order: 2 },
            { id: 'func-ya-existentes', name: 'Funciones ya existentes: len(), np.multiply()', description: 'Antes de crear funciones propias ya se usan funciones prefabricadas como len(mi_lista) o np.multiply(array_1, array_2), que reciben argumentos y devuelven un resultado.', order: 3 },
            { id: 'func-sintaxis-def', name: 'Sintaxis def', description: 'def nombre_funcion(): seguido de dos puntos; el nombre, los paréntesis () y los dos puntos : son siempre necesarios.', order: 4 },
            { id: 'func-docstring', name: 'Docstring', description: 'Una cadena """...""" justo debajo de la definición de la función, que describe qué hace.', order: 5 },
            { id: 'func-llamar', name: 'Llamar a una función', description: 'Escribir nombre_funcion() ejecuta el bloque de código de la función.', order: 6 },
            { id: 'func-parametro-vs-argumento', name: 'Parámetro vs argumento', description: 'El "nombre" en la definición def saludar_usuario(nombre): es el PARÁMETRO; el valor real pasado al llamar, ej. saludar_usuario("Elena"), es el ARGUMENTO.', order: 7 },
            { id: 'func-argumentos-posicionales', name: 'Argumentos posicionales', description: 'El orden en que se pasan los valores determina a qué parámetro corresponde cada uno; describir_mascota("harry", "hamster") en vez de describir_mascota("hamster", "harry") invierte el resultado y sale mal.', order: 8 },
            { id: 'func-argumentos-keyword', name: 'Argumentos de palabra clave (keyword arguments)', description: 'describir_mascota(tipo_animal="hamster", nombre_mascota="harry") — al nombrar explícitamente cada argumento, el orden en que se escriben ya no importa.', order: 9 },
            { id: 'func-valores-por-defecto', name: 'Valores por defecto en parámetros', description: 'def describir_mascota(nombre_mascota, tipo_animal="perro") permite omitir ese argumento en la llamada si el valor por defecto es válido.', order: 10 },
            { id: 'func-orden-parametros-default', name: 'Orden obligatorio: parámetros sin valor por defecto antes que los que sí lo tienen', description: 'def describir_mascota(tipo_animal="perro", nombre_mascota): da SyntaxError: non-default argument follows default argument — los parámetros con valor por defecto deben ir siempre después de los que no lo tienen.', order: 11 },
            { id: 'func-error-argumento-faltante', name: 'TypeError por argumento obligatorio faltante', description: 'Si describir_mascota(nombre_mascota, tipo_animal="perro") se llama sin argumentos: describir_mascota() da TypeError: describir_mascota() missing 1 required positional argument: \'nombre_mascota\'.', order: 12 },
            { id: 'func-llamadas-equivalentes', name: 'Llamadas equivalentes: posicional, keyword o mezclado', description: 'Distintas formas de invocar la misma función (solo posicional, solo keyword, mezcladas, usando o no el valor por defecto) pueden producir exactamente el mismo resultado.', order: 13 },
        ],
        sources: [
            {
                fileName: 'Python-avanzado-01-Teoria-1-Introduccion-a-Funciones-Diapositivas_b835b9e3.pdf',
                rawText: `PARADIGMAS DE PROGRAMACIÓN
CODIFICAMOS LA INFORMACION EN SUCESIONES DE 0s y 1s → ESTRUCTURAS DE DATOS → ESTRUCTURACION, MANIPULACION Y ALMACENAMIENTO DE DATOS (Listas, arrays, tuplas, sets y diccionarios / bucles y condicionales)
LA PROGRAMACION SE BASA EN CREAR UNA RECETA O SECUENCIA DE INSTRUCCIONES → ESTRUCTURAS DE PROGRAMACION → MANIPULAREMOS LA INFORMACION PARA OBTENER UN RESULTADO DE LA MANERA MAS ÓPTIMA POSIBLE

Programación imperativa (foco: cómo se ejecutan las instrucciones, secuencia de comandos que modifican el estado):
mis_numeros = [1,2,3,4,5,6,7,8,9,10]
sum = 0
for num in mis_numeros:
    if num % 2 == 0:
        sum += num
print(sum) → 30

Programación funcional (foco: evaluación de funciones matemáticas, inmutabilidad, evitar efectos secundarios):
mis_numeros = [1,2,3,4,5,6,7,8,9,10]
numeros_pares = filter(lambda x: x % 2 == 0, mis_numeros)
suma = sum(numeros_pares)
print(suma) → 30

Programación estructurada (foco: división en bucles y decisiones, claridad y organización, evitar saltos no estructurados):
mis_numeros = [1,2,3,4,5,6,7,8,9,10]
sum = 0
for num in mis_numeros:
    if num % 2 == 0:
        sum += num
print(sum) → 30

Programación orientada a objetos (foco: organizar en objetos que representan entidades, encapsulamiento, herencia y polimorfismo):
class NumberList:
    def __init__(self, numbers):
        self.numbers = numbers
    def suma_numeros_pares(self):
        sum = 0
        for num in self.numbers:
            if num % 2 == 0:
                sum += num
        return sum
mis_numeros = [1,2,3,4,5,6,7,8,9,10]
mis_numeros_lista = NumberList(mis_numeros)
print(my_number_list.suma_numeros_pares()) → 30

Muchos lenguajes admiten múltiples paradigmas y permiten combinarlos. La elección depende del problema, la preferencia del desarrollador y los requisitos del proyecto.

INTRODUCCIÓN AL USO DE FUNCIONES
¿Qué es una función?
Bloques de código a los que asignamos un nombre. Están diseñados para realizar una tarea en específico. Pueden ser usados repetidamente.

Ejemplo con función ya existente (len):
mi_lista = [1,2,3,4]
longitud = len(mi_lista)
print(longitud) → 4

Ejemplo con función de librería (numpy):
import numpy as np
array_1 = np.array([2,2,2])
array_2 = np.array([1,2,3])
array_suma = np.multiply(array_1, array_2)
print(array_suma) → [2 4 6]

¿Cómo creamos una función?
def saludar_usuario():
    """Mostrar un saludo simple por pantalla."""
    print("Hola!")
(partes: "def" = definición, "saludar_usuario" = nombre, "()" = paréntesis, ":" = necesario siempre)
Al llamar la función: saludar_usuario() → Hola!

¿Cómo pasamos información a una función?
def saludar_usuario(nombre):
    """Mostrar un saludo por pantalla."""
    print(f"¡Hola {nombre}!")
saludar_usuario("Elena") → ¡Hola Elena!
saludar_usuario("Elena"); saludar_usuario("Maria"); saludar_usuario("Enrique")
→ ¡Hola Elena! / ¡Hola Maria! / ¡Hola Enrique!
Terminología: "nombre" (en la definición) = PARÁMETRO; "Elena" (en la llamada) = ARGUMENTO

ARGUMENTOS POSICIONALES
def describir_mascota(tipo_animal, nombre_mascota):
    """ Mostrar informacion de mascota."""
    print("Tengo un " + tipo_animal + "." )
    print("Mi " + tipo_animal + " se llama " + nombre_mascota.title() + ".")
describir_mascota("hamster", "harry")
→ Tengo un hamster. / Mi hamster se llama Harry.
describir_mascota( "harry", "hamster",)   (orden invertido)
→ Tengo un harry. / Mi harry se llama Hamster.  (el orden posicional importa)

ARGUMENTOS DE PALABRA CLAVE
describir_mascota(tipo_animal="hamster", nombre_mascota="harry")
→ Tengo un hamster. / Mi hamster se llama Harry.
describir_mascota(nombre_mascota="harry", tipo_animal="hamster")
→ Tengo un hamster. / Mi hamster se llama Harry. (con keyword arguments el orden ya no importa)

VALORES POR DEFECTO
def describir_mascota(nombre_mascota, tipo_animal = "perro"):
    ...
describir_mascota(nombre_mascota="Roc") → Tengo un perro. / Mi perro se llama Roc.
describir_mascota(tipo_animal = "hamster", nombre_mascota="harry") → Tengo un hamster. / Mi hamster se llama Harry.

Error (default antes que non-default):
def describir_mascota(tipo_animal = "perro", nombre_mascota):
    ...
describir_mascota(nombre_mascota="Roc")
SyntaxError: non-default argument follows default argument

LLAMADAS EQUIVALENTES
def describir_mascota(nombre_mascota, tipo_animal = "perro"):
    """ Mostrar informacion de mascota."""
    print("Tengo un " + tipo_animal + "." )
    print("Mi " + tipo_animal + " se llama " + nombre_mascota.title() + ".")
describir_mascota(nombre_mascota="roc")       → Tengo un perro. / Mi perro se llama Roc.
describir_mascota("roc")                       → Tengo un perro. / Mi perro se llama Roc.
describir_mascota("harry", "hamster")          → Tengo un hamster. / Mi hamster se llama Harry.
describir_mascota(nombre_mascota = "harry", tipo_animal = "hamster")  → igual
describir_mascota(tipo_animal = "hamster", nombre_mascota = "harry")  → igual

ERRORES FRECUENTES
def describir_mascota(nombre_mascota, tipo_animal = "perro"):
    ...
describir_mascota()
TypeError: describir_mascota() missing 1 required positional argument: 'nombre_mascota'

Comparación valor por defecto vs argumento explícito:
def describir_mascota(nombre_mascota = "willy", tipo_animal = "perro"):
    ...
describir_mascota() → Tengo un perro. / Mi perro se llama Willy.

def describir_mascota(nombre_mascota, tipo_animal = "perro"):
    ...
describir_mascota("willy") → Tengo un perro. / Mi perro se llama Willy.

REPASO: 1. Paradigmas de programación 2. Qué es una función y como crearla 3. Trabajar con parámetros y argumentos`,
            },
        ],
    },
    {
        id: 'funciones-lambda-decoradores',
        title: 'Funciones Lambda y Decoradores',
        emoji: '⚡',
        description: 'Funciones anónimas de una sola línea (lambda) para abreviar sintaxis, usarlas como filtro o criterio de ordenación, y funciones decoradoras que añaden funcionalidad a una función existente sin modificar su código.',
        reason: 'Es un PDF de nivel avanzado que asume conocido def/parámetros/return del bloque "Introducción a Funciones" — los decoradores en concreto se explican como "una función que recibe una función y devuelve una función", concepto que solo tiene sentido tras dominar la sintaxis básica de funciones.',
        prerequisites: ['funciones-basico'],
        concepts: [
            { id: 'lambda-que-son', name: 'Qué son las funciones lambda', description: 'Funciones anónimas (sin nombre) definidas en una sola línea; se usan para abreviar sintaxis y ahorrar tiempo.', order: 1 },
            { id: 'lambda-limitacion', name: 'Limitación clave de lambda', description: 'Todo lo que se hace con una lambda se puede hacer con una función normal, pero no todo lo que se hace con una función normal se puede hacer con lambda.', order: 2 },
            { id: 'lambda-sintaxis', name: 'Sintaxis: nombre = lambda parametros: expresion', description: 'area_triangulo = lambda base,altura:(base*altura/2) es equivalente a def area_triangulo(base,altura): return (base*altura/2).', order: 3 },
            { id: 'lambda-restriccion', name: 'Restricción: no admite bucles ni condicionales', description: 'Una lambda solo puede devolver un cálculo/expresión única — "funciones on demand, on the go, online".', order: 4 },
            { id: 'lambda-formato-string', name: 'Lambda con formato de string', description: 'destacar_valor = lambda comision: "¡{}! $".format(comision) construye un string dinámico dentro de la lambda.', order: 5 },
            { id: 'lambda-filter', name: 'Lambda como filtro con filter()', description: 'list(filter(lambda numero_par: numero_par%2==0, numeros)) filtra elementos de una lista según una condición, sin necesidad de definir una función con nombre aparte.', order: 6 },
            { id: 'lambda-key-sort', name: 'Lambda como criterio de ordenación (key=)', description: 'autores.sort(key=lambda name:name.split(" ")[-1]) ordena por apellido en vez de por el string completo, extrayendo el criterio con una lambda.', order: 7 },
            { id: 'decorador-que-son', name: 'Qué son las funciones decoradoras', description: 'Funciones que añaden funcionalidad a funciones ya existentes en el programa, sin modificar su código.', order: 8 },
            { id: 'decorador-estructura', name: 'Estructura de un decorador: recibe una función y devuelve una función', description: 'Un decorador tiene una función A que recibe como parámetro la función B, y devuelve una función C (la función interna); "un decorador devuelve una función".', order: 9 },
            { id: 'decorador-funcion-interna', name: 'Función interna (closure) dentro del decorador', description: 'def funcion_interior(): definida dentro de la función decoradora, envuelve la llamada a la función original añadiendo lógica antes y/o después.', order: 10 },
            { id: 'decorador-sintaxis-arroba', name: 'Sintaxis @decorador', description: '@funcion_decoradora encima de def suma(): es azúcar sintáctico para aplicar el decorador a esa función.', order: 11 },
            { id: 'decorador-args', name: 'Función interna con *args', description: 'def funcion_interior(*args): permite que el decorador funcione con funciones que reciben cualquier número de argumentos posicionales.', order: 12 },
            { id: 'decorador-kwargs', name: 'Función interna con *args y **kwargs', description: 'def funcion_interior(*args, **kwargs): añade soporte también para argumentos de palabra clave en la función decorada, ej. potencia(base=4, exponente=3).', order: 13 },
        ],
        sources: [
            {
                fileName: 'Python-avanzado-Funciones-Lambda-y-Decoradores_045188ce.pdf',
                rawText: `FUNCIONES LAMBDA
¿QUÉ SON? SON FUNCIONES ANONIMAS
¿PARA QUÉ SE USAN? PARA ABREVIAR SINTAXIS Y AHORRARNOS TIEMPO
Todo lo que podemos hacer con una función lambda puede hacerse con una función normal, pero no todo lo que podemos hacer con funciones normales puede hacerse con funciones lambda

Comparación función normal vs lambda:
def area_triangulo(base, altura):
    return (base*altura/2)
triangulo1 = area_triangulo(5,7)
triangulo2 = area_triangulo(9,6)
print(triangulo1, triangulo2) → 17.5 27.0

area_triangulo = lambda base,altura:(base*altura/2)
triangulo1 = area_triangulo(5,7)
triangulo2 = area_triangulo(9,6)
print(triangulo1, triangulo2) → 17.5 27.0

Restricción: NO PUEDE TENER BUCLES O CONDICIONALES. SOLO PUEDE DEVOLVERNOS UN CÁLCULO. "funciones on demand, on the go, online..."

EJEMPLO: POTENCIA
al_cubo=lambda numero:numero**3
print(al_cubo(13)) → 2197

EJEMPLO: TRABAJO DE FORMATO
destacar_valor=lambda comision:"¡{}! $".format(comision)
comision_luis = 2300
print(destacar_valor(comision_luis)) → ¡2300! $

FILTROS CON FUNCIONES LAMBDA
Con función normal:
def numero_par(num):
    if num % 2==0:
        return True
numeros=[17,24,7,39,8,51,92]
print(list(filter(numero_par, numeros))) → [24, 8, 92]

Con lambda:
numeros=[17,24,7,39,8,51,92]
print(list(filter(lambda numero_par:numero_par%2==0, numeros))) → [24, 8, 92]

FUNCIONES LAMBDA COMO CLAVE
EJEMPLO: SORT
Sort normal (alfabético por nombre completo):
autores = ["Isaac Asimov", "Frank Herbert", "Douglas Adams"]
autores.sort()
print(autores) → ['Douglas Adams', 'Frank Herbert', 'Isaac Asimov']

Sort con lambda como key (por apellido):
autores = ["Isaac Asimov", "Frank Herbert", "Douglas Adams"]
autores.sort(key=lambda name:name.split(" ")[-1])
print(autores) → ['Douglas Adams', 'Isaac Asimov', 'Frank Herbert']

FUNCIONES DECORADORES
SON FUNCIONES QUE AÑADEN FUNCIONALIDADES A FUNCIONES YA EXISTENTES EN NUESTRO PROGRAMA
ESTRUCTURA: 3 funciones (A, B, C) donde A recibe como parámetro la función B y devuelve la función C. Un decorador devuelve una función

Esquema:
def funcion_decorador(funcion):
    def funcion_interna():
        #codigo de funcion interna
    return(funcion_interna)

Decorador completo:
def funcion_decoradora(funcion_parametro):
    def funcion_interior():
        print("Vamos a realizar el calculo: ")
        funcion_parametro()
        print("Hemos terminado el calculo")
    return(funcion_interior)

@funcion_decoradora
def suma():
    print(15+20)

@funcion_decoradora
def resta():
    print(10-3)

Al llamar suma() y resta():
Output:
Vamos a realizar el calculo:
35
Hemos terminado el calculo
Vamos a realizar el calculo:
7
Hemos terminado el calculo

Función interna con argumentos: *args
def funcion_decoradora(funcion_parametro):
    def funcion_interior(*args):
        print("Vamos a realizar el calculo: ")
        funcion_parametro(*args)
        print("Hemos terminado el calculo")
    return(funcion_interior)

@funcion_decoradora
def suma(num1, num2, num3):
    print(num1+num2+num3)

@funcion_decoradora
def resta(num1, num2):
    print(num1-num2)

suma(7,5,6)
resta(4,3)
Output:
Vamos a realizar el calculo:
18
Hemos terminado el calculo
Vamos a realizar el calculo:
1
Hemos terminado el calculo
(*args = argumentos posicionales variables)

Función interna con argumentos: *args, **kwargs
def funcion_decoradora(funcion_parametro):
    def funcion_interior(*args, **kwargs):
        print("Vamos a realizar el calculo: ")
        funcion_parametro(*args, **kwargs)
        print("Hemos terminado el calculo")
    return(funcion_interior)

@funcion_decoradora
def potencia(base, exponente):
    print(base**exponente)

potencia(base=4, exponente=3)
Output:
Vamos a realizar el calculo:
64
Hemos terminado el calculo
(**kwargs = argumentos de palabra clave, permite pasar argumentos por nombre a la función decorada también)`,
            },
        ],
    },
    {
        id: 'arrays',
        title: 'Arrays (NumPy): Módulos, Librerías y Operaciones',
        emoji: '🔢',
        description: 'Qué son módulos/paquetes/librerías, arrays de NumPy frente a listas (memoria, tipos homogéneos), arrays multidimensionales, y todas sus operaciones: creación, slicing, ordenar, copiar, agregados por eje, aplanar, transponer y multiplicación matricial.',
        reason: 'Son 3 PDFs de una misma serie ("Módulos y Librerías" seguido de "Trabajando con Arrays, Parte 1 y 2" — la Parte 2 empieza repasando exactamente el cierre de la Parte 1). El primero da el contexto (módulo/paquete/librería) necesario para entender por qué un array requiere "import numpy", y los otros dos enseñan progresivamente crear, manipular y operar arrays — forman una progresión única e inseparable.',
        prerequisites: ['listas-y-bucles'],
        concepts: [
            { id: 'arr-modulo', name: 'Qué es un módulo', description: 'Un archivo .py que contiene código Python que puede importarse dentro de otro archivo: import constantes o import constantes as cte, y luego usar constantes.pi.', order: 1 },
            { id: 'arr-paquete', name: 'Qué es un paquete (package)', description: 'Un directorio/carpeta con una colección de módulos; puede haber subpaquetes con distintos módulos cada uno, marcados con __init__.py.', order: 2 },
            { id: 'arr-libreria', name: 'Qué es una librería (library)', description: 'Término general para código reutilizable; una librería contiene una colección de paquetes y módulos (jerarquía: librería > paquete > módulo). Ejemplos: Numpy, Matplotlib, Pytorch, Pandas.', order: 3 },
            { id: 'arr-que-es', name: 'Qué es un Array', description: 'Contenedor capaz de guardar más de un objeto a la vez, una colección ordenada de elementos.', order: 4 },
            { id: 'arr-vs-lista-tabla', name: 'Tabla comparativa: Lista vs Array', description: 'Lista: in-built, corchetes [], puede mezclar tipos, permite anidar dimensiones distintas, sin operaciones aritméticas directas, más memoria, más flexible. Array: requiere import, función array(), un solo tipo, mismo tamaño en todos los elementos, operaciones aritméticas directas, menos memoria, menos flexible.', order: 5 },
            { id: 'arr-aritmetica-lista-vs-array', name: 'Operaciones aritméticas: lista repite, array opera elemento a elemento', description: 'my_list * 2 sobre una lista duplica la lista (concatena); my_array * 2 sobre un array de NumPy multiplica cada elemento por 2 directamente.', order: 6 },
            { id: 'arr-modulo-array-nameerror', name: 'NameError si se usa array() sin importar', description: 'my_array = array([1,2,3]) sin import da NameError: name \'array\' is not defined.', order: 7 },
            { id: 'arr-modulo-in-built', name: 'Módulo array (in-built de Python)', description: 'import array as arr; arr.array(\'i\', [1,2,3]) crea un array básico; el primer argumento es un type code (ej. \'i\' = entero simple) que define el tipo de dato que contendrá.', order: 8 },
            { id: 'arr-tabla-tipos', name: 'Tabla de type codes del módulo array', description: 'b=signed char, B=unsigned char, u=wchar_t, h/H=short, i/I=int, l/L=long, q/Q=long long, f=float, d=double — cada uno con su tamaño mínimo en bytes.', order: 9 },
            { id: 'arr-tipo-mixto-error', name: 'TypeError al mezclar tipos en un array', description: 'array.array(\'i\', [\'string\', 3, 7.8, True]) da TypeError: an integer is required (got type str) — el módulo array in-built exige un único tipo estricto.', order: 10 },
            { id: 'arr-numpy-mezcla-convierte', name: 'NumPy convierte todo al mismo tipo automáticamente', description: 'numpy.array([\'string\', 3, 7.8, True]) no da error: convierte todos los elementos a string (\'string\', \'3\', \'7.8\', \'True\'), clase numpy.str_.', order: 11 },
            { id: 'arr-dimensiones-distintas-error', name: 'TypeError al anidar dimensiones distintas en NumPy', description: 'numpy.array(["a","b"], ["c"], ["d","e"]) da TypeError: array() takes from 1 to 2 positional arguments but 3 were given — a diferencia de una lista de listas, que sí admite dimensiones distintas libremente.', order: 12 },
            { id: 'arr-cuando-lista-cuando-array', name: 'Cuándo usar lista y cuándo array', description: 'Lista: mutable, flexible, sin import, pero más memoria y sin operaciones aritméticas — para secuencias pequeñas sin cálculo matemático. Array: menos memoria, operaciones aritméticas directas, pero mismo tipo obligatorio — para secuencias grandes con cálculo matemático.', order: 13 },
            { id: 'arr-instalar-numpy', name: 'Instalar NumPy', description: 'No viene preinstalado; se instala con conda install numpy o pip install numpy dentro del environment de trabajo (ej. conda activate cblocks).', order: 14 },
            { id: 'arr-lista-a-array-memoria', name: 'De lista a array: motivo de eficiencia de memoria', description: 'Una lista permite guardar cualquier tipo (booleano 2 opciones, string 70+ combinaciones por carácter) lo cual es muy costoso en memoria; un array fuerza un único tipo y tamaño de bits fijo.', order: 15 },
            { id: 'arr-dtype', name: 'Controlar el tipo con dtype', description: 'np.array([1,2,3]) da por defecto numpy.int64; np.array([1,2,3], dtype=np.int8) fuerza un entero de 8 bits, consumiendo menos memoria si el rango de valores lo permite.', order: 16 },
            { id: 'arr-multidimensional-2d', name: 'Array bidimensional (2D)', description: 'np.array([[1,2,3],[4,5,6]]) crea una matriz de filas y columnas; array.shape devuelve (filas, columnas), ej. (2,3).', order: 17 },
            { id: 'arr-multidimensional-3d', name: 'Array tridimensional (3D) y .ndim', description: 'Anidar un nivel más de listas crea un array 3D; array.shape da 3 dimensiones y array.ndim devuelve el número de dimensiones (ej. 3).', order: 18 },
            { id: 'arr-reshape', name: 'reshape(): redimensionar un array', description: 'array_1.reshape((3,2)) cambia la forma manteniendo el mismo número total de elementos; reshape(6) o reshape(n) sin tupla lo convierte a 1 dimensión.', order: 19 },
            { id: 'arr-arange', name: 'np.arange(stop) / (start,stop) / (start,stop,step)', description: 'np.arange(8) da [0..7]; np.arange(1,8) da [1..7]; np.arange(1,8,2) dispone de paso para saltar valores; admite decimales (np.arange(1,8,0.5)) y negativos.', order: 20 },
            { id: 'arr-zeros-ones-empty', name: 'np.zeros(), np.ones(), np.empty()', description: 'np.zeros((2,3)) crea una matriz de ceros; np.ones((2,3)) de unos; np.empty((2,3)) NO inicializa la memoria y puede contener "basura" (valores residuales impredecibles) — cuidado al usarlo.', order: 21 },
            { id: 'arr-eye', name: 'np.eye(n, k=offset): matriz identidad', description: 'np.eye(3) crea la matriz identidad 3x3; el parámetro k desplaza la diagonal de unos hacia abajo (k=-1) o hacia arriba (k=1).', order: 22 },
            { id: 'arr-asignacion-condicional', name: 'Reasignar valores por condición booleana', description: 'array[array == 0] = 2 sustituye todos los ceros por 2; array[array < 2] = 9 sustituye todos los valores menores que 2.', order: 23 },
            { id: 'arr-slicing-filas-columnas', name: 'Slicing de filas y columnas para reasignar', description: 'array[0] sustituye la fila 0 entera; array[:2] sustituye las filas hasta la 2; array[1:, 2:] combina slicing de filas Y columnas a la vez.', order: 24 },
            { id: 'arr-sort', name: 'np.sort(array, axis=, kind=)', description: 'Por defecto ordena por filas (axis=-1); axis=0 ordena por columnas; kind acepta \'quicksort\' (por defecto), \'heapsort\', \'mergesort\' como algoritmo de ordenación.', order: 25 },
            { id: 'arr-view-vs-copy', name: 'view() vs copy()', description: 'array.view() crea una vista que SÍ afecta al array original al modificarla; array.copy() crea un array totalmente independiente que NO afecta al original.', order: 26 },
            { id: 'arr-fill-vs-operadores', name: 'fill(valor) vs operadores de asignación aumentada (+=, -=, *=, /=)', description: 'array.fill(8) rellena todo el array con ese valor; array += 6, array -= 6, array *= 6 modifican in-place; array /= 6 sobre un array de enteros (dtype=np.int64) da UFuncTypeError: Cannot cast ufunc \'divide\' output from dtype(\'float64\') to dtype(\'int64\') — funciona sin error si el array es de floats.', order: 27 },
            { id: 'arr-sum-prod', name: 'sum() y prod() con axis', description: 'array.sum() suma todos los elementos; sum(axis=0) suma por columnas; sum(axis=1) suma por filas; prod() multiplica todos los elementos, también con axis.', order: 28 },
            { id: 'arr-mean-max-min', name: 'mean(), max(), min()', description: 'Valor medio, máximo y mínimo de todos los elementos del array.', order: 29 },
            { id: 'arr-argmin-argmax', name: 'argmin() y argmax()', description: 'Devuelven el índice (posición) donde se encuentra el valor mínimo o máximo del array, no el valor en sí.', order: 30 },
            { id: 'arr-aplanar', name: 'Aplanar un array: reshape(size), flatten(), ravel()', description: 'array.reshape(array.size) o array.flatten() (crea una copy()) o array.ravel() (crea una view()) — las tres formas convierten un array multidimensional en una sola línea de elementos.', order: 31 },
            { id: 'arr-transponer', name: 'Transponer un array: swapaxes() y transpose()', description: 'np.swapaxes(array, 0, 1) y array.transpose(1,0) intercambian filas y columnas, dando el mismo resultado.', order: 32 },
            { id: 'arr-suma-resta-matrices', name: 'Suma y resta de matrices (element-wise)', description: 'a + b y a - b operan elemento a elemento entre dos arrays de la misma forma; se pueden combinar en expresiones más complejas como (a + b - 2*a)/4.', order: 33 },
            { id: 'arr-multiplicacion-matricial', name: 'Multiplicación matricial: matmul(), .dot(), @ — distinta de a*b', description: 'np.matmul(a,b), a.dot(b) y a @ b dan el mismo resultado de multiplicación matricial real (importante para IA/ML); a*b es multiplicación element-wise, un resultado completamente distinto.', order: 34 },
        ],
        sources: [
            {
                fileName: 'arrays1.pdf',
                rawText: `QUÉ ES UN MODULO
Módulo: Archivo con extension .py que contiene código de Python que puede importarse dentro de otro archivo de Python.

constantes.py:
pi = 3.14
tau = 6.28
e_euler = 2.71
G_gauss = 0.83

imprimir_cte.py:
import constantes
print(constantes.pi)  → 3.14

Con alias:
import constantes as cte
print(cte.pi)  → 3.14

area_circulo.py:
import constantes
radio = 12.1
area = constantes.pi * radio**2
print("Area circulo 1:", area)  → Area circulo 1: 459.7274

import constantes as cte
radio = 12.1
area = cte.pi * radio**2
print("Area circulo 2:", area)  → Area circulo 2: 459.7274

PAQUETES Y LIBRERIAS
Package/Paquete: Un directorio o carpeta con una colección de módulos. Podemos tener paquetes y subpaquetes con distintos módulos en cada uno.
Estructura ejemplo:
my_model/
  __init__.py
  training/ (__init__.py, dataset.py, training_loop.py, loss.py)
  submission/ (__init__.py, submit.py, run_context.py)
  metrics/ (__init__.py, precision.py, recall.py, fid_score.py)

Library/Librería: Termino general para referirse a una pieza de código reutilizable. Normalmente contiene una colección de módulos y paquetes. Ejemplos: Numpy, Matplotlib, Pytorch, Pandas.
Una librería es una colección de paquetes. Un paquete es una colección de módulos.

ARRAYS
¿Qué es un Array? Contenedores capaces de guardar más de un objeto al mismo tiempo. Colección ordenada de elementos/objetos.

TABLA COMPARATIVA Lista vs Array:
Lista: es in-built | Array: requiere import (array o numpy)
Lista: se crea con [] | Array: se crea con la función array()
Lista: puede contener distintos tipos | Array: no puede mezclar tipos
Lista: anidamiento de distinta dimensión posible | Array: debe contener elementos del mismo tamaño
Lista: no se pueden aplicar operaciones aritméticas | Array: se pueden aplicar directamente
Lista: consume más memoria | Array: consume menos memoria
Lista: mayor flexibilidad para modificar | Array: menor flexibilidad

Ejemplo aritmética — Lista:
my_list = [1,2,3,4,5,6,7,8,9]
nueva_lista = my_list * 2
print(nueva_lista) → [1, 2, 3, 4, 5, 6, 7, 8, 9, 1, 2, 3, 4, 5, 6, 7, 8, 9]  (duplica la lista, no multiplica elementos)

Para multiplicar cada elemento con lista hay que iterar:
nueva_lista = []
for i in range(0,len(my_list)):
    nueva_lista.append(my_list[i] * 2)
print(nueva_lista) → [2, 4, 6, 8, 10, 12, 14, 16, 18]

Con array (numpy):
import numpy as np
my_array = np.array([1,2,3,4,5,6,7,8,9])
nuevo_array = my_array * 2
print(nuevo_array) → [ 2  4  6  8 10 12 14 16 18]
nuevo_array = my_array / 2 → [0.5 1.  1.5 2.  2.5 3.  3.5 4.  4.5]

Lista in-built:
lista = [1,2,3,4,5,6,7]
print(type(lista)) → <class 'list'>

Array sin importar → error:
my_array = array([1,2,3,4,5,6,7,8,9])
NameError: name 'array' is not defined

Módulo array:
import array as arr
my_array = arr.array('i', [1,2,3,4,5,6,7,8,9])
print(type(my_array)) → <class 'array.array'>

Librería numpy:
import numpy as np
my_array = np.array([1,2,3,4,5,6,7,8,9])
print(type(my_array)) → <class 'numpy.ndarray'>

Distintos tipos — Lista funciona:
lista = ['string', 3, 7.8, True]
print(type(lista[0]), type(lista[1])) → <class 'str'> <class 'int'>

Array con distintos tipos → error:
import array
my_array = array.array('i', ['string', 3, 7.8, True])
TypeError: an integer is required (got type str)

Con numpy (convierte todo a string):
import numpy
my_array = numpy.array(['string', 3, 7.8, True])
print(my_array) → ['string' '3' '7.8' 'True']
print(type(my_array[2])) → <class 'numpy.str_'>

Anidamiento — Lista de listas funciona:
lista_de_listas = [ ["manzana", "pera", "cereza"], ["string"], ["bmw", "mercedes"] ]
print(type(lista_de_listas)) → <class 'list'>

Array con dimensiones distintas → error:
import numpy
my_array = numpy.array(["manzana", "pera", "cereza"], ["string"], ["bmw", "mercedes"])
TypeError: array() takes from 1 to 2 positional arguments but 3 were given

¿CUÁNDO USAMOS UN ARRAY Y CUÁNDO UNA LISTA?
Lista: permite ordenar elementos, mutable y flexible, no necesita import; pero necesita más memoria y no permite operaciones aritméticas → usar para secuencias pequeñas sin cálculo matemático.
Array: necesita menos memoria, permite operaciones aritméticas fácilmente; pero exige mismo tipo, es menos flexible → usar para secuencias grandes con operaciones matemáticas.

MODULO ARRAY
Viene por defecto al instalar Python. Modulo básico para tratar con Arrays.
import array as arr
my_array = arr.array('i', [1,2,3,4,5,6,7,8,9])
print(type(my_array)) → <class 'array.array'>
'i' indica el tipo de objeto que va a contener (enteros simples); segundo argumento es el contenido.

Tabla de type codes (docs.python.org):
b=signed char/int/1byte, B=unsigned char/int/1byte, u=wchar_t/carácter unicode/2bytes,
h=short/int/2bytes, H=unsigned short/int/2bytes, i=int/int/2bytes, I=unsigned int/int/2bytes,
l=long/int/4bytes, L=unsigned long/int/4bytes, q=long long/int/8bytes, Q=unsigned long long/int/8bytes,
f=float/float/4bytes, d=double/float/8bytes.
signed = entero de 32 bits en rango [-2147483648, 2147483648]. unsigned = entero de 32 bits en rango [0, 4294967295].

LIBRERIA NUMPY
No viene pre-instalada. Librería mucho más potente para tratamiento de arrays.
import numpy as np
my_array = np.array([1,2,3,4,5,6,7,8,9])
print(type(my_array)) → <class 'numpy.ndarray'>
No necesitamos explicitar el tipo de dato como en el módulo array in-built.

INSTALAR NUMPY
conda activate cblocks
conda install numpy
pip install numpy

REPASO: 1) Qué es un módulo 2) Qué es un package/paquete 3) Qué es una library/librería 4) Qué es un Array y diferencias con Lista 5) Cómo importar módulos/librerías de Arrays y su sintaxis`,
            },
            {
                fileName: 'arrays2.pdf',
                rawText: `DE LISTA A ARRAY
¿Por qué convertir una lista en array? → Eficiencia en memoria
import numpy as np
lista_a_array = np.array([1,2,3])
print(lista_a_array) → [1 2 3]

En una lista se puede guardar cualquier tipo: Boolean (2 opciones), String (70+ opciones por carácter). Esta flexibilidad es una locura en términos de manejo de memoria. Los Arrays están pensados para guardar un único tipo de dato, no solo en términos de int/float sino en número de bits.

lista_a_array = np.array([1,2,3])
print(type(lista_a_array[0])) → <class 'numpy.int64'>  (entero de 64 bits por defecto)
decimal 1→binario 01, 2→10, 3→11 → solo necesitamos 2 bits

lista_a_array = np.array([1,2,3], dtype = np.int8)
print(type(lista_a_array[0])) → <class 'numpy.int8'>  (menos memoria)

ARRAYS MULTIDIMENSIONALES
Array bidimensional 2D:
lista_a_array = np.array([[1,2,3],[4,5,6]], dtype = np.int8)
print(lista_a_array) →
[[1 2 3]
 [4 5 6]]
print(lista_a_array.shape) → (2, 3)   (2 filas, 3 columnas)

Array tridimensional 3D:
lista_a_array = np.array([[[1,2,3],[4,5,6]],[[7,8,9],[10,11,12]]], dtype = np.int8)
print(lista_a_array.shape) → (2, 2, 3)
print(lista_a_array.ndim) → 3

RESHAPE()
array_1 = np.array([[1,2,3],[4,5,6]], dtype = np.int8)  # shape (2,3)
array_2 = array_1.reshape((3,2))  # shape (3,2)
[[1 2]
 [3 4]
 [5 6]]
array_2 = array_1.reshape((6,1))  # shape (6,1)
array_2 = array_1.reshape(6)  # shape (6,) dim 1 → [1 2 3 4 5 6]
"Hemos convertido un array de dimension 2 en un array de dimension 1"

CREACIÓN DE ARRAYS SIN USAR LISTAS: np.arange()
my_array = np.arange(8) → [0 1 2 3 4 5 6 7]  (stop=8)
my_array = np.arange(1,8) → [1 2 3 4 5 6 7]  (start=1, stop=8)
my_array = np.arange(1,8,2) → [1 3 5 7]  (step=2, solo impares)
my_array = np.arange(1,8,0.5) → [1. 1.5 2. 2.5 3. 3.5 4. 4.5 5. 5.5 6. 6.5 7. 7.5]  (decimales)
my_array = np.arange(-1,8,0.5) → incluye negativos

CREACIÓN DE ARRAYS "VACÍOS"
np.zeros((2,3)) → [[0. 0. 0.] [0. 0. 0.]]
np.ones((2,3)) → [[1. 1. 1.] [1. 1. 1.]]
np.empty((2,3)) → NO inicializa memoria, contiene "basura" (valores residuales impredecibles); "Cuidado al crear un array con np.empty()"

CREACIÓN DE ARRAYS "UNIDAD" (np.eye)
eye_array = np.eye(3) →
[[1. 0. 0.]
 [0. 1. 0.]
 [0. 0. 1.]]
eye_array = np.eye(3, k=-1) → diagonal desplazada una fila abajo
eye_array = np.eye(3, k=1) → diagonal desplazada una fila arriba

MANIPULACION DE ARRAYS
eye_array = np.eye(3, k=1)
eye_array[eye_array == 0] = 2  → sustituye todos los ceros por 2
eye_array[eye_array < 2] = 9  → sustituye los valores menores que 2
eye_array[0] = 2  → sustituye la fila 0
eye_array[:2] = 2  → sustituye filas hasta la 2
eye_array[1:] = 2  → sustituye desde la fila 1 hasta la última
eye_array[1:, 2:] = 2  → sustituye desde fila 1 en adelante Y desde columna 2 en adelante

ORDENAR EL CONTENIDO DE LOS ARRAYS (np.sort)
sorted_array = np.sort(eye_array)  # default axis=-1 (filas)
sorted_array = np.sort(eye_array, axis=0)  # columnas
sorted_array = np.sort(eye_array, axis=-1)  # igual que por defecto
sorted_array = np.sort(eye_array, axis = 0, kind = 'quicksort')  # por defecto
sorted_array = np.sort(eye_array, axis = 0, kind = 'heapsort')
sorted_array = np.sort(eye_array, axis = 0, kind = 'mergesort')
Distintos algoritmos pueden ser más o menos rápidos según los datos.

COPIAR ARRAYS
view():
array_view = sorted_array.view()
array_view[:] = 5
print(array_view); print(sorted_array)  → AMBOS cambian a 5 ("view() afecta también al array original")

copy():
array_copy = sorted_array.copy()
array_copy[:] = 5
print(array_copy); print(sorted_array)  → solo array_copy cambia ("copy() crea un array independiente")

REPASO: 1) Convertir Listas en Arrays 2) Multidimensionalidad en los Arrays 3) Crear Arrays sin usar Listas 4) Crear Arrays unidad 5) Reasignar el contenido de los Arrays 6) Ordenar el contenido de los Arrays`,
            },
            {
                fileName: 'arrays3.pdf',
                rawText: `CREACION DE UN ARRAY
import numpy as np
a = np.zeros((3,3), dtype = np.int64)
a[:] = 2
print(a) →
[[2 2 2]
 [2 2 2]
 [2 2 2]]

b = np.arange(1,10)
b = b.reshape((3,3))
print(b) →
[[1 2 3]
 [4 5 6]
 [7 8 9]]
Forma encadenada: b = np.arange(1,10).reshape((3,3))

LLENAR ARRAYS DE VALORES
fill(): a.fill(8) → rellena todo con 8
Operador +=: a += 6
Operador -=: a -= 6
Operador *=: a *= 6
Operador /= con dtype=np.int64 → ERROR:
a = np.zeros((3,3), dtype = np.int64); a[:] = 2; a /= 6
UFuncTypeError: Cannot cast ufunc 'divide' output from dtype('float64') to dtype('int64') with casting rule 'same_kind'
Sin especificar dtype (float64 por defecto), /= funciona sin error: a = np.zeros((3,3)); a[:] = 2; a /= 6 → [[0.333.. 0.333.. 0.333..] ...]

SUMAR ELEMENTOS DE UN ARRAY
b = np.arange(1,10).reshape((3,3))
b.sum() → 45  (suma de todos los elementos)
b.sum(axis=0) → [12 15 18]  (suma de las columnas)
b.sum(axis=1) → [6 15 24]  (suma de las filas)

MULTIPLICAR ELEMENTOS DE UN ARRAY
b.prod() → 362880  (multiplica todos los elementos)
b.prod(axis=0) → [28 80 162]  (multiplica columnas)
b.prod(axis=1) → [6 120 504]  (multiplica filas)

MÁXIMO MÍNIMO Y VALOR MEDIO
b.mean() → 5.0
b.max() → 9
b.min() → 1

OBTENER ÍNDICES DE MÁXIMO Y MÍNIMO
b.argmin() → 0
b.argmax() → 8

APLANAR UN ARRAY
array_plano = b.reshape(b.size) → [1 2 3 4 5 6 7 8 9]
array_plano = b.flatten() → [1 2 3 4 5 6 7 8 9]  ("Crea una copy() del array")
array_plano = b.ravel() → [1 2 3 4 5 6 7 8 9]  ("Crea una view() del array")

TRANSPOSICIÓN DE UN ARRAY
np.swapaxes(b, 0, 1) →
[[1 4 7]
 [2 5 8]
 [3 6 9]]
b.transpose(1, 0) → mismo resultado

OPERACIONES CON MATRICES
a = np.zeros((3,3), dtype=np.int64); a[:] = 2
b = np.arange(1,10).reshape((3,3))
Suma: a + b →
[[3 4 5]
 [6 7 8]
 [9 10 11]]
Resta: a - b →
[[1 0 -1]
 [-2 -3 -4]
 [-5 -6 -7]]
Combinación: (a + b - 2*a)/4 →
[[-0.25 0. 0.25]
 [0.5 0.75 1.]
 [1.25 1.5 1.75]]

MULTIPLICACIÓN MATRICIAL (importante para IA y ML)
Diagrama genérico 2x2: [A B; C D] x [E F; G H] = [AE+BG AF+BH; CE+DG CF+DH]
np.matmul(a, b) →
[[24 30 36]
 [24 30 36]
 [24 30 36]]
Comparación con a*b (element-wise, distinto resultado):
[[2 4 6]
 [8 10 12]
 [14 16 18]]
a.dot(b) → mismo resultado que matmul
a @ b → mismo resultado que matmul
(matmul, .dot() y @ dan multiplicación matricial real; a*b es element-wise, un resultado completamente distinto)

NUMPY DOCS: https://numpy.org/doc/stable/reference/generated/numpy.ndarray.html`,
            },
        ],
    },
    {
        id: 'recursividad',
        title: 'Recursividad y Memoización',
        emoji: '♻️',
        description: 'Cómo una función puede llamarse a sí misma para resolver un problema dividiéndolo en subproblemas (caso base + caso recursivo), con Fibonacci como ejemplo central, y memoización (caché explícito con diccionario, o @lru_cache) para evitar recalcular resultados repetidos.',
        reason: 'Un único PDF (Python-avanzado-07) centrado en un concepto muy específico que requiere entender bien qué es una función y cómo se llama a sí misma — no tiene sentido dividirlo, ya que recursividad y memoización se explican como una progresión continua sobre el mismo ejemplo (Fibonacci).',
        prerequisites: ['funciones-basico'],
        concepts: [
            { id: 'rec-guia-estilo-nombres', name: 'Guía de estilo (PEP 8): nombres y docstrings de funciones', description: 'Nombres de función en minúscula con "_" como separador; incluir un docstring """...""" que explique la función concisamente.', order: 1 },
            { id: 'rec-guia-estilo-espacios', name: 'Guía de estilo: sin espacios alrededor de = en valores por defecto', description: 'def nombre_funcion(parametro_0, parametro_1=\'valor por defecto\') — no debe haber espacios alrededor del =.', order: 2 },
            { id: 'rec-guia-estilo-79-caracteres', name: 'Guía de estilo: límite de 79 caracteres por línea (PEP 8)', description: 'Si la firma de una función es muy larga, se parte en varias líneas indentadas dentro de los paréntesis.', order: 3 },
            { id: 'rec-guia-estilo-espaciado-funciones', name: 'Guía de estilo: dos líneas en blanco entre funciones', description: 'La separación estándar entre la definición de dos funciones distintas es de dos líneas en blanco.', order: 4 },
            { id: 'rec-guia-estilo-imports', name: 'Guía de estilo: los import van al principio del script', description: 'Los import deben escribirse al comienzo del archivo, después de los comentarios que describen el programa completo.', order: 5 },
            { id: 'rec-definicion', name: 'Qué es la recursividad', description: 'Concepto básico de ciencias de la computación: dividir un problema en subproblemas más fáciles de resolver uno a uno.', order: 6 },
            { id: 'rec-mecanismo', name: 'Mecanismo: llamar a una función dentro de sí misma', description: 'def recursividad(i): if i==1: return i; else: return recursividad(i-1) — la función se invoca a sí misma con un argumento modificado.', order: 7 },
            { id: 'rec-caso-base', name: 'Caso base', description: 'La condición que detiene la recursión: el punto donde la función deja de llamarse a sí misma y simplemente retorna un valor (ej. cuando i==1, o num==2 en el ejemplo de pares).', order: 8 },
            { id: 'rec-caso-recursivo', name: 'Caso recursivo', description: 'La rama donde la función se llama a sí misma con un argumento que se acerca al caso base (ej. recursividad(i-1), numeros_pares(num-2)).', order: 9 },
            { id: 'rec-ejemplo-pares', name: 'Ejemplo: escribir números pares menores que N', description: 'def numeros_pares(num): print(num); if num==2: return num (caso base); else: return numeros_pares(num-2) — comparado explícitamente con su versión iterativa equivalente (for i in range(num,0,-2)), mismo resultado por ambos caminos.', order: 10 },
            { id: 'rec-fibonacci-definicion', name: 'Serie de Fibonacci: definición', description: 'Secuencia donde cada número es la suma de los dos anteriores: 0, 1, 1, 2, 3, 5, 8, 13, 21... — relacionada visualmente con espirales en la naturaleza (conchas, galaxias, huracanes) y el rectángulo áureo.', order: 11 },
            { id: 'rec-fibonacci-recursivo', name: 'Fibonacci recursivo', description: 'def fibonacci(indice): if indice<=1: return indice; else: return fibonacci(indice-1)+fibonacci(indice-2) — caso base indice<=1, caso recursivo suma de las dos llamadas anteriores.', order: 12 },
            { id: 'rec-arbol-llamadas', name: 'Árbol de llamadas recursivas', description: 'Descomposición visual de fibonacci(5) en sus llamadas anidadas hasta los casos base — muestra cómo el número de llamadas crece exponencialmente y cómo se repiten cálculos idénticos (ej. fibonacci(3) y fibonacci(2) se recalculan varias veces).', order: 13 },
            { id: 'rec-fibonacci-iterativo', name: 'Fibonacci iterativo (alternativa sin recursión)', description: 'def fibonacci_iter(indice): secuencia=[0,1]; for i in range(indice): secuencia.append(secuencia[-1]+secuencia[-2]); return secuencia[-2] — construye la secuencia con una lista y un bucle en vez de llamadas recursivas.', order: 14 },
            { id: 'rec-medir-tiempos', name: 'Medir tiempos de ejecución con time.time()', description: 'start = time.time(); fibonacci(8); end = time.time(); comparar end-start entre la versión recursiva y la iterativa — la iterativa suele ser más rápida.', order: 15 },
            { id: 'rec-memoizacion-definicion', name: 'Qué es la memoización', description: 'Técnica de optimización que almacena en memoria los resultados de una función para evitar recalcularlos en llamadas futuras con los mismos parámetros; mejora el rendimiento en cálculos costosos o repetitivos.', order: 16 },
            { id: 'rec-memoizacion-explicita', name: 'Memoización explícita con diccionario caché', description: 'fibonacci_cache = {}; dentro de la función: comprobar if indice in fibonacci_cache: return fibonacci_cache[indice]; si no, calcular el valor, guardarlo en el diccionario (fibonacci_cache[indice]=valor) y devolverlo.', order: 17 },
            { id: 'rec-memoizacion-implicita', name: 'Memoización implícita con @lru_cache', description: 'from functools import lru_cache; @lru_cache(maxsize=20) encima de la función — forma nativa de Python de memoizar sin escribir el diccionario caché a mano.', order: 18 },
            { id: 'rec-comparacion-rendimiento', name: 'Comparación final de rendimiento', description: 'Recursivo vs iterativo vs caché explícito vs caché implícito (lru_cache) — el caché implícito resulta ser el más rápido de los cuatro enfoques.', order: 19 },
        ],
        sources: [
            {
                fileName: 'Python-avanzado-07-Teoria-1-Recursividad-y-Memoizacion_667873e8.pdf',
                rawText: `GUIA DE ESTILO
Funciones y módulos deben tener nombres descriptivos (en minuscula y con "_" separando las palabras). Las funciones deben incluir un comentario conciso que explique su función en formato docstring """ """.
Sabiendo el nombre de la función, los argumentos necesarios y los valores de retorno cualquier programador debe poder integrar la función en sus programas.

def nombre_funcion(parametro_0, parametro_1='valor por defecto')
llamada_funcion(parametro_0, parametro_1="valor")
No debe haber espacios alrededor del "="

PEP 8 (https://peps.python.org/pep-0008/): Recomienda limitar las lineas de código a 79 caracteres.
def nombre_funcion(
        parameter_0, parameter_1, parameter_2,
        parameter_3, parameter_4, parameter_5):
    cuerpo de la funcion

La separación entre la definición de dos funciones es de dos lineas en blanco.

Los import deben escribirse al comienzo del script después de los comentarios que describen el programa al completo.

RECURSIVIDAD
Concepto basico en computer science: Se basa en dividir el problema en sub-problemas faciles de resolver uno a uno.

Se trata de llamar a una función dentro de si misma.
def recursividad(i):
    if i ==1:
        return i
    else:
        return recursividad(i-1)
recursividad(100)
(metáfora visual: muñecas matrioshka rusas anidadas; la más pequeña, que ya no contiene otra dentro, es el "Caso Base")

EJEMPLO: Escribir todos los números pares positivos menores que 8
def numeros_pares(num):
    print(num)
    if num == 2:            # Caso Base
        return num
    else:
        return numeros_pares(num-2)
numeros_pares(8)
Output: 8 6 4 2

Comparación con versión ITERATIVA (mismo resultado):
def numeros_pares(num):
    for i in range(num, 0, -2):
        print(i)
numeros_pares(8)
Output: 8 6 4 2

EJEMPLO: Serie de Fibonacci
Es una secuencia donde cada numero es la suma de los dos anteriores
0   1   1   2   3   5   8   13   21 …
índice: 0 1 2 3 4 5 6 7 8...
número: 0 1 1 2 3 5 8 13 21...
(relación visual con el rectángulo áureo 5x5, 8x8, 13x13, 21x21 y espirales de la naturaleza: huracanes, galaxias, conchas de nautilus, piñas, plantas)

def fibonacci(indice):
    if indice <=1:
        return indice
    else:
        return fibonacci(indice-1)+fibonacci(indice-2)

for i in range(0,11):
    print(fibonacci(i))
Output: 0 1 1 2 3 5 8 13 21 34 55

Árbol de llamadas para fibonacci(3):
fibonacci(3) → fibonacci(2) + fibonacci(1)
                    ↓              ↓
        fibonacci(1)+fibonacci(0)    1
              ↓         ↓
              1         0
Suma total = 2

Árbol de llamadas completo para fibonacci(5) muestra ramas que se repiten: varias llamadas idénticas a fibonacci(2)+fibonacci(1) y a fibonacci(1)+fibonacci(0) se recalculan más de una vez — esto motiva la memoización.

Versión ITERATIVA de Fibonacci:
def fibonacci_iter(indice):
    secuencia = [0,1]
    for i in range(indice):
        secuencia.append(secuencia[-1] + secuencia[-2])
    return secuencia[-2]
for i in range(0,11):
    print(fibonacci_iter(i))
Output: 0 1 1 2 3 5 8 13 21 34 55  (mismo resultado que la versión recursiva)

Medición de tiempos:
start_recursive = time.time()
fibonacci(8)
end_recursive = time.time()
print("total time recursive...", end_recursive - start_recursive)

start_iter = time.time()
fibonacci_iter(8)
end_iter = time.time()
print("total time iterative...", end_iter - start_iter)
Output:
total time recursive... 5.245208740234375e-06
total time iterative... 2.1457672119140625e-06

MEMOIZACIÓN
Técnica de optimización en la programación en la cual se almacenan en memoria los resultados de una función para evitar recalcularlos en llamadas futuras con los mismos parámetros. La memoización puede mejorar significativamente el rendimiento de las funciones que realizan cálculos costosos o repetitivos.

IMPLEMENTACION EXPLICITA:
fibonacci_cache = {}
def fibonacci_ca(indice):
    #Si tenemos el valor en cache lo devolvemos
    if indice in fibonacci_cache:
        return(fibonacci_cache[indice])
    #Calcular el termino de orden n
    if indice <=1:
        valor = indice
    else:
        valor =  fibonacci_ca(indice-1)+fibonacci_ca(indice-2)
    # Guardar el valor en cache y devolverlo
    fibonacci_cache[indice] = valor
    return(valor)

Output comparación de tiempos:
total time recursive... 5.7220458984375e-06
total time iterative... 3.0994415283203125e-06
total time cache... 2.86102294921875e-06

IMPLEMENTACION IMPLICITA (nativa de Python):
from functools import lru_cache
@lru_cache(maxsize = 20)
def fibonacci_cache_implicito(indice):
    if indice <=1:
        return indice
    else:
        return fibonacci(indice-1)+fibonacci(indice-2)

Output comparación completa de tiempos:
total time recursive... 2.47955322265625e-05
total time iterative... 8.344650268554688e-06
total time cache explicito... 6.198883056640625e-06
total time cache implicito... 5.245208740234375e-06`,
            },
        ],
    },
    {
        id: 'diccionarios',
        title: 'Diccionarios',
        emoji: '📖',
        description: 'Colecciones no ordenadas de pares clave-valor: crear, acceder, modificar, añadir y eliminar entradas; métodos keys/values/items/get/pop/clear; y cómo construir un diccionario a partir de listas de tuplas, listas paralelas (zip) o sets.',
        reason: 'Un único PDF que introduce el diccionario como la cuarta estructura de datos in-built del curso, explícitamente después de listas, arrays, tuplas y sets — por eso depende de haber visto ya tuplas/sets (comparte su vocabulario de "colección no ordenada" y reutiliza zip() ya visto conceptualmente en listas).',
        prerequisites: ['tuplas-y-sets'],
        concepts: [
            { id: 'dict-definicion', name: 'Qué es un diccionario', description: 'Colección NO ordenada de pares clave-valor; a diferencia de listas/tuplas/sets, no se accede por índice numérico sino por clave (analogía: un diccionario real, buscas una palabra y obtienes su definición).', order: 1 },
            { id: 'dict-sintaxis', name: 'Sintaxis básica: {clave: valor, ...}', description: 'mi_diccionario = {\'manzana\': 1, \'plátano\': 2, \'naranja\': 3} — cada entrada es un par Clave : Valor separado por comas.', order: 2 },
            { id: 'dict-vacio', name: 'Diccionario vacío: {}', description: 'mi_diccionario = {} crea un diccionario vacío (type dict); se puede ir poblando incrementalmente asignando claves una a una.', order: 3 },
            { id: 'dict-acceso', name: 'Acceder a un valor por su clave', description: 'mi_diccionario[\'manzana\'] devuelve 1 — se usa la clave entre corchetes, no una posición.', order: 4 },
            { id: 'dict-modificar', name: 'Modificar el valor de una clave existente', description: 'mi_diccionario[\'manzana\'] = 4 sobrescribe el valor asociado a esa clave.', order: 5 },
            { id: 'dict-anadir', name: 'Añadir un nuevo par clave-valor', description: 'mi_diccionario[\'pera\'] = 4 crea una nueva entrada si la clave \'pera\' no existía.', order: 6 },
            { id: 'dict-eliminar-clave', name: 'Eliminar un par clave-valor con del', description: 'del mi_diccionario[\'plátano\'] elimina solo esa entrada específica.', order: 7 },
            { id: 'dict-eliminar-todo-cuidado', name: 'Cuidado: del diccionario (sin clave) borra la variable entera', description: 'del mi_diccionario (sin especificar clave) elimina el diccionario completo, no una entrada; usarlo después da NameError: name \'mi_diccionario\' is not defined.', order: 8 },
            { id: 'dict-caso-uso-objeto', name: 'Caso de uso: varias informaciones sobre UN objeto', description: 'persona = {"edad": 23, "estado civil": "casado", "DNI": "78656427A"} — varias claves distintas describiendo el mismo objeto/entidad.', order: 9 },
            { id: 'dict-caso-uso-multiples-objetos', name: 'Caso de uso: un mismo tipo de dato sobre VARIOS objetos', description: 'lenguaje_programacion = {"Paolo": "Python", "Lucas": "C", "Dani": "Solidity"} — misma clase de valor (lenguaje favorito) por cada clave (persona).', order: 10 },
            { id: 'dict-formato-multilinea', name: 'Buena práctica: formato multilínea para diccionarios grandes', description: 'Escribir cada par clave-valor en su propia línea indentada mejora la legibilidad de diccionarios con varias entradas.', order: 11 },
            { id: 'dict-keys', name: 'Método .keys()', description: 'mi_diccionario.keys() devuelve un objeto dict_keys con todas las claves, ej. dict_keys([\'manzana\', \'plátano\', \'naranja\']).', order: 12 },
            { id: 'dict-values', name: 'Método .values()', description: 'mi_diccionario.values() devuelve un objeto dict_values con todos los valores, ej. dict_values([1, 2, 3]).', order: 13 },
            { id: 'dict-items', name: 'Método .items()', description: 'mi_diccionario.items() devuelve un objeto dict_items con tuplas (clave, valor) de cada par.', order: 14 },
            { id: 'dict-get', name: 'Método .get() — acceso seguro', description: 'mi_diccionario.get(\'manzana\') devuelve el valor si la clave existe; mi_diccionario.get(\'pera\') devuelve None si no existe (o el valor por defecto que se le pase como segundo argumento, ej. .get(\'pera\', 0)) — evita el error que da el acceso directo.', order: 15 },
            { id: 'dict-keyerror', name: 'KeyError con acceso directo a clave inexistente', description: 'mi_diccionario[\'pera\'] sobre un diccionario sin esa clave da KeyError: \'pera\' — a diferencia de .get(), que no lanza error.', order: 16 },
            { id: 'dict-pop', name: 'Método .pop()', description: 'valor = mi_diccionario.pop(\'manzana\') elimina esa clave del diccionario Y devuelve su valor — a diferencia de del, que solo elimina sin devolver nada.', order: 17 },
            { id: 'dict-clear', name: 'Método .clear()', description: 'mi_diccionario.clear() vacía el diccionario dejándolo como {}, sin eliminar la variable (a diferencia de del mi_diccionario).', order: 18 },
            { id: 'dict-desde-lista-tuplas', name: 'Construir un diccionario desde una lista de tuplas', description: 'dict([(\'2022-01-01\', 100), (\'2022-02-14\', 50)]) construye un diccionario donde cada tupla (clave, valor) se convierte en una entrada; si hay dos tuplas con la misma clave, solo se conserva la ÚLTIMA de la lista.', order: 19 },
            { id: 'dict-desde-zip', name: 'Construir un diccionario desde dos listas paralelas con zip()', description: 'dict(zip(keys, values)) empareja elementos de dos listas por posición; si las listas tienen longitudes distintas, zip() trunca al tamaño de la lista más corta e ignora los elementos sobrantes.', order: 20 },
            { id: 'dict-desde-set-tuplas', name: 'Construir un diccionario desde un set de tuplas', description: 'dict(mi_set) también funciona partiendo de un set de tuplas (clave, valor); igual que con listas, si hay claves duplicadas solo se conserva una, y el orden del resultado no está garantizado porque los sets no son ordenados.', order: 21 },
        ],
        sources: [
            {
                fileName: 'Python-avanzado-Diccionarios-Clase-01-Teoria-Diapositivas_131fece2.pdf',
                rawText: `REPASO
Estructuras de datos:
1. Listas       → in - built
2. Arrays       → importar modulo
3. Tuplas       → in - built
4. Sets         → in - built

QUE VEREMOS HOY: Estructuras de datos in-built: 1. Listas 2. Tuplas 3. Sets 4. Diccionarios

DICCIONARIOS
Definición: Colecciones no ordenadas de pares clave-valor. Los elementos no llevan un indice asociado si no una clave. Podemos pensar en un diccionario real, donde buscamos una palabra y encontramos su definición.

SINTAXIS BASICA
Set: mi_set= {'fruta', 45, True} → <class 'set'>
Tupla: mi_tupla_1 = ("fruta", 45, True) → <class 'tuple'>
Lista: mi_lista_1 = ["fruta", 45, True] → <class 'list'>
Diccionario:
mi_diccionario = {'manzana': 1, 'plátano': 2, 'naranja': 3}
print(mi_diccionario) → {'manzana': 1, 'plátano': 2, 'naranja': 3}
print(type(mi_diccionario)) → <class 'dict'>
(anotación: 'manzana','plátano','naranja' = Clave; 1,2,3 = Valor; formato Clave : Valor)

Diccionario vacío:
mi_diccionario = {}
print(type(mi_diccionario)) → <class 'dict'>

TRABAJAR CON ELEMENTOS DE UN DICCIONARIO
Acceder a valores por clave:
mi_diccionario = {'manzana': 1, 'plátano': 2, 'naranja': 3}
print(mi_diccionario['manzana']) → 1

Modificar valores:
mi_diccionario['manzana'] = 4
print(mi_diccionario) → {'manzana': 4, 'plátano': 2, 'naranja': 3}

Agregar pares clave-valor:
mi_diccionario['pera'] = 4
print(mi_diccionario) → {'manzana': 1, 'plátano': 2, 'naranja': 3, 'pera': 4}

Eliminar pares clave-valor:
del mi_diccionario['plátano']
print(mi_diccionario) → {'manzana': 1, 'naranja': 3}

Cuidado al usar del (eliminando el diccionario entero por error):
del mi_diccionario
print(mi_diccionario)
NameError: name 'mi_diccionario' is not defined

Diccionarios vacíos (construcción incremental):
mi_diccionario = {}
mi_diccionario['manzana'] = 1
mi_diccionario['platano'] = 2
mi_diccionario['naranja'] = 3
print(mi_diccionario) → {'manzana': 1, 'platano': 2, 'naranja': 3}

CASOS DE USO COMUNES
Diccionario con informaciones diversas sobre un objeto:
persona = {"edad": 23, "estado civil": "casado", "DNI": "78656427A"}
edad = persona["edad"]
print(edad) → 23

Diccionario con un tipo de información sobre varios objetos:
lenguaje_programacion = { "Paolo": "Python", "Lucas": "C", "Dani": "Solidity"}
lenguaje_dani = lenguaje_programacion["Dani"]
print(lenguaje_dani) → Solidity

Buenas prácticas: formato multilinea con cada par clave-valor en su propia línea, para ambos casos de uso.

MÉTODOS DE DICCIONARIOS
keys(): mi_diccionario.keys() → dict_keys(['manzana', 'plátano', 'naranja'])  ("Devuelve una lista de todas las claves")
values(): mi_diccionario.values() → dict_values([1, 2, 3])  ("Devuelve una lista de todos los valores")
items(): mi_diccionario.items() → dict_items([('manzana', 1), ('plátano', 2), ('naranja', 3)])  ("Devuelve una lista de todos los pares")
get(): mi_diccionario.get('manzana') → 1; mi_diccionario.get('pera') → None  ("Si la clave no existe, devuelve un valor predeterminado")

Comparación acceso directo vs get():
mi_diccionario['manzana'] → 1
mi_diccionario['pera']
KeyError: 'pera'

get() con valor predeterminado explícito:
mi_diccionario.get('manzana') → 1
mi_diccionario.get('pera',0) → 0

pop(): valor = mi_diccionario.pop('manzana'); print(mi_diccionario) → {'plátano': 2, 'naranja': 3}; print(valor) → 1  ("Elimina y devuelve el valor de una clave")
clear(): mi_diccionario.clear(); print(mi_diccionario) → {}  ("Elimina todos los pares clave-valor")

DE TUPLAS A DICCIONARIOS
Sintaxis: mis_tuplas = [(key1, value1), (key2, value2)]; mi_dict = dict(mis_tuplas)
Ejemplo:
eventos = [('2022-01-01', 100), ('2022-02-14', 50), ('2022-03-17', 75)]
event_dict = dict(eventos)
print(event_dict) → {'2022-01-01': 100, '2022-02-14': 50, '2022-03-17': 75}
IMPORTANTE: si hay dos tuplas con la misma clave en la lista, solo se conservará la ÚLTIMA.
Ejemplo con clave duplicada:
eventos = [('2022-01-01', 100), ('2022-02-14', 50), ('2022-03-17', 75), ('2022-03-17', 15)]
event_dict = dict(eventos)
print(event_dict) → {'2022-01-01': 100, '2022-02-14': 50, '2022-03-17': 15}  ('2022-03-17' quedó con 15, el valor de la última tupla)

DE LISTAS A DICCIONARIOS (con zip)
Sintaxis: keys = ['key1','key2','key3']; values = [v1,v2,v3]; my_dict = dict(zip(keys, values))
Ejemplo:
materias = ['matemáticas', 'historia', 'ciencias']
notas = [8.5, 7.0, 9.0]
notas_dict = dict(zip(materias, notas))
print(notas_dict) → {'matemáticas': 8.5, 'historia': 7.0, 'ciencias': 9.0}

Paso intermedio ilustrativo:
lista_tuplas = list(zip(materias, notas))
print(lista_tuplas) → [('matemáticas', 8.5), ('historia', 7.0), ('ciencias', 9.0)]

IMPORTANTE: las dos listas deben tener la misma longitud. Si tienen longitudes diferentes, zip() solo toma los elementos hasta la longitud de la lista más corta.
Ejemplo con listas de longitud distinta:
materias = ['matemáticas', 'historia', 'ciencias', 'fisica']
notas = [8.5, 7.0, 9.0]
lista_tuplas = list(zip(materias, notas))
print(lista_tuplas) → [('matemáticas', 8.5), ('historia', 7.0), ('ciencias', 9.0)]  ('fisica' quedó excluida)

DE SETS A DICCIONARIOS
Sintaxis: my_set = {('key1', value1), ('key2', value2)}; my_dict = dict(my_set)
Ejemplo:
notas_set = {('matemáticas', 8.5), ('historia', 7.0), ('ciencias', 9.0)}
notas_dict = dict(notas_set)
print(notas_dict) → {'ciencias': 9.0, 'matemáticas': 8.5, 'historia': 7.0}  (el orden del output no coincide con el orden de escritura, porque los sets no son ordenados)
IMPORTANTE: si hay dos tuplas con la misma clave en el set, solo se conservará una.
Ejemplo con clave duplicada en set:
notas_set = {('matemáticas', 8.5), ('historia', 7.0), ('ciencias', 9.0), ('ciencias', 8.0)}
notas_dict = dict(notas_set)
print(notas_dict) → {'ciencias': 8.0, 'matemáticas': 8.5, 'historia': 7.0}

REPASO: 1) Que es un diccionario y su sintaxis 2) Manipular pares clave-valor 3) Casos de uso 4) Métodos aplicables a diccionarios 5) Relación entre listas/tuplas/sets y diccionarios`,
            },
        ],
    },
    {
        id: 'manipulacion-archivos',
        title: 'Manipulación de Archivos',
        emoji: '📁',
        description: 'Leer y escribir archivos de texto con open()/with, file paths relativos y absolutos, los distintos modos (r/w/a/x/b/t), trabajar con archivos usando NumPy (CSV) y guardar/cargar datos de Python en formato JSON.',
        reason: 'PDF "Teoría 2" centrado en I/O de archivos, con ejemplos propios (contador de palabras) reutilizados después como caso práctico en el bloque de Excepciones — por eso conviene dominar primero cómo se abre/lee/escribe un archivo, antes de aprender a manejar sus errores.',
        prerequisites: ['funciones-basico'],
        concepts: [
            { id: 'arch-objetivo', name: 'Por qué trabajar con archivos', description: 'Necesario para analizar/modificar grandes cantidades de datos, y para guardar datos y hacer los programas más cómodos (reanudar ejecución, guardar mensajes de error, recordar preferencias del usuario).', order: 1 },
            { id: 'arch-open-with', name: 'Leer un archivo: open() y with', description: 'with open(\'archivo.txt\') as archivo_objeto: contenido = archivo_objeto.read() — open() devuelve un objeto que representa el archivo; con with, Python cierra el archivo automáticamente.', order: 2 },
            { id: 'arch-path-relativo', name: 'File paths relativos', description: 'open(\'path/directorio/archivo.txt\') en Linux/macOS vs open(\'path\\\\directorio\\\\archivo.txt\') en Windows — rutas relativas a la ubicación del script.', order: 3 },
            { id: 'arch-path-absoluto', name: 'File paths absolutos', description: 'file_path = \'/home/usuario/carpeta/archivo.txt\' (Linux/macOS) o \'C:\\\\Users\\\\usuario\\\\carpeta\\\\archivo.txt\' (Windows), luego open(file_path).', order: 4 },
            { id: 'arch-leer-linea-a-linea', name: 'Leer línea por línea', description: 'for linea in archivo_objeto: print(linea) — iterar directamente sobre el objeto archivo dentro del with.', order: 5 },
            { id: 'arch-readlines', name: 'readlines(): guardar todas las líneas en una lista', description: 'lineas = archivo_objeto.readlines() devuelve una lista de líneas; se puede iterar fuera del with y usar .rstrip() para quitar el salto de línea de cada una.', order: 6 },
            { id: 'arch-concatenar-lineas', name: 'Concatenar el contenido en un único string', description: 'Acumular todas las líneas con += (ej. pi_string += linea.strip()) y usar len() para conocer la longitud total del contenido concatenado.', order: 7 },
            { id: 'arch-escribir-modo-w', name: 'Escribir en un archivo: modo "w"', description: 'open(filename, "w") crea el archivo si no existe, o lo SOBRESCRIBE por completo si ya existe; luego archivo_objeto.write("texto") escribe en él.', order: 8 },
            { id: 'arch-writes-sin-salto', name: 'Escrituras múltiples sin salto de línea', description: 'Dos write() consecutivos sin \\n concatenan el texto en la misma línea del archivo resultante.', order: 9 },
            { id: 'arch-writes-con-salto', name: 'Usar \\n para separar líneas al escribir', description: 'Añadir \\n al final de cada string en write() produce líneas separadas en el archivo.', order: 10 },
            { id: 'arch-tabla-modos', name: 'Tabla de modos de open()', description: 'r = lectura (predeterminado); w = escritura, sobrescribe o crea; a = anexar al final, crea si no existe; x = creación exclusiva, falla si ya existe; b = modo binario (se combina, ej. \'rb\'/\'wb\'); t = modo texto, predeterminado (se combina, ej. \'rt\'/\'wt\').', order: 11 },
            { id: 'arch-tabla-modos-actualizacion', name: 'Modos de actualización (lectura+escritura)', description: 'r+ = puntero al principio del archivo; w+ = sobrescribe o crea; a+ = puntero al final del archivo.', order: 12 },
            { id: 'arch-anadir-modo-a', name: 'Añadir contenido con el modo "a"', description: 'open(filename, \'a\') agrega contenido nuevo AL FINAL de un archivo existente sin borrar lo que ya había, a diferencia del modo "w" que sobrescribe todo.', order: 13 },
            { id: 'arch-open-w-mas', name: 'Forma alternativa: open(nombre, "w+") sin with', description: 'f = open(nombre_archivo, "w+"); f.write(contenido) — abrir en modo actualización/escritura combinado directamente, sin el bloque with.', order: 14 },
            { id: 'arch-filenotfounderror', name: 'FileNotFoundError al abrir un archivo inexistente', description: 'open(\'test.txt\') sobre un archivo que no existe da FileNotFoundError: [Errno 2] No such file or directory: \'test.txt\'.', order: 15 },
            { id: 'arch-numpy-lectura', name: 'Leer datos con NumPy: loadtxt() y genfromtxt()', description: 'np.loadtxt(\'datos.csv\', delimiter=\',\') para CSV; np.loadtxt(\'datos.txt\') para texto plano; np.genfromtxt(\'datos.csv\', delimiter=\',\', skip_header=1) para archivos con fila de encabezado.', order: 16 },
            { id: 'arch-numpy-escritura', name: 'Escribir datos con NumPy: savetxt()', description: 'np.savetxt(\'datos.csv\', data, delimiter=\',\') guarda un array; también admite header= y comments=\'\' para incluir una fila de encabezado.', order: 17 },
            { id: 'arch-json-motivacion', name: 'Por qué usar JSON', description: 'Para guardar el input de los usuarios (preferencias de un juego, datos de visualización) en listas o diccionarios que persistan entre ejecuciones del programa, en vez de perderse al cerrarlo.', order: 18 },
            { id: 'arch-json-que-es', name: 'Qué es JSON', description: 'JSON = JavaScript Object Notation; desarrollado originalmente para JavaScript, es uno de los formatos de intercambio de datos más usados en muchos lenguajes, incluido Python.', order: 19 },
            { id: 'arch-json-dump', name: 'Escribir JSON con json.dump()', description: 'import json; with open(filename, \'w\') as f_obj: json.dump(numeros, f_obj) — convierte un objeto de Python en un JSON string y lo escribe en el archivo.', order: 20 },
            { id: 'arch-json-load', name: 'Leer JSON con json.load()', description: 'with open(filename) as f_obj: numeros = json.load(f_obj) — convierte el JSON string del archivo de vuelta en un objeto de Python (ej. una lista).', order: 21 },
        ],
        sources: [
            {
                fileName: 'Python-avanzado-Teoria-2-Manipulacion-de-Archivos-Diapositivas_9a4fbe5a.pdf',
                rawText: `OBJETIVO
Aprender a trabajar con archivos y manejar grandes cantidades de datos → Necesario para analizar y modificar información.
Guardar datos para hacer nuestros programas más cómodos para el usuario → Poder reanudar la ejecución de un script o guardar mensajes de error.

LEER UN ARCHIVO — open() devuelve un objeto
Archivo digitos_pi.txt: 1 3.1415926535 / 2 8979323846 / 3 2643383279
with open('digitos_pi.txt') as archivo_objeto:
    contenido = archivo_objeto.read()
    print(contenido)
open() devuelve un objeto que representa el archivo. Python se encarga de manejar el cierre del archivo.

USAR FILE PATHS - RELATIVO
Linux/OS X: with open('path/directorio/digitos_pi.txt') as archivo_objeto: ...
Windows: with open('path\\directorio\\digitos_pi.txt') as archivo_objeto: ...

USAR FILE PATHS - ABSOLUTO
Linux/OS X: file_path = '/home/elena/otros_archivos/archivos_texto/filename.txt'
Windows: file_path = 'C:\\Users\\elena\\otros_archivos\\archivos_texto\\filename.txt'
with open(file_path) as archivo_objeto: ...

LEER LINEA POR LINEA
with open('digitos_pi.txt') as archivo_objeto:
    for linea in archivo_objeto:
        print(linea)
Output: 3.1415926535 / 8979323846 / 2643383279 (cada uno en su línea, con línea en blanco extra por el \\n del archivo)

GUARDAR INFORMACION DE UN ARCHIVO (readlines)
filename = 'digitos_pi.txt'
with open(filename) as archivo_objeto:
    lineas = archivo_objeto.readlines()
for linea in lineas:
    print(linea.rstrip())
Output: 3.1415926535 / 8979323846 / 2643383279

MANEJAR INFORMACION DE UN ARCHIVO (concatenar y len)
filename = 'digitos_pi.txt'
with open(filename) as archivo_objeto:
    lineas = archivo_objeto.readlines()
pi_string = ''
for linea in lineas:
    pi_string += linea.strip()
print(pi_string)
print(len(pi_string))
Output: 3.14159265358979323846264338327 9 / 32

ESCRIBIR EN UN ARCHIVO — ARCHIVOS VACIOS
filename = "programa.txt"
with open(filename, "w") as archivo_objeto:
    archivo_objeto.write("Estoy aprendiendo python")

TABLA MODOS OPEN (básicos)
r  Modo de lectura. Abre el archivo para lectura (predeterminado).
w  Modo de escritura. Sobrescribe el archivo si existe, o crea uno nuevo si no existe.
a  Modo de anexar. Agrega contenido al final en lugar de sobrescribirlo. Crea un nuevo archivo si no existe.
x  Modo de creación exclusiva. Abre para escritura, pero falla si el archivo ya existe.
b  Modo binario. Se usa junto con otros modos, como 'rb' lectura binaria y 'wb' escritura binaria.
t  Modo de texto (predeterminado). Se usa junto con otros modos, como 'rt' y 'wt'.

TABLA MODOS OPEN (actualización)
r+  Lectura y escritura. El puntero se coloca al principio del archivo.
w+  Lectura y escritura. El archivo se sobrescribe o crea uno nuevo.
a+  Lectura y escritura. El puntero se coloca al final del archivo.

ESCRIBIR: dos writes sin salto de línea
with open(filename, "w") as archivo_objeto:
    archivo_objeto.write("Estoy aprendiendo python.")
    archivo_objeto.write("Estoy en el modulo avanzado.")
Resultado en programa.txt: Estoy aprendiendo python.Estoy en el modulo avanzado.  (todo junto, sin separación)

ESCRIBIR: con \\n
with open(filename, "w") as archivo_objeto:
    archivo_objeto.write("Estoy aprendiendo python. \\n")
    archivo_objeto.write("Estoy en el modulo avanzado.")
Resultado: Estoy aprendiendo python. / Estoy en el modulo avanzado.  (dos líneas separadas)

AÑADIR ELEMENTOS A UN ARCHIVO — modo "a"
with open(filename, "w") as archivo_objeto:
    archivo_objeto.write("Estoy aprendiendo python. \\n")
    archivo_objeto.write("Estoy en el modulo avanzado.\\n")
with open(filename, 'a') as file_object:
    file_object.write("Estoy creando un nuevo set de datos.\\n")
    file_object.write("Y separo las lineas correctamente.\\n")
Resultado en programa.txt (4 líneas):
Estoy aprendiendo python.
Estoy en el modulo avanzado.
Estoy creando un nuevo set de datos.
Y separo las lineas correctamente.

Forma alternativa sin with:
f = open(nombre_archivo, "w+")
f.write(contenido_en_forma_de_string)

FileNotFound (sin manejo, causa crash)
filename = "test.txt"
with open(filename) as f_obj:
    contenido = f_obj.read()
Error: FileNotFoundError [Errno 2] No such file or directory: 'test.txt'

Ejemplo Practico — análisis de textos (contar palabras, con try/except/else — ver detalle completo en el bloque de Excepciones):
filename = "test.txt"
try:
    with open(filename) as f_obj:
        contenido = f_obj.read()
except FileNotFoundError:
    msj = "Lo siento, el archivo " + filename + " no existe."
    print(msj)
else:
    palabras = contenido.split()
    num_palabras = len(palabras)
    print("El archivo " + filename + " tiene " + str(num_palabras) + " palabras.")
Output: El archivo test.txt tiene 125 palabras.

MANEJAR ARCHIVOS CON NUMPY — LECTURA
import numpy as np
data = np.loadtxt('datos.csv', delimiter=',')          # CSV
data = np.loadtxt('datos.txt')                          # texto plano
data = np.genfromtxt('datos.csv', delimiter=',', skip_header=1)   # con encabezados

MANEJAR ARCHIVOS CON NUMPY — ESCRITURA
import numpy as np
data = np.array([[1, 2, 3], [4, 5, 6], [7, 8, 9]])
np.savetxt('datos.csv', data, delimiter=',')
np.savetxt('datos.txt', data)
header = 'Columna 1, Columna 2, Columna 3'
np.savetxt('datos.csv', data, delimiter=',', header=header, comments='')

TRABAJAR CON ARCHIVOS JSON
En muchos programas querremos guardar el input de los usuarios (p.e. preferencias en un juego o datos de visualización). Guardaremos la información en estructuras de datos como listas o diccionarios. Cuando se cierre el programa querremos que la información de los settings no se pierda — la guardamos en archivos json.

JSON = JavaScript Object Notation. Desarrollado originalmente para JavaScript. Es uno de los formatos más usados en muchos lenguajes de programación, también python.

Escribir JSON:
import json
numeros = [2, 3, 5, 7, 11, 13]
filename = 'numeros.json'
with open(filename, 'w') as f_obj:
    json.dump(numeros, f_obj)
(json.dump convierte un objeto de python en un json string y lo escribe en el archivo)
Resultado en numeros.json: [2, 3, 5, 7, 11, 13]

Leer JSON:
import json
filename = 'numeros.json'
with open(filename) as f_obj:
    numeros = json.load(f_obj)
    print(numeros)
(json.load convierte el json string en un objeto de python; abrimos el archivo en reading mode)
Output: [2, 3, 5, 7, 11, 13]  <class 'list'>`,
            },
        ],
    },
    {
        id: 'excepciones',
        title: 'Manejo de Excepciones',
        emoji: '🚨',
        description: 'Cómo evitar que un programa se detenga (crash) ante errores esperables: try/except, la cláusula else, capturar ZeroDivisionError y FileNotFoundError, y criterios de diseño sobre qué errores merece la pena reportar al usuario.',
        reason: 'PDF "Teoría 2" hermano del de Manipulación de Archivos (comparten el mismo ejemplo de "análisis de textos" con try/except/else) — el manejo de FileNotFoundError que aquí se explica en profundidad asume ya conocido open()/with open() del bloque de archivos.',
        prerequisites: ['manipulacion-archivos'],
        concepts: [
            { id: 'exc-objetivo', name: 'Objetivo: dar solidez y estabilidad a los programas', description: 'Manejar errores para que los programas no crasheen ante situaciones inesperadas (errores aritméticos, ausencia de archivos, etc.).', order: 1 },
            { id: 'exc-que-es-excepcion', name: 'Qué es una excepción', description: 'Un objeto de tipo excepción que Python crea cuando no puede realizar lo que se le pide.', order: 2 },
            { id: 'exc-zerodivisionerror', name: 'ZeroDivisionError', description: 'print(5/0) da ZeroDivisionError: division by zero — un número no puede dividirse por 0.', order: 3 },
            { id: 'exc-try-except', name: 'Bloque try/except', description: 'try: código riesgoso; except TipoDeError: qué hacer si falla — si el try funciona, Python ignora el except; si falla, busca el except que corresponda al tipo de error producido.', order: 4 },
            { id: 'exc-mensaje-personalizado', name: 'Mensaje de error personalizado sin crash', description: 'Dentro del except se puede poner cualquier lógica (ej. un print con mensaje amigable) y el programa sigue ejecutándose sin detenerse.', order: 5 },
            { id: 'exc-evitar-crash-bucle', name: 'Evitar crashes en un bucle interactivo', description: 'Combinar while True + input() + try/except para que el programa no se detenga ante una entrada inválida (ej. dividir por 0 introducido por el usuario) y siga pidiendo datos.', order: 6 },
            { id: 'exc-else', name: 'Cláusula else en try/except', description: 'El código que solo debe ejecutarse si el try tuvo éxito (sin excepción) se coloca en un bloque else después del/los except.', order: 7 },
            { id: 'exc-filenotfounderror', name: 'FileNotFoundError', description: 'open(\'test.txt\') sobre un archivo que no existe da FileNotFoundError: [Errno 2] No such file or directory: \'test.txt\'.', order: 8 },
            { id: 'exc-manejar-filenotfound', name: 'Manejar FileNotFoundError con try/except', description: 'Capturar el error y mostrar un mensaje personalizado usando el nombre del archivo: msj = "Lo siento, el archivo " + filename + " no existe."', order: 9 },
            { id: 'exc-caso-practico-contar-palabras', name: 'Caso práctico: contar palabras de un archivo', description: 'contenido.split() + len() para contar palabras, usando try/except/else para que un archivo faltante no interrumpa el análisis.', order: 10 },
            { id: 'exc-multiples-archivos', name: 'Trabajar con múltiples archivos sin interrumpir el proceso', description: 'Envolver la lógica en una función (contar_palabras(filename)) e iterar sobre una lista de nombres de archivo — un archivo faltante no detiene el procesamiento de los demás.', order: 11 },
            { id: 'exc-errores-silenciosos', name: 'Errores silenciosos con pass', description: 'Usar pass dentro de un except para que Python no haga nada visible ante el error (sin mensaje), continuando la ejecución silenciosamente.', order: 12 },
            { id: 'exc-que-reportar', name: 'Criterio: qué errores merece la pena reportar al usuario', description: 'Dar información innecesaria al usuario puede ser contraproducente; un código bien escrito produce pocos errores lógicos/sintácticos; los focos de riesgo típicos son la dependencia de información externa (input del usuario, existencia de un archivo, disponibilidad de red).', order: 13 },
        ],
        sources: [
            {
                fileName: 'Python-avanzado-Teoria-2-Manejo-de-Excepciones-Diapositivas_5a12faec.pdf',
                rawText: `OBJETIVO
Manejar errores para que nuestros programas no tengan un crash cuando se encuentren con situaciones inesperadas [Objetos de tipo excepción].
Manejar excepciones en distintos casos de uso: Errores aritméticos, Ausencia de archivos → Añadir solidez y estabilidad a nuestros códigos.

ZeroDivisionError
print(5/0)
ZeroDivisionError: division by zero
Un numero no puede dividirse por 0. [Objeto de excepción] Se crea cuando python no puede realizar aquello que se le pide. Nuestro objetivo será indicarle a python que hacer cuando ocurra una excepción de este tipo.

Uso de bloques try-except
try:
    print(5/0)
except ZeroDivisionError:
    print("¡No puedes dividir por cero!")
Output: ¡No puedes dividir por cero!
Si funciona, python ignorará el bloque en el except. Si no funciona, python buscará un bloque except que se corresponda con el error producido → ZeroDivisionError. Mensaje de error personalizado + el código seguirá ejecutándose (no habrá crash).

Evitar crashes
Versión sin try/except (causa crash):
print("Dame dos numeros y para dividir.")
print("Introduce 's' para salir.")
while True:
    numero1 = input("\\nPrimer numero: ")
    if numero1 == 's':
        break
    numero2 = input("Segundo numero: ")
    if numero2 == 's':
        break
    resultado = int(numero1) / int(numero2)
    print(resultado)
Al introducir un 0 como numero2:
ZeroDivisionError: division by zero

Código corregido (con try/except/else):
print("Dame dos numeros y para dividir.")
print("Introduce 's' para salir.")
while True:
    numero1 = input("\\nPrimer numero: ")
    if numero1 == 's':
        break
    numero2 = input("Segundo numero: ")
    if numero2 == 's':
        break
    try:
        resultado = int(numero1) / int(numero2)
    except ZeroDivisionError:
        print("You can't divide by 0!")
    else:
        print(resultado)
Output de ejemplo:
Primer numero: 3 / Segundo numero: 4 → 0.75
Primer numero: 5 / Segundo numero: 0 → You can't divide by 0!
Primer numero: 6 / Segundo numero: 7 → 0.8571428571428571

FileNotFound (sin manejo, causa crash)
filename = "test.txt"
with open(filename) as f_obj:
    contenido = f_obj.read()
FileNotFoundError [Errno 2] No such file or directory: 'test.txt'

FileNotFound (con try/except)
filename = "test.txt"
try:
    with open(filename) as f_obj:
        contents = f_obj.read()
except FileNotFoundError:
    msj = "Lo siento, el archivo " + filename + " no existe."
    print(msj)
Output: Lo siento, el archivo test.txt no existe.

Ejemplo Practico — Análisis de Textos: contar el número de palabras en un texto
filename = "test.txt"
try:
    with open(filename) as f_obj:
        contenido = f_obj.read()
except FileNotFoundError:
    msj = "Lo siento, el archivo " + filename + " no existe."
    print(msj)
else:
    palabras = contenido.split()
    num_palabras = len(palabras)
    print("El archivo " + filename + " tiene " + str(num_palabras) + " palabras.")
Output: El archivo test.txt tiene 125 palabras.

Ejemplo Practico — trabajar con múltiples archivos
def contar_palabras(filename):
    """Count the approximate number of words in a file."""
    try:
        with open(filename) as f_obj:
            contenido = f_obj.read()
    except FileNotFoundError:
        msj = "Lo siento, el archivo " + filename + " no existe."
        print(msj)
    else:
        palabras = contenido.split()
        num_palabras = len(palabras)
        print("El archivo " + filename + " tiene " + str(num_palabras) + " palabras.")
filenames = ['alice.txt', 'siddhartha.txt', 'moby_dick.txt', 'metamorfosis.txt']
for filename in filenames:
    contar_palabras(filename)
Output:
El archivo alice.txt tiene 125 palabras.
El archivo siddhartha.txt tiene 267 palabras.
Lo siento, el archivo moby_dick.txt no existe.
El archivo metamorfosis.txt tiene 192 palabras.

Errores silenciosos (con pass)
def contar_palabras(filename):
    try:
        with open(filename) as f_obj:
            contenido = f_obj.read()
    except FileNotFoundError:
        pass
    else:
        palabras = contenido.split()
        num_palabras = len(palabras)
        print("El archivo " + filename + " tiene " + str(num_palabras) + " palabras.")
filenames = ['alice.txt', 'siddhartha.txt', 'moby_dick.txt', 'metamorfosis.txt']
for filename in filenames:
    contar_palabras(filename)
Output (moby_dick.txt, el faltante, no imprime nada en absoluto):
El archivo alice.txt tiene 125 palabras.
El archivo siddhartha.txt tiene 267 palabras.
El archivo metamorfosis.txt tiene 192 palabras.

¿Qué errores debemos reportar?
Si el usuario sabe qué textos deben ser analizados, apreciará saber por qué algunos no han podido serlo. Si en cambio el usuario espera resultados pero no sabe qué textos deben analizarse, puede que no necesite saber que hay algunos no disponibles.
Dar al usuario información que no necesita puede ser contraproducente y reducir la utilidad del programa. Un código bien escrito es proclive a muy pocos errores lógicos o de sintaxis.
Posibles focos de error, siempre que el programa dependa de información externa: input del usuario, existencia de un archivo, disponibilidad de red de conexión…`,
            },
        ],
    },
];

/** Devuelve un LearningBlock por su id, o undefined si no existe. */
export function getPracticePathById(id: string): LearningBlock | undefined {
    return LEARNING_BLOCKS.find(p => p.id === id);
}

/** Devuelve todos los conceptos (nombre) de todos los bloques, en orden de definición. */
export function getAllPracticeConceptNames(): string[] {
    return LEARNING_BLOCKS.flatMap(p => p.concepts.map(c => c.name));
}
