# Nuevo Diseño Módulo Curriculum (Global)

La idea del usuario es excelente: en lugar de mostrar los temas vacíos y saltar al modo interactivo, la pantalla **ModuleCurriculum** será la que albergue el interactivo *per se*. Este cambio afectará de forma positiva a **todos los módulos** futuros (del 1 al 16), dotándolos de un sistema que permite inyectar contenido y mini-retos dentro de la vista principal del temario.

## Funcionalidad Deseada
1. Pantalla principal del Módulo.
2. Lista de Temas (`Temario`).
3. Al hacer clic en el nombre de un `Tema`, actualmente figura "Estudiando...". 
4. **Nuevo Comportamiento**: Al hacer clic en el botón de la parte inferior para "continuar", en lugar de simplemente subir la barra de progreso de golpe, la propia tarjeta del tema se debe **expandir** (o abrir una vista al lado) mostrando:
    - Información/Contenido teórico del tema (leído del `ModuleX.tsx` correspondiente).
    - Un mini-ejercicio embebido para superarlo.
5. Superado el ejercicio, el `Tema` se marca como *Completado* y se desbloquea el siguiente. 
6. Al terminar todos los temas, se habilitará el botón final para "Entrar al Reto Práctico 🚀" (que abrirá el reto global).

## Proposed Changes

### [MODIFY] [ModuleCurriculum.tsx](file:///c:/Users/green/OneDrive/Desktop/CB/conquer_game/frontend/src/components/modules/ModuleCurriculum.tsx)

Transformar `ModuleCurriculum` para que acepte un nuevo Array enriquecido de `scenes` o `themeData` en lugar de un simple array de *strings*.
```typescript
interface ThemeScene {
    title: string;
    theory: React.ReactNode;
    type: 'quiz' | 'terminal';
    question?: string;
    options?: string[];
    correctAnswer?: string;
    instruction?: string;
    expectedInput?: string[];
    successMsg?: string;
}
```

La UI de `ModuleCurriculum` tendrá dos paneles si la pantalla lo permite (como el que acabamos de construir en `Module2` pero de forma general):
- **Panel Izquierdo**: El listado actual de Temas. Al hacer clic en el tema actual (el candado abierto), se seleccionará de forma activa.
- **Panel Derecho**: Mostrará la `teoría` del tema seleccionado, y justo debajo la `pregunta/terminal` de ese tema.

### [MODIFY] [Module2.tsx](file:///c:/Users/green/OneDrive/Desktop/CB/conquer_game/frontend/src/components/modules/Module2.tsx) (y futuros)

- Delegar la renderización de la interfaz a `ModuleCurriculum`.
- Enviar el array de `scenes` hacia `ModuleCurriculum` en lugar de hacerlo manual.
- El "Reto Práctico" final será lo único que retenga `Module2.tsx`. Cuando `ModuleCurriculum` emita `onStartChallenge()`, `Module2` mostrará la pantalla del Ejercicio Final (el *Hola Mundo* gigante).

### User Review Required
> [!IMPORTANT]
> Revisa la propuesta de arriba. La arquitectura consiste en crear un componente `ModuleCurriculum` potentísimo (un Gestor de Cursos) y que los módulos individuales (`Module1`, `Module2`, etc.) simplemente le pasen los "datos" o "textos" a este gestor.
> A nivel visual, mantendremos la barra de progreso y la lista actual de temas a la Izquierda, y a la Derecha pondremos el contenido + mini-reto del tema activo. ¿Te parece bien esta estructura de 2 columnas o prefieres que la lista de temas "desaparezca" cuando entres a leer uno de ellos?
