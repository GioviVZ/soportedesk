# SoporteDesk INIA — Diseño de implementación

Fecha: 2026-06-14

## 1. Contexto y objetivo

Implementar como sistema real (backend + frontend + base de datos) la maqueta
`maquetasoportedesk-inia.jsx`: un panel de gestión de recursos de TI para INIA
con los módulos Dashboard, Licencias Office, Correos institucionales, Usuarios
de Red/AD, VPN, Claves WiFi, Impresoras (con ficha técnica y drivers) y Equipos
asignados.

## 2. Arquitectura general

- **Backend**: Spring Boot 3, Java 17, Maven. Carpeta/repo separado:
  `soportedesk-backend`.
- **Frontend**: Angular 17+ (standalone components). Carpeta/repo separado:
  `soportedesk-frontend`.
- **Base de datos**: MySQL local (instalación existente, no Docker).
- **Autenticación**: login propio (usuario/contraseña) con Spring Security +
  JWT. Roles `ADMIN` y `SOPORTE` almacenados en BD, viajan en el token.
- **Archivos de drivers de impresoras**: almacenados en el filesystem del
  servidor backend (`/uploads/drivers/...`); la BD guarda solo la ruta y
  metadatos.
- **Entorno de desarrollo**: backend con `mvn spring-boot:run`, frontend con
  `ng serve`, MySQL corriendo localmente.

## 3. Modelo de datos

### 3.1 Autenticación

```
usuarios (sistema)
- id, username (unique), password_hash, nombre, rol (ADMIN | SOPORTE), activo
```

### 3.2 Catálogos administrables (solo ADMIN puede crear/editar/eliminar)

```
sedes            (id, nombre)
dependencias     (id, sede_id FK -> sedes, nombre)
subdependencias  (id, dependencia_id FK -> dependencias, nombre)
tipos_contrato   (id, nombre)   -- ej: CAS, CAP, Terceros, Practicante
```

### 3.3 Módulos funcionales

```
licencias
- id, cantidad, licencia, correo, clave, orden_compra, anio

correos
- id, usuario, nombre, correo, estado
- sede_id FK, dependencia_id FK, subdependencia_id FK, tipo_contrato_id FK
- fecha_fin_contrato (date, nullable)
- creado (date)

usuarios_red
- id, usuario, nombre, grupo, ultimo_login, estado
- sede_id FK, dependencia_id FK, subdependencia_id FK, tipo_contrato_id FK
- fecha_fin_contrato (date, nullable)

vpn
- id, usuario, nombre, tipo, ip_asignada, vence (date), estado
  -- "vence" cubre tanto el vencimiento de la licencia VPN/antivirus
  -- como el fin de contrato del usuario; se le aplica la misma alerta visual

wifi
- id, ssid, clave, ubicacion, tipo, estado

impresoras
- id, nombre, marca, modelo, ip, piso, area, estado
- toner_negro, toner_c, toner_m, toner_y, cartucho, drum, fusor
- driver_nombre, driver_version, driver_so, driver_archivo_path

equipos
- id, codigo, tipo, marca, modelo, usuario, area, asignado (date), estado
```

### 3.4 Alertas visuales por vencimiento

Calculado en el frontend a partir de `fecha_fin_contrato` (correos,
usuarios_red) y `vence` (vpn):

- Fecha ya pasada → badge rojo "Vencido"
- Fecha dentro de los próximos 30 días → badge amarillo "Por vencer"
- En otro caso → sin badge adicional

No se implementan notificaciones por correo en esta fase, solo indicadores
visuales en tabla/dashboard.

## 4. Backend (Spring Boot 3 + Java 17)

### 4.1 Estructura de paquetes

```
com.inia.soportedesk
├── config        (SecurityConfig, JwtFilter, CORS)
├── auth          (AuthController: login, /me)
├── catalogo      (Sedes, Dependencias, Subdependencias, TiposContrato)
├── licencias
├── correos
├── usuariosred
├── vpn
├── wifi
├── impresoras
├── equipos
├── dashboard      (conteos por módulo)
├── exception      (GlobalExceptionHandler)
└── common         (FileStorageService para drivers de impresoras)
```

Cada módulo funcional sigue el mismo patrón interno: `Entity`, `Repository`
(Spring Data JPA), `Service`, `Controller`, `DTO` (request/response).

### 4.2 Endpoints — patrón CRUD común

Para `licencias`, `correos`, `usuarios_red`, `vpn`, `wifi`, `impresoras`,
`equipos`:

- `GET /api/{modulo}?search=texto` — listar (cualquier rol autenticado),
  filtro de texto opcional sobre los campos relevantes
- `GET /api/{modulo}/{id}` — detalle
- `POST /api/{modulo}` — crear (`ADMIN`)
- `PUT /api/{modulo}/{id}` — editar (`ADMIN`)
- `DELETE /api/{modulo}/{id}` — eliminar (`ADMIN`)

### 4.3 Catálogos

`/api/catalogos/sedes`, `/api/catalogos/dependencias?sedeId=`,
`/api/catalogos/subdependencias?dependenciaId=`,
`/api/catalogos/tipos-contrato`:

- Lectura (`GET`) disponible para cualquier rol autenticado (para llenar
  selects en formularios)
- Escritura (`POST`/`PUT`/`DELETE`) solo `ADMIN`

### 4.4 Impresoras — endpoints adicionales

- `POST /api/impresoras/{id}/driver` — subir archivo de driver (multipart,
  `ADMIN`), guarda en `/uploads/drivers/`, actualiza
  `driver_archivo_path`/`driver_nombre`/`driver_version`/`driver_so`
- `GET /api/impresoras/{id}/driver` — descargar archivo del driver

### 4.5 Auth

- `POST /api/auth/login` — recibe usuario/contraseña, devuelve JWT + rol
- `GET /api/auth/me` — datos del usuario autenticado (desde el token)

### 4.6 Dashboard

- `GET /api/dashboard/counts` — conteo de registros por módulo (para las
  tarjetas del dashboard)

### 4.7 Seguridad

- Spring Security con filtro JWT (`Authorization: Bearer <token>`)
- Contraseñas hasheadas con BCrypt
- `@PreAuthorize("hasRole('ADMIN')")` en endpoints de creación/edición/borrado
  y en gestión de catálogos

### 4.8 Validación y errores

- Bean Validation (`@NotBlank`, `@Email`, `@Size`, etc.) en los DTOs de
  entrada
- `@ControllerAdvice` global devuelve JSON consistente:
  `{ timestamp, status, message, errors }`

## 5. Frontend (Angular 17+, standalone components)

### 5.1 Estructura

```
src/app
├── core/
│   ├── auth/        (AuthService, authGuard, jwtInterceptor)
│   └── models/      (interfaces TS para cada entidad y catálogo)
├── layout/
│   ├── sidebar/     (módulos, colapsable — igual a la maqueta)
│   └── header/      (usuario logueado, rol, logout)
├── shared/
│   ├── generic-table/   (columnas configurables, búsqueda, acciones
│   │                      Ver/Editar/Eliminar — equivalente a `Tabla`)
│   ├── modal/, field/, badge/, info-row/, section-title/
│   └── vencimiento-badge/ (pinta "Vencido"/"Por vencer" según fecha)
├── features/
│   ├── dashboard/
│   ├── licencias/ , correos/ , usuarios-red/ , vpn/ , wifi/ , equipos/
│   │     (cada uno: componente lista + formulario + service HTTP)
│   ├── impresoras/  (lista + ficha técnica con tabs Instalación /
│   │                  Consumibles / Driver, incluyendo upload/download)
│   └── catalogos/   (gestión de sedes/dependencias/subdependencias/
│   │                  tipos de contrato — solo ADMIN)
└── auth/
    └── login/
```

### 5.2 Estilo

Se conserva la paleta y look visual de la maqueta (verdes/amarillo
institucional INIA) mediante variables SCSS globales, replicando los estilos
inline definidos en el JSX (`C.green`, `C.greenDark`, `C.yellow`, etc.).

### 5.3 Autenticación y permisos

- `authGuard` protege todas las rutas salvo `/login`
- `jwtInterceptor` agrega el header `Authorization` y redirige a `/login` en
  401
- Directiva `*ifAdmin` (basada en el rol del JWT) oculta botones
  Agregar/Editar/Eliminar y la sección "Subir nuevo driver" para rol
  `SOPORTE` — equivalente al `isAdmin` de la maqueta, pero derivado del
  usuario autenticado real

### 5.4 Formularios de Correos / Usuarios de Red

Selects en cascada: Sede → Dependencia → Subdependencia, cargados desde
`/api/catalogos/*`, más select de Tipo de Contrato y campo de fecha
`fecha_fin_contrato`.

## 6. Fuera de alcance (esta fase)

- Notificaciones por correo de vencimientos (solo alertas visuales)
- Autenticación contra Active Directory/LDAP (se usa login propio JWT)
- Docker / contenedores (entorno local directo)

## 7. Testing

- Backend: pruebas unitarias de servicios (JUnit + Mockito), pruebas de
  repositorio con base de datos de prueba
- Frontend: pruebas de componentes con Jasmine/Karma (configuración por
  defecto de Angular) para los componentes compartidos críticos
  (generic-table, vencimiento-badge)
