# Sistema Gestión de Soporte Informático INIA

Sistema interno de gestión de activos y soporte de TI para INIA: equipos,
impresoras, usuarios de red (AD), correos institucionales, licencias de
software, credenciales VPN, redes WiFi, auditoría de movimientos y
herramientas de diagnóstico — con control de acceso por roles y permisos
por módulo.

📖 **Documentación técnica completa (modelo de datos, API REST, permisos,
rutas y guía de despliegue):** [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md)

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Backend | Spring Boot 3.2.5 · Java 17 · Spring Security + JWT |
| Base de datos | SQL Server 2016+ — base `ssti` |
| Frontend | Angular 17.3 · TypeScript 5.4 · SCSS |
| Build | Maven (backend) · Angular CLI / npm (frontend) |

## Estructura del Proyecto

```
SistemadeSoporteTecnicoINIA/
├── docs/ARQUITECTURA.md       # arquitectura, modelo de datos, API, despliegue
├── soportedesk-backend/        # API REST Spring Boot
└── soportedesk-frontend/       # SPA Angular
```

Detalle de carpetas internas, módulos de negocio y componentes compartidos →
ver [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md#3-estructura-del-proyecto).

---

## Desarrollo Local

### Requisitos previos

- Java 17+
- Node.js 18+ y npm
- SQL Server 2016+ accesible en red

### 1. Base de datos (una sola vez, en SSMS)

```sql
-- Archivos en soportedesk-backend/src/main/resources/
:r schema.sql            -- crea la BD 'ssti' y todas las tablas (idempotente)
:r data_catalogos.sql    -- carga catálogos iniciales de INIA
:r data.sql              -- crea usuarios admin/soporte por defecto
```

El backend usa `ddl-auto: none` — Hibernate no crea ni modifica tablas
automáticamente; `schema.sql` es la única fuente de verdad del esquema.

### 2. Backend

```bash
cd soportedesk-backend
mvn spring-boot:run
# http://localhost:8080
```

La conexión a SQL Server se configura en `application.yml` (perfil `dev`).

### 3. Frontend

```bash
cd soportedesk-frontend
npm install
ng serve
# http://localhost:4200 (proxy a /api ya configurado)
```

---

## Despliegue

No hay Docker/CI configurado — el flujo recomendado es: empaquetar el backend
como JAR (`mvn clean package`), correrlo como servicio detrás de un reverse
proxy, y servir el build de producción del frontend (`ng build --configuration
production`) como sitio estático junto a él.

Guía paso a paso completa, variables de entorno recomendadas y notas de
seguridad → [`docs/ARQUITECTURA.md#9-despliegue`](docs/ARQUITECTURA.md#9-despliegue).

---

## Usuarios por Defecto

Creados por `data.sql` en el primer arranque:

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| `admin` | `admin` | ADMIN |
| `soporte` | `admin` | SOPORTE |

> Cambiar ambas contraseñas en el primer login (Sistema → Cambiar contraseña).

## Testing

```bash
cd soportedesk-backend && mvn test          # unit + integración
cd soportedesk-frontend && npx ng test --watch=false
```

---

## Configuración de Archivos

Los drivers de impresoras se almacenan en `soportedesk-backend/uploads/drivers/`.
Tamaño máximo de archivo: **50 MB** (configurable en `application.yml`).
