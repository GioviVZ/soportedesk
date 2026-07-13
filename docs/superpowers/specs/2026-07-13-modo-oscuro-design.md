# Modo oscuro (app completa, interruptor en Configuración)

## Contexto

Toda la aplicación consume variables CSS definidas en un único bloque `:root` (`soportedesk-frontend/src/app/core/styles/_variables.scss`): colores de marca, neutros, de estado y por módulo, además de sombras y radios. No existe hoy ninguna infraestructura de tema ni modo oscuro.

El objetivo es agregar un modo oscuro que cubra toda la aplicación (sidebar, header, y todos los módulos), controlado por un interruptor ubicado en la pantalla **Configuración** (antes "Catálogos").

## Alcance

- Nuevo `ThemeService` que decide y aplica el tema (claro/oscuro) a nivel de documento.
- Nuevo bloque de variables oscuras en `_variables.scss`, activado por un atributo en `<html>`.
- Corrección del único color fijo detectado en el CSS global (`th { background: #fbfcfe }` en `styles.scss`) para que respete el tema.
- Tarjeta "Apariencia" fija (siempre visible, sin necesidad de navegar a un grupo) en la parte superior de la pantalla de Configuración, con un switch Claro/Oscuro.
- **Fuera de alcance**: auditar uno por uno los ~26 archivos `.scss` de módulos que tienen algún color hexadecimal propio (aparte de las variables). La arquitectura de variables ya cubre la gran mayoría de la interfaz; ajustes puntuales quedan para una iteración posterior si se detectan al usarlo.
- **Fuera de alcance**: sincronizar la preferencia entre dispositivos/navegadores (se guarda solo en `localStorage` del navegador actual).

## `ThemeService`

Nuevo archivo: `soportedesk-frontend/src/app/core/services/theme.service.ts`, mismo patrón que `LayoutService` (signal, `providedIn: 'root'`).

```ts
export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'soportedesk-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<ThemeMode>(this.resolveInitialTheme());

  constructor() {
    this.applyTheme(this.theme());
  }

  setTheme(mode: ThemeMode): void {
    this.theme.set(mode);
    this.applyTheme(mode);
  }

  toggle(): void {
    this.setTheme(this.theme() === 'dark' ? 'light' : 'dark');
  }

  private resolveInitialTheme(): ThemeMode {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  private applyTheme(mode: ThemeMode): void {
    document.documentElement.setAttribute('data-theme', mode);
    localStorage.setItem(STORAGE_KEY, mode);
  }
}
```

`setTheme`/`toggle` aplican el atributo y persisten de forma síncrona e imperativa (sin `effect()`): es más simple, no depende del timing de flush de la reactividad de Angular, y es trivial de probar. El signal `theme` sigue existiendo para que el template lo lea de forma reactiva.

- Se instancia apenas arranca la app: `AppComponent` inyecta `ThemeService` como campo (`private theme = inject(ThemeService)`), aunque no lo use directamente, para forzar su creación temprana — el constructor de `ThemeService` aplica el tema de forma síncrona antes de que se renderice el primer template, evitando un parpadeo de tema claro→oscuro.
- No escucha cambios en vivo de `prefers-color-scheme` (si el SO cambia de tema mientras la app está abierta, no se refleja hasta recargar) — mantiene el servicio simple; es un valor por defecto, no una sincronización continua.

## Variables oscuras

En `_variables.scss`, después del bloque `:root { ... }` existente, se agrega:

```scss
:root[data-theme='dark'] {
  --color-bg: #0f1521;
  --color-surface: #171f2e;
  --color-surface-raised: #1e293b;
  --color-border: #2a3547;
  --color-border-strong: #3a4759;
  --color-text: #e8ecf4;
  --color-text-secondary: #9aa7bd;
  --color-text-muted: #6b7688;
  --color-muted: #1c2534;

  --color-primary-light: rgba(93, 135, 255, .16);
  --color-secondary-light: rgba(68, 183, 247, .16);
  --color-accent-light: rgba(93, 135, 255, .16);
  --color-accent-subtle: rgba(93, 135, 255, .10);

  --color-success-light: rgba(19, 222, 185, .14);
  --color-warning-light: rgba(255, 174, 31, .14);
  --color-danger-light: rgba(250, 137, 107, .14);
  --color-info-light: rgba(83, 155, 255, .14);

  --color-licencias-light: rgba(93, 135, 255, .14);
  --color-correos-light: rgba(135, 84, 236, .14);
  --color-usuarios-red-light: rgba(255, 174, 31, .14);
  --color-vpn-light: rgba(250, 137, 107, .14);
  --color-wifi-light: rgba(68, 183, 247, .14);
  --color-impresoras-light: rgba(124, 143, 172, .14);
  --color-equipos-light: rgba(19, 222, 185, .14);

  --shadow-sm: 0 2px 16px rgba(0, 0, 0, .35);
  --shadow-md: 0 6px 24px rgba(0, 0, 0, .45);
  --shadow-lg: 0 18px 48px rgba(0, 0, 0, .55);

  --color-green-light: rgba(19, 222, 185, .14);
  --color-yellow-light: rgba(255, 174, 31, .14);
  --color-red-light: rgba(250, 137, 107, .14);
  --color-gray-light: rgba(124, 143, 172, .14);
}
```

Los colores de "acento" (`--color-primary`, `--color-accent`, `--color-success`, `--color-warning`, `--color-danger`, `--color-info`, colores por módulo, `--color-white`, etc.) **no cambian entre temas** — ya tienen suficiente contraste sobre fondos oscuros y se usan como color de ícono/borde/texto-sobre-superficie-de-color, no como fondo de página. Solo cambian las variables de fondo/superficie/borde/texto neutro y las variantes "-light" (que son lavados de fondo casi blancos en modo claro, y se convierten en lavados translúcidos sobre fondo oscuro).

## Corrección de color fijo

`styles.scss`, selector `th`:

```diff
- background: #fbfcfe;
+ background: var(--color-muted);
```

## Interruptor en Configuración

En `catalogos.component.ts`: inyectar `ThemeService`, exponer `theme = this.themeService.theme` (el signal en sí, para leer en el template) y un método `setTheme(mode: ThemeMode)` que delega a `this.themeService.setTheme(mode)`.

En `catalogos.component.html`, se agrega antes de `<section class="catalog-impact-map">`:

```html
<section class="appearance-card">
  <div>
    <span class="module-eyebrow">Preferencias</span>
    <h3>Apariencia</h3>
    <p>Elige como se ve el sistema en este navegador.</p>
  </div>
  <div class="theme-toggle" role="group" aria-label="Modo de color">
    <button type="button" [class.active]="theme() === 'light'" (click)="setTheme('light')">Claro</button>
    <button type="button" [class.active]="theme() === 'dark'" (click)="setTheme('dark')">Oscuro</button>
  </div>
</section>
```

Estilos nuevos en `catalogos.component.scss` (`.appearance-card` como tarjeta con borde/sombra igual al resto del módulo, `.theme-toggle` como control segmentado de dos botones, igual en espíritu al `.segmented-control` que ya existe en `usuarios-red.shared.scss` — se declara una versión local en vez de importar ese archivo, para no acoplar el módulo de Configuración al de Usuarios de Red).

## Testing

- `theme.service.spec.ts`: valida `resolveInitialTheme` (localStorage con valor guardado gana sobre `matchMedia`; sin valor guardado, sigue `matchMedia`), que `setTheme`/`toggle` actualizan el signal, y que aplican `data-theme` sobre `document.documentElement` y persisten en `localStorage`.
- `catalogos.component.spec.ts`: agrega un caso que verifica que `setTheme('dark')` delega en `ThemeService.setTheme`.
- No se agregan pruebas visuales/de contraste automatizadas — la verificación de que los colores oscuros se ven bien es manual (Task de verificación final del plan).

## Fuera de alcance (recordatorio)

- Sincronizar el tema entre dispositivos vía backend.
- Escuchar cambios en vivo de `prefers-color-scheme` del sistema operativo mientras la app está abierta.
- Auditoría exhaustiva de colores fijos en los ~26 archivos de módulos con hex propio.
