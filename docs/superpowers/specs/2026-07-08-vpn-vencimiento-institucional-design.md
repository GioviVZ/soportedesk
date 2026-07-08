# Módulo VPN — quitar IP VPN asignada, vencimiento calculado en vivo

## Contexto

Dos pedidos relacionados sobre el listado de VPN:

1. La columna/campo "IP VPN asignada" no se usa en la operación real — hoy es obligatorio en el
   formulario "Aprobar solicitud", aparece como columna en la lista, en el modal de detalle, y en
   la búsqueda del backend (`VpnRepository.search`).
2. La condición de vencimiento de una VPN (`Vpn.vence`) debe depender del vencimiento del
   antivirus: para equipo Personal, del dato que ya se captura en la solicitud
   (`vencimientoAntivirus`, agregado en el ciclo del checklist); para equipo INIA, de una fecha
   institucional única, administrable por los responsables ("un botón donde pondríamos datos del
   antivirus institucional y guardar un vencimiento"). Hoy `vence` se escribe a mano al aprobar
   (`VpnAprobarRequest.vence`) y no tiene ninguna relación con el antivirus.

Ambos tocan el mismo lugar: el formulario "Aprobar" pide `ipAsignada` (obligatorio) y `vence`
(manual, opcional) — al quitar la captura manual de `vence`, ese campo también sale de ese
formulario, así que se resuelven juntos.

## Decisiones confirmadas

- **IP VPN asignada se elimina por completo**: formulario "Aprobar" (ya no se pide), columna de la
  lista, fila del modal de detalle, cláusula de búsqueda en `VpnRepository`, campo en `Vpn`/
  `VpnAprobarRequest`/modelo TS, y columna `ip_asignada` en la base de datos (script preparado, no
  ejecutado).
- **`vence` deja de guardarse — se calcula siempre en vivo, nunca una foto fija**: si se renueva la
  fecha institucional después, **todas** las VPN de equipos INIA ya aprobadas reflejan la nueva
  fecha automáticamente la próxima vez que se consultan, sin tocar cada registro. `Vpn.vence` pasa
  de columna persistida (`@Column`) a campo `@Transient` que `VpnService` calcula y asigna en cada
  método que devuelve una `Vpn`: `findAll`, `findById`, `crearSolicitud`, `actualizarSolicitud`,
  `aprobar`, `rechazar`, `observar`, `updateAntivirus`. Regla: `tipoEquipo == "INIA"` → fecha de la
  configuración institucional; en cualquier otro caso → `vencimientoAntivirus` de esa solicitud. El
  campo `vence` del formulario "Aprobar" se elimina (ya no se pide manualmente). El badge
  "por vencer"/"vencido" que ya existe en la lista (`app-vencimiento-badge`, umbral de 30 días) no
  cambia — sigue leyendo `row.vence`, ahora con datos reales en vez de una fecha arbitraria elegida
  al aprobar.
- **Configuración institucional**: tabla nueva de una sola fila (`vpn_config_institucional`), con
  **solo** la fecha de vencimiento (sin nombre/versión/proveedor — YAGNI, nada más se necesita para
  el cálculo). Editable con el mismo permiso que ya protege aprobar/rechazar/observar VPN
  (`WRITE_aprobar-vpn` o `ROLE_ADMIN`) — los "responsables" que ya gestionan las solicitudes. En el
  frontend, un botón nuevo junto a la lista de VPN (visible solo para quienes pueden aprobar) que
  abre un modal simple con un campo de fecha y "Guardar", mismo patrón que los modales de
  Antivirus/Aprobar/Resolución que ya existen.
- **Columna `vence` de `dbo.vpn`** (y su índice `IX_vpn_vence`) se eliminan también — ya no se lee
  ni se escribe vía JPA una vez que pasa a `@Transient` (script preparado, no ejecutado).

## Modelo de datos

Tabla nueva:

| Tabla | Columnas | Uso |
|---|---|---|
| `vpn_config_institucional` | `id BIGINT PK` (siempre `1`, fila única), `vencimiento_antivirus DATE NOT NULL` | Fecha de vencimiento del antivirus institucional, administrable por responsables |

Columnas eliminadas de `dbo.vpn`: `ip_asignada`, `vence` (+ índice `IX_vpn_vence`).

## Backend

### `VpnConfigInstitucional.java` (entidad nueva)

```java
package com.inia.soportedesk.vpn;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "vpn_config_institucional")
@Getter
@Setter
@NoArgsConstructor
public class VpnConfigInstitucional {

    @Id
    private Long id;

    @Column(name = "vencimiento_antivirus", nullable = false)
    private LocalDate vencimientoAntivirus;
}
```

### `VpnConfigInstitucionalRepository.java` (nuevo)

```java
package com.inia.soportedesk.vpn;

import org.springframework.data.jpa.repository.JpaRepository;

public interface VpnConfigInstitucionalRepository extends JpaRepository<VpnConfigInstitucional, Long> {
}
```

### `VpnConfigInstitucionalRequest.java` (nuevo)

```java
package com.inia.soportedesk.vpn;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class VpnConfigInstitucionalRequest {

    @NotNull
    private LocalDate vencimientoAntivirus;
}
```

### `VpnConfigInstitucionalService.java` (nuevo)

Upsert de fila única con id fijo `1L`:

```java
package com.inia.soportedesk.vpn;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class VpnConfigInstitucionalService {

    private static final Long ID_UNICO = 1L;

    private final VpnConfigInstitucionalRepository repository;

    public LocalDate getVencimiento() {
        return repository.findById(ID_UNICO).map(VpnConfigInstitucional::getVencimientoAntivirus).orElse(null);
    }

    public VpnConfigInstitucional actualizar(LocalDate vencimiento) {
        VpnConfigInstitucional config = repository.findById(ID_UNICO).orElseGet(() -> {
            VpnConfigInstitucional nuevo = new VpnConfigInstitucional();
            nuevo.setId(ID_UNICO);
            return nuevo;
        });
        config.setVencimientoAntivirus(vencimiento);
        return repository.save(config);
    }
}
```

### `VpnConfigInstitucionalController.java` (nuevo)

```java
package com.inia.soportedesk.vpn;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/vpn/config-institucional")
@RequiredArgsConstructor
public class VpnConfigInstitucionalController {

    private static final String CAN_MANAGE = "hasRole('ADMIN') || hasAuthority('WRITE_aprobar-vpn')";

    private final VpnConfigInstitucionalService service;

    @GetMapping
    @PreAuthorize(CAN_MANAGE)
    public VpnConfigInstitucional get() {
        VpnConfigInstitucional config = new VpnConfigInstitucional();
        config.setVencimientoAntivirus(service.getVencimiento());
        return config;
    }

    @PutMapping
    @PreAuthorize(CAN_MANAGE)
    public VpnConfigInstitucional actualizar(@Valid @RequestBody VpnConfigInstitucionalRequest request) {
        return service.actualizar(request.getVencimientoAntivirus());
    }
}
```

(`@PreAuthorize` por método, mismo patrón que `VpnController` — ni ver ni editar la fecha
institucional está disponible fuera de responsables/admin.)

### `Vpn.java`

Se elimina el campo `ipAsignada` por completo. `vence` pasa de:

```java
    @Column(name = "ip_asignada")
    private String ipAsignada;

    private LocalDate vence;
```

a:

```java
    @Transient
    private LocalDate vence;
```

(Sin `@Column` en `ip_asignada` porque desaparece; `vence` conserva el nombre de campo/getter/setter
—Lombok— pero deja de mapear a columna.)

### `VpnAprobarRequest.java`

Se eliminan `ipAsignada` y `vence`, quedando solo `usuarioVpn`, `credencialVpn`, `estado`.

### `VpnRepository.java`

Se quita la cláusula `LOWER(v.ipAsignada) LIKE ...` del JPQL de `search`.

### `VpnService.java`

- Nueva dependencia inyectada: `VpnConfigInstitucionalService`.
- Nuevo método privado:

```java
    private void aplicarVence(Vpn vpn) {
        if ("INIA".equals(vpn.getTipoEquipo())) {
            vpn.setVence(configInstitucionalService.getVencimiento());
        } else {
            vpn.setVence(vpn.getVencimientoAntivirus());
        }
    }
```

- Se llama `aplicarVence(vpn)` (o `.forEach(this::aplicarVence)` en `findAll`) justo antes de
  devolver el resultado en: `findAll`, `findById`, `crearSolicitud`, `actualizarSolicitud`,
  `aprobar`, `rechazar`, `observar`, `updateAntivirus`.
- `aprobar()` deja de leer `request.getIpAsignada()`/`request.getVence()` — ya no existen en
  `VpnAprobarRequest`.

## Frontend

### `vpn.model.ts`

- `Vpn` pierde `ipAsignada: string | null`. `vence: string | null` se queda (mismo tipo, ahora
  viene calculado del backend en vez de guardado).
- `VpnAprobarRequest` pierde `ipAsignada: string` y `vence: string | null`.
- Interfaz nueva:

```typescript
export interface VpnConfigInstitucional {
  vencimientoAntivirus: string | null;
}

export interface VpnConfigInstitucionalRequest {
  vencimientoAntivirus: string;
}
```

### `vpn.service.ts`

Dos métodos nuevos:

```typescript
  getConfigInstitucional(): Observable<VpnConfigInstitucional> {
    return this.http.get<VpnConfigInstitucional>(`${this.apiUrl}/config-institucional`);
  }

  actualizarConfigInstitucional(request: VpnConfigInstitucionalRequest): Observable<VpnConfigInstitucional> {
    return this.http.put<VpnConfigInstitucional>(`${this.apiUrl}/config-institucional`, request);
  }
```

### `vpn-aprobar-form.component.ts`/`.html`

Se quitan el control `ipAsignada` (y su `Validators.required`) y el control `vence` del
`FormGroup`, el `<input>` de "IP VPN asignada" y el `<input type="date">` de "Vence (VPN)" del
template, y ambos del payload armado en `submit()`.

### `vpn-config-institucional-form.component.ts`/`.html` (nuevo)

Componente standalone chico, mismo patrón que `vpn-antivirus-form.component`: un `FormGroup` con
un solo control `vencimientoAntivirus` (`Validators.required`), carga el valor actual en
`ngOnInit` vía `VpnService.getConfigInstitucional()`, y en `submit()` llama
`actualizarConfigInstitucional()` y emite `saved`.

```typescript
import { Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { VpnService } from './vpn.service';

@Component({
  selector: 'app-vpn-config-institucional-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './vpn-config-institucional-form.component.html',
})
export class VpnConfigInstitucionalFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(VpnService);

  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  form = this.fb.nonNullable.group({
    vencimientoAntivirus: ['', Validators.required],
  });

  ngOnInit(): void {
    this.service.getConfigInstitucional().subscribe((data) => {
      if (data.vencimientoAntivirus) {
        this.form.patchValue({ vencimientoAntivirus: data.vencimientoAntivirus });
      }
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.service
      .actualizarConfigInstitucional({ vencimientoAntivirus: this.form.getRawValue().vencimientoAntivirus })
      .subscribe(() => this.saved.emit());
  }
}
```

```html
<form [formGroup]="form" (ngSubmit)="submit()">
  <div class="field">
    <label>Fecha de vencimiento del antivirus institucional *</label>
    <input type="date" formControlName="vencimientoAntivirus" />
  </div>
  <div class="actions">
    <button type="button" class="secondary" (click)="cancelled.emit()">Cancelar</button>
    <button type="submit" [disabled]="form.invalid">Guardar</button>
  </div>
</form>
```

### `vpn-list.component.ts`/`.html`

- Se quita `{ key: 'ipAsignada', label: 'IP VPN' }` de `columns`, y la fila
  `<app-field label="IP VPN asignada">` del modal de detalle.
- Nuevo botón junto al `tab-toggle` (mismo `*ngIf="canWriteAprobar"`): "Antivirus institucional",
  abre un modal nuevo con `<app-vpn-config-institucional-form>`, siguiendo el mismo patrón
  `xxxOpen`/`openXxx()`/`closeXxx()`/`onXxxSaved()` que ya usan `antivirus`/`aprobar`/`resolucion`.

## Migraciones (preparadas, no ejecutadas)

### `2026-07-08-vpn-config-institucional.sql` (aditivo)

```sql
IF OBJECT_ID('dbo.vpn_config_institucional', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.vpn_config_institucional (
        id BIGINT NOT NULL PRIMARY KEY,
        vencimiento_antivirus DATE NOT NULL
    );
END;
GO
```

### `2026-07-08-vpn-eliminar-ip-vence-columnas.sql` (destructivo)

```sql
IF OBJECT_ID('dbo.IX_vpn_vence', 'I') IS NOT NULL
    DROP INDEX IX_vpn_vence ON dbo.vpn;
GO

IF COL_LENGTH('dbo.vpn', 'ip_asignada') IS NOT NULL
    ALTER TABLE dbo.vpn DROP COLUMN ip_asignada;
GO

IF COL_LENGTH('dbo.vpn', 'vence') IS NOT NULL
    ALTER TABLE dbo.vpn DROP COLUMN vence;
GO
```

## Testing

- **`VpnServiceTest`**: actualizar `aprobar_whenPendiente_setsCredentialsAndMarksAprobado` (quita
  `request.setIpAsignada(...)`, que ya no existe). Agregar: `findAll_forEquipoInia_setsVenceFromConfigInstitucional`
  (mockea `VpnConfigInstitucionalService.getVencimiento()`), `crearSolicitud_forEquipoPersonal_setsVenceFromVencimientoAntivirus`
  (sin mock de config institucional — usa `vencimientoAntivirus` de la propia solicitud), y
  `aplicarVence_forEquipoIniaWithoutConfig_setsVenceNull` (config institucional aún no configurada
  → `vence` queda `null`, no lanza excepción).
- **`VpnConfigInstitucionalServiceTest`** (nuevo): `actualizar_whenNoRowExists_createsWithFixedId`,
  `actualizar_whenRowExists_updatesInPlace`, `getVencimiento_whenNotConfigured_returnsNull`.
- **`VpnControllerIT`**: sin cambios funcionales relevantes — no valida `ipAsignada`/`vence` como
  casos límite hoy.
- **Manual**: verificar que el formulario "Aprobar" ya no pide IP ni fecha de vencimiento; que la
  lista ya no muestra la columna "IP VPN"; que el botón "Antivirus institucional" (visible solo con
  permiso de aprobar) permite guardar una fecha; que una VPN de equipo INIA aprobada muestra ese
  vencimiento en el badge y el detalle; que una VPN de equipo Personal muestra el
  `vencimientoAntivirus` capturado en su propia solicitud.

## Archivos

**Modificados**: `Vpn.java`, `VpnAprobarRequest.java`, `VpnRepository.java`, `VpnService.java`,
`VpnServiceTest.java`, `vpn.model.ts`, `vpn.service.ts`, `vpn-aprobar-form.component.ts`,
`vpn-aprobar-form.component.html`, `vpn-list.component.ts`, `vpn-list.component.html`.

**Nuevos**: `VpnConfigInstitucional.java`, `VpnConfigInstitucionalRepository.java`,
`VpnConfigInstitucionalRequest.java`, `VpnConfigInstitucionalService.java`,
`VpnConfigInstitucionalController.java`, `VpnConfigInstitucionalServiceTest.java`,
`vpn-config-institucional-form.component.ts`, `vpn-config-institucional-form.component.html`, dos
migraciones SQL nuevas en `docs/superpowers/migrations/`.

**Sin cambios**: `VpnController.java` (los endpoints existentes no cambian de forma, solo el shape
de `VpnAprobarRequest`), `vpn-antivirus-form.component`/`vpn-resolucion-form.component`
(patrones de referencia, no se tocan).
