# Sistema de Soporte Técnico INIA (SoporteDesk)

Sistema de gestión de activos y soporte de TI para INIA. Permite administrar equipos, impresoras, usuarios de red (AD), correos institucionales, licencias de software, VPN y redes WiFi, con control de acceso por roles.

---

## Tabla de Contenidos

- [Stack Tecnológico](#stack-tecnológico)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Levantamiento del Sistema](#levantamiento-del-sistema)
- [Base de Datos](#base-de-datos)
- [API REST — Endpoints](#api-rest--endpoints)
- [Control de Acceso (Roles y Permisos)](#control-de-acceso-roles-y-permisos)
- [Frontend — Módulos y Rutas](#frontend--módulos-y-rutas)
- [Usuarios por Defecto](#usuarios-por-defecto)

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Backend | Spring Boot 3.2.5 · Java 17 · Spring Security + JWT |
| ORM | Spring Data JPA · Hibernate (`ddl-auto: none`) |
| Base de datos | SQL Server 2016+ — base `ssti` |
| Frontend | Angular 17.3 · TypeScript 5.4 · SCSS |
| Build | Maven (backend) · Angular CLI / npm (frontend) |

---

## Estructura del Proyecto

```
SistemadeSoporteTecnicoINIA/
├── soportedesk-backend/                   # API REST Spring Boot
│   └── src/main/java/com/inia/soportedesk/
│       ├── auth/           # Autenticación JWT y gestión de usuarios del sistema
│       ├── catalogo/       # Sedes, Dependencias, Subdependencias, TipoContrato
│       ├── common/         # FileStorageService, utilidades compartidas
│       ├── correos/        # Cuentas de correo institucional
│       ├── dashboard/      # Métricas y contadores
│       ├── equipos/        # Computadoras y equipos de cómputo
│       ├── exception/      # GlobalExceptionHandler
│       ├── impresoras/     # Impresoras (incluye carga/descarga de drivers)
│       ├── licencias/      # Licencias de software
│       ├── security/       # JwtService, JwtAuthFilter, SecurityConfig
│       ├── usuariosred/    # Usuarios de red / Active Directory
│       ├── vpn/            # Credenciales VPN y antivirus
│       └── wifi/           # Redes WiFi
│
└── soportedesk-frontend/                  # SPA Angular 17
    └── src/app/
        ├── core/           # AuthService, guards, interceptor JWT, CatalogService
        ├── features/       # Módulo por cada entidad de negocio
        ├── layout/         # Shell, header, sidebar
        └── shared/         # GenericTable, UbicacionSelect, IfAdminDirective, etc.
```

---

## Levantamiento del Sistema

### Requisitos previos

- Java 17+
- Node.js 18+ y npm
- SQL Server 2016+ accesible en red

### Base de datos (paso previo, manual)

Ejecutar en SSMS antes del primer arranque:

```sql
-- 1. Crear tablas (idempotente con IF NOT EXISTS / IF OBJECT_ID)
-- Archivo: soportedesk-backend/src/main/resources/schema.sql

-- 2. Poblar catálogos INIA
-- Archivo: soportedesk-backend/src/main/resources/data_catalogos.sql
```

El backend usa `ddl-auto: none` — Hibernate no crea ni modifica tablas automáticamente.

### Backend

```bash
cd soportedesk-backend
# Variable de entorno opcional:
#   JWT_SECRET   (base64, 32+ bytes)
mvn spring-boot:run
# Escucha en http://localhost:8080
```

La conexión a SQL Server se configura en `application.yml` (perfil `dev`):

```yaml
spring.datasource.url: jdbc:sqlserver://172.16.26.16:1433;databaseName=ssti;encrypt=false;trustServerCertificate=true
spring.datasource.username: sa
spring.datasource.password: <PASSWORD>
```

### Frontend

```bash
cd soportedesk-frontend
npm install
ng serve
# Escucha en http://localhost:4200
```

---

## Base de Datos

**Nombre:** `ssti` · **Motor:** SQL Server 2016+ · **Puerto:** 1433

### Diagrama de relaciones (FK)

```
sedes ──< dependencias ──< subdependencias
            │                    │
            └────────────────────┴─── usuarios_red
                                       │
                                       ├─── equipos ──< vpn
                                       │
                                       └─── correos

tipos_contrato ──< usuarios_red
tipos_contrato ──< correos

impresoras → sedes / dependencias / subdependencias
licencias (sin FK — tabla independiente)
wifi      (sin FK — tabla independiente)
```

### Tablas y columnas

#### `sedes`
| Columna | Tipo | Notas |
|---------|------|-------|
| id | BIGINT PK | auto-increment |
| nombre | VARCHAR NOT NULL | |

#### `dependencias`
| Columna | Tipo | Notas |
|---------|------|-------|
| id | BIGINT PK | auto-increment |
| nombre | VARCHAR NOT NULL | |
| sede_id | BIGINT FK | → `sedes.id` |

#### `subdependencias`
| Columna | Tipo | Notas |
|---------|------|-------|
| id | BIGINT PK | auto-increment |
| nombre | VARCHAR NOT NULL | |
| dependencia_id | BIGINT FK | → `dependencias.id` |

#### `tipos_contrato`
| Columna | Tipo | Notas |
|---------|------|-------|
| id | BIGINT PK | auto-increment |
| nombre | VARCHAR NOT NULL | |

#### `usuarios` _(usuarios del sistema)_
| Columna | Tipo | Notas |
|---------|------|-------|
| id | BIGINT PK | auto-increment |
| username | VARCHAR UNIQUE NOT NULL | |
| password_hash | VARCHAR NOT NULL | bcrypt |
| nombre | VARCHAR NOT NULL | |
| rol | ENUM(`ADMIN`, `SOPORTE`) NOT NULL | |
| activo | BOOLEAN NOT NULL | default true |

#### `permisos`
| Columna | Tipo | Notas |
|---------|------|-------|
| id | BIGINT PK | auto-increment |
| usuario_id | BIGINT FK | → `usuarios.id` |
| modulo | VARCHAR(50) NOT NULL | e.g. `equipos`, `vpn` |
| UNIQUE | (usuario_id, modulo) | |

#### `usuarios_red` _(Active Directory / red)_
| Columna | Tipo | Notas |
|---------|------|-------|
| id | BIGINT PK | auto-increment |
| usuario | VARCHAR NOT NULL UNIQUE | username AD |
| nombre | VARCHAR NOT NULL | nombres |
| apellidos | VARCHAR NOT NULL | apellidos |
| grupo | VARCHAR NOT NULL | grupo AD |
| unidad_organizativa | VARCHAR(150) | nullable, OU de AD |
| ultimo_login | DATETIME2 | nullable |
| estado | VARCHAR NOT NULL | |
| sede_id | BIGINT FK | → `sedes.id` |
| dependencia_id | BIGINT FK | → `dependencias.id` |
| subdependencia_id | BIGINT FK | → `subdependencias.id` |
| tipo_contrato_id | BIGINT FK | → `tipos_contrato.id` |
| fecha_fin_contrato | DATE | nullable |
| fecha_creacion | DATE | nullable |
| numero_contrato | VARCHAR(100) | nullable |

#### `equipos`
| Columna | Tipo | Notas |
|---------|------|-------|
| id | BIGINT PK | auto-increment |
| numero_serie | VARCHAR UNIQUE | nullable |
| codigo_patrimonial | VARCHAR | nullable |
| codigo_inventario | VARCHAR | nullable |
| tipo | VARCHAR NOT NULL | PC, Laptop, etc. |
| marca | VARCHAR NOT NULL | |
| modelo | VARCHAR NOT NULL | |
| host | VARCHAR | nullable |
| ip | VARCHAR | nullable |
| usuario_red_id | BIGINT FK | → `usuarios_red.id`, nullable |
| sede_id | BIGINT FK | → `sedes.id`, nullable |
| dependencia_id | BIGINT FK | → `dependencias.id`, nullable |
| subdependencia_id | BIGINT FK | → `subdependencias.id`, nullable |
| asignado | DATE | fecha de asignación, nullable |
| estado | VARCHAR NOT NULL | |

#### `impresoras`
| Columna | Tipo | Notas |
|---------|------|-------|
| id | BIGINT PK | auto-increment |
| marca | VARCHAR NOT NULL | |
| modelo | VARCHAR NOT NULL | |
| tipo_impresora_id | BIGINT FK | → `tipos_impresora.id`, nullable |
| serie | VARCHAR | nullable |
| codigo_inventario | VARCHAR | nullable |
| codigo_patrimonial | VARCHAR | nullable |
| tipo_conexion | VARCHAR NOT NULL | USB/IP |
| ip | VARCHAR | nullable |
| sede_id | BIGINT FK | → `sedes.id`, nullable |
| dependencia_id | BIGINT FK | → `dependencias.id`, nullable |
| subdependencia_id | BIGINT FK | → `subdependencias.id`, nullable |
| estado | VARCHAR NOT NULL | |
| modelo_toner_negro | VARCHAR | nullable |
| modelo_toner_c | VARCHAR | nullable (cyan) |
| modelo_toner_m | VARCHAR | nullable (magenta) |
| modelo_toner_y | VARCHAR | nullable (yellow) |
| driver_nombre | VARCHAR | nullable |
| driver_version | VARCHAR | nullable |
| driver_so | VARCHAR | nullable (sistema operativo) |
| driver_archivo_path | VARCHAR | ruta del archivo en servidor |

#### `correos`
| Columna | Tipo | Notas |
|---------|------|-------|
| id | BIGINT PK | auto-increment |
| usuario | VARCHAR NOT NULL | |
| nombre | VARCHAR NOT NULL | nombres |
| apellidos | VARCHAR NOT NULL | apellidos |
| correo | VARCHAR NOT NULL UNIQUE | dirección de email |
| estado | VARCHAR NOT NULL | |
| sede_id | BIGINT FK | → `sedes.id` |
| dependencia_id | BIGINT FK | → `dependencias.id` |
| subdependencia_id | BIGINT FK | → `subdependencias.id` |
| tipo_contrato_id | BIGINT FK | → `tipos_contrato.id` |
| fecha_fin_contrato | DATE | nullable |
| creado | DATE NOT NULL | |

#### `licencias`
| Columna | Tipo | Notas |
|---------|------|-------|
| id | BIGINT PK | auto-increment |
| cantidad | INT NOT NULL | |
| licencia | VARCHAR NOT NULL | nombre del producto |
| correo | VARCHAR NOT NULL | contacto/registro |
| clave | VARCHAR NOT NULL | clave de licencia |
| orden_compra | VARCHAR NOT NULL | número de OC |
| anio | VARCHAR NOT NULL | año de compra |

#### `vpn`
| Columna | Tipo | Notas |
|---------|------|-------|
| id | BIGINT PK | auto-increment |
| usuario_red_id | BIGINT FK | → `usuarios_red.id`, nullable |
| equipo_id | BIGINT FK | → `equipos.id`, nullable |
| ip_asignada | VARCHAR | IP VPN asignada |
| vence | DATE | fecha de vencimiento VPN |
| estado | VARCHAR NOT NULL | |
| tiene_antivirus | BOOLEAN | nullable |
| vencimiento_antivirus | DATE | nullable |
| usuario_vpn | VARCHAR | nullable |
| credencial_vpn | VARCHAR | nullable |

#### `wifi`
| Columna | Tipo | Notas |
|---------|------|-------|
| id | BIGINT PK | auto-increment |
| ssid | VARCHAR NOT NULL | nombre de red |
| clave | VARCHAR NOT NULL | contraseña |
| ubicacion | VARCHAR NOT NULL | |
| tipo | VARCHAR NOT NULL | |
| estado | VARCHAR NOT NULL | |

---

## API REST — Endpoints

Base URL: `http://localhost:8080/api`

### Autenticación

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/auth/login` | Login — devuelve JWT + rol + permisos |
| GET | `/auth/me` | Info del usuario autenticado actual |

### Catálogos (solo ADMIN puede crear/editar/eliminar)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/catalogos/sedes` | Listar sedes (query: `search`) |
| GET | `/catalogos/sedes/{id}` | Obtener sede por ID |
| POST | `/catalogos/sedes` | Crear sede |
| PUT | `/catalogos/sedes/{id}` | Actualizar sede |
| DELETE | `/catalogos/sedes/{id}` | Eliminar sede |
| GET | `/catalogos/dependencias` | Listar dependencias (query: `sedeId`, `search`) |
| GET | `/catalogos/dependencias/{id}` | Obtener dependencia |
| POST | `/catalogos/dependencias` | Crear |
| PUT | `/catalogos/dependencias/{id}` | Actualizar |
| DELETE | `/catalogos/dependencias/{id}` | Eliminar |
| GET | `/catalogos/subdependencias` | Listar (query: `dependenciaId`, `search`) |
| GET | `/catalogos/subdependencias/{id}` | Obtener |
| POST | `/catalogos/subdependencias` | Crear |
| PUT | `/catalogos/subdependencias/{id}` | Actualizar |
| DELETE | `/catalogos/subdependencias/{id}` | Eliminar |
| GET | `/catalogos/tipos-contrato` | Listar (query: `search`) |
| GET | `/catalogos/tipos-contrato/{id}` | Obtener |
| POST | `/catalogos/tipos-contrato` | Crear |
| PUT | `/catalogos/tipos-contrato/{id}` | Actualizar |
| DELETE | `/catalogos/tipos-contrato/{id}` | Eliminar |

### Usuarios del sistema (solo ADMIN)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/usuarios-sistema` | Listar todos |
| GET | `/usuarios-sistema/{id}` | Obtener por ID |
| POST | `/usuarios-sistema` | Crear usuario |
| PUT | `/usuarios-sistema/{id}` | Actualizar usuario |
| DELETE | `/usuarios-sistema/{id}` | Eliminar usuario |

### Usuarios de Red / AD

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/usuarios-red` | Listar (query: `search`) |
| GET | `/usuarios-red/{id}` | Obtener por ID |
| POST | `/usuarios-red` | Crear |
| PUT | `/usuarios-red/{id}` | Actualizar |
| DELETE | `/usuarios-red/{id}` | Eliminar |

### Equipos

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/equipos` | Listar (query: `search`) |
| GET | `/equipos/con-red` | Equipos con usuario de red asignado |
| GET | `/equipos/{id}` | Obtener por ID |
| POST | `/equipos` | Crear |
| PUT | `/equipos/{id}` | Actualizar |
| DELETE | `/equipos/{id}` | Eliminar |

### Impresoras

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/impresoras` | Listar (query: `search`) |
| GET | `/impresoras/{id}` | Obtener por ID |
| POST | `/impresoras` | Crear |
| PUT | `/impresoras/{id}` | Actualizar |
| DELETE | `/impresoras/{id}` | Eliminar |
| POST | `/impresoras/{id}/driver` | Subir driver (multipart: `file`, `version`, `so`) |
| GET | `/impresoras/{id}/driver` | Descargar driver |

### Correos Institucionales

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/correos` | Listar (query: `search`) |
| GET | `/correos/{id}` | Obtener por ID |
| POST | `/correos` | Crear |
| PUT | `/correos/{id}` | Actualizar |
| DELETE | `/correos/{id}` | Eliminar |

### Licencias de Software

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/licencias` | Listar (query: `search`) |
| GET | `/licencias/{id}` | Obtener por ID |
| POST | `/licencias` | Crear |
| PUT | `/licencias/{id}` | Actualizar |
| DELETE | `/licencias/{id}` | Eliminar |

### VPN

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/vpn` | Listar (query: `search`) |
| GET | `/vpn/{id}` | Obtener por ID |
| POST | `/vpn` | Crear (ADMIN o permiso WRITE_vpn) |
| PUT | `/vpn/{id}` | Actualizar completo (ADMIN o permiso) |
| PATCH | `/vpn/{id}/antivirus` | Actualizar solo info de antivirus (SOPORTE) |
| DELETE | `/vpn/{id}` | Eliminar (solo ADMIN) |

### WiFi

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/wifi` | Listar (query: `search`) |
| GET | `/wifi/{id}` | Obtener por ID |
| POST | `/wifi` | Crear |
| PUT | `/wifi/{id}` | Actualizar |
| DELETE | `/wifi/{id}` | Eliminar |

### Dashboard

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/dashboard/counts` | Contadores de todos los recursos (KPI cards) |

---

## Control de Acceso (Roles y Permisos)

### Roles

| Rol | Descripción |
|-----|-------------|
| `ADMIN` | Acceso total a todos los módulos y catálogos |
| `SOPORTE` | Acceso de lectura por defecto; acceso de escritura por módulo según permisos |

### Permisos por módulo (tabla `permisos`)

Un usuario SOPORTE puede tener permisos de escritura en módulos específicos. Los valores de `modulo` son:

`equipos` · `impresoras` · `correos` · `licencias` · `vpn` · `wifi` · `usuarios-red`

El rol SOPORTE también puede ejecutar `PATCH /vpn/{id}/antivirus` sin permiso explícito (flujo de actualización de antivirus en mesa de soporte).

### JWT

- Algoritmo: HMAC-SHA256
- Expiración: 24 horas
- Payload incluye: `username`, `rol`, `permisos[]`
- Se envía en header: `Authorization: Bearer <token>`

---

## Frontend — Módulos y Rutas

| Ruta Angular | Componente | Guard | Descripción |
|-------------|-----------|-------|-------------|
| `/login` | LoginComponent | — | Inicio de sesión |
| `/dashboard` | DashboardComponent | auth | Tarjetas KPI con contadores |
| `/equipos` | EquiposListComponent | auth | Gestión de equipos |
| `/impresoras` | ImpresorasListComponent | auth | Gestión de impresoras + ficha técnica + drivers |
| `/correos` | CorreosListComponent | auth | Correos institucionales |
| `/usuarios-red` | UsuariosRedListComponent | auth | Usuarios de red / AD |
| `/vpn` | VpnListComponent | auth | Credenciales VPN y antivirus |
| `/licencias` | LicenciasListComponent | auth | Licencias de software |
| `/wifi` | WifiListComponent | auth | Redes WiFi |
| `/usuarios-sistema` | UsuariosSistemaComponent | auth + admin | Gestión de usuarios del sistema |
| `/catalogos` | CatalogosComponent | auth + admin | Catálogos organizacionales |

### Componentes compartidos relevantes

- **GenericTableComponent** — Tabla reutilizable con búsqueda y paginación
- **UbicacionSelectComponent** — Selector jerárquico Sede → Dependencia → Subdependencia
- **VencimientoBadgeComponent** — Badge con estado de vencimiento (VPN, contratos)
- **IfAdminDirective** — Oculta elementos de UI para usuarios no-ADMIN

---

## Usuarios por Defecto

Creados en `data.sql` al iniciar por primera vez:

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| `admin` | `admin` | ADMIN |
| `soporte` | `admin` | SOPORTE |

> Cambiar las contraseñas en producción actualizando el hash bcrypt en la tabla `usuarios`.

---

## Configuración de Archivos

Los drivers de impresoras se almacenan en:
```
soportedesk-backend/uploads/drivers/
```

Tamaño máximo de archivo: **50 MB** (configurable en `application.yml`).
