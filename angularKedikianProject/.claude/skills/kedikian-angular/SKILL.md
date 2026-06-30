---
name: frontend-review
description: >
  Auditá y mejorá la interfaz de un proyecto Angular que usa CSS/SCSS escrito a
  mano. Usá esta skill cuando el usuario pida revisar, criticar o "hacer ver más
  profesional" un componente, una pantalla o toda la UI; cuando mencione que el
  frontend se ve feo, inconsistente, amateur o desprolijo; o cuando comparta un
  .component.scss, .component.html, screenshot o ruta de un componente Angular y
  quiera feedback de diseño. Detecta y corrige los problemas típicos de SCSS a
  mano: colores y medidas hardcodeadas, escala de spacing y tipografía
  inconsistente, falta de tokens, jerarquía visual pobre y componentes sin
  estados (hover, focus, disabled, loading, empty, error).
---

# Frontend Review (Angular + SCSS a mano)

Tu trabajo es transformar una UI "armada por dev sin diseñador" en algo que se
vea profesional, sin reescribir todo desde cero. El 90% de lo que hace que un
frontend se vea amateur son cinco cosas: inconsistencia de spacing, escala
tipográfica caótica, colores hardcodeados sin sistema, falta de estados y mala
jerarquía visual. Atacá eso primero.

## Cuándo se activa

- "Revisá / mejorá / criticá esta pantalla o componente"
- "Mi frontend se ve espantoso / amateur / desprolijo"
- El usuario pasa un `.scss`, `.html`, screenshot o ruta de componente
- Pedidos de "hacerlo ver más profesional"

## Proceso

Seguí este orden. No saltees al CSS bonito antes de haber establecido el sistema.

### Paso 1 — Inventario del estado actual

Antes de opinar, leé el código real. Para cada componente bajo review:

1. Listá los archivos (`*.component.scss`, `*.component.html`, estilos globales,
   `styles.scss`, cualquier `_variables.scss` o `_tokens.scss` existente).
2. Buscá señales de falta de sistema con grep:
   - Colores hardcodeados: `grep -rEn "#[0-9a-fA-F]{3,6}|rgb\(|rgba\(" src/`
   - Magic numbers de spacing: valores en `px`/`rem` que no siguen escala
     (`margin: 13px`, `padding: 7px 22px`, etc.)
   - `!important` (síntoma de overrides peleados)
   - `font-size` sueltos sin escala
   - z-index arbitrarios (`z-index: 9999`)
3. Anotá cuántas variantes distintas hay de cada cosa (ej: "23 colores
   distintos hardcodeados", "11 valores de padding sin escala"). Ese número es
   la métrica de qué tan amateur se ve.

### Paso 2 — Diagnóstico contra checklist

Evaluá contra esta checklist y reportá cada punto como ✅ / ⚠️ / ❌ con la
evidencia concreta (archivo:línea):

**Sistema y tokens**
- [ ] ¿Existen tokens de color (variables SCSS o CSS custom properties) o está
      todo hardcodeado?
- [ ] ¿Hay una escala de spacing (4/8px) o son magic numbers?
- [ ] ¿Hay una escala tipográfica definida (tamaños, pesos, line-height) o cada
      componente inventa la suya?
- [ ] ¿Hay tokens de border-radius, shadow y border consistentes?

**Jerarquía visual**
- [ ] ¿Se distingue claro qué es primario, secundario y terciario en cada
      pantalla? (tamaño, peso, color, espacio)
- [ ] ¿El contenido respira o está todo apretado / disperso sin ritmo?
- [ ] ¿Los grupos relacionados están agrupados visualmente (proximidad)?

**Componentes y estados**
- [ ] Botones, inputs y elementos interactivos: ¿tienen `:hover`, `:focus-visible`,
      `:active`, `:disabled`?
- [ ] ¿Hay estado de `loading`, `empty` y `error` en listas/tablas/forms?
- [ ] ¿Los estados de validación de formularios son visibles y claros?

**Accesibilidad mínima (esto separa pro de amateur)**
- [ ] Contraste texto/fondo ≥ 4.5:1 (WCAG AA) en texto normal.
- [ ] `:focus-visible` visible en todo lo navegable por teclado.
- [ ] Targets táctiles ≥ 44×44px.
- [ ] Estructura semántica (`<button>` real, no `<div (click)>`).

**Consistencia**
- [ ] ¿Los botones se ven igual en toda la app? ¿Y los inputs? ¿Y las cards?
- [ ] ¿El spacing entre secciones es consistente?
- [ ] ¿Responsive razonable o se rompe en mobile?

### Paso 3 — Establecer el sistema (la base)

Antes de tocar componentes, proponé / creá un archivo `_tokens.scss` (o CSS
custom properties en `:root`) con la base mínima. Custom properties suelen ser
mejores porque permiten theming y se leen desde el inspector:

```scss
:root {
  /* Color — definí una paleta corta y deliberada */
  --color-bg:            #ffffff;
  --color-surface:       #f6f7f9;
  --color-border:        #e2e5ea;
  --color-text:          #1a1d23;
  --color-text-muted:    #5c636e;
  --color-primary:       #2f6fed;
  --color-primary-hover: #2358c4;
  --color-danger:        #d92d20;
  --color-success:       #12805c;

  /* Spacing — escala de 4px. Usá SOLO estos valores. */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-8: 48px;
  --space-10: 64px;

  /* Tipografía — escala fija, nada de tamaños sueltos */
  --text-xs:   12px;
  --text-sm:   14px;
  --text-base: 16px;
  --text-lg:   18px;
  --text-xl:   24px;
  --text-2xl:  32px;

  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;

  --leading-tight: 1.25;
  --leading-normal: 1.5;

  /* Radius / shadow / borde */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --shadow-sm: 0 1px 2px rgba(16, 24, 40, .06);
  --shadow-md: 0 4px 12px rgba(16, 24, 40, .10);
  --border: 1px solid var(--color-border);
}
```

**Regla de oro a aplicar:** después de definir tokens, ningún valor de color,
spacing, tamaño de fuente o radius debe estar hardcodeado en un componente.
Todo referencia un token. Eso solo, ya sube el nivel un escalón completo.

### Paso 4 — Refactor por componente

Reescribí los estilos del componente usando tokens, y agregá los estados que
falten. Patrón de botón como referencia de calidad:

```scss
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-5);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  line-height: var(--leading-tight);
  border: var(--border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
  cursor: pointer;
  transition: background .15s ease, box-shadow .15s ease;

  &:hover  { background: var(--color-border); }
  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
  &:active { transform: translateY(1px); }
  &:disabled {
    opacity: .5;
    cursor: not-allowed;
  }

  &--primary {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: #fff;
    &:hover { background: var(--color-primary-hover); }
  }
}
```

Para listas/tablas/forms, asegurate de incluir los tres estados que casi siempre
faltan: `loading` (skeleton o spinner), `empty` (mensaje + acción), `error`
(mensaje claro + retry).

### Paso 5 — Entregar

Devolvé al usuario, en este orden:

1. **Diagnóstico**: la checklist con ✅/⚠️/❌ y la evidencia. Empezá por lo que
   más impacto visual tiene.
2. **Métrica antes/después** cuando aplique ("pasamos de 23 colores hardcodeados
   a 9 tokens").
3. **Los cambios concretos**: el `_tokens.scss` y los `.scss` refactorizados,
   listos para pegar.
4. **Quick wins ordenados por impacto/esfuerzo**: qué hacer primero si no hay
   tiempo para todo.

## Principios de criterio

- **Menos es más profesional.** Una paleta de 5-6 colores y 2-3 tamaños de
  fuente bien usados se ve más pro que 20 colores y 9 tamaños.
- **Consistencia > originalidad.** Que todos los botones sean iguales importa
  más que que sean "lindos".
- **El espacio en blanco es diseño.** El apretujamiento es la marca número uno
  de un frontend amateur.
- **Los estados no son opcionales.** hover/focus/disabled/loading/empty/error
  son lo que distingue una app terminada de una demo.
- **No rediseñes lo que funciona.** Mejorá el sistema, no inventes una UI nueva
  que el usuario no pidió.

## Qué NO hacer

- No metas una librería de componentes (Material, PrimeNG, Tailwind) salvo que
  el usuario lo pida explícitamente — esta skill es para SCSS a mano.
- No uses `!important` para arreglar; arreglá la especificidad de raíz.
- No agregues animaciones decorativas porque sí.
- No cambies la lógica de los componentes, solo estilos y markup necesario para
  estados/accesibilidad.