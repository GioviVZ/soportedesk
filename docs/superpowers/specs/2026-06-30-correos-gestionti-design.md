# Módulo Correos — fuente GestionTI_INIA (vw_GW_Dashboard)

## Contexto

El módulo `correos` existente es un CRUD manual contra la tabla `correos` en la BD `ssti`: los usuarios
ingresan a mano usuario, nombre, apellidos, correo, sede, dependencia, subdependencia, tipoContrato y
fechaFinContrato. Estos datos están desincronizados respecto a la realidad de Google Workspace.

La BD `GestionTI_INIA` (mismo servidor SQL Server `172.16.26.16:1433`) contiene la vista
`vw_GW_Dashboard`, sincronizada desde Google Workspace Admin SDK, con 1200 usuarios y campos enriquecidos:
estado real, modalidad de contrato, unidad organizativa, uso de almacenamiento por servicio (Gmail/Drive/
Fotos), 2FA, último inicio de sesión y métricas de licenciamiento por categoría (Sede Central / EEAs).

## Decisiones confirmadas

- El módulo pasa a ser **solo lectura**: se elimina crear/editar/eliminar. `fechaFinContrato` y el
  badge de vencimiento se descartan (no existen en la fuente).
- La tabla `correos` de `ssti` **no se borra en esta iteración** — queda sin uso hasta borrado
  posterior. Las entidades JPA locales (`Correo.java`, `CorreoRepository.java`, `CorreoRequest.java`)
  sí se eliminan del código.
- **Consulta en vivo** (segundo datasource, mismo patrón que `inventario-ti`) — sin replicación/job
  de sync. Datos siempre frescos; el módulo depende de que `GestionTI_INIA` esté disponible.
- Jerarquía organizativa del view (`OficinaPadre` → `Oficina`) se muestra en la UI con las etiquetas
  "Dependencia" / "Subdependencia" para coherencia visual con el resto del sistema.
- `LicenciasTotales` viene **hardcodeado a 1200** en el view — si cambia el número de licencias
  Google Workspace habrá que actualizar el view en la BD `GestionTI_INIA`.

## Backend

### Segundo datasource

`application.yml` gana un bloque bajo el perfil `dev`, junto al datasource `ssti` existente:

```yaml
gestionti:
  datasource:
    url: jdbc:sqlserver://172.16.26.16:1433;databaseName=GestionTI_INIA;encrypt=false;trustServerCertificate=true
    username: sa
    password: $Lipknot86
    driver-class-name: com.microsoft.sqlserver.jdbc.SQLServerDriver
```

### Paquete `com.inia.soportedesk.gestiontiinia`

Una clase `GestionTiDataSourceConfig` (anotada `@Configuration`) declara manualmente:

- `DataSource` vía `@ConfigurationProperties(prefix = "gestionti.datasource")`
- `LocalContainerEntityManagerFactoryBean` con `packagesToScan = "com.inia.soportedesk.gestiontiinia"`
- `PlatformTransactionManager` propio (`gestiontiTransactionManager`)
- `@EnableJpaRepositories(basePackages = "com.inia.soportedesk.gestiontiinia", entityManagerFactoryRef = "gestiontiEntityManagerFactory", transactionManagerRef = "gestiontiTransactionManager")`

El datasource principal (`ssti`) **no se declara como bean manual** — Spring Boot lo sigue
autoconfigurando como primario, igual que hoy.

### Entidad `VwGwDashboard`

```
@Entity @Immutable @Table(name = "vw_GW_Dashboard")
@Id → email (String, nvarchar 200)
```

Campos mapeados (todos los del view):

| Campo Java | Columna view | Tipo |
|---|---|---|
| `licenciasTotales` | `LicenciasTotales` | int |
| `licenciasAsignadas` | `LicenciasAsignadas` | Integer |
| `licenciasDisponibles` | `LicenciasDisponibles` | Integer |
| `unidad` | `Unidad` | String |
| `sedeId` | `SedeID` | int |
| `sede` | `Sede` | String |
| `oficinaPadre` | `OficinaPadre` | String |
| `oficina` | `Oficina` | String |
| `estado` | `Estado` | String |
| `modalidad` | `Modalidad` | String |
| `employeeId` | `EmployeeID` | String (nullable — 284/1200 nulos) |
| `ouid` | `OUID` | int |
| `orgUnitPath` | `OrgUnitPath` | String |
| `email` | `Email` | String (**@Id**) |
| `nombreCompleto` | `NombreCompleto` | String |
| `verificacion2Pasos` | `Verificacion2Pasos` | String |
| `ultimoInicioSesion` | `UltimoInicioSesion` | LocalDateTime (nullable — 8/1200 nulos) |
| `emailUsageMB` | `EmailUsageMB` | BigDecimal |
| `driveUsageMB` | `DriveUsageMB` | BigDecimal |
| `photosUsageMB` | `PhotosUsageMB` | BigDecimal |
| `storageUsedMB` | `StorageUsedMB` | BigDecimal |
| `totalUsoMB` | `TotalUsoMB` | BigDecimal |
| `categoria` | `Categoria` | String |
| `totalUsuariosCategoria` | `TotalUsuariosCategoria` | Integer |

### Repositorio `VwGwDashboardRepository`

```java
@Repository
interface VwGwDashboardRepository extends JpaRepository<VwGwDashboard, String> {

    @Query("""
        SELECT v FROM VwGwDashboard v
        WHERE (:search IS NULL OR LOWER(v.email) LIKE LOWER(CONCAT('%',:search,'%'))
                               OR LOWER(v.nombreCompleto) LIKE LOWER(CONCAT('%',:search,'%')))
          AND (:sede     IS NULL OR v.sede     = :sede)
          AND (:estado   IS NULL OR v.estado   = :estado)
          AND (:modalidad IS NULL OR v.modalidad = :modalidad)
    """)
    List<VwGwDashboard> findFiltered(String search, String sede, String estado, String modalidad);
}
```

### DTO `CorreoKpisDto`

```java
record CorreoKpisDto(
    int licenciasTotales,
    int licenciasAsignadas,
    int licenciasDisponibles,
    long activasCount,
    long suspendidasCount,
    int sedeCentralCount,
    int eeasCount
) {}
```

`activasCount` y `suspendidasCount` se calculan con `COUNT` sobre el view filtrando por `Estado`.
`sedeCentralCount` y `eeasCount` se leen del campo `totalUsuariosCategoria` del primer registro de
cada `Categoria` (el view ya los embebe por fila vía CTE).

### Endpoint adicional `GET /api/correos/sedes`

Devuelve la lista de valores distintos de `Sede` para poblar el dropdown del filtro frontend:
```java
@Query("SELECT DISTINCT v.sede FROM VwGwDashboard v ORDER BY v.sede")
List<String> findDistinctSedes();
```

### Reescritura `CorreoService` y `CorreoController`

`CorreoController` queda con 3 endpoints (se eliminan POST / PUT / DELETE):

```
GET  /api/correos?search=&sede=&estado=&modalidad=  → List<VwGwDashboard>
GET  /api/correos/kpis                               → CorreoKpisDto
GET  /api/correos/sedes                              → List<String>
```

Los tres endpoints están en `CorreoController`. El de `/sedes` no requiere
parámetros y devuelve la lista ordenada alfabéticamente.

Autorización sin cambios: `hasRole('ADMIN') || hasAuthority('READ_correos')`.

**Archivos eliminados:** `Correo.java`, `CorreoRepository.java`, `CorreoRequest.java`.
**Archivos reescritos:** `CorreoService.java`, `CorreoController.java`.

## Frontend

### Modelo `correo.model.ts`

```typescript
export interface Correo {
  email: string;
  nombreCompleto: string;
  sede: string;
  oficinaPadre: string;     // mostrado como "Dependencia"
  oficina: string;          // mostrado como "Subdependencia"
  modalidad: string;
  estado: string;
  verificacion2Pasos: string;
  ultimoInicioSesion: string | null;
  emailUsageMB: number;
  driveUsageMB: number;
  storageUsedMB: number;
  totalUsoMB: number;
  employeeId: string | null;
}

export interface CorreoKpis {
  licenciasTotales: number;
  licenciasAsignadas: number;
  licenciasDisponibles: number;
  activasCount: number;
  suspendidasCount: number;
  sedeCentralCount: number;
  eeasCount: number;
}
```

### Servicio `correo.service.ts`

```typescript
getAll(filters: { search?: string; sede?: string; estado?: string; modalidad?: string }): Observable<Correo[]>
getKpis(): Observable<CorreoKpis>
getSedes(): Observable<string[]>
```

### Componente `CorreosListComponent`

**Estructura visual (de arriba hacia abajo):**

1. **Fila de KPI cards (6 cards):**

| Card | Valor | Color sugerido |
|---|---|---|
| Licencias Totales | `licenciasTotales` | azul (neutral) |
| Activas | `activasCount` | verde |
| Suspendidas | `suspendidasCount` | rojo/naranja |
| Disponibles | `licenciasDisponibles` | gris |
| Sede Central | `sedeCentralCount` | azul oscuro |
| EEAs | `eeasCount` | azul claro |

2. **Barra de filtros:**
   - Buscador texto libre (debounce 300ms) — filtra sobre Email / NombreCompleto
   - Dropdown **Sede** — opciones cargadas desde `/api/correos/sedes`
   - Dropdown **Estado** — `['Activo', 'Suspendido']` (hardcodeado)
   - Dropdown **Modalidad** — `['CAP', 'CAS', 'EXTERNO', 'GENERICO', 'PRACTICANTE']` (hardcodeado)
   - Botón **Limpiar filtros**

3. **Tabla (GenericTableComponent, sin canEdit/canDelete):**

| Label columna | key |
|---|---|
| Email | `email` |
| Nombre Completo | `nombreCompleto` |
| Sede | `sede` |
| Dependencia | `oficinaPadre` |
| Subdependencia | `oficina` |
| Modalidad | `modalidad` |
| Estado | `estado` (badge Activo=verde / Suspendido=rojo) |
| 2FA | `verificacion2Pasos` |
| Último Acceso | `ultimoInicioSesion` (fecha formateada) |

**Cambios al estado del componente:**
- Signals/propiedades: `items`, `kpis`, `sedes`, `selectedSede`, `selectedEstado`, `selectedModalidad`, `searchTerm`
- Al cambiar cualquier filtro o buscador → llama `load()` con los parámetros actuales
- `ngOnInit` dispara `loadKpis()` y `loadSedes()` en paralelo, más `load()` inicial sin filtros

**Archivos eliminados:** `correo-form.component.ts`, `correo-form.component.html`.
**Archivos reescritos:** `correos-list.component.ts`, `correos-list.component.html`,
`correos-list.component.scss`, `correo.model.ts`, `correo.service.ts`.

### Sin cambios en

- Ruta `/correos` (app.routes.ts)
- Sidebar entry
- Permiso `correos` en BD y en `MODULOS` (usuario-sistema.model.ts)
- `canWrite` check (simplemente no habrá botones que lo usen)

## Testing

- Test unitario `CorreoServiceTest`: verifica que `findFiltered` delega correctamente al repositorio
  con los parámetros de filtro.
- Test unitario `CorreoKpisTest`: verifica que los conteos de activas/suspendidas son correctos y
  que `sedeCentralCount`/`eeasCount` se leen del campo `totalUsuariosCategoria` del view.
- No se requiere `*ControllerIT` para esta iteración (módulo de solo lectura sin escritura a BD
  principal).
