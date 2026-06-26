# Herramientas — Reemplazar Inventario por Prueba de Micrófono y Cámara

## Contexto

El módulo Herramientas (`/herramientas`, permiso de vista `herramientas`) tiene 6 pestañas de diagnóstico: Ping, Inventario, GPU, RAM, Teclado, Mouse. Todas excepto Ping e Inventario son 100% client-side (no llaman al backend). El tab "Inventario" llama a `GET /api/herramientas/inventario`, que devuelve datos del **servidor** donde corre el backend (nombre de PC, CPU, programas instalados vía PowerShell, interfaces de red) — no del equipo del usuario que abre la página. El usuario decidió que esto no aporta valor en mesa de soporte y pidió reemplazarlo por dos pruebas que sí son del equipo del usuario: micrófono y cámara.

## Objetivo

Eliminar por completo el tab Inventario (frontend + backend) y agregar dos tabs nuevos, ambos 100% client-side (sin backend): "Micrófono" (medidor de nivel en vivo) y "Cámara" (vista previa en vivo), ambos con selector de dispositivo cuando hay más de uno disponible.

## Alcance

**Dentro de alcance:**
- Backend: eliminar `HerramientasService.inventory()` y sus métodos privados exclusivos, `SystemInventoryResponse.java`, el endpoint `GET /api/herramientas/inventario`, y los 2 tests de `HerramientasControllerIT` que lo cubren.
- Frontend: eliminar el tab/panel Inventario, las interfaces de modelo asociadas, `HerramientasService.inventory()`, y los estilos SCSS exclusivos de ese panel.
- Frontend: agregar tab "Micrófono" (selector de dispositivo + Iniciar/Detener + medidor de nivel en vivo vía Web Audio API).
- Frontend: agregar tab "Cámara" (selector de dispositivo + Iniciar/Detener + `<video>` con vista previa en vivo).
- Detener automáticamente el stream de mic/cámara al cambiar de tab o destruir el componente.
- Integración con el reporte exportable existente (`addReport()`/`buildReport()`).
- Ajuste de `.tool-tabs` a una grilla flexible (`auto-fit`) en vez de columnas hardcodeadas.

**Fuera de alcance (explícito):**
- Grabar/reproducir audio, o tomar fotos con la cámara — el usuario eligió explícitamente solo medidor de nivel en vivo y vista previa en vivo, sin captura.
- `clientInfo`/`readClientInfo()` (plataforma/navegador/pantalla) — **no se elimina**, se usa en el encabezado de `buildReport()` para cualquier pestaña, no es exclusivo de Inventario. Solo se elimina el bloque HTML "Cliente web" que lo mostraba dentro del panel Inventario que se borra.
- Ping, GPU, RAM, Teclado, Mouse — sin cambios de lógica.
- HTTPS para el acceso LAN vía nginx — fuera de alcance de este trabajo. `getUserMedia` requiere contexto seguro (HTTPS o `localhost`); desde el acceso LAN actual (`http://172.16.41.214/`, HTTP plano) los tabs de Micrófono y Cámara no van a poder pedir permiso (el navegador los bloquea antes de llegar al código). Esto no es un bug a arreglar aquí — es una limitación conocida que se documenta en el diseño y en el mensaje de error que ve el usuario.

## Arquitectura

Sin cambios de arquitectura backend (se elimina código, no se agrega). Frontend: ambos tabs nuevos siguen el patrón ya establecido en `herramientas.component.ts` para GPU/RAM (un objeto de estado `status: 'idle'|'running'|'done'|'error'`, métodos `start*`/`stop*`, limpieza en `ngOnDestroy`, integración con `addReport()`), usando `navigator.mediaDevices.getUserMedia()` directamente — sin servicios nuevos, sin llamadas HTTP.

## Diseño

### Eliminar Inventario

**Backend — `HerramientasService.java`:** eliminar `inventory()`, `networkInterfaces()`, `installedPrograms()`, `runPowerShell()`, `parseCsv()`, `splitCsvLine()`, `column()`, `formatMac()`, `resolveComputerName()`. **Mantener** `ping()`, `isWindows()` (la usa `ping()` también), `parsePacketStats()`, `parseAverageLatency()`, el record `PacketStats`, y los 4 `Pattern` de ping. Quitar los imports que queden sin uso (`java.io.File`, `java.lang.management.ManagementFactory`, `java.net.InetAddress`, `java.net.NetworkInterface`, `java.time.Duration`, `java.util.Comparator`, `java.util.Enumeration`).

**Backend — `HerramientasController.java`:** eliminar el método `inventory()` y el import `org.springframework.web.bind.annotation.GetMapping` (ya sin uso, `ping` es `@PostMapping`).

**Backend — eliminar archivo** `SystemInventoryResponse.java` completo.

**Backend — `HerramientasControllerIT.java`:** eliminar los tests `inventory_allowsAuthenticatedUser` e `inventory_withoutAuth_returns401`. Mantener los 2 tests de `ping_*` sin cambios.

**Frontend — `herramientas.model.ts`:** eliminar `SystemInventoryResponse`, `NetworkInterfaceInfo`, `InstalledProgramInfo`. Mantener `PingResult`.

**Frontend — `herramientas.service.ts`:** eliminar el método `inventory()` y el import de `SystemInventoryResponse`. Mantener `ping()`.

**Frontend — `herramientas.component.ts`:** eliminar del tipo `ToolTab` el literal `'inventario'`; eliminar del array `tabs` la entrada `{ id: 'inventario', ... }`; eliminar `inventoryState`, `inventory`, `inventoryError`, `programSearch`, el getter `filteredPrograms`, el método `loadInventory()`, el caso especial `if (tab === 'inventario' ...)` dentro de `selectTab()`, y el bloque `if (this.inventory) { ... }` dentro de `buildReport()`. Eliminar los imports `InstalledProgramInfo`/`SystemInventoryResponse` de `./herramientas.model`. **Mantener** `clientInfo`, `ClientInfo`, `readClientInfo()` — se siguen usando en el encabezado de `buildReport()`.

**Frontend — `herramientas.component.html`:** eliminar el `<section class="tool-panel" [class.active]="activeTab === 'inventario'">` completo (incluye las 4 sub-tarjetas: Cliente web, Servidor/backend, Interfaces de red, Programas instalados).

**Frontend — `herramientas.component.scss`:** eliminar `.inventory-layout`, `.info-card`, `.info-card.wide`, `.programs-block`, `dl`/`dt`/`dd`, `.network-list`, `.network-row`, `.programs-head`, `.program-table`, `.empty-text`. Quitar también `.inventory-layout` de la lista de selectores en el media query de 1100px. **Mantener** `.error-text` (lo usa también Ping) y `.note` (lo usa RAM).

### Tab "Micrófono"

**Estado nuevo en el componente:**
```ts
interface MicStats {
  status: TestState;
  level: number;       // 0-100, nivel RMS actual
  peakLevel: number;   // 0-100, máximo detectado en la sesión actual
  message: string;
}
```
`micStats: MicStats = { status: 'idle', level: 0, peakLevel: 0, message: 'Selecciona un micrófono e inicia la prueba.' }`
`micDevices: MediaDeviceInfo[] = []`
`selectedMicId: string | null = null`

**Métodos:**
- `loadMicDevices(): void` — llama `navigator.mediaDevices.enumerateDevices()`, filtra `kind === 'audioinput'`, asigna a `micDevices`. Si no hay `label` (navegador no dio permiso aún), igual lista los dispositivos — el `<select>` muestra `device.label || 'Micrófono ' + (index + 1)'` como fallback.
- `startMicTest(): void` — si `!navigator.mediaDevices?.getUserMedia`, setea `micStats.status = 'error'` con mensaje "Este navegador o esta conexión no permite acceder al micrófono (revisa que estés en HTTPS o localhost)." y retorna. Si no hay error: pide `getUserMedia({ audio: selectedMicId ? { deviceId: { exact: selectedMicId } } : true })`. En éxito: guarda el `MediaStream` en `this.micStream`, crea `new AudioContext()`, `audioContext.createMediaStreamSource(stream)` conectado a un `AnalyserNode` (`fftSize = 2048`), llama `loadMicDevices()` de nuevo (para que ahora sí aparezcan los `label`), pone `status: 'running'`, e inicia el loop `animateMic()`. En error (`NotAllowedError`, etc.): `status: 'error'`, mensaje "Permiso de micrófono denegado o no disponible."
- `animateMic(): void` (privado) — en cada `requestAnimationFrame`: `analyser.getByteTimeDomainData(buffer)`; calcula RMS: `sqrt(mean((sample/128 - 1)^2))` sobre el buffer, normaliza a 0-100 (`Math.min(100, Math.round(rms * 100 * 3))` — el factor 3 es un ajuste de sensibilidad para que hablar a volumen normal se vea en el rango medio de la barra, no solo en el extremo). Actualiza `micStats.level` y, si supera, `micStats.peakLevel`. Continúa el loop mientras `micStats.status === 'running'`.
- `stopMicTest(): void` — cancela el `requestAnimationFrame` pendiente, detiene todos los tracks del `MediaStream` (`stream.getTracks().forEach(t => t.stop())`), cierra el `AudioContext` (`audioContext.close()`), limpia las referencias privadas. Si `micStats.peakLevel > 0`, llama `addReport('Micrófono', 'Nivel pico detectado: ' + peakLevel + '% — dispositivo: ' + label)`. Pone `status: 'idle'` (o conserva `'done'` con el último peak visible — usar `'done'` para que la UI muestre el resultado en vez de volver a "Listo").
- `onMicDeviceChange(deviceId: string): void` — si el test está corriendo, llama `stopMicTest()` y `startMicTest()` de nuevo con el nuevo `deviceId` para que el cambio de dispositivo sea inmediato.

**Referencias privadas nuevas:** `micStream?: MediaStream`, `micAudioContext?: AudioContext`, `micAnalyser?: AnalyserNode`, `micAnimationFrame = 0`.

**Limpieza:** `ngOnDestroy()` y `selectTab()` (al cambiar a un tab distinto de `'microfono'` mientras `micStats.status === 'running'`) llaman `stopMicTest()`.

**Template (`.tool-panel [class.active]="activeTab === 'microfono'"`):**
- `panel-heading` con título "Prueba de micrófono", descripción, `status-pill` (mismo patrón que Ping: `ok` si `status==='running'||'done'` con peak>0, `bad` si `status==='error'`).
- `<select>` de dispositivo (oculto/deshabilitado si `micDevices.length <= 1`), poblado con `micDevices`.
- Botones Iniciar/Detener (mismo patrón `primary-btn`/`ghost-btn` que RAM/GPU).
- Barra de nivel: reutiliza visualmente el patrón de `.gpu-progress` (`<i><b [style.width.%]="micStats.level"></b></i>`), con una marca de texto del peak al lado.
- `<p class="error-text" *ngIf="micStats.status === 'error'">{{ micStats.message }}</p>`.

### Tab "Cámara"

**Estado nuevo:**
```ts
interface CamStats {
  status: TestState;
  message: string;
}
```
`camStats: CamStats = { status: 'idle', message: 'Selecciona una cámara e inicia la prueba.' }`
`camDevices: MediaDeviceInfo[] = []`
`selectedCamId: string | null = null`
`@ViewChild('cameraVideo') cameraVideo?: ElementRef<HTMLVideoElement>;`

**Métodos** (mismo esquema que micrófono, sin `AnalyserNode`):
- `loadCamDevices(): void` — `enumerateDevices()` filtrando `kind === 'videoinput'`.
- `startCameraTest(): void` — guarda de capacidad igual que mic; `getUserMedia({ video: selectedCamId ? { deviceId: { exact: selectedCamId } } : true })`; en éxito asigna `this.cameraVideo!.nativeElement.srcObject = stream` (mismo patrón de acceso directo a `nativeElement` que ya usa `setupGpuScene()` con el canvas), `status: 'running'`, `addReport('Cámara', 'Vista previa activa — dispositivo: ' + label)`. En error: `status: 'error'` con mensaje según el tipo de error (`NotAllowedError` → permiso denegado; `NotFoundError` → sin cámara detectada).
- `stopCameraTest(): void` — detiene los tracks del stream, limpia `cameraVideo.nativeElement.srcObject = null`, `status: 'idle'`.
- `onCameraDeviceChange(deviceId: string): void` — igual que mic, reinicia si ya estaba corriendo.

**Limpieza:** igual que mic — `ngOnDestroy()` y `selectTab()` al salir del tab.

**Template:**
- Mismo `panel-heading` + `status-pill` + selector de dispositivo + Iniciar/Detener.
- `<video #cameraVideo autoplay playsinline muted class="camera-preview"></video>` — `muted` evita eco/feedback (no necesitamos audio en este tab, solo video), `playsinline` evita que algunos navegadores móviles fuercen pantalla completa.
- Estilo `.camera-preview`: mismo tratamiento visual que `.gpu-canvas` (ancho completo, alto fijo ~360-420px, borde, fondo neutro mientras no hay stream).
- `<p class="error-text" *ngIf="camStats.status === 'error'">{{ camStats.message }}</p>`.

### Ajuste de `.tool-tabs`

Cambiar `grid-template-columns: repeat(6, minmax(0, 1fr))` por `grid-template-columns: repeat(auto-fit, minmax(140px, 1fr))` en el selector base de `.tool-tabs` (no en los media queries, que ya fuerzan columnas fijas para pantallas chicas — esos quedan igual).

## Testing

**Backend:** los 2 tests de `inventory_*` en `HerramientasControllerIT` se eliminan junto con el endpoint. Los 2 tests de `ping_*` siguen igual — correr `mvn test` y confirmar que la suite completa de Herramientas pasa con solo esos 2 tests.

**Frontend:** el módulo no tiene spec hoy (`herramientas.component.spec.ts` no existe) y no se agrega uno en este trabajo — los tests de `getUserMedia`/`AudioContext` requieren mockear APIs del navegador que Karma/Jasmine no expone de forma realista sin una capa de abstracción adicional (fuera de alcance; el resto del componente — GPU/RAM/teclado/mouse — tampoco tiene tests hoy, así que no se introduce una asimetría nueva). Verificación: `ng build` debe compilar sin errores/warnings nuevos, y verificación manual en navegador (`ng serve` en `localhost`, que sí es contexto seguro) de: cambiar de micrófono/cámara en el selector, iniciar/detener ambas pruebas, ver el medidor de nivel reaccionar al hablar, ver el video en vivo, cambiar de tab mientras una prueba corre y confirmar (con el indicador de cámara/mic del navegador) que el stream se detiene.

**Comando de test:** `cd soportedesk-backend && mvn test` · `cd soportedesk-frontend && npx ng build --configuration development`

## Resumen de archivos

**Eliminar:**
- `soportedesk-backend/src/main/java/com/inia/soportedesk/herramientas/SystemInventoryResponse.java`

**Modificar:**
- `soportedesk-backend/src/main/java/com/inia/soportedesk/herramientas/HerramientasService.java` (quitar todo lo de inventario)
- `soportedesk-backend/src/main/java/com/inia/soportedesk/herramientas/HerramientasController.java` (quitar endpoint `/inventario`)
- `soportedesk-backend/src/test/java/com/inia/soportedesk/herramientas/HerramientasControllerIT.java` (quitar 2 tests)
- `soportedesk-frontend/src/app/features/herramientas/herramientas.model.ts`
- `soportedesk-frontend/src/app/features/herramientas/herramientas.service.ts`
- `soportedesk-frontend/src/app/features/herramientas/herramientas.component.ts`
- `soportedesk-frontend/src/app/features/herramientas/herramientas.component.html`
- `soportedesk-frontend/src/app/features/herramientas/herramientas.component.scss`
