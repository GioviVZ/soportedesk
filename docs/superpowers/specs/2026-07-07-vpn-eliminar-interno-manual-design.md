# Módulo VPN — eliminar titular INTERNO_MANUAL

## Contexto

El diseño anterior ([2026-07-07-vpn-titular-externo-design.md](2026-07-07-vpn-titular-externo-design.md))
agregó un flujo de captura manual para "personal de INIA sin cuenta AD" (`titular_tipo =
'INTERNO_MANUAL'`) como una de dos opciones de fallback cuando la búsqueda AD no encuentra
resultados, junto a "Tercero externo" (`EXTERNO`).

Feedback operativo: en la práctica, si una persona no aparece en la búsqueda AD, siempre es porque
es un tercero externo — no existe el caso real de "personal INIA sin cuenta AD" que este flujo
buscaba cubrir. El botón "Personal de INIA" en el prompt de fallback no debe existir; solo debe
quedar "Tercero externo".

Los 405 registros de la carga histórica (`docs/superpowers/migrations/2026-07-07-vpn-carga-historica-2026.sql`)
usan `titular_tipo = 'INTERNO_MANUAL'` con datos reales de sede/dependencia/tipo de contrato — no
son un caso de mal etiquetado, son personal INIA genuino sin cuenta AD registrada en este sistema.
Decisión explícita del usuario: eliminar `INTERNO_MANUAL` del sistema por completo, incluyendo esos
405 registros existentes. El usuario corregirá el Excel origen marcando manualmente quiénes de esas
405 personas son en realidad terceros externos, para una re-migración futura (fuera de alcance de
este documento) que solo usará `AD` o `EXTERNO`.

## Decisiones confirmadas

- Quedan solo dos orígenes de titular: `AD` (usuario de red encontrado en la búsqueda) y `EXTERNO`
  (fallback cuando la búsqueda no encuentra resultados). Se elimina `INTERNO_MANUAL` de frontend,
  backend, y base de datos — no se retiene como valor histórico de solo lectura.
- Los 405 registros históricos con `titular_tipo = 'INTERNO_MANUAL'` se borran de la base de datos
  (script preparado para que el usuario lo ejecute cuando esté listo, no se ejecuta como parte de
  este trabajo de código).
- Las columnas `titular_sede_id`, `titular_dependencia_id`, `titular_tipo_contrato_id` de `dbo.vpn`
  se eliminan (`DROP COLUMN`) una vez borrados los 405 registros que las usan — ya no las usa ningún
  código (`AD` trae su sede vía `usuarioRed`, `EXTERNO` usa `titular_empresa`/`titular_motivo`).
- La re-migración de los 405 registros históricos (reclasificados por el usuario en el Excel origen
  como `AD` o `EXTERNO`) queda fuera de alcance — se abordará como trabajo separado cuando el Excel
  corregido esté listo.

## Backend

### `Vpn.java`

Se eliminan los campos `titularSede` (`@ManyToOne` a `Sede`), `titularDependencia` (`@ManyToOne` a
`Dependencia`), `titularTipoContrato` (`@ManyToOne` a `TipoContrato`), y sus imports
(`com.inia.soportedesk.catalogo.Dependencia`, `Sede`, `TipoContrato`) al quedar sin uso en la clase.

`getTitularOrigenLabel()` pierde el case `INTERNO_MANUAL`:

```java
@Transient
public String getTitularOrigenLabel() {
    return "EXTERNO".equals(titularTipo) ? "Externo" : "AD";
}
```

### `VpnRequest.java`

Se eliminan `titularSedeId`, `titularDependenciaId`, `titularTipoContratoId`.

### `VpnService.java`

`copySolicitudFields` simplifica la rama "sin `usuarioRedId`" a un solo camino (ya no hay `if
INTERNO_MANUAL / else EXTERNO`, solo se valida y captura `EXTERNO`):

```java
vpn.setTitularCargo(request.getTitularCargo());

if (request.getUsuarioRedId() != null) {
    UsuarioRed usuarioRed = usuarioRedRepository.findById(request.getUsuarioRedId())
            .orElseThrow(() -> new ResourceNotFoundException("Usuario de red no encontrado: " + request.getUsuarioRedId()));
    vpn.setUsuarioRed(usuarioRed);
    vpn.setTitularTipo("AD");
    vpn.setTitularNombre(null);
    vpn.setTitularApellidos(null);
    vpn.setTitularCorreo(null);
    vpn.setTitularEmpresa(null);
    vpn.setTitularMotivo(null);
} else {
    if (!"EXTERNO".equals(request.getTitularTipo())) {
        throw new IllegalArgumentException("Debe seleccionar un usuario de red o indicar los datos del tercero externo");
    }
    if (isBlank(request.getTitularNombre()) || isBlank(request.getTitularApellidos()) || isBlank(request.getTitularCorreo())) {
        throw new IllegalArgumentException("Nombre, apellidos y correo del titular son obligatorios");
    }
    if (isBlank(request.getTitularEmpresa()) || isBlank(request.getTitularMotivo())) {
        throw new IllegalArgumentException("Empresa y motivo son obligatorios para un tercero externo");
    }
    vpn.setUsuarioRed(null);
    vpn.setTitularTipo("EXTERNO");
    vpn.setTitularNombre(request.getTitularNombre());
    vpn.setTitularApellidos(request.getTitularApellidos());
    vpn.setTitularCorreo(request.getTitularCorreo());
    vpn.setTitularEmpresa(request.getTitularEmpresa());
    vpn.setTitularMotivo(request.getTitularMotivo());
}
```

Se eliminan las dependencias inyectadas `SedeRepository`, `DependenciaRepository`,
`TipoContratoRepository` del constructor — solo se usaban en la rama `INTERNO_MANUAL` que
desaparece.

## Frontend

### `vpn.model.ts`

- `Vpn.titularTipo` pasa de `'AD' | 'INTERNO_MANUAL' | 'EXTERNO'` a `'AD' | 'EXTERNO'`.
- Se eliminan `titularSede`, `titularDependencia`, `titularTipoContrato` de la interfaz `Vpn`.
- `VpnSolicitudRequest.titularTipo` pasa de `'INTERNO_MANUAL' | 'EXTERNO' | null` a `'EXTERNO' |
  null`.
- Se eliminan `titularSedeId`, `titularDependenciaId`, `titularTipoContratoId` de
  `VpnSolicitudRequest`.

### `vpn-form.component.ts`

- `TitularModo` pasa de `'buscando' | 'ad-seleccionado' | 'interno-manual' | 'externo'` a
  `'buscando' | 'ad-seleccionado' | 'externo'`.
- Se elimina `onElegirInternoManual()`.
- Se eliminan `sedes`, `dependencias`, `tiposContrato`, `titularSedeId`, `titularDependenciaId`,
  `titularTipoContratoId`, `onSedeChange()`, `onDependenciaChange()`, `onTipoContratoChange()`.
- Se elimina la inyección de `CatalogoService` y el import de `Sede`/`Dependencia`/`TipoContrato`
  de `catalogo.model.ts` — quedan sin ningún otro uso en el componente.
- `ngOnInit()` deja de llamar a `catalogoService.getSedes()` / `getTiposContrato()`.
- `ngOnChanges()` elimina la rama `else if (this.vpn.titularTipo === 'INTERNO_MANUAL')`.
- `submit()` elimina `titularSedeId`/`titularDependenciaId`/`titularTipoContratoId` del request
  armado, y `titularTipo` solo puede ser `'EXTERNO'` o `null` (ya no `'INTERNO_MANUAL'`).
- `applyTitularValidators()` y `resetAll()` ya no tocan campos de sede/dependencia/tipo de
  contrato.

### `vpn-form.component.html`

- El prompt de fallback (`*ngIf="adBusquedaRealizada && adResults.length === 0"`) queda con un
  solo botón: `<button type="button" class="secondary" (click)="onElegirExterno()">Tercero
  externo</button>`. Se elimina el botón "Personal de INIA".
- Se elimina el bloque completo `*ngIf="titularModo === 'interno-manual'"` (nombre, apellidos,
  correo, selects de sede/dependencia/tipo de contrato, botón "Volver a buscar en AD").

### `vpn-list.component.html`

- Se eliminan las filas del modal de detalle `*ngIf="viewing.titularTipo === 'INTERNO_MANUAL'"`
  ("Sede", "Dependencia", "Tipo de contrato").
- `titularOrigenLabel` (ya calculado en backend) ahora solo devuelve "AD" o "Externo" — sin cambios
  de template necesarios ahí, es texto plano.

## Base de datos

Dos scripts nuevos en `docs/superpowers/migrations/`, **no ejecutados como parte de este trabajo**
— el usuario los corre manualmente cuando esté listo, en este orden:

### `2026-07-07-vpn-eliminar-interno-manual-datos.sql`

```sql
-- Borra los 405 registros historicos con titular_tipo='INTERNO_MANUAL'.
-- Ejecutar en: ssti (SQL Server). NO idempotente en el sentido de "recuperable" -- revisar el
-- conteo antes de confirmar. Correr ANTES del script de DROP COLUMN.

SELECT COUNT(*) AS antes FROM dbo.vpn WHERE titular_tipo = 'INTERNO_MANUAL';
GO

DELETE FROM dbo.vpn WHERE titular_tipo = 'INTERNO_MANUAL';
GO

SELECT COUNT(*) AS despues FROM dbo.vpn WHERE titular_tipo = 'INTERNO_MANUAL';
GO
```

### `2026-07-07-vpn-eliminar-interno-manual-columnas.sql`

```sql
-- Elimina las columnas titular_sede_id/titular_dependencia_id/titular_tipo_contrato_id de dbo.vpn.
-- Ejecutar en: ssti (SQL Server), DESPUES de vaciar los registros INTERNO_MANUAL (ver script de
-- datos) -- esas columnas contienen los valores de esos registros.

IF OBJECT_ID('dbo.fk_vpn_titular_sede', 'F') IS NOT NULL
    ALTER TABLE dbo.vpn DROP CONSTRAINT fk_vpn_titular_sede;
GO
IF OBJECT_ID('dbo.fk_vpn_titular_dependencia', 'F') IS NOT NULL
    ALTER TABLE dbo.vpn DROP CONSTRAINT fk_vpn_titular_dependencia;
GO
IF OBJECT_ID('dbo.fk_vpn_titular_tipo_contrato', 'F') IS NOT NULL
    ALTER TABLE dbo.vpn DROP CONSTRAINT fk_vpn_titular_tipo_contrato;
GO

IF COL_LENGTH('dbo.vpn', 'titular_sede_id') IS NOT NULL
    ALTER TABLE dbo.vpn DROP COLUMN titular_sede_id;
GO
IF COL_LENGTH('dbo.vpn', 'titular_dependencia_id') IS NOT NULL
    ALTER TABLE dbo.vpn DROP COLUMN titular_dependencia_id;
GO
IF COL_LENGTH('dbo.vpn', 'titular_tipo_contrato_id') IS NOT NULL
    ALTER TABLE dbo.vpn DROP COLUMN titular_tipo_contrato_id;
GO
```

`titular_tipo` conserva su `DEFAULT 'AD'` y su `NOT NULL` — no cambia, solo deja de aceptar
`'INTERNO_MANUAL'` como valor válido a nivel de aplicación (no hay `CHECK` constraint en la
columna, así que no requiere cambio de esquema para eso).

## Testing

- **`VpnServiceTest`**: se eliminan `crearSolicitud_withTitularInternoManual_success` (o equivalente)
  y los casos de validación de campos faltantes específicos de `INTERNO_MANUAL`
  (`crearSolicitud_withTitularInternoManual_missingTipoContrato_throwsIllegalArgumentException` y
  análogos para sede/dependencia). Se mantienen intactos los casos `AD` y `EXTERNO`. Se agrega un
  caso `crearSolicitud_withTitularTipoInvalido_throwsIllegalArgumentException` si no existe ya,
  para cubrir el envío de un `titularTipo` que no sea `EXTERNO` sin `usuarioRedId`.
- **`VpnControllerIT`**: sin cambios — no referenciaba `INTERNO_MANUAL`.
- **Manual**: verificar en el navegador que buscar un usuario inexistente en AD muestra el prompt
  con un solo botón ("Tercero externo"), que ya no aparece "Personal de INIA", y que el modal de
  detalle de un registro `EXTERNO` sigue mostrando empresa/motivo correctamente.

## Archivos

**Modificados**: `Vpn.java`, `VpnRequest.java`, `VpnService.java`, `VpnServiceTest.java`,
`vpn.model.ts`, `vpn-form.component.ts`, `vpn-form.component.html`, `vpn-list.component.html`.

**Nuevos**: `2026-07-07-vpn-eliminar-interno-manual-datos.sql`,
`2026-07-07-vpn-eliminar-interno-manual-columnas.sql` (ambos en `docs/superpowers/migrations/`, no
ejecutados como parte de este trabajo de código).

**Sin cambios**: `VpnController.java` (mismo shape de request salvo los campos removidos, mismos
endpoints), `VpnControllerIT.java`, `UsuarioRedService`, `CatalogoService` (sus métodos de
Sede/Dependencia/TipoContrato siguen existiendo y en uso en otras partes del sistema, solo dejan de
consumirse desde `vpn-form.component.ts`).

**Fuera de alcance**: re-migración de los 405 registros históricos como `AD`/`EXTERNO` según la
clasificación que el usuario haga en el Excel origen — se abordará en un trabajo separado cuando
ese archivo esté listo.
