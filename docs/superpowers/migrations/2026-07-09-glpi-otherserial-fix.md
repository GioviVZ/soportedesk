# Corrección GLPI: Número de Inventario duplicado con Número de Serie

**Fecha:** 2026-07-09
**Ejecutado por:** Claude Code (autorizado por gvivanco), directo sobre `glpi` (MariaDB `172.16.25.18:3306`)
**Alcance:** tabla `glpi_computers`, columna `otherserial` (campo nativo de GLPI "Número de inventario", expuesto en SoporteDesk como `Codigo_Interno` / `codigoInterno`)

## Contexto

Al revisar el llenado real de `otherserial` en los 962 equipos activos se encontraron 3 grupos:

| Categoría | Cantidad |
|---|---|
| Código real con formato institucional (`NNNNN-AAAA`) | 147 |
| Serial de fabricante duplicado por error en este campo | 109 |
| Basura de BIOS/agente (`0000000000`, "No Asset Information", "Chassis Asset Tag") | 52 |
| Vacío | 654 |

De los 109 con el serial mal puesto, se separaron en dos grupos según si perder el valor de `otherserial` implicaba pérdida de información:

- **105 casos**: `serial` ya contenía exactamente el mismo valor que `otherserial` → duplicado puro, sin pérdida de información al limpiar `otherserial`.
- **4 casos ambiguos**: `serial` y `otherserial` tenían valores **distintos** → no se tocaron, requieren revisión manual del equipo de TI.

## Acción ejecutada

```sql
UPDATE glpi_computers
SET otherserial = NULL
WHERE id IN (<105 ids, ver backup>)
  AND otherserial = serial;
```

Ejecutado dentro de una transacción, verificando `ROW_COUNT() = 105` antes de hacer `COMMIT` (si no calzaba, se hacía `ROLLBACK` y no se aplicaba nada).

**Backup previo:** [2026-07-09-glpi-otherserial-fix-backup.csv](2026-07-09-glpi-otherserial-fix-backup.csv) — 105 filas con `computer_id, name, serial_kept, otherserial_cleared` antes del cambio, para poder revertir manualmente si hiciera falta.

## Nota importante para TI

Este cambio se hizo con una consulta SQL directa (la BD `glpi` no tiene el API REST habilitado). Esto significa que **no quedó registrado en el historial nativo de GLPI** (`glpi_logs`) — si alguien de TI audita el changelog de estos 105 equipos, no va a ver quién hizo el cambio ni cuándo, salvo que revise este documento.

También es posible que el agente de inventario de GLPI (FusionInventory/GLPI-Agent) vuelva a poblar `otherserial` en el próximo escaneo si su configuración mapea algún dato de BIOS ahí — este arreglo no es necesariamente permanente para esos equipos.

## Casos ambiguos NO corregidos (revisión manual pendiente)

| ComputerID | Nombre | `serial` (GLPI) | `otherserial` (GLPI) |
|---|---|---|---|
| 404 | UCOIM-005 | MJ07X5JC | 3993457 |
| 806 | SDEA-019 | 107500760002645 | Asset-1234567890 |
| 876 | SDB-013 | MXL6211PVC | MXL6211PVC. |
| 879 | SDB-035 | G4N0CX14E823177 | ATN12345678901234567 |

Para el caso 879, `ATN12345678901234567` parece un código de activo válido (no basura), a diferencia de los otros tres. Recomendación: que TI decida caso por caso desde la interfaz de GLPI (para que quede en su historial oficial).

## Observación adicional (fuera de alcance de este fix)

El usuario `usrbd` (usado por SoporteDesk para leer GLPI) tiene `GRANT ALL PRIVILEGES ON *.* WITH GRANT OPTION` — permisos de escritura totales sobre toda la instancia de MariaDB, no solo lectura sobre `glpi`. Vale la pena que TI evalúe restringir esta credencial a solo `SELECT` sobre el esquema `glpi`, ya que el diseño del módulo de equipos en SoporteDesk es explícitamente de solo lectura.
