# Sistema Gestión de Soporte Informático INIA — Arquitectura y Despliegue

Documento único y vigente con la arquitectura completa del sistema. Reemplaza la
lectura dispersa de los specs/plans históricos de `docs/superpowers/historial/`
(esos quedan como bitácora de decisiones de diseño, no como referencia técnica
actual — para eso está este documento). Última revisión a fondo: 2026-08-11.

---

## 1. Resumen

Sistema Gestión de Soporte Informático INIA es un sistema interno de gestión de activos y soporte informático:
equipos, impresoras, usuarios de red (AD), correos institucionales, licencias de
software, credenciales VPN, redes WiFi, un módulo de auditoría de movimientos y
herramientas de diagnóstico de red — todo con control de acceso por roles y
permisos por módulo.

Arquitectura: SPA Angular que consume una API REST (Spring Boot + JWT,
mayormente stateless salvo el canal de eventos en vivo) respaldada por SQL
Server como base propia, más dos integraciones de solo lectura contra sistemas
externos: **Active Directory** (LDAPS, en vivo) y **GLPI** (MySQL, inventario
de hardware). Sin colas ni microservicios — un monolito backend y un monolito
frontend — pero sí dos jobs `@Scheduled` (sincronización de equipos desde GLPI
y reconciliación de identidad) y un canal SSE para push de cambios al
frontend.

```
┌─────────────────────┐   HTTPS / JSON + SSE   ┌──────────────────────┐   JDBC   ┌───────────────┐
│  Angular 17 SPA      │ ──────────────────────▶│  Spring Boot 3 API   │─────────▶│ SQL Server    │
│  (soportedesk-       │◀────────────────────── │  (soportedesk-       │           │ (BD: ssti)    │
│   frontend)          │     JWT en cada request │   backend)           │           └───────────────┘
└─────────────────────┘                          │                      │──JDBC (RO)┌───────────────┐
                                                   │                      │──────────▶│ GestionTI_INIA│
                                                   │                      │           │ (Google WS)   │
                                                   │                      │──JDBC (RO)┌───────────────┐
                                                   │                      │──────────▶│ GLPI (MySQL)  │
                                                   │                      │           └───────────────┘
                                                   └──────────┬───────────┘
                                                              │ LDAPS
                                                              ▼
                                                     Active Directory INIA
```

---

## 2. Stack Tecnológico

| Capa | Tecnología | Notas |
|------|-----------|-------|
| Backend | Spring Boot 3.2.5 · Java 17 | empaquetado como JAR ejecutable |
| Seguridad | Spring Security + JWT (jjwt) | stateless salvo `/api/realtime/events` (SSE autenticado) |
| ORM | Spring Data JPA / Hibernate | `ddl-auto: none` — el esquema lo gestiona SQL, no Hibernate (ver §5 sobre deuda de migraciones) |
| Base de datos propia | SQL Server 2016+, base `ssti` | driver `mssql-jdbc`, datasource primario (`@Primary`, `PrimaryDataSourceConfig`) |
| Integración AD | LDAPS contra `SRV-DC02.inia.local` (Spring LDAP) | lectura y escritura en vivo (alta/baja/reset/mover OU/grupos) |
| Integración GLPI | MySQL, datasource **secundario** de solo lectura (`GlpiDataSourceConfig`) | entidades `@Immutable`; fuente de verdad del inventario de hardware |
| Integración Google Workspace | Vista `GestionTI_INIA.dbo.vw_GW_Dashboard` (misma instancia SQL Server, otra BD) | solo lectura, usada para validar correos institucionales |
| Tiempo real | SSE nativo (`SseEmitter`, sin librería extra) | `/api/realtime/events`, emisores en memoria, sin persistencia |
| Jobs programados | `@Scheduled` (`@EnableScheduling`) | sync GLPI→`equipo_asignacion` (diario 3am) y reconciliación de identidad (diario 3:30am) |
| Cifrado de credenciales | AES/GCM (`LicenciaCredentialConverter`) | aplica a claves de licencias |
| Frontend | Angular 17.3 · TypeScript 5.4 · SCSS | standalone components, sin NgModules |
| Gráficos | Chart.js (vía `ng2-charts` o uso directo) | dashboard |
| Build | Maven (backend) · Angular CLI / npm (frontend) | sin Docker/CI configurado hoy |
| Reverse proxy | nginx (config en `deploy/nginx.conf`) | TLS terminado en nginx, sirve el build estático y proxya `/api/*` (incluye SSE con `proxy_buffering off`) |

---

## 3. Estructura del Proyecto

```
SistemadeSoporteTecnicoINIA/
├── docs/
│   ├── ARQUITECTURA.md                    # este documento
│   └── superpowers/historial/             # specs y plans fechados (bitácora de diseño)
├── deploy/
│   └── nginx.conf                          # reverse proxy + TLS usado en el despliegue actual
│
├── soportedesk-backend/                    # API REST Spring Boot
│   └── src/main/java/com/inia/soportedesk/
│       ├── activedirectory/  # integración LDAPS en vivo con el AD (config/, dto/)
│       ├── auditoria/        # bitácora de movimientos + auditoría detallada de cambios en AD
│       ├── auth/             # login, JWT, /auth/me, cambio de password, usuarios del sistema
│       ├── catalogo/         # Sedes, Dependencias, Subdependencias, TipoContrato, TipoLicencia, TipoBien, TipoImpresora
│       ├── common/           # FileStorageService y utilidades compartidas
│       ├── config/           # PrimaryDataSourceConfig (datasource SQL Server explícito como @Primary)
│       ├── correos/          # Cuentas de correo institucional (reporting, solo lectura — ver §6)
│       ├── dashboard/        # Agregaciones para KPIs y gráficos de todos los módulos
│       ├── equipos/          # Computadoras y equipos de cómputo (+ enrichment/, evidencia/)
│       ├── exception/        # GlobalExceptionHandler
│       ├── gestiontiinia/    # vista de solo lectura sobre GestionTI_INIA (Google Workspace)
│       ├── glpi/             # datasource secundario MySQL, entidades @Immutable de inventario GLPI
│       ├── herramientas/     # Ping, inventario de red local (+ ordenes/ de servicio a proveedores)
│       ├── identidad/        # reconciliación AD↔persona, candidatos pendientes de revisión
│       ├── impresoras/       # Impresoras (driver, consumibles) (+ intervencion/ = bitácora de reparaciones)
│       ├── licencias/        # Licencias de software + activaciones múltiples + cifrado
│       ├── realtime/         # hub SSE para push de cambios en vivo al frontend
│       ├── security/         # JwtService, JwtAuthFilter, SecurityConfig
│       ├── usuariosred/      # Usuarios de red / caché de Active Directory (+ contrato/ = historial de contratos)
│       ├── vpn/              # Credenciales VPN, antivirus, workflow de solicitud/aprobación
│       └── wifi/             # Redes WiFi
│   └── src/main/resources/
│       ├── schema.sql                # esquema base v1.0 (idempotente) — YA NO es la única fuente de verdad, ver §5
│       ├── migration_*.sql           # 19 scripts sueltos del "Plan de Normalización" en curso, no fusionados en schema.sql
│       ├── data.sql                  # usuarios admin/soporte por defecto
│       ├── data_catalogos.sql        # catálogos iniciales (sedes, dependencias, etc.)
│       └── application.yml           # configuración (perfil `dev`; todas las credenciales vía variables de entorno)
│
└── soportedesk-frontend/                   # SPA Angular 17
    └── src/app/
        ├── core/           # AuthService, guards (authGuard/adminGuard/moduloGuard/vpnAdminGuard), interceptor JWT, CatalogoService
        ├── features/       # un folder por módulo de negocio (ver tabla de rutas más abajo), incluye candidatos-persona/
        ├── layout/         # shell, header, sidebar
        └── shared/         # GenericTable, UbicacionSelect, SectionCard, StatusBadge, VencimientoBadge, ModuleViewSwitcher, etc.
```

---

## 4. Módulos de Negocio

| Módulo | Qué gestiona | Particularidad |
|--------|--------------|-----------------|
| Equipos | Computadoras/laptops (inventario base viene de GLPI) | `equipos` es legado; el inventario real hoy se completa vía `equipos/enrichment` (corrige/completa lo que GLPI no tiene) y `equipos/evidencia` (fotos/actas adjuntas); un job diario proyecta todo hacia `dbo.equipo_asignacion`, la tabla normalizada |
| Impresoras | Impresoras de red/USB | ficha técnica con pestañas, carga/descarga de driver, consumibles por color, más `impresoras/intervencion` = bitácora de reparaciones con adjuntos |
| Correos | Cuentas de correo institucional | **solo lectura/reporting** — se nutre de la vista de Google Workspace (`gestiontiinia`), sin altas/bajas manuales desde este sistema |
| Usuarios de Red | Cuentas AD (caché local + integración en vivo) | `usuariosred` mantiene la caché (`ad_usuarios_cache`) y `usuariosred/contrato` el historial de contratos; `activedirectory` habla LDAPS en vivo para alta/baja/reset/mover OU |
| Active Directory (en vivo) | Búsqueda, alta, baja, desbloqueo, reset de password, mover OU, grupos, sincronización | valida contra `gestiontiinia` que el correo elegido exista y no esté ya vinculado a otra cuenta AD |
| Identidad | Reconciliación AD↔persona | job diario detecta cuentas AD sin `persona` asociada y las drops en `persona_candidato` para revisión manual (ADMIN); nunca crea `persona` sin confirmación humana |
| VPN | Credenciales de acceso remoto + antivirus | **workflow de dos etapas**: solicitud (permiso `solicitar-vpn`) → aprobación/rechazo/observación (permiso `aprobar-vpn`); generador de contraseñas integrado en el formulario |
| WiFi | Redes y claves WiFi | catálogo independiente, sin FKs |
| Licencias | Licencias de software | activaciones múltiples (cuenta+clave por activación) y serial multivalor; credenciales cifradas (AES/GCM) |
| Herramientas | Ping a host + inventario de red local + `herramientas/ordenes` (órdenes de servicio a proveedores) | utilidades de diagnóstico para mesa de soporte |
| Usuarios del Sistema | Cuentas de acceso al Sistema Gestión de Soporte Informático (no confundir con Usuarios de Red) | rol ADMIN/SOPORTE + permisos de escritura por módulo |
| Catálogos | Sedes, dependencias, subdependencias, tipos de contrato/licencia/bien/impresora | solo ADMIN puede mantenerlos |
| Dashboard | KPIs y gráficos agregados por módulo | contadores generales + breakdown por estado/tipo de cada módulo, próximos vencimientos, órdenes de servicio próximas |
| Auditoría | Bitácora de acciones (login, altas, bajas, ediciones) + auditoría detallada de cambios en AD | búsqueda por módulo/acción/fecha; pestaña "Detalle AD" con estado anterior/nuevo campo a campo |

---

## 5. Modelo de Datos

**Motor:** SQL Server 2016+ · **Base:** `ssti` · **Puerto:** 1433

> **Deuda técnica a tener presente:** `schema.sql` sigue siendo el esquema
> base v1.0 (idempotente, seguro de re-ejecutar) pero **ya no describe el
> esquema real**. El "Plan de Normalización" (`docs/plan-normalizacion-base-datos.docx`)
> se aplicó vía **19 scripts `migration_*.sql` sueltos** en
> `soportedesk-backend/src/main/resources/`, ejecutados manualmente y no
> fusionados en `schema.sql`. Además, algunas tablas usadas por entidades JPA
> activas (`equipos_enrichment`, `equipos_enrichment_historial`,
> `equipos_evidencias`, `impresoras_intervenciones`,
> `impresoras_intervenciones_adjuntos`) **no aparecen creadas en ningún
> script versionado** — se crearon manualmente en SSMS. Para reconstruir el
> esquema real desde cero hoy hace falta `schema.sql` + los 19
> `migration_*.sql` en orden + esas tablas manuales.

### Tablas del esquema base (`schema.sql`, ya no exhaustivo)

| Tabla | Notas |
|-------|-------|
| `sedes`, `dependencias`, `subdependencias` | jerarquía de ubicación |
| `tipos_contrato`, `tipos_licencia`, `tipos_bien`, `tipos_impresora` | catálogos |
| `marcas_impresora`, `modelos_impresora`, `modelo_impresora_toners` | catálogo de modelos/tóners de impresora |
| `usuarios`, `permisos` | usuarios del sistema y permisos por módulo (cascade delete) |
| `movimientos_auditoria` | bitácora plana; índices por fecha/usuario/modulo+accion |
| `ordenes_servicio` | órdenes de servicio a proveedores |
| `ad_usuarios_cache`, `ad_cache_metadata` | caché local de cuentas AD |
| `usuarios_red_contratos` | historial de contratos de usuarios de red (FK a `tipos_contrato`; `usuario` es texto libre) |
| `equipos`, `impresoras`, `correos`, `licencias`, `licencia_activaciones` (cascade), `vpn`, `vpn_config_institucional`, `wifi` (sin FK) | módulos de negocio "clásicos" |

### Tablas nuevas del Plan de Normalización (`migration_*.sql`)

| Tabla | Notas |
|-------|-------|
| `dbo.persona` | PK explícita **sin IDENTITY** (preserva IDs legados); FK `tipo_cuenta_id → core.TiposCuentaDirectorio` (schema legado externo); UNIQUE `sam_account_name` |
| `dbo.persona_asignacion` | FK `persona_id → persona`, `subdependencia_id → subdependencias` |
| `dbo.persona_contrato` | FK `persona_id → persona`, `tipo_contrato_id → tipos_contrato` |
| `dbo.ad_cuenta` | sucesora de `ad_usuarios_cache`, FK `persona_id → persona` — **coexiste en paralelo a propósito** durante la migración |
| `dbo.persona_candidato` | FK `persona_id → persona` (nullable hasta confirmar); alimentada por el job de reconciliación de identidad |
| `dbo.equipo_asignacion` | UNIQUE `glpi_computer_id`; FK `persona_id → persona`, `sede_id`, `dependencia_id`, `subdependencia_id` — sucesora normalizada de `equipos_enrichment`, mantenida por el job diario de sincronización GLPI |
| `dbo.ubigeo`, `dbo.tipo_unidad`, `dbo.anexo` | catálogos de fases posteriores del plan de normalización |
| `dbo.vpn_solicitud`, `dbo.vpn_solicitud_snapshot` | soportan el workflow de solicitud/aprobación de VPN |

### Tablas creadas manualmente (no versionadas)

`equipos_enrichment`, `equipos_enrichment_historial`, `equipos_evidencias`,
`impresoras_intervenciones`, `impresoras_intervenciones_adjuntos` — usadas
activamente por sus entidades JPA pero sin script de creación en el repo.
Pendiente: escribir el `migration_*.sql` correspondiente para cerrar el gap.

### Diagrama de relaciones (FK, simplificado)

```
sedes ──< dependencias ──< subdependencias
            │                    │
            └────────────────────┴─── usuarios_red / persona ──< equipos ──< vpn
                                       │                  │
                                       ├─── correos (RO)   └─── equipo_asignacion (persona_id, ubicación)
                                       │
persona ──< persona_asignacion, persona_contrato, persona_candidato, ad_cuenta
tipos_contrato ──< usuarios_red, correos, usuarios_red_contratos, persona_contrato
tipos_impresora ──< impresoras          impresoras ──< impresoras_intervenciones ──< …adjuntos
tipos_licencia / tipos_bien ──< licencias ──< licencia_activaciones  (cascade delete)
usuarios ──< permisos                  (cascade delete)
equipos ──< equipos_enrichment ──< equipos_enrichment_historial
equipos ──< equipos_evidencias
wifi, movimientos_auditoria, ad_auditoria     (sin FK — tablas independientes)
```

---

## 6. API REST

Base URL: `/api`. Salvo que se indique lo contrario, todo endpoint requiere JWT
válido (`Authorization: Bearer <token>`); "ADMIN o `WRITE_<modulo>`" significa
`@PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_<modulo>')")`.

### Autenticación — `/auth`
| Método | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| POST | `/auth/login` | Login, devuelve JWT + rol + permisos; registra el intento en auditoría | público |
| GET | `/auth/me` | Identidad/rol/permisos del usuario actual | autenticado |
| POST | `/auth/cambiar-password` | Cambia la propia contraseña (valida la actual) | autenticado |

### Usuarios del Sistema — `/usuarios-sistema`
CRUD completo (GET lista, GET por id, POST, PUT, DELETE) — **todo ADMIN-only**.

### Auditoría — `/auditoria`
| Método | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| GET | `/auditoria/movimientos` | Búsqueda de bitácora (filtros: `modulo`, `accion`, `search`, `desde`, `hasta`, `limit`) | ADMIN o permiso `auditoria` |
| GET | `/auditoria/ad` | Auditoría detallada de cambios en AD (estado anterior/nuevo por campo) | ADMIN o permiso `auditoria` |

### Dashboard — `/dashboard`
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/dashboard/counts` | Contadores de todos los módulos (filtrados por permiso del usuario) |
| GET | `/dashboard/usuarios-red-por-ubicacion?nivel=sede\|dependencia` | Activos/inactivos agrupados por ubicación |
| GET | `/dashboard/licencias-por-tipo` | Suma de `cantidad` agrupada por tipo de licencia |
| GET | `/dashboard/ordenes-servicio` | Órdenes de servicio próximas a vencer |
| GET | `/dashboard/impresoras-por-estado`, `/wifi-por-estado`, `/correos-por-estado`, `/equipos-por-tipo` | Breakdown por estado/tipo, por módulo |
| GET | `/dashboard/vpn-por-estado-solicitud` | Breakdown por estado del workflow de solicitud VPN |

### Catálogos — `/catalogos/{sedes\|dependencias\|subdependencias\|tipos-contrato\|tipos-licencia\|tipos-bien\|tipos-impresora}`
Mismo patrón en los 7: GET lista (admite `search` y, en dependencias/subdependencias, el id del padre) y GET por id → cualquier autenticado; POST/PUT/DELETE → solo ADMIN (`WRITE_catalogos`).

### Correos — `/correos` (solo lectura)
`GET` lista, `/kpis`, `/dashboard/completo`, `/sedes`, `/dependencias`,
`/subdependencias` — todos `READ_correos`. **Sin POST/PUT/DELETE**: los datos
se nutren de la vista de Google Workspace, no se editan desde este sistema.

### Equipos, Impresoras, Usuarios de Red, WiFi, Licencias — CRUD clásico
GET (lista con `search`, y por id) para cualquier autenticado; POST/PUT/DELETE
→ ADMIN o `WRITE_<modulo>`. Particularidades:

| Módulo | Ruta base | Extra |
|--------|-----------|-------|
| Equipos | `/equipos` | `GET /equipos/con-red` (solo con usuario de red asignado) · `GET/PUT /equipos/{id}/enrichment` · `GET /equipos/{id}/historial` · `/equipos/{id}/evidencias/**` |
| Impresoras | `/impresoras` | `POST/GET /impresoras/{id}/driver` (multipart) · `/impresoras/{impresoraId}/intervenciones/**` |
| Usuarios de Red | `/usuarios-red` | `/usuarios-red/contratos/**` (historial de contratos) |
| Licencias | `/licencias` | `activaciones[]` viaja embebida en el body de POST/PUT |

### VPN — `/vpn` (workflow de dos etapas)
| Método | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| GET | `/vpn`, `/vpn/kpis`, `/vpn/{id}`, `/vpn/usuarios-red/buscar` | Lectura | `READ_vpn` |
| POST / PUT | `/vpn`, `/vpn/{id}` | Crear/editar solicitud | `WRITE_solicitar-vpn` |
| PATCH | `/vpn/{id}/aprobar`, `/rechazar`, `/observar` | Resolución de la solicitud | `WRITE_aprobar-vpn` |
| PATCH | `/vpn/{id}/antivirus` | Actualiza estado de antivirus | `WRITE_solicitar-vpn` |
| GET | `/vpn/dashboard/completo` | Dashboard administrativo | `WRITE_aprobar-vpn` |
| DELETE | `/vpn/{id}` | — | ADMIN puro |
| GET/POST | `/vpn/config-institucional` | Configuración institucional (rangos IP, etc.) | rol con permiso de gestión VPN |

### Active Directory (en vivo) — `/active-directory`
Búsqueda, alta, baja, desbloqueo, reset de password, mover OU, grupos,
dashboard y sincronización — todo `READ_usuarios-red` (lecturas) o
`WRITE_usuarios-red` (escrituras/sync).

### Identidad — `/personas/candidatos`
Listar, `detectar-ahora` (dispara el job manualmente), `confirmar` (crea
`dbo.persona`), `descartar` — **todo ADMIN-only**.

### Herramientas — `/herramientas`
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/herramientas/ping` | Hace ping a un host |
| GET | `/herramientas/inventario` | Inventario del equipo (CPU/RAM/etc.) |
| `/herramientas/ordenes-servicio/**` | CRUD de órdenes de servicio a proveedores | `READ_herramientas`/`WRITE_herramientas` |

(`/ping` e `/inventario` sin `@PreAuthorize` propio — el control de acceso es
solo de frontend, vía el permiso `herramientas`.)

### Tiempo real — `/realtime`
| Método | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| GET | `/realtime/events` | Canal SSE de eventos (`modulo`, `accion`, `entidadId`, `usuario`) que otros módulos publican al cambiar datos | cualquier autenticado |

---

## 7. Seguridad y Control de Acceso

- **JWT:** HMAC-SHA256, expira en 24h, payload con `username`/`rol`/`permisos[]`.
- **Roles:** `ADMIN` (acceso total) · `SOPORTE` (lectura por defecto, escritura solo donde tenga permiso).
- **Permisos por módulo** (tabla `permisos`, columna `modulo`):

| Valor en BD | Tipo | Habilita |
|-------------|------|----------|
| `equipos`, `impresoras`, `wifi`, `usuarios-red`, `licencias`, `catalogos` | escritura (`WRITE_<modulo>`) | crear/editar/eliminar en ese módulo |
| `solicitar-vpn` | escritura | crear/editar solicitudes VPN y estado de antivirus |
| `aprobar-vpn` | escritura | aprobar/rechazar/observar solicitudes VPN, ver dashboard administrativo |
| `credenciales-vpn` | escritura | ver/editar usuario y contraseña VPN dentro del formulario (control solo de frontend) |
| `correos`, `equipos`, `impresoras`, `licencias`, `usuarios-red`, `vpn`, `wifi`, `herramientas`, `auditoria` | lectura (`READ_<modulo>`) | acceso de solo lectura a ese módulo/sección |

ADMIN siempre tiene acceso total — los permisos de la tabla `permisos` solo
aplican a SOPORTE. `candidatos-persona` y `usuarios-sistema` son **ADMIN-only**,
sin permiso intermedio posible.

---

## 8. Frontend — Rutas

Cada módulo de negocio se sirve bajo un *shell* propio con sub-rutas por modo
(`consultas` / `administracion` / `dashboard`, según el módulo), navegadas con
`ModuleViewSwitcherComponent` (tabs). El control de acceso por sub-ruta es de
`moduloGuard('<modulo>')` (lectura) o `moduloGuard('<modulo>', { write: true })`
(escritura); `adminGuard` para lo ADMIN-only y `vpnAdminGuard` (ADMIN o
`solicitar-vpn`/`aprobar-vpn`) para el shell de VPN.

| Ruta | Sub-rutas | Guard | Visible para |
|------|-----------|-------|---------------|
| `/login` | — | — | — |
| `/dashboard` | — | auth | todos |
| `/licencias` | `consultas` · `administracion` · `dashboard` | moduloGuard(`licencias`[, write]) | todos (escritura condicionada) |
| `/wifi` | `consultas` · `administracion` · `dashboard` | moduloGuard(`wifi`[, write]) | ídem |
| `/correos` | `consultas` · `dashboard` | moduloGuard(`correos`) | ídem (sin `administracion` — es solo lectura) |
| `/equipos` | `inventario` · `mantenimiento` · `dashboard` | moduloGuard(`equipos`[, write]) | ídem |
| `/equipos/:id` | — | moduloGuard(`equipos`) | detalle de equipo |
| `/impresoras` | `consultas` · `administracion` · `dashboard` | moduloGuard(`impresoras`[, write]) | ídem |
| `/usuarios-red` | `consultas` · `administracion` · `dashboard` | moduloGuard(`usuarios-red`[, write]) | ídem |
| `/vpn` | `registros` · `administracion` · `dashboard` | vpnAdminGuard (administracion/dashboard) | ídem |
| `/usuarios-sistema` | — | adminGuard | solo ADMIN |
| `/candidatos-persona` | — | adminGuard | solo ADMIN |
| `/auditoria` | — | moduloGuard(`auditoria`) | ADMIN o con permiso |
| `/herramientas` | — | moduloGuard(`herramientas`) | ADMIN o con permiso |
| `/catalogos` | — | moduloGuard(`catalogos`) | ADMIN (permiso `WRITE_catalogos`) |
| `**` | — | redirige a `/dashboard` | — |

**Componentes compartidos clave:** `GenericTableComponent` (tabla con
búsqueda/orden), `UbicacionSelectComponent` (selector jerárquico
Sede→Dependencia→Subdependencia), `ModuleViewSwitcherComponent` (tabs de
vista dentro de un shell de módulo), `SectionCardComponent`/`StatusBadgeComponent`
(tarjetas y pastillas de estado reutilizables), `VencimientoBadgeComponent`
(alerta de vencimiento), `VpnPasswordGeneratorComponent` (generador de
contraseñas embebido en el formulario VPN), `IfAdminDirective`.

### Sistema visual

Rediseño "Panel Operativo INIA" aplicado a login, header, sidebar y todos los
shells de módulo: verde institucional como color de acción/marca, acento
ámbar puntual, colores de módulo solo como acento, DM Sans como única
tipografía, paridad completa claro/oscuro. Detalle completo en `DESIGN.md`
(raíz del proyecto).

---

## 9. Despliegue

No hay Docker ni CI configurado todavía. El despliegue actual (servidor
Windows dentro de la red INIA) usa **nginx como reverse proxy con TLS**, con
la configuración versionada en `deploy/nginx.conf`:

- `:80` redirige a `:443`.
- `:443` sirve el build estático de Angular (`root` apuntando a
  `soportedesk-frontend/dist/soportedesk-frontend/browser`) con
  `try_files … /index.html` (SPA).
- `location /api/` proxya al backend en `127.0.0.1:8080`.
- `location = /api/realtime/events` tiene su propio bloque con
  `proxy_buffering off` y `proxy_read_timeout 1h` — necesario porque es un
  canal SSE de larga duración, no una request normal.
- Cabeceras de seguridad (`CSP`, `X-Frame-Options`, `Permissions-Policy`, etc.)
  ya configuradas.

### 9.1 Base de datos

```sql
-- 1. Esquema base (idempotente, seguro de re-ejecutar)
:r schema.sql

-- 2. Migraciones del Plan de Normalización, EN ORDEN (ver §5 — no son idempotentes todas)
:r migration_fase0_normalizacion_housekeeping.sql
:r migration_fase1_organizacion.sql
:r migration_fase2_equipos.sql
:r migration_fase3_vpn.sql
-- ... resto de migration_*.sql, más las tablas creadas manualmente (ver §5)

-- 3. Catálogos iniciales (sedes, dependencias, etc. de INIA)
:r data_catalogos.sql

-- 4. (Opcional) usuarios admin/soporte por defecto si no existen
:r data.sql
```

> Cambiar la contraseña de `admin`/`soporte` en el primer login — ambos usuarios
> se crean con la misma contraseña por defecto (`admin`).

### 9.2 Backend (JAR ejecutable)

```bash
cd soportedesk-backend
mvn clean package -DskipTests
# genera target/soportedesk-backend-0.1.0.jar
```

Todas las credenciales y endpoints sensibles se leen exclusivamente de
variables de entorno (sin defaults hardcodeados salvo la URL de AD):

| Variable | Uso |
|----------|-----|
| `JWT_SECRET` | clave HMAC para firmar los JWT (base64, 32+ bytes) |
| `LICENCIA_ENCRYPTION_KEY` | clave AES para cifrar credenciales de licencias |
| `AGENTE_INVENTARIO_TOKEN` | token del agente de inventario de red (`herramientas/inventario`) |
| `SSTI_DB_URL` / `SSTI_DB_USERNAME` / `SSTI_DB_PASSWORD` | SQL Server, base `ssti` (datasource primario) |
| `GLPI_DB_URL` / `GLPI_DB_USERNAME` / `GLPI_DB_PASSWORD` | MySQL de GLPI (datasource secundario, solo lectura) |
| `AD_URL` (default `ldaps://SRV-DC02.inia.local:636`) / `AD_BASE_DN` / `AD_BIND_USER` / `AD_BIND_PASSWORD` / `AD_REFERRAL` | conexión LDAPS al Active Directory institucional |

Otras claves de `application.yml` sin variable de entorno (no son secretos):
`uploads.drivers-dir`/`evidencias-dir`/`intervenciones-dir` (rutas de disco),
`equipos.sync-glpi-cron`, `identidad.reconciliacion-cron` (expresiones cron de
los jobs `@Scheduled`).

Ejecutar como servicio:
- **Windows:** registrar con NSSM o una tarea programada que lance
  `java -jar soportedesk-backend-0.1.0.jar --spring.profiles.active=dev` (o el
  perfil que corresponda) y se reinicie ante fallos.
- **Linux:** unit de `systemd` apuntando al mismo comando.

### 9.3 Frontend (build estático)

```bash
cd soportedesk-frontend
npm install
ng build --configuration production
# genera dist/soportedesk-frontend/browser/
```

Servida por nginx (`deploy/nginx.conf`, ver arriba). En desarrollo,
`proxy.conf.json` vía `ng serve` cumple el mismo rol de proxy a `/api`.

### 9.4 Desarrollo local (resumen)

```bash
# Backend
cd soportedesk-backend && mvn spring-boot:run        # http://localhost:8080

# Frontend
cd soportedesk-frontend && npm install && ng serve   # http://localhost:4200, proxy a /api ya configurado
```

En este entorno también hay un nginx corriendo en `:80`/`:443` sirviendo el
build de producción (`https://localhost/`, certificado autofirmado) en
paralelo al `ng serve` de desarrollo (`:4200`) y al backend directo (`:8080`).

---

## 10. Testing

```bash
# Backend — unit + integration tests
cd soportedesk-backend && mvn test
# Backend — incluye los *ControllerIT (Testcontainers/integración real)
cd soportedesk-backend && mvn verify

# Frontend — suite Karma/Jasmine
cd soportedesk-frontend && npx ng test --watch=false
```
