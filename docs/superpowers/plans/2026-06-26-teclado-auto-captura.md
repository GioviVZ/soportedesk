# Herramientas — Captura automática en la prueba de Teclado Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** El tab "Teclado" de Herramientas captura teclas automáticamente al entrar al tab, sin requerir un clic previo en "Activar captura".

**Architecture:** Eliminar el flag `keyboardCapture` y el método `enableKeyboardCapture()` de `HerramientasComponent`; el guard de `onKeyDown`/`onKeyUp` pasa a depender solo de `this.activeTab === 'teclado'` (condición que ya existía combinada con el flag). Quitar el botón ahora innecesario del template y actualizar el texto descriptivo del panel.

**Tech Stack:** Angular 17 standalone component (mismo archivo ya tocado en el plan anterior de Herramientas).

## Global Constraints

- Ningún otro tab de Herramientas (Ping, GPU, RAM, Mouse, Micrófono, Cámara) se modifica.
- El grid de teclas (`KEY_ROWS`, `KEY_LABELS`), el conteo `testedKeysCount`/`keyboardTotal`, "Última tecla", y el botón "Reiniciar" no cambian de lógica.
- No se agrega ningún test automatizado nuevo (el componente no tiene spec hoy; consistente con el resto de tabs).
- Comando de test: `cd soportedesk-frontend && npx ng build --configuration development`

---

### Task 1: Captura automática de teclado

**Files:**
- Modify: `soportedesk-frontend/src/app/features/herramientas/herramientas.component.ts`
- Modify: `soportedesk-frontend/src/app/features/herramientas/herramientas.component.html`

**Interfaces:**
- Consumes: nada de otras tareas (plan de una sola tarea).
- Produces: nada que otra tarea consuma.

- [ ] **Step 1: Quitar el campo `keyboardCapture`**

En `herramientas.component.ts`, buscar:
```ts
  pressedKeys = new Set<string>();
  testedKeys = new Set<string>();
  lastKey = 'Sin actividad';
  keyboardCapture = false;
```

Reemplazar por:
```ts
  pressedKeys = new Set<string>();
  testedKeys = new Set<string>();
  lastKey = 'Sin actividad';
```

- [ ] **Step 2: Quitar el método `enableKeyboardCapture()`**

Buscar:
```ts
  enableKeyboardCapture(): void {
    this.keyboardCapture = true;
  }

  resetKeyboard(): void {
```

Reemplazar por:
```ts
  resetKeyboard(): void {
```

- [ ] **Step 3: Simplificar el guard en `onKeyDown`**

Buscar:
```ts
  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (!this.keyboardCapture || this.activeTab !== 'teclado') {
      return;
    }
```

Reemplazar por:
```ts
  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (this.activeTab !== 'teclado') {
      return;
    }
```

- [ ] **Step 4: Simplificar el guard en `onKeyUp`**

Buscar:
```ts
  @HostListener('window:keyup', ['$event'])
  onKeyUp(event: KeyboardEvent): void {
    if (!this.keyboardCapture || this.activeTab !== 'teclado') {
      return;
    }
```

Reemplazar por:
```ts
  @HostListener('window:keyup', ['$event'])
  onKeyUp(event: KeyboardEvent): void {
    if (this.activeTab !== 'teclado') {
      return;
    }
```

- [ ] **Step 5: Actualizar el panel de Teclado en el template**

En `herramientas.component.html`, buscar:
```html
  <section class="tool-panel" [class.active]="activeTab === 'teclado'">
    <div class="panel-heading">
      <div>
        <h3>Prueba teclado</h3>
        <p>Activa la captura y presiona teclas. Cada tecla detectada queda marcada.</p>
      </div>
      <div class="button-row">
        <button type="button" class="ghost-btn" (click)="resetKeyboard()">Reiniciar</button>
        <button type="button" class="primary-btn" (click)="enableKeyboardCapture()">
          {{ keyboardCapture ? 'Capturando' : 'Activar captura' }}
        </button>
      </div>
    </div>
```

Reemplazar por:
```html
  <section class="tool-panel" [class.active]="activeTab === 'teclado'">
    <div class="panel-heading">
      <div>
        <h3>Prueba teclado</h3>
        <p>Las teclas que presiones mientras esta pestaña esté abierta quedan marcadas aquí. Los atajos del navegador se bloquean mientras tanto.</p>
      </div>
      <div class="button-row">
        <button type="button" class="ghost-btn" (click)="resetKeyboard()">Reiniciar</button>
      </div>
    </div>
```

- [ ] **Step 6: Verificar que compila limpio**

Run: `cd soportedesk-frontend && npx ng build --configuration development`
Expected: `Application bundle generation complete`, sin errores ni warnings nuevos (confirma que no quedó ninguna referencia suelta a `keyboardCapture` ni a `enableKeyboardCapture()`).

- [ ] **Step 7: Verificación manual en navegador**

Run: `cd soportedesk-frontend && ng serve`, abrir `http://localhost:4200/herramientas`, entrar al tab "Teclado", presionar cualquier tecla **sin hacer clic en ningún botón antes** y confirmar que la tecla queda pintada en verde de inmediato. Confirmar que "Reiniciar" sigue limpiando el progreso.

- [ ] **Step 8: Commit**

```bash
git add soportedesk-frontend/src/app/features/herramientas/herramientas.component.ts soportedesk-frontend/src/app/features/herramientas/herramientas.component.html
git commit -m "feat: auto-start keyboard capture when entering Teclado tab"
```
