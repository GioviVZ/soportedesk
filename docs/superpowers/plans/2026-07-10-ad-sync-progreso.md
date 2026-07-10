# Sincronización AD con progreso real y auto-sync tras cambios — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar el botón de sincronización síncrono y sin progreso (hoy en la cara Dashboard) por un botón en Administración con barra de progreso real (procesados/total), y disparar automáticamente una sincronización 30s después del último cambio de un administrador.

**Architecture:** El backend ejecuta la sincronización en un hilo de fondo (`AdSyncCoordinator`) orquestado sobre `ActiveDirectoryService.sincronizarCache()` (sin tocar su lógica de negocio, solo agregándole reporte de progreso), con el estado compartido en `AdSyncJobStatus` (bean en memoria, thread-safe). El frontend dispara el sync y hace polling a un endpoint de estado cada 1.5s. Los cambios de un admin (vía `withUserWrite`/`crearUsuario`) publican un evento de Spring que `AdSyncCoordinator` escucha para reprogramar (debounce) un sync automático a los 30s.

**Tech Stack:** Spring Boot 3 / Java 17 (backend), Angular 17 standalone components + RxJS 7.8 (frontend). Sin dependencias nuevas — todo con `java.util.concurrent` y `org.springframework.context.event`.

## Global Constraints

- Debounce del auto-sync: 30 segundos desde el **último** cambio (no desde cada cambio individual).
- Polling del frontend al estado del sync: cada ~1.5 segundos.
- Ambos endpoints nuevos (`POST /sync/iniciar`, `GET /sync/estado`) requieren `hasRole('ADMIN') || hasAuthority('WRITE_usuarios-red')`.
- Un solo sync a la vez — `AdSyncJobStatus.marcarInicio()` es el único punto de exclusión, atómico.
- No hay endpoint HTTP para el auto-sync — se dispara internamente vía evento de Spring (`AdCambioEvent`), nunca por una llamada externa.
- El estado del job vive solo en memoria — no se persiste ante un reinicio del backend (fuera de alcance, ver spec §7).
- El botón/lógica de sync se elimina por completo de la cara Dashboard.

---

## File Structure

**Backend** (`soportedesk-backend/src/main/java/com/inia/soportedesk/activedirectory/`):
- Crear: `AdCambioEvent.java` — evento de dominio (record).
- Crear: `AdSyncJobStatus.java` — estado del job en memoria, thread-safe.
- Crear: `AdSyncCoordinator.java` — orquesta el hilo de fondo y el debounce.
- Crear: `dto/AdSyncStatus.java` — DTO de respuesta del estado del sync.
- Modificar: `ActiveDirectoryService.java` — progreso en `sincronizarCache()`/`collectCacheUsersFromAd()`, publica `AdCambioEvent` en `withUserWrite()` y `crearUsuario()`.
- Modificar: `ActiveDirectoryController.java` — quita `POST /sync`, agrega `POST /sync/iniciar` y `GET /sync/estado`.

**Backend tests** (`soportedesk-backend/src/test/java/com/inia/soportedesk/activedirectory/`):
- Crear: `AdSyncJobStatusTest.java`
- Crear: `AdSyncCoordinatorTest.java`

**Frontend** (`soportedesk-frontend/src/app/features/usuarios-red/`):
- Modificar: `active-directory.model.ts` — agrega `AdSyncStatus`.
- Modificar: `active-directory.service.ts` — reemplaza `syncCache()` por `startSync()`/`getSyncStatus()`.
- Modificar: `usuarios-red-administracion.component.ts` — toolbar de sync + polling + auto-refresh de KPIs.
- Modificar: `usuarios-red-dashboard.component.ts` — quita el botón/lógica de sync.
- Crear: `usuarios-red-administracion.component.spec.ts` — tests del polling/debounce/resume.

**Frontend estilos** (`soportedesk-frontend/src/`):
- Modificar: `styles.scss` — agrega el estado "indeterminado" de `.module-dash-track`.

---

### Task 1: `AdCambioEvent`, `AdSyncStatus` DTO y `AdSyncJobStatus`

**Files:**
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/activedirectory/AdCambioEvent.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/activedirectory/dto/AdSyncStatus.java`
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/activedirectory/AdSyncJobStatus.java`
- Test: `soportedesk-backend/src/test/java/com/inia/soportedesk/activedirectory/AdSyncJobStatusTest.java`

**Interfaces:**
- Produces: `AdCambioEvent(String samAccountName, String accion)` — publicado por `ActiveDirectoryService` (Task 3), consumido por `AdSyncCoordinator` (Task 2).
- Produces: `AdSyncStatus(boolean running, int procesados, int total, LocalDateTime iniciadoEn, LocalDateTime finalizadoEn, AdSyncResponse ultimoResultado, String error)` — devuelto por `AdSyncCoordinator.iniciar()`/`estado()` (Task 2) y por los endpoints del controller (Task 4).
- Produces: `AdSyncJobStatus` con métodos públicos `marcarInicio(): boolean`, `setTotal(int)`, `incrementarProcesados(int)`, `completarConExito(AdSyncResponse)`, `completarConError(String)`, `snapshot(): AdSyncStatus` — usado por `ActiveDirectoryService` (Task 3) y `AdSyncCoordinator` (Task 2).

- [ ] **Step 1: Escribir el test que falla**

Crear `soportedesk-backend/src/test/java/com/inia/soportedesk/activedirectory/AdSyncJobStatusTest.java`:

```java
package com.inia.soportedesk.activedirectory;

import com.inia.soportedesk.activedirectory.dto.AdSyncResponse;
import com.inia.soportedesk.activedirectory.dto.AdSyncStatus;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class AdSyncJobStatusTest {

    @Test
    void marcarInicioDevuelveTrueLaPrimeraVezYFalseSiYaEstaCorriendo() {
        AdSyncJobStatus jobStatus = new AdSyncJobStatus();

        boolean primero = jobStatus.marcarInicio();
        boolean segundo = jobStatus.marcarInicio();

        assertThat(primero).isTrue();
        assertThat(segundo).isFalse();
        assertThat(jobStatus.snapshot().running()).isTrue();
    }

    @Test
    void incrementarProcesadosAcumulaSobreElTotalConfigurado() {
        AdSyncJobStatus jobStatus = new AdSyncJobStatus();
        jobStatus.marcarInicio();
        jobStatus.setTotal(500);

        jobStatus.incrementarProcesados(200);
        jobStatus.incrementarProcesados(150);

        AdSyncStatus snapshot = jobStatus.snapshot();
        assertThat(snapshot.total()).isEqualTo(500);
        assertThat(snapshot.procesados()).isEqualTo(350);
    }

    @Test
    void completarConExitoMarcaRunningFalseYGuardaElResultado() {
        AdSyncJobStatus jobStatus = new AdSyncJobStatus();
        jobStatus.marcarInicio();
        AdSyncResponse resultado = new AdSyncResponse(500, 3, LocalDateTime.now());

        jobStatus.completarConExito(resultado);

        AdSyncStatus snapshot = jobStatus.snapshot();
        assertThat(snapshot.running()).isFalse();
        assertThat(snapshot.ultimoResultado()).isEqualTo(resultado);
        assertThat(snapshot.finalizadoEn()).isNotNull();
        assertThat(snapshot.error()).isNull();
    }

    @Test
    void completarConErrorMarcaRunningFalseYGuardaElMensaje() {
        AdSyncJobStatus jobStatus = new AdSyncJobStatus();
        jobStatus.marcarInicio();

        jobStatus.completarConError("simple bind failed");

        AdSyncStatus snapshot = jobStatus.snapshot();
        assertThat(snapshot.running()).isFalse();
        assertThat(snapshot.error()).isEqualTo("simple bind failed");
        assertThat(snapshot.ultimoResultado()).isNull();
    }

    @Test
    void marcarInicioReiniciaProcesadosYTotalDeUnaCorridaAnterior() {
        AdSyncJobStatus jobStatus = new AdSyncJobStatus();
        jobStatus.marcarInicio();
        jobStatus.setTotal(100);
        jobStatus.incrementarProcesados(100);
        jobStatus.completarConExito(new AdSyncResponse(100, 1, LocalDateTime.now()));

        jobStatus.marcarInicio();

        AdSyncStatus snapshot = jobStatus.snapshot();
        assertThat(snapshot.procesados()).isZero();
        assertThat(snapshot.total()).isZero();
        assertThat(snapshot.finalizadoEn()).isNull();
    }
}
```

- [ ] **Step 2: Confirmar que el test falla (las clases todavía no existen)**

Run: `cd soportedesk-backend && mvn -o test-compile -Dtest=AdSyncJobStatusTest`
Expected: FAIL — `cannot find symbol: class AdSyncJobStatus` (y `AdSyncStatus`, `AdCambioEvent` si algo los referencia transitivamente).

- [ ] **Step 3: Crear `AdCambioEvent.java`**

```java
package com.inia.soportedesk.activedirectory;

public record AdCambioEvent(String samAccountName, String accion) {
}
```

- [ ] **Step 4: Crear `dto/AdSyncStatus.java`**

```java
package com.inia.soportedesk.activedirectory.dto;

import java.time.LocalDateTime;

public record AdSyncStatus(
        boolean running,
        int procesados,
        int total,
        LocalDateTime iniciadoEn,
        LocalDateTime finalizadoEn,
        AdSyncResponse ultimoResultado,
        String error
) {
}
```

- [ ] **Step 5: Crear `AdSyncJobStatus.java`**

```java
package com.inia.soportedesk.activedirectory;

import com.inia.soportedesk.activedirectory.dto.AdSyncResponse;
import com.inia.soportedesk.activedirectory.dto.AdSyncStatus;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Estado en memoria del job de sincronizacion de AD. Un solo servidor, un solo job a la vez.
 * marcarInicio() es el unico punto de exclusion real (synchronized, check-and-set atomico).
 */
@Component
public class AdSyncJobStatus {
    private final AtomicBoolean running = new AtomicBoolean(false);
    private final AtomicInteger procesados = new AtomicInteger(0);
    private final AtomicInteger total = new AtomicInteger(0);
    private volatile LocalDateTime iniciadoEn;
    private volatile LocalDateTime finalizadoEn;
    private volatile AdSyncResponse ultimoResultado;
    private volatile String error;

    public synchronized boolean marcarInicio() {
        if (running.get()) {
            return false;
        }
        running.set(true);
        procesados.set(0);
        total.set(0);
        iniciadoEn = LocalDateTime.now();
        finalizadoEn = null;
        error = null;
        return true;
    }

    public void setTotal(int value) {
        total.set(value);
    }

    public void incrementarProcesados(int delta) {
        procesados.addAndGet(delta);
    }

    public void completarConExito(AdSyncResponse resultado) {
        ultimoResultado = resultado;
        finalizadoEn = LocalDateTime.now();
        running.set(false);
    }

    public void completarConError(String mensaje) {
        error = mensaje;
        finalizadoEn = LocalDateTime.now();
        running.set(false);
    }

    public AdSyncStatus snapshot() {
        return new AdSyncStatus(running.get(), procesados.get(), total.get(), iniciadoEn, finalizadoEn, ultimoResultado, error);
    }
}
```

- [ ] **Step 6: Confirmar que el test pasa**

Run: `cd soportedesk-backend && mvn -o test -Dtest=AdSyncJobStatusTest`
Expected: PASS — 5 tests ejecutados, 0 fallos.

- [ ] **Step 7: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/activedirectory/AdCambioEvent.java \
        soportedesk-backend/src/main/java/com/inia/soportedesk/activedirectory/dto/AdSyncStatus.java \
        soportedesk-backend/src/main/java/com/inia/soportedesk/activedirectory/AdSyncJobStatus.java \
        soportedesk-backend/src/test/java/com/inia/soportedesk/activedirectory/AdSyncJobStatusTest.java
git commit -m "feat(ad): add in-memory sync job status tracking"
```

---

### Task 2: `AdSyncCoordinator` (orquestación async + debounce)

**Files:**
- Create: `soportedesk-backend/src/main/java/com/inia/soportedesk/activedirectory/AdSyncCoordinator.java`
- Test: `soportedesk-backend/src/test/java/com/inia/soportedesk/activedirectory/AdSyncCoordinatorTest.java`

**Interfaces:**
- Consumes: `AdSyncJobStatus` (Task 1) — `marcarInicio()`, `snapshot()`. `ActiveDirectoryService.sincronizarCache(): AdSyncResponse` (ya existe, sin cambios de firma).
- Produces: `AdSyncCoordinator.iniciar(): AdSyncStatus`, `AdSyncCoordinator.estado(): AdSyncStatus`, `AdSyncCoordinator.onCambio(AdCambioEvent)` (listener) — usados por `ActiveDirectoryController` (Task 4).

- [ ] **Step 1: Escribir el test que falla**

Crear `soportedesk-backend/src/test/java/com/inia/soportedesk/activedirectory/AdSyncCoordinatorTest.java`:

```java
package com.inia.soportedesk.activedirectory;

import com.inia.soportedesk.activedirectory.dto.AdSyncResponse;
import com.inia.soportedesk.activedirectory.dto.AdSyncStatus;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AdSyncCoordinatorTest {

    @Test
    void iniciarEjecutaSincronizacionYActualizaElEstadoAlTerminar() throws InterruptedException {
        ActiveDirectoryService service = mock(ActiveDirectoryService.class);
        AdSyncResponse resultado = new AdSyncResponse(500, 3, LocalDateTime.now());
        when(service.sincronizarCache()).thenReturn(resultado);
        AdSyncJobStatus jobStatus = new AdSyncJobStatus();
        ExecutorService executor = Executors.newSingleThreadExecutor();
        ScheduledExecutorService scheduler = mock(ScheduledExecutorService.class);
        AdSyncCoordinator coordinator = new AdSyncCoordinator(service, jobStatus, executor, scheduler);

        AdSyncStatus started = coordinator.iniciar();
        assertThat(started.running()).isTrue();

        executor.shutdown();
        boolean finished = executor.awaitTermination(2, TimeUnit.SECONDS);
        assertThat(finished).isTrue();

        AdSyncStatus done = coordinator.estado();
        assertThat(done.running()).isFalse();
        assertThat(done.ultimoResultado()).isEqualTo(resultado);
    }

    @Test
    void iniciarNoArrancaUnSegundoSyncSiYaHayUnoCorriendo() {
        ActiveDirectoryService service = mock(ActiveDirectoryService.class);
        AdSyncJobStatus jobStatus = new AdSyncJobStatus();
        ExecutorService executor = mock(ExecutorService.class);
        ScheduledExecutorService scheduler = mock(ScheduledExecutorService.class);
        AdSyncCoordinator coordinator = new AdSyncCoordinator(service, jobStatus, executor, scheduler);

        AdSyncStatus first = coordinator.iniciar();
        AdSyncStatus second = coordinator.iniciar();

        assertThat(first.running()).isTrue();
        assertThat(second.running()).isTrue();
        verify(executor, times(1)).submit(any(Runnable.class));
    }

    @Test
    @SuppressWarnings("unchecked")
    void notificarCambioCancelaYReagendaElTemporizadorAnterior() {
        ActiveDirectoryService service = mock(ActiveDirectoryService.class);
        AdSyncJobStatus jobStatus = new AdSyncJobStatus();
        ExecutorService executor = mock(ExecutorService.class);
        ScheduledExecutorService scheduler = mock(ScheduledExecutorService.class);
        ScheduledFuture<Object> firstFuture = mock(ScheduledFuture.class);
        ScheduledFuture<Object> secondFuture = mock(ScheduledFuture.class);
        doReturn(firstFuture, secondFuture)
                .when(scheduler).schedule(any(Runnable.class), eq(30L), eq(TimeUnit.SECONDS));
        AdSyncCoordinator coordinator = new AdSyncCoordinator(service, jobStatus, executor, scheduler);

        coordinator.notificarCambio();
        coordinator.notificarCambio();

        verify(firstFuture).cancel(false);
        verify(scheduler, times(2)).schedule(any(Runnable.class), eq(30L), eq(TimeUnit.SECONDS));
        verify(secondFuture, never()).cancel(anyBoolean());
    }

    @Test
    @SuppressWarnings("unchecked")
    void onCambioDelegaAlDebounce() {
        ActiveDirectoryService service = mock(ActiveDirectoryService.class);
        AdSyncJobStatus jobStatus = new AdSyncJobStatus();
        ExecutorService executor = mock(ExecutorService.class);
        ScheduledExecutorService scheduler = mock(ScheduledExecutorService.class);
        doReturn(mock(ScheduledFuture.class))
                .when(scheduler).schedule(any(Runnable.class), eq(30L), eq(TimeUnit.SECONDS));
        AdSyncCoordinator coordinator = new AdSyncCoordinator(service, jobStatus, executor, scheduler);

        coordinator.onCambio(new AdCambioEvent("jperez", "RESET_PASSWORD"));

        verify(scheduler, times(1)).schedule(any(Runnable.class), eq(30L), eq(TimeUnit.SECONDS));
    }
}
```

- [ ] **Step 2: Confirmar que el test falla**

Run: `cd soportedesk-backend && mvn -o test-compile -Dtest=AdSyncCoordinatorTest`
Expected: FAIL — `cannot find symbol: class AdSyncCoordinator`.

- [ ] **Step 3: Crear `AdSyncCoordinator.java`**

```java
package com.inia.soportedesk.activedirectory;

import com.inia.soportedesk.activedirectory.dto.AdSyncResponse;
import com.inia.soportedesk.activedirectory.dto.AdSyncStatus;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

/**
 * Orquesta la sincronizacion de AD en un hilo de fondo (iniciar/estado) y reprograma
 * (debounce) un sync automatico 30s despues del ultimo AdCambioEvent recibido.
 */
@Service
public class AdSyncCoordinator {
    private static final Logger log = LoggerFactory.getLogger(AdSyncCoordinator.class);
    private static final long DEBOUNCE_SECONDS = 30;

    private final ActiveDirectoryService activeDirectoryService;
    private final AdSyncJobStatus jobStatus;
    private final ExecutorService executor;
    private final ScheduledExecutorService scheduler;
    private volatile ScheduledFuture<?> pendingAutoSync;

    public AdSyncCoordinator(ActiveDirectoryService activeDirectoryService, AdSyncJobStatus jobStatus) {
        this(activeDirectoryService, jobStatus,
                Executors.newSingleThreadExecutor(AdSyncCoordinator::newDaemonThread),
                Executors.newSingleThreadScheduledExecutor(AdSyncCoordinator::newDaemonThread));
    }

    AdSyncCoordinator(ActiveDirectoryService activeDirectoryService, AdSyncJobStatus jobStatus,
                       ExecutorService executor, ScheduledExecutorService scheduler) {
        this.activeDirectoryService = activeDirectoryService;
        this.jobStatus = jobStatus;
        this.executor = executor;
        this.scheduler = scheduler;
    }

    private static Thread newDaemonThread(Runnable runnable) {
        Thread thread = new Thread(runnable, "ad-sync-worker");
        thread.setDaemon(true);
        return thread;
    }

    public AdSyncStatus iniciar() {
        if (jobStatus.marcarInicio()) {
            executor.submit(() -> {
                try {
                    AdSyncResponse resultado = activeDirectoryService.sincronizarCache();
                    jobStatus.completarConExito(resultado);
                } catch (Exception e) {
                    log.warn("Error sincronizando cache de Active Directory", e);
                    jobStatus.completarConError(e.getMessage());
                }
            });
        }
        return jobStatus.snapshot();
    }

    public AdSyncStatus estado() {
        return jobStatus.snapshot();
    }

    @EventListener
    public void onCambio(AdCambioEvent event) {
        notificarCambio();
    }

    synchronized void notificarCambio() {
        if (pendingAutoSync != null) {
            pendingAutoSync.cancel(false);
        }
        pendingAutoSync = scheduler.schedule(() -> { iniciar(); }, DEBOUNCE_SECONDS, TimeUnit.SECONDS);
    }
```

Nota: usar `() -> { iniciar(); }` (lambda de bloque) en vez de `this::iniciar`. Como `iniciar()`
devuelve `AdSyncStatus`, la referencia a método `this::iniciar` es ambigua entre
`Runnable`/`Callable<AdSyncStatus>`, y Java resuelve silenciosamente al overload
`schedule(Callable, long, TimeUnit)` — descubierto porque el Step 4 (test) fallaba con
"Argument(s) are different!" aunque el mock imprimía el mismo lambda en ambos lados. Un lambda
de bloque sin `return` es inequívocamente `Runnable`, forzando el overload correcto.

```java
    @PreDestroy
    public void shutdown() {
        executor.shutdownNow();
        scheduler.shutdownNow();
    }
}
```

- [ ] **Step 4: Confirmar que el test pasa**

Run: `cd soportedesk-backend && mvn -o test -Dtest=AdSyncCoordinatorTest`
Expected: PASS — 4 tests ejecutados, 0 fallos.

- [ ] **Step 5: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/activedirectory/AdSyncCoordinator.java \
        soportedesk-backend/src/test/java/com/inia/soportedesk/activedirectory/AdSyncCoordinatorTest.java
git commit -m "feat(ad): add async sync coordinator with debounced auto-sync"
```

---

### Task 3: Progreso y evento de cambio en `ActiveDirectoryService`

**Files:**
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/activedirectory/ActiveDirectoryService.java`

**Interfaces:**
- Consumes: `AdSyncJobStatus.setTotal(int)`/`incrementarProcesados(int)` (Task 1), `ApplicationEventPublisher.publishEvent(Object)` (Spring, sin dependencia nueva), `AdCambioEvent` (Task 1).
- No cambia ninguna firma publica existente del servicio.

Nota de alcance: esta clase interactua con LDAP real (`DirContext`/`LdapContext`) y hoy no tiene ningun test unitario (`ActiveDirectoryServiceTest` no existe). Mockear todo el arbol LDAP solo para probar dos llamadas a `publishEvent`/`incrementarProcesados` seria una inversion desproporcionada para este cambio puntual — la cobertura de `AdSyncJobStatus`/`AdSyncCoordinator` (Tasks 1-2) ya prueba la logica de conteo/estado de forma aislada. La verificacion de que el progreso avanza durante un sync real y de que un cambio dispara el auto-sync a los 30s se hace manualmente (Task 6, verificacion final).

- [ ] **Step 1: Agregar las dependencias inyectadas**

En `soportedesk-backend/src/main/java/com/inia/soportedesk/activedirectory/ActiveDirectoryService.java`, agregar el import y el campo:

```java
import org.springframework.context.ApplicationEventPublisher;
```

(agregar junto a los demás imports de `org.springframework.*`, orden alfabético — va antes de `org.springframework.data.domain.PageRequest;`, ya que "context" ordena antes que "data")

Y agregar los dos campos nuevos después de `metadataRepository`:

```java
    private final LdapContextFactory contextFactory;
    private final MovimientoAuditoriaService auditoriaService;
    private final HttpServletRequest request;
    private final AdUsuarioCacheRepository cacheRepository;
    private final AdCacheMetadataRepository metadataRepository;
    private final AdSyncJobStatus jobStatus;
    private final ApplicationEventPublisher eventPublisher;
```

- [ ] **Step 2: Reportar el total estimado en `sincronizarCache()`**

Reemplazar el método completo:

```java
    @Transactional
    public AdSyncResponse sincronizarCache() {
        LocalDateTime syncedAt = LocalDateTime.now();
        int estimatedTotal = countPaged("(&(objectCategory=person)(objectClass=user)(sAMAccountName=*))");
        jobStatus.setTotal(estimatedTotal);
        List<AdUsuarioCache> users = collectCacheUsersFromAd(syncedAt);
        int dcs = countPaged("(&(objectCategory=computer)(userAccountControl:" + LDAP_MATCHING_RULE_BIT_AND + ":=8192))");
        cacheRepository.saveAll(users);
        metadataRepository.save(new AdCacheMetadata("controladores_dominio", String.valueOf(dcs), syncedAt));
        metadataRepository.save(new AdCacheMetadata("ultima_sincronizacion", syncedAt.toString(), syncedAt));
        return new AdSyncResponse(users.size(), dcs, syncedAt);
    }
```

- [ ] **Step 3: Reportar el avance por página en `collectCacheUsersFromAd`**

Reemplazar el método completo:

```java
    private List<AdUsuarioCache> collectCacheUsersFromAd(LocalDateTime syncedAt) {
        List<AdUsuarioCache> users = new ArrayList<>();
        LdapContext context = null;
        try {
            context = contextFactory.openLdapContext();
            byte[] cookie = null;
            SearchControls controls = controls(USER_ATTRIBUTES, 0);
            do {
                context.setRequestControls(new Control[]{new PagedResultsControl(500, cookie, Control.CRITICAL)});
                NamingEnumeration<SearchResult> results = context.search(
                        contextFactory.baseDn(),
                        "(&(objectCategory=person)(objectClass=user)(sAMAccountName=*))",
                        controls
                );
                int pageCount = 0;
                try {
                    while (results.hasMore()) {
                        users.add(toCache(results.next(), syncedAt));
                        pageCount++;
                    }
                } catch (PartialResultException ignored) {
                    jobStatus.incrementarProcesados(pageCount);
                    break;
                }
                jobStatus.incrementarProcesados(pageCount);
                cookie = null;
                Control[] responseControls = context.getResponseControls();
                if (responseControls != null) {
                    for (Control control : responseControls) {
                        if (control instanceof PagedResultsResponseControl paged) {
                            cookie = paged.getCookie();
                        }
                    }
                }
            } while (cookie != null && cookie.length > 0);
        } catch (Exception e) {
            log.warn("Error sincronizando cache de Active Directory", e);
        } finally {
            closeQuietly(context);
        }
        return users;
    }
```

- [ ] **Step 4: Publicar el evento de cambio tras una escritura exitosa**

En `withUserWrite`, agregar la línea `eventPublisher.publishEvent(...)` justo después del `audit(...)` de éxito:

```java
    private ActiveDirectoryResponse<AdUser> withUserWrite(String samAccountName, String action, String successMessage,
                                                         UserWriteOperation operation) {
        String userDn = null;
        DirContext context = null;
        try {
            context = contextFactory.openDirContext();
            SearchResult result = findUser(context, samAccountName, USER_ATTRIBUTES);
            if (result == null) {
                audit(action, samAccountName, null, 404, "Usuario no encontrado.");
                return ActiveDirectoryResponse.error("Usuario no encontrado.");
            }
            userDn = result.getNameInNamespace();
            operation.apply(context, userDn, result);
            audit(action, samAccountName, userDn, 200, successMessage);
            eventPublisher.publishEvent(new AdCambioEvent(samAccountName, action));
            AdUser refreshed = refreshCachedUserFromAd(samAccountName);
            return ActiveDirectoryResponse.ok(successMessage, refreshed);
        } catch (IllegalArgumentException | IllegalStateException e) {
            audit(action, samAccountName, userDn, 400, e.getMessage());
            return ActiveDirectoryResponse.error(e.getMessage());
        } catch (Exception e) {
            log.warn("Error ejecutando accion {} en Active Directory para samAccountName={}", action, samAccountName, e);
            audit(action, samAccountName, userDn, 500, e.getMessage());
            return ActiveDirectoryResponse.error("Error ejecutando accion en Active Directory: " + e.getMessage());
        } finally {
            closeQuietly(context);
        }
    }
```

- [ ] **Step 5: Publicar el evento de cambio tras crear un usuario**

En `crearUsuario`, agregar la línea después del `audit("CREAR_USUARIO", sam, userDn, 201, ...)`:

```java
            audit("CREAR_USUARIO", sam, userDn, 201, "Usuario creado correctamente.");
            eventPublisher.publishEvent(new AdCambioEvent(sam, "CREAR_USUARIO"));
            AdUser refreshed = refreshCachedUserFromAd(sam, userDn);
            return ActiveDirectoryResponse.ok("Usuario creado correctamente.", refreshed);
```

- [ ] **Step 6: Compilar**

Run: `cd soportedesk-backend && mvn -o compile`
Expected: BUILD SUCCESS (los dos campos nuevos se inyectan por constructor gracias a `@RequiredArgsConstructor`; no hace falta tocar ningún otro constructor manual).

- [ ] **Step 7: Correr toda la suite de tests del backend para descartar regresiones**

Run: `cd soportedesk-backend && mvn -o test`
Expected: BUILD SUCCESS, todos los tests existentes siguen pasando (incluyendo los de Tasks 1-2).

- [ ] **Step 8: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/activedirectory/ActiveDirectoryService.java
git commit -m "feat(ad): report sync progress and publish change events from write operations"
```

---

### Task 4: Endpoints en `ActiveDirectoryController`

**Files:**
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/activedirectory/ActiveDirectoryController.java`

**Interfaces:**
- Consumes: `AdSyncCoordinator.iniciar(): AdSyncStatus`, `AdSyncCoordinator.estado(): AdSyncStatus` (Task 2).
- Produces: `POST /api/active-directory/sync/iniciar`, `GET /api/active-directory/sync/estado` — consumidos por el frontend (Task 5).

Nota: no hay test JUnit dedicado para este controller hoy (ningún `@WebMvcTest` existe para `ActiveDirectoryController`), así que este cambio se verifica junto con el resto del backend en el Step de compilación y con la verificación manual final (Task 6).

- [ ] **Step 1: Quitar el import y el endpoint `POST /sync` viejo**

En `soportedesk-backend/src/main/java/com/inia/soportedesk/activedirectory/ActiveDirectoryController.java`, quitar el import:

```java
import com.inia.soportedesk.activedirectory.dto.AdSyncResponse;
```

Y quitar el método:

```java
    @PostMapping("/sync")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_usuarios-red')")
    public AdSyncResponse sincronizarCache() {
        return service.sincronizarCache();
    }
```

- [ ] **Step 2: Agregar el import de `AdSyncStatus` y el campo `syncCoordinator`**

Agregar el import (orden alfabético, junto a los demás `com.inia.soportedesk.activedirectory.dto.*`):

```java
import com.inia.soportedesk.activedirectory.dto.AdSyncStatus;
```

Agregar el campo junto a `service`:

```java
@RestController
@RequestMapping("/api/active-directory")
@RequiredArgsConstructor
public class ActiveDirectoryController {
    private final ActiveDirectoryService service;
    private final AdSyncCoordinator syncCoordinator;
```

- [ ] **Step 3: Agregar los dos endpoints nuevos**

Agregar donde estaba el `POST /sync` (mismo lugar, entre `/dashboard/completo` y `/usuarios` de crear):

```java
    @PostMapping("/sync/iniciar")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_usuarios-red')")
    public AdSyncStatus iniciarSincronizacion() {
        return syncCoordinator.iniciar();
    }

    @GetMapping("/sync/estado")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_usuarios-red')")
    public AdSyncStatus estadoSincronizacion() {
        return syncCoordinator.estado();
    }
```

- [ ] **Step 4: Compilar**

Run: `cd soportedesk-backend && mvn -o compile`
Expected: BUILD SUCCESS.

- [ ] **Step 5: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/activedirectory/ActiveDirectoryController.java
git commit -m "feat(ad): replace blocking sync endpoint with start/status pair"
```

---

### Task 5: Frontend — modelo y servicio

**Files:**
- Modify: `soportedesk-frontend/src/app/features/usuarios-red/active-directory.model.ts`
- Modify: `soportedesk-frontend/src/app/features/usuarios-red/active-directory.service.ts`

**Interfaces:**
- Produces: `AdSyncStatus` (interfaz TS) — usada por `usuarios-red-administracion.component.ts` (Task 7).
- Produces: `ActiveDirectoryService.startSync(): Observable<AdSyncStatus>`, `ActiveDirectoryService.getSyncStatus(): Observable<AdSyncStatus>` — usados por Task 7.

- [ ] **Step 1: Agregar `AdSyncStatus` al modelo**

En `soportedesk-frontend/src/app/features/usuarios-red/active-directory.model.ts`, agregar después de la interfaz `AdSyncResponse`:

```typescript
export interface AdSyncStatus {
  running: boolean;
  procesados: number;
  total: number;
  iniciadoEn: string | null;
  finalizadoEn: string | null;
  ultimoResultado: AdSyncResponse | null;
  error: string | null;
}
```

- [ ] **Step 2: Reemplazar `syncCache()` por `startSync()`/`getSyncStatus()`**

En `soportedesk-frontend/src/app/features/usuarios-red/active-directory.service.ts`, cambiar el import:

```typescript
import {
  ActiveDirectoryDashboard,
  ActiveDirectoryDashboardCompleto,
  ActiveDirectoryGroup,
  ActiveDirectoryOu,
  ActiveDirectoryResponse,
  AdSyncStatus,
  AdUserSearchResult,
  AdUser,
  CreateAdUserRequest,
  UpdateUserInfoRequest,
} from './active-directory.model';
```

Y reemplazar el método `syncCache()`:

```typescript
  startSync(): Observable<AdSyncStatus> {
    return this.http.post<AdSyncStatus>(`${this.apiUrl}/sync/iniciar`, {});
  }

  getSyncStatus(): Observable<AdSyncStatus> {
    return this.http.get<AdSyncStatus>(`${this.apiUrl}/sync/estado`);
  }
```

- [ ] **Step 3: Compilar el frontend**

Run: `cd soportedesk-frontend && npx ng build --configuration development 2>&1 | tail -40`
Expected: se esperan errores de compilación en `usuarios-red-dashboard.component.ts` (todavía usa `syncCache()`, se corrige en Task 8) — confirmar que el ÚNICO error reportado es ese, no otros.

- [ ] **Step 4: Commit**

```bash
git add soportedesk-frontend/src/app/features/usuarios-red/active-directory.model.ts \
        soportedesk-frontend/src/app/features/usuarios-red/active-directory.service.ts
git commit -m "feat(ad): add async sync status model and service methods"
```

---

### Task 6: Frontend — estilo de barra de progreso indeterminada

**Files:**
- Modify: `soportedesk-frontend/src/styles.scss`

**Interfaces:**
- Produces: clase CSS `.module-dash-track.indeterminate` — usada por `usuarios-red-administracion.component.ts` (Task 7).

- [ ] **Step 1: Agregar el estado indeterminado después de `.module-dash-track`**

En `soportedesk-frontend/src/styles.scss`, ubicar el bloque existente:

```scss
.module-dash-track {
  grid-column: 1 / -1;
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--color-muted);

  i {
    display: block;
    height: 100%;
    min-width: 5px;
    border-radius: inherit;
    background: var(--color-accent);
  }
}
```

Y agregar justo después (antes de `@keyframes dash-spin`):

```scss
.module-dash-track.indeterminate {
  position: relative;

  i {
    display: none;
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: repeating-linear-gradient(
      45deg,
      var(--color-accent) 0 10px,
      transparent 10px 20px
    );
    background-size: 28px 28px;
    opacity: .35;
    animation: dash-stripes 1s linear infinite;
  }
}

@keyframes dash-stripes {
  to {
    background-position: 28px 0;
  }
}
```

- [ ] **Step 2: Compilar el frontend**

Run: `cd soportedesk-frontend && npx ng build --configuration development 2>&1 | tail -20`
Expected: mismo estado que en Task 5 (el único error pendiente sigue siendo `usuarios-red-dashboard.component.ts` usando `syncCache()`).

- [ ] **Step 3: Commit**

```bash
git add soportedesk-frontend/src/styles.scss
git commit -m "feat(ad): add indeterminate progress bar state"
```

---

### Task 7: Frontend — toolbar de sincronización en Administración

**Files:**
- Modify: `soportedesk-frontend/src/app/features/usuarios-red/usuarios-red-administracion.component.ts`
- Create: `soportedesk-frontend/src/app/features/usuarios-red/usuarios-red-administracion.component.spec.ts`

**Interfaces:**
- Consumes: `ActiveDirectoryService.startSync()`, `.getSyncStatus()` (Task 5), `AdSyncStatus` (Task 5), clase `.module-dash-track.indeterminate` (Task 6).

- [ ] **Step 1: Escribir el test que falla**

Crear `soportedesk-frontend/src/app/features/usuarios-red/usuarios-red-administracion.component.spec.ts`:

```typescript
import { fakeAsync, tick, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { UsuariosRedAdministracionComponent } from './usuarios-red-administracion.component';

describe('UsuariosRedAdministracionComponent - sincronizacion AD', () => {
  let httpMock: HttpTestingController;

  function createComponent(): UsuariosRedAdministracionComponent {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { queryParamMap: of(convertToParamMap({})) },
        },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    return TestBed.runInInjectionContext(() => new UsuariosRedAdministracionComponent());
  }

  function flushInitialRequests(): void {
    httpMock.expectOne('/api/active-directory/dashboard').flush({
      usuariosHabilitados: 0,
      usuariosBloqueados: 0,
      usuariosDeshabilitados: 0,
      controladoresDominio: 0,
    });
    httpMock.expectOne('/api/active-directory/sync/estado').flush({
      running: false,
      procesados: 0,
      total: 0,
      iniciadoEn: null,
      finalizadoEn: null,
      ultimoResultado: null,
      error: null,
    });
  }

  afterEach(() => httpMock.verify());

  it('hace polling mientras corre el sync, se detiene al terminar y refresca el dashboard', fakeAsync(() => {
    const component = createComponent();
    component.ngOnInit();
    flushInitialRequests();

    component.startSync();
    httpMock.expectOne('/api/active-directory/sync/iniciar').flush({
      running: true,
      procesados: 0,
      total: 0,
      iniciadoEn: '2026-07-10T10:00:00',
      finalizadoEn: null,
      ultimoResultado: null,
      error: null,
    });

    tick(1500);
    httpMock.expectOne('/api/active-directory/sync/estado').flush({
      running: true,
      procesados: 250,
      total: 500,
      iniciadoEn: '2026-07-10T10:00:00',
      finalizadoEn: null,
      ultimoResultado: null,
      error: null,
    });
    expect(component.syncStatus?.running).toBe(true);
    expect(component.syncPercent()).toBe(50);

    tick(1500);
    httpMock.expectOne('/api/active-directory/sync/estado').flush({
      running: false,
      procesados: 500,
      total: 500,
      iniciadoEn: '2026-07-10T10:00:00',
      finalizadoEn: '2026-07-10T10:01:00',
      ultimoResultado: { usuariosSincronizados: 500, controladoresDominio: 2, sincronizadoEn: '2026-07-10T10:01:00' },
      error: null,
    });
    httpMock.expectOne('/api/active-directory/dashboard').flush({
      usuariosHabilitados: 500,
      usuariosBloqueados: 0,
      usuariosDeshabilitados: 0,
      controladoresDominio: 2,
    });

    expect(component.syncStatus?.running).toBe(false);
    expect(component.notice?.tone).toBe('success');

    tick(1500);
    httpMock.expectNone('/api/active-directory/sync/estado');

    component.ngOnDestroy();
  }));

  it('retoma el polling si al entrar a la pantalla ya hay un sync corriendo', fakeAsync(() => {
    const component = createComponent();
    component.ngOnInit();
    httpMock.expectOne('/api/active-directory/dashboard').flush({
      usuariosHabilitados: 0,
      usuariosBloqueados: 0,
      usuariosDeshabilitados: 0,
      controladoresDominio: 0,
    });
    httpMock.expectOne('/api/active-directory/sync/estado').flush({
      running: true,
      procesados: 100,
      total: 400,
      iniciadoEn: '2026-07-10T09:00:00',
      finalizadoEn: null,
      ultimoResultado: null,
      error: null,
    });

    expect(component.syncStatus?.running).toBe(true);

    tick(1500);
    httpMock.expectOne('/api/active-directory/sync/estado').flush({
      running: false,
      procesados: 400,
      total: 400,
      iniciadoEn: '2026-07-10T09:00:00',
      finalizadoEn: '2026-07-10T09:01:00',
      ultimoResultado: { usuariosSincronizados: 400, controladoresDominio: 1, sincronizadoEn: '2026-07-10T09:01:00' },
      error: null,
    });
    httpMock.expectOne('/api/active-directory/dashboard').flush({
      usuariosHabilitados: 400,
      usuariosBloqueados: 0,
      usuariosDeshabilitados: 0,
      controladoresDominio: 1,
    });

    expect(component.syncStatus?.running).toBe(false);

    component.ngOnDestroy();
  }));
});
```

- [ ] **Step 2: Confirmar que el test falla**

Run: `cd soportedesk-frontend && npx ng test --watch=false --browsers=ChromeHeadless --include='**/usuarios-red-administracion.component.spec.ts'`
Expected: FAIL — `component.syncStatus`/`startSync`/`syncPercent`/`ngOnDestroy` no existen todavía, y las llamadas HTTP a `sync/estado`/`sync/iniciar` no se disparan.

- [ ] **Step 3: Agregar los imports y el estado de sync al componente**

En `soportedesk-frontend/src/app/features/usuarios-red/usuarios-red-administracion.component.ts`, reemplazar el bloque de imports:

```typescript
import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subscription, interval } from 'rxjs';
import { switchMap, takeWhile } from 'rxjs/operators';
import { ModalComponent } from '../../shared/modal/modal.component';
import { ActiveDirectoryService } from './active-directory.service';
import {
  ActiveDirectoryDashboard,
  ActiveDirectoryGroup,
  ActiveDirectoryOu,
  ActiveDirectoryResponse,
  AdSyncStatus,
  AdUser,
  AdUserSummary,
  CreateAdUserRequest,
  UpdateUserInfoRequest,
} from './active-directory.model';
import { AdKpisComponent } from './ad-kpis.component';
import { AdUserDetailComponent } from './ad-user-detail.component';
import { AdUserSearchComponent } from './ad-user-search.component';
```

- [ ] **Step 4: Agregar la toolbar de sync al template, arriba de `<app-ad-kpis>`**

Reemplazar:

```typescript
  template: `
    <div class="usuarios-red-page">
      <app-ad-kpis [dashboard]="dashboard" />
```

por:

```typescript
  template: `
    <div class="usuarios-red-page">
      <div class="module-dash-toolbar">
        <div class="module-dash-title">
          <strong>Sincronizacion con Active Directory</strong>
          <span>{{ lastSyncLabel() }}</span>
        </div>
        <div class="module-dash-actions">
          <button type="button" class="module-dash-refresh" (click)="startSync()" [disabled]="syncStatus?.running">
            <span class="module-dash-refresh-icon" aria-hidden="true"></span>
            {{ syncStatus?.running ? 'Sincronizando' : 'Sincronizar AD' }}
          </button>
        </div>
      </div>

      <div class="module-dash-progress" *ngIf="syncStatus?.running">
        <div class="module-dash-progress-row">
          <span>{{ syncProgressLabel() }}</span>
          <strong>{{ syncPercent() }}%</strong>
          <div class="module-dash-track" [class.indeterminate]="!syncStatus!.total">
            <i [style.width.%]="syncPercent()"></i>
          </div>
        </div>
      </div>

      <app-ad-kpis [dashboard]="dashboard" />
```

- [ ] **Step 5: Agregar el estado, `OnDestroy`, y los métodos de sync a la clase**

Cambiar la declaración de la clase:

```typescript
export class UsuariosRedAdministracionComponent implements OnInit, OnDestroy {
```

Agregar el campo `syncStatus` y la suscripción privada junto a los demás campos de estado:

```typescript
  dashboard: ActiveDirectoryDashboard | null = null;
  syncStatus: AdSyncStatus | null = null;
  user: AdUser | null = null;
```

(el resto de campos existentes se mantiene igual, solo se agrega `syncStatus` después de `dashboard`)

Y agregar el campo privado `syncPollSub` junto a `createUpnEdited`:

```typescript
  createOuResults: ActiveDirectoryOu[] = [];
  private createUpnEdited = false;
  private syncPollSub?: Subscription;
```

Reemplazar `ngOnInit`:

```typescript
  ngOnInit(): void {
    this.loadDashboard();
    this.checkSyncStatus();
    this.route.queryParamMap.subscribe((params) => {
      const sam = params.get('sam');
      if (sam) this.loadUser(sam);
    });
  }

  ngOnDestroy(): void {
    this.syncPollSub?.unsubscribe();
  }
```

Agregar los métodos de sync después de `loadDashboard()`:

```typescript
  startSync(): void {
    this.adService.startSync().subscribe({
      next: (status) => {
        this.syncStatus = status;
        this.pollSyncStatus();
      },
      error: () => this.flash('error', 'No se pudo iniciar la sincronizacion.'),
    });
  }

  syncPercent(): number {
    const total = this.syncStatus?.total ?? 0;
    const procesados = this.syncStatus?.procesados ?? 0;
    return total > 0 ? Math.min(100, Math.round((procesados / total) * 100)) : 0;
  }

  syncProgressLabel(): string {
    const total = this.syncStatus?.total ?? 0;
    const procesados = this.syncStatus?.procesados ?? 0;
    return total > 0 ? `${procesados} de ${total} usuarios` : 'Calculando el total de cuentas...';
  }

  lastSyncLabel(): string {
    const fecha = this.syncStatus?.ultimoResultado?.sincronizadoEn;
    return fecha ? `Ultima sincronizacion: ${new Date(fecha).toLocaleString('es-PE')}` : 'Nunca sincronizado en esta sesion.';
  }

  private checkSyncStatus(): void {
    this.adService.getSyncStatus().subscribe({
      next: (status) => {
        this.syncStatus = status;
        if (status.running) {
          this.pollSyncStatus();
        }
      },
      error: () => {},
    });
  }

  private pollSyncStatus(): void {
    this.syncPollSub?.unsubscribe();
    this.syncPollSub = interval(1500)
      .pipe(
        switchMap(() => this.adService.getSyncStatus()),
        takeWhile((status) => status.running, true),
      )
      .subscribe({
        next: (status) => {
          this.syncStatus = status;
          if (!status.running) {
            this.loadDashboard();
            if (status.error) {
              this.flash('error', `Error sincronizando: ${status.error}`);
            } else if (status.ultimoResultado) {
              this.flash('success', `${status.ultimoResultado.usuariosSincronizados} usuarios sincronizados desde AD.`);
            }
          }
        },
        error: () => this.flash('error', 'No se pudo consultar el estado de sincronizacion.'),
      });
  }
```

- [ ] **Step 6: Confirmar que el test pasa**

Run: `cd soportedesk-frontend && npx ng test --watch=false --browsers=ChromeHeadless --include='**/usuarios-red-administracion.component.spec.ts'`
Expected: PASS — 2 tests ejecutados, 0 fallos.

- [ ] **Step 7: Compilar todo el frontend**

Run: `cd soportedesk-frontend && npx ng build --configuration development 2>&1 | tail -40`
Expected: sigue el único error esperado en `usuarios-red-dashboard.component.ts` (se corrige en el siguiente task) — sin otros errores nuevos.

- [ ] **Step 8: Commit**

```bash
git add soportedesk-frontend/src/app/features/usuarios-red/usuarios-red-administracion.component.ts \
        soportedesk-frontend/src/app/features/usuarios-red/usuarios-red-administracion.component.spec.ts
git commit -m "feat(ad): add sync toolbar with real progress to Administracion"
```

---

### Task 8: Frontend — quitar el sync de Dashboard

**Files:**
- Modify: `soportedesk-frontend/src/app/features/usuarios-red/usuarios-red-dashboard.component.ts`

**Interfaces:**
- No produce ni consume nada nuevo — solo elimina el uso de `ActiveDirectoryService.syncCache()` (ya no existe desde Task 5).

- [ ] **Step 1: Quitar el import y el campo `AuthService` (solo se usaban para el botón de sync)**

Reemplazar:

```typescript
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ChartConfiguration, ChartData } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { AuthService } from '../../core/auth/auth.service';
import { ActiveDirectoryService } from './active-directory.service';
import { ActiveDirectoryDashboardCompleto } from './active-directory.model';
```

por:

```typescript
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ChartConfiguration, ChartData } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { ActiveDirectoryService } from './active-directory.service';
import { ActiveDirectoryDashboardCompleto } from './active-directory.model';
```

- [ ] **Step 2: Quitar el botón de sync y el aviso de `syncMessage` del template**

Reemplazar:

```typescript
          <div class="module-dash-actions">
            <span class="module-dash-updated" *ngIf="updatedAt">Actualizado {{ updatedAt | date:'HH:mm' }}</span>
            <button type="button" class="module-dash-refresh" (click)="load()" [disabled]="loading">
              <span class="module-dash-refresh-icon" aria-hidden="true"></span>
              {{ loading ? 'Actualizando' : 'Actualizar' }}
            </button>
            <button type="button" class="module-dash-refresh" *ngIf="canWrite" (click)="sync()" [disabled]="syncing || loading">
              <span class="module-dash-refresh-icon" aria-hidden="true"></span>
              {{ syncing ? 'Sincronizando' : 'Sincronizar AD' }}
            </button>
          </div>
        </div>

        <div class="module-dash-notice" *ngIf="error">No se pudo cargar. Se mantiene la ultima vista disponible.</div>
        <div class="notice success" *ngIf="syncMessage">{{ syncMessage }}</div>
```

por:

```typescript
          <div class="module-dash-actions">
            <span class="module-dash-updated" *ngIf="updatedAt">Actualizado {{ updatedAt | date:'HH:mm' }}</span>
            <button type="button" class="module-dash-refresh" (click)="load()" [disabled]="loading">
              <span class="module-dash-refresh-icon" aria-hidden="true"></span>
              {{ loading ? 'Actualizando' : 'Actualizar' }}
            </button>
          </div>
        </div>

        <div class="module-dash-notice" *ngIf="error">No se pudo cargar. Se mantiene la ultima vista disponible.</div>
```

- [ ] **Step 3: Quitar `authService`, `canWrite`, `syncing`, `syncMessage` y el método `sync()` de la clase**

Reemplazar:

```typescript
export class UsuariosRedDashboardComponent implements OnInit {
  private adService = inject(ActiveDirectoryService);
  private router = inject(Router);
  private authService = inject(AuthService);

  dashboard: ActiveDirectoryDashboardCompleto | null = null;
  loading = false;
  error = false;
  updatedAt: Date | null = null;
  syncing = false;
  syncMessage = '';

  get canWrite(): boolean {
    return this.authService.canWrite('usuarios-red');
  }

  chartData: ChartData<'bar', number[], string> = {
```

por:

```typescript
export class UsuariosRedDashboardComponent implements OnInit {
  private adService = inject(ActiveDirectoryService);
  private router = inject(Router);

  dashboard: ActiveDirectoryDashboardCompleto | null = null;
  loading = false;
  error = false;
  updatedAt: Date | null = null;

  chartData: ChartData<'bar', number[], string> = {
```

Y quitar el método `sync()` completo:

```typescript
  sync(): void {
    this.syncing = true;
    this.error = false;
    this.syncMessage = '';
    this.adService.syncCache().subscribe({
      next: (response) => {
        this.syncing = false;
        this.syncMessage = `${response.usuariosSincronizados} usuarios sincronizados desde AD`;
        this.load();
      },
      error: () => {
        this.syncing = false;
        this.error = true;
      },
    });
  }

```

(queda `load()` seguido directamente de `goToAdmin()`)

- [ ] **Step 4: Compilar el frontend completo**

Run: `cd soportedesk-frontend && npx ng build --configuration development 2>&1 | tail -40`
Expected: `Application bundle generation complete.` sin errores.

- [ ] **Step 5: Commit**

```bash
git add soportedesk-frontend/src/app/features/usuarios-red/usuarios-red-dashboard.component.ts
git commit -m "feat(ad): remove sync button from Dashboard, now lives in Administracion"
```

---

### Task 9: Verificación final completa

**Files:** ninguno (solo verificación, sin cambios de código).

- [ ] **Step 1: Suite completa de tests del backend**

Run: `cd soportedesk-backend && mvn -o clean test`
Expected: BUILD SUCCESS, todos los tests pasan (incluye `AdSyncJobStatusTest`, `AdSyncCoordinatorTest`, `LdapFilterUtilsTest` y el resto de la suite existente sin regresiones).

- [ ] **Step 2: Compilación completa del backend**

Run: `cd soportedesk-backend && mvn -o clean compile`
Expected: BUILD SUCCESS.

- [ ] **Step 3: Suite completa de tests del frontend**

Run: `cd soportedesk-frontend && npx ng test --watch=false --browsers=ChromeHeadless`
Expected: todos los tests pasan, incluyendo los 2 nuevos de `usuarios-red-administracion.component.spec.ts`.

- [ ] **Step 4: Build completo del frontend**

Run: `cd soportedesk-frontend && npx ng build --configuration development 2>&1 | tail -40`
Expected: `Application bundle generation complete.` sin errores ni warnings de referencias rotas.

- [ ] **Step 5: Verificación manual contra AD real**

Con el backend y frontend corriendo (ver sesión de trabajo anterior sobre cómo levantarlos como procesos independientes — ventana oculta, sin heredar la consola):

1. Entrar a Administración, confirmar que aparece "Nunca sincronizado en esta sesion." y el botón "Sincronizar AD".
2. Click en el botón: confirmar que aparece la barra en estado indeterminado (rayas animadas) brevemente y luego pasa a mostrar un porcentaje que avanza.
3. Confirmar que al completarse, los KPIs de arriba se actualizan solos y aparece el aviso de éxito con el conteo de usuarios sincronizados.
4. Hacer una acción de escritura (ej. editar la info de un usuario). Esperar 30 segundos sin hacer nada más: confirmar que la barra de progreso arranca sola.
5. Hacer dos acciones de escritura seguidas con menos de 30s de diferencia entre ellas: confirmar que solo se dispara **un** sync automático (30s después de la segunda acción, no dos sincronizaciones).
6. Con un sync corriendo, abrir la pantalla de Administración en una segunda pestaña del navegador: confirmar que también muestra la barra de progreso en curso (sin necesidad de hacer click en nada).
7. Entrar a la cara Dashboard: confirmar que el botón de sync ya no está ahí.

- [ ] **Step 6: Commit final si hubo algún ajuste durante la verificación manual**

```bash
git add -A
git status
```

(revisar el diff antes de comitear cualquier ajuste que haya surgido en el Step 5; si no hubo cambios, no hay nada que comitear en este paso)

---

## Self-Review

**1. Cobertura del spec:**
- §2.1 `AdSyncJobStatus` → Task 1. ✓
- §2.2 `AdSyncCoordinator` → Task 2. ✓
- §2.3 Auto-sync/debounce/`AdCambioEvent` → Tasks 1 (evento), 2 (listener+debounce), 3 (publicación). ✓
- §2.4/§2.5 Progreso en `sincronizarCache`/`collectCacheUsersFromAd` → Task 3. ✓
- §2.6 DTO `AdSyncStatus` → Task 1. ✓
- §2.7 Endpoints → Task 4. ✓
- §3 UI de Administración → Task 7. ✓
- §4 Quitar de Dashboard → Task 8. ✓
- §5 Manejo de errores → cubierto en Task 7 (Step 5, manejo de `status.error` en el polling) y Task 2 (captura de excepción en el executor). ✓
- §6 Pruebas → Tasks 1, 2 (backend unit) y 7 (frontend). La prueba de integración `@WebMvcTest` mencionada en el spec se omite explícitamente (nota de alcance en Task 4) porque no existe infraestructura de test previa para este controller — se compensa con la verificación manual del Task 9.
- §7 Fuera de alcance → respetado, no se agregó nada de eso.

**2. Placeholders:** ninguno — todos los pasos tienen código completo o comandos exactos.

**3. Consistencia de tipos:** `AdSyncStatus` (Java record en Task 1, interfaz TS en Task 5) tiene los mismos 7 campos en el mismo orden en ambos lados. `AdSyncCoordinator.iniciar()`/`estado()` devuelven `AdSyncStatus` consistentemente entre Task 2 (definición) y Task 4 (uso en el controller). `startSync()`/`getSyncStatus()` (Task 5) coinciden en firma con su uso en Task 7. `AdCambioEvent(samAccountName, accion)` se construye igual en Task 3 (dos sitios) y se consume igual en Task 2.
