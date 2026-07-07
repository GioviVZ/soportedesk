# Diseño: Filtros en cascada para módulo Equipos

**Fecha:** 2026-07-02  
**Estado:** Aprobado  

## Contexto

El módulo de equipos (`/equipos`) muestra inventario GLPI con filtros actuales de búsqueda libre, sede y tipo. El modelo ya expone `OficinaID` (dependencia) y `UnidadID` (subdependencia) en la vista `vw_inv_computers_full`, pero no hay filtros para ellos.

## Objetivo

Agregar filtros en cascada: **sede → dependencia → subdependencia**, más **fabricante** (criterio propio). Agregar `unidadId` a las tarjetas móviles.

## Diseño

### Cascada de filtros

```
Sede (existente)
 └─ Dependencia [NUEVO] — recarga al cambiar sede, se limpia al cambiar sede
      └─ Subdependencia [NUEVO] — recarga al cambiar dependencia, se limpia al cambiar dependencia
Tipo (existente)
Fabricante [NUEVO] — independiente
Búsqueda libre (existente)
```

Cuando el usuario cambia un filtro padre, los hijos se limpian y sus catálogos se recargan filtrados.

### Backend

**`VwInvComputerFullRepository`** — cambios a `findFiltered` y 3 nuevos métodos:

```java
// Extender query existente con 3 params nuevos
List<VwInvComputerFull> findFiltered(String search, String sede, String tipo,
                                     String dependencia, String subdependencia, String fabricante);

// Catálogos en cascada
List<String> findDistinctDependencias(String sede);          // filtrado por sede (nullable)
List<String> findDistinctSubdependencias(String sede, String dependencia); // filtrado por sede+dependencia
List<String> findDistinctFabricantes();                      // independiente
```

**`EquipoService`** — adaptar `findAll()` y agregar 3 métodos catálogo.

**`EquipoController`** — extender `GET /api/equipos` con 3 params nuevos; agregar:
- `GET /api/equipos/dependencias?sede=X`
- `GET /api/equipos/subdependencias?sede=X&dependencia=Y`
- `GET /api/equipos/fabricantes`

### Frontend

**`EquipoService`** — extender `getAll()` y agregar `getDependencias(sede?)`, `getSubdependencias(sede?, dependencia?)`, `getFabricantes()`.

**`EquiposListComponent`** — agregar signals:
- `dependencias`, `subdependencias`, `fabricantes` (catálogos)
- `selectedDependencia`, `selectedSubdependencia`, `selectedFabricante`

Handlers de cascada:
- `onSedeChange` → limpia `selectedDependencia` + `selectedSubdependencia`, recarga `dependencias`
- `onDependenciaChange` → limpia `selectedSubdependencia`, recarga `subdependencias`

**Template** — agregar 3 `<select>` al `.filter-bar`; agregar `unidadId` a las tarjetas móviles.

## Criterios de éxito

1. Seleccionar sede filtra la lista Y actualiza el dropdown de dependencias
2. Seleccionar dependencia filtra la lista Y actualiza el dropdown de subdependencias
3. Seleccionar subdependencia o fabricante filtra la lista
4. "Limpiar filtros" resetea todos los 6 filtros
5. Las tarjetas móviles muestran subdependencia
6. El filtro de búsqueda libre sigue funcionando en paralelo con todos los filtros
