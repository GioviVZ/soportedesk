# Auditoría detallada de cambios en Active Directory

**Fecha:** 2026-08-05
**Estado:** Diseño aprobado — pendiente de plan de implementación
**Alcance:** Backend (nuevo componente `AdAuditoria` + integración en
`ActiveDirectoryService`) y frontend (pestaña "Detalle AD" dentro del módulo
Auditoría existente). No se toca `movimientos_auditoria` ni el `AuditoriaFilter`
genérico — siguen funcionando exactamente igual que hoy.

---

## 1. Objetivo

Las operaciones de escritura sobre Active Directory (crear usuario, resetear
contraseña, habilitar/deshabilitar, desbloquear, mover de OU, agregar/quitar de
grupo, actualizar información, eliminar) hoy solo dejan un registro de texto
libre en `movimientos_auditoria` (campo `detalle`, sin estructura, sin estado
anterior/nuevo, sin duración). Se necesita una bitácora estructurada y más rica
específica para AD, que muestre qué cambió exactamente, quién lo hizo, sobre
quién, y cuánto tardó — clave para investigar incidentes o auditar accesos a
cuentas de red institucionales.

## 2. Contexto — hallazgo relevante

La tabla `dbo.ad_auditoria` **ya existe en la base de datos** (con exactamente
las columnas necesarias) pero no está referenciada por ningún código actual ni
histórico en git. Sin embargo contiene 60 filas de prueba (cuentas
`prueba.ad01`/`prueba.ad03`, fechas del 2026-07-11, `aplicacion='SoporteDesk'`,
`operador_usuario='anonymousUser'`) que revelan el formato exacto que se había
diseñado para esta bitácora: `estado_anterior`/`estado_nuevo` son **etiquetas
legibles** por acción (no volcados de atributos LDAP), `resultado` es
`EXITOSO`/`FALLIDO`, `detalle_error` es un campo de doble uso (contexto extra en
éxito, mensaje de excepción en fallo), y hay `id_transaccion` (UUID),
`duracion_ms`, `end_point`, `metodo_http`.

El spec `2026-07-08-modulo-active-directory-en-vivo-design.md` documenta que en
esa fecha se decidió explícitamente **no** crear esta tabla paralela (el
prototipo original importaba un paquete `com.inia.soportedesk.audit.*` que no
existía y no compilaba). Esta decisión se revierte ahora: la tabla ya existe,
ya fue validada con datos de prueba reales, y el usuario pidió explícitamente
aprovecharla. `movimientos_auditoria` sigue siendo la fuente para la pantalla
de Auditoría general — esto es un complemento, no un reemplazo.

## 3. Columnas de `dbo.ad_auditoria` (existentes, sin migración)

```
id                  bigint IDENTITY PK
operador_usuario    nvarchar(100)  NOT NULL   -- quién ejecutó la acción
operador_nombre     nvarchar(150)              -- nombre para mostrar del operador
usuario_afectado    nvarchar(100)  NOT NULL   -- sAMAccountName afectado
usuario_afectadodn  nvarchar(500)              -- DN del usuario afectado
accion              nvarchar(80)   NOT NULL
modulo              nvarchar(50)   NOT NULL DEFAULT 'ACTIVE_DIRECTORY'
resultado           nvarchar(20)   NOT NULL   -- EXITOSO | FALLIDO
mensaje             nvarchar(500)
detalle_error       nvarchar(max)              -- contexto extra en éxito / excepción en fallo
ip_origen           nvarchar(50)
user_agent          nvarchar(500)
fecha_registro      datetime2      NOT NULL DEFAULT sysdatetime()
id_transaccion      uniqueidentifier           -- UUID por operación
fecha_inicio        datetime2
fecha_fin           datetime2
duracion_ms         int
estado_anterior     nvarchar(max)
estado_nuevo        nvarchar(max)
recurso_afectado    nvarchar(300)              -- sAMAccountName / DN
tipo_recurso        nvarchar(100)              -- 'USUARIO'
end_point           nvarchar(300)
metodo_http         nvarchar(20)
host_origen         nvarchar(200)
aplicacion          nvarchar(100)              -- 'SoporteDesk'
version_aplicacion  nvarchar(50)               -- se deja null (sin sistema de versionado hoy)
```

## 4. Backend

### 4.1 Nuevos archivos (paquete `com.inia.soportedesk.auditoria`)

- **`AdAuditoria.java`** — entidad JPA, `@Table(name = "ad_auditoria")`, mapea
  1:1 las columnas de la sección 3.
- **`AdAuditoriaRepository extends JpaRepository<AdAuditoria, Long>`** — query
  `buscar(usuarioAfectado, accion, resultado, desde, hasta, Pageable)` con el
  mismo patrón de `@Query` que `MovimientoAuditoriaRepository`.
- **`AdAuditoriaResponse`** — record de proyección para el endpoint (mismos
  campos relevantes para UI: fecha, operador, usuario afectado, acción,
  resultado, mensaje, estado anterior/nuevo, detalle_error, duración).
- **`AdAuditoriaService`** — método:
  ```java
  public void registrar(String operadorUsuario, String operadorNombre,
      String usuarioAfectado, String usuarioAfectadoDn, String accion,
      String resultado, String mensaje, String detalleError,
      String estadoAnterior, String estadoNuevo, String recursoAfectado,
      String endpoint, String metodoHttp, String ipOrigen,
      UUID idTransaccion, LocalDateTime inicio, LocalDateTime fin)
  ```
  Calcula `duracion_ms = Duration.between(inicio, fin).toMillis()`, fija
  `modulo="ACTIVE_DIRECTORY"`, `tipo_recurso="USUARIO"`,
  `aplicacion="SoporteDesk"`. **Nunca propaga excepciones**: try/catch interno
  con `log.warn(...)`, igual que `MovimientoAuditoriaService.registrar` hoy no
  debe interrumpir la operación real de AD.
  También expone `buscar(...)` (delegando al repository) para el controller.
- **`AdAuditoriaController.java`** — `GET /api/auditoria/ad`, mismo
  `@PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_auditoria')")` que
  `MovimientoAuditoriaController`, filtros por query param: `usuarioAfectado`,
  `accion`, `resultado`, `desde`, `hasta`, `limit`.

### 4.2 Integración en `ActiveDirectoryService`

Se agrega una llamada a `adAuditoriaService.registrar(...)` **junto a** cada
llamada existente a `audit(...)` (que sigue igual, sin tocar). Puntos de
integración:

- `withUserWrite(...)` — en los 3 `catch`/success paths (404, validación,
  excepción, éxito). Se captura `Instant inicio` al entrar al método y
  `Instant fin` antes de cada llamada a `audit(...)`.
- `crearUsuario(...)` — mismos 3 puntos.
- `eliminarUsuario(...)` — mismos 3 puntos.

`id_transaccion` se genera una vez por invocación (`UUID.randomUUID()`) al
inicio del método, antes del `try`.

### 4.3 Mapeo acción → estado_anterior / estado_nuevo / detalle_error (éxito)

| Acción | estado_anterior | estado_nuevo | detalle_error (éxito) |
|---|---|---|---|
| `CREAR_USUARIO` | `"No existía"` | `"Usuario creado y habilitado"` (o `"Error de creación"` si falla) | `"SAM: {sam} | Nombre: {nombre} | OU: {ou} | Cambio obligatorio: Sí/No"` |
| `DESBLOQUEAR_CUENTA` | `"Bloqueada"` | `"Desbloqueada"` | — |
| `RESET_PASSWORD` | `"Contraseña anterior no registrada por seguridad"` | `"Contraseña restablecida"` | `"Cambio obligatorio al iniciar sesión: Sí/No"` |
| `HABILITAR_CUENTA` | `"Deshabilitada"` | `"Habilitada"` | — |
| `DESHABILITAR_CUENTA` | `"Habilitada"` | `"Deshabilitada"` | — |
| `MOVER_OU` | `"{OU origen} / INIA"` | `"{OU destino} / INIA"` | `"DN anterior: {dn1} | DN nuevo: {dn2}"` |
| `AGREGAR_GRUPO` | `"No pertenece"` | `"Pertenece"` | `"Grupo: {nombre} | DN grupo: {dn}"` |
| `QUITAR_GRUPO` | `"Pertenece"` | `"No pertenece"` | `"Grupo: {nombre} | DN grupo: {dn}"` |
| `ACTUALIZAR_INFO` | `"Información anterior"` | `"Información actualizada"` | `"Campos actualizados: {campo}: {antes} → {después}, ..."` (solo campos que cambiaron) |
| `ELIMINAR_USUARIO` | `"Usuario existía"` | `"Usuario eliminado"` | `"DN eliminado: {dn}"` |

Nota de nomenclatura: se usa `ACTUALIZAR_INFO` (el nombre de acción real del
código actual y del filtro de Auditoría en frontend), no `ACTUALIZAR_INFORMACION`
(nombre usado en las filas de prueba antiguas de la tabla).

En fallo (404 / validación / excepción), `resultado="FALLIDO"`, `mensaje` es el
mismo mensaje de error que hoy va a `movimientos_auditoria`, y `detalle_error`
lleva el mensaje de excepción completo (para `CREAR_USUARIO` incluye el error
LDAP crudo si aplica, como en las filas de prueba).

## 5. Frontend

### 5.1 `AuditoriaComponent` — pestañas
Se agrega un selector de dos pestañas encima del listado actual:
- **"General"** — el listado actual, sin cambios de comportamiento.
- **"Detalle AD"** — nuevo listado que consume `GET /api/auditoria/ad`.

### 5.2 Nuevo listado "Detalle AD"
Columnas: fecha, operador (nombre), usuario afectado, acción (con las mismas
etiquetas ya definidas en `accionLabel` donde aplique + las nuevas:
`ELIMINAR_USUARIO`, `CREAR_USUARIO`), resultado (badge verde `EXITOSO` / rojo
`FALLIDO`), duración (ms → "120 ms" o "1.2 s" si ≥1000). Fila clicable abre un
panel de detalle (reutilizando `ModalComponent` como hoy) con: estado anterior
→ estado nuevo (con flecha visual), mensaje, detalle_error/contexto adicional,
endpoint, IP origen, id_transacción.

### 5.3 Nuevos archivos frontend
- `ad-auditoria.model.ts` — interfaz `AdAuditoriaResponse` + filtros.
- `ad-auditoria.service.ts` — `getMovimientos(filters)` → `GET /api/auditoria/ad`.
- Lógica de pestañas y el nuevo listado se integran directamente en
  `auditoria.component.ts`/`.html` (no se crea un componente/ruta nueva,
  sigue siendo una sola pantalla de Auditoría con dos vistas).

## 6. Manejo de errores

Igual que la auditoría genérica actual: el registro en `ad_auditoria` **nunca**
debe interrumpir ni fallar la operación real sobre AD. Si el insert falla
(timeout de BD, etc.), se captura y se loguea (`log.warn`), la respuesta al
usuario de la operación de AD no se ve afectada.

## 7. Testing

- Test unitario de `AdAuditoriaService.registrar(...)`: guarda correctamente,
  calcula `duracion_ms`, no propaga excepción si el repository falla (mock que
  lanza `RuntimeException`).
- Test de integración `AdAuditoriaControllerIT` (mismo patrón que
  `MovimientoAuditoriaControllerIT`): filtros, permisos (`READ_auditoria`
  requerido, 403 sin él).
- Verificar en `ActiveDirectoryServiceTest` (si existe, o crear casos puntuales)
  que cada operación de escritura genera exactamente una fila en
  `ad_auditoria` con el mapeo de la sección 4.3, tanto en éxito como en fallo
  simulado (ej. usuario no encontrado → 404 → `FALLIDO`).

## 8. Fuera de alcance

- No se modifica `movimientos_auditoria` ni `AuditoriaFilter` genérico.
- No se agregan permisos nuevos (se reutiliza `READ_auditoria`/`WRITE_auditoria`
  existente).
- No se limpian las 60 filas de prueba existentes en `ad_auditoria` (quedan
  como datos históricos de prueba, mezcladas con datos reales futuros; no
  afectan funcionalmente el nuevo código ya que solo se leen vía filtros).
- No se construye un mecanismo de correlación entre una fila de
  `movimientos_auditoria` y su fila equivalente en `ad_auditoria` (ambas
  bitácoras son independientes, aunque comparten `id_transaccion` disponible
  para correlación manual futura si se necesitara).
