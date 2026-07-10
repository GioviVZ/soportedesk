# Módulo Usuarios de Red/AD — Sincronización con progreso real en Administración

**Fecha:** 2026-07-10
**Estado:** Diseño aprobado — pendiente de plan de implementación
**Depende de:**
- [2026-07-08-modulo-active-directory-en-vivo-design.md](2026-07-08-modulo-active-directory-en-vivo-design.md)
- [2026-07-08-modulo-active-directory-tres-caras-design.md](2026-07-08-modulo-active-directory-tres-caras-design.md)
  (ambos ya implementados; el módulo evolucionó además a una caché local `ad_usuarios_cache`
  poblada por un `POST /api/active-directory/sync` síncrono y bloqueante, fuera de estos specs
  originales pero ya en producción al momento de este diseño)

---

## 1. Objetivo

Hoy existe un botón "Sincronizar AD" en la cara Dashboard que llama a `POST /sync`, un endpoint
**síncrono** que bloquea hasta terminar todo el recorrido paginado de AD (sin indicación de
avance, solo un spinner). Se pide:

1. Mover la sincronización a la cara **Administración** (se quita de Dashboard).
2. Mostrar una **barra de progreso con porcentaje real** (procesados/total), no un spinner.
3. **Auto-sync tras cambios**: cada acción de escritura que hace un administrador (resetear
   clave, desbloquear, habilitar/deshabilitar, mover OU, agregar/quitar de grupo, editar info,
   crear usuario) debe programar una sincronización automática 30 segundos después del **último**
   cambio (debounce — cada cambio nuevo reinicia el contador), para que la caché no quede
   desactualizada esperando que alguien haga click manualmente. Implementado en el backend (no
   un timer del navegador) para que sobreviva aunque el admin cierre la pestaña.

## 2. Backend

Dentro de `com.inia.soportedesk.activedirectory` (paquete existente).

### 2.1 `AdSyncJobStatus` (nuevo, `@Component`)

Estado compartido en memoria del job de sincronización (un solo servidor, un solo job a la vez
— no requiere coordinación distribuida). Campos thread-safe (`AtomicBoolean`/`AtomicInteger`
para los contadores, `volatile` para el resto):

```java
@Component
public class AdSyncJobStatus {
    private final AtomicBoolean running = new AtomicBoolean(false);
    private final AtomicInteger procesados = new AtomicInteger(0);
    private final AtomicInteger total = new AtomicInteger(0);
    private volatile LocalDateTime iniciadoEn;
    private volatile LocalDateTime finalizadoEn;
    private volatile AdSyncResponse ultimoResultado;
    private volatile String error;

    public synchronized boolean marcarInicio() { /* false si ya running */ }
    public void setTotal(int total) { ... }
    public void incrementarProcesados(int delta) { ... }
    public void completarConExito(AdSyncResponse resultado) { ... }
    public void completarConError(String mensaje) { ... }
    public AdSyncStatus snapshot() { ... }
}
```

`marcarInicio()` es el único punto de sincronización real (`synchronized`, check-and-set
atómico) — evita que dos clics rápidos (o dos pestañas) arranquen dos sync en paralelo.

### 2.2 `AdSyncCoordinator` (nuevo, `@Service`)

Orquesta la ejecución en segundo plano. Depende de `ActiveDirectoryService` (inyectado como bean
real, no `this` — importante para que `@Transactional` de `sincronizarCache()` siga funcionando,
ya que la auto-invocación dentro de la misma clase rompe el proxy AOP de Spring) y de
`AdSyncJobStatus`. Un `ExecutorService` de un solo hilo para ejecutar el sync (creado en el
constructor, cerrado en `@PreDestroy`) más un `ScheduledExecutorService` para el debounce del
auto-sync (ver §2.3).

```java
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
```

### 2.3 Auto-sync tras cambios (debounce de 30s)

**Problema de diseño a resolver:** `ActiveDirectoryService` necesitaría notificar al
`AdSyncCoordinator` tras cada escritura exitosa, pero `AdSyncCoordinator` ya depende de
`ActiveDirectoryService` para ejecutar el sync — inyectar la dependencia en el sentido contrario
crea un ciclo que Spring no puede resolver sin recurrir a `@Lazy` (parche menos limpio). Se evita
por completo usando **eventos de Spring** (`ApplicationEventPublisher`, ya disponible sin
dependencias nuevas):

```java
public record AdCambioEvent(String samAccountName, String accion) {}
```

- `ActiveDirectoryService` recibe `ApplicationEventPublisher` inyectado (un campo más). Dentro de
  `withUserWrite(...)`, justo después del `audit(action, samAccountName, userDn, 200, ...)` en el
  camino de éxito, publica `eventPublisher.publishEvent(new AdCambioEvent(samAccountName, action))`.
  Como las 7 operaciones de escritura de usuario (desbloquear, reset password, habilitar/
  deshabilitar, mover OU, agregar/quitar grupo, editar info) ya pasan por `withUserWrite`, el
  evento queda cubierto para todas ellas en un solo punto. `crearUsuario(...)` (que no pasa por
  `withUserWrite` porque no busca un usuario existente primero) publica el mismo evento
  explícitamente tras crear con éxito.
- `AdSyncCoordinator` agrega un listener:
  ```java
  @EventListener
  public void onCambio(AdCambioEvent event) {
      notificarCambio();
  }

  private synchronized void notificarCambio() {
      if (pendingAutoSync != null) {
          pendingAutoSync.cancel(false);
      }
      pendingAutoSync = scheduler.schedule(this::iniciar, 30, TimeUnit.SECONDS);
  }
  ```
  `notificarCambio()` es `synchronized` y cancela cualquier tarea programada pendiente antes de
  agendar una nueva — esto implementa el debounce (30s desde el **último** cambio, no desde cada
  uno). Cuando el temporizador finalmente dispara, llama al mismo `iniciar()` de §2.2 — si para
  ese momento ya hay un sync manual corriendo (`jobStatus.marcarInicio()` devuelve `false`), el
  disparo automático simplemente no hace nada, sin lógica adicional necesaria para ese caso.
- Como el auto-sync usa el mismo `iniciar()`/`jobStatus` que el botón manual, la barra de
  progreso de Administración lo muestra igual sin trabajo extra — si el admin sigue en la
  pantalla cuando pasan los 30s, ve la barra arrancar sola.

### 2.4 Cambios mínimos a `ActiveDirectoryService.sincronizarCache()`

Se le inyecta `AdSyncJobStatus` (un campo más en el constructor `@RequiredArgsConstructor`).
Lógica de negocio sin cambios, solo se agrega reporte de progreso:

```java
@Transactional
public AdSyncResponse sincronizarCache() {
    LocalDateTime syncedAt = LocalDateTime.now();
    int estimatedTotal = countPaged("(&(objectCategory=person)(objectClass=user)(sAMAccountName=*))");
    jobStatus.setTotal(estimatedTotal);
    List<AdUsuarioCache> users = collectCacheUsersFromAd(syncedAt); // ver 2.5
    int dcs = countPaged("(&(objectCategory=computer)(userAccountControl:" + LDAP_MATCHING_RULE_BIT_AND + ":=8192))");
    cacheRepository.saveAll(users);
    metadataRepository.save(new AdCacheMetadata("controladores_dominio", String.valueOf(dcs), syncedAt));
    metadataRepository.save(new AdCacheMetadata("ultima_sincronizacion", syncedAt.toString(), syncedAt));
    return new AdSyncResponse(users.size(), dcs, syncedAt);
}
```

El pre-conteo (`countPaged` sobre el mismo filtro de personas) usa el mismo patrón ya existente
para los KPIs — es una consulta liviana (solo cuenta DNs, sin traer atributos), no un segundo
recorrido pesado.

### 2.5 Progreso dentro de `collectCacheUsersFromAd`

Después de procesar cada página de 500 resultados (el bucle paginado ya existente), se llama
`jobStatus.incrementarProcesados(<usuarios de esta página>)`. No cambia la forma en que se
recolectan/mapean los `AdUsuarioCache`, solo se agrega el reporte de avance al final de cada
iteración del `do/while` existente.

### 2.6 DTO `AdSyncStatus`

```java
public record AdSyncStatus(
        boolean running,
        int procesados,
        int total,
        LocalDateTime iniciadoEn,
        LocalDateTime finalizadoEn,
        AdSyncResponse ultimoResultado,
        String error
) {}
```

### 2.7 Endpoints

```
POST /api/active-directory/sync/iniciar   → AdSyncCoordinator.iniciar()
GET  /api/active-directory/sync/estado    → AdSyncCoordinator.estado()
```

Ambos `@PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_usuarios-red')")`, igual que el
resto de operaciones de escritura del módulo. No hay endpoint propio para el auto-sync — se
dispara internamente vía evento (§2.3), no por HTTP.

**Se elimina** `POST /api/active-directory/sync` (el endpoint síncrono actual) — queda
reemplazado por el par arranque/estado. Su único consumidor hoy es el botón de Dashboard, que
también se elimina (ver §4).

## 3. Cara Administración — UI

En `usuarios-red-administracion.component.ts`, arriba de la fila de KPIs existente:

- Texto "Última sincronización: `{{ fecha }}`" (o "nunca en esta sesión" si `ultimoResultado`
  es null) + botón "Sincronizar AD".
- Al hacer click: `POST /sync/iniciar`, luego arranca polling a `GET /sync/estado` cada ~1.5s
  (RxJS `interval(1500).pipe(switchMap(...), takeWhile(s => s.running, true))`) actualizando el
  ancho de una barra de progreso (`procesados/total * 100`).
- Mientras `total === 0` (instante inicial, antes de que el pre-conteo termine), la barra se
  muestra en un estado "indeterminado" (animación de franjas, sin porcentaje numérico) en vez de
  mostrar "0%" — evita el flash confuso de "0%" que en realidad no significa "casi nada
  procesado" sino "todavía no sabemos el total".
- En `ngOnInit`, además de cargar KPIs/estado normal de la pantalla, se consulta
  `GET /sync/estado` una vez; si `running === true` (alguien más disparó un sync desde otra
  pestaña/sesión), se retoma el polling automáticamente en vez de mostrar el botón como si nada
  estuviera corriendo.
- Al completarse (`running` pasa a `false`), se refresca automáticamente la fila de KPIs
  (re-fetch de `GET /dashboard`, sin recargar la página) y se muestra el aviso de éxito con
  `ultimoResultado.usuariosSincronizados`, reutilizando el mecanismo de notificación
  (`flash('success', ...)`) que el componente ya tiene.
- Barra de progreso: markup/CSS simple (`.sync-bar-track` + `.sync-bar-fill` con
  `[style.width.%]`), agregado a `usuarios-red.shared.scss` (no existe un componente de barra de
  progreso reutilizable hoy en el proyecto — se busco y no hay uno).

## 4. Cara Dashboard — qué se quita

- Botón "Sincronizar AD", el método `sync()`, y los campos `syncing`/`syncMessage` de
  `usuarios-red-dashboard.component.ts` se eliminan por completo.
- `ActiveDirectoryService.syncCache()` (Angular) se reemplaza por `startSync()` y
  `getSyncStatus()`, apuntando a los nuevos endpoints.

## 5. Manejo de errores

- Si `iniciar()` falla en arrancar (excepción antes de llegar al executor, caso raro): se
  propaga como error HTTP normal, el frontend muestra el aviso de error ya existente.
- Si el job falla **durante** la ejecución en background (excepción dentro del `Runnable`): no
  hay una petición HTTP esperando esa excepción (ya se devolvió la respuesta de `iniciar()`), así
  que se captura, se loguea `WARN` con el detalle, y se guarda en `jobStatus.error` — el
  siguiente poll de `/sync/estado` lo trae y el frontend lo muestra como aviso de error en vez de
  éxito.
- Si el navegador se cierra o la pestaña se recarga a mitad de un sync, el job sigue corriendo en
  el backend (es un hilo del servidor, no depende de la conexión HTTP) — al volver a entrar a
  Administración, el polling inicial de `GET /sync/estado` lo detecta y retoma la barra.

## 6. Pruebas

- **Backend unit**: `AdSyncJobStatus` — `marcarInicio()` devuelve `false` si ya está `running`;
  secuencia completa inicio→progreso→éxito y inicio→error deja el snapshot correcto.
- **Backend integración**: `@WebMvcTest` de los dos endpoints nuevos con `AdSyncCoordinator`
  mockeado — verifica rutas, `@PreAuthorize` (403 sin `WRITE_usuarios-red`), forma de la
  respuesta. Confirmar que `POST /sync` (el viejo) ya no existe (404).
- **Frontend**: spec de administración verificando que el polling se detiene cuando
  `running=false`, que la barra muestra estado indeterminado cuando `total=0`, y que al montar
  el componente con un sync ya `running=true` retoma el polling sin que el usuario haga click.
- **Verificación manual**: disparar un sync real contra AD, confirmar que el porcentaje avanza de
  forma consistente con el tamaño real del directorio, y que abrir la pantalla en una segunda
  pestaña mientras corre también muestra el progreso.
- **Backend unit — debounce**: dos `AdCambioEvent` publicados con menos de 30s de diferencia
  resultan en un solo `iniciar()` ejecutado (el segundo cancela y reemplaza la tarea programada
  por el primero); usar un `ScheduledExecutorService` inyectable/mockeable en el test para no
  depender de esperar 30s reales. Confirmar también que si `iniciar()` dispara mientras un sync
  manual ya está `running`, no se arranca un segundo (mismo comportamiento que `marcarInicio()`
  ya cubierto arriba).
- **Backend integración**: al llamar cualquiera de los endpoints de escritura existentes
  (`/desbloquear`, `/reset-password`, etc.) con el `AdSyncCoordinator` mockeado, verificar que se
  publica el evento (o que se invoca el listener) — no hace falta esperar los 30s reales en este
  test, solo confirmar que el evento se disparó.

## 7. Fuera de alcance

- Persistir el estado del job en base de datos: `AdSyncJobStatus` es un bean en memoria, así que
  si el backend se reinicia (a mitad de un sync o después de uno completo) su estado vuelve a
  cero — el próximo `GET /sync/estado` mostrará `running=false`, `ultimoResultado=null`, sin
  rastro de sincronizaciones previas a ese reinicio, aunque la caché (`ad_usuarios_cache`) siga
  teniendo los datos de la última sincronización exitosa. Esto es aceptable porque el peor caso
  es que la pantalla no muestre la fecha de "última sincronización" hasta que se corra una
  nueva; los datos ya sincronizados no se pierden.
- Cancelar un sync en curso desde la UI.
- Sincronizaciones programadas por horario fijo (cron), independientes de si hubo cambios — el
  único disparo automático en este alcance es el debounce de 30s tras una escritura (§2.3); si no
  hay cambios, no hay auto-sync.
- Mostrar la última sincronización persistida en `ad_cache_metadata` cuando el servidor se
  reinició y `jobStatus` está "en blanco" (no se lee esa tabla como fallback) — se puede agregar
  después si se necesita.

## 8. Decisiones registradas

| Tema | Decisión |
|---|---|
| Ubicación del botón de sync | Solo en Administración; se quita por completo de Dashboard |
| Mecanismo de progreso | Backend asíncrono (hilo en segundo plano) + polling desde el frontend cada ~1.5s |
| Concurrencia | Un solo sync a la vez; `marcarInicio()` atómico rechaza arranques duplicados |
| Cálculo del total | Pre-conteo liviano antes del recorrido completo (mismo patrón que los KPIs existentes) |
| Estado "total desconocido" | Barra indeterminada, no "0%" |
| Sync disparado desde otra sesión | Se detecta al entrar a la pantalla y se retoma el polling automáticamente |
| Al completar | Auto-refresca los KPIs de la pantalla, sin recargar la página |
| Auto-sync tras cambios | Debounce de 30s desde el último cambio de escritura (no desde cada cambio individual), implementado en backend |
| Cómo se notifica el cambio | Evento de Spring (`ApplicationEventPublisher`/`AdCambioEvent`) publicado desde `withUserWrite`, no una dependencia directa entre servicios (evita ciclo circular) |
| Acciones que disparan auto-sync | Las 6 operaciones vía `withUserWrite` + `crearUsuario` (7 en total) |
| Persistencia del progreso ante reinicio del backend | Fuera de alcance — se pierde, aceptable |
| Persistencia del progreso ante reinicio del backend | Fuera de alcance — se pierde, aceptable |
