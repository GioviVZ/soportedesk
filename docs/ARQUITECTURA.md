# SoporteDesk INIA — Arquitectura y Despliegue

Documento único y vigente con la arquitectura completa del sistema. Reemplaza la
lectura dispersa de los specs/plans históricos de `docs/superpowers/historial/`
(esos quedan como bitácora de decisiones de diseño, no como referencia técnica
actual — para eso está este documento).

---

## 1. Resumen

SoporteDesk INIA es un sistema interno de gestión de activos y soporte técnico:
equipos, impresoras, usuarios de red (AD), correos institucionales, licencias de
software, credenciales VPN, redes WiFi, un módulo de auditoría de movimientos y
herramientas de diagnóstico de red — todo con control de acceso por roles y
permisos por módulo.

Arquitectura: SPA Angular que consume una API REST stateless (Spring Boot +
JWT) respaldada por SQL Server. Sin colas, sin caché, sin microservicios — un
monolito backend y un monolito frontend, deliberadamente simple para el tamaño
del equipo que lo mantiene.

```
┌─────────────────────┐        HTTPS / JSON        ┌──────────────────────┐        JDBC        ┌───────────────┐
│  Angular 17 SPA      │ ──────────────────────────▶│  Spring Boot 3 API   │ ──────────────────▶│  SQL Server   │
│  (soportedesk-       │◀────────────────────────── │  (soportedesk-       │◀────────────────────│  (BD: ssti)   │
│   frontend)          │      JWT en cada request    │   backend)           │                     └───────────────┘
└─────────────────────┘                              └──────────────────────┘
```

---

## 2. Stack Tecnológico

| Capa | Tecnología | Notas |
|------|-----------|-------|
| Backend | Spring Boot 3.2.5 · Java 17 | empaquetado como JAR ejecutable |
| Seguridad | Spring Security + JWT (jjwt) | sin sesiones de servidor, stateless |
| ORM | Spring Data JPA / Hibernate | `ddl-auto: none` — el esquema lo gestiona `schema.sql`, no Hibernate |
| Base de datos | SQL Server 2016+, base `ssti` | driver `mssql-jdbc` |
| Cifrado de credenciales | AES/GCM (`LicenciaCredentialConverter`) | aplica a claves de licencias |
| Frontend | Angular 17.3 · TypeScript 5.4 · SCSS | standalone components, sin NgModules |
| Gráficos | Chart.js (vía `ng2-charts` o uso directo) | dashboard |
| Build | Maven (backend) · Angular CLI / npm (frontend) | sin Docker/CI configurado hoy |

---

## 3. Estructura del Proyecto

```
SistemadeSoporteTecnicoINIA/
├── docs/
│   ├── ARQUITECTURA.md                    # este documento
│   └── superpowers/historial/             # specs y plans fechados (bitácora de diseño)
│
├── soportedesk-backend/                    # API REST Spring Boot
│   └── src/main/java/com/inia/soportedesk/
│       ├── auth/           # login, JWT, /auth/me, cambio de password, usuarios del sistema
│       ├── auditoria/      # registro y consulta de movimientos (filtro + endpoint de búsqueda)
│       ├── catalogo/       # Sedes, Dependencias, Subdependencias, TipoContrato, TipoLicencia, TipoBien, TipoImpresora
│       ├── common/         # FileStorageService y utilidades compartidas
│       ├── correos/        # Cuentas de correo institucional
│       ├── dashboard/      # Agregaciones para KPIs y gráficos
│       ├── equipos/        # Computadoras y equipos de cómputo
│       ├── exception/      # GlobalExceptionHandler
│       ├── herramientas/   # Ping y datos de inventario de red (diagnóstico)
│       ├── impresoras/     # Impresoras (incluye carga/descarga de drivers)
│       ├── licencias/      # Licencias de software + activaciones múltiples + cifrado
│       ├── security/       # JwtService, JwtAuthFilter, SecurityConfig
│       ├── usuariosred/    # Usuarios de red / Active Directory
│       ├── vpn/            # Credenciales VPN y antivirus
│       └── wifi/           # Redes WiFi
│   └── src/main/resources/
│       ├── schema.sql              # único archivo fuente de verdad del esquema (idempotente)
│       ├── data.sql                # usuarios admin/soporte por defecto
│       ├── data_catalogos.sql      # catálogos iniciales (sedes, dependencias, etc.)
│       └── application.yml        # configuración (perfiles dev/prod)
│
└── soportedesk-frontend/                   # SPA Angular 17
    └── src/app/
        ├── core/           # AuthService, guards (auth/admin/permiso), interceptor JWT, CatalogoService
        ├── features/       # un folder por módulo de negocio (ver tabla de rutas más abajo)
        ├── layout/         # shell, header, sidebar
        └── shared/         # GenericTable, UbicacionSelect, SectionCard, StatusBadge, VencimientoBadge, etc.
```

---

## 4. Módulos de Negocio

| Módulo | Qué gestiona | Particularidad |
|--------|--------------|-----------------|
| Equipos | Computadoras/laptops asignadas | relación opcional con usuario de red |
| Impresoras | Impresoras de red/USB | ficha técnica con pestañas, carga/descarga de driver, consumibles por color |
| Correos | Cuentas de correo institucional | vencimiento de contrato |
| Usuarios de Red | Cuentas AD | sede/dependencia/subdependencia/tipo de contrato obligatorios |
| VPN | Credenciales de acceso remoto + antivirus | generador de contraseñas integrado en el formulario |
| WiFi | Redes y claves WiFi | catálogo independiente, sin FKs |
| Licencias | Licencias de software | activaciones múltiples (cuenta+clave por activación) y serial multivalor; credenciales cifradas (AES/GCM) |
| Usuarios del Sistema | Cuentas de acceso a SoporteDesk (no confundir con Usuarios de Red) | rol ADMIN/SOPORTE + permisos de escritura por módulo |
| Catálogos | Sedes, dependencias, subdependencias, tipos de contrato/licencia/bien/impresora | solo ADMIN puede mantenerlos |
| Dashboard | KPIs y gráficos agregados | contadores, usuarios de red por ubicación, licencias por tipo |
| Auditoría | Bitácora de acciones (login, altas, bajas, ediciones) | búsqueda por módulo/acción/fecha |
| Herramientas | Ping a host + inventario de red local | utilidades de diagnóstico para mesa de soporte |

---

## 5. Modelo de Datos

**Motor:** SQL Server 2016+ · **Base:** `ssti` · **Puerto:** 1433
**Fuente de verdad:** `soportedesk-backend/src/main/resources/schema.sql` (script idempotente — crea la BD y cada tabla solo si no existe; seguro de re-ejecutar).

### Diagrama de relaciones (FK)

```
sedes ──< dependencias ──< subdependencias
            │                    │
            └────────────────────┴─── usuarios_red ──< equipos ──< vpn
                                       │                  │
                                       ├─── correos        └─── (vpn también referencia equipos)
                                       │
tipos_contrato ──< usuarios_red, correos
tipos_impresora ──< impresoras
tipos_licencia ──< licencias
tipos_bien ──< licencias
licencias ──< licencia_activaciones   (cascade delete)
usuarios ──< permisos                  (cascade delete)

impresoras → sedes / dependencias / subdependencias (opcional)
wifi              (sin FK — tabla independiente)
movimientos_auditoria (sin FK — registro plano de eventos)
```

### Tablas

| Tabla | Columnas relevantes | Notas |
|-------|---------------------|-------|
| `sedes` | id, nombre (UNIQUE) | catálogo base |
| `dependencias` | id, nombre, sede_id (FK) | |
| `subdependencias` | id, nombre, dependencia_id (FK) | |
| `tipos_contrato` | id, nombre (UNIQUE) | |
| `tipos_licencia` | id, nombre (UNIQUE) | seed: Ofimática, Diseño, Edición de Video, Sistema Operativo, Antivirus, Otro |
| `tipos_bien` | id, nombre (UNIQUE) | seed: Equipo, Intangible, Servicio |
| `tipos_impresora` | id, nombre (UNIQUE) | |
| `usuarios` | id, username (UNIQUE), password_hash (bcrypt), nombre, rol (`ADMIN`\|`SOPORTE`), activo | usuarios del sistema (login a SoporteDesk) |
| `permisos` | id, usuario_id (FK, cascade), modulo | permiso de escritura por módulo para rol SOPORTE |
| `movimientos_auditoria` | id, fecha, usuario, accion, modulo, metodo, ruta, entidad_id, estado_http, ip, detalle | bitácora; índices por fecha/usuario/modulo+accion |
| `usuarios_red` | id, usuario (UNIQUE), nombre, apellidos, grupo, unidad_organizativa, ultimo_login, estado, sede_id/dependencia_id/subdependencia_id/tipo_contrato_id (FK, todos obligatorios), fecha_fin_contrato, fecha_creacion, numero_contrato | cuentas AD |
| `equipos` | id, numero_serie (UNIQUE filtrado), codigo_patrimonial, codigo_inventario, tipo, marca, modelo, host, ip, usuario_red_id (FK opcional), sede/dependencia/subdependencia_id (FK opcionales), asignado, estado | |
| `impresoras` | id, marca, modelo, tipo_impresora_id (FK opcional), serie, codigo_inventario, codigo_patrimonial, tipo_conexion (USB/IP), ip, sede/dependencia/subdependencia_id (FK opcionales), estado, modelo_toner_negro/c/m/y, driver_nombre/version/so/archivo_path | sin columna `nombre` (se retiró en el rediseño de campos) |
| `correos` | id, usuario, nombre, apellidos, correo (UNIQUE), estado, sede/dependencia/subdependencia_id/tipo_contrato_id (FK obligatorios), fecha_fin_contrato, creado | |
| `licencias` | id, tipo_licencia_id (FK), descripcion, cuenta_activacion, clave_activacion (cifrada), serial_activacion (NVARCHAR(MAX)), orden_compra, anio, cantidad, tipo_bien_id (FK) | `cuenta_activacion`/`clave_activacion` reflejan la primera activación de `licencia_activaciones` |
| `licencia_activaciones` | id, licencia_id (FK, cascade), cuenta_activacion, clave_activacion (cifrada) | 1:N — una licencia puede tener varias activaciones |
| `vpn` | id, usuario_red_id (FK opcional), equipo_id (FK opcional), ip_asignada, vence, estado, tiene_antivirus, vencimiento_antivirus, usuario_vpn, credencial_vpn | |
| `wifi` | id, ssid, clave, ubicacion, tipo, estado | sin FK |

Todas las tablas con relaciones de ubicación llevan índices sobre cada FK; ver
el bloque `ÍNDICES` al final de `schema.sql` para el detalle completo.

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

### Dashboard — `/dashboard`
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/dashboard/counts` | Contadores de todos los recursos + usuarios de red inactivos |
| GET | `/dashboard/usuarios-red-por-ubicacion?nivel=sede\|dependencia` | Activos/inactivos agrupados por ubicación |
| GET | `/dashboard/licencias-por-tipo` | Suma de `cantidad` agrupada por tipo de licencia |

### Catálogos — `/catalogos/{sedes\|dependencias\|subdependencias\|tipos-contrato\|tipos-licencia\|tipos-bien\|tipos-impresora}`
Mismo patrón en los 7: GET lista (admite `search` y, en dependencias/subdependencias, el id del padre) y GET por id → cualquier autenticado; POST/PUT/DELETE → solo ADMIN.

### Resto de módulos de negocio (Equipos, Impresoras, Correos, Usuarios de Red, VPN, WiFi, Licencias)
Mismo patrón CRUD en todos — GET (lista con `search`, y por id) para cualquier autenticado; POST/PUT/DELETE → ADMIN o `WRITE_<modulo>`. Particularidades:

| Módulo | Ruta base | Extra |
|--------|-----------|-------|
| Equipos | `/equipos` | `GET /equipos/con-red` — solo equipos con usuario de red asignado |
| Impresoras | `/impresoras` | `POST /impresoras/{id}/driver` (multipart, sube driver) · `GET /impresoras/{id}/driver` (descarga) |
| Licencias | `/licencias` | `activaciones[]` viaja embebida en el body de POST/PUT; no hay sub-recurso propio |
| VPN | `/vpn` | `PATCH /vpn/{id}/antivirus` (cualquier autenticado) · `DELETE` exige ADMIN puro (no acepta `WRITE_vpn`) |

### Herramientas — `/herramientas`
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/herramientas/ping` | Hace ping a un host |
| GET | `/herramientas/inventario` | Inventario del equipo (CPU/RAM/etc.) |

(Sin `@PreAuthorize` propio — el control de acceso es solo de frontend, vía el permiso `herramientas`.)

---

## 7. Seguridad y Control de Acceso

- **JWT:** HMAC-SHA256, expira en 24h, payload con `username`/`rol`/`permisos[]`.
- **Roles:** `ADMIN` (acceso total) · `SOPORTE` (lectura por defecto, escritura solo donde tenga permiso).
- **Permisos por módulo** (tabla `permisos`, columna `modulo`):

| Valor en BD | Tipo | Habilita |
|-------------|------|----------|
| `equipos`, `impresoras`, `correos`, `licencias`, `vpn`, `wifi`, `usuarios-red` | escritura | crear/editar/eliminar en ese módulo |
| `credenciales-vpn` | escritura | ver/editar usuario y contraseña VPN dentro del formulario (control solo de frontend) |
| `auditoria` | vista | acceso a `/auditoria` |
| `herramientas` | vista | acceso a `/herramientas` |

ADMIN siempre tiene acceso total — los permisos de la tabla `permisos` solo aplican a SOPORTE.

---

## 8. Frontend — Rutas

| Ruta | Componente | Guard | Visible en sidebar para |
|------|-----------|-------|------------------------|
| `/login` | LoginComponent | — | — |
| `/dashboard` | DashboardComponent | auth | todos |
| `/equipos`, `/impresoras`, `/correos`, `/usuarios-red`, `/vpn`, `/wifi`, `/licencias` | *ListComponent respectivo | auth | todos (escritura condicionada por `canWrite('<modulo>')`) |
| `/usuarios-sistema` | UsuariosSistemaComponent | auth + admin | solo ADMIN |
| `/catalogos` | CatalogosComponent | auth + admin | solo ADMIN |
| `/auditoria` | AuditoriaComponent | auth + permiso `auditoria` | ADMIN o con permiso |
| `/herramientas` | HerramientasComponent | auth + permiso `herramientas` | ADMIN o con permiso |
| `**` | — | redirige a `/dashboard` | — |

**Componentes compartidos clave:** `GenericTableComponent` (tabla con búsqueda/orden), `UbicacionSelectComponent` (selector jerárquico Sede→Dependencia→Subdependencia), `SectionCardComponent`/`StatusBadgeComponent` (tarjetas y pastillas de estado reutilizables), `VencimientoBadgeComponent` (alerta de vencimiento), `VpnPasswordGeneratorComponent` (generador de contraseñas embebido en el formulario VPN), `IfAdminDirective`.

---

## 9. Despliegue

No hay Docker ni CI configurado todavía — esta es la guía recomendada para
desplegar manualmente en un servidor (Windows o Linux) dentro de la red INIA.

### 9.1 Base de datos (paso único, manual, en SSMS o `sqlcmd`)

```sql
-- 1. Crea la base 'ssti' y todas las tablas (idempotente, seguro de re-ejecutar)
:r schema.sql

-- 2. Carga los catálogos iniciales (sedes, dependencias, etc. de INIA)
:r data_catalogos.sql

-- 3. (Opcional) crea los usuarios admin/soporte por defecto si no existen
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

Variables de entorno recomendadas en el servidor (todas tienen un valor por
defecto en `application.yml`, pero **no deben usarse en producción**):

| Variable | Uso |
|----------|-----|
| `JWT_SECRET` | clave HMAC para firmar los JWT (base64, 32+ bytes) |
| `LICENCIA_ENCRYPTION_KEY` | clave AES para cifrar credenciales de licencias |
| `SPRING_DATASOURCE_USERNAME` / `SPRING_DATASOURCE_PASSWORD` | credenciales de SQL Server (hoy están hardcodeadas en `application.yml` bajo el perfil `dev` — para producción, sobrescribirlas por variable de entorno o crear un perfil `prod` separado que las lea solo de variables de entorno) |

Ejecutar como servicio:
- **Windows:** registrar con NSSM o una tarea programada que lance
  `java -jar soportedesk-backend-0.1.0.jar --spring.profiles.active=dev` (o el
  perfil que corresponda) y se reinicie ante fallos.
- **Linux:** unit de `systemd` apuntando al mismo comando.

Detrás, un reverse proxy (IIS, nginx o Apache) hacia `localhost:8080`, con TLS
terminado en el proxy.

### 9.3 Frontend (build estático)

```bash
cd soportedesk-frontend
npm install
ng build --configuration production
# genera dist/soportedesk-frontend/browser/
```

Servir esa carpeta como sitio estático detrás del mismo reverse proxy, con una
regla que reenvíe `/api/*` al backend (`localhost:8080`) — en desarrollo esto
ya lo hace `proxy.conf.json` vía `ng serve`; en producción lo resuelve el
proxy real (IIS URL Rewrite / nginx `location /api { proxy_pass ... }`).

### 9.4 Desarrollo local (resumen)

```bash
# Backend
cd soportedesk-backend && mvn spring-boot:run        # http://localhost:8080

# Frontend
cd soportedesk-frontend && npm install && ng serve   # http://localhost:4200, proxy a /api ya configurado
```

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
