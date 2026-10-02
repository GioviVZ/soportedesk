# Sistema Gestión de Soporte Informático INIA — Arquitectura y Despliegue

Documento único y vigente con la arquitectura completa del sistema. Reemplaza la
lectura dispersa de los specs/plans históricos de `docs/superpowers/historial/`
(esos quedan como bitácora de decisiones de diseño, no como referencia técnica
actual — para eso está este documento). Última revisión a fondo: 2026-09-27.

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
de hardware). Sin colas ni microservicios — un único despliegue backend
(reactor Maven multi-módulo, ver §3.1) y una única SPA frontend (workspace
Nx con librerías independientes por feature, ver §8.1) — pero sí un job
`@Scheduled` (sincronización de equipos desde GLPI) y un canal SSE para push
de cambios al frontend.

```
┌─────────────────────┐   HTTPS / JSON + SSE   ┌──────────────────────┐   JDBC   ┌───────────────┐
│  Angular 22 SPA      │ ──────────────────────▶│  Spring Boot 3 API   │─────────▶│ SQL Server    │
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
| Jobs programados | `@Scheduled` (`@EnableScheduling`) | sync GLPI→`equipo_asignacion` (diario 3am) |
| Cifrado de credenciales | AES/GCM (`LicenciaCredentialConverter`) | aplica a claves de licencias |
| Frontend | Angular 22.2 · TypeScript 6.0 · SCSS | standalone components, sin NgModules; workspace Nx (ver §8.1) |
| Gráficos | Chart.js (vía `ng2-charts` o uso directo) | dashboard |
| Build | Maven reactor multi-módulo (backend) · Nx (frontend) | sin Docker/CI configurado hoy |
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
├── soportedesk-backend/                    # reactor Maven multi-módulo (desde 2026-09-27, ver §3.1)
│   ├── pom.xml                              # POM padre (packaging=pom), NO produce jar
│   ├── soportedesk-common/          # kernel: common/ (FileStorageService) + exception/ (GlobalExceptionHandler)
│   ├── soportedesk-catalogo/        # Sedes, Dependencias, Subdependencias, TipoContrato, TipoLicencia, TipoBien, TipoImpresora
│   ├── soportedesk-gestiontiinia/   # vista de solo lectura sobre GestionTI_INIA (Google Workspace)
│   ├── soportedesk-realtime/        # hub SSE para push de cambios en vivo al frontend
│   ├── soportedesk-auditoria/       # bitácora de movimientos + auditoría detallada de cambios en AD
│   ├── soportedesk-wifi/            # Redes WiFi
│   ├── soportedesk-identity/        # auth/ (login, JWT, /auth/me, usuarios del sistema) + security/ (JwtService, JwtAuthFilter, SecurityConfig) — fusionados, ver §3.1
│   ├── soportedesk-equipos/         # equipos/ (+ enrichment/, evidencia/, glpicache/) + glpi/ (datasource secundario MySQL) — fusionados, ver §3.1; expone equipos/api/ (EquipoConsultaApi) como unico punto de acceso externo a datos GLPI
│   ├── soportedesk-impresoras/      # Impresoras (driver, consumibles) (+ intervencion/ = bitácora de reparaciones)
│   ├── soportedesk-licencias/       # Licencias de software + activaciones múltiples + cifrado
│   ├── soportedesk-correos/         # Cuentas de correo institucional (reporting, solo lectura — ver §6)
│   ├── soportedesk-red-directorio/  # activedirectory/ (LDAPS en vivo) + usuariosred/ (+ contrato/) — fusionados, ver §3.1
│   ├── soportedesk-herramientas/    # Ping, inventario de red local (+ ordenes/ de servicio, monitoreo/ de ping)
│   ├── soportedesk-vpn/             # Credenciales VPN, antivirus, workflow de solicitud/aprobación
│   ├── soportedesk-dashboard/       # Agregaciones para KPIs y gráficos de todos los módulos (depende de casi todos, nadie depende de él)
│   └── soportedesk-app/             # ÚNICO módulo que produce jar ejecutable: SoportedeskApplication, config/PrimaryDataSourceConfig, application.yml
│       └── src/main/resources/
│           ├── schema.sql                # esquema base v1.0 (idempotente) — YA NO es la única fuente de verdad, ver §5
│           ├── migration_*.sql           # 26 scripts sueltos del "Plan de Normalización" en curso, no fusionados en schema.sql
│           ├── data.sql                  # usuarios admin/soporte por defecto
│           ├── data_catalogos.sql        # catálogos iniciales (sedes, dependencias, etc.)
│           └── application.yml           # configuración (perfil `dev`; todas las credenciales vía variables de entorno)
│
└── soportedesk-frontend/                   # workspace Nx (desde 2026-09-27, ver §8.1)
    ├── libs/
    │   ├── core/           # AuthService, guards (authGuard/adminGuard/moduloGuard/vpnAdminGuard), interceptor JWT, CatalogoService, modelos compartidos
    │   ├── ui/             # GenericTable, UbicacionSelect, SectionCard, StatusBadge, VencimientoBadge, ModuleViewSwitcher, etc. (sin dependencias de negocio)
    │   ├── auditoria/ auth/ wifi/ usuarios-sistema/ correos/ licencias/ impresoras/
    │   ├── equipos/ herramientas/ usuarios-red/ vpn/ catalogos/ dashboard/   # 13 librerías de negocio, cada una con su <nombre>.routes.ts (ver §8.1)
    │   └── (cada libs/<x>/src/index.ts es el único punto de entrada público permitido hacia esa librería)
    └── src/app/
        ├── app.routes.ts   # árbol de rutas raíz: loadChildren hacia cada librería de negocio
        └── layout/         # shell, header, sidebar
```

### 3.1 Modularización física del backend (ISO/IEC 25010 — Modularidad)

Hasta el 2026-09-26 el backend era un único módulo Maven (`packaging=jar`) organizado por paquete pero sin ningún límite físico entre dominios: cualquier clase podía importar directo el interior de cualquier otro paquete. Se hizo una auditoría completa de imports entre los 20 paquetes de dominio y se migró a un reactor Maven multi-módulo (16 módulos + el POM padre) para satisfacer la característica de calidad **Modularidad** de ISO/IEC 25010 (bajo acoplamiento, alta cohesión, interfaces bien definidas, impacto mínimo de un cambio en un módulo sobre los demás).

**Los 3 ciclos de dependencia bidireccionales encontrados y resueltos** (un ciclo entre módulos Maven es un error de build; dentro de un mismo módulo no afecta la métrica de modularidad porque ISO 25010 mide a nivel de componente):

| Ciclo original | Resolución |
|---|---|
| `auth` ↔ `security` (`AuthController` usaba `JwtService`; `CustomUserDetailsService` usaba `Usuario`/`Permiso`/repositorios) | Fusionados en `soportedesk-identity` |
| `equipos` ↔ `glpi` (`equipos` leía repositorios GLPI; `GlpiComputerService`/`GlpiTecladoService` disparaban el resync de `EquipoGlpiCacheSyncService`) | Fusionados en `soportedesk-equipos` |
| `activedirectory` ↔ `usuariosred` (`ActiveDirectoryService` usaba `UsuarioRedContrato(Repository)`; `UsuarioRedContratoService` usaba `AdUsuarioCache(Repository)`/`ActiveDirectoryService`) | Fusionados en `soportedesk-red-directorio` |

Además se corrigió un acoplamiento oculto: `herramientas`, `usuariosred` y `vpn` leían directo `glpi.VwInvComputerFullRepository` (entidad/repositorio interno de `soportedesk-equipos`), saltándose el dominio dueño de esos datos. Se expuso `com.inia.soportedesk.equipos.api` (`EquipoConsultaDto` + `EquipoConsultaApi`) como único punto de acceso permitido; los 3 consumidores se migraron a esa API.

**Árbol de dependencias resultante** (generado con `mvn dependency:tree`, sin ciclos — Maven no compila un reactor con dependencias circulares):

```
Tier 0 (sin dependencias internas): common (kernel), gestiontiinia, realtime
Tier 1: catalogo → common          auditoria → realtime          wifi → common
Tier 2: identity → common+auditoria          equipos → common+catalogo
        impresoras → common+catalogo          licencias → common+catalogo
        equipos-red → common+catalogo (desde 2026-10-01)          equipos-moviles → common+catalogo (desde 2026-10-02)
        telefonia-fija → common+catalogo (desde 2026-10-02)
        correos → gestiontiinia
Tier 3: red-directorio → common+catalogo+gestiontiinia+auditoria+equipos
        herramientas → common+equipos
Tier 4: vpn → common+catalogo+identity+red-directorio+equipos
Tier 5: dashboard → red-directorio+equipos+gestiontiinia+herramientas+impresoras+licencias+vpn+wifi (agregador puro, nadie depende de él)
Tier 6: soportedesk-app → depende de los 18 módulos anteriores (único que arranca Spring Boot y produce el jar ejecutable)
```

`soportedesk-app` quedó reducido a la raíz de composición: `SoportedeskApplication.java` (clase `@SpringBootApplication`, sigue con component-scan sobre `com.inia.soportedesk` — los nombres de paquete Java no cambiaron en toda la migración, solo el jar donde vive cada uno) y `config/PrimaryDataSourceConfig.java` (datasource SQL Server primario). `glpi/GlpiDataSourceConfig.java` (datasource MySQL secundario, autocontenido) vive dentro de `soportedesk-equipos`.

Verificación de la migración completa (los 315 tests y el arranque real con ambos datasources se confirmaron de forma independiente en cada uno de los 7 pasos): historial completo en `docs/superpowers/historial/plans/2026-09-25-modularizacion-fisica-backend.md`; árbol de dependencias "antes" en `docs/superpowers/historial/plans/2026-09-25-dependency-tree-antes.txt`.

---

## 4. Módulos de Negocio

| Módulo | Qué gestiona | Particularidad |
|--------|--------------|-----------------|
| Equipos | Computadoras/laptops (inventario base viene de GLPI) | `equipos` es legado; el inventario real hoy se completa vía `equipos/enrichment` (corrige/completa lo que GLPI no tiene) y `equipos/evidencia` (fotos/actas adjuntas); un job diario proyecta todo hacia `dbo.equipo_asignacion`, la tabla normalizada |
| Impresoras | Impresoras de red/USB | ficha técnica con pestañas, carga/descarga de driver, consumibles por color, más `impresoras/intervencion` = bitácora de reparaciones con adjuntos |
| Correos | Cuentas de correo institucional | **solo lectura/reporting** — se nutre de la vista de Google Workspace (`gestiontiinia`), sin altas/bajas manuales desde este sistema |
| Usuarios de Red | Cuentas AD (caché local + integración en vivo) | `usuariosred` mantiene la caché (`ad_usuarios_cache`) y `usuariosred/contrato` el historial de contratos; `activedirectory` habla LDAPS en vivo para alta/baja/reset/mover OU |
| Active Directory (en vivo) | Búsqueda, alta, baja, desbloqueo, reset de password, mover OU, grupos, sincronización | valida contra `gestiontiinia` que el correo elegido exista y no esté ya vinculado a otra cuenta AD |
| VPN | Credenciales de acceso remoto + antivirus | **workflow de dos etapas**: solicitud (permiso `solicitar-vpn`) → aprobación/rechazo/observación (permiso `aprobar-vpn`); generador de contraseñas integrado en el formulario; sede/dependencia/subdependencia del titular se resuelven contra el catálogo real (`sedes`/`dependencias`/`subdependencias`) desde 2026-09-24, ya no quedan sin vincular |
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
> se aplicó vía **26 scripts `migration_*.sql` sueltos** en
> `soportedesk-backend/src/main/resources/`, ejecutados manualmente y no
> fusionados en `schema.sql`. Además, algunas tablas usadas por entidades JPA
> activas (`equipos_enrichment`, `equipos_enrichment_historial`,
> `equipos_evidencias`, `impresoras_intervenciones`,
> `impresoras_intervenciones_adjuntos`) **no aparecen creadas en ningún
> script versionado** — se crearon manualmente en SSMS. Para reconstruir el
> esquema real desde cero hoy hace falta `schema.sql` + los 26
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
| `dbo.persona_asignacion` | FK `persona_id → persona`, `subdependencia_id → subdependencias` |
| `dbo.persona_contrato` | FK `persona_id → persona`, `tipo_contrato_id → tipos_contrato` |
| `dbo.ad_cuenta` | sucesora de `ad_usuarios_cache`, FK `persona_id → persona` — **coexiste en paralelo a propósito** durante la migración |
| `dbo.equipo_asignacion` | UNIQUE `glpi_computer_id`; FK `sede_id`, `dependencia_id`, `subdependencia_id` — sucesora normalizada de `equipos_enrichment`, mantenida por el job diario de sincronización GLPI; columna `persona_id` huérfana (sin FK, sin código que la use) |
| `dbo.ubigeo`, `dbo.tipo_unidad` | catálogos de fases posteriores del plan de normalización |

### Tablas creadas manualmente (no versionadas)

`equipos_enrichment`, `equipos_enrichment_historial`, `equipos_evidencias`,
`impresoras_intervenciones`, `impresoras_intervenciones_adjuntos` — usadas
activamente por sus entidades JPA pero sin script de creación en el repo.
Pendiente: escribir el `migration_*.sql` correspondiente para cerrar el gap.

### Cache local de inventario GLPI (`dbo.equipo_glpi_cache`, desde 2026-09-24)

Las consultas de equipos (grilla, KPIs, salud, dashboard, filtros) dejaron de
golpear en vivo el MySQL de GLPI en cada request. Ahora leen de
`dbo.equipo_glpi_cache` (SQL Server, paquete `equipos.glpicache`), una tabla
plana que espeja los mismos campos de la vista `vw_inv_computers_full` de
GLPI mas los datos de teclado/monitor/AnyDesk-RustDesk que antes se armaban
con 3 queries adicionales por request. Se mantiene fresca con:

- Resync completo cada 5 min (`equipos.glpi-cache-sync-interval-ms`,
  `@Scheduled(fixedDelayString=...)`), mismo patron de coordinador/estado
  que ya usa la sincronizacion de Active Directory (`GlpiSyncCoordinator`
  espeja a `AdSyncCoordinator`).
- Refresco puntual forzado cada vez que se abre el detalle de un equipo
  especifico (`GET /equipos/{id}`), y tras guardar un teclado o dar de baja
  un equipo (las 2 unicas escrituras que este sistema hace hacia GLPI).
- Boton manual "Actualizar inventario GLPI" en la pantalla de equipos,
  `POST /equipos/sync/iniciar` + `GET /equipos/sync/estado`.

GLPI sigue siendo de solo lectura como fuente de verdad; las correcciones
manuales del admin siguen viviendo aparte en `equipos_enrichment`, fusionadas
en memoria igual que antes -- el cache nunca guarda esos campos `*_override`.

### Diagrama de relaciones (FK, simplificado)

```
sedes ──< dependencias ──< subdependencias
            │                    │
            └────────────────────┴─── usuarios_red / persona ──< equipos ──< vpn
                                       │                  │
                                       ├─── correos (RO)   └─── equipo_asignacion (ubicación)
                                       │
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
| Equipos | `/equipos` | `GET /equipos/con-red` (solo con usuario de red asignado) · `GET/PUT /equipos/{id}/enrichment` · `GET /equipos/{id}/historial` · `/equipos/{id}/evidencias/**` · `POST /equipos/sync/iniciar` + `GET /equipos/sync/estado` (sync manual del cache GLPI) |
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

> **Nota (2026-09-24):** la feature de identidad/reconciliación de personas
> (tablas `dbo.persona` y `dbo.persona_candidato`, endpoints
> `/personas/candidatos`, pantalla "Candidatos a Persona") fue decomisionada
> por completo — código backend y frontend eliminados. La resolución de
> "a quién pertenece" una cuenta de red no nominal ahora vive en
> `usuarios_red_contratos` (`personal_nombre`/`personal_apellidos`) cruzado
> con `ad_usuarios_cache`, ver módulo Usuarios de Red. Las tablas
> `dbo.persona`/`dbo.persona_candidato` se eliminan de la base de datos vía
> `migration_drop_identidad_2026-09-24.sql` (ejecución manual, separada). Como
> efecto colateral se eliminó también `VpnNormalizedSyncService`; las tablas
> `dbo.vpn_solicitud`/`dbo.vpn_solicitud_snapshot` quedan congeladas (ya eran
> un espejo inerte de `dbo.vpn`, sin lectores).

> **Nota (2026-09-24, segunda limpieza):** se eliminaron ademas estas tablas
> huerfanas (cero codigo Java/Angular que las usara, confirmado por auditoria
> completa): `dbo.anexo`, el subsistema completo de "agente de inventario
> remoto" (`dbo.inventario_equipos`, `inventario_discos`, `inventario_programas`,
> `inventario_redes`, `inventario_red_ips` — un piloto abandonado desde julio
> 2026, sin controller ni entidad vigente), `dbo.vpn_solicitud` /
> `vpn_solicitud_snapshot` / `vpn.EstadosSolicitud` (el espejo normalizado de
> VPN, huerfano tras borrar `VpnNormalizedSyncService`), y `core.TiposCuentaDirectorio`
> (solo la usaban `dbo.persona`/`PersonaReconciliacionService`, ambos ya
> eliminados). Tambien se eliminaron 3 columnas muertas de `dbo.vpn`
> (`usuario_red_id`, `equipo_id`, `ip_asignada`, sin FK y sin codigo que las
> usara) y la herramienta cliente `tools/soportedesk-agent/` (PowerShell del
> agente de inventario abandonado) junto con la propiedad de configuracion
> `agente.inventario-token`. Todas las tablas eliminadas fueron respaldadas
> antes del borrado (ver migraciones `migration_drop_tablas_huerfanas_2026-09-24.sql`
> y backups CSV fuera del repositorio).

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
aplican a SOPORTE. `usuarios-sistema` es **ADMIN-only**, sin permiso
intermedio posible.

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
| `/equipos/computadoras` | `inventario` · `mantenimiento` · `dashboard` | moduloGuard(`equipos`[, write]) | ídem (librería `equipos`, GLPI). `/equipos`, `/equipos/inventario`, `/equipos/mantenimiento` y `/equipos/dashboard` redirigen aquí |
| `/equipos/:id` | — | moduloGuard(`equipos`) | detalle de equipo |
| `/equipos/red` | `switches` · `routers` · `access-points` · `radioenlaces` | moduloGuard(`equipos-red`) | librería `equipos-red`; API `/api/equipos-red` |
| `/equipos/moviles` | `inventario` · `asignacion-numero` · `actas` | moduloGuard(`equipos-moviles`) | librería `equipos-moviles`; API `/api/equipos-moviles` (+ `/asignaciones`, `/actas` con archivo adjunto) |
| `/equipos/telefonia-fija` | `inventario` · `asignacion-anexos` | moduloGuard(`telefonia-fija`) | librería `telefonia-fija`; API `/api/telefonia-fija/telefonos` y `/api/telefonia-fija/asignaciones` |
| `/impresoras` | `consultas` · `administracion` · `dashboard` | moduloGuard(`impresoras`[, write]) | ídem |
| `/usuarios-red` | `consultas` · `administracion` · `dashboard` | moduloGuard(`usuarios-red`[, write]) | ídem |
| `/vpn` | `registros` · `administracion` · `dashboard` | vpnAdminGuard (administracion/dashboard) | ídem |
| `/usuarios-sistema` | — | adminGuard | solo ADMIN |
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

### 8.1 Modularización física del frontend (ISO/IEC 25010 — Modularidad)

Hasta el 2026-09-27 el frontend era una única app Angular CLI organizada por
carpeta (`core`/`features`/`shared`) pero sin ningún límite físico entre
features — cualquier componente podía importar directo el interior de
cualquier otro. Se auditaron los imports entre los 13 features de negocio
(solo 3 cruces encontrados en todo el código) y se migró a un **workspace
Nx** con 15 librerías (`core`, `ui`, + 13 features de negocio), cada una con
su propio `project.json`, barrel público (`src/index.ts`) y alias de import
(`@soportedesk/<nombre>`).

**Únicas 2 dependencias feature-a-feature, ambas legítimas y preservadas
explícitamente** (el tercer cruce encontrado en la auditoría original,
`OrdenServicio`/`OrdenServicioHito` importado por `herramientas` desde
adentro de otro feature, era acoplamiento accidental — se resolvió moviendo
esos modelos a `core/models` antes de tocar Nx, no se conservó como
dependencia):

| Dependencia | Motivo |
|---|---|
| `vpn → equipos` | `vpn-form.component.ts` busca un equipo existente al crear una solicitud VPN |
| `catalogos → vpn` | `catalogos.component.ts` embebe el formulario de configuración institucional de VPN |

**Regla de límites de módulo (equivalente frontend de ArchUnit):**
`@nx/enforce-module-boundaries` con tags `scope:<nombre>` + `type:feature` /
`type:ui` / `type:data-access` / `type:app` por proyecto. Los `depConstraints`
bloquean cualquier dependencia feature-a-feature que no sea una de las 2 de
la tabla anterior; se confirmó con una prueba deliberada (import prohibido
agregado y revertido) que el lint realmente falla ante una violación nueva.

**Regresión detectada y corregida en la verificación final (code-splitting):**
la primera versión de la migración hacía que `app.routes.ts` importara el
*barrel* de cada librería (`import('@soportedesk/equipos').then(m => m.X)`)
para cada ruta. Como todas las rutas de una misma librería resuelven al
mismo especificador de módulo, el bundler las colapsaba en un solo chunk
grande por librería (18 chunks lazy en total, el mayor de 744 kB, en vez de
un chunk pequeño por componente como antes de la migración). Se corrigió
haciendo que cada librería exponga su propio `<nombre>.routes.ts` (con
lazy-imports relativos internos a la librería) y que `app.routes.ts` use
`loadChildren` apuntando a esas rutas en vez de `loadComponent` apuntando al
barrel — restaurando ~55 chunks lazy con nombres descriptivos por
componente, igual que antes de la migración (los pocos chunks grandes que
persisten son librerías de terceros cargadas bajo demanda — `xlsx`, `three`,
`chart.js` —, no código propio).

Verificación de la migración completa (225 tests y build de producción
confirmados de forma independiente en cada fase F0–F5): historial completo
en `docs/superpowers/historial/plans/2026-09-25-modularizacion-fisica-frontend.md`.

**Reestructuración de Inventario de Equipos (2026-10-01):** el menú
"Inventario de Equipos" se dividió en 4 grupos (Computadoras · Equipos de
Conexión de Red · Equipos Móviles · Equipos de Telefonía Fija). Cada grupo
nuevo es un dominio de negocio propio y vive en su propia librería, no dentro
de `equipos` (que queda dedicada a computadoras GLPI):

| Librería | Alias | Tags | Montada en |
|---|---|---|---|
| `libs/equipos-red` | `@soportedesk/equipos-red` | `scope:equipos-red`, `type:feature` | `/equipos/red` |
| `libs/equipos-moviles` | `@soportedesk/equipos-moviles` | `scope:equipos-moviles`, `type:feature` | `/equipos/moviles` |
| `libs/telefonia-fija` | `@soportedesk/telefonia-fija` | `scope:telefonia-fija`, `type:feature` | `/equipos/telefonia-fija` |

Las tres solo pueden depender de `scope:core` y `scope:ui` (confirmado con un
import prohibido deliberado hacia `@soportedesk/equipos`, que el lint
rechazó). Las rutas se montan en `app.routes.ts` **antes** de `equipos`,
para que Angular no las confunda con `/equipos/:id`. El sidebar admite
submenús de 3 niveles (`NavItem.groups`) y cada grupo tiene su propio
permiso (`equipos`, `equipos-red`, `equipos-moviles`, `telefonia-fija`): el
padre "Inventario de Equipos" se muestra si el usuario puede leer al menos
un grupo. `ModulePlaceholderComponent` (en `libs/ui`) queda disponible para
futuros submódulos en preparación.

Cada grupo tiene su propio módulo Maven (Tier 2: `common` + `catalogo`),
nunca dentro de `soportedesk-equipos`:

| Módulo Maven | Tablas (`migration_*.sql`) | Permiso |
|---|---|---|
| `soportedesk-equipos-red` | `equipos_red` | `equipos-red` |
| `soportedesk-equipos-moviles` | `equipos_moviles`, `asignaciones_numero_movil`, `actas_moviles`, `actas_moviles_equipos` (+ archivos en `uploads/actas-moviles`) | `equipos-moviles` |
| `soportedesk-telefonia-fija` | `telefonos_fijos`, `asignaciones_anexo` | `telefonia-fija` |

**Rendimiento:** `GenericTableComponent` rastrea filas y columnas por
identidad (`track row`), así que las páginas que la usan declaran `columns`
como campo y memorizan las filas (`rowsCache`) en vez de construirlas en un
getter en cada detección de cambios.

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

Desde la migración a reactor Maven multi-módulo (2026-09-27, ver §3.1), el comando se sigue lanzando desde la raíz del reactor, pero el jar ejecutable ahora lo produce el módulo `soportedesk-app` (el único con `spring-boot-maven-plugin`):

```bash
cd soportedesk-backend
mvn clean package -DskipTests
# construye los 19 modulos y genera soportedesk-app/target/soportedesk-app-0.1.0.jar
```

Todas las credenciales y endpoints sensibles se leen exclusivamente de
variables de entorno (sin defaults hardcodeados salvo la URL de AD):

| Variable | Uso |
|----------|-----|
| `JWT_SECRET` | clave HMAC para firmar los JWT (base64, 32+ bytes) |
| `LICENCIA_ENCRYPTION_KEY` | clave AES para cifrar credenciales de licencias |
| `SSTI_DB_URL` / `SSTI_DB_USERNAME` / `SSTI_DB_PASSWORD` | SQL Server, base `ssti` (datasource primario) |
| `GLPI_DB_URL` / `GLPI_DB_USERNAME` / `GLPI_DB_PASSWORD` | MySQL de GLPI (datasource secundario, solo lectura) |
| `AD_URL` (default `ldaps://SRV-DC02.inia.local:636`) / `AD_BASE_DN` / `AD_BIND_USER` / `AD_BIND_PASSWORD` / `AD_REFERRAL` | conexión LDAPS al Active Directory institucional |

Otras claves de `application.yml` sin variable de entorno (no son secretos):
`uploads.drivers-dir`/`evidencias-dir`/`intervenciones-dir` (rutas de disco),
`equipos.sync-glpi-cron` (expresión cron del job `@Scheduled`).

Ejecutar como servicio:
- **Windows:** registrar con NSSM o una tarea programada que lance
  `java -jar soportedesk-app-0.1.0.jar --spring.profiles.active=dev` (o el
  perfil que corresponda) desde `soportedesk-backend/` (para que `uploads/`
  siga resolviendo en la raíz del reactor) y se reinicie ante fallos.
- **Linux:** unit de `systemd` apuntando al mismo comando.

### 9.3 Frontend (build estático)

Desde la migración a workspace Nx (2026-09-27, ver §8.1), el build ya no se
invoca con `ng`, sino a través de Nx (que orquesta el mismo builder de
Angular sobre las 15 librerías + la app):

```bash
cd soportedesk-frontend
npm install
npm run build   # = nx build soportedesk-frontend --configuration production
# genera dist/soportedesk-frontend/browser/
```

Servida por nginx (`deploy/nginx.conf`, ver arriba). En desarrollo,
`proxy.conf.json` vía `nx serve` cumple el mismo rol de proxy a `/api`.

### 9.4 Desarrollo local (resumen)

```bash
# Backend (reactor multi-modulo desde 2026-09-27: hay que indicar el modulo con el plugin)
cd soportedesk-backend && mvn -pl soportedesk-app -am spring-boot:run   # http://localhost:8080

# Frontend (workspace Nx desde 2026-09-27)
cd soportedesk-frontend && npm install && npm start   # = nx serve, http://localhost:4200, proxy a /api ya configurado
```

En este entorno también hay un nginx corriendo en `:80`/`:443` sirviendo el
build de producción (`https://localhost/`, certificado autofirmado) en
paralelo al `nx serve` de desarrollo (`:4200`) y al backend directo (`:8080`).

---

## 10. Testing

```bash
# Backend — unit + integration tests
cd soportedesk-backend && mvn test
# Backend — incluye los *ControllerIT (Testcontainers/integración real)
cd soportedesk-backend && mvn verify

# Frontend — suite Karma/Jasmine (workspace Nx desde 2026-09-27)
cd soportedesk-frontend && npm test -- --watch=false   # = nx test soportedesk-frontend
# Frontend — reglas de límites de módulo entre librerías (equivalente Nx de ArchUnit, ver §8.1)
cd soportedesk-frontend && npx nx run-many -t lint
```
