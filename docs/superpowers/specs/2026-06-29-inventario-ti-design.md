# Inventario TI — vista de solo lectura sobre la base INVENTARIO_TI

## Contexto

El usuario pidió "la base de datos de INVENTARIO_TI para jalar data para Equipos Asignados". Investigación previa:

- `INVENTARIO_TI` es otra base de datos en el mismo servidor SQL Server que ya usa la app (`172.16.26.16:1433`), distinta de `ssti`.
- Su esquema (8 tablas): `Sedes`, `Oficinas`, `Anexos`, `Ubigeo`, `UnidadesOrganizativas`, `TipoDispositivo`, `ConectividadSedes`, `Equipos`.
- `Equipos` (`EquipoID`, `OficinaID`, `TipoID`, `Marca`, `Modelo`, `Serie`, `CodigoInventario`, `UbicacionFisica`, `IP`, `MAC`, `Estado`, `FechaAdquisicion`, `OrdenCompra`, `ExpedienteSIAF`, `Responsable`, `Observaciones`, `FechaRegistro`) está **vacía hoy (0 filas)** y su catálogo `TipoDispositivo` es de infraestructura de red (Switch, Router, Firewall, Servidor, UPS, Access Point, Teléfono IP, Cámara IP/CCTV, NAS, etc.), no de laptops/PCs de usuario.
- Por esto el alcance cambió de "tab Equipos Asignados dentro de Equipos" a un **módulo nuevo independiente** llamado "Inventario de Equipos de Cómputo" / ruta `/inventario-ti`, que se llenará de datos más adelante — hoy se construye la vista lista para cuando haya datos.
- Ya existe (sin commitear) un módulo distinto `inventario`/`inventario-equipos` (agente AD que matchea equipos descubiertos contra la tabla `equipos`). El usuario confirmó explícitamente: **son cosas separadas, no se mezclan.**

## Decisiones confirmadas

- Ruta/carpeta: `inventario-ti` (evita choque con `inventario-equipos` ya existente).
- Permiso nuevo `inventario-ti`, tipo `view` (mismo patrón que `auditoria`/`herramientas`), no reutiliza el permiso `equipos`.
- Conexión a `INVENTARIO_TI` reusa el mismo usuario `sa`/`$Lipknot86` que ya usa toda la app para `ssti` — sin crear un login SQL nuevo (servidor de TEST, mismo patrón que el resto del proyecto).
- Alcance: solo lectura. Solo se mapean las 4 tablas necesarias para la vista (`Equipos`, `Oficinas`, `Sedes`, `TipoDispositivo`); `Anexos`, `ConectividadSedes`, `Ubigeo`, `UnidadesOrganizativas` quedan fuera por ahora (YAGNI — nada en esta vista las necesita).

## Backend

### Segundo datasource

`application.yml` gana un bloque nuevo junto al `spring.datasource` existente:

```yaml
inventario-ti:
  datasource:
    url: jdbc:sqlserver://172.16.26.16:1433;databaseName=INVENTARIO_TI;encrypt=false;trustServerCertificate=true
    username: sa
    password: $Lipknot86
    driver-class-name: com.microsoft.sqlserver.jdbc.SQLServerDriver
```

Paquete nuevo `com.inia.soportedesk.inventarioti` (distinto de `com.inia.soportedesk.inventario`, que es el agente AD). Una clase `@Configuration` (`InventarioTiDataSourceConfig`) define manualmente:
- `DataSource` vía `@ConfigurationProperties(prefix = "inventario-ti.datasource")`
- `LocalContainerEntityManagerFactoryBean` apuntando solo a `com.inia.soportedesk.inventarioti` como paquete de entidades
- `PlatformTransactionManager` propio
- `@EnableJpaRepositories(basePackages = "com.inia.soportedesk.inventarioti.repository", entityManagerFactoryRef = ..., transactionManagerRef = ...)`

El datasource principal (`ssti`) **no se toca** — sigue siendo el autoconfigurado por defecto de Spring Boot (no se le agrega `@Primary` explícito en ningún lado nuevo; simplemente no se declara como bean manual, así que Spring Boot lo sigue manejando como hoy).

### Entidades de solo lectura

4 entidades JPA mapeadas 1:1 a las tablas existentes de `INVENTARIO_TI` (sin migraciones — las tablas ya existen, esto es puramente de lectura):

- `EquipoTi` → `Equipos` (todas las columnas listadas arriba)
- `OficinaTi` → `Oficinas` (`OficinaID`, `SedeID`, `NombreOficina`)
- `SedeTi` → `Sedes` (`SedeID`, `Nombre`, `UbigeoID`, `Direccion`)
- `TipoDispositivoTi` → `TipoDispositivo` (`TipoID`, `NombreTipoDispositivo`)

`EquipoTi` tiene `@ManyToOne` hacia `OficinaTi` (por `OficinaID`) y hacia `TipoDispositivoTi` (por `TipoID`); `OficinaTi` tiene `@ManyToOne` hacia `SedeTi` (por `SedeID`) — para poder mostrar Sede/Oficina/Tipo legibles en una sola consulta sin N+1 (fetch EAGER, igual patrón que `ModeloImpresora.marca`).

No se generan DTOs de request (no hay creación/edición), solo se serializan las entidades directamente en las respuestas (mismo patrón ya usado en el resto del backend).

### API

`GET /api/inventario-ti/equipos?search=texto` (search opcional, busca sobre Marca/Modelo/Serie/CodigoInventario/Responsable/Estado, case-insensitive, mismo patrón `LIKE %:search%` que el resto de los módulos) — `@PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_inventario-ti')")`.

Sin POST/PUT/DELETE — el módulo es de solo lectura, no se exponen endpoints de escritura.

## Frontend

- Carpeta nueva `soportedesk-frontend/src/app/features/inventario-ti/`, con `inventario-ti.model.ts`, `inventario-ti.service.ts`, `inventario-ti-list.component.ts/.html/.scss`.
- Ruta `/inventario-ti` lazy-loaded en `app.routes.ts`, protegida por el guard de autenticación existente (mismo patrón que el resto de rutas del shell).
- Tabla de solo lectura (reutiliza `GenericTableComponent` en modo sin `canEdit`/sin acciones de escritura — sin botones Agregar/Editar/Eliminar) con columnas: Marca, Modelo, Serie, Código Inventario, Tipo, Sede, Oficina, Ubicación física, IP, MAC, Estado, Responsable, Fecha Adquisición, Orden Compra, Expediente SIAF, Observaciones.
- Buscador client-side simple, mismo patrón que las demás listas.
- Estado vacío explícito ("Sin equipos registrados todavía en INVENTARIO_TI") dado que la tabla origen está vacía hoy.
- Sidebar (`sidebar.component.ts`): nuevo `NavItem` `{ path: '/inventario-ti', label: 'Inventario TI', permission: 'inventario-ti' }`, mismo mecanismo de gating que `auditoria`/`herramientas` (`canShow()` ya existente, sin cambios).
- `usuario-sistema.model.ts`: nueva entrada en `MODULOS`:
  ```typescript
  {
    key: 'inventario-ti',
    label: 'Inventario TI',
    kind: 'view',
    description: 'Permite revisar el inventario de equipos de la base INVENTARIO_TI.',
  }
  ```

## Testing

- Backend: `InventarioTiServiceTest` (Mockito, sin tocar BD) para el método de búsqueda/filtro. Sin `*ControllerIT` adicional más allá de los ya cubiertos por el patrón existente — opcionalmente uno mínimo siguiendo el patrón de `ModeloImpresoraDriverControllerIT` si el tiempo lo permite, pero no es bloqueante dado que el dato real para probar contra una BD real recién llega después.
- Frontend: spec del componente de lista (carga, búsqueda, estado vacío) y del service (HTTP GET con/sin `search`), mismo patrón que el resto de `*-list.component.spec.ts` existentes.
- `mvn test` y `ng test` deben seguir en verde.

## Fuera de alcance

- No se construye edición ni importación de datos hacia `INVENTARIO_TI` ni hacia `ssti.equipos` — es solo lectura, sin mezclar con la tabla `equipos` existente.
- No se mapean `Anexos`, `ConectividadSedes`, `Ubigeo`, `UnidadesOrganizativas` — se agregan si una vista futura los necesita.
- No se crea un login SQL de solo lectura nuevo — se reusa `sa` (decisión explícita del usuario).
- No se toca ni se relaciona con el módulo `inventario`/`inventario-equipos` (agente AD) ya en progreso.
