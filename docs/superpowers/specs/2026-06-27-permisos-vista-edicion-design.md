# Permisos por módulo: vista vs edición

## Contexto

Hoy el sistema solo distingue dos roles fijos (`ADMIN`, `SOPORTE`) y una tabla `permisos` (usuario_id + modulo) que otorga **edición** sobre un módulo vía la autoridad JWT `WRITE_<modulo>`. No existe ningún control de **vista**: los 8 módulos "de edición" (usuarios-red, correos, equipos, vpn, credenciales-vpn, impresoras, wifi, licencias) son visibles para cualquier usuario autenticado en el sidebar y sus GET de backend no tienen `@PreAuthorize`, sin importar si el usuario tiene o no el permiso asignado. Solo 3 módulos (auditoria, herramientas, inventario-equipos) están realmente ocultos sin permiso — pero usando la misma autoridad `WRITE_<modulo>` aunque no tienen concepto de edición.

Adicionalmente, dentro del módulo VPN existe un permiso fino `credenciales-vpn` que ya controla quién puede **editar** `usuarioVpn`/`credencialVpn`, pero el GET no enmascara esos campos: cualquier autenticado los puede ver hoy.

Esta spec define cómo extender el modelo de permisos existente para que el admin pueda elegir, módulo por módulo y usuario por usuario, entre: sin acceso / solo vista / vista + edición — y que esa elección se respete tanto en el frontend (menú, rutas) como en el backend (API).

## 1. Modelo de datos

Se reutiliza la tabla `permisos` (no se crean tablas de roles/perfiles nuevas — los permisos siguen siendo por usuario individual, no por plantilla de perfil).

Se agrega una columna `nivel`:

```sql
ALTER TABLE dbo.permisos
  ADD nivel NVARCHAR(10) NOT NULL CONSTRAINT DF_permisos_nivel DEFAULT 'EDIT' WITH VALUES;

ALTER TABLE dbo.permisos
  ADD CONSTRAINT CHK_permisos_nivel CHECK (nivel IN ('VIEW', 'EDIT'));
```

Semántica:
- **Sin fila en `permisos`** → sin acceso al módulo (no aparece en el menú, ruta bloqueada, API responde 403).
- **Fila con `nivel = 'VIEW'`** → puede consultar, no puede crear/editar/eliminar.
- **Fila con `nivel = 'EDIT'`** → puede consultar y editar.

Clasificación de módulos:
- **8 módulos con ambos niveles** (vista y edición posibles): `usuarios-red`, `correos`, `equipos`, `vpn`, `credenciales-vpn`, `impresoras`, `wifi`, `licencias`. `credenciales-vpn` es un permiso anidado dentro de VPN: controla únicamente los campos `usuarioVpn`/`credencialVpn`, independiente del nivel que tenga el usuario sobre `vpn` en general.
- **3 módulos solo-vista** (sin concepto de edición): `auditoria`, `herramientas`, `inventario-equipos`. Sus filas siempre tienen `nivel = 'VIEW'`.

`Permiso` (entidad JPA) agrega el campo `nivel` (enum Java `NivelPermiso { VIEW, EDIT }`).

Backend mantiene una lista blanca de módulos válidos (mismas 11 claves que hoy existen en el frontend `MODULOS`) para validar las claves recibidas al guardar permisos de un usuario.

## 2. Backend — seguridad

**JWT**: el claim `permisos` pasa de `List<String>` a una lista de pares `{modulo, nivel}`.

**JwtAuthFilter**: por cada permiso del token agrega:
- `READ_<modulo>` siempre (independientemente del nivel).
- `WRITE_<modulo>` solo si `nivel == EDIT`.

**Endpoints GET** de los 8 módulos con ambos niveles (`LicenciaController`, `ImpresoraController`, `EquipoController`, `CorreoController`, `VpnController`, `UsuarioRedController`, `WifiController`) pasan de no tener protección a:
```java
@PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_<modulo>')")
```
en `findAll` y `findById`. Los POST/PUT/DELETE no cambian (siguen exigiendo `WRITE_<modulo>`).

**MovimientoAuditoriaController**: su `@PreAuthorize` de clase pasa de `WRITE_auditoria` a `READ_auditoria` — corrige el nombre, sin cambiar el comportamiento efectivo (sigue siendo solo-vista).

**HerramientasController / InventarioEquipoController**: hoy no tienen ningún `@PreAuthorize` (cualquier autenticado puede invocarlos aunque el frontend oculte el menú) — se les agrega `@PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_<modulo>')")` a nivel de clase. Esto es una corrección de un hueco de seguridad preexistente, no solo un cambio de nombre.

**Credenciales VPN**: en `VpnService`, las respuestas de `findAll`/`findById` enmascaran (`null`) `usuarioVpn` y `credencialVpn` si el usuario autenticado no es ADMIN y no tiene `READ_credenciales-vpn`. Se obtiene la `Authentication` actual vía `SecurityContextHolder` dentro del service (no se cambia la firma pública del controller).

**Validación de entrada**: `UsuarioSistemaService.setPermisos` valida que cada clave de módulo recibida esté en la lista blanca, y que el nivel sea `VIEW` o `EDIT`; para los 3 módulos solo-vista, fuerza `nivel = VIEW` sin importar lo que se reciba.

**DTOs**: `UsuarioSistemaRequest`/`Response` cambian `permisos: List<String>` a `permisos: Map<String, String>` (modulo → nivel).

## 3. Frontend

**`auth.model.ts` / `AuthService`**:
- `permisos` pasa de `string[]` a `Record<string, 'VIEW' | 'EDIT'>`.
- `canRead(modulo): boolean` — nuevo método: `true` si es admin o si `modulo` está presente en el mapa (cualquier nivel).
- `canWrite(modulo): boolean` — se mantiene, pero ahora exige `permisos[modulo] === 'EDIT'`.

**Sidebar** (`sidebar.component.ts`): se agrega `permission: '<modulo>'` a los 8 ítems que hoy se muestran siempre (Usuarios de Red/AD, Correos, Equipos, VPN, Impresoras, Claves WiFi, Licencias). `canShow()` pasa a usar `canRead` en vez de `canWrite` para decidir visibilidad de ítems con `permission`.

**Guards de ruta**: se reemplazan los 3 guards casi idénticos existentes (`auditoriaGuard`, `herramientasGuard`, `inventarioEquiposGuard`) por una sola factory genérica `moduloGuard(modulo: string): CanActivateFn` que verifica `isAdmin() || canRead(modulo)`. Se aplica esa misma factory a las rutas de los 8 módulos que hoy no tienen guard de módulo (`licencias`, `wifi`, `equipos`, `vpn`, `correos`, `usuarios-red`, `impresoras`).

**Formulario "Usuarios del Sistema"** (`usuarios-sistema.component.ts/html`, `usuario-sistema.model.ts`):
- Para los 8 módulos con ambos niveles: el checkbox simple se reemplaza por un control de 3 opciones por módulo (Sin acceso / Solo vista / Edición), respaldado por el mapa `permisos: Record<string, 'VIEW'|'EDIT'>` en el formulario.
- Para los 3 módulos solo-vista: se mantiene el checkbox simple (Sin acceso / Vista), sin opción de edición.
- La tabla de usuarios (columna "Permisos asignados") refleja el nivel de cada módulo asignado (ej. tag distinto para vista vs edición).

## 4. Migración de datos existentes

Ejecutada manualmente contra la base de datos (SQL Server, instancia de desarrollo `172.16.26.16/ssti`), siguiendo el patrón de inserciones idempotentes ya usado para catálogos:

```sql
-- 1. Nueva columna, todo lo existente se interpreta como EDIT (comportamiento actual preservado)
ALTER TABLE dbo.permisos
  ADD nivel NVARCHAR(10) NOT NULL CONSTRAINT DF_permisos_nivel DEFAULT 'EDIT' WITH VALUES;
ALTER TABLE dbo.permisos
  ADD CONSTRAINT CHK_permisos_nivel CHECK (nivel IN ('VIEW', 'EDIT'));

-- 2. Los 3 módulos solo-vista nunca fueron "edición": corregir su nivel
UPDATE dbo.permisos
   SET nivel = 'VIEW'
 WHERE modulo IN ('auditoria', 'herramientas', 'inventario-equipos');

-- 3. Backfill: todo usuario SOPORTE que hoy ve un módulo de edición sin permiso
--    explícito (porque el GET estaba abierto) recibe VIEW para no perder acceso.
INSERT INTO dbo.permisos (usuario_id, modulo, nivel)
SELECT u.id, m.modulo, 'VIEW'
FROM dbo.usuarios u
CROSS JOIN (VALUES ('usuarios-red'),('correos'),('equipos'),('vpn'),
                    ('credenciales-vpn'),('impresoras'),('wifi'),('licencias')) AS m(modulo)
WHERE u.rol = 'SOPORTE'
  AND NOT EXISTS (
    SELECT 1 FROM dbo.permisos p
    WHERE p.usuario_id = u.id AND p.modulo = m.modulo
  );
```

`schema.sql` se actualiza para que una instalación nueva ya incluya la columna `nivel` en el `CREATE TABLE` de `permisos` (no afecta bases existentes, ya que `sql.init.mode: never`).

La ejecución de este script contra la base compartida requiere confirmación explícita del usuario antes de correrlo.

## Fuera de alcance

- No se introducen roles/perfiles reutilizables (plantillas) — los permisos siguen siendo por usuario individual.
- No se agrega auditoría de intentos de acceso denegado (403).
- No se modifica el enum `Rol` (`ADMIN`/`SOPORTE`).
