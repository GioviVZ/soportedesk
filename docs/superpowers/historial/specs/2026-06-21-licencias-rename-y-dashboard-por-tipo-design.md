# Licencias: rename + desglose por Tipo en el Dashboard — Design

## Contexto

El módulo "Licencias" del sidebar y la card del dashboard llevan el label
"Licencias Office", heredado de cuando solo se manejaban licencias de
ofimática. El módulo ya soporta cualquier tipo de licencia (catálogos
`TipoLicencia`/`TipoBien` agregados recientemente), así que el nombre debe
ser simplemente "Licencias".

Además, la card de Licencias del dashboard solo muestra la cantidad de
órdenes de compra (`counts.licencias`, hoy 71), sin ningún desglose. En la
importación real de datos, esas 71 órdenes de compra agrupan 771 claves de
producto individuales (`cantidad` por OC va de 1 a 167). El catálogo
`TipoLicencia` (Office, Antivirus, Sistema Operativo, etc.) es la dimensión
natural para desglosar ese volumen y darle uso visible al catálogo que se
acaba de agregar.

No existe un campo de fecha de vencimiento en `Licencia`, así que cualquier
comparación "vigentes vs vencidas" queda fuera de alcance — los datos
disponibles solo permiten desglosar por `tipoLicencia`, `tipoBien`, `anio`,
o comparar conteo de filas vs suma de `cantidad`.

## Alcance

**Parte A — Rename (trivial):** cambiar el label "Licencias Office" →
"Licencias" en dos sitios del frontend.

**Parte B — Nueva sección "Licencias por Tipo" en el Dashboard:** un chart
de barras horizontal, debajo del chart existente "Usuarios de Red por
Ubicación", mostrando el total de claves (`SUM(cantidad)`) agrupado por
`TipoLicencia.nombre`, ordenado de mayor a menor volumen. La card KPI
"Licencias" del grid superior no cambia (sigue mostrando el conteo de OCs).

## Decisiones de diseño (ya validadas con el usuario)

1. Dimensión de desglose: **Tipo de Licencia** (no Tipo de Bien, no año).
2. Valor de las barras: **total de claves** (`SUM(cantidad)`), no conteo de
   órdenes de compra — refleja el volumen real, ya que una OC puede agrupar
   de 1 a 167 claves.
3. Ubicación: **chart nuevo, independiente**, debajo del grid de KPI cards y
   junto al chart de "Usuarios de Red por Ubicación" — la card KPI
   "Licencias" existente no se modifica.

## Arquitectura

Se sigue exactamente el patrón ya establecido por
"Usuarios de Red por Ubicación" (`UsuarioRedRepository` →
`DashboardService` → `DashboardController` → `DashboardService` Angular →
componente de chart standalone con `ng2-charts`/`BaseChartDirective`).

### Backend

**`LicenciaRepository.java`** — nuevo método de agregación JPQL:

```java
@Query("SELECT tl.nombre, SUM(l.cantidad) FROM Licencia l " +
       "JOIN l.tipoLicencia tl GROUP BY tl.nombre ORDER BY SUM(l.cantidad) DESC")
List<Object[]> sumCantidadGroupedByTipoLicencia();
```

**Nuevo DTO `LicenciaTipoCount.java`** (mismo paquete `dashboard`, mismo
estilo que `UbicacionUsuariosCount`):

```java
package com.inia.soportedesk.dashboard;

public record LicenciaTipoCount(String nombre, long totalClaves) {
}
```

**`DashboardService.java`** — nuevo método (no requiere pivote: la consulta
ya agrega y ordena en una sola dimensión):

```java
public List<LicenciaTipoCount> licenciasPorTipo() {
    return licenciaRepository.sumCantidadGroupedByTipoLicencia().stream()
            .map(row -> new LicenciaTipoCount((String) row[0], ((Number) row[1]).longValue()))
            .toList();
}
```

**`DashboardController.java`** — nuevo endpoint:

```java
@GetMapping("/licencias-por-tipo")
public List<LicenciaTipoCount> licenciasPorTipo() {
    return service.licenciasPorTipo();
}
```

Ruta completa: `GET /api/dashboard/licencias-por-tipo`. Sin parámetros
(a diferencia de `usuarios-red-por-ubicacion`, que tiene el toggle
sede/dependencia — aquí no hay toggle).

### Frontend

**Nuevo modelo `licencia-tipo-count.model.ts`**:

```typescript
export interface LicenciaTipoCount {
  nombre: string;
  totalClaves: number;
}
```

**`dashboard.service.ts`** — nuevo método:

```typescript
getLicenciasPorTipo(): Observable<LicenciaTipoCount[]> {
  return this.http.get<LicenciaTipoCount[]>(`${this.apiUrl}/licencias-por-tipo`);
}
```

**Nuevo componente standalone `licencias-por-tipo-chart.component.ts`**
(mismo paquete `dashboard`, mismo patrón que
`usuarios-red-por-ubicacion-chart.component.ts` pero sin toggle de nivel
y con un solo dataset en vez de dos):

```typescript
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartConfiguration, ChartData } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { DashboardService } from './dashboard.service';
import { LicenciaTipoCount } from './licencia-tipo-count.model';

@Component({
  selector: 'app-licencias-por-tipo-chart',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './licencias-por-tipo-chart.component.html',
  styleUrl: './licencias-por-tipo-chart.component.scss',
})
export class LicenciasPorTipoChartComponent implements OnInit {
  private dashboardService = inject(DashboardService);

  error = false;

  chartData: ChartData<'bar', number[], string> = {
    labels: [],
    datasets: [{ data: [], label: 'Claves', backgroundColor: '#3b82f6' }],
  };

  chartOptions: ChartConfiguration<'bar'>['options'] = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { x: { beginAtZero: true } },
  };

  ngOnInit(): void {
    this.dashboardService.getLicenciasPorTipo().subscribe({
      next: (rows) => this.applyData(rows),
      error: () => (this.error = true),
    });
  }

  private applyData(rows: LicenciaTipoCount[]): void {
    this.chartData = {
      labels: rows.map((r) => r.nombre),
      datasets: [{ data: rows.map((r) => r.totalClaves), label: 'Claves', backgroundColor: '#3b82f6' }],
    };
  }
}
```

**`licencias-por-tipo-chart.component.html`** (sin toggle, a diferencia del
chart de ubicación):

```html
<div class="chart-card">
  <div class="chart-header">
    <h3>Licencias por Tipo</h3>
  </div>

  <div class="chart-body" *ngIf="!error">
    <canvas baseChart [data]="chartData" [options]="chartOptions" type="bar"></canvas>
  </div>
  <p class="chart-error" *ngIf="error">No se pudo cargar el gráfico</p>
</div>
```

**`licencias-por-tipo-chart.component.scss`** — idéntico a
`usuarios-red-por-ubicacion-chart.component.scss` (mismas variables CSS del
tema, mismo alto de 360px), sin las reglas de `.toggle-group` (no aplica
aquí).

**`dashboard.component.ts`** — registrar el nuevo componente en `imports`.

**`dashboard.component.html`** — agregar `<app-licencias-por-tipo-chart />`
justo después de `<app-usuarios-red-por-ubicacion-chart />`.

### Parte A — Rename

Dos cambios de texto, sin lógica:

- `soportedesk-frontend/src/app/layout/sidebar/sidebar.component.ts:61`:
  `label: 'Licencias Office'` → `label: 'Licencias'`.
- `soportedesk-frontend/src/app/features/dashboard/dashboard.component.ts:58`:
  `label: 'Licencias Office'` → `label: 'Licencias'`.

## Manejo de errores

Igual al chart existente: si el `GET /licencias-por-tipo` falla, el
componente marca `error = true` y el template muestra
"No se pudo cargar el gráfico" en vez de un canvas roto. No se reintenta
automáticamente (mismo comportamiento que el chart de ubicación).

Si no hay ninguna licencia con `tipoLicencia` asignado (catálogo vacío o
sin datos), el backend devuelve una lista vacía `[]` y el chart se renderiza
sin barras (sin error) — comportamiento ya cubierto por el mismo patrón en
`usuariosRedPorUbicacion`.

## Testing

**Backend — `DashboardServiceTest.java`**: nuevo test
`licenciasPorTipo_sumsAndMapsRows`, mockeando
`licenciaRepository.sumCantidadGroupedByTipoLicencia()` con filas
`Object[]{"Office", 450L}`, `Object[]{"Antivirus", 200L}` y verificando que
`service.licenciasPorTipo()` devuelve
`[new LicenciaTipoCount("Office", 450L), new LicenciaTipoCount("Antivirus", 200L)]`
en el mismo orden (la consulta ya ordena, el service no reordena).

**Frontend — `licencias-por-tipo-chart.component.spec.ts`** (nuevo,
calcado de `usuarios-red-por-ubicacion-chart.component.spec.ts` pero sin
los tests de toggle):
- `ngOnInit` pide `/licencias-por-tipo` y puebla `chartData.labels` y
  `chartData.datasets[0].data` con la respuesta mockeada.
- Si el request falla (`flush('error', { status: 500, ... })`),
  `component.error` queda en `true`.

**Frontend — `dashboard.component.spec.ts`**: no requiere cambios de fondo
(ya provee `provideCharts(withDefaultRegisterables())`); solo verificar que
sigue compilando con el nuevo import en `dashboard.component.ts`.

No se agregan tests end-to-end de UI (no hay herramienta de browser
automation disponible en este entorno); la verificación visual final queda
a cargo del usuario.

## Fuera de alcance

- Desglose por `TipoBien` o por `anio` (el usuario eligió `TipoLicencia`
  como única dimensión por ahora).
- Toggle para cambiar de dimensión (se descartó por simplicidad, igual que
  se descartó la opción "barras agrupadas OCs + claves").
- Cualquier noción de vigencia/vencimiento (no existe el campo en la
  entidad `Licencia`).
