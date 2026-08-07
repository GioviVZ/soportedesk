# Sistema de Soporte Técnico INIA

Aplicación interna para administrar equipos, impresoras, usuarios de red,
correos institucionales, licencias, VPN, WiFi, órdenes de servicio y auditoría
de movimientos, con permisos de lectura y edición por módulo.

La arquitectura, el modelo de datos y la API están documentados en
[`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md).

## Tecnologías

| Capa | Tecnología |
| --- | --- |
| Backend | Spring Boot 3.5.16, Java 17+, Spring Security y JWT |
| Datos | SQL Server (`ssti`) y lectura desde SQL Server/MySQL institucional |
| Frontend | Angular 22, TypeScript 6 y SCSS |
| Proxy | Nginx 1.30 con HTTPS |

## Estructura

```text
SistemadeSoporteTecnicoINIA/
├── deploy/                 # configuración reproducible de Nginx
├── docs/                   # arquitectura y decisiones técnicas
├── soportedesk-backend/    # API REST
├── soportedesk-frontend/   # SPA Angular
└── tools/                  # agente de inventario
```

## Configuración segura del backend

El backend no contiene contraseñas ni claves de producción en el repositorio.
Antes de iniciarlo deben existir estas variables de entorno:

```text
SSTI_DB_URL
SSTI_DB_USERNAME
SSTI_DB_PASSWORD
GLPI_DB_URL
GLPI_DB_USERNAME
GLPI_DB_PASSWORD
JWT_SECRET
LICENCIA_ENCRYPTION_KEY
AGENTE_INVENTARIO_TOKEN
```

`LICENCIA_ENCRYPTION_KEY` no debe rotarse sin migrar previamente las
credenciales de licencias cifradas. `JWT_SECRET` debe ser una clave Base64
aleatoria y su rotación cierra las sesiones existentes.

Las variables locales de esta instalación están guardadas en el perfil del
usuario de Windows, fuera de Git.

## Desarrollo local

Requisitos: Java 17 o superior, Node.js 20 o superior, npm y acceso a las bases
de datos institucionales.

Backend:

```powershell
cd soportedesk-backend
mvn spring-boot:run
```

Frontend:

```powershell
cd soportedesk-frontend
npm ci
npm start
```

La aplicación queda disponible en `http://localhost:4200`; el proxy de
desarrollo envía `/api` al backend en el puerto 8080.

## Verificación

```powershell
cd soportedesk-backend
mvn verify

cd ..\soportedesk-frontend
npm test -- --watch=false
npm run build
npm audit --omit=dev
```

`mvn verify` ejecuta pruebas unitarias e integrales. La compilación Angular se
genera en `soportedesk-frontend/dist/soportedesk-frontend/browser`.

## Despliegue web

La configuración usada por esta instalación se conserva en
[`deploy/nginx.conf`](deploy/nginx.conf). Incluye HTTPS, límite de adjuntos de
50 MB, compresión, encabezados de seguridad y un canal sin buffering para las
actualizaciones en tiempo real.

Después de compilar el frontend y el backend:

```powershell
cd C:\nginx-1.30.3
.\nginx.exe -t
.\nginx.exe -s reload
```

Si Nginx fue iniciado como administrador, la recarga también debe ejecutarse
desde una consola elevada.

## Datos y archivos persistentes

- Los scripts SQL están en `soportedesk-backend/src/main/resources/`.
- Los adjuntos se guardan bajo `soportedesk-backend/uploads/`.
- `uploads/`, configuraciones reales del agente, builds y logs no se versionan.
- No elimine ni reemplace esos directorios durante una limpieza del código.
