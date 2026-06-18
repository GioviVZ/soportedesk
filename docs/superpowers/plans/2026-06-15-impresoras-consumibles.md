# Impresoras — Consumibles por Modelo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar los campos de porcentaje de consumibles por campos de modelo (String), y agregar un panel de resumen que agrupa impresoras por modelo de consumible filtrable por piso/área.

**Architecture:** Cambio de tipo Integer→String en backend (Impresora + ImpresoraRequest + Service) con ALTER TABLE manual en MySQL, seguido de cambios en frontend (model, form, ficha) y un nuevo componente `ImpresoraResumenComponent` integrado en la lista.

**Tech Stack:** Spring Boot 3.2.5 / Java 17 / Lombok / Angular 17+ standalone / CSS custom properties

---

## File Map

| Archivo | Acción |
|---|---|
| `soportedesk-backend/.../impresoras/Impresora.java` | Modificar |
| `soportedesk-backend/.../impresoras/ImpresoraRequest.java` | Modificar |
| `soportedesk-backend/.../impresoras/ImpresoraService.java` | Modificar |
| `soportedesk-backend/.../impresoras/ImpresoraServiceTest.java` | Modificar |
| `soportedesk-backend/.../impresoras/ImpresoraControllerIT.java` | Modificar |
| `soportedesk-backend/.../impresoras/ImpresoraDriverControllerIT.java` | Modificar |
| `soportedesk-frontend/.../impresoras/impresora.model.ts` | Modificar |
| `soportedesk-frontend/.../impresoras/impresora-form.component.ts` | Modificar |
| `soportedesk-frontend/.../impresoras/impresora-form.component.html` | Modificar |
| `soportedesk-frontend/.../impresoras/impresora-ficha.component.ts` | Modificar |
| `soportedesk-frontend/.../impresoras/impresora-ficha.component.html` | Modificar |
| `soportedesk-frontend/.../impresoras/impresora-ficha.component.scss` | Modificar |
| `soportedesk-frontend/.../impresoras/impresora-ficha.component.spec.ts` | Modificar |
| `soportedesk-frontend/.../impresoras/impresora-resumen.component.ts` | **Crear** |
| `soportedesk-frontend/.../impresoras/impresora-resumen.component.html` | **Crear** |
| `soportedesk-frontend/.../impresoras/impresora-resumen.component.scss` | **Crear** |
| `soportedesk-frontend/.../impresoras/impresoras-list.component.ts` | Modificar |
| `soportedesk-frontend/.../impresoras/impresoras-list.component.html` | Modificar |

---

## Task 1: Migración MySQL (paso manual)

**Files:** ninguno — comando directo en la DB

- [ ] **Step 1: Conectarse a MySQL y ejecutar el ALTER TABLE**

```sql
ALTER TABLE impresoras
  CHANGE toner_negro   modelo_toner_negro VARCHAR(100),
  CHANGE toner_c       modelo_toner_c     VARCHAR(100),
  CHANGE toner_m       modelo_toner_m     VARCHAR(100),
  CHANGE toner_y       modelo_toner_y     VARCHAR(100),
  CHANGE cartucho      modelo_cartucho    VARCHAR(100),
  CHANGE drum          modelo_drum        VARCHAR(100),
  CHANGE fusor         modelo_fusor       VARCHAR(100);
```

Ejecutar desde MySQL Workbench, DBeaver o CLI: `mysql -u root -p ssti`

- [ ] **Step 2: Verificar estructura**

```sql
DESCRIBE impresoras;
```

Esperado: columnas `modelo_toner_negro`, `modelo_toner_c`, etc. de tipo `varchar(100)`.

---

## Task 2: Backend — entidad e DTO

**Files:**
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/Impresora.java`
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/ImpresoraRequest.java`

- [ ] **Step 1: Reemplazar `Impresora.java` completo**

```java
package com.inia.soportedesk.impresoras;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "impresoras")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Impresora {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    @Column(nullable = false)
    private String marca;

    @Column(nullable = false)
    private String modelo;

    private String ip;
    private String piso;
    private String area;

    @Column(nullable = false)
    private String estado;

    @Column(name = "modelo_toner_negro")
    private String modeloTonerNegro;

    @Column(name = "modelo_toner_c")
    private String modeloTonerC;

    @Column(name = "modelo_toner_m")
    private String modeloTonerM;

    @Column(name = "modelo_toner_y")
    private String modeloTonerY;

    @Column(name = "modelo_cartucho")
    private String modeloCartucho;

    @Column(name = "modelo_drum")
    private String modeloDrum;

    @Column(name = "modelo_fusor")
    private String modeloFusor;

    @Column(name = "driver_nombre")
    private String driverNombre;

    @Column(name = "driver_version")
    private String driverVersion;

    @Column(name = "driver_so")
    private String driverSo;

    @Column(name = "driver_archivo_path")
    private String driverArchivoPath;
}
```

- [ ] **Step 2: Reemplazar `ImpresoraRequest.java` completo**

```java
package com.inia.soportedesk.impresoras;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ImpresoraRequest {

    @NotBlank
    private String nombre;

    @NotBlank
    private String marca;

    @NotBlank
    private String modelo;

    private String ip;
    private String piso;
    private String area;

    @NotBlank
    private String estado;

    @Size(max = 100)
    private String modeloTonerNegro;

    @Size(max = 100)
    private String modeloTonerC;

    @Size(max = 100)
    private String modeloTonerM;

    @Size(max = 100)
    private String modeloTonerY;

    @Size(max = 100)
    private String modeloCartucho;

    @Size(max = 100)
    private String modeloDrum;

    @Size(max = 100)
    private String modeloFusor;
}
```

- [ ] **Step 3: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/Impresora.java
git add soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/ImpresoraRequest.java
git commit -m "refactor(impresoras): consumibles Integer→String con nombres de modelo"
```

---

## Task 3: Backend — ImpresoraService

**Files:**
- Modify: `soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/ImpresoraService.java`

- [ ] **Step 1: Actualizar método `copyFields` y agregar helper `emptyToNull`**

Reemplazar el método `copyFields` y agregar el helper privado al final de la clase:

```java
private void copyFields(Impresora impresora, ImpresoraRequest request) {
    impresora.setNombre(request.getNombre());
    impresora.setMarca(request.getMarca());
    impresora.setModelo(request.getModelo());
    impresora.setIp(request.getIp());
    impresora.setPiso(request.getPiso());
    impresora.setArea(request.getArea());
    impresora.setEstado(request.getEstado());
    impresora.setModeloTonerNegro(emptyToNull(request.getModeloTonerNegro()));
    impresora.setModeloTonerC(emptyToNull(request.getModeloTonerC()));
    impresora.setModeloTonerM(emptyToNull(request.getModeloTonerM()));
    impresora.setModeloTonerY(emptyToNull(request.getModeloTonerY()));
    impresora.setModeloCartucho(emptyToNull(request.getModeloCartucho()));
    impresora.setModeloDrum(emptyToNull(request.getModeloDrum()));
    impresora.setModeloFusor(emptyToNull(request.getModeloFusor()));
}

private String emptyToNull(String val) {
    return (val == null || val.isBlank()) ? null : val.trim();
}
```

- [ ] **Step 2: Commit**

```bash
git add soportedesk-backend/src/main/java/com/inia/soportedesk/impresoras/ImpresoraService.java
git commit -m "refactor(impresoras): actualizar copyFields con nuevos campos de modelo"
```

---

## Task 4: Backend — Tests

**Files:**
- Modify: `soportedesk-backend/src/test/java/com/inia/soportedesk/impresoras/ImpresoraServiceTest.java`
- Modify: `soportedesk-backend/src/test/java/com/inia/soportedesk/impresoras/ImpresoraControllerIT.java`
- Modify: `soportedesk-backend/src/test/java/com/inia/soportedesk/impresoras/ImpresoraDriverControllerIT.java`

- [ ] **Step 1: Reemplazar `ImpresoraServiceTest.java` completo**

```java
package com.inia.soportedesk.impresoras;

import com.inia.soportedesk.exception.ResourceNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ImpresoraServiceTest {

    @Mock
    private ImpresoraRepository repository;

    @InjectMocks
    private ImpresoraService service;

    private ImpresoraRequest sampleRequest() {
        ImpresoraRequest request = new ImpresoraRequest();
        request.setNombre("HP LaserJet 4ta planta");
        request.setMarca("HP");
        request.setModelo("M404dn");
        request.setIp("10.0.0.50");
        request.setPiso("4");
        request.setArea("Administración");
        request.setEstado("Activa");
        request.setModeloTonerNegro("TN-2380");
        request.setModeloCartucho("CB435A");
        request.setModeloDrum("DR-2365");
        return request;
    }

    private Impresora sampleImpresora(Long id) {
        return new Impresora(id, "HP LaserJet 4ta planta", "HP", "M404dn", "10.0.0.50",
                "4", "Administración", "Activa",
                "TN-2380", null, null, null, "CB435A", "DR-2365", null,
                null, null, null, null);
    }

    @Test
    void findAll_withoutSearch_returnsAll() {
        when(repository.findAll()).thenReturn(List.of(sampleImpresora(1L)));

        List<Impresora> result = service.findAll(null);

        assertThat(result).hasSize(1);
        verify(repository).findAll();
    }

    @Test
    void findById_whenNotFound_throwsResourceNotFoundException() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.findById(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void create_savesImpresoraWithModeloConsumibles() {
        when(repository.save(any(Impresora.class))).thenAnswer(inv -> inv.getArgument(0));

        Impresora result = service.create(sampleRequest());

        assertThat(result.getNombre()).isEqualTo("HP LaserJet 4ta planta");
        assertThat(result.getModeloTonerNegro()).isEqualTo("TN-2380");
        assertThat(result.getModeloDrum()).isEqualTo("DR-2365");
    }

    @Test
    void create_blankModelo_storesNull() {
        ImpresoraRequest request = sampleRequest();
        request.setModeloTonerNegro("   ");

        when(repository.save(any(Impresora.class))).thenAnswer(inv -> inv.getArgument(0));

        Impresora result = service.create(request);

        assertThat(result.getModeloTonerNegro()).isNull();
    }

    @Test
    void update_preservesDriverFields() {
        Impresora existing = new Impresora(1L, "HP LaserJet 4ta planta", "HP", "M404dn", "10.0.0.50",
                "4", "Administración", "Activa",
                "TN-2380", null, null, null, "CB435A", "DR-2365", null,
                "driver-hp.zip", "1.2", "Windows 10", "drivers/1/driver-hp.zip");
        when(repository.findById(1L)).thenReturn(Optional.of(existing));
        when(repository.save(any(Impresora.class))).thenAnswer(inv -> inv.getArgument(0));

        ImpresoraRequest request = sampleRequest();
        request.setModeloTonerNegro("TN-2500");

        Impresora result = service.update(1L, request);

        assertThat(result.getModeloTonerNegro()).isEqualTo("TN-2500");
        assertThat(result.getDriverArchivoPath()).isEqualTo("drivers/1/driver-hp.zip");
    }

    @Test
    void delete_removesExistingImpresora() {
        Impresora impresora = sampleImpresora(1L);
        when(repository.findById(1L)).thenReturn(Optional.of(impresora));

        service.delete(1L);

        verify(repository).delete(impresora);
    }
}
```

- [ ] **Step 2: Reemplazar `ImpresoraControllerIT.java` completo**

```java
package com.inia.soportedesk.impresoras;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class ImpresoraControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ImpresoraService service;

    private ImpresoraRequest sampleRequest() {
        ImpresoraRequest request = new ImpresoraRequest();
        request.setNombre("HP LaserJet 4ta planta");
        request.setMarca("HP");
        request.setModelo("M404dn");
        request.setIp("10.0.0.50");
        request.setPiso("4");
        request.setArea("Administración");
        request.setEstado("Activa");
        request.setModeloTonerNegro("TN-2380");
        request.setModeloDrum("DR-2365");
        return request;
    }

    private Impresora sampleImpresora() {
        return new Impresora(1L, "HP LaserJet 4ta planta", "HP", "M404dn", "10.0.0.50",
                "4", "Administración", "Activa",
                "TN-2380", null, null, null, null, "DR-2365", null,
                null, null, null, null);
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void findAll_allowsAuthenticatedUser() throws Exception {
        when(service.findAll(null)).thenReturn(List.of(sampleImpresora()));

        mockMvc.perform(get("/api/impresoras"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].nombre", is("HP LaserJet 4ta planta")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void create_withAdminRole_returnsCreated() throws Exception {
        when(service.create(any())).thenReturn(sampleImpresora());

        mockMvc.perform(post("/api/impresoras")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nombre", is("HP LaserJet 4ta planta")));
    }

    @Test
    @WithMockUser(roles = "SOPORTE")
    void create_withSoporteRole_returnsForbidden() throws Exception {
        mockMvc.perform(post("/api/impresoras")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isForbidden());
    }
}
```

- [ ] **Step 3: Actualizar constructor en `ImpresoraDriverControllerIT.java`**

Reemplazar las 2 instancias de `new Impresora(...)` en el archivo:

```java
// línea ~39 (uploadDriver test)
Impresora impresora = new Impresora(1L, "HP LaserJet 4ta planta", "HP", "M404dn", "10.0.0.50",
        "4", "Administración", "Activa",
        "TN-2380", null, null, null, null, "DR-2365", null,
        "driver-hp.zip", "1.2", "Windows 10", "1/driver-hp.zip");

// línea ~69 (downloadDriver test)
Impresora impresora = new Impresora(2L, "Canon 2da planta", "Canon", "LBP226dw", "10.0.0.60",
        "2", "Mesa de Partes", "Activa",
        "TN-2370", null, null, null, null, "DR-2360", null,
        "driver-canon.zip", "2.0", "Windows 11", "2/driver-canon.zip");
```

- [ ] **Step 4: Ejecutar tests backend**

```bash
cd soportedesk-backend
mvn test -pl . -Dtest="ImpresoraServiceTest,ImpresoraControllerIT,ImpresoraDriverControllerIT" -q
```

Esperado: `BUILD SUCCESS`, 0 errores.

- [ ] **Step 5: Commit**

```bash
git add soportedesk-backend/src/test/
git commit -m "test(impresoras): actualizar tests para campos de modelo String"
```

---

## Task 5: Frontend — modelo de datos

**Files:**
- Modify: `soportedesk-frontend/src/app/features/impresoras/impresora.model.ts`

- [ ] **Step 1: Reemplazar `impresora.model.ts` completo**

```typescript
export interface Impresora {
  id: number;
  nombre: string;
  marca: string;
  modelo: string;
  ip: string;
  piso: string;
  area: string;
  estado: string;
  modeloTonerNegro: string | null;
  modeloTonerC: string | null;
  modeloTonerM: string | null;
  modeloTonerY: string | null;
  modeloCartucho: string | null;
  modeloDrum: string | null;
  modeloFusor: string | null;
  driverNombre: string | null;
  driverVersion: string | null;
  driverSo: string | null;
  driverArchivoPath: string | null;
}

export type ImpresoraRequest = Omit<
  Impresora,
  'id' | 'driverNombre' | 'driverVersion' | 'driverSo' | 'driverArchivoPath'
>;
```

- [ ] **Step 2: Commit**

```bash
git add soportedesk-frontend/src/app/features/impresoras/impresora.model.ts
git commit -m "refactor(impresoras): modelo frontend con campos modeloTonerNegro etc."
```

---

## Task 6: Frontend — formulario

**Files:**
- Modify: `soportedesk-frontend/src/app/features/impresoras/impresora-form.component.ts`
- Modify: `soportedesk-frontend/src/app/features/impresoras/impresora-form.component.html`

- [ ] **Step 1: Reemplazar `impresora-form.component.ts` completo**

```typescript
import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Impresora } from './impresora.model';
import { ImpresoraService } from './impresora.service';

@Component({
  selector: 'app-impresora-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './impresora-form.component.html',
  styleUrl: './impresora-form.component.scss',
})
export class ImpresoraFormComponent implements OnChanges {
  private fb = inject(FormBuilder);
  private service = inject(ImpresoraService);

  @Input() impresora: Impresora | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  form = this.fb.nonNullable.group({
    nombre:          ['', Validators.required],
    marca:           ['', Validators.required],
    modelo:          ['', Validators.required],
    ip:              [''],
    piso:            [''],
    area:            [''],
    estado:          ['Activa', Validators.required],
    modeloTonerNegro: [''],
    modeloTonerC:     [''],
    modeloTonerM:     [''],
    modeloTonerY:     [''],
    modeloCartucho:   [''],
    modeloDrum:       [''],
    modeloFusor:      [''],
  });

  ngOnChanges(): void {
    if (this.impresora) {
      this.form.patchValue({
        nombre:           this.impresora.nombre,
        marca:            this.impresora.marca,
        modelo:           this.impresora.modelo,
        ip:               this.impresora.ip,
        piso:             this.impresora.piso,
        area:             this.impresora.area,
        estado:           this.impresora.estado,
        modeloTonerNegro: this.impresora.modeloTonerNegro ?? '',
        modeloTonerC:     this.impresora.modeloTonerC     ?? '',
        modeloTonerM:     this.impresora.modeloTonerM     ?? '',
        modeloTonerY:     this.impresora.modeloTonerY     ?? '',
        modeloCartucho:   this.impresora.modeloCartucho   ?? '',
        modeloDrum:       this.impresora.modeloDrum       ?? '',
        modeloFusor:      this.impresora.modeloFusor      ?? '',
      });
    } else {
      this.form.reset({
        nombre: '', marca: '', modelo: '', ip: '', piso: '', area: '',
        estado: 'Activa',
        modeloTonerNegro: '', modeloTonerC: '', modeloTonerM: '', modeloTonerY: '',
        modeloCartucho: '', modeloDrum: '', modeloFusor: '',
      });
    }
  }

  submit(): void {
    if (this.form.invalid) return;
    const request = this.form.getRawValue();
    const obs = this.impresora
      ? this.service.update(this.impresora.id, request)
      : this.service.create(request);
    obs.subscribe(() => this.saved.emit());
  }
}
```

- [ ] **Step 2: Reemplazar `impresora-form.component.html` completo**

```html
<form [formGroup]="form" (ngSubmit)="submit()">
  <div class="two-col">
    <div class="field">
      <label>Nombre</label>
      <input type="text" formControlName="nombre" />
    </div>
    <div class="field">
      <label>Marca</label>
      <input type="text" formControlName="marca" />
    </div>
    <div class="field">
      <label>Modelo</label>
      <input type="text" formControlName="modelo" />
    </div>
    <div class="field">
      <label>IP</label>
      <input type="text" formControlName="ip" />
    </div>
    <div class="field">
      <label>Piso</label>
      <input type="text" formControlName="piso" />
    </div>
    <div class="field">
      <label>Área</label>
      <input type="text" formControlName="area" />
    </div>
    <div class="field">
      <label>Estado</label>
      <select formControlName="estado">
        <option value="Activa">Activa</option>
        <option value="En mantenimiento">En mantenimiento</option>
        <option value="De baja">De baja</option>
      </select>
    </div>
  </div>

  <h4>Modelos de consumibles</h4>
  <div class="two-col">
    <div class="field">
      <label>Tóner Negro</label>
      <input type="text" formControlName="modeloTonerNegro" placeholder="ej: TN-2380" />
    </div>
    <div class="field">
      <label>Tóner Cyan</label>
      <input type="text" formControlName="modeloTonerC" placeholder="ej: TN-223C" />
    </div>
    <div class="field">
      <label>Tóner Magenta</label>
      <input type="text" formControlName="modeloTonerM" placeholder="ej: TN-223M" />
    </div>
    <div class="field">
      <label>Tóner Amarillo</label>
      <input type="text" formControlName="modeloTonerY" placeholder="ej: TN-223Y" />
    </div>
    <div class="field">
      <label>Cartucho</label>
      <input type="text" formControlName="modeloCartucho" placeholder="ej: CB435A" />
    </div>
    <div class="field">
      <label>Drum</label>
      <input type="text" formControlName="modeloDrum" placeholder="ej: DR-2365" />
    </div>
    <div class="field">
      <label>Fusor</label>
      <input type="text" formControlName="modeloFusor" placeholder="ej: FK-502H" />
    </div>
  </div>

  <div class="actions">
    <button type="button" class="secondary" (click)="cancelled.emit()">Cancelar</button>
    <button type="submit" [disabled]="form.invalid">Guardar</button>
  </div>
</form>
```

- [ ] **Step 3: Commit**

```bash
git add soportedesk-frontend/src/app/features/impresoras/impresora-form.component.ts
git add soportedesk-frontend/src/app/features/impresoras/impresora-form.component.html
git commit -m "feat(impresoras): formulario con inputs de texto para modelos de consumibles"
```

---

## Task 7: Frontend — ficha

**Files:**
- Modify: `soportedesk-frontend/src/app/features/impresoras/impresora-ficha.component.ts`
- Modify: `soportedesk-frontend/src/app/features/impresoras/impresora-ficha.component.html`
- Modify: `soportedesk-frontend/src/app/features/impresoras/impresora-ficha.component.scss`
- Modify: `soportedesk-frontend/src/app/features/impresoras/impresora-ficha.component.spec.ts`

- [ ] **Step 1: Agregar método `hasConsumibles()` en `impresora-ficha.component.ts`**

Agregar dentro de la clase `ImpresoraFichaComponent`, después de `setTab()`:

```typescript
hasConsumibles(): boolean {
  return !!(
    this.impresora.modeloTonerNegro ||
    this.impresora.modeloTonerC     ||
    this.impresora.modeloTonerM     ||
    this.impresora.modeloTonerY     ||
    this.impresora.modeloCartucho   ||
    this.impresora.modeloDrum       ||
    this.impresora.modeloFusor
  );
}
```

- [ ] **Step 2: Reemplazar `impresora-ficha.component.html` completo**

```html
<div class="ficha">
  <div class="tabs">
    <button [class.active]="activeTab === 'instalacion'" (click)="setTab('instalacion')">Instalación</button>
    <button [class.active]="activeTab === 'consumibles'" (click)="setTab('consumibles')">Consumibles</button>
    <button [class.active]="activeTab === 'driver'" (click)="setTab('driver')">Driver</button>
  </div>

  <div class="content" *ngIf="activeTab === 'instalacion'">
    <div class="row"><span>Nombre</span><span>{{ impresora.nombre }}</span></div>
    <div class="row"><span>Marca</span><span>{{ impresora.marca }}</span></div>
    <div class="row"><span>Modelo</span><span>{{ impresora.modelo }}</span></div>
    <div class="row"><span>IP</span><span>{{ impresora.ip }}</span></div>
    <div class="row"><span>Piso</span><span>{{ impresora.piso }}</span></div>
    <div class="row"><span>Área</span><span>{{ impresora.area }}</span></div>
    <div class="row"><span>Estado</span><span>{{ impresora.estado }}</span></div>
  </div>

  <div class="content" *ngIf="activeTab === 'consumibles'">
    <ng-container *ngIf="hasConsumibles(); else noConsumibles">
      <div class="row" *ngIf="impresora.modeloTonerNegro">
        <span>Tóner Negro</span><span class="modelo-tag">{{ impresora.modeloTonerNegro }}</span>
      </div>
      <div class="row" *ngIf="impresora.modeloTonerC">
        <span>Tóner Cyan</span><span class="modelo-tag">{{ impresora.modeloTonerC }}</span>
      </div>
      <div class="row" *ngIf="impresora.modeloTonerM">
        <span>Tóner Magenta</span><span class="modelo-tag">{{ impresora.modeloTonerM }}</span>
      </div>
      <div class="row" *ngIf="impresora.modeloTonerY">
        <span>Tóner Amarillo</span><span class="modelo-tag">{{ impresora.modeloTonerY }}</span>
      </div>
      <div class="row" *ngIf="impresora.modeloCartucho">
        <span>Cartucho</span><span class="modelo-tag">{{ impresora.modeloCartucho }}</span>
      </div>
      <div class="row" *ngIf="impresora.modeloDrum">
        <span>Drum</span><span class="modelo-tag">{{ impresora.modeloDrum }}</span>
      </div>
      <div class="row" *ngIf="impresora.modeloFusor">
        <span>Fusor</span><span class="modelo-tag">{{ impresora.modeloFusor }}</span>
      </div>
    </ng-container>
    <ng-template #noConsumibles>
      <p class="no-consumibles">Sin modelos de consumibles registrados.</p>
    </ng-template>
  </div>

  <div class="content" *ngIf="activeTab === 'driver'">
    <ng-container *ngIf="impresora.driverNombre; else noDriver">
      <div class="row"><span>Nombre</span><span>{{ impresora.driverNombre }}</span></div>
      <div class="row"><span>Versión</span><span>{{ impresora.driverVersion }}</span></div>
      <div class="row"><span>S.O.</span><span>{{ impresora.driverSo }}</span></div>
      <button class="download-btn" (click)="downloadDriver()">Descargar driver</button>
    </ng-container>
    <ng-template #noDriver>
      <p class="no-driver">No hay driver cargado.</p>
    </ng-template>

    <ng-container *ngIf="isAdmin">
      <h4>Subir nuevo driver</h4>
      <input type="file" (change)="onFileSelected($event)" />
    </ng-container>
  </div>
</div>
```

- [ ] **Step 3: Agregar estilos al final de `impresora-ficha.component.scss`**

```scss
.modelo-tag {
  font-family: monospace;
  font-weight: 600;
  color: var(--color-primary);
  font-size: 13px;
}

.no-consumibles {
  color: var(--color-gray);
  font-style: italic;
  font-size: 14px;
  padding: 8px 0;
}
```

- [ ] **Step 4: Reemplazar `impresora-ficha.component.spec.ts` completo**

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ImpresoraFichaComponent } from './impresora-ficha.component';
import { AuthService } from '../../core/auth/auth.service';
import { Impresora } from './impresora.model';

const mockImpresora: Impresora = {
  id: 1,
  nombre: 'Impresora Test',
  marca: 'HP',
  modelo: 'LaserJet',
  ip: '192.168.1.100',
  piso: '1',
  area: 'Oficina',
  estado: 'Activa',
  modeloTonerNegro: 'TN-2380',
  modeloTonerC: null,
  modeloTonerM: null,
  modeloTonerY: null,
  modeloCartucho: null,
  modeloDrum: 'DR-2365',
  modeloFusor: null,
  driverNombre: null,
  driverVersion: null,
  driverSo: null,
  driverArchivoPath: null,
};

describe('ImpresoraFichaComponent', () => {
  let component: ImpresoraFichaComponent;
  let fixture: ComponentFixture<ImpresoraFichaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImpresoraFichaComponent, HttpClientTestingModule],
      providers: [{ provide: AuthService, useValue: { isAdmin: () => false } }],
    }).compileComponents();

    fixture = TestBed.createComponent(ImpresoraFichaComponent);
    component = fixture.componentInstance;
    component.impresora = mockImpresora;
    fixture.detectChanges();
  });

  it('should default to instalacion tab', () => {
    expect(component.activeTab).toBe('instalacion');
  });

  it('should switch to consumibles tab', () => {
    component.setTab('consumibles');
    expect(component.activeTab).toBe('consumibles');
  });

  it('hasConsumibles returns true when any model is set', () => {
    expect(component.hasConsumibles()).toBeTrue();
  });

  it('hasConsumibles returns false when all models are null', () => {
    component.impresora = { ...mockImpresora,
      modeloTonerNegro: null, modeloTonerC: null, modeloTonerM: null,
      modeloTonerY: null, modeloCartucho: null, modeloDrum: null, modeloFusor: null,
    };
    expect(component.hasConsumibles()).toBeFalse();
  });

  it('should show upload section for admin', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [ImpresoraFichaComponent, HttpClientTestingModule],
      providers: [{ provide: AuthService, useValue: { isAdmin: () => true } }],
    }).compileComponents();

    const adminFixture = TestBed.createComponent(ImpresoraFichaComponent);
    const adminComponent = adminFixture.componentInstance;
    adminComponent.impresora = mockImpresora;
    adminFixture.detectChanges();
    adminComponent.setTab('driver');
    adminFixture.detectChanges();

    expect(adminComponent.isAdmin).toBeTrue();
  });
});
```

- [ ] **Step 5: Commit**

```bash
git add soportedesk-frontend/src/app/features/impresoras/impresora-ficha.component.ts
git add soportedesk-frontend/src/app/features/impresoras/impresora-ficha.component.html
git add soportedesk-frontend/src/app/features/impresoras/impresora-ficha.component.scss
git add soportedesk-frontend/src/app/features/impresoras/impresora-ficha.component.spec.ts
git commit -m "feat(impresoras): ficha muestra modelos de consumibles, oculta nulos"
```

---

## Task 8: Frontend — ImpresoraResumenComponent (nuevo)

**Files:**
- Create: `soportedesk-frontend/src/app/features/impresoras/impresora-resumen.component.ts`
- Create: `soportedesk-frontend/src/app/features/impresoras/impresora-resumen.component.html`
- Create: `soportedesk-frontend/src/app/features/impresoras/impresora-resumen.component.scss`

- [ ] **Step 1: Crear `impresora-resumen.component.ts`**

```typescript
import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Impresora } from './impresora.model';

interface ResumenRow {
  tipoLabel: string;
  modelo: string;
  cantidad: number;
}

const CONSUMIBLE_DEFS: { key: keyof Impresora; label: string }[] = [
  { key: 'modeloTonerNegro', label: 'Tóner Negro' },
  { key: 'modeloTonerC',     label: 'Tóner Cyan' },
  { key: 'modeloTonerM',     label: 'Tóner Magenta' },
  { key: 'modeloTonerY',     label: 'Tóner Amarillo' },
  { key: 'modeloCartucho',   label: 'Cartucho' },
  { key: 'modeloDrum',       label: 'Drum' },
  { key: 'modeloFusor',      label: 'Fusor' },
];

@Component({
  selector: 'app-impresora-resumen',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './impresora-resumen.component.html',
  styleUrl: './impresora-resumen.component.scss',
})
export class ImpresoraResumenComponent implements OnChanges {
  @Input() impresoras: Impresora[] = [];

  selectedPiso = '';
  selectedArea = '';
  collapsed = false;

  rows: ResumenRow[] = [];
  pisos: string[] = [];
  areas: string[] = [];

  ngOnChanges(): void {
    this.pisos = [...new Set(
      this.impresoras.map(i => i.piso).filter((p): p is string => !!p)
    )].sort();
    this.areas = [...new Set(
      this.impresoras.map(i => i.area).filter((a): a is string => !!a)
    )].sort();
    this.calcularResumen();
  }

  onFilterChange(): void {
    this.calcularResumen();
  }

  toggle(): void {
    this.collapsed = !this.collapsed;
  }

  private calcularResumen(): void {
    const filtered = this.impresoras.filter(imp =>
      (!this.selectedPiso || imp.piso === this.selectedPiso) &&
      (!this.selectedArea || imp.area === this.selectedArea)
    );

    const rows: ResumenRow[] = [];
    for (const { key, label } of CONSUMIBLE_DEFS) {
      const counts = new Map<string, number>();
      for (const imp of filtered) {
        const val = imp[key] as string | null | undefined;
        if (val) counts.set(val, (counts.get(val) ?? 0) + 1);
      }
      for (const [modelo, cantidad] of counts) {
        rows.push({ tipoLabel: label, modelo, cantidad });
      }
    }
    this.rows = rows;
  }
}
```

- [ ] **Step 2: Crear `impresora-resumen.component.html`**

```html
<div class="resumen-panel">
  <div class="resumen-header" (click)="toggle()">
    <span class="resumen-title">Resumen de consumibles</span>
    <span class="chevron" [class.collapsed]="collapsed">▾</span>
  </div>

  <div class="resumen-body" [class.hidden]="collapsed">
    <div class="resumen-filters">
      <label>
        Piso
        <select [(ngModel)]="selectedPiso" (ngModelChange)="onFilterChange()">
          <option value="">Todos</option>
          <option *ngFor="let p of pisos" [value]="p">{{ p }}</option>
        </select>
      </label>
      <label>
        Área
        <select [(ngModel)]="selectedArea" (ngModelChange)="onFilterChange()">
          <option value="">Todos</option>
          <option *ngFor="let a of areas" [value]="a">{{ a }}</option>
        </select>
      </label>
    </div>

    <ng-container *ngIf="rows.length > 0; else empty">
      <table class="resumen-table">
        <thead>
          <tr>
            <th>Consumible</th>
            <th>Modelo</th>
            <th class="count">Impresoras</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let row of rows">
            <td>{{ row.tipoLabel }}</td>
            <td class="modelo">{{ row.modelo }}</td>
            <td class="count">{{ row.cantidad }}</td>
          </tr>
        </tbody>
      </table>
    </ng-container>
    <ng-template #empty>
      <p class="empty-msg">Sin consumibles registrados para esta selección.</p>
    </ng-template>
  </div>
</div>
```

- [ ] **Step 3: Crear `impresora-resumen.component.scss`**

```scss
.resumen-panel {
  background: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  margin-top: 24px;
  overflow: hidden;
}

.resumen-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  cursor: pointer;
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
  user-select: none;

  &:hover { background: var(--color-border); }
}

.resumen-title {
  font-weight: 700;
  font-size: 13px;
  color: var(--color-text);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.chevron {
  font-size: 18px;
  color: var(--color-gray);
  transition: transform 0.2s;
  display: inline-block;

  &.collapsed { transform: rotate(-90deg); }
}

.resumen-body {
  padding: 16px 20px;

  &.hidden { display: none; }
}

.resumen-filters {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;

  label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 12px;
    font-weight: 600;
    color: var(--color-gray);

    select {
      padding: 6px 10px;
      border: 1px solid var(--color-border);
      border-radius: 6px;
      font-size: 13px;
      background: var(--color-white);
      color: var(--color-text);
      cursor: pointer;
    }
  }
}

.resumen-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;

  th {
    text-align: left;
    padding: 8px 12px;
    border-bottom: 2px solid var(--color-border);
    color: var(--color-gray);
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;

    &.count { text-align: center; }
  }

  td {
    padding: 10px 12px;
    border-bottom: 1px solid var(--color-border);

    &.count {
      text-align: center;
      font-weight: 700;
      color: var(--color-green-dark);
    }

    &.modelo {
      font-family: monospace;
      font-weight: 600;
      color: var(--color-primary);
    }
  }

  tr:last-child td { border-bottom: none; }
}

.empty-msg {
  color: var(--color-gray);
  font-style: italic;
  font-size: 14px;
}
```

- [ ] **Step 4: Commit**

```bash
git add soportedesk-frontend/src/app/features/impresoras/impresora-resumen.component.ts
git add soportedesk-frontend/src/app/features/impresoras/impresora-resumen.component.html
git add soportedesk-frontend/src/app/features/impresoras/impresora-resumen.component.scss
git commit -m "feat(impresoras): nuevo ImpresoraResumenComponent con filtros piso/area"
```

---

## Task 9: Frontend — integrar resumen en la lista

**Files:**
- Modify: `soportedesk-frontend/src/app/features/impresoras/impresoras-list.component.ts`
- Modify: `soportedesk-frontend/src/app/features/impresoras/impresoras-list.component.html`

- [ ] **Step 1: Agregar import en `impresoras-list.component.ts`**

En el array `imports` del decorador `@Component`, agregar `ImpresoraResumenComponent`:

```typescript
import { ImpresoraResumenComponent } from './impresora-resumen.component';

// En @Component:
imports: [CommonModule, GenericTableComponent, ModalComponent, ImpresoraFichaComponent, ImpresoraFormComponent, ImpresoraResumenComponent],
```

- [ ] **Step 2: Agregar el componente en `impresoras-list.component.html`**

Agregar debajo del bloque de modales, al final del template:

```html
<h2>Impresoras</h2>

<app-generic-table
  [columns]="columns"
  [data]="items"
  [canEdit]="isAdmin"
  (searchChange)="onSearch($event)"
  (add)="onAdd()"
  (view)="onView($event)"
  (edit)="onEdit($event)"
  (delete)="onDelete($event)"
/>

<app-impresora-resumen [impresoras]="items" />

<app-modal title="Ficha técnica" [open]="viewing !== null" (closed)="closeView()">
  <app-impresora-ficha
    *ngIf="viewing"
    [impresora]="viewing"
    (driverUpdated)="onDriverUpdated($event)"
  />
</app-modal>

<app-modal
  [title]="editing ? 'Editar impresora' : 'Agregar impresora'"
  [open]="formOpen"
  (closed)="closeForm()"
>
  <app-impresora-form [impresora]="editing" (saved)="onSaved()" (cancelled)="closeForm()" />
</app-modal>
```

- [ ] **Step 3: Build de verificación**

```bash
cd soportedesk-frontend
node node_modules/@angular/cli/bin/ng.js build --configuration development 2>&1 | tail -20
```

Esperado: `Build at:` sin errores de compilación TypeScript.

- [ ] **Step 4: Commit final**

```bash
git add soportedesk-frontend/src/app/features/impresoras/impresoras-list.component.ts
git add soportedesk-frontend/src/app/features/impresoras/impresoras-list.component.html
git commit -m "feat(impresoras): integrar panel resumen de consumibles en lista"
```

---

## Verificación final

Levantar backend (`mvn spring-boot:run` desde `soportedesk-backend/`) y frontend (`ng serve` desde `soportedesk-frontend/`) y verificar:

1. Editar una impresora → sección "Modelos de consumibles" muestra inputs de texto con placeholder
2. Guardar con modelos (ej: Tóner Negro = TN-2380) → ver ficha → tab Consumibles muestra "TN-2380"
3. Impresoras sin modelo en algún consumible → esa fila no aparece en la ficha
4. Panel "Resumen de consumibles" debajo de la tabla agrupa correctamente
5. Filtrar por Piso → resumen recalcula
