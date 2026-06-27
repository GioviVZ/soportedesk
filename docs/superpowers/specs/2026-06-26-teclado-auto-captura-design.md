# Herramientas — Captura automática en la prueba de Teclado

## Contexto

El tab "Teclado" de Herramientas (`herramientas.component.ts/html/scss`) ya pinta en verde cada tecla detectada (clase `.tested`, respaldada por el `Set<string>` `testedKeys`), pero solo después de que el usuario presiona el botón "Activar captura" — `onKeyDown`/`onKeyUp` ignoran el evento mientras `keyboardCapture === false`. Este paso intermedio no es obvio: el usuario reportó que el test "no pintaba nada", y la causa raíz es que escribió sin haber presionado ese botón primero. Ningún otro tab del componente exige un paso de activación separado antes de dar feedback (Mouse reacciona de inmediato; GPU/RAM/Micrófono/Cámara tienen un botón "Iniciar prueba" porque inician un proceso con costo real — captura de teclado no tiene ese costo).

## Objetivo

Eliminar la fricción: la captura de teclado se activa sola al entrar al tab "Teclado", sin botón previo. Advertir claramente que mientras ese tab esté abierto se bloquean los atajos del navegador.

## Alcance

**Dentro de alcance:**
- `herramientas.component.ts`: en `selectTab()`, activar la captura automáticamente al entrar a `'teclado'` (sin necesidad de desactivarla al salir — el guard existente `this.activeTab !== 'teclado'` en `onKeyDown`/`onKeyUp` ya hace que la captura sea inerte en cualquier otro tab).
- Eliminar el campo `keyboardCapture` y el método `enableKeyboardCapture()` — quedan redundantes una vez que la captura depende solo de `activeTab === 'teclado'`.
- `herramientas.component.html`: quitar el botón "Activar captura" del panel de Teclado (queda solo "Reiniciar"); actualizar el texto descriptivo del panel para advertir el bloqueo de atajos del navegador.
- `herramientas.component.scss`: sin cambios esperados (no se agrega ni quita ninguna clase visual — `.tested`/`.down` siguen igual).

**Fuera de alcance (explícito):**
- El resto de los tabs (Ping, GPU, RAM, Mouse, Micrófono, Cámara) — sin cambios.
- El diseño visual del teclado (`KEY_ROWS`, `KEY_LABELS`, el grid de teclas) — sin cambios.
- El conteo `testedKeysCount`/`keyboardTotal`, "Última tecla", y el botón "Reiniciar" — sin cambios de lógica.
- No se agrega detección de "tecla atascada" (key down sin keyup) ni ninguna otra mejora diagnóstica adicional — el usuario pidió resolver específicamente la fricción de activación, no ampliar el alcance del test.

## Diseño

**`herramientas.component.ts`:** eliminar el campo `keyboardCapture: boolean` y el método `enableKeyboardCapture()` — quedan redundantes porque la única condición que de verdad importa es si el tab activo es `'teclado'`, y eso ya se puede consultar directamente. En `onKeyDown`/`onKeyUp`, el guard pasa de:
```ts
if (!this.keyboardCapture || this.activeTab !== 'teclado') {
  return;
}
```
a:
```ts
if (this.activeTab !== 'teclado') {
  return;
}
```
No se necesita ningún caso especial nuevo en `selectTab()` — al quitar el flag, la captura queda activa automáticamente en cuanto `activeTab === 'teclado'`, sin ningún paso de activación intermedio.

**`herramientas.component.html`:** el `<div class="panel-heading">` del tab Teclado pasa de:
```html
<p>Activa la captura y presiona teclas. Cada tecla detectada queda marcada.</p>
```
a:
```html
<p>Las teclas que presiones mientras esta pestaña esté abierta quedan marcadas aquí. Los atajos del navegador se bloquean mientras tanto.</p>
```
y el `<div class="button-row">` pierde el botón "Activar captura", quedando solo:
```html
<div class="button-row">
  <button type="button" class="ghost-btn" (click)="resetKeyboard()">Reiniciar</button>
</div>
```

**`resetKeyboard()`:** sin cambios — sigue limpiando `pressedKeys`/`testedKeys`/`lastKey`. No toca `keyboardCapture` (sigue en `true`, lo cual es correcto: tras reiniciar, la captura debe seguir activa para la siguiente vuelta de pruebas sin que el usuario tenga que reactivarla).

## Testing

El componente no tiene spec de Angular hoy (`herramientas.component.spec.ts` no existe), y este cambio no introduce uno — consistente con el resto del archivo (ningún otro tab tiene tests). Verificación: `ng build` debe compilar sin errores ni warnings nuevos (confirma que no queda ninguna referencia rota a `enableKeyboardCapture()`/al botón eliminado), y verificación manual en navegador: entrar al tab "Teclado" y confirmar que la primera tecla presionada, sin clic previo en ningún botón, ya queda pintada en verde.

**Comando de test:** `cd soportedesk-frontend && npx ng build --configuration development`

## Resumen de archivos

**Modificar:**
- `soportedesk-frontend/src/app/features/herramientas/herramientas.component.ts`
- `soportedesk-frontend/src/app/features/herramientas/herramientas.component.html`
