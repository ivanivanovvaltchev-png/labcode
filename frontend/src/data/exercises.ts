import { Exercise } from '../types/exercises';

export const EXERCISE_CATALOG: Exercise[] = [
    {
        id: 'battleships',
        title: 'Hundir la Flota',
        description: 'Crea el clásico juego de adivinar las posiciones de los barcos enemigos en una cuadrícula.',
        category: 'Juegos Clásicos',
        days: [
            {
                dayNumber: 1,
                objective: 'Crear la función que determina el tamaño del tablero según dificultad. Pedir dificultad al usuario y mostrar el tamaño elegido.',
                newConcepts: ['Funciones con parámetros y retorno', 'Estructuras condicionales (Si o Segun)'],
                baseHint: 'Crea una función TamTablero(dificultad) que devuelva 3, 4 o 5 dependiendo si es 1, 2 o 3. En el algoritmo principal pregunta la dificultad.'
            },
            {
                dayNumber: 2,
                objective: 'Crear el array bidimensional con la dimensión obtenida. Rellenarlo con "**" (agua) y crear función MostrarTablero.',
                newConcepts: ['Arrays bidimensionales dinámicos', 'Bucles anidados', 'Funciones sin retorno'],
                baseHint: 'Usa la dimensión obtenida en el día 1 para dimensionar tablero[dim, dim]. Luego usa dos bucles Para anidados para llenarlo de "**".'
            },
            {
                dayNumber: 3,
                objective: 'Colocar 3 barcos ("B") en posiciones aleatorias asegurando que no se repitan posiciones.',
                newConcepts: ['Números aleatorios (azar)', 'Bucles con condición', 'Validación de posiciones'],
                baseHint: 'Usa un bucle Mientras que se ejecute hasta haber colocado 3 barcos. Dentro, usa azar(dimension) para fila y columna. Comprueba si está vacío ("**") antes de poner "B" y sumar.'
            },
            {
                dayNumber: 4,
                objective: 'Turnos del jugador: pedir coordenadas al usuario, validar rango y controlar 5 intentos.',
                newConcepts: ['Bucles Mientras o Para', 'Entrada de usuario', 'Validación de datos'],
                baseHint: 'Usa un bucle Mientras para los 5 intentos. Dentro, pide fila y columna. Comprueba que no se salgan de 0 a dimension-1.'
            },
            {
                dayNumber: 5,
                objective: 'Comprobar si en la posición elegida hay un barco. Si hay, cambiar a "H" y aumentar contador. Si no, agua.',
                newConcepts: ['Condicionales dentro de bucles', 'Modificación de arrays', 'Acumuladores'],
                baseHint: 'Justo después de pedir la fila y columna (Día 4), mira si tablero[fila, columna] es "B". Si sí, cambia a "H" e incrementa barcosHundidos. Si no, di "Agua".'
            },
            {
                dayNumber: 6,
                objective: 'Mover toda la lógica de turnos (intentos y comprobación) a una función Jugar que devuelva los hundidos.',
                newConcepts: ['Funciones que reciben arrays y devuelven valores', 'Paso de parámetros'],
                baseHint: 'Saca el bucle de los 5 intentos del algoritmo principal y mételo en una función Jugar(tablero, dimension) que al final retorne la variable barcosHundidos.'
            },
            {
                dayNumber: 7,
                objective: 'Llamar a Jugar desde el programa principal y decir si se ganó o perdió.',
                newConcepts: ['Integración de partes', 'Condiciones de victoria'],
                baseHint: 'En el algoritmo principal, recibe el valor retornado por Jugar(...). Si hundidos = 3, escribe "¡HAS GANADO!", si no, "HAS PERDIDO".'
            }
        ]
    },
    {
        id: 'tic-tac-toe',
        title: 'Tres en Raya',
        description: 'Programa un juego de 3 en raya para 2 jugadores o contra el ordenador.',
        category: 'Juegos Clásicos',
        days: [
            {
                dayNumber: 1,
                objective: 'Representación del tablero.',
                newConcepts: ['Matrices 3x3', 'Inicialización de arreglos'],
                baseHint: 'Crea una matriz 3x3 llena de espacios en blanco o guiones para representar el tablero vacío.'
            },
            {
                dayNumber: 2,
                objective: 'Función para imprimir el tablero.',
                newConcepts: ['Bucles de impresión', 'Formato de cadenas'],
                baseHint: 'Haz un bucle que recorra las 3 filas, e imprime cada elemento separado por " | " para que parezca una cuadrícula.'
            },
            {
                dayNumber: 3,
                objective: 'Lectura de movimientos por turnos.',
                newConcepts: ['Cambio de variable (turno)', 'Validación de entrada'],
                baseHint: 'Usa una variable "jugador_actual" que empiece en "X". Después del turno, si era X, cámbiala a O. Verifica que la celda elegida esté vacía.'
            },
            {
                dayNumber: 4,
                objective: 'Comprobar el ganador.',
                newConcepts: ['Lógica booleana compleja', 'Recorridos de matrices (filas, columnas, diagonales)'],
                baseHint: 'Crea una función que verifique si hay 3 "X" o 3 "O" seguidas en las 3 filas, las 3 columnas o las 2 diagonales.'
            },
            {
                dayNumber: 5,
                objective: 'Bucle de juego y condición de empate.',
                newConcepts: ['Condición de bucle principal', 'Contador de turnos vacíos'],
                baseHint: 'El juego termina si alguien gana O si han pasado 9 turnos (tablero lleno). Mantén las acciones en un bucle MIENTRAS general.'
            }
        ]
    },
    // More exercises could be added here (Ahorcado, Juego de la vida, etc.)
];
