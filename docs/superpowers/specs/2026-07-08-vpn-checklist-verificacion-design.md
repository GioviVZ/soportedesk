# Módulo VPN — checklist de verificación secuencial y bloqueado

## Contexto

El formulario de solicitud VPN (`vpn-form.component`) ya tiene checks de seguridad
(`antivirusVerificado`, `analisisAntivirusRealizado`, `tieneGlpi`, `hostActualizado`), pero
**ninguno es obligatorio** — son booleanos sueltos sin `Validators.required`, y el botón Guardar
solo depende de los campos del titular (`titularCargo`, `tipoEquipo`, y los campos manuales de
`externo`). Se puede guardar una solicitud con todos los checks de seguridad sin marcar.

Feedback operativo: para equipos de INIA y equipos personales existe una secuencia real de
verificación que el asistente debe completar en orden antes de poder guardar la solicitud — hoy el
formulario no la refleja ni la exige.

Este documento cubre **solo** el checklist de verificación (nuevos checks + orden secuencial
bloqueado + captura de fecha de vencimiento de antivirus para equipo personal). La vinculación de
`Vpn.vence` con el vencimiento del antivirus y la configuración institucional administrable quedan
para un ciclo posterior (decisión explícita del usuario: "checklist primero, vencimientos
después").

## Decisiones confirmadas

- **Secuencia INIA** (cada paso deshabilitado hasta que el anterior esté satisfecho):
  1. Antivirus institucional instalado (`antivirusVerificado`, existente)
  2. Sistema operativo actualizado (`sistemaOperativoActualizado`, nuevo)
  3. Forticlient instalado (`forticlientInstalado`, nuevo)
  4. GLPI instalado (`tieneGlpi`, existente — al marcarlo aparece la búsqueda de equipo GLPI, sin
     cambios; seleccionar un equipo específico sigue siendo opcional, confirmado por el usuario)
  5. Host actualizado (`hostActualizado`, existente, pasa a obligatorio)
  6. Análisis de antivirus realizado (`analisisAntivirusRealizado`, existente, pasa a obligatorio
     — último paso)
- **Secuencia Personal:**
  1. Antivirus con protección anti-ransomware instalado (`antivirusVerificado`, existente)
  2. Fecha de vencimiento de licencia de antivirus (`vencimientoAntivirus`, nuevo — input de fecha,
     no checkbox)
  3. Sistema operativo actualizado (`sistemaOperativoActualizado`, nuevo)
  4. Forticlient instalado (`forticlientInstalado`, nuevo)
  5. Análisis de antivirus realizado (`analisisAntivirusRealizado`, existente, pasa a obligatorio
     — último paso)
- **Mecanismo de bloqueo secuencial**: cada control usa el atributo nativo `[disabled]` (property
  binding, no `FormControl.disable()`) calculado a partir de si el/los pasos anteriores están
  satisfechos. Esto bloquea la interacción del usuario sin sacar el control de la validez del
  `FormGroup` — el botón Guardar (`[disabled]="form.invalid"`, sin cambios) sigue dependiendo de
  que **todos** los controles requeridos tengan valor válido, y como no se pueden marcar fuera de
  orden, el efecto es una secuencia real.
- **Validación solo en frontend**: igual que los checks existentes hoy (`antivirusVerificado`,
  `analisisAntivirusRealizado`, `hostActualizado` nunca se validaron en el backend), los nuevos
  campos (`sistemaOperativoActualizado`, `forticlientInstalado`, `vencimientoAntivirus`) se copian
  al crear/actualizar la solicitud sin validación de "obligatorio" en `VpnService` — son
  `Boolean`/`LocalDate` libres a nivel de Bean Validation y de negocio. La obligatoriedad vive
  únicamente en los `Validators` de Angular.
- **`tieneGlpi` y `hostActualizado` pasan a `Validators.requiredTrue`, pero solo cuando
  `tipoEquipo === 'INIA'`** (se limpian los validators al cambiar a `PERSONAL`, mismo patrón que ya
  usa `applyTitularValidators()` para los campos de titular). **`vencimientoAntivirus` usa
  `Validators.required`, pero solo cuando `tipoEquipo === 'PERSONAL'`.**
  `antivirusVerificado`, `sistemaOperativoActualizado`, `forticlientInstalado`, y
  `analisisAntivirusRealizado` usan `Validators.requiredTrue` de forma estática (aplican a ambos
  tipos de equipo, no se togglean).
- **`vencimientoAntivirus` ya existe como columna** en `dbo.vpn` y como campo en `Vpn.java`
  (usado hoy solo por el flujo aparte "Editar antivirus" vía `VpnAntivirusRequest`/
  `updateAntivirus()`). Este cambio agrega la capacidad de llenarlo **también** al crear/editar la
  solicitud — no se duplica la columna, no hay conflicto: el flujo "Editar antivirus" sigue
  existiendo tal cual para que soporte lo actualice después (ej. renovaciones), simplemente ahora
  puede llegar pre-llenado desde la solicitud original si era equipo personal.
- **Detalle en la lista**: el modal de detalle de `vpn-list.component` agrega "Sistema operativo
  actualizado" y "Forticlient instalado" (Sí/No) junto a los checks existentes en la sección
  "Solicitud". No se duplica la fecha de vencimiento de antivirus — ya se muestra en la sección
  "Antivirus (monitoreo)" existente (`vpn-list.component.html:95`).

## Modelo de datos

Dos columnas nuevas en `vpn` (además de las ya existentes):

| Columna | Tipo | Uso |
|---|---|---|
| `sistema_operativo_actualizado` | `BIT NULL` | Ambos tipos de equipo |
| `forticlient_instalado` | `BIT NULL` | Ambos tipos de equipo |

`vencimiento_antivirus` (`DATE NULL`, ya existe) gana un segundo punto de entrada: la solicitud
misma, además del flujo "Editar antivirus".

## Backend

### `Vpn.java`

Se agregan dos campos, mismo patrón que `antivirusVerificado`/`analisisAntivirusRealizado`:

```java
@Column(name = "sistema_operativo_actualizado")
private Boolean sistemaOperativoActualizado;

@Column(name = "forticlient_instalado")
private Boolean forticlientInstalado;
```

### `VpnRequest.java`

Se agregan:

```java
private Boolean sistemaOperativoActualizado;
private Boolean forticlientInstalado;
private java.time.LocalDate vencimientoAntivirus;
```

Ninguno lleva `@NotNull`/`@NotBlank` — consistente con el resto de los checks de seguridad, que no
se validan a nivel de Bean Validation.

### `VpnService.java`

`copySolicitudFields` copia los tres campos sin condicionar por `tipoEquipo` (mismo tratamiento
liviano que `antivirusVerificado`/`analisisAntivirusRealizado` hoy), agregado junto a las líneas
existentes al inicio del método:

```java
private void copySolicitudFields(Vpn vpn, VpnRequest request) {
    vpn.setTipoEquipo(request.getTipoEquipo());
    vpn.setAntivirusVerificado(request.getAntivirusVerificado());
    vpn.setAnalisisAntivirusRealizado(request.getAnalisisAntivirusRealizado());
    vpn.setSistemaOperativoActualizado(request.getSistemaOperativoActualizado());
    vpn.setForticlientInstalado(request.getForticlientInstalado());
    vpn.setVencimientoAntivirus(request.getVencimientoAntivirus());
    vpn.setTitularCargo(request.getTitularCargo());
    // ... resto del método sin cambios ...
```

## Frontend

### `vpn.model.ts`

`Vpn` agrega `sistemaOperativoActualizado: boolean | null` y
`forticlientInstalado: boolean | null` (`vencimientoAntivirus: string | null` ya existe).
`VpnSolicitudRequest` agrega `sistemaOperativoActualizado: boolean`,
`forticlientInstalado: boolean`, `vencimientoAntivirus: string | null`.

### `vpn-form.component.ts`

- El `FormGroup` agrega tres controles:
  ```typescript
  sistemaOperativoActualizado: [false, Validators.requiredTrue],
  forticlientInstalado: [false, Validators.requiredTrue],
  vencimientoAntivirus: [null as string | null],
  ```
  y `antivirusVerificado`/`analisisAntivirusRealizado` ganan `Validators.requiredTrue` (antes sin
  validador).
- Nuevo método privado `applyVerificacionValidators()` (mismo patrón que
  `applyTitularValidators()`): togglea `Validators.requiredTrue` en `tieneGlpi`/`hostActualizado`
  y `Validators.required` en `vencimientoAntivirus` según `esInia`. Se llama desde
  `onTipoEquipoChange()`, `ngOnChanges()` (tras `patchValue`), y `resetAll()`.
- Nuevos getters de habilitación de paso (usados por `[disabled]` en el template):
  ```typescript
  get pasoSoActualizadoHabilitado(): boolean {
    const raw = this.form.getRawValue();
    return this.esInia ? raw.antivirusVerificado : (raw.antivirusVerificado && !!raw.vencimientoAntivirus);
  }

  get pasoForticlientHabilitado(): boolean {
    return this.pasoSoActualizadoHabilitado && this.form.getRawValue().sistemaOperativoActualizado;
  }

  get pasoGlpiHabilitado(): boolean {
    return this.pasoForticlientHabilitado && this.form.getRawValue().forticlientInstalado;
  }

  get pasoAnalisisHabilitado(): boolean {
    const raw = this.form.getRawValue();
    if (this.esInia) return raw.tieneGlpi && raw.hostActualizado;
    return this.pasoForticlientHabilitado && raw.forticlientInstalado;
  }

  get pasoVencimientoHabilitado(): boolean {
    return this.form.getRawValue().antivirusVerificado;
  }
  ```
- `ngOnChanges()` agrega al `patchValue` inicial: `sistemaOperativoActualizado`,
  `forticlientInstalado`, `vencimientoAntivirus` desde `this.vpn`, y llama
  `applyVerificacionValidators()` al final de la rama `if (this.vpn)`.
- `submit()` agrega al request armado: `sistemaOperativoActualizado: raw.sistemaOperativoActualizado`,
  `forticlientInstalado: raw.forticlientInstalado`,
  `vencimientoAntivirus: raw.tipoEquipo === 'PERSONAL' ? raw.vencimientoAntivirus : null`.
- `resetAll()` resetea los tres campos nuevos y llama `applyVerificacionValidators()`.

### `vpn-form.component.html`

- Dentro de `*ngIf="esInia"`: se reordena para que `antivirusVerificado` sea el primer campo, se
  insertan los checkboxes de `sistemaOperativoActualizado` y `forticlientInstalado` con
  `[disabled]="!pasoSoActualizadoHabilitado"` / `[disabled]="!pasoForticlientHabilitado"` antes del
  checkbox `tieneGlpi` (que gana `[disabled]="!pasoGlpiHabilitado"`), y `hostActualizado` queda tal
  cual (ya condicionado por `*ngIf="tieneGlpi"`).
- Dentro de `*ngIf="!esInia"`: tras `antivirusVerificado`, se agrega el input
  `<input type="date" formControlName="vencimientoAntivirus" [disabled]="!pasoVencimientoHabilitado" />`,
  luego los checkboxes `sistemaOperativoActualizado` (`[disabled]="!pasoSoActualizadoHabilitado"`) y
  `forticlientInstalado` (`[disabled]="!pasoForticlientHabilitado"`).
- El checkbox compartido `analisisAntivirusRealizado` (fuera de ambos `ng-container`) gana
  `[disabled]="!pasoAnalisisHabilitado"`.

### `vpn-list.component.html`

Se agregan dos filas junto a las existentes de la sección "Solicitud":

```html
<app-field label="Sistema operativo actualizado">{{ viewing.sistemaOperativoActualizado ? 'Sí' : 'No' }}</app-field>
<app-field label="Forticlient instalado">{{ viewing.forticlientInstalado ? 'Sí' : 'No' }}</app-field>
```

## Base de datos

`docs/superpowers/migrations/2026-07-08-vpn-checklist-verificacion.sql`, idempotente, mismo patrón
que migraciones anteriores del módulo:

```sql
IF COL_LENGTH('dbo.vpn', 'sistema_operativo_actualizado') IS NULL
BEGIN
    ALTER TABLE dbo.vpn ADD sistema_operativo_actualizado BIT NULL;
END;
GO

IF COL_LENGTH('dbo.vpn', 'forticlient_instalado') IS NULL
BEGIN
    ALTER TABLE dbo.vpn ADD forticlient_instalado BIT NULL;
END;
GO
```

## Testing

- **`VpnServiceTest`**: agregar un caso que confirme que `copySolicitudFields` copia
  `sistemaOperativoActualizado`, `forticlientInstalado`, y `vencimientoAntivirus` desde el
  `VpnRequest` al `Vpn` resultante, tanto con `usuarioRedId` como con `titularTipo=EXTERNO` (para
  confirmar que se copian sin condicionar por la rama de titular). Los tests existentes no deben
  requerir cambios — ninguno de los tres campos nuevos tiene validación de negocio.
- **`VpnControllerIT`**: sin cambios — no hay validación Bean/negocio nueva que exponga un caso
  400 distinto a los ya cubiertos.
- **Manual**: verificar en el navegador que, para equipo INIA, los checks aparecen deshabilitados
  hasta completar el anterior en el orden especificado, que Guardar permanece deshabilitado hasta
  completar los 6 pasos, y lo mismo para equipo Personal con sus 5 pasos (incluyendo que la fecha
  de vencimiento de antivirus sea exigida). Confirmar que el modal de detalle muestra los dos
  campos nuevos.

## Archivos

**Modificados**: `Vpn.java`, `VpnRequest.java`, `VpnService.java`, `VpnServiceTest.java`,
`vpn.model.ts`, `vpn-form.component.ts`, `vpn-form.component.html`, `vpn-list.component.html`,
migración SQL nueva en `docs/superpowers/migrations/`.

**Sin cambios**: `VpnController.java`, `vpn-antivirus-form.component.ts`/`.html` (el flujo "Editar
antivirus" sigue funcionando igual, ahora puede recibir un valor inicial de `vencimientoAntivirus`
si la solicitud original era de equipo personal).

**Fuera de alcance** (ciclo siguiente, según lo acordado): vincular `Vpn.vence` al vencimiento del
antivirus, configuración institucional administrable por responsables para equipos INIA.
