# Rediseño de campos del módulo Impresoras — Spec

**Fecha:** 2026-06-22
**Estado:** Aprobado por el usuario (sesión de brainstorming, 2026-06-22)

## Contexto

El módulo Impresoras (`soportedesk-backend/.../impresoras/`, `soportedesk-frontend/.../features/impresoras/`) modela cada impresora con: identificación (nombre, marca, modelo, ip), ubicación (sede/dependencia/subdependencia), estado, 7 campos de consumibles (tóner negro/cyan/magenta/amarillo, cartucho, drum, fusor) y 4 campos de driver (nombre, versión, S.O., path de archivo).

El usuario pidió ampliar/reordenar el set de campos para reflejar mejor cómo se inventarían las impresoras en INIA: agregar tipo de impresora, número de serie, código de inventario, código patrimonial, y un selector de tipo de conexión (USB/IP) en lugar de un campo IP suelto. También pidió simplificar la sección de consumibles.

**Dato clave que define el alcance de la migración:** se verificó por consulta directa a la base de producción (SQL Server, `172.16.26.16/ssti`) que la tabla `impresoras` tiene **0 filas**. No existe ningún dato existente que migrar o backfillear — el cambio de esquema es un `ALTER TABLE` limpio.

## Alcance

**Dentro de alcance:**
- Entidad `Impresora` (backend) y sus DTOs/servicio/controller/repositorio.
- Catálogo nuevo `TipoImpresora` (backend + frontend, en el módulo de Catálogos).
- Formulario, lista, ficha y resumen de consumibles del módulo Impresoras (frontend).
- Migración SQL de la tabla `impresoras` y creación de `tipos_impresora`.
- Tests de backend y frontend afectados por estos cambios.

**Fuera de alcance:**
- La pestaña "Driver" de la ficha (subida/descarga de archivo, `driverNombre`/`driverVersion`/`driverSo`/`driverArchivoPath`) **no se modifica**. Sigue funcionando exactamente igual.
- No se agregan datos semilla (seed) para `tipos_impresora`; el catálogo arranca vacío y se puebla desde la UI de Catálogos, igual que `TipoBien` cuando se introdujo.

## Campos finales de `Impresora`

| Campo | Tipo | Obligatorio | Estado respecto a hoy |
|---|---|---|---|
| `nombre` | String | Sí | sin cambio |
| `marca` | String | Sí | sin cambio |
| `modelo` | String | Sí | sin cambio |
| `tipoImpresora` | FK → `TipoImpresora` (nuevo catálogo) | No | **nuevo** |
| `serie` | String | No | **nuevo** |
| `codigoInventario` | String | No | **nuevo** |
| `codigoPatrimonial` | String | No | **nuevo** |
| `tipoConexion` | String (`"USB"` \| `"IP"`) | Sí, default `"USB"` | **nuevo** |
| `ip` | String | No — solo tiene sentido si `tipoConexion = "IP"` | sin cambio de tipo; ahora condicional |
| `sede` / `dependencia` / `subdependencia` | FK | No | sin cambio |
| `estado` | String (`Activa` / `En mantenimiento` / `De baja`) | Sí | sin cambio |
| `modeloTonerNegro` | String | No | sin cambio |
| `modeloTonerC` | String | No | sin cambio |
| `modeloTonerM` | String | No | sin cambio |
| `modeloTonerY` | String | No | sin cambio |
| `modeloCartucho` | — | — | **eliminado** |
| `modeloDrum` | — | — | **eliminado** |
| `modeloFusor` | — | — | **eliminado** |
| `driverNombre` / `driverVersion` / `driverSo` / `driverArchivoPath` | String | No | sin cambio (fuera de alcance) |

## Arquitectura — Backend

### Catálogo nuevo `TipoImpresora`

Calco exacto del patrón `TipoBien` (catálogo simple id+nombre):

- `com.inia.soportedesk.catalogo.TipoImpresora` — entidad JPA, tabla `tipos_impresora`, columnas `id` (PK identity) y `nombre` (`NVARCHAR(100) NOT NULL`).
- `com.inia.soportedesk.catalogo.TipoImpresoraRequest` — DTO con `@NotBlank private String nombre`.
- `com.inia.soportedesk.catalogo.TipoImpresoraRepository extends JpaRepository<TipoImpresora, Long>` con método `search(String search)` análogo al de `TipoBienRepository`.
- `com.inia.soportedesk.catalogo.TipoImpresoraService` — `findAll(search)`, `findById(id)` (lanza `ResourceNotFoundException` si no existe), `create(request)`, `update(id, request)`, `delete(id)` — copiado 1:1 de `TipoBienService`.
- `com.inia.soportedesk.catalogo.TipoImpresoraController` — `@RequestMapping("/api/catalogos/tipos-impresora")`, mismos verbos y mismas reglas `@PreAuthorize("hasRole('ADMIN')")` en `create`/`update`/`delete` que `TipoBienController`. `findAll`/`findById` sin restricción de rol (igual que el resto de catálogos).

### Entidad `Impresora`

En `Impresora.java`:
- Eliminar los campos `modeloCartucho`, `modeloDrum`, `modeloFusor` (y sus `@Column`).
- Agregar:
  ```java
  @ManyToOne(fetch = FetchType.EAGER)
  @JoinColumn(name = "tipo_impresora_id")
  private TipoImpresora tipoImpresora;

  private String serie;

  @Column(name = "codigo_inventario")
  private String codigoInventario;

  @Column(name = "codigo_patrimonial")
  private String codigoPatrimonial;

  @Column(name = "tipo_conexion", nullable = false)
  private String tipoConexion;
  ```
- `ip` se mantiene como está (`private String ip;`, sin `@Column(nullable=false)` — ya era nullable).

### `ImpresoraRequest`

- Eliminar `modeloCartucho`, `modeloDrum`, `modeloFusor`.
- Agregar `tipoImpresoraId` (Long, opcional), `serie` (String, opcional), `codigoInventario` (String, opcional), `codigoPatrimonial` (String, opcional), `tipoConexion` (String, `@NotBlank`).
- `ip` se mantiene sin `@NotBlank` (igual que hoy).

### `ImpresoraService`

- Inyectar `TipoImpresoraRepository` además de los repos existentes.
- En `copyFields(...)`:
  - Resolver `tipoImpresora` desde `request.getTipoImpresoraId()` igual que se resuelve `sede`/`dependencia`/`subdependencia` (si viene id, buscar o lanzar `ResourceNotFoundException`; si es null, dejar `null`).
  - Copiar `serie`, `codigoInventario`, `codigoPatrimonial` con el mismo helper `emptyToNull(...)` ya usado para los modelos de consumibles.
  - Copiar `tipoConexion` tal cual (es `@NotBlank`, siempre viene informado).
  - **Regla de integridad de datos:** si `tipoConexion` no es `"IP"`, forzar `impresora.setIp(null)` sin importar lo que traiga `request.getIp()`. Esto evita que un payload manipulado deje una IP "fantasma" en una impresora marcada como USB. Si `tipoConexion = "IP"`, copiar `emptyToNull(request.getIp())`.
  - Quitar las líneas que copian `modeloCartucho`/`modeloDrum`/`modeloFusor`.

### `ImpresoraRepository`

Ampliar el `@Query` de `search(...)` para incluir `serie`, `codigoInventario` y `codigoPatrimonial` en el `OR` (mismo patrón `LOWER(...) LIKE LOWER(CONCAT('%', :search, '%'))` que ya usan `nombre`/`marca`/`modelo`/`sede.nombre`/`dependencia.nombre`).

### Migración SQL

Nuevo archivo `soportedesk-backend/src/main/resources/alter_impresoras_rediseno_campos.sql`, mismo estilo que `alter_licencias_serial_max.sql` (comentario de cabecera, `USE ssti; GO`, ejecutar manualmente contra `172.16.26.16`):

```sql
USE ssti;
GO

CREATE TABLE dbo.tipos_impresora (
    id     BIGINT        NOT NULL IDENTITY(1,1),
    nombre NVARCHAR(100) NOT NULL,
    CONSTRAINT PK_tipos_impresora PRIMARY KEY (id)
);
GO

ALTER TABLE dbo.impresoras ADD
    tipo_impresora_id  BIGINT        NULL,
    serie              NVARCHAR(100) NULL,
    codigo_inventario  NVARCHAR(100) NULL,
    codigo_patrimonial NVARCHAR(100) NULL,
    tipo_conexion       NVARCHAR(10)  NOT NULL CONSTRAINT DF_impresoras_tipo_conexion DEFAULT 'USB';
GO

ALTER TABLE dbo.impresoras
    DROP COLUMN modelo_cartucho, modelo_drum, modelo_fusor;
GO

ALTER TABLE dbo.impresoras ADD
    CONSTRAINT FK_impresoras_tipo_impresora FOREIGN KEY (tipo_impresora_id) REFERENCES dbo.tipos_impresora (id);
GO

-- Verificación
SELECT COUNT(*) AS filas_impresoras FROM dbo.impresoras;
GO
```

No hace falta backfill: la tabla está vacía. El `DEFAULT 'USB'` en `tipo_conexion` solo es relevante si alguna vez se inserta una fila por SQL directo sin pasar por la API.

Además, actualizar el bloque `CREATE TABLE dbo.impresoras (...)` en `schema.sql` (líneas ~209-235) para que refleje el esquema final — esa tabla de referencia solo se usa si se levanta una base nueva desde cero, pero debe quedar consistente con la realidad post-migración.

## Arquitectura — Frontend

### `impresora.model.ts`

- `Impresora`: eliminar `modeloCartucho`, `modeloDrum`, `modeloFusor`; agregar `tipoImpresora: { id: number; nombre: string } | null`, `serie: string | null`, `codigoInventario: string | null`, `codigoPatrimonial: string | null`, `tipoConexion: string`.
- `ImpresoraRequest`: eliminar los mismos 3 campos; agregar `tipoImpresoraId: number | null`, `serie: string`, `codigoInventario: string`, `codigoPatrimonial: string`, `tipoConexion: string`.

### `catalogo.model.ts` / `catalogo.service.ts` (frontend, módulo Catálogos)

- Agregar `export interface TipoImpresora { id: number; nombre: string; }` en `catalogo.model.ts`.
- Agregar a `CatalogoService`: `getTiposImpresora()`, `createTipoImpresora(request)`, `updateTipoImpresora(id, request)`, `deleteTipoImpresora(id)` — copiados 1:1 del bloque `TiposBien` existente, apuntando a `${apiUrl}/tipos-impresora`.

### `catalogos.component.ts` / `.html`

- Agregar `'tiposImpresora'` al union type `CatalogoTab`.
- Agregar `tiposImpresora: TipoImpresora[] = []` y su carga en `loadAll()`.
- Agregar rama `tiposImpresora` en `submitSimple()` y en `deleteItem()`, calcadas de la rama `tiposBien`.
- Agregar botón de pestaña "Tipos de Impresora" y bloque `<ng-container *ngIf="activeTab === 'tiposImpresora'">` en el HTML, calcado del bloque "Tipos de Bien".

### `impresora-form.component.ts` / `.html`

- `form` (FormBuilder group): eliminar controles `modeloCartucho`, `modeloDrum`, `modeloFusor`; agregar `tipoImpresoraId: [null as number | null]`, `serie: ['']`, `codigoInventario: ['']`, `codigoPatrimonial: ['']`, `tipoConexion: ['USB', Validators.required]`.
- Cargar la lista de tipos de impresora (`CatalogoService.getTiposImpresora()`) para poblar un `<select>`.
- Lógica condicional de conexión: un `<select formControlName="tipoConexion">` con opciones `USB`/`IP`. El campo IP (`<input formControlName="ip">`) se envuelve en `*ngIf="form.value.tipoConexion === 'IP'"`. Suscribirse a `form.get('tipoConexion')!.valueChanges` y, cuando cambie a `'USB'`, hacer `form.patchValue({ ip: '' })` — así nunca se manda una IP residual al backend si el usuario alterna IP→USB→submit (defensa en profundidad junto con la regla del backend).
- `ngOnChanges`: agregar el patch de los 4 campos nuevos (`tipoImpresoraId: this.impresora.tipoImpresora?.id ?? null`, `serie`, `codigoInventario`, `codigoPatrimonial`, `tipoConexion: this.impresora.tipoConexion`) y quitar el patch de los 3 campos eliminados. Mismo ajuste en la rama `else` (reset a vacío/`'USB'`).
- Sección "Modelos de consumibles" en el HTML: quitar los 3 `<div class="field">` de Cartucho/Drum/Fusor; quedan los 4 de tóner sin cambios.

### `impresoras-list.component.ts`

Agregar dos columnas a `columns: TableColumn[]`: `{ key: 'tipoImpresora.nombre', label: 'Tipo' }` y `{ key: 'serie', label: 'Serie' }`, ubicadas después de `modelo` y antes de `ip`.

### `impresora-ficha.component.html`

En el tab "Instalación", agregar filas para Tipo (`impresora.tipoImpresora?.nombre`), Serie, Código de Inventario, Código Patrimonial, y Conexión — esta última mostrando `impresora.tipoConexion` y, si es `'IP'`, la IP a continuación (ej. `"IP — 10.0.0.50"`); si es `'USB'`, mostrar solo `"USB"` sin la fila de IP duplicada.

En el tab "Consumibles", `hasConsumibles()` (en el `.ts`) y el listado de filas en el `.html` quedan reducidos a los 4 tóner — quitar las 3 referencias a Cartucho/Drum/Fusor.

### `impresora-resumen.component.ts`

`CONSUMIBLE_DEFS` pasa de 7 a 4 entradas (solo Tóner Negro/Cyan/Magenta/Amarillo). El resto de `calcularResumen()` y los filtros de sede/dependencia no cambian.

## Manejo de errores y validación

- Backend: `tipoConexion` es `@NotBlank` en `ImpresoraRequest` — un valor fuera de `{"USB","IP"}` no se rechaza a nivel de Bean Validation (no hay un enum/catálogo para esto, igual que `estado` hoy no es un enum); la UI es la única barrera, consistente con cómo ya se trata `estado`. Esto es una decisión deliberada de seguir el patrón existente, no un descuido.
- Backend: si `tipoConexion = "IP"` y el usuario no llena el campo IP, se acepta igual (la IP queda `null`) — ningún campo nuevo es obligatorio salvo `tipoConexion` mismo, consistente con la decisión "los 3 campos de identificación son opcionales".
- Backend: `tipoImpresoraId` inexistente → `ResourceNotFoundException` (mismo patrón que `sedeId`/`dependenciaId` inválidos), mapeado a 404 por el `@ControllerAdvice` ya existente del proyecto.
- Frontend: el `<select>` de conexión solo ofrece `USB`/`IP`, por lo que no hace falta validación adicional ahí. El campo IP no lleva `Validators.required` ni siquiera cuando se elige IP — coherente con la decisión de mantener todo opcional salvo lo que ya era obligatorio.

## Testing

**Backend:**
- `TipoImpresoraServiceTest` (nuevo) — copiado 1:1 de `TipoBienServiceTest`: `findAll_withoutSearch_returnsAll`, `findById_whenNotFound_throwsResourceNotFoundException`, `create_savesTipoImpresoraFromRequest`.
- `ImpresoraServiceTest` (existente, requiere actualización):
  - `sampleRequest()`/`sampleImpresora(id)`: quitar `setModeloCartucho`/`setModeloDrum`, agregar `setTipoConexion("IP")`, `setSerie(...)`, `setCodigoInventario(...)`, `setCodigoPatrimonial(...)`.
  - `create_savesImpresoraWithModeloConsumibles` y `update_preservesDriverFields`: ajustar aserciones que hoy verifican `getModeloDrum()` (ya no existe).
  - Nuevo test `create_withTipoConexionUsb_forcesIpNull`: request con `tipoConexion="USB"` e `ip="10.0.0.50"` informado de todas formas → `result.getIp()` debe ser `null`.
  - Nuevo test `create_withTipoConexionIp_preservesIp`: request con `tipoConexion="IP"` e `ip="10.0.0.50"` → `result.getIp()` debe ser `"10.0.0.50"`.
  - Nuevo test `create_resolvesTipoImpresoraFromId`: mock de `TipoImpresoraRepository.findById(...)`, verificar que el resultado tiene el `TipoImpresora` resuelto.
- `ImpresoraControllerIT` (existente): `sampleRequest()`/`sampleImpresora()` ajustados igual que en el unit test (quitar drum/cartucho, agregar tipoConexion).
- `ImpresoraRepositoryTest` (nuevo) — `@DataJpaTest` + `@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)`, mismo patrón que `UsuarioRepositoryTest`. Verifica que `search("serie-valor")` y `search("codigo-valor")` devuelven la impresora guardada en el test (la transacción del `@DataJpaTest` hace rollback automático al terminar, sin dejar datos residuales en la base real apuntada por `application.yml`).

**Frontend:**
- `impresora-form.component.spec.ts` (nuevo si no existe, o ampliado): test de que el campo IP se oculta cuando `tipoConexion = 'USB'` y aparece cuando es `'IP'`; test de que cambiar de `'IP'` a `'USB'` limpia el valor de `ip` en el form.
- `impresora-resumen.component.spec.ts`: ajustar a los 4 `CONSUMIBLE_DEFS` (quitar aserciones sobre Cartucho/Drum/Fusor si existían).
- `catalogos.component.spec.ts`: extender con la pestaña `tiposImpresora` (carga, alta, edición, borrado) calcado del bloque de test de `tiposBien`.
- `impresora-ficha.component.spec.ts` (existente): ajustar `hasConsumibles()` y agregar caso para la fila de Conexión (USB vs IP).

## Resumen de decisiones tomadas en el brainstorming

1. **Tipo de impresora:** catálogo nuevo (tabla + FK), no enum ni texto libre — consistente con `TipoLicencia`/`TipoBien`.
2. **Conexión USB/IP:** campo nuevo `tipoConexion`; si es USB, `ip` queda `null` (forzado por el backend, no solo por la UI).
3. **Campo `nombre`:** se mantiene (identificador legible en listado/búsqueda).
4. **Campo `estado`:** se mantiene (Activa/En mantenimiento/De baja).
5. **Consumibles:** se mantienen los 4 campos de tóner separados (Negro, Cyan, Magenta, Amarillo); se eliminan Cartucho, Drum y Fusor.
6. **Serie / Código de Inventario / Código Patrimonial:** los 3 opcionales.
7. **Pestaña Driver:** intacta, fuera de alcance.
8. **Migración:** sin backfill — la tabla `impresoras` está vacía en producción (verificado por consulta directa).
