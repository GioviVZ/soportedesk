# Módulo Equipos Asignados — fuente GLPI (vw_inv_computers_full)

## Contexto

El módulo `equipos` actual es un CRUD manual contra la tabla `equipos` en la BD `ssti`: los usuarios
registran a mano tipo, marca, modelo, serie, código patrimonial, usuario asignado, sede y dependencia.
Estos datos están desincronizados respecto a lo que registra el agente GLPI automáticamente.

La BD `glpi` (MariaDB `172.16.25.18:3306`) contiene la vista `vw_inv_computers_full`, creada por el
equipo de TI, que consolida 947 equipos con hardware completo (CPU, RAM, disco, monitores),
usuario de dominio asignado, sede/dependencia/unidad y estado de borrado lógico.
Adicionalmente la tabla `glpi_plugin_fields_computerteclados` registra teclados con sus códigos
patrimoniales, y `glpi_items_softwareversions` + `glpi_softwares` exponen el software instalado
por equipo (237 188 asignaciones en total; hasta 724 programas por equipo).

## Decisiones confirmadas

- El módulo pasa a ser **solo lectura**: se eliminan crear/editar/eliminar.
- La tabla `equipos` de `ssti` **no se borra** — queda sin uso hasta borrado posterior.
- Las entidades JPA locales (`Equipo.java`, `EquipoRequest.java`, `EquipoRepository.java`) sí se
  eliminan. `EquipoService.java` y `EquipoController.java` se reescriben.
- **Tercer datasource JPA** (MariaDB, mismo patrón que `GestionTiDataSourceConfig`) — consulta en
  vivo, sin replicación. Datos frescos; el módulo depende de que GLPI esté disponible.
- **Periféricos mostrados:** solo Monitores (ya en la vista) y Teclados (plugin_fields). Los
  periféricos USB auto-detectados por el agente GLPI se descartan (ruido).
- **Software:** se muestra en la página de detalle con filtro cliente-side; no en la lista principal.
- **Página de detalle** (`/equipos/:id`) en vez de modal — más espacio para software (700+ items).
- **KPI cards** en la lista principal.

## Backend

### Tercer datasource — GLPI MariaDB

**`pom.xml`** — nuevo driver:
```xml
<dependency>
    <groupId>com.mysql</groupId>
    <artifactId>mysql-connector-j</artifactId>
    <scope>runtime</scope>
</dependency>
```

**`application.yml`** — bloque adicional (perfil `dev`):
```yaml
glpi:
  datasource:
    url: jdbc:mysql://172.16.25.18:3306/glpi?useSSL=false&serverTimezone=America/Lima
    username: usrbd
    password: ${SSTI_DB_PASSWORD}
    driver-class-name: com.mysql.cj.jdbc.Driver
```

### Paquete `com.inia.soportedesk.glpi`

`GlpiDataSourceConfig` (`@Configuration`) declara:
- `DataSource` vía `@ConfigurationProperties(prefix = "glpi.datasource")`
- `LocalContainerEntityManagerFactoryBean` con `packagesToScan = "com.inia.soportedesk.glpi"`,
  `HibernateJpaVendorAdapter` con `dialect = org.hibernate.dialect.MySQLDialect`
- `PlatformTransactionManager` propio (`glpiTransactionManager`)
- `@EnableJpaRepositories(basePackages = "com.inia.soportedesk.glpi",
  entityManagerFactoryRef = "glpiEntityManagerFactory",
  transactionManagerRef = "glpiTransactionManager")`

### Entidad `VwInvComputerFull`

```
@Entity @Immutable @Table(name = "vw_inv_computers_full")
@Id → computerID (Long, columna "ComputerID")
```

Campos mapeados (todos `@Column` o `@Formula` según naming):

| Campo Java | Columna vista | Tipo |
|---|---|---|
| `computerID` | `ComputerID` | Long (**@Id**) |
| `nombreEquipo` | `Nombre_Equipo` | String |
| `numeroserie` | `Numero_Serie` | String (nullable) |
| `codigoInterno` | `Codigo_Interno` | String (nullable) |
| `usuarioContacto` | `UsuarioContacto` | String |
| `usuarioTelefono` | `UsuarioTelefono` | String (nullable) |
| `ipEquipo` | `IP_Equipo` | String (nullable) |
| `sedeNombre` | `Sede_Nombre` | String |
| `sedeNombreCompleto` | `Sede_Nombre_Completo` | String |
| `oficinaId` | `OficinaID` | String (nombre de dependencia) |
| `unidadId` | `UnidadID` | String (nombre de subdirección) |
| `fabricanteEquipo` | `Fabricante_Equipo` | String |
| `modeloEquipo` | `Modelo_Equipo` | String |
| `tipoEquipo` | `Tipo_Equipo` | String |
| `cpuModelos` | `CPU_Modelos` | String |
| `cpuConteo` | `CPU_Conteo` | Long |
| `cpuNucleos` | `CPU_Nucleos` | BigDecimal |
| `cpuHilos` | `CPU_Hilos` | BigDecimal |
| `cpuFrecuenciaMax` | `CPU_Frecuencia_Max` | Long (MHz) |
| `ramModulos` | `RAM_Modulos` | Long |
| `ramTotalGb` | `RAM_Total_GB` | BigDecimal |
| `ramFrecuenciaMax` | `RAM_Frecuencia_Max` | String |
| `ramTipos` | `RAM_Tipos` | String |
| `diskCantidad` | `DISK_Cantidad` | Long |
| `diskTotalGb` | `DISK_Total_GB` | BigDecimal |
| `diskTipos` | `DISK_Tipos` | String |
| `monCantidad` | `MON_Cantidad` | Long |
| `monNombres` | `MON_Nombres` | String (nullable) |
| `monModelos` | `MON_Modelos` | String (nullable) |
| `monFabricantes` | `MON_Fabricantes` | String (nullable) |
| `monSeriales` | `MON_Seriales` | String (nullable) |
| `fechaCreacion` | `Fecha_Creacion` | LocalDateTime |
| `ultimaActualizacion` | `Ultima_Actualizacion` | LocalDateTime |
| `ultimoEncendido` | `Ultimo_Encendido` | LocalDateTime (nullable) |
| `eliminado` | `Eliminado` | Integer |
| `uuidEquipo` | `UUID_Equipo` | String (nullable) |

### Entidad `GlpiTeclado`

```
@Entity @Immutable @Table(name = "glpi_plugin_fields_computerteclados")
@Id → id (Long)
```

| Campo Java | Columna | Tipo |
|---|---|---|
| `id` | `id` | Long (**@Id**) |
| `itemsId` | `items_id` | Long (FK al ComputerID) |
| `marcafield` | `marcafield` | String |
| `modelofield` | `modelofield` | String |
| `nmerodeseriefield` | `nmerodeseriefield` | String |
| `cdigodeinventariofield` | `cdigodeinventariofield` | String |
| `cdigopatrimonialfield` | `cdigopatrimonialfield` | String |

### Proyección `SoftwareRow` (interfaz)

```java
public interface SoftwareRow {
    String getSoftware();
    String getVersion();
    LocalDate getFechaInstalacion();
}
```

### Repositorio `VwInvComputerFullRepository`

```java
@Repository
interface VwInvComputerFullRepository extends JpaRepository<VwInvComputerFull, Long> {

    @Query("""
        SELECT v FROM VwInvComputerFull v
        WHERE v.eliminado = 0
          AND (:search IS NULL OR LOWER(v.nombreEquipo)    LIKE LOWER(CONCAT('%',:search,'%'))
                               OR LOWER(v.usuarioContacto) LIKE LOWER(CONCAT('%',:search,'%')))
          AND (:sede IS NULL OR v.sedeNombre = :sede)
          AND (:tipo IS NULL OR v.tipoEquipo = :tipo)
        ORDER BY v.nombreEquipo
    """)
    List<VwInvComputerFull> findFiltered(String search, String sede, String tipo);

    @Query("SELECT DISTINCT v.sedeNombre FROM VwInvComputerFull v WHERE v.eliminado = 0 ORDER BY v.sedeNombre")
    List<String> findDistinctSedes();

    @Query("SELECT DISTINCT v.tipoEquipo FROM VwInvComputerFull v WHERE v.eliminado = 0 ORDER BY v.tipoEquipo")
    List<String> findDistinctTipos();

    @Query(value = """
        SELECT s.name AS software, sv.name AS version, iss.date_install AS fechaInstalacion
        FROM glpi_items_softwareversions iss
        JOIN glpi_softwareversions sv ON sv.id = iss.softwareversions_id
        JOIN glpi_softwares s ON s.id = sv.softwares_id
        WHERE iss.itemtype = 'Computer'
          AND iss.items_id = :computerId
          AND iss.is_deleted = 0
        ORDER BY s.name
    """, nativeQuery = true)
    List<SoftwareRow> findSoftwareByComputerId(@Param("computerId") Long computerId);
}
```

### Repositorio `GlpiTecladoRepository`

```java
@Repository
interface GlpiTecladoRepository extends JpaRepository<GlpiTeclado, Long> {
    Optional<GlpiTeclado> findByItemsId(Long computerId);
}
```

### DTOs

**`EquipoKpisDto`**
```java
record EquipoKpisDto(
    long totalActivos,
    long desktopCount,
    long laptopCount,
    long otrosCount,
    long sedeCentralCount,
    long eeasCount
) {}
```

**`EquipoDetalleResponse`**
```java
record EquipoDetalleResponse(
    VwInvComputerFull equipo,
    List<SoftwareRow> software,
    GlpiTeclado teclado           // nullable
) {}
```

### Reescritura `EquipoController` y `EquipoService`

`EquipoController` queda con 5 endpoints (se eliminan POST / PUT / DELETE):

```
GET  /api/equipos?search=&sede=&tipo=   → List<VwInvComputerFull>
GET  /api/equipos/kpis                  → EquipoKpisDto
GET  /api/equipos/sedes                 → List<String>
GET  /api/equipos/tipos                 → List<String>
GET  /api/equipos/{id}                  → EquipoDetalleResponse
```

`EquipoService.getKpis()` calcula los conteos con streams sobre la lista filtrada
(`Eliminado = 0`): Desktop → `tipoEquipo == "Desktop"`, Laptop → `"Laptop"`,
Otros → el resto; Sede Central → `sedeNombre == "SEDE CENTRAL"`, EEAs → el resto.

Autorización sin cambios: `hasRole('ADMIN') || hasAuthority('READ_equipos')`.

**Archivos eliminados:** `Equipo.java`, `EquipoRequest.java`, `EquipoRepository.java`
**Archivos reescritos:** `EquipoService.java`, `EquipoController.java`
**Archivos nuevos (paquete glpi):** `GlpiDataSourceConfig.java`, `VwInvComputerFull.java`,
`GlpiTeclado.java`, `VwInvComputerFullRepository.java`, `GlpiTecladoRepository.java`,
`SoftwareRow.java`, `EquipoKpisDto.java`, `EquipoDetalleResponse.java`

## Frontend

### Modelo `equipo.model.ts` (reescrito)

```typescript
export interface EquipoResumen {
  computerID: number;
  nombreEquipo: string;
  usuarioContacto: string;
  sedeNombre: string;
  oficinaId: string;       // nombre de la dependencia (campo mal nombrado en vista GLPI)
  unidadId: string;        // nombre de la subdirección
  tipoEquipo: string;
  fabricanteEquipo: string;
  modeloEquipo: string;
  cpuModelos: string;
  ramTotalGb: number;
  diskTotalGb: number;
  ipEquipo: string | null;
  numeroserie: string | null;
  codigoInterno: string | null;
}

export interface EquipoDetalle extends EquipoResumen {
  cpuConteo: number;
  cpuNucleos: number;
  cpuHilos: number;
  cpuFrecuenciaMax: number;
  ramModulos: number;
  ramFrecuenciaMax: string;
  ramTipos: string;
  diskCantidad: number;
  diskTipos: string;
  monCantidad: number;
  monNombres: string | null;
  monModelos: string | null;
  monFabricantes: string | null;
  monSeriales: string | null;
  ultimoEncendido: string | null;
  uuidEquipo: string | null;
}

export interface EquipoSoftware {
  software: string;
  version: string;
  fechaInstalacion: string | null;
}

export interface EquipoTeclado {
  marcafield: string;
  modelofield: string;
  nmerodeseriefield: string;
  cdigodeinventariofield: string;
  cdigopatrimonialfield: string;
}

export interface EquipoDetalleResponse {
  equipo: EquipoDetalle;
  software: EquipoSoftware[];
  teclado: EquipoTeclado | null;
}

export interface EquipoKpis {
  totalActivos: number;
  desktopCount: number;
  laptopCount: number;
  otrosCount: number;
  sedeCentralCount: number;
  eeasCount: number;
}
```

### Servicio `equipo.service.ts` (reescrito)

```typescript
getAll(filters: { search?: string; sede?: string; tipo?: string }): Observable<EquipoResumen[]>
getKpis(): Observable<EquipoKpis>
getSedes(): Observable<string[]>
getTipos(): Observable<string[]>
getDetalle(id: number): Observable<EquipoDetalleResponse>
```

Eliminados: `create`, `update`, `delete`, `getConRed`, `getById`.

### Componente `EquiposListComponent` (reescrito)

**Estructura visual (de arriba hacia abajo):**

1. **KPI cards (6):**

| Card | Valor | Color |
|---|---|---|
| Total Activos | `totalActivos` | azul |
| Desktop | `desktopCount` | índigo |
| Laptop | `laptopCount` | violeta |
| Otros | `otrosCount` | gris |
| Sede Central | `sedeCentralCount` | verde |
| EEAs | `eeasCount` | naranja |

2. **Barra de filtros:**
   - Buscador texto libre (debounce 300ms) — filtra `nombreEquipo` / `usuarioContacto`
   - Dropdown **Sede** — opciones desde `/api/equipos/sedes`
   - Dropdown **Tipo** — opciones desde `/api/equipos/tipos`
   - Botón **Limpiar filtros**

3. **Tabla (`GenericTableComponent`, `canEdit=false`, `canDelete=false`, `canView=true`):**

| Label columna | Campo | Nota |
|---|---|---|
| Equipo | `nombreEquipo` | |
| Usuario | `usuarioContacto` | strip `@INIA-RED` suffix en template |
| Sede | `sedeNombre` | |
| Dependencia | `oficinaId` | |
| Tipo | `tipoEquipo` | badge |
| Fabricante / Modelo | computed | `fabricanteEquipo + ' ' + modeloEquipo` |
| CPU | `cpuModelos` | truncado a 30 chars |
| RAM | `ramTotalGb` | `X GB` |
| Disco | `diskTotalGb` | `X GB` |
| IP | `ipEquipo` | |

Al pulsar **👁 ver** → `router.navigate(['/equipos', item.computerID])`.

**Estado del componente:**
- Signals: `items`, `kpis`, `sedes`, `tipos`, `selectedSede`, `selectedTipo`, `searchTerm`
- `ngOnInit` → `loadKpis()` + `loadSedes()` + `loadTipos()` en paralelo + `load()` sin filtros
- Cualquier cambio de filtro → `load()` con parámetros actuales

### Componente `EquipoDetailComponent` (nuevo, ruta `/equipos/:id`)

**Layout:**
- Botón **← Volver** → `router.navigate(['/equipos'])`
- Header: `nombreEquipo` + badge `tipoEquipo`
- **Asignación:** usuario (sin dominio), teléfono, sede, dependencia, unidad
- **Hardware:** CPU (modelo, conteo, núcleos, hilos, frecuencia), RAM (total GB, módulos, frecuencia, tipo), Disco (total GB, cantidad, tipo), IP, último encendido, UUID, N° serie, código interno
- **Monitores:** tabla con nombre/modelo/fabricante/serial parseados desde los campos `|`-delimitados de la vista — o "Sin monitores registrados" si `monCantidad = 0`
- **Teclado:** campos marca/modelo/serial/cód.inventario/cód.patrimonial — o "No registrado" si `teclado = null`
- **Software instalado:** tabla con input de filtro local (debounce 300ms sobre `software` nombre), columnas: Nombre, Versión, Fecha instalación. Total de programas en el header de sección.

`ngOnInit` → `equipoService.getDetalle(id)` → asigna `equipo`, `software`, `teclado`.

### Ruta nueva

En `app.routes.ts`:
```typescript
{ path: 'equipos/:id', component: EquipoDetailComponent, canActivate: [authGuard] }
```

### Archivos

**Eliminados:** `equipo-form.component.ts`, `equipo-form.component.html`, `equipo-form.component.scss`
**Reescritos:** `equipo.model.ts`, `equipo.service.ts`, `equipos-list.component.ts`,
`equipos-list.component.html`, `equipos-list.component.scss`
**Nuevos:** `equipo-detail.component.ts`, `equipo-detail.component.html`,
`equipo-detail.component.scss`

## Testing

- `EquipoServiceTest`: verifica que `findFiltered` delega correctamente al repositorio con los
  parámetros de filtro y que `getKpis()` calcula correctamente los conteos por tipo y sede.
- No se requiere `*ControllerIT` para esta iteración (módulo de solo lectura sin escritura a BD
  principal).
