# VPN Checklist de Verificación Secuencial Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the VPN request form's security checklist into a real, enforced sequence — new
"Sistema operativo actualizado" and "Forticlient instalado" checks, a new "fecha de vencimiento de
licencia de antivirus" field for personal equipment, and every check (new and existing) required
and unlockable only in order before "Guardar" is enabled.

**Architecture:** Two new nullable columns on `vpn` (`sistema_operativo_actualizado`,
`forticlient_instalado`) plus reuse of the existing `vencimiento_antivirus` column (now also
settable at request-creation time, not just via the separate "Editar antivirus" flow).
`VpnService.copySolicitudFields` copies the three fields unconditionally, with zero backend
validation (same trust model as the existing checks). All the enforcement lives in
`vpn-form.component.ts`: `Validators.requiredTrue`/`required` make each step mandatory, and a set
of `pasoXHabilitado` getters drive `[disabled]` bindings on the native `<input>` elements so a step
can't be touched until the previous one is satisfied — without pulling the control out of the
`FormGroup`'s validity (which `FormControl.disable()` would do).

**Tech Stack:** Spring Boot 3 / Java, Angular 17+ standalone components (Reactive Forms), JUnit +
Mockito (backend).

## Global Constraints

- Validation is **frontend-only** — `VpnRequest`'s three new fields (`sistemaOperativoActualizado`,
  `forticlientInstalado`, `vencimientoAntivirus`) carry no `@NotNull`/`@NotBlank`, and
  `VpnService` never rejects a request for missing checks — consistent with how
  `antivirusVerificado`/`analisisAntivirusRealizado`/`hostActualizado` already work today.
- Sequential lock uses the native `[disabled]` **property binding** on the `<input>` element
  itself, never `FormControl.disable()` — disabling via the control would remove it from the
  `FormGroup`'s validity computation and silently defeat the "Guardar" gate.
- `tieneGlpi`/`hostActualizado` become `Validators.requiredTrue` **only when `tipoEquipo ===
  'INIA'`**; `vencimientoAntivirus` becomes `Validators.required` **only when `tipoEquipo ===
  'PERSONAL'`** — toggled the same way `applyTitularValidators()` already toggles the titular
  fields.
- Full spec: `docs/superpowers/specs/2026-07-08-vpn-checklist-verificacion-design.md`.

---

## Task 1: Backend — new fields on entity, request, and service

**Files:**
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/vpn/Vpn.java`
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/vpn/VpnRequest.java`
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/vpn/VpnService.java`
- Modify: `soportedesk-backend/src/test/java/com/inia/soportedesk/vpn/VpnServiceTest.java`

**Interfaces:**
- Produces: `Vpn.getSistemaOperativoActualizado()/getForticlientInstalado(): Boolean` (Lombok
  getters), `VpnRequest.getSistemaOperativoActualizado()/getForticlientInstalado(): Boolean`,
  `VpnRequest.getVencimientoAntivirus(): java.time.LocalDate` — consumed by Task 2 (frontend
  request shape) and by `copySolicitudFields`.

- [ ] **Step 1: Add the new test to `VpnServiceTest.java`**

Insert this test right after `crearSolicitud_withUnknownGlpiId_throwsResourceNotFoundException`
(before `crearSolicitud_withTitularExterno_savesManualFieldsAndClearsCatalogRefs`):

```java
    @Test
    void crearSolicitud_copiesSistemaOperativoForticlientAndVencimientoAntivirus() {
        UsuarioRed mockUser = new UsuarioRed();
        mockUser.setId(1L);
        when(usuarioRedRepository.findById(1L)).thenReturn(Optional.of(mockUser));
        when(usuarioRepository.findByUsername(any())).thenReturn(Optional.empty());
        when(repository.save(any(Vpn.class))).thenAnswer(inv -> inv.getArgument(0));

        VpnRequest request = sampleRequest();
        request.setSistemaOperativoActualizado(true);
        request.setForticlientInstalado(true);
        request.setVencimientoAntivirus(java.time.LocalDate.of(2027, 1, 15));

        Vpn result = service.crearSolicitud(request, authAs("jasistente"));

        assertThat(result.getSistemaOperativoActualizado()).isTrue();
        assertThat(result.getForticlientInstalado()).isTrue();
        assertThat(result.getVencimientoAntivirus()).isEqualTo(java.time.LocalDate.of(2027, 1, 15));
    }

```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd soportedesk-backend && mvn test -Dtest=VpnServiceTest -q`
Expected: COMPILE FAILURE — `VpnRequest` has no `setSistemaOperativoActualizado`/
`setForticlientInstalado`/`setVencimientoAntivirus`, and `Vpn` has no
`getSistemaOperativoActualizado`/`getForticlientInstalado`.

- [ ] **Step 3: Add the two new fields to `Vpn.java`**

In `soportedesk-backend/src/main/java/com/inia/soportedesk/vpn/Vpn.java`, insert right after the
existing `analisisAntivirusRealizado` field (before `hostActualizado`):

```java
    @Column(name = "analisis_antivirus_realizado")
    private Boolean analisisAntivirusRealizado;

    @Column(name = "sistema_operativo_actualizado")
    private Boolean sistemaOperativoActualizado;

    @Column(name = "forticlient_instalado")
    private Boolean forticlientInstalado;

    @Column(name = "host_actualizado")
    private Boolean hostActualizado;
```

- [ ] **Step 4: Add the new fields to `VpnRequest.java`**

In `soportedesk-backend/src/main/java/com/inia/soportedesk/vpn/VpnRequest.java`, add the
`java.time.LocalDate` import and insert the three fields right after `analisisAntivirusRealizado`:

```java
package com.inia.soportedesk.vpn;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class VpnRequest {

    private Long usuarioRedId;

    private String titularTipo;
    private String titularNombre;
    private String titularApellidos;
    private String titularCorreo;
    private String titularEmpresa;
    private String titularMotivo;

    @NotBlank
    private String titularCargo;

    @NotBlank
    private String tipoEquipo;

    private Long glpiComputerId;

    private Boolean antivirusVerificado;

    private Boolean analisisAntivirusRealizado;

    private Boolean sistemaOperativoActualizado;

    private Boolean forticlientInstalado;

    private LocalDate vencimientoAntivirus;

    private Boolean hostActualizado;
}
```

- [ ] **Step 5: Wire the three fields into `VpnService.copySolicitudFields`**

In `soportedesk-backend/src/main/java/com/inia/soportedesk/vpn/VpnService.java`, change:

```java
    private void copySolicitudFields(Vpn vpn, VpnRequest request) {
        vpn.setTipoEquipo(request.getTipoEquipo());
        vpn.setAntivirusVerificado(request.getAntivirusVerificado());
        vpn.setAnalisisAntivirusRealizado(request.getAnalisisAntivirusRealizado());
        vpn.setTitularCargo(request.getTitularCargo());
```

to:

```java
    private void copySolicitudFields(Vpn vpn, VpnRequest request) {
        vpn.setTipoEquipo(request.getTipoEquipo());
        vpn.setAntivirusVerificado(request.getAntivirusVerificado());
        vpn.setAnalisisAntivirusRealizado(request.getAnalisisAntivirusRealizado());
        vpn.setSistemaOperativoActualizado(request.getSistemaOperativoActualizado());
        vpn.setForticlientInstalado(request.getForticlientInstalado());
        vpn.setVencimientoAntivirus(request.getVencimientoAntivirus());
        vpn.setTitularCargo(request.getTitularCargo());
```

(The rest of the method — GLPI handling and the titular branch — is unchanged.)

- [ ] **Step 6: Run the test to verify it passes**

Run: `cd soportedesk-backend && mvn test -Dtest=VpnServiceTest -q`
Expected: PASS (22 test methods total).

- [ ] **Step 7: Compile-check the whole backend module**

Run: `cd soportedesk-backend && mvn compile -q`
Expected: BUILD SUCCESS.

- [ ] **Step 8: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/vpn/Vpn.java \
        soportedesk-backend/src/main/java/com/inia/soportedesk/vpn/VpnRequest.java \
        soportedesk-backend/src/main/java/com/inia/soportedesk/vpn/VpnService.java \
        soportedesk-backend/src/test/java/com/inia/soportedesk/vpn/VpnServiceTest.java
git commit -m "feat(vpn): add sistemaOperativoActualizado/forticlientInstalado/vencimientoAntivirus to solicitud"
```

---

## Task 2: Frontend — sequential, blocked checklist in `vpn-form.component`

**Files:**
- Modify: `soportedesk-frontend/src/app/features/vpn/vpn.model.ts`
- Modify: `soportedesk-frontend/src/app/features/vpn/vpn-form.component.ts`
- Modify: `soportedesk-frontend/src/app/features/vpn/vpn-form.component.html`

**Interfaces:**
- Consumes: `VpnRequest`'s new fields from Task 1 (same names, camelCase, matching JSON
  serialization Spring produces by default).
- Produces: `Vpn.sistemaOperativoActualizado/forticlientInstalado: boolean | null` on the frontend
  model — consumed by Task 3 (list detail modal).

- [ ] **Step 1: Add the new fields to `vpn.model.ts`**

Change the `Vpn` interface — insert after `analisisAntivirusRealizado`:

```typescript
  antivirusVerificado: boolean | null;
  analisisAntivirusRealizado: boolean | null;
  sistemaOperativoActualizado: boolean | null;
  forticlientInstalado: boolean | null;
  hostActualizado: boolean | null;
```

Change the `VpnSolicitudRequest` interface — insert after `analisisAntivirusRealizado`:

```typescript
  antivirusVerificado: boolean;
  analisisAntivirusRealizado: boolean;
  sistemaOperativoActualizado: boolean;
  forticlientInstalado: boolean;
  hostActualizado: boolean | null;
  vencimientoAntivirus: string | null;
```

- [ ] **Step 2: Rewrite `vpn-form.component.ts`**

```typescript
import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CARGOS_VPN, CARGOS_VPN_EXTERNO, Vpn } from './vpn.model';
import { VpnService } from './vpn.service';
import { UsuarioRedService } from '../usuarios-red/usuario-red.service';
import { EquipoService } from '../equipos/equipo.service';
import { UsuarioRed } from '../usuarios-red/usuario-red.model';
import { EquipoResumen } from '../equipos/equipo.model';

type TitularModo = 'buscando' | 'ad-seleccionado' | 'externo';

@Component({
  selector: 'app-vpn-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './vpn-form.component.html',
  styleUrl: './vpn-form.component.scss',
})
export class VpnFormComponent implements OnChanges {
  private fb = inject(FormBuilder);
  private service = inject(VpnService);
  private usuarioRedService = inject(UsuarioRedService);
  private equipoService = inject(EquipoService);

  @Input() vpn: Vpn | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  readonly cargos = CARGOS_VPN;
  readonly cargosExterno = CARGOS_VPN_EXTERNO;

  titularModo: TitularModo = 'buscando';
  adSearchTerm = '';
  adResults: UsuarioRed[] = [];
  adBusquedaRealizada = false;
  private adSearchTimeout?: ReturnType<typeof setTimeout>;

  selectedAdUserId: number | null = null;
  adUserSelected: UsuarioRed | null = null;

  equipoResults: EquipoResumen[] = [];
  equipoSeleccionado: EquipoResumen | null = null;
  equipoSearchTerm = '';
  private equipoSearchTimeout?: ReturnType<typeof setTimeout>;

  form = this.fb.nonNullable.group({
    titularNombre: [''],
    titularApellidos: [''],
    titularCorreo: [''],
    titularEmpresa: [''],
    titularMotivo: [''],
    titularCargo: ['', Validators.required],
    tipoEquipo: ['PERSONAL' as 'INIA' | 'PERSONAL', Validators.required],
    tieneGlpi: [false],
    glpiComputerId: [null as number | null],
    antivirusVerificado: [false, Validators.requiredTrue],
    analisisAntivirusRealizado: [false, Validators.requiredTrue],
    hostActualizado: [false],
    sistemaOperativoActualizado: [false, Validators.requiredTrue],
    forticlientInstalado: [false, Validators.requiredTrue],
    vencimientoAntivirus: [null as string | null],
  });

  get esInia(): boolean {
    return this.form.getRawValue().tipoEquipo === 'INIA';
  }

  get tieneGlpi(): boolean {
    return this.form.getRawValue().tieneGlpi;
  }

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

  ngOnChanges(): void {
    if (this.vpn) {
      this.form.patchValue({
        tipoEquipo: (this.vpn.tipoEquipo ?? 'PERSONAL') as 'INIA' | 'PERSONAL',
        tieneGlpi: this.vpn.glpiComputerId !== null,
        glpiComputerId: this.vpn.glpiComputerId,
        antivirusVerificado: this.vpn.antivirusVerificado ?? false,
        analisisAntivirusRealizado: this.vpn.analisisAntivirusRealizado ?? false,
        hostActualizado: this.vpn.hostActualizado ?? false,
        sistemaOperativoActualizado: this.vpn.sistemaOperativoActualizado ?? false,
        forticlientInstalado: this.vpn.forticlientInstalado ?? false,
        vencimientoAntivirus: this.vpn.vencimientoAntivirus ?? null,
        titularCargo: this.vpn.titularCargo ?? '',
      });
      this.applyVerificacionValidators();
      if (this.vpn.glpiComputerId && this.vpn.glpiNombreEquipo) {
        this.equipoSeleccionado = {
          computerID: this.vpn.glpiComputerId,
          nombreEquipo: this.vpn.glpiNombreEquipo,
          ipEquipo: this.vpn.glpiIpEquipo,
        } as EquipoResumen;
      }
      if (this.vpn.usuarioRed) {
        this.selectedAdUserId = this.vpn.usuarioRed.id;
        this.adUserSelected = this.vpn.usuarioRed as UsuarioRed;
        this.setTitularModo('ad-seleccionado');
      } else if (this.vpn.titularTipo === 'EXTERNO') {
        this.form.patchValue({
          titularNombre: this.vpn.titularNombre ?? '',
          titularApellidos: this.vpn.titularApellidos ?? '',
          titularCorreo: this.vpn.titularCorreo ?? '',
          titularEmpresa: this.vpn.titularEmpresa ?? '',
          titularMotivo: this.vpn.titularMotivo ?? '',
        });
        this.setTitularModo('externo');
      }
    } else {
      this.resetAll();
    }
  }

  onAdSearch(term: string): void {
    this.adSearchTerm = term;
    clearTimeout(this.adSearchTimeout);
    this.adSearchTimeout = setTimeout(() => {
      if (!term.trim()) {
        this.adResults = [];
        this.adBusquedaRealizada = false;
        return;
      }
      this.usuarioRedService.getAll(term).subscribe((data) => {
        this.adResults = data;
        this.adBusquedaRealizada = true;
      });
    }, 300);
  }

  onAdUserSelected(usuario: UsuarioRed): void {
    this.selectedAdUserId = usuario.id;
    this.adUserSelected = usuario;
    this.adResults = [];
    this.adSearchTerm = '';
    this.setTitularModo('ad-seleccionado');
  }

  onCambiarUsuario(): void {
    this.selectedAdUserId = null;
    this.adUserSelected = null;
    this.setTitularModo('buscando');
  }

  onElegirExterno(): void {
    this.setTitularModo('externo');
  }

  onVolverABuscar(): void {
    this.setTitularModo('buscando');
  }

  setTitularModo(modo: TitularModo): void {
    const cruzaFronteraExterno = (this.titularModo === 'externo') !== (modo === 'externo');
    this.titularModo = modo;
    if (cruzaFronteraExterno) {
      this.form.patchValue({ titularCargo: '' });
    }
    this.applyTitularValidators();
  }

  onTipoEquipoChange(): void {
    if (this.esInia) {
      this.form.patchValue({ vencimientoAntivirus: null });
    } else {
      this.form.patchValue({ tieneGlpi: false, glpiComputerId: null, hostActualizado: false });
      this.equipoSeleccionado = null;
    }
    this.applyVerificacionValidators();
  }

  onTieneGlpiChange(): void {
    if (!this.tieneGlpi) {
      this.form.patchValue({ glpiComputerId: null, hostActualizado: false });
      this.equipoSeleccionado = null;
    }
  }

  onEquipoSearch(term: string): void {
    this.equipoSearchTerm = term;
    clearTimeout(this.equipoSearchTimeout);
    this.equipoSearchTimeout = setTimeout(() => {
      if (!term.trim()) {
        this.equipoResults = [];
        return;
      }
      this.equipoService.getAll({ search: term }).subscribe((data) => (this.equipoResults = data));
    }, 300);
  }

  onEquipoSelected(equipo: EquipoResumen): void {
    this.equipoSeleccionado = equipo;
    this.equipoResults = [];
    this.equipoSearchTerm = '';
    this.form.patchValue({ glpiComputerId: equipo.computerID });
  }

  submit(): void {
    if (this.form.invalid) return;
    if (this.titularModo === 'buscando') {
      alert('Debe seleccionar un usuario de red o indicar los datos del tercero externo.');
      return;
    }
    const raw = this.form.getRawValue();
    const esExterno = this.titularModo === 'externo';
    const request = {
      usuarioRedId: this.titularModo === 'ad-seleccionado' ? this.selectedAdUserId : null,
      titularTipo: esExterno ? ('EXTERNO' as const) : null,
      titularNombre: esExterno ? raw.titularNombre : null,
      titularApellidos: esExterno ? raw.titularApellidos : null,
      titularCorreo: esExterno ? raw.titularCorreo : null,
      titularEmpresa: esExterno ? raw.titularEmpresa : null,
      titularMotivo: esExterno ? raw.titularMotivo : null,
      titularCargo: raw.titularCargo,
      tipoEquipo: raw.tipoEquipo,
      glpiComputerId: raw.tieneGlpi ? raw.glpiComputerId : null,
      antivirusVerificado: raw.antivirusVerificado,
      analisisAntivirusRealizado: raw.analisisAntivirusRealizado,
      hostActualizado: raw.tieneGlpi ? raw.hostActualizado : null,
      sistemaOperativoActualizado: raw.sistemaOperativoActualizado,
      forticlientInstalado: raw.forticlientInstalado,
      vencimientoAntivirus: raw.tipoEquipo === 'PERSONAL' ? raw.vencimientoAntivirus : null,
    };
    const obs = this.vpn
      ? this.service.update(this.vpn.id, request)
      : this.service.create(request);
    obs.subscribe(() => this.saved.emit());
  }

  private applyTitularValidators(): void {
    const nombre = this.form.controls.titularNombre;
    const apellidos = this.form.controls.titularApellidos;
    const correo = this.form.controls.titularCorreo;
    const empresa = this.form.controls.titularEmpresa;
    const motivo = this.form.controls.titularMotivo;

    if (this.titularModo === 'externo') {
      nombre.setValidators(Validators.required);
      apellidos.setValidators(Validators.required);
      correo.setValidators(Validators.required);
      empresa.setValidators(Validators.required);
      motivo.setValidators(Validators.required);
    } else {
      nombre.clearValidators();
      apellidos.clearValidators();
      correo.clearValidators();
      empresa.clearValidators();
      motivo.clearValidators();
    }

    nombre.updateValueAndValidity();
    apellidos.updateValueAndValidity();
    correo.updateValueAndValidity();
    empresa.updateValueAndValidity();
    motivo.updateValueAndValidity();
  }

  private applyVerificacionValidators(): void {
    const tieneGlpiCtrl = this.form.controls.tieneGlpi;
    const hostActualizadoCtrl = this.form.controls.hostActualizado;
    const vencimientoCtrl = this.form.controls.vencimientoAntivirus;

    if (this.esInia) {
      tieneGlpiCtrl.setValidators(Validators.requiredTrue);
      hostActualizadoCtrl.setValidators(Validators.requiredTrue);
      vencimientoCtrl.clearValidators();
    } else {
      tieneGlpiCtrl.clearValidators();
      hostActualizadoCtrl.clearValidators();
      vencimientoCtrl.setValidators(Validators.required);
    }

    tieneGlpiCtrl.updateValueAndValidity();
    hostActualizadoCtrl.updateValueAndValidity();
    vencimientoCtrl.updateValueAndValidity();
  }

  private resetAll(): void {
    this.selectedAdUserId = null;
    this.adUserSelected = null;
    this.adSearchTerm = '';
    this.adResults = [];
    this.adBusquedaRealizada = false;
    this.equipoSeleccionado = null;
    this.equipoResults = [];
    this.titularModo = 'buscando';
    this.form.reset({
      tipoEquipo: 'PERSONAL',
      tieneGlpi: false,
      antivirusVerificado: false,
      analisisAntivirusRealizado: false,
      hostActualizado: false,
      sistemaOperativoActualizado: false,
      forticlientInstalado: false,
      vencimientoAntivirus: null,
      titularCargo: '',
    });
    this.applyTitularValidators();
    this.applyVerificacionValidators();
  }
}
```

- [ ] **Step 3: Rewrite `vpn-form.component.html`**

```html
<form [formGroup]="form" (ngSubmit)="submit()">

  <!-- Titular: búsqueda AD / manual -->
  <div class="section-header ad-header">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
      <path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z" />
    </svg>
    Titular del acceso VPN
  </div>

  <ng-container *ngIf="titularModo === 'buscando'">
    <div class="field ad-field">
      <label>Buscar usuario de red (AD) *</label>
      <input type="text" [value]="adSearchTerm" (input)="onAdSearch($any($event.target).value)" placeholder="Nombre o usuario" />
      <ul class="equipo-results" *ngIf="adResults.length">
        <li *ngFor="let u of adResults" (click)="onAdUserSelected(u)">
          {{ u.nombre }} ({{ u.usuario }})
        </li>
      </ul>
    </div>

    <div class="titular-fallback">
      <p *ngIf="adBusquedaRealizada && adResults.length === 0">No se encontró en AD.</p>
      <div class="actions">
        <button type="button" class="secondary" (click)="onElegirExterno()">Externo</button>
      </div>
    </div>
  </ng-container>

  <div class="ad-preview" *ngIf="titularModo === 'ad-seleccionado' && adUserSelected">
    <div class="ad-preview-row">
      <span class="ad-label">Usuario</span>
      <span>{{ adUserSelected.usuario }}</span>
    </div>
    <div class="ad-preview-row">
      <span class="ad-label">Nombre</span>
      <span>{{ adUserSelected.nombre }}</span>
    </div>
    <div class="ad-preview-row" *ngIf="adUserSelected.sede">
      <span class="ad-label">Sede</span>
      <span>{{ adUserSelected.sede.nombre }}</span>
    </div>
    <div class="ad-preview-row" *ngIf="adUserSelected.dependencia">
      <span class="ad-label">Dependencia</span>
      <span>{{ adUserSelected.dependencia.nombre }}</span>
    </div>
    <button type="button" class="secondary" (click)="onCambiarUsuario()">Cambiar usuario</button>
  </div>

  <ng-container *ngIf="titularModo === 'externo'">
    <div class="field">
      <label>Nombre *</label>
      <input type="text" formControlName="titularNombre" />
    </div>
    <div class="field">
      <label>Apellidos *</label>
      <input type="text" formControlName="titularApellidos" />
    </div>
    <div class="field">
      <label>Correo *</label>
      <input type="email" formControlName="titularCorreo" />
    </div>
    <div class="field">
      <label>Empresa *</label>
      <input type="text" formControlName="titularEmpresa" />
    </div>
    <div class="field">
      <label>Motivo *</label>
      <input type="text" formControlName="titularMotivo" placeholder="Ej. Consultor externo - Proyecto X" />
    </div>
    <div class="field">
      <label>Cargo *</label>
      <select formControlName="titularCargo">
        <option value="">Seleccione...</option>
        <option *ngFor="let cargo of cargosExterno" [value]="cargo">{{ cargo }}</option>
      </select>
    </div>
    <button type="button" class="secondary" (click)="onVolverABuscar()">Volver a buscar en AD</button>
  </ng-container>

  <div class="field" *ngIf="titularModo !== 'externo'">
    <label>Cargo *</label>
    <select formControlName="titularCargo">
      <option value="">Seleccione...</option>
      <option *ngFor="let cargo of cargos" [value]="cargo">{{ cargo }}</option>
    </select>
  </div>

  <hr class="divider" />

  <!-- Verificaciones -->
  <div class="section-header">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
      <path fill-rule="evenodd" d="M10 1.75a.75.75 0 0 1 .692.462l1.41 3.393 3.664.293a.75.75 0 0 1 .428 1.317l-2.791 2.39.853 3.575a.75.75 0 0 1-1.12.814L10 12.347l-3.135 1.647a.75.75 0 0 1-1.12-.814l.852-3.575-2.79-2.39a.75.75 0 0 1 .427-1.317l3.663-.293 1.41-3.393A.75.75 0 0 1 10 1.75Z" clip-rule="evenodd" />
    </svg>
    Verificaciones de seguridad
  </div>

  <div class="field">
    <label>Tipo de equipo</label>
    <div class="radio-group">
      <label>
        <input type="radio" formControlName="tipoEquipo" value="INIA" (change)="onTipoEquipoChange()" />
        Equipo de INIA
      </label>
      <label>
        <input type="radio" formControlName="tipoEquipo" value="PERSONAL" (change)="onTipoEquipoChange()" />
        Equipo personal
      </label>
    </div>
  </div>

  <ng-container *ngIf="esInia">
    <div class="field checkbox-field">
      <label>
        <input type="checkbox" formControlName="antivirusVerificado" />
        Antivirus institucional verificado
      </label>
    </div>

    <div class="field checkbox-field">
      <label>
        <input type="checkbox" formControlName="sistemaOperativoActualizado" [disabled]="!pasoSoActualizadoHabilitado" />
        Sistema operativo actualizado
      </label>
    </div>

    <div class="field checkbox-field">
      <label>
        <input type="checkbox" formControlName="forticlientInstalado" [disabled]="!pasoForticlientHabilitado" />
        Forticlient instalado
      </label>
    </div>

    <div class="field checkbox-field">
      <label>
        <input type="checkbox" formControlName="tieneGlpi" (change)="onTieneGlpiChange()" [disabled]="!pasoGlpiHabilitado" />
        ¿Tiene GLPI instalado?
      </label>
    </div>

    <div class="field" *ngIf="tieneGlpi">
      <label>Buscar equipo GLPI</label>
      <input type="text" [value]="equipoSearchTerm" (input)="onEquipoSearch($any($event.target).value)" placeholder="Nombre de equipo o usuario de contacto" />
      <ul class="equipo-results" *ngIf="equipoResults.length">
        <li *ngFor="let e of equipoResults" (click)="onEquipoSelected(e)">
          {{ e.nombreEquipo }} — {{ e.usuarioContacto }}
        </li>
      </ul>
      <div class="equipo-preview" *ngIf="equipoSeleccionado">
        <span class="ad-label">Host</span> {{ equipoSeleccionado.nombreEquipo }}
        <ng-container *ngIf="equipoSeleccionado.ipEquipo">
          | <span class="ad-label">IP</span> {{ equipoSeleccionado.ipEquipo }}
        </ng-container>
      </div>
    </div>

    <div class="field checkbox-field" *ngIf="tieneGlpi">
      <label>
        <input type="checkbox" formControlName="hostActualizado" />
        Host actualizado
      </label>
    </div>
  </ng-container>

  <ng-container *ngIf="!esInia">
    <div class="field checkbox-field">
      <label>
        <input type="checkbox" formControlName="antivirusVerificado" />
        Antivirus con protección anti-ransomware verificado
      </label>
    </div>

    <div class="field">
      <label>Fecha de vencimiento de licencia de antivirus *</label>
      <input type="date" formControlName="vencimientoAntivirus" [disabled]="!pasoVencimientoHabilitado" />
    </div>

    <div class="field checkbox-field">
      <label>
        <input type="checkbox" formControlName="sistemaOperativoActualizado" [disabled]="!pasoSoActualizadoHabilitado" />
        Sistema operativo actualizado
      </label>
    </div>

    <div class="field checkbox-field">
      <label>
        <input type="checkbox" formControlName="forticlientInstalado" [disabled]="!pasoForticlientHabilitado" />
        Forticlient instalado
      </label>
    </div>
  </ng-container>

  <div class="field checkbox-field">
    <label>
      <input type="checkbox" formControlName="analisisAntivirusRealizado" [disabled]="!pasoAnalisisHabilitado" />
      Análisis de antivirus al equipo realizado
    </label>
  </div>

  <div class="actions">
    <button type="button" class="secondary" (click)="cancelled.emit()">Cancelar</button>
    <button type="submit" [disabled]="form.invalid">Guardar</button>
  </div>
</form>
```

- [ ] **Step 4: Compile-check**

Run: `cd soportedesk-frontend && npx tsc --noEmit -p tsconfig.app.json`
Expected: no errors.

- [ ] **Step 5: Build to catch template errors**

Run: `cd soportedesk-frontend && npx ng build 2>&1 | grep -iE "error|Application bundle"`
Expected: `Application bundle generation complete.` with no `error` lines.

- [ ] **Step 6: Commit**

```bash
git add soportedesk-frontend/src/app/features/vpn/vpn.model.ts \
        soportedesk-frontend/src/app/features/vpn/vpn-form.component.ts \
        soportedesk-frontend/src/app/features/vpn/vpn-form.component.html
git commit -m "feat(vpn): sequential, blocked verification checklist per equipment type"
```

---

## Task 3: Frontend — show the two new checks in the VPN detail modal

**Files:**
- Modify: `soportedesk-frontend/src/app/features/vpn/vpn-list.component.html`

**Interfaces:**
- Consumes: `Vpn.sistemaOperativoActualizado/forticlientInstalado: boolean | null` (Task 2).

- [ ] **Step 1: Add the two new fields to the detail modal**

Change:

```html
    <app-field label="Antivirus verificado">{{ viewing.antivirusVerificado ? 'Sí' : 'No' }}</app-field>
    <app-field label="Análisis de antivirus realizado">{{ viewing.analisisAntivirusRealizado ? 'Sí' : 'No' }}</app-field>
    <app-field label="Host actualizado" *ngIf="viewing.glpiComputerId">{{ viewing.hostActualizado ? 'Sí' : 'No' }}</app-field>
```

to:

```html
    <app-field label="Antivirus verificado">{{ viewing.antivirusVerificado ? 'Sí' : 'No' }}</app-field>
    <app-field label="Sistema operativo actualizado">{{ viewing.sistemaOperativoActualizado ? 'Sí' : 'No' }}</app-field>
    <app-field label="Forticlient instalado">{{ viewing.forticlientInstalado ? 'Sí' : 'No' }}</app-field>
    <app-field label="Análisis de antivirus realizado">{{ viewing.analisisAntivirusRealizado ? 'Sí' : 'No' }}</app-field>
    <app-field label="Host actualizado" *ngIf="viewing.glpiComputerId">{{ viewing.hostActualizado ? 'Sí' : 'No' }}</app-field>
```

- [ ] **Step 2: Build**

Run: `cd soportedesk-frontend && npx ng build 2>&1 | grep -iE "error|Application bundle"`
Expected: `Application bundle generation complete.` with no `error` lines.

- [ ] **Step 3: Commit**

```bash
git add soportedesk-frontend/src/app/features/vpn/vpn-list.component.html
git commit -m "feat(vpn): show sistema operativo / forticlient checks in VPN detail modal"
```

---

## Task 4: Database migration (prepared, not executed)

**Files:**
- Create: `docs/superpowers/migrations/2026-07-08-vpn-checklist-verificacion.sql`

**Interfaces:** none — standalone SQL script. Do **not** run it against the database as part of
this plan.

- [ ] **Step 1: Write the migration file**

```sql
-- Migracion: checklist de verificacion VPN - SO actualizado, Forticlient instalado
-- Ejecutar en: ssti (SQL Server)
-- Idempotente: se puede volver a ejecutar sin duplicar columnas.

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

-- Verificacion
SELECT COL_LENGTH('dbo.vpn', 'sistema_operativo_actualizado') AS sistema_operativo_actualizado_ok,
       COL_LENGTH('dbo.vpn', 'forticlient_instalado') AS forticlient_instalado_ok;
GO
```

Save to `docs/superpowers/migrations/2026-07-08-vpn-checklist-verificacion.sql`.

- [ ] **Step 2: Tell the user this script is ready but not run**

State explicitly: this file is committed but **not executed** against `ssti`. The user runs it
manually against the database (SSMS or equivalent) — same as the two VPN migrations from the
previous cycle.

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/migrations/2026-07-08-vpn-checklist-verificacion.sql
git commit -m "chore(vpn): add prepared migration for checklist verification columns"
```

---

## Task 5: Full verification pass

**Files:** none (verification only)

- [ ] **Step 1: Run the full backend test suite**

Run: `cd soportedesk-backend && mvn test -q`
Expected: BUILD SUCCESS (no new failures introduced by this plan).

- [ ] **Step 2: Build the frontend**

Run: `cd soportedesk-frontend && npx ng build`
Expected: `Application bundle generation complete.` with no errors.

- [ ] **Step 3: Manual verification**

The backend jar and `ng serve` need to be rebuilt/restarted to pick up these changes (kill the
running processes on 8080/4200, `mvn package -DskipTests` for the backend, relaunch both). Then,
logged in as a user with `solicitar-vpn`:

1. Start a new solicitud, pick "Equipo de INIA" — confirm "Sistema operativo actualizado" and
   "Forticlient instalado" checkboxes are visually disabled (grayed out, unclickable) until you
   check "Antivirus institucional verificado" first, then each subsequent one unlocks only after
   the previous is checked, ending with "¿Tiene GLPI instalado?" and then "Host actualizado" and
   "Análisis de antivirus realizado".
2. Confirm "Guardar" stays disabled until all 6 INIA checks are satisfied, and becomes enabled once
   they are (with valid titular + cargo already selected).
3. Switch to "Equipo personal" — confirm the sequence resets: "Antivirus con protección
   anti-ransomware" first, then the date input "Fecha de vencimiento de licencia de antivirus"
   unlocks, then "Sistema operativo actualizado", then "Forticlient instalado", then "Análisis de
   antivirus realizado" — each disabled until the previous is satisfied.
4. Submit a personal-equipment solicitud with a real date in "Fecha de vencimiento de licencia de
   antivirus" — open its detail modal and confirm "Antivirus (monitoreo)" → "Vence antivirus" shows
   that date, and "Sistema operativo actualizado"/"Forticlient instalado" show "Sí".

Report which of these four checks you actually performed and what you observed — don't report this
task complete without having done so.

- [ ] **Step 4: Fix any issues found**

If Step 3 surfaces bugs, fix them with a normal edit/test/commit cycle following the patterns in
Task 1 (backend) or Task 2 (frontend) — do not skip writing/updating a test for the fix.
