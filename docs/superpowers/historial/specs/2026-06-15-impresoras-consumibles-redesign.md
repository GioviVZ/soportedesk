# Spec: Módulo Impresoras — Rediseño de Consumibles

**Fecha:** 2026-06-15  
**Estado:** Aprobado  
**Contexto:** SoporteDesk INIA — panel de gestión TI para INIA Perú

## Objetivo

El equipo de soporte necesita identificar qué modelo de consumible (tóner, drum, fusor, cartucho) usa cada impresora, para saber qué y cuánto pedir a almacén por piso u oficina. El sistema actual almacenaba porcentajes de nivel (Integer), lo cual no ayuda para compras.

## Cambio de datos

### Backend — `Impresora.java`

Los 7 campos de consumibles cambian de `Integer` a `String` y se renombran para ser explícitos:

| Campo actual (Integer) | Campo nuevo (String)       | Columna DB nueva            |
|------------------------|----------------------------|-----------------------------|
| `tonerNegro`           | `modeloTonerNegro`         | `modelo_toner_negro`        |
| `tonerC`               | `modeloTonerC`             | `modelo_toner_c`            |
| `tonerM`               | `modeloTonerM`             | `modelo_toner_m`            |
| `tonerY`               | `modeloTonerY`             | `modelo_toner_y`            |
| `cartucho`             | `modeloCartucho`           | `modelo_cartucho`           |
| `drum`                 | `modeloDrum`               | `modelo_drum`               |
| `fusor`                | `modeloFusor`              | `modelo_fusor`              |

Todos son `nullable = true` — una impresora B&W no tiene tóner color.

`ImpresoraRequest.java` recibe los mismos cambios de nombre y tipo.

### Migración MySQL (manual, una vez)

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

Hibernate `ddl-auto: update` reconoce las nuevas columnas después del ALTER.

### Frontend — `impresora.model.ts`

```typescript
export interface Impresora {
  // ... campos existentes sin cambios ...
  modeloTonerNegro: string | null;
  modeloTonerC:     string | null;
  modeloTonerM:     string | null;
  modeloTonerY:     string | null;
  modeloCartucho:   string | null;
  modeloDrum:       string | null;
  modeloFusor:      string | null;
  // campos de driver sin cambios
}
```

`ImpresoraRequest` = `Omit<Impresora, 'id' | 'driverNombre' | 'driverVersion' | 'driverSo' | 'driverArchivoPath'>`.

---

## Cambios en componentes existentes

### `impresora-form.component`

La sección "Consumibles (%)" pasa a llamarse "Modelos de consumibles". Los 7 campos cambian de `type="number"` a `type="text"`, sin `min`/`max`, con placeholder descriptivo (ej: `"ej: TN-2380"`). El `FormGroup` usa `string` con valor inicial `null`.

### `impresora-ficha.component` — tab Consumibles

- Label permanece igual (Tóner Negro, Tóner Cyan, etc.)
- Valor muestra el string del modelo (ej: `TN-2380`) en lugar del porcentaje
- Las filas donde el modelo es `null` o vacío **no se renderizan** (`*ngIf`)
- Si todos los modelos son null, se muestra mensaje: "Sin modelos de consumibles registrados."

---

## Nuevo componente: `ImpresoraResumenComponent`

**Ubicación:** `src/app/features/impresoras/impresora-resumen.component.ts`

### Propósito

Dado el listado actual de impresoras, agrupa por tipo de consumible y modelo, mostrando cuántas impresoras usan cada modelo. Permite filtrar por piso y área para calcular cuánto pedir por ubicación.

### Interface de entrada

```typescript
@Input() impresoras: Impresora[] = [];
```

No requiere llamada HTTP adicional. Opera sobre el mismo array que carga `ImpresorasListComponent`.

### Lógica de agrupación

Para cada tipo de consumible (`modeloTonerNegro`, `modeloTonerC`, ...) se filtran las impresoras donde el campo no sea null/vacío, se agrupan por valor del modelo y se cuenta. Resultado:

```typescript
interface ResumenRow {
  tipoLabel: string;   // "Tóner Negro"
  modelo: string;      // "TN-2380"
  cantidad: number;    // 8
}
```

### Filtros

Dos `<select>` derivados de los valores únicos del array `impresoras`:
- **Piso** (campo `piso`) — opciones: "Todos" + valores únicos no vacíos
- **Área** (campo `area`) — opciones: "Todos" + valores únicos no vacíos

Al cambiar un filtro se re-computa la agrupación sobre el subconjunto filtrado.

### Layout visual

```
┌─ Resumen de consumibles ─────────────────────────────┐
│  Piso: [Todos ▼]   Área: [Todos ▼]                   │
│                                                      │
│  Consumible      Modelo        Impresoras            │
│  ─────────────────────────────────────────           │
│  Tóner Negro     TN-2380            8                │
│  Tóner Negro     TN-2375            3                │
│  Drum            DR-2365           11                │
│  Fusor           FK-502H            4                │
└──────────────────────────────────────────────────────┘
```

- Panel con fondo blanco, borde y shadow igual que las KPI cards existentes
- Si no hay ningún modelo registrado en el conjunto filtrado: mensaje "Sin consumibles registrados para esta selección."
- Collapsible: header clickeable con ícono chevron para colapsar/expandir

### Integración en `impresoras-list`

`ImpresoraResumenComponent` se agrega debajo de `<app-generic-table>` en `impresoras-list.component.html`, recibiendo `[impresoras]="items"`. El array `items` ya refleja el search actual, así que el resumen siempre es coherente con lo que se ve en la tabla.

---

## Archivos afectados

### Backend
- `impresoras/Impresora.java` — renombrar campos + tipo
- `impresoras/ImpresoraRequest.java` — renombrar campos + tipo
- `impresoras/ImpresoraService.java` — verificar uso de campos (setter/getter via Lombok, sin cambios directos esperados)

### Frontend
- `impresoras/impresora.model.ts` — renombrar + retype
- `impresoras/impresora-form.component.ts` — FormGroup con nuevos nombres
- `impresoras/impresora-form.component.html` — inputs text, nuevos formControlName
- `impresoras/impresora-ficha.component.html` — nuevos nombres, *ngIf para nulls
- `impresoras/impresoras-list.component.html` — agregar `<app-impresora-resumen>`
- `impresoras/impresoras-list.component.ts` — importar nuevo componente
- `impresoras/impresora-resumen.component.ts` — **nuevo**
- `impresoras/impresora-resumen.component.html` — **nuevo**
- `impresoras/impresora-resumen.component.scss` — **nuevo**

---

## Out of scope

- Stock/cantidad de consumibles en bodega (lo gestiona almacén)
- Alertas automáticas de reposición
- Historial de cambios de consumibles
