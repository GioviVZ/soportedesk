# Herramientas — Reemplazar Inventario por Prueba de Micrófono y Cámara Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminar el tab "Inventario" (frontend + backend) del módulo Herramientas y agregar dos tabs nuevos 100% client-side: "Micrófono" (medidor de nivel en vivo) y "Cámara" (vista previa en vivo), ambos con selector de dispositivo.

**Architecture:** Sin servicios nuevos ni llamadas HTTP para mic/cámara — ambos usan `navigator.mediaDevices.getUserMedia()` directamente desde `HerramientasComponent`, siguiendo el mismo patrón de estado (`status: 'idle'|'running'|'done'|'error'`) que ya usan los tabs GPU/RAM en ese mismo archivo.

**Tech Stack:** Angular 17 standalone component, Web Audio API (`AudioContext`/`AnalyserNode`), `navigator.mediaDevices` (`getUserMedia`/`enumerateDevices`) — todo nativo del navegador, sin librerías nuevas. Backend: Spring Boot (solo se elimina código, no se agrega).

## Global Constraints

- `getUserMedia` requiere contexto seguro (HTTPS o `localhost`) — no funciona en el acceso LAN actual por HTTP plano. No es un bug a arreglar en este plan.
- `clientInfo`/`readClientInfo()` en `herramientas.component.ts` NO se elimina — se usa en el encabezado de `buildReport()` para cualquier pestaña, no es exclusivo de Inventario.
- `ping()` e `isWindows()` en el backend NO se eliminan — los sigue usando la prueba de Ping.
- No se agrega captura de foto ni grabación/reproducción de audio — solo medidor de nivel en vivo (mic) y vista previa en vivo (cámara).
- No se agregan tests automatizados de frontend para mic/cámara (requieren mockear APIs de navegador no disponibles de forma realista en Karma/Jasmine hoy; el resto de tabs del componente —GPU/RAM/teclado/mouse— tampoco tiene tests).
- Comando de test backend: `cd soportedesk-backend && mvn test-compile` (compilación) y `mvn test -Dtest=HerramientasControllerIT` (puede fallar al cargar el `ApplicationContext` por un problema preexistente de H2 vs `schema.sql` T-SQL que afecta a *todos* los `*ControllerIT` del proyecto — no es una regresión de este plan).
- Comando de test frontend: `cd soportedesk-frontend && npx ng build --configuration development` (debe compilar sin errores ni warnings nuevos).

---

### Task 1: Backend — eliminar Inventario

**Files:**
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/herramientas/HerramientasService.java`
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/herramientas/HerramientasController.java`
- Delete: `soportedesk-backend/src/main/java/com/inia/soportedesk/herramientas/SystemInventoryResponse.java`
- Modify: `soportedesk-backend/src/test/java/com/inia/soportedesk/herramientas/HerramientasControllerIT.java`

**Interfaces:**
- Consumes: nada de tareas anteriores (primera tarea del plan).
- Produces: nada que otras tareas consuman — Tasks 2-4 son frontend, no dependen de cambios de Java.

- [ ] **Step 1: Reemplazar `HerramientasService.java` completo**

Reemplazar el archivo completo `soportedesk-backend/src/main/java/com/inia/soportedesk/herramientas/HerramientasService.java` con:

```java
package com.inia.soportedesk.herramientas;

import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.Charset;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class HerramientasService {

    private static final Pattern WINDOWS_AVERAGE = Pattern.compile("(?:Media|Average)\\s*=\\s*(\\d+)ms", Pattern.CASE_INSENSITIVE);
    private static final Pattern UNIX_AVERAGE = Pattern.compile("=\\s*[\\d.]+/([\\d.]+)/[\\d.]+/[\\d.]+\\s*ms");
    private static final Pattern RECEIVED_ENGLISH = Pattern.compile("Sent\\s*=\\s*(\\d+),\\s*Received\\s*=\\s*(\\d+),\\s*Lost\\s*=\\s*(\\d+)", Pattern.CASE_INSENSITIVE);
    private static final Pattern RECEIVED_SPANISH = Pattern.compile("enviados\\s*=\\s*(\\d+),\\s*recibidos\\s*=\\s*(\\d+),\\s*perdidos\\s*=\\s*(\\d+)", Pattern.CASE_INSENSITIVE);

    public PingResult ping(String rawHost) {
        String host = rawHost.trim();
        boolean windows = isWindows();
        List<String> command = windows
                ? List.of("ping", "-n", "4", "-w", "1200", host)
                : List.of("ping", "-c", "4", "-W", "2", host);

        List<String> output = new ArrayList<>();
        int exitCode = -1;

        try {
            Process process = new ProcessBuilder(command).redirectErrorStream(true).start();
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream(), Charset.defaultCharset()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    if (!line.isBlank()) {
                        output.add(line.trim());
                    }
                }
            }
            boolean completed = process.waitFor(8, TimeUnit.SECONDS);
            if (!completed) {
                process.destroyForcibly();
                return PingResult.builder()
                        .host(host)
                        .reachable(false)
                        .status("Tiempo de espera agotado")
                        .output(output)
                        .build();
            }
            exitCode = process.exitValue();
        } catch (IOException e) {
            output.add("No se pudo ejecutar ping: " + e.getMessage());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            output.add("La prueba fue interrumpida.");
        }

        PacketStats stats = parsePacketStats(output);
        Double average = parseAverageLatency(output);
        boolean reachable = exitCode == 0 || stats.received().orElse(0) > 0;

        return PingResult.builder()
                .host(host)
                .reachable(reachable)
                .packetsSent(stats.sent().orElse(null))
                .packetsReceived(stats.received().orElse(null))
                .packetsLost(stats.lost().orElse(null))
                .averageLatencyMs(average)
                .status(reachable ? "Responde" : "No responde")
                .output(output)
                .build();
    }

    private PacketStats parsePacketStats(List<String> output) {
        for (String line : output) {
            Matcher english = RECEIVED_ENGLISH.matcher(line);
            if (english.find()) {
                return new PacketStats(
                        Optional.of(Integer.parseInt(english.group(1))),
                        Optional.of(Integer.parseInt(english.group(2))),
                        Optional.of(Integer.parseInt(english.group(3)))
                );
            }
            Matcher spanish = RECEIVED_SPANISH.matcher(line);
            if (spanish.find()) {
                return new PacketStats(
                        Optional.of(Integer.parseInt(spanish.group(1))),
                        Optional.of(Integer.parseInt(spanish.group(2))),
                        Optional.of(Integer.parseInt(spanish.group(3)))
                );
            }
        }
        return new PacketStats(Optional.empty(), Optional.empty(), Optional.empty());
    }

    private Double parseAverageLatency(List<String> output) {
        for (String line : output) {
            Matcher windows = WINDOWS_AVERAGE.matcher(line);
            if (windows.find()) {
                return Double.valueOf(windows.group(1));
            }
            Matcher unix = UNIX_AVERAGE.matcher(line);
            if (unix.find()) {
                return Double.valueOf(unix.group(1));
            }
        }
        return null;
    }

    private boolean isWindows() {
        return System.getProperty("os.name", "").toLowerCase(Locale.ROOT).contains("win");
    }

    private record PacketStats(Optional<Integer> sent, Optional<Integer> received, Optional<Integer> lost) {
    }
}
```

- [ ] **Step 2: Reemplazar `HerramientasController.java` completo**

```java
package com.inia.soportedesk.herramientas;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/herramientas")
@RequiredArgsConstructor
public class HerramientasController {

    private final HerramientasService service;

    @PostMapping("/ping")
    public PingResult ping(@Valid @RequestBody PingRequest request) {
        return service.ping(request.getHost());
    }
}
```

- [ ] **Step 3: Eliminar el archivo del modelo de inventario**

```bash
git rm soportedesk-backend/src/main/java/com/inia/soportedesk/herramientas/SystemInventoryResponse.java
```

- [ ] **Step 4: Reemplazar `HerramientasControllerIT.java` completo**

```java
package com.inia.soportedesk.herramientas;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.hamcrest.Matchers.is;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class HerramientasControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private HerramientasService service;

    @Test
    @WithMockUser(roles = "SOPORTE")
    void ping_allowsAuthenticatedUser() throws Exception {
        PingRequest request = new PingRequest();
        request.setHost("127.0.0.1");
        when(service.ping("127.0.0.1")).thenReturn(PingResult.builder()
                .host("127.0.0.1")
                .reachable(true)
                .status("Responde")
                .output(List.of("ok"))
                .build());

        mockMvc.perform(post("/api/herramientas/ping")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.host", is("127.0.0.1")))
                .andExpect(jsonPath("$.reachable", is(true)));
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void ping_rejectsUnsafeHost() throws Exception {
        mockMvc.perform(post("/api/herramientas/ping")
                        .contentType("application/json")
                        .content("{\"host\":\"127.0.0.1 & whoami\"}"))
                .andExpect(status().isBadRequest());
    }
}
```

- [ ] **Step 5: Compilar y correr el test**

Run: `cd soportedesk-backend && mvn test-compile`
Expected: `BUILD SUCCESS`, sin errores de compilación (confirma que no quedó ninguna referencia suelta a `SystemInventoryResponse` ni a los métodos eliminados).

Run: `mvn test -Dtest=HerramientasControllerIT`
Expected: dos resultados posibles, ambos aceptables:
- `Tests run: 2, Failures: 0, Errors: 0` → perfecto.
- Falla al cargar el `ApplicationContext` con un error relacionado a sintaxis SQL de `schema.sql` bajo H2 (ej. menciona `sys.databases`, `BEGIN...END`, o `CREATE DATABASE`) → es el problema preexistente que afecta a todo `*ControllerIT` en este proyecto (confirmable comparando el mensaje de error con el de cualquier otro `*ControllerIT`, p.ej. `DependenciaControllerIT`). Si el error es este, no es una regresión de este task — continuar.

Si la falla es de **otro tipo** (ej. menciona `SystemInventoryResponse`, `inventory`, o un método que eliminamos), eso sí es un problema real de este task — revisar el Step 1-4.

- [ ] **Step 6: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/herramientas/HerramientasService.java soportedesk-backend/src/main/java/com/inia/soportedesk/herramientas/HerramientasController.java soportedesk-backend/src/test/java/com/inia/soportedesk/herramientas/HerramientasControllerIT.java
git commit -m "feat: remove inventario endpoint from Herramientas backend"
```

---

### Task 2: Frontend — eliminar Inventario

**Files:**
- Modify: `soportedesk-frontend/src/app/features/herramientas/herramientas.model.ts`
- Modify: `soportedesk-frontend/src/app/features/herramientas/herramientas.service.ts`
- Modify: `soportedesk-frontend/src/app/features/herramientas/herramientas.component.ts`
- Modify: `soportedesk-frontend/src/app/features/herramientas/herramientas.component.html`
- Modify: `soportedesk-frontend/src/app/features/herramientas/herramientas.component.scss`

**Interfaces:**
- Consumes: nada de Task 1 (backend y frontend son independientes; el frontend deja de llamar al endpoint que Task 1 ya eliminó).
- Produces: `ToolTab` (en `herramientas.component.ts`) queda como `'ping' | 'gpu' | 'ram' | 'teclado' | 'mouse'` — Task 3 le agrega `'microfono'`, Task 4 le agrega `'camara'`.

- [ ] **Step 1: Reemplazar `herramientas.model.ts` completo**

```ts
export interface PingResult {
  host: string;
  reachable: boolean;
  packetsSent?: number | null;
  packetsReceived?: number | null;
  packetsLost?: number | null;
  averageLatencyMs?: number | null;
  status: string;
  output: string[];
}
```

- [ ] **Step 2: Reemplazar `herramientas.service.ts` completo**

```ts
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PingResult } from './herramientas.model';

@Injectable({ providedIn: 'root' })
export class HerramientasService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/herramientas`;

  ping(host: string): Observable<PingResult> {
    return this.http.post<PingResult>(`${this.apiUrl}/ping`, { host });
  }
}
```

- [ ] **Step 3: En `herramientas.component.ts`, quitar el import de tipos de inventario**

Buscar:
```ts
import {
  InstalledProgramInfo,
  PingResult,
  SystemInventoryResponse,
} from './herramientas.model';
```

Reemplazar por:
```ts
import { PingResult } from './herramientas.model';
```

- [ ] **Step 4: Quitar `'inventario'` del tipo `ToolTab`**

Buscar:
```ts
type ToolTab = 'ping' | 'inventario' | 'gpu' | 'ram' | 'teclado' | 'mouse';
```

Reemplazar por:
```ts
type ToolTab = 'ping' | 'gpu' | 'ram' | 'teclado' | 'mouse';
```

- [ ] **Step 5: Quitar la entrada de Inventario del array `tabs`**

Buscar:
```ts
  readonly tabs: ToolTabItem[] = [
    { id: 'ping', label: 'Ping', detail: 'Red' },
    { id: 'inventario', label: 'Inventario', detail: 'Sistema' },
    { id: 'gpu', label: 'GPU', detail: 'WebGL' },
    { id: 'ram', label: 'RAM', detail: 'Memoria web' },
    { id: 'teclado', label: 'Teclado', detail: 'Entrada' },
    { id: 'mouse', label: 'Mouse', detail: 'Botones' },
  ];
```

Reemplazar por:
```ts
  readonly tabs: ToolTabItem[] = [
    { id: 'ping', label: 'Ping', detail: 'Red' },
    { id: 'gpu', label: 'GPU', detail: 'WebGL' },
    { id: 'ram', label: 'RAM', detail: 'Memoria web' },
    { id: 'teclado', label: 'Teclado', detail: 'Entrada' },
    { id: 'mouse', label: 'Mouse', detail: 'Botones' },
  ];
```

- [ ] **Step 6: Quitar los campos de estado de inventario**

Buscar:
```ts
  inventoryState: TestState = 'idle';
  inventory: SystemInventoryResponse | null = null;
  inventoryError = '';
  programSearch = '';
```

Eliminar ese bloque completo (las 4 líneas).

- [ ] **Step 7: Quitar el getter `filteredPrograms`**

Buscar y eliminar el bloque completo:
```ts
  get filteredPrograms(): InstalledProgramInfo[] {
    const programs = this.inventory?.installedPrograms ?? [];
    const term = this.programSearch.trim().toLowerCase();
    if (!term) {
      return programs;
    }
    return programs.filter((program) =>
      [program.name, program.version, program.publisher, program.installDate]
        .join(' ')
        .toLowerCase()
        .includes(term),
    );
  }
```

- [ ] **Step 8: Simplificar `selectTab()`**

Buscar:
```ts
  selectTab(tab: ToolTab): void {
    this.activeTab = tab;
    this.reportCopied = false;
    if (tab === 'inventario' && this.inventoryState === 'idle') {
      this.loadInventory();
    }
    if (tab === 'gpu') {
      window.setTimeout(() => this.resizeGpu(), 0);
    }
  }
```

Reemplazar por:
```ts
  selectTab(tab: ToolTab): void {
    this.activeTab = tab;
    this.reportCopied = false;
    if (tab === 'gpu') {
      window.setTimeout(() => this.resizeGpu(), 0);
    }
  }
```

- [ ] **Step 9: Quitar el método `loadInventory()`**

Buscar y eliminar el bloque completo:
```ts
  loadInventory(): void {
    this.inventoryState = 'running';
    this.inventoryError = '';
    this.service.inventory().subscribe({
      next: (data) => {
        this.inventory = data;
        this.inventoryState = 'done';
        this.addReport('Inventario', `${data.computerName || 'Equipo'} - ${data.operatingSystem || 'SO no detectado'}`);
      },
      error: (err) => {
        this.inventoryState = 'error';
        this.inventoryError = err?.error?.message ?? 'No se pudo cargar el inventario.';
      },
    });
  }
```

- [ ] **Step 10: Quitar el bloque de inventario en `buildReport()`**

Buscar:
```ts
    if (this.inventory) {
      lines.push(
        '',
        'Inventario backend',
        `Equipo: ${this.inventory.computerName || '-'}`,
        `SO: ${this.inventory.operatingSystem || '-'} ${this.inventory.osVersion || ''}`.trim(),
        `CPU: ${this.inventory.availableProcessors || '-'} nucleos`,
        `Disco libre: ${this.formatBytes(this.inventory.freeDiskBytes)}`,
        `Programas detectados: ${this.inventory.installedPrograms?.length ?? 0}`,
      );
    }

    return lines.join('\n');
```

Reemplazar por (solo se quita el bloque `if`, el `return` se mantiene igual):
```ts
    return lines.join('\n');
```

- [ ] **Step 11: Quitar el panel de Inventario del template**

En `herramientas.component.html`, buscar el bloque que empieza en `<section class="tool-panel" [class.active]="activeTab === 'inventario'">` y termina en el `</section>` que le corresponde (incluye las sub-tarjetas "Cliente web", "Servidor / backend", "Interfaces de red", y "Programas instalados") — eliminar el bloque completo, desde:

```html
  <section class="tool-panel" [class.active]="activeTab === 'inventario'">
    <div class="panel-heading">
      <div>
        <h3>Inventario del equipo</h3>
```

hasta el `</section>` que cierra ese panel (justo antes de `<section class="tool-panel gpu-panel" [class.active]="activeTab === 'gpu'">`).

- [ ] **Step 12: Limpiar `herramientas.component.scss`**

Buscar y eliminar estos bloques completos:

```scss
.inventory-layout {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.info-card,
.programs-block {
  padding: 15px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: #fff;

  h4 {
    margin: 0 0 12px;
    font-size: 15px;
  }
}

.info-card.wide,
.programs-block {
  margin-top: 12px;
}

dl {
  display: grid;
  gap: 9px;
  margin: 0;

  div {
    display: grid;
    grid-template-columns: 120px minmax(0, 1fr);
    gap: 10px;
  }

  dt {
    color: var(--color-text-secondary);
    font-size: 12px;
    font-weight: 800;
  }

  dd {
    margin: 0;
    min-width: 0;
    overflow-wrap: anywhere;
  }
}

.network-list {
  display: grid;
  gap: 8px;
}

.network-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 150px minmax(0, 1.2fr);
  gap: 10px;
  padding: 10px;
  border-radius: var(--radius-sm);
  background: var(--color-muted);

  small,
  span {
    overflow-wrap: anywhere;
  }
}

.programs-head {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(220px, 320px);
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;

  h4 {
    margin-bottom: 2px;
  }

  p {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: 12px;
  }
}

.program-table {
  max-height: 360px;
  overflow: auto;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
}
```

Buscar:
```scss
.empty-text,
.note {
  margin: 12px 0 0;
  color: var(--color-text-secondary);
}
```

Reemplazar por (solo se quita `.empty-text`, `.note` se mantiene porque la usa el panel RAM):
```scss
.note {
  margin: 12px 0 0;
  color: var(--color-text-secondary);
}
```

Buscar, dentro del media query `@media (max-width: 1100px)`:
```scss
  .gpu-layout,
  .gpu-controls,
  .inventory-layout {
    grid-template-columns: 1fr;
  }
```

Reemplazar por:
```scss
  .gpu-layout,
  .gpu-controls {
    grid-template-columns: 1fr;
  }
```

Por último, buscar la regla base de `.tool-tabs`:
```scss
.tool-tabs {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 14px;
```

Reemplazar la línea `grid-template-columns` por una grilla flexible que no dependa de la cantidad exacta de tabs (Task 3 y 4 van a agregar 2 tabs más):
```scss
.tool-tabs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 8px;
  margin-bottom: 14px;
```

(El media query de `.tool-tabs` a 1100px y 700px, que fuerza `repeat(3, ...)` y luego `repeat(1, ...)`, se mantiene igual — esos sí deben quedar fijos para pantallas chicas.)

- [ ] **Step 13: Verificar que compila limpio**

Run: `cd soportedesk-frontend && npx ng build --configuration development`
Expected: `Application bundle generation complete`, sin errores ni warnings nuevos relacionados a `herramientas`.

- [ ] **Step 14: Commit**

```bash
git add soportedesk-frontend/src/app/features/herramientas/
git commit -m "feat: remove inventario tab from Herramientas frontend"
```

---

### Task 3: Frontend — agregar tab "Micrófono"

**Files:**
- Modify: `soportedesk-frontend/src/app/features/herramientas/herramientas.component.ts`
- Modify: `soportedesk-frontend/src/app/features/herramientas/herramientas.component.html`
- Modify: `soportedesk-frontend/src/app/features/herramientas/herramientas.component.scss`

**Interfaces:**
- Consumes: `ToolTab` type y `tabs` array tal como quedaron tras Task 2.
- Produces: `ToolTab` pasa a incluir `'microfono'`; los métodos `startMicTest()`/`stopMicTest()`/`onMicDeviceChange()`/`loadMicDevices()` y el estado `micStats: MicStats` quedan disponibles para que `ngOnDestroy()` y `selectTab()` los llamen (ya integrados en esta misma tarea).

- [ ] **Step 1: Agregar `'microfono'` al tipo `ToolTab`**

Buscar (tal como quedó tras Task 2):
```ts
type ToolTab = 'ping' | 'gpu' | 'ram' | 'teclado' | 'mouse';
```

Reemplazar por:
```ts
type ToolTab = 'ping' | 'gpu' | 'ram' | 'teclado' | 'mouse' | 'microfono';
```

- [ ] **Step 2: Agregar la interfaz `MicStats` junto a las otras interfaces de stats**

Buscar:
```ts
interface MouseStats {
  left: boolean;
  middle: boolean;
  right: boolean;
  doubleClick: boolean;
  wheel: boolean;
  dragging: boolean;
  moves: number;
  x: number;
  y: number;
}
```

Agregar inmediatamente después (antes de `const KEY_ROWS = [`):
```ts

interface MicStats {
  status: TestState;
  level: number;
  peakLevel: number;
  message: string;
}
```

- [ ] **Step 3: Agregar la entrada de Micrófono al array `tabs`**

Buscar (tal como quedó tras Task 2):
```ts
  readonly tabs: ToolTabItem[] = [
    { id: 'ping', label: 'Ping', detail: 'Red' },
    { id: 'gpu', label: 'GPU', detail: 'WebGL' },
    { id: 'ram', label: 'RAM', detail: 'Memoria web' },
    { id: 'teclado', label: 'Teclado', detail: 'Entrada' },
    { id: 'mouse', label: 'Mouse', detail: 'Botones' },
  ];
```

Reemplazar por:
```ts
  readonly tabs: ToolTabItem[] = [
    { id: 'ping', label: 'Ping', detail: 'Red' },
    { id: 'gpu', label: 'GPU', detail: 'WebGL' },
    { id: 'ram', label: 'RAM', detail: 'Memoria web' },
    { id: 'teclado', label: 'Teclado', detail: 'Entrada' },
    { id: 'mouse', label: 'Mouse', detail: 'Botones' },
    { id: 'microfono', label: 'Micrófono', detail: 'Audio' },
  ];
```

- [ ] **Step 4: Agregar el estado de micrófono**

Buscar:
```ts
  reportEntries: ReportEntry[] = [];
  reportCopied = false;
```

Agregar inmediatamente antes:
```ts
  micStats: MicStats = {
    status: 'idle',
    level: 0,
    peakLevel: 0,
    message: 'Selecciona un microfono e inicia la prueba.',
  };
  micDevices: MediaDeviceInfo[] = [];
  selectedMicId: string | null = null;

```

- [ ] **Step 5: Agregar las referencias privadas de micrófono**

Buscar:
```ts
  private ramBuffer: Uint8Array | null = null;
```

Reemplazar por:
```ts
  private ramBuffer: Uint8Array | null = null;
  private micStream: MediaStream | null = null;
  private micAudioContext: AudioContext | null = null;
  private micAnalyser: AnalyserNode | null = null;
  private micAnimationFrame = 0;
```

- [ ] **Step 6: Llamar `stopMicTest()` al destruir el componente**

Buscar:
```ts
  ngOnDestroy(): void {
    this.stopGpuTest();
    this.renderer?.dispose();
    this.ramBuffer = null;
  }
```

Reemplazar por:
```ts
  ngOnDestroy(): void {
    this.stopGpuTest();
    this.renderer?.dispose();
    this.ramBuffer = null;
    this.stopMicTest();
  }
```

- [ ] **Step 7: Detener el micrófono al salir del tab y cargar dispositivos al entrar**

Buscar (tal como quedó tras Task 2):
```ts
  selectTab(tab: ToolTab): void {
    this.activeTab = tab;
    this.reportCopied = false;
    if (tab === 'gpu') {
      window.setTimeout(() => this.resizeGpu(), 0);
    }
  }
```

Reemplazar por:
```ts
  selectTab(tab: ToolTab): void {
    if (this.activeTab === 'microfono' && tab !== 'microfono') {
      this.stopMicTest();
    }
    this.activeTab = tab;
    this.reportCopied = false;
    if (tab === 'gpu') {
      window.setTimeout(() => this.resizeGpu(), 0);
    }
    if (tab === 'microfono') {
      this.loadMicDevices();
    }
  }
```

- [ ] **Step 8: Agregar los métodos de micrófono**

Buscar el método `releaseRam()`:
```ts
  releaseRam(): void {
    this.ramBuffer = null;
    this.ramStats = {
      ...this.ramStats,
      status: 'idle',
      allocatedMb: 0,
      message: 'Memoria liberada',
    };
  }
```

Agregar inmediatamente después:
```ts

  loadMicDevices(): void {
    if (!navigator.mediaDevices?.enumerateDevices) {
      return;
    }
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      this.micDevices = devices.filter((device) => device.kind === 'audioinput');
      if (!this.selectedMicId && this.micDevices.length) {
        this.selectedMicId = this.micDevices[0].deviceId;
      }
    });
  }

  micDeviceLabel(device: MediaDeviceInfo, index: number): string {
    return device.label || `Microfono ${index + 1}`;
  }

  startMicTest(): void {
    if (!navigator.mediaDevices?.getUserMedia) {
      this.micStats = {
        ...this.micStats,
        status: 'error',
        message: 'Este navegador o esta conexion no permite acceder al microfono (revisa que estes en HTTPS o localhost).',
      };
      return;
    }

    this.stopMicTest();
    this.micStats = { status: 'running', level: 0, peakLevel: 0, message: 'Escuchando...' };

    const constraints: MediaStreamConstraints = {
      audio: this.selectedMicId ? { deviceId: { exact: this.selectedMicId } } : true,
    };

    navigator.mediaDevices.getUserMedia(constraints).then(
      (stream) => {
        this.micStream = stream;
        this.micAudioContext = new AudioContext();
        const source = this.micAudioContext.createMediaStreamSource(stream);
        this.micAnalyser = this.micAudioContext.createAnalyser();
        this.micAnalyser.fftSize = 2048;
        source.connect(this.micAnalyser);
        this.loadMicDevices();
        this.animateMic();
      },
      () => {
        this.micStats = {
          ...this.micStats,
          status: 'error',
          message: 'Permiso de microfono denegado o no disponible.',
        };
      },
    );
  }

  stopMicTest(): void {
    if (this.micAnimationFrame) {
      cancelAnimationFrame(this.micAnimationFrame);
      this.micAnimationFrame = 0;
    }
    this.micStream?.getTracks().forEach((track) => track.stop());
    this.micStream = null;
    this.micAudioContext?.close();
    this.micAudioContext = null;
    this.micAnalyser = null;

    if (this.micStats.status === 'running') {
      if (this.micStats.peakLevel > 0) {
        const device = this.micDevices.find((d) => d.deviceId === this.selectedMicId);
        const label = device ? this.micDeviceLabel(device, this.micDevices.indexOf(device)) : 'Microfono';
        this.addReport('Microfono', `Nivel pico detectado: ${this.micStats.peakLevel}% - dispositivo: ${label}`);
      }
      this.micStats = { ...this.micStats, status: 'done', message: 'Prueba detenida.' };
    }
  }

  onMicDeviceChange(deviceId: string): void {
    this.selectedMicId = deviceId;
    if (this.micStats.status === 'running') {
      this.startMicTest();
    }
  }

  private animateMic(): void {
    if (!this.micAnalyser) {
      return;
    }
    const buffer = new Uint8Array(this.micAnalyser.fftSize);
    this.micAnalyser.getByteTimeDomainData(buffer);

    let sumSquares = 0;
    for (let i = 0; i < buffer.length; i++) {
      const normalized = buffer[i] / 128 - 1;
      sumSquares += normalized * normalized;
    }
    const rms = Math.sqrt(sumSquares / buffer.length);
    const level = Math.min(100, Math.round(rms * 100 * 3));

    this.micStats = {
      ...this.micStats,
      level,
      peakLevel: Math.max(this.micStats.peakLevel, level),
    };

    if (this.micStats.status === 'running') {
      this.micAnimationFrame = requestAnimationFrame(() => this.animateMic());
    }
  }
```

- [ ] **Step 9: Agregar el panel de Micrófono al template**

En `herramientas.component.html`, agregar esta sección inmediatamente después del `</section>` que cierra el panel `mouse` (al final del archivo, antes del `</div>` final que cierra `.tools-page`):

```html

  <section class="tool-panel" [class.active]="activeTab === 'microfono'">
    <div class="panel-heading">
      <div>
        <h3>Prueba de microfono</h3>
        <p>Verifica que el microfono capte sonido en tiempo real.</p>
      </div>
      <span class="status-pill" [class.ok]="micStats.status === 'done' && micStats.peakLevel > 0" [class.bad]="micStats.status === 'error'">
        {{ micStats.status === 'running' ? 'Escuchando' : (micStats.status === 'error' ? 'Error' : 'Listo') }}
      </span>
    </div>

    <div class="ping-box" *ngIf="micDevices.length > 1">
      <label>
        Microfono
        <select [ngModel]="selectedMicId" (ngModelChange)="onMicDeviceChange($event)">
          <option *ngFor="let device of micDevices; let i = index" [value]="device.deviceId">
            {{ micDeviceLabel(device, i) }}
          </option>
        </select>
      </label>
    </div>

    <div class="button-row">
      <button type="button" class="ghost-btn" (click)="stopMicTest()" [disabled]="micStats.status !== 'running'">Detener</button>
      <button type="button" class="primary-btn" (click)="startMicTest()" [disabled]="micStats.status === 'running'">
        {{ micStats.status === 'running' ? 'Escuchando...' : 'Iniciar prueba' }}
      </button>
    </div>

    <p class="error-text" *ngIf="micStats.status === 'error'">{{ micStats.message }}</p>

    <div class="level-meter" *ngIf="micStats.status !== 'error'">
      <span>Nivel</span>
      <i><b [style.width.%]="micStats.level"></b></i>
      <strong>{{ micStats.level }}%</strong>
    </div>
    <p class="note" *ngIf="micStats.status !== 'error'">Pico de esta sesion: {{ micStats.peakLevel }}%</p>
  </section>
</div>
```

No agregar nada después de este `</div>` — es el cierre de `.tools-page` que ya existe al final del archivo; este Step solo inserta la nueva `<section>` justo antes de él.

- [ ] **Step 10: Agregar el estilo `.level-meter`**

En `herramientas.component.scss`, buscar la regla `.range-control` (la que sigue a `.gpu-progress`):

```scss
.range-control {
  display: grid;
  gap: 8px;
  margin-bottom: 16px;

  input {
    width: 100%;
  }
}
```

Agregar inmediatamente después:

```scss

.level-meter {
  display: grid;
  grid-template-columns: 60px minmax(0, 1fr) 50px;
  align-items: center;
  gap: 10px;
  margin: 14px 0;

  span {
    color: var(--color-text-secondary);
    font-size: 12px;
    font-weight: 800;
  }

  strong {
    color: var(--color-text);
    text-align: right;
  }

  i {
    display: block;
    height: 10px;
    overflow: hidden;
    border-radius: 999px;
    background: #dbe3ea;
  }

  b {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: var(--color-accent);
    transition: width .1s linear;
  }
}
```

- [ ] **Step 11: Verificar que compila limpio**

Run: `cd soportedesk-frontend && npx ng build --configuration development`
Expected: `Application bundle generation complete`, sin errores ni warnings nuevos.

- [ ] **Step 12: Verificación manual en navegador**

Run: `cd soportedesk-frontend && ng serve`, abrir `http://localhost:4200/herramientas` (debe ser `localhost`, no una IP de LAN, para que `getUserMedia` funcione), entrar al tab "Microfono", presionar "Iniciar prueba", aceptar el permiso del navegador, hablar cerca del microfono y confirmar que la barra de nivel reacciona. Cambiar a otro tab y confirmar (con el indicador de microfono del navegador, normalmente un icono en la barra de direcciones) que el microfono se apaga.

- [ ] **Step 13: Commit**

```bash
git add soportedesk-frontend/src/app/features/herramientas/
git commit -m "feat: add microphone level test to Herramientas"
```

---

### Task 4: Frontend — agregar tab "Camara"

**Files:**
- Modify: `soportedesk-frontend/src/app/features/herramientas/herramientas.component.ts`
- Modify: `soportedesk-frontend/src/app/features/herramientas/herramientas.component.html`
- Modify: `soportedesk-frontend/src/app/features/herramientas/herramientas.component.scss`

**Interfaces:**
- Consumes: `ToolTab` type y `tabs` array tal como quedaron tras Task 3 (incluye `'microfono'`).
- Produces: `ToolTab` pasa a incluir también `'camara'` — última tarea del plan, nada depende de esto después.

- [ ] **Step 1: Agregar `'camara'` al tipo `ToolTab`**

Buscar (tal como quedó tras Task 3):
```ts
type ToolTab = 'ping' | 'gpu' | 'ram' | 'teclado' | 'mouse' | 'microfono';
```

Reemplazar por:
```ts
type ToolTab = 'ping' | 'gpu' | 'ram' | 'teclado' | 'mouse' | 'microfono' | 'camara';
```

- [ ] **Step 2: Agregar la interfaz `CamStats`**

Buscar la interfaz `MicStats` agregada en Task 3:
```ts
interface MicStats {
  status: TestState;
  level: number;
  peakLevel: number;
  message: string;
}
```

Agregar inmediatamente después:
```ts

interface CamStats {
  status: TestState;
  message: string;
}
```

- [ ] **Step 3: Agregar la entrada de Camara al array `tabs`**

Buscar (tal como quedó tras Task 3):
```ts
    { id: 'microfono', label: 'Micrófono', detail: 'Audio' },
  ];
```

Reemplazar por:
```ts
    { id: 'microfono', label: 'Micrófono', detail: 'Audio' },
    { id: 'camara', label: 'Cámara', detail: 'Video' },
  ];
```

- [ ] **Step 4: Agregar el `@ViewChild` del video y el estado de camara**

Buscar:
```ts
  @ViewChild('gpuCanvas') gpuCanvas?: ElementRef<HTMLCanvasElement>;
```

Reemplazar por:
```ts
  @ViewChild('gpuCanvas') gpuCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('cameraVideo') cameraVideo?: ElementRef<HTMLVideoElement>;
```

Buscar (tal como quedó tras Task 3):
```ts
  micStats: MicStats = {
    status: 'idle',
    level: 0,
    peakLevel: 0,
    message: 'Selecciona un microfono e inicia la prueba.',
  };
  micDevices: MediaDeviceInfo[] = [];
  selectedMicId: string | null = null;
```

Agregar inmediatamente después:
```ts

  camStats: CamStats = { status: 'idle', message: 'Selecciona una camara e inicia la prueba.' };
  camDevices: MediaDeviceInfo[] = [];
  selectedCamId: string | null = null;
```

- [ ] **Step 5: Agregar la referencia privada del stream de camara**

Buscar (tal como quedó tras Task 3):
```ts
  private micStream: MediaStream | null = null;
  private micAudioContext: AudioContext | null = null;
  private micAnalyser: AnalyserNode | null = null;
  private micAnimationFrame = 0;
```

Reemplazar por:
```ts
  private micStream: MediaStream | null = null;
  private micAudioContext: AudioContext | null = null;
  private micAnalyser: AnalyserNode | null = null;
  private micAnimationFrame = 0;
  private camStream: MediaStream | null = null;
```

- [ ] **Step 6: Llamar `stopCameraTest()` al destruir el componente**

Buscar (tal como quedó tras Task 3):
```ts
  ngOnDestroy(): void {
    this.stopGpuTest();
    this.renderer?.dispose();
    this.ramBuffer = null;
    this.stopMicTest();
  }
```

Reemplazar por:
```ts
  ngOnDestroy(): void {
    this.stopGpuTest();
    this.renderer?.dispose();
    this.ramBuffer = null;
    this.stopMicTest();
    this.stopCameraTest();
  }
```

- [ ] **Step 7: Detener la camara al salir del tab y cargar dispositivos al entrar**

Buscar (tal como quedó tras Task 3):
```ts
  selectTab(tab: ToolTab): void {
    if (this.activeTab === 'microfono' && tab !== 'microfono') {
      this.stopMicTest();
    }
    this.activeTab = tab;
    this.reportCopied = false;
    if (tab === 'gpu') {
      window.setTimeout(() => this.resizeGpu(), 0);
    }
    if (tab === 'microfono') {
      this.loadMicDevices();
    }
  }
```

Reemplazar por:
```ts
  selectTab(tab: ToolTab): void {
    if (this.activeTab === 'microfono' && tab !== 'microfono') {
      this.stopMicTest();
    }
    if (this.activeTab === 'camara' && tab !== 'camara') {
      this.stopCameraTest();
    }
    this.activeTab = tab;
    this.reportCopied = false;
    if (tab === 'gpu') {
      window.setTimeout(() => this.resizeGpu(), 0);
    }
    if (tab === 'microfono') {
      this.loadMicDevices();
    }
    if (tab === 'camara') {
      this.loadCamDevices();
    }
  }
```

- [ ] **Step 8: Agregar los métodos de camara**

Buscar el final del método `onMicDeviceChange()` agregado en Task 3:
```ts
  onMicDeviceChange(deviceId: string): void {
    this.selectedMicId = deviceId;
    if (this.micStats.status === 'running') {
      this.startMicTest();
    }
  }
```

Agregar inmediatamente después (antes de `private animateMic(): void {`):
```ts

  loadCamDevices(): void {
    if (!navigator.mediaDevices?.enumerateDevices) {
      return;
    }
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      this.camDevices = devices.filter((device) => device.kind === 'videoinput');
      if (!this.selectedCamId && this.camDevices.length) {
        this.selectedCamId = this.camDevices[0].deviceId;
      }
    });
  }

  camDeviceLabel(device: MediaDeviceInfo, index: number): string {
    return device.label || `Camara ${index + 1}`;
  }

  startCameraTest(): void {
    if (!navigator.mediaDevices?.getUserMedia) {
      this.camStats = {
        status: 'error',
        message: 'Este navegador o esta conexion no permite acceder a la camara (revisa que estes en HTTPS o localhost).',
      };
      return;
    }

    this.stopCameraTest();
    this.camStats = { status: 'running', message: 'Iniciando camara...' };

    const constraints: MediaStreamConstraints = {
      video: this.selectedCamId ? { deviceId: { exact: this.selectedCamId } } : true,
    };

    navigator.mediaDevices.getUserMedia(constraints).then(
      (stream) => {
        this.camStream = stream;
        if (this.cameraVideo) {
          this.cameraVideo.nativeElement.srcObject = stream;
        }
        this.loadCamDevices();
        const device = this.camDevices.find((d) => d.deviceId === this.selectedCamId);
        const label = device ? this.camDeviceLabel(device, this.camDevices.indexOf(device)) : 'Camara';
        this.camStats = { status: 'running', message: 'Vista previa activa.' };
        this.addReport('Camara', `Vista previa activa - dispositivo: ${label}`);
      },
      (err) => {
        const notFound = err?.name === 'NotFoundError';
        this.camStats = {
          status: 'error',
          message: notFound ? 'No se detecto ninguna camara.' : 'Permiso de camara denegado o no disponible.',
        };
      },
    );
  }

  stopCameraTest(): void {
    this.camStream?.getTracks().forEach((track) => track.stop());
    this.camStream = null;
    if (this.cameraVideo) {
      this.cameraVideo.nativeElement.srcObject = null;
    }
    if (this.camStats.status === 'running') {
      this.camStats = { status: 'idle', message: 'Prueba detenida.' };
    }
  }

  onCameraDeviceChange(deviceId: string): void {
    this.selectedCamId = deviceId;
    if (this.camStats.status === 'running') {
      this.startCameraTest();
    }
  }
```

- [ ] **Step 9: Agregar el panel de Camara al template**

En `herramientas.component.html`, agregar esta sección inmediatamente después del `</section>` que cierra el panel `microfono` (agregado en Task 3), antes del `</div>` final que cierra `.tools-page`:

```html

  <section class="tool-panel" [class.active]="activeTab === 'camara'">
    <div class="panel-heading">
      <div>
        <h3>Prueba de camara</h3>
        <p>Vista previa en vivo para confirmar que la camara funciona y la imagen se ve bien.</p>
      </div>
      <span class="status-pill" [class.ok]="camStats.status === 'running'" [class.bad]="camStats.status === 'error'">
        {{ camStats.status === 'running' ? 'Activa' : (camStats.status === 'error' ? 'Error' : 'Lista') }}
      </span>
    </div>

    <div class="ping-box" *ngIf="camDevices.length > 1">
      <label>
        Camara
        <select [ngModel]="selectedCamId" (ngModelChange)="onCameraDeviceChange($event)">
          <option *ngFor="let device of camDevices; let i = index" [value]="device.deviceId">
            {{ camDeviceLabel(device, i) }}
          </option>
        </select>
      </label>
    </div>

    <div class="button-row">
      <button type="button" class="ghost-btn" (click)="stopCameraTest()" [disabled]="camStats.status !== 'running'">Detener</button>
      <button type="button" class="primary-btn" (click)="startCameraTest()" [disabled]="camStats.status === 'running'">
        {{ camStats.status === 'running' ? 'Activa' : 'Iniciar prueba' }}
      </button>
    </div>

    <p class="error-text" *ngIf="camStats.status === 'error'">{{ camStats.message }}</p>

    <video #cameraVideo class="camera-preview" autoplay playsinline muted></video>
  </section>
</div>
```

No agregar nada después de este `</div>` — es el mismo cierre de `.tools-page` referenciado en Task 3; este Step solo inserta la nueva `<section>` justo antes de él (después de la sección `microfono`).

- [ ] **Step 10: Agregar el estilo `.camera-preview`**

En `herramientas.component.scss`, buscar la regla `.gpu-canvas`:

```scss
.gpu-canvas {
  display: block;
  width: 100%;
  height: 420px;
  min-height: 320px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: #f8fafc;
}
```

Agregar inmediatamente después:

```scss

.camera-preview {
  display: block;
  width: 100%;
  height: 360px;
  min-height: 240px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: #111827;
  object-fit: contain;
}
```

- [ ] **Step 11: Verificar que compila limpio**

Run: `cd soportedesk-frontend && npx ng build --configuration development`
Expected: `Application bundle generation complete`, sin errores ni warnings nuevos.

- [ ] **Step 12: Verificación manual en navegador**

Run: `cd soportedesk-frontend && ng serve`, abrir `http://localhost:4200/herramientas` (debe ser `localhost`). Entrar al tab "Camara", presionar "Iniciar prueba", aceptar el permiso, confirmar que el video en vivo se ve. Si hay mas de una camara conectada, probar el selector y confirmar que cambia la vista previa. Cambiar a otro tab y confirmar (con el indicador de camara del navegador) que la camara se apaga. Confirmar tambien que cambiar entre los tabs "Microfono" y "Camara" no deja ambos streams activos a la vez.

- [ ] **Step 13: Commit**

```bash
git add soportedesk-frontend/src/app/features/herramientas/
git commit -m "feat: add camera preview test to Herramientas"
```
  </section>
