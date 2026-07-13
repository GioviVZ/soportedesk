# Consultas de Usuarios de Red — Directorio filtrable y ordenable

## Problema

`UsuariosRedConsultasComponent` (`soportedesk-frontend/src/app/features/usuarios-red/usuarios-red-consultas.component.ts`) solo muestra resultados cuando el usuario escribe una búsqueda de 2+ caracteres. No hay forma de listar todos los usuarios de red, ordenarlos, ni filtrarlos por dónde pertenecen. El campo de ubicación mostrado hoy (`office` / `organizationalUnit`) no siempre está bien poblado para cuentas AD antiguas no tocadas por el sistema, lo que dificulta identificar rápido a qué dependencia pertenece cada usuario.

Impresoras (`impresoras-list-view.component.ts/html`) ya resuelve un problema análogo: panel de filtros en cascada (Sede → Dependencia → Subdependencia), tabla de escritorio, tarjetas en mobile con "Ubicación" visible, contador de resultados y botón limpiar filtros. Este diseño lleva ese mismo lenguaje a Usuarios de Red, adaptado a los datos disponibles.

## Alcance

- Solo la pantalla de **Consultas** (`usuarios-red-consultas.component.ts`). No se toca Administración ni Dashboard.
- No se toca `GenericTableComponent` (componente compartido usado por Impresoras y otros módulos) — la tabla de este módulo es una tabla propia porque necesita varias columnas con badges (estado, vencimiento), y `GenericTableComponent` solo admite una columna de contenido custom (`extraCell`).
- Ubicación se filtra por el texto crudo de `office` tal cual está en AD (con fallback "Sin oficina"), sin intentar normalizar contra el catálogo Dependencia/Subdependencia. Variantes de mayúsculas/redacción quedan como opciones separadas por ahora — decisión explícita para no bloquear esto en un trabajo de normalización de datos más grande.
- El buscador inteligente actual (scoring, alias institucionales tipo "UTI", "DDTA", etc.) no se toca.

## Backend

### `UsuarioRedContratoController` (`soportedesk-backend/src/main/java/com/inia/soportedesk/usuariosred/contrato/`)

`GET /api/usuarios-red/contratos/consultas` — el parámetro `termino` pasa de obligatorio a opcional:

```java
@GetMapping("/consultas")
@PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_usuarios-red')")
public List<UsuarioRedConsultaDto> buscarConsultas(@RequestParam(required = false) String termino) {
    return service.searchConsultas(termino);
}
```

### `UsuarioRedContratoService.searchConsultas(String term)`

Si `term` es `null`/vacío (menos de 2 caracteres tras `normalizeSearchTerm`), en vez de devolver `List.of()` como hoy, delega a un nuevo método `listarTodos()`:

```java
private List<UsuarioRedConsultaDto> listarTodos() {
    Map<String, UsuarioRedConsultaDto> resultados = new LinkedHashMap<>();

    adUsuarioCacheRepository.findAll().forEach(user ->
        resultados.putIfAbsent(resultKey(user.getSamAccountName(), "ad-" + user.getSamAccountName()), toConsultaDto(user)));

    repository.findAll().forEach(contrato -> {
        String key = resultKey(contrato.getUsuario(), "contrato-" + contrato.getId());
        resultados.computeIfAbsent(key, k -> toConsultaDto(contrato));
    });

    return resultados.values().stream()
        .map(this::enrichContratosYVencimiento)
        .sorted(Comparator
            .comparing((UsuarioRedConsultaDto dto) -> blankToLast(dto.getDisplayName()))
            .thenComparing(dto -> blankToLast(dto.getUsuario())))
        .toList();
}
```

Reutiliza `toConsultaDto(AdUsuarioCache)`, `toConsultaDto(UsuarioRedContrato)`, `enrichContratosYVencimiento`, `resultKey` y `blankToLast` que ya existen — no hay lógica nueva de scoring ni de alias. `repository.findAll()` reemplaza el `searchAllFields` usado en el modo búsqueda porque acá no hay término que puntuar, solo se quiere la unión completa.

No hay límite de página: el volumen esperado (cuentas AD + contratos) está en el mismo orden de magnitud que `CONSULTA_LIMIT = 1000`, consistente con lo que ya asume el resto del servicio.

### Oficinas para el filtro

No se agrega endpoint nuevo. Las oficinas únicas se derivan en el frontend a partir de la lista completa ya cargada por `listarTodos()`, igual que Impresoras deriva `sedes`/`dependencias`/`marcas` de `items` en el propio componente con un getter (ver sección Frontend). `AdUsuarioCacheRepository.listOffices()` ya existe pero no se usa acá — queda disponible por si en el futuro se necesita el conteo agregado sin cargar todos los registros.

## Frontend

### Modelo (`usuario-red-contrato.model.ts`)

Sin cambios de forma; `UsuarioRedConsultaResultado` ya tiene todos los campos necesarios (`office`, `enabled`, `locked`, `estadoVencimientoUsuarioRed`, `contratos`).

### Servicio (`usuario-red-contrato.service.ts`)

`buscarConsultas` acepta `termino` opcional y omite el query param cuando no viene:

```ts
buscarConsultas(termino?: string): Observable<UsuarioRedConsultaResultado[]> {
  const params = termino ? { termino } : {};
  return this.http.get<UsuarioRedConsultaResultado[]>(`${this.apiUrl}/consultas`, { params });
}
```

### Componente (`usuarios-red-consultas.component.ts`)

**Carga inicial**: `ngOnInit` llama `buscarConsultas()` sin término → `directorio: UsuarioRedConsultaResultado[]`. Este arreglo es la fuente de datos para el modo "directorio" (browse), separado de `resultados` (que sigue siendo la respuesta puntuada de la búsqueda activa, sin tocar).

**Dos modos según si hay término de búsqueda activo (`termino.trim().length >= 2`)**:

- **Modo búsqueda** (como hoy, sin cambios de comportamiento): se listan `resultados` como tarjetas `consulta-card`, ordenados por relevancia.
- **Modo directorio** (nuevo, cuando no hay búsqueda activa): se muestra `directorio` filtrado y ordenado por los controles nuevos, en tabla de escritorio + tarjetas en mobile.

**Filtros** (getters estilo Impresoras, sobre `directorio`):

```ts
filters = { oficina: '', estado: '', vencimiento: '' };
ordenarPor: 'nombre' | 'oficina' | 'vencimiento' = 'nombre';

get oficinas(): string[] {
  return this.unique(this.directorio.map((item) => item.office || 'Sin oficina'));
}

get directorioFiltrado(): UsuarioRedConsultaResultado[] {
  return this.directorio
    .filter((item) => !this.filters.oficina || (item.office || 'Sin oficina') === this.filters.oficina)
    .filter((item) => !this.filters.estado || this.matchesEstado(item, this.filters.estado))
    .filter((item) => !this.filters.vencimiento || item.estadoVencimientoUsuarioRed === this.filters.vencimiento)
    .sort(this.comparadorPara(this.ordenarPor));
}
```

`matchesEstado`: `'HABILITADO' | 'DESHABILITADO' | 'BLOQUEADO' | 'SIN_FICHA_AD'` — mismo criterio que ya usan las badges actuales (`item.enabled`, `item.locked`, `tieneFichaAd(item)`).

`comparadorPara('nombre' | 'oficina' | 'vencimiento')`: comparación string localizada para nombre/oficina (`localeCompare('es')`, blank-last), y por fecha ascendente con nulos al final para vencimiento.

**Template — sección de filtros** (nueva, antes de la tabla, visible solo en modo directorio, mismo lenguaje visual que `printer-filter-panel`/`filter-grid` de Impresoras):

```html
<section class="printer-filter-panel" *ngIf="!buscandoActivo">
  <div class="filter-header">
    <div>
      <span>Filtros</span>
      <strong>{{ directorioFiltrado.length }} de {{ directorio.length }} usuarios</strong>
    </div>
    <div class="filter-actions">
      <button type="button" class="ghost-action" (click)="clearFilters()" [disabled]="!hasActiveFilters">Limpiar</button>
    </div>
  </div>
  <div class="filter-grid">
    <label>Oficina
      <select [(ngModel)]="filters.oficina"><option value="">Todas</option>
        <option *ngFor="let o of oficinas" [value]="o">{{ o }}</option></select>
    </label>
    <label>Estado
      <select [(ngModel)]="filters.estado"><option value="">Todos</option>
        <option value="HABILITADO">Habilitado</option>
        <option value="DESHABILITADO">Deshabilitado</option>
        <option value="BLOQUEADO">Bloqueado</option>
        <option value="SIN_FICHA_AD">Sin ficha AD</option></select>
    </label>
    <label>Vencimiento red
      <select [(ngModel)]="filters.vencimiento"><option value="">Todos</option>
        <option value="VIGENTE">Vigente</option>
        <option value="POR_VENCER">Por vencer</option>
        <option value="VENCIDO">Vencido</option>
        <option value="SIN_FECHA">Sin fecha</option></select>
    </label>
    <label>Ordenar por
      <select [(ngModel)]="ordenarPor">
        <option value="nombre">Nombre (A-Z)</option>
        <option value="oficina">Oficina (A-Z)</option>
        <option value="vencimiento">Vencimiento (más próximo primero)</option>
      </select>
    </label>
  </div>
</section>
```

**Template — tabla de escritorio** (nueva, propia de este componente, no `GenericTableComponent`):

Columnas: Usuario (avatar con iniciales + `displayName` + `usuario` en gris debajo, reutilizando `initials()` ya existente), Oficina (`item.office || 'Sin oficina'`), Estado (badge reutilizando las mismas clases `mini-badge`/`success`/`neutral`/`danger` que ya están en `usuarios-red.shared.scss`), Vencimiento red (`app-vencimiento-badge` ya usado en el detalle), Contratos (chip con `item.contratos.length`, o "—" si 0). Clic en fila → `abrirResultado(item)` (mismo modal de detalle que ya existe, sin cambios).

**Template — tarjetas mobile en modo directorio**: se reutiliza el mismo `consulta-card` que ya renderiza `resultados` en modo búsqueda, pero iterando `directorioFiltrado` — no se duplica markup, se generaliza el `*ngFor` para que tome el arreglo correspondiente al modo activo.

**Estado vacío**: si `directorioFiltrado.length === 0` con filtros activos → "Sin resultados con estos filtros" + botón limpiar. Si `directorio` mismo viene vacío (fallo de carga) → mensaje de error existente (`searchError`).

### Estilos (`usuarios-red.shared.scss`)

Se reutilizan `.mini-badge` y variantes que ya existen. Se agregan (adaptando, no copiando 1:1, los nombres ya usados en `impresoras.shared.scss` para `printer-filter-panel`/`filter-header`/`filter-grid`) las clases de filtros y la tabla nueva (`usuarios-red-table`, siguiendo la misma paleta y bordes que `.consulta-card` para que no se sienta como un componente ajeno).

## Manejo de errores

- Falla la carga inicial del directorio (`listarTodos()`) → mismo patrón que hoy: `searchError = 'No se pudo realizar la búsqueda.'`, tabla/tarjetas vacías, sin romper el buscador (que sigue funcionando de forma independiente).
- Datos con `office` vacío → se agrupan bajo "Sin oficina" tanto en el filtro como en la columna, no se ocultan ni se excluyen.

## Testing

- Backend: `UsuarioRedContratoServiceTest` — nuevo test para `searchConsultas(null)` / `searchConsultas("")` devolviendo la unión de AD cache + contratos huérfanos, ordenada por nombre. `UsuarioRedContratoControllerIT` — nuevo test para `GET /consultas` sin `termino`.
- Frontend: `usuarios-red-consultas.component.spec.ts` — casos para: carga inicial del directorio, filtros de oficina/estado/vencimiento combinados, cada opción de ordenamiento, `clearFilters()`, y que el modo búsqueda existente no cambie de comportamiento.
